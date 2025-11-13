"use client"

import { useEffect, useState, useCallback } from "react"
import Button from "@/components/ui/button/Button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Download, FileText, Folder } from "lucide-react"
import type { ArchivedFolder } from "@/types"
import { createClient } from "@/utils/supabase/client";
import { useAlert } from "@/context/AlertContext"

interface FolderNode {
  id: number
  name: string
  type: "folder" | "file"
  size?: number
  children?: FolderNode[]
}

interface ArchivedFolderWithDimension extends ArchivedFolder {
  dimension_name?: string
}

interface ArchivedPageClientProps {
  admin: string | null
}

export function ArchivedPageClient({ admin }: ArchivedPageClientProps) {
  const [folders, setFolders] = useState<ArchivedFolderWithDimension[]>([])
  const [filteredFolders, setFilteredFolders] = useState<ArchivedFolderWithDimension[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<ArchivedFolderWithDimension | null>(null)
  const [showContentsModal, setShowContentsModal] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const {showAlert} = useAlert();

  const supabase = createClient()

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFolders(folders)
    } else {
      setFilteredFolders(
        folders.filter((folder) => folder.folder_name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }
  }, [searchQuery, folders])

  const fetchArchivedFolders = useCallback(async () => {
  try {
    setLoading(true)
    const response = await fetch("/api/archive/get-archived-folders")
    if (!response.ok) throw new Error("Failed to fetch archived folders")
    const data = await response.json()

    let fetchedFolders: ArchivedFolderWithDimension[] = data.folders || []
    const dimensionIds = Array.from(new Set(fetchedFolders.map(f => f.dimension_id).filter(Boolean)))
    const dimensionMap = await fetchDimensionNames(dimensionIds)

    fetchedFolders = fetchedFolders.map(folder => ({
      ...folder,
      dimension_name: dimensionMap[folder.dimension_id] || "N/A",
    }))

    setFolders(fetchedFolders)
  } catch (error) {
    console.error("Error fetching archived folders:", error)
  } finally {
    setLoading(false)
  }
}, []) // ✅ no dependencies needed

  useEffect(() => {
    fetchArchivedFolders()
  }, [fetchArchivedFolders])


  const handleViewContents = (folder: ArchivedFolderWithDimension) => {
    setSelectedFolder(folder)
    setShowContentsModal(true)
  }

  const fetchDimensionNames = async (ids: number[]) => {
    if (ids.length === 0) return {}

    try {
      const res = await fetch(`/api/dimensions/get-dimensions?ids=${ids.join(",")}`)
      if (!res.ok) throw new Error("Failed to fetch dimension names")

      const data = await res.json()
      // Convert array → map { id: name }
      return Object.fromEntries(data.dimensions.map((d: any) => [d.id, d.name]))
    } catch (error) {
      console.error("Error fetching dimension names:", error)
      return {}
    }
  }

    const handleDownload = async (folder: ArchivedFolderWithDimension) => {
  try {
    setDownloading(folder.id)

    const filePath = folder.storage_url.split("esbmexico-archive/")[1]
    const res = await fetch(`/api/archive/get-archive-download-url?file=${encodeURIComponent(filePath)}`)

    if (!res.ok) throw new Error("Download failed")

    await logArchiveAccessActivity(admin, folder.id, "success", folder.folder_name, `User accessed ${folder.folder_name} from the cloud archive.`)

    const blob = await res.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = `${folder.folder_name}_archive.zip`
    a.click()
    window.URL.revokeObjectURL(downloadUrl)

    showAlert({
        type: "success",
        title: "Access Archived Folder",
        message: `User accessed ${folder.folder_name} from the cloud archive.`
      });
  } catch (err) {
    console.error("Error downloading archive:", err)
    showAlert({
        type: "error",
        title: "Access Archived Folder",
        message: `User failed to access ${folder.folder_name} from the cloud archive.`
      });
    await logArchiveAccessActivity(admin, folder.id, "failed", folder.folder_name, `User failed to access ${folder.folder_name} from the cloud archive.`)
  } finally {
    setDownloading(null)
  }
}

    const logArchiveAccessActivity = async (userId: string | null, folder_id: number | null, status: string, folder_name: string, description: string) => {
      try {
        await supabase.from("system_logs").insert([
          {
            account_id: userId || null,
            action: "ARCHIVE_ACCESS",
            entity_type: "archive",
            entity_name: folder_name,
            entity_id: folder_id,
            status,
            description
          },
        ]);
      } catch (err) {
        console.error("System log insert error:", err);
      }
    };


  const renderFolderTree = (node: FolderNode | null, depth = 0) => {
    if (!node) return null

    return (
      <div key={`${node.type}-${node.id}`} style={{ marginLeft: `${depth * 20}px` }} className="py-1">
        <div className="flex items-center gap-2">
          {node.type === "folder" ? (
            <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm">
            {node.name}
            {node.size && (
              <span className="text-xs text-gray-500 ml-2">({(node.size / 1024 / 1024).toFixed(2)} MB)</span>
            )}
          </span>
        </div>
        {node.children?.map((child) => renderFolderTree(child, depth + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Archived Folders</h1>
        <p className="text-muted-foreground mt-1">Access and manage archived folders</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search archived folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredFolders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {folders.length === 0 ? "No archived folders" : "No folders match your search"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Folder Name</th>
                <th className="text-left py-3 px-4 font-semibold">Dimension</th>
                <th className="text-left py-3 px-4 font-semibold">View Contents</th>
                <th className="text-left py-3 px-4 font-semibold">Archived Date</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFolders.map((folder) => (
                <tr key={folder.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{folder.folder_name}</td>
                  <td className="py-3 px-4">{folder.dimension_name || "N/A"}</td>
                  <td className="py-3 px-4">
                    <Button variant="outline" size="sm" onClick={() => handleViewContents(folder)}>
                      See Files
                    </Button>
                  </td>
                  <td className="py-3 px-4 text-sm">{new Date(folder.archived_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(folder)}
                      disabled={downloading === folder.id}
                    >
                      {downloading === folder.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Access
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showContentsModal} onOpenChange={setShowContentsModal}>
        <DialogContent className="max-w-2xl max-h-96 overflow-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Folder Contents: {selectedFolder?.folder_name}</DialogTitle>
            <DialogDescription>View all files and subfolders that were archived</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg overflow-auto">
            {renderFolderTree(selectedFolder?.original_folder_structure)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
