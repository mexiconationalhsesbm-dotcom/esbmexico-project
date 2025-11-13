"use client"

import { useEffect, useState, useCallback } from "react"
import Button from "@/components/ui/button/Button"
import { Card, CardContent } from "@/components/ui/card"
import Badge  from "@/components/ui/badge/Badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Download, Cloud, FileText, Folder as FolderIcon } from "lucide-react"
import type { Folder } from "@/types"
import { createClient } from "@/utils/supabase/client"
import { useAlert } from "@/context/AlertContext"

interface ArchiverPageClientProps {
  dimension?: string
  admin: string | null
}

interface FolderNode {
  id: number
  name: string
  type: "folder" | "file"
  size?: number
  children?: FolderNode[]
}

interface FolderWithDimension extends Folder {
  dimensions: {
    name: string
  }
}

export function ArchivingPageClient({ dimension, admin }: ArchiverPageClientProps) {
  const [folders, setFolders] = useState<FolderWithDimension[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<FolderWithDimension | null>(null)
  const [folderContents, setFolderContents] = useState<FolderNode | null>(null)
  const [showContentsModal, setShowContentsModal] = useState(false)
  const [localArchiving, setLocalArchiving] = useState<number | null>(null)
  const [cloudArchiving, setCloudArchiving] = useState<number | null>(null)
  const [marking, setMarking] = useState<number | null>(null)
  const {showAlert} = useAlert();

  const supabase = createClient()

  const fetchArchivingFolders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dimension) params.append("dimensionId", dimension)

      const response = await fetch(`/api/archive/get-archiving-folders?${params}`)
      if (!response.ok) throw new Error("Failed to fetch folders")
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error fetching folders:", error)
    } finally {
      setLoading(false)
    }
  }, [dimension])

  useEffect(() => {
    fetchArchivingFolders()
  }, [fetchArchivingFolders])

  const logArchivingActivity = async (userId: string | null, folder_id: number | null, action: string, status: string, folder_name: string, description: string) => {
      try {
        await supabase.from("system_logs").insert([
          {
            account_id: userId || null,
            action: action,
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

  const handleViewContents = async (folder: FolderWithDimension) => {
    try {
      setSelectedFolder(folder)
      const response = await fetch(
        `/api/archive/get-folder-contents?folderId=${folder.id}&dimensionId=${folder.dimension_id}`,
      )
      if (!response.ok) throw new Error("Failed to fetch folder contents")
      const data = await response.json()
      setFolderContents(data.structure)
      setShowContentsModal(true)
    } catch (error) {
      console.error("Error fetching folder contents:", error)
    }
  }

  const handleLocalArchive = async (folder: FolderWithDimension) => {
    try {
      setLocalArchiving(folder.id)
      const response = await fetch("/api/archive/local-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folder.id, dimensionId: folder.dimension_id }),
      })

      if (!response.ok) throw new Error("Failed to create local archive")

      await logArchivingActivity(admin, folder.id, "LOCAL_ARCHIVE", "success", folder.name, `The user has successfully archived the folder '${folder.name}' to local archive.`)

      // Download the ZIP
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${folder.name}_local_archive.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      showAlert({
        type: "success",
        title: "Local Archiving",
        message: `The user has successfully archived the folder '${folder.name}' to local archive`
      });

      // Refresh folder list
      await fetchArchivingFolders()
    } catch (error) {
      console.error("Error creating local archive:", error)
      await logArchivingActivity(admin, folder.id, "LOCAL_ARCHIVE", "success", folder.name, `The user has failed to local archive the folder '${folder.name}'.`)
      showAlert({
        type: "error",
        title: "Local Archiving",
        message: `The user has failed to local archive the folder '${folder.name}'`
      });
    } finally {
      setLocalArchiving(null)
    }
  }

  const handleCloudArchive = async (folder: FolderWithDimension) => {
    try {
      setCloudArchiving(folder.id)
      const response = await fetch("/api/archive/cloud-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folder.id, dimensionId: folder.dimension_id }),
      })

      if (!response.ok) throw new Error("Failed to archive to cloud")

      await logArchivingActivity(admin, folder.id, "CLOUD_ARCHIVE", "success", folder.name, `The user has successfully archived the folder '${folder.name}' to the cloud archive.`)
      
      showAlert({
        type: "success",
        title: "Local Archiving",
        message: `The user has successfully archived the folder '${folder.name}' to cloud archive`
      });
      // Refresh folder list
      await fetchArchivingFolders()
    } catch (error) {
      console.error("Error archiving to cloud:", error)
      showAlert({
        type: "error",
        title: "Local Archiving",
        message: `The user has failed to archive the folder '${folder.name}' to the cloud archive.`
      });
      await logArchivingActivity(admin, folder.id, "CLOUD_ARCHIVE", "success", folder.name, `The user has failed to archive the folder '${folder.name}' to the cloud archive.`)
    } finally {
      setCloudArchiving(null)
    }
  }

  const handleMarkArchived = async (folder: FolderWithDimension) => {
    if (!confirm("Mark this folder as archived? Files will be deleted from the system.")) {
      return
    }

    try {
      setMarking(folder.id)
      const response = await fetch("/api/archive/mark-archived", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folder.id, dimensionId: folder.dimension_id }),
      })

      if (!response.ok) throw new Error("Failed to mark as archived")

        showAlert({
        type: "success",
        title: "Mark as Archived",
        message: `The user has marked the folder '${folder.name}' as Archived.`
      });

      await logArchivingActivity(admin, folder.id, "ARCHIVING_COMPLETED", "success", folder.name, `The user has marked the folder '${folder.name}' as Archived.`)

      await fetchArchivingFolders()
    } catch (error) {
      console.error("Error marking as archived:", error)
      showAlert({
        type: "error",
        title: "Mark as Archived",
        message: `The user has failed to mark as archived the folder '${folder.name}'.`
      });
    } finally {
      setMarking(null)
    }
  }

  const getStatusBadge = (folder: FolderWithDimension) => {
    const localArchived = folder.local_archive
    const cloudArchived = folder.cloud_archive

    if (!localArchived && !cloudArchived) {
      return <Badge>Not Archived</Badge>
    }
    if (localArchived && !cloudArchived) {
      return <Badge>Cloud Archive Needed</Badge>
    }
    if (!localArchived && cloudArchived) {
      return <Badge>Local Archive Needed</Badge>
    }
    return <Badge>Fully Archived</Badge>
  }

  const renderFolderTree = (node: FolderNode | null, depth = 0) => {
    if (!node) return null

    return (
      <div key={`${node.type}-${node.id}`} style={{ marginLeft: `${depth * 20}px` }} className="py-1">
        <div className="flex items-center gap-2">
          {node.type === "folder" ? (
            <FolderIcon className="h-4 w-4 text-blue-500" />
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
        <h1 className="text-3xl font-bold">Archiving Management</h1>
        <p className="text-muted-foreground mt-1">Manage folders marked for archiving</p>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No folders marked for archiving</p>
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
                <th className="text-left py-3 px-4 font-semibold">Local Archive</th>
                <th className="text-left py-3 px-4 font-semibold">Cloud Archive</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <tr key={folder.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{folder.name}</td>
                  <td className="py-3 px-4">{folder.dimensions?.name || "N/A"}</td>
                  <td className="py-3 px-4">
                    <Button variant="outline" size="sm" onClick={() => handleViewContents(folder)}>
                      See Files
                    </Button>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      
                      size="sm"
                      onClick={() => handleLocalArchive(folder)}
                      disabled={localArchiving === folder.id || folder.local_archive}
                    >
                      {localArchiving === folder.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {folder.local_archive ? "Downloaded" : "Download"}
                    </Button>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      
                      size="sm"
                      onClick={() => handleCloudArchive(folder)}
                      disabled={cloudArchiving === folder.id || folder.cloud_archive}
                    >
                      {cloudArchiving === folder.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Cloud className="h-4 w-4 mr-2" />
                      )}
                      {folder.cloud_archive ? "Uploaded" : "Upload"}
                    </Button>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(folder)}</td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      onClick={() => handleMarkArchived(folder)}
                      disabled={
                        marking === folder.id || 
                        (!folder.local_archive || !folder.cloud_archive) // ✅ Disable if not archived locally or on cloud
                      }
                    >
                      {marking === folder.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Mark Archived
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
            <DialogTitle>Folder Contents: {selectedFolder?.name}</DialogTitle>
            <DialogDescription>View all files and subfolders</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg overflow-auto">{renderFolderTree(folderContents)}</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
