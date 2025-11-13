"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { File, Folder } from "@/types"
import { FolderGrid } from "./folder-grid"
import { CreateFolderButton } from "./create-folder-button"
import { SortPanel, type SortOptions, type SortField } from "./sort-panel"
import { ArrowUpDown, Search, X } from "lucide-react"
// import { Input } from "../ui/input"
import Button from "../ui/button/Button"
import Input from "../form/input/InputField"
import { useMoveCopy } from "@/context/move-copy-context"

interface ContentExplorerProps {
  folders: Folder[]
  files: File[]
  currentUserId: string
  dimensionId: number
  dimensionSlug: string
  currentFolderId: number | null
  currentlyFolder?: Folder | null
  isSharedView?: boolean
  currentAdminRole: number
  hasAccessToThisDimension?: boolean
}

export function ContentExplorer({ folders, files, currentUserId, dimensionId, dimensionSlug, currentFolderId,  currentlyFolder, isSharedView = false, currentAdminRole, hasAccessToThisDimension = false }: ContentExplorerProps) {
  const router = useRouter()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isFolderSortPanelOpen, setIsFolderSortPanelOpen] = useState(false)

  const [folderSearchQuery, setFolderSearchQuery] = useState("")

  const [folderSortOptions, setFolderSortOptions] = useState<SortOptions>({
    field: "name",
    order: "asc",
  })

  const folderSortFields: SortField[] = ["name", "date"]

  const filteredFolders = useMemo(() => {
    if (!folderSearchQuery.trim()) return folders
    return folders.filter((folder) => folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase()))
  }, [folders, folderSearchQuery])

    const sortedFolders = useMemo(() => {
    const sorted = [...filteredFolders]

    if (folderSortOptions.field === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (folderSortOptions.field === "date") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime()
        const dateB = new Date(b.updated_at).getTime()
        return dateA - dateB
      })
    }

    // Reverse if descending order
    if (folderSortOptions.order === "desc") {
      sorted.reverse()
    }

    return sorted
  }, [filteredFolders, folderSortOptions])

  const { moveItem, setMoveItem } = useMoveCopy()
  const [isMoving, setIsMoving] = useState(false)
  const currentFolder = currentlyFolder

  const currentFolderStatus = currentFolder?.status || "draft"

  const handleMoveFolderHere = async () => {
    if (!moveItem || moveItem.type !== "folder") return

    setIsMoving(true)
    try {
      const response = await fetch("/api/folders/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: moveItem.id,
          targetParentFolderId: currentFolderId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to move folder")
      }

      setMoveItem(null)
      router.refresh()
    } catch (error: any) {
      console.error("Error moving folder:", error)
      alert(`Error moving folder: ${error.message}`)
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="space-y-6">
        {moveItem && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Moving {moveItem.type}: <span className="font-semibold">{moveItem.name}</span>
            </span>
          </div>
          <Button onClick={() => setMoveItem(null)} className="h-6 w-6 p-0 flex items-center justify-center">
            <X className="h-4 w-4 text-gray-700 dark:text-white" />
          </Button>
        </div>
      )}
      
      {/* Folders Section */}
      <div>
        <div className="flex flex-col">
          <div className="relative flex flex-row gap-4 mb-8 items-center justify-end">
            <div className="relative">
                  <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                    <svg
                      className="fill-gray-500 dark:fill-gray-400"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                        fill=""
                      />
                    </svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Search folders..."
                    value={folderSearchQuery}
                    onChange={(e) => setFolderSearchQuery(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-white dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                  />
            </div>
            {/* <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              className="pl-8"
              value={folderSearchQuery}
              onChange={(e) => setFolderSearchQuery(e.target.value)}
            /> */}
            <Button variant="outline" onClick={() => setIsFolderSortPanelOpen(true)} className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Sort
          </Button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-black dark:text-white">Folders</h2>
            {(
              // show for dimension members only if folder is draft or revisions
              (hasAccessToThisDimension && currentAdminRole === 5 && (currentFolderStatus === "draft" || currentFolderStatus === "revisions")) ||
              // show always for other roles (e.g., admins)
              (hasAccessToThisDimension && currentAdminRole !== 5)
            ) && (
              <div className="flex gap-4">
                {moveItem && moveItem.type === "folder" && (
                  <Button onClick={handleMoveFolderHere} disabled={isMoving} size="sm">
                    {isMoving ? "Moving..." : "Move here"}
                  </Button>
                )}
                <CreateFolderButton dimensionId={dimensionId} parentFolderId={currentFolderId} createdBy={currentUserId}/>
              </div>
            )}

          </div>
        </div>
        <FolderGrid folders={sortedFolders} dimensionSlug={dimensionSlug} dimensionId={dimensionId} isSharedView={isSharedView} currentAdminRole={currentAdminRole}/>
      </div>
      <SortPanel
        isOpen={isFolderSortPanelOpen}
        onClose={() => setIsFolderSortPanelOpen(false)}
        options={folderSortOptions}
        onSort={setFolderSortOptions}
        title="Sort Folders"
        availableFields={folderSortFields}
      />
    </div>
  )
}
