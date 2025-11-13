    "use client"

    import type React from "react"
    import { useState } from "react"
    import Link from "next/link"
    import { useRouter } from "next/navigation"
    import type { Folder } from "@/types"
    import { Card, CardContent } from "@/components/ui/card"
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
    import { Edit, Trash2, Share, MoreVertical, Download, CopyCheck, Copy } from "lucide-react"
    import { DeleteConfirmationModal } from "./delete-confirmation-modal"
    import { useAuth } from "@/context/auth-context"
    import Image from "next/image"
    import { ShareModal } from "./share-modal"
    import { Button } from "../ui/button"
    import { useDownload } from "@/context/downlod-context"
    import { useMoveCopy } from "@/context/move-copy-context"
import RenameModal from "./rename-modal"

    interface FolderGridProps {
      folders: Folder[]
      dimensionSlug: string
      dimensionId: number | null
      isSharedView?: boolean
      accessLevel: string
    }

    export function SharedFolderGrid({ folders, dimensionSlug, dimensionId, isSharedView = false, accessLevel = "view" }: FolderGridProps) {
      const router = useRouter()
      const {user} = useAuth()
      const [folderToRename, setFolderToRename] = useState<Folder | null>(null)
      const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
      const [nestedCounts, setNestedCounts] = useState<{ folders: number; files: number } | null>(null)
      const [isLoadingCounts, setIsLoadingCounts] = useState(false)
      const [folderToShare, setFolderToShare] = useState<Folder | null>(null)
      const [downloadingFolders, setDownloadingFolders] = useState<Set<number>>(new Set())
      const { addDownload, updateDownload } = useDownload()
      const { moveItem, setMoveItem } = useMoveCopy()
      const [isMoving, setIsMoving] = useState(false)

      const handleDeleteClick = async (folder: Folder, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setIsLoadingCounts(true)
        setFolderToDelete(folder)

        try {
          // Fetch nested counts before showing the confirmation dialog
          const response = await fetch(`/api/folders/nested-counts?folderId=${folder.id}`)

          if (!response.ok) {
            throw new Error("Failed to fetch nested counts")
          }

          const data = await response.json()
          setNestedCounts(data)
        } catch (error) {
          console.error("Error fetching nested counts:", error)
          // Default to 0 if we can't fetch the counts
          setNestedCounts({ folders: 0, files: 0 })
        } finally {
          setIsLoadingCounts(false)
        }
      }

      if (folders.length === 0) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            No folders found.
          </div>
        )
      }

        const handleDownloadFolder = async (folder: Folder, customDimensionId?: number) => {
        const targetDimensionId = customDimensionId ?? dimensionId
        const downloadId = addDownload({
          name: `${folder.name}.zip`,
          type: "folder",
        })

        try {
          updateDownload(downloadId, { status: "downloading", progress: 5 })

          const response = await fetch(`/api/folders/download?folderId=${folder.id}&dimensionId=${targetDimensionId}`)

          if (!response.ok) {
            throw new Error("Failed to download folder")
          }

          updateDownload(downloadId, { progress: 30 })

          // Track download progress if the response supports it
          const contentLength = response.headers.get("content-length")
          const total = contentLength ? Number.parseInt(contentLength, 10) : 0

          let loaded = 0
          const reader = response.body?.getReader()
          const chunks: Uint8Array[] = []

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              chunks.push(value)
              loaded += value.length

              if (total > 0) {
                const progress = Math.min(30 + (loaded / total) * 60, 90)
                updateDownload(downloadId, { progress })
              }
            }
          }

          updateDownload(downloadId, { progress: 95 })

          const blob = new Blob(chunks as BlobPart[], { type: "application/zip" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${folder.name}.zip`
          document.body.appendChild(a)
          a.click()
          URL.revokeObjectURL(url)
          document.body.removeChild(a)

          updateDownload(downloadId, { status: "completed", progress: 100 })
        } catch (error) {
          console.error("Error downloading folder:", error)
          updateDownload(downloadId, {
            status: "error",
            error: error instanceof Error ? error.message : "Download failed",
          })
        }
      }

      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-0 relative">
                
                  {(folder.shared_info?.access_level ?? accessLevel) === "full_access" && (
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="p-4">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()

                              // Use shared dimension ID if it exists, otherwise fall back to current one
                              const sharedDimensionId = folder.shared_info?.shared_from_dimension?.id
                              handleDownloadFolder(folder, sharedDimensionId)
                            }}
                            disabled={downloadingFolders.has(folder.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setFolderToRename(folder) 
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setFolderToShare(folder)
                            }}
                          >
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleCopyFolder(folder)
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Make a copy
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMoveFolderClick(folder)
                            }}
                          >
                            <CopyCheck className="h-4 w-4 mr-2" />
                            Move
                          </DropdownMenuItem> */}
                          
                            <DropdownMenuItem className="text-destructive" onClick={(e) => handleDeleteClick(folder, e)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <Link href={`/dashboard/${dimensionSlug}/${folder.id}`} className="block py-6 px-6 h-full">
                            <div className="flex flex-row gap-4">
                              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-600">
                                <Image
                                  width={50}
                                  height={40}
                                  src="/images/icons/folder.svg"
                                  className="h-[30px] w-[30px]"
                                  alt="folder"
                                  />  
                                  
                              </div>
                    
                              <div className="flex items-center justify-center">
                                <div>
                                <h3 className="text-sm text-start text-gray-800 dark:text-gray-200">
                                  {folder.name}   
                                </h3>
                    
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row items-center justify-between mt-4">
                              {folder.shared_info && (
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="capitalize">
                                    {(folder.shared_info?.access_level ?? accessLevel) === "full_access" ? "Full Access" : "View Only"}
                                  </span>

                                    <>
                                      {" • "}
                                      <span>Shared by {folder.shared_info?.shared_from_dimension?.name}</span>
                                    </>
                                </div>
                              )}

                            </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {folderToRename && (
            <RenameModal
              isOpen={!!folderToRename}
              onClose={() => setFolderToRename(null)}
              itemType="folder"
              itemId={folderToRename.id}
              currentName={folderToRename.name}
              onSuccess={() => {
                router.refresh()
              }}
            />
          )}

          {folderToDelete && (
            <DeleteConfirmationModal
              isOpen={!!folderToDelete}
              onClose={() => {
                setFolderToDelete(null)
                setNestedCounts(null)
              }}
              itemType="folder"
              itemId={folderToDelete.id}
              itemName={folderToDelete.name}
              nestedCounts={nestedCounts || undefined}
              onSuccess={() => {
                router.refresh()
              }}
            />
          )}

          {folderToShare && (
            <ShareModal
              isOpen={!!folderToShare}
              onClose={() => setFolderToShare(null)}
              itemType="folder"
              itemId={folderToShare.id}
              itemName={folderToShare.name}
              currentDimensionId={folderToShare.dimension_id}
              // currentUser={user?.id}
              onSuccess={() => {
                router.refresh()
              }}
            />
          )}
        </>
      )
    }
