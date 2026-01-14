"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Folder } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Share, MoreVertical, Download, CopyCheck, Copy, InfoIcon, CheckCircle, Lock, LockOpen, KeyRound } from "lucide-react"

import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import { ShareModal } from "./share-modal"
import { useDownload } from "@/context/downlod-context"
import { useMoveCopy } from "@/context/move-copy-context"
import { RequestRevisionModal } from "../modals/RequestRevisionModal"
import { FolderStatusModal } from "../modals/FolderStatusModal"
import Badge from "../ui/badge/Badge"
import { ResetPinModal } from "../modals/ResetPinModal"
import { UnlockFolderModal } from "../modals/UnlockFolderModal"
import { LockFolderModal } from "../modals/LockFolderModal"
import { TaskIcon } from "@/icons"
import RenameModal from "./rename-modal"
import { FolderInfoModal } from "../modals/FolderInfoModal"
import { TasksModal } from "../modals/TaskModal"
import { TaskLockedModal } from "../modals/TaskLockedWarningModal"

interface FolderGridProps {
  folders: Folder[]
  dimensionSlug: string
  dimensionId: number
  isSharedView?: boolean
  currentAdminRole: number
  currentUserId: string
}

export function FolderGrid({ folders, dimensionSlug, dimensionId, currentUserId, isSharedView = false, currentAdminRole }: FolderGridProps) {
  const router = useRouter()
  const { isMasterAdmin, isDimensionLeader, isDimensionMember, assignedDimensionId } = useAuth()
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
  const [folderToChangeStatus, setFolderToChangeStatus] = useState<Folder | null>(null)
  const [folderToRequestRevision, setFolderToRequestRevision] = useState<Folder | null>(null)
  const [nestedCounts, setNestedCounts] = useState<{ folders: number; files: number } | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  const [folderToShare, setFolderToShare] = useState<Folder | null>(null)
  const [downloadingFolders, setDownloadingFolders] = useState<Set<number>>(new Set())
  const { addDownload, updateDownload } = useDownload()
  const { moveItem, setMoveItem } = useMoveCopy()
  const [isMoving, setIsMoving] = useState(false)
  const roleDimensionMember = currentAdminRole === 5

  const [folderToLock, setFolderToLock] = useState<Folder | null>(null)
  const [folderToUnlock, setFolderToUnlock] = useState<Folder | null>(null)
  const [folderToResetPin, setFolderToResetPin] = useState<Folder | null>(null)
  const [unlockedFolders, setUnlockedFolders] = useState<Set<number>>(new Set())

  const [folderWithTasksModal, setFolderWithTasksModal] = useState<Folder | null>(null)
  const [incompleteTaskCounts, setIncompleteTaskCounts] = useState<{ [key: number]: number }>({})
  const [isLoadingTaskCounts, setIsLoadingTaskCounts] = useState(false)

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [folderToViewInfo, setFolderToViewInfo] = useState<Folder | null>(null)

  const [taskLockedFolder, setTaskLockedFolder] = useState<Folder | null>(null)
  const [lockedFolders, setLockedFolders] = useState<Set<number>>(new Set())
  const [isLoadingLocks, setIsLoadingLocks] = useState(false)

     useEffect(() => {
    const verifyStoredTokens = async () => {
      for (const folder of folders) {
        const token = localStorage.getItem(`folder-token-${folder.id}`)
        if (!token) continue

        try {
          const res = await fetch("/api/folders/verify-unlock-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId: folder.id, token }),
          })

          const data = await res.json()

          if (res.ok && data.success) {
            setUnlockedFolders((prev) => new Set([...prev, folder.id]))
          } else {
            localStorage.removeItem(`folder-token-${folder.id}`)
          }
        } catch (err) {
          console.error("Error verifying unlock token:", err)
        }
      }
    }

    verifyStoredTokens()
  }, [folders])

  const loadIncompleteTaskCounts = useCallback(async () => {
    setIsLoadingTaskCounts(true)
    try {
      const counts: { [key: number]: number } = {}
      for (const folder of folders) {
        const response = await fetch(`/api/tasks/incomplete-count?folderId=${folder.id}`)
        if (response.ok) {
          const data = await response.json()
          counts[folder.id] = data.incompleteCount || 0
        }
      }
      setIncompleteTaskCounts(counts)
    } catch (error) {
      console.error("Error loading task counts:", error)
    } finally {
      setIsLoadingTaskCounts(false)
    }
  }, [folders])

  useEffect(() => {
    if (folders.length > 0) {
      loadIncompleteTaskCounts()
    }
  }, [folders, loadIncompleteTaskCounts])

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

    const handleDownloadFolder = async (folder: Folder) => {
    const downloadId = addDownload({
      name: `${folder.name}.zip`,
      type: "folder",
    })

    try {
      updateDownload(downloadId, { status: "downloading", progress: 5 })

      const response = await fetch(`/api/folders/download?folderId=${folder.id}&dimensionId=${dimensionId}`)

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

  const handleMoveFolderClick = (folder: Folder) => {
    setMoveItem({
      type: "folder",
      id: folder.id,
      name: folder.name,
      currentFolderId: folder.parent_folder_id || null,
    })
  }

  const handleCopyFolder = async (folder: Folder) => {
    try {
      const response = await fetch("/api/folders/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: folder.id,
          targetParentFolderId: folder.parent_folder_id || null,
          dimensionId: dimensionId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to copy folder")
      }

      router.refresh()
    } catch (error: any) {
      console.error("Error copying folder:", error)
      alert(`Error copying folder: ${error.message}`)
    }
  }

  const handleLockClick = (folder: Folder) => {
    setFolderToLock(folder)
  }

  const handleUnlockClick = (folder: Folder) => {
    setFolderToUnlock(folder)
  }

  const handleFolderClick = (folder: Folder, isTaskLocked: boolean) => {
    if (isTaskLocked) {
      setTaskLockedFolder(folder)
      return
    }
  }

  const handleResetPinClick = (folder: Folder) => {
    setFolderToResetPin(folder)
  }

  const canChangeStatus = (folder: Folder): boolean => {
    if (currentAdminRole !== 5) return true
    if (!assignedDimensionId || assignedDimensionId !== dimensionId) return false
    if (currentAdminRole === 5 && folder.status === "draft") return true
    return false
  }

  const canRequestRevision = (folder: Folder): boolean => {
    return currentAdminRole === 5 && folder.status === "checked"
  }


  return (
    <>
    {folders.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {/* <Image
          src="/images/no-folder.svg"
          alt="No folders"
          width={350}
          height={350}
          className="mb-6"
        /> */}
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Current directory have no folders.
        </p>
        <p className="text-gray-400 dark:text-gray-500">
          Click the "Create Folder" button at the top right to add folder in the current directory.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {folders.map((folder) => {
        const isTaskLocked = (folder as any).task_locked || false
        return (
          <Card key={folder.id} className="relative overflow-visible border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3 rounded-xl 
             transition-all duration-200 ease-out
             hover:shadow-lg hover:border-primary/60 hover:-translate-y-1">
              {incompleteTaskCounts[folder.id] > 0 && (
                <span className="absolute left-4 top-2 z-10 min-w-[1.25rem] h-5 px-3
                                rounded-full bg-orange-400 text-white text-xs
                                flex items-center justify-center font-semibold">
                  
                  <span className="absolute inline-flex w-full h-full rounded-full 
                                  bg-orange-400 opacity-75 animate-ping"></span>

                  <span className="relative tracking-wider">
                    {incompleteTaskCounts[folder.id] > 9 ? "9+ tasks" : `${incompleteTaskCounts[folder.id]} task${incompleteTaskCounts[folder.id] > 1 ? "s" : ""}`}
                  </span>
                </span>
              )}

            <CardContent className="p-0 relative">

              {folder.is_locked && (
                <div className="absolute top-13 left-16 z-5">
                  <div className="bg-red-100 border border-red-300 rounded-full p-1.5 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-red-600" />
                  </div>
                </div>
              )}

              {isTaskLocked && (
                <div className="absolute top-13 left-16 z-5">
                  <div className="bg-red-100 border border-red-300 rounded-full p-1.5 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-red-600" />
                  </div>
                </div>
              )}
             
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu
                    open={openMenuId === folder.id}
                    onOpenChange={(isOpen) => setOpenMenuId(isOpen ? folder.id : null)}
                  >
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button
        className="text-black dark:text-white flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-200 
                   dark:hover:bg-gray-400"
      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="py-4 px-6">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFolderWithTasksModal(folder)
                          setOpenMenuId(null) 
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <TaskIcon className="h-4 w-4 mr-2"/>
                        {incompleteTaskCounts[folder.id] > 0 && (
                          <span className="absolute right-0 top-0 z-10 min-w-[1.25rem] h-5 px-1
                                          rounded-full bg-orange-400 text-white text-xs
                                          flex items-center justify-center font-semibold">
                            
                            <span className="absolute inline-flex w-full h-full rounded-full 
                                            bg-orange-400 opacity-75 animate-ping"></span>

                            <span className="relative">
                              {incompleteTaskCounts[folder.id]}
                            </span>
                          </span>
                        )}

                        <span>Tasks</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(null) 
                          if (folder.is_locked && !unlockedFolders.has(folder.id)) {
                            handleUnlockClick(folder)
                          } else if (!folder.is_locked) {
                            handleLockClick(folder)
                          }
                        }}
                        disabled={folder.is_locked && unlockedFolders.has(folder.id)}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        {folder.is_locked ? (
                          <>
                            <LockOpen className="h-4 w-4 mr-2" />
                            {unlockedFolders.has(folder.id) ? "Already Unlocked" : "Unlock Folder"}
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Lock Folder
                          </>
                        )}
                      </DropdownMenuItem>

                      {(currentAdminRole !== 5 && folder.is_locked) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleResetPinClick(folder)
                            setOpenMenuId(null) 
                          }}
                          className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reset PIN
                        </DropdownMenuItem>
                      )}
                      {canChangeStatus(folder) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setFolderToChangeStatus(folder)
                            setOpenMenuId(null) 
                          }}
                          className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Change Status
                        </DropdownMenuItem>
                      )}
                      {canRequestRevision(folder) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setFolderToRequestRevision(folder)
                            setOpenMenuId(null) 
                          }}
                          className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Request Revision
                        </DropdownMenuItem>
                      )}
                      
                      {((currentAdminRole === 5 && folder.status === "draft") || currentAdminRole !== 5) && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(null) 
                          setFolderToShare(folder)
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share Access
                      </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-2 border-t border-gray-300 dark:border-gray-700" />

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFolderToViewInfo(folder)
                          setOpenMenuId(null)
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <InfoIcon className="h-4 w-4 mr-2" />
                        Folder Information
                      </DropdownMenuItem>


                      <DropdownMenuSeparator className="my-2 border-t border-gray-300 dark:border-gray-700" />

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(null) 
                          handleDownloadFolder(folder)
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                        disabled={downloadingFolders.has(folder.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>

                      {((currentAdminRole === 5 && (folder.status === "draft" || folder.status === "revisions")) || currentAdminRole !== 5) && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFolderToRename(folder) 
                          setOpenMenuId(null) 
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      )}

                      {((currentAdminRole === 5 && folder.status === "draft") || currentAdminRole !== 5) && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCopyFolder(folder)
                          setOpenMenuId(null) 
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Make a copy
                      </DropdownMenuItem>
                      )}

                      {((currentAdminRole === 5 && (folder.status === "draft" || folder.status === "revisions")) || currentAdminRole !== 5) && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(null) 
                          handleMoveFolderClick(folder)
                        }}
                        className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <CopyCheck className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                      )}
                      
                      {((currentAdminRole === 5 && folder.status === "draft") || currentAdminRole !== 5) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(null)
                          handleDeleteClick(folder, e)
                        }}
                          className="relative transition-colors duration-150 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer" >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                      
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              <Link
                href={
                  (folder.is_locked && !unlockedFolders.has(folder.id)) || (isTaskLocked)
                    ? "#"
                    : `/dashboard/${dimensionSlug}/${folder.id}`
                }
                onClick={(e) => {
                  if (folder.is_locked && !unlockedFolders.has(folder.id)) {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnlockClick(folder)
                  }else if(isTaskLocked){
                    e.preventDefault()
                    e.stopPropagation()
                    handleFolderClick(folder, isTaskLocked)
                  }
                }}
                
                className="block py-6 px-6 h-full rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
              >
                        <div className="flex flex-row gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl 
           bg-gray-100 dark:bg-gray-600 
           transition-transform duration-200 group-hover:scale-105">
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

                        <div className="flex justify-end">
                          <Badge
                          className={
                            folder.status === "draft"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white"
                              : folder.status === "for_checking"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-white"
                                : folder.status === "checked"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-white"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-white" 
                          }
                        >
                          {folder.status === "for_checking"
                            ? "For Checking"
                            : folder.status.charAt(0).toUpperCase() + folder.status.slice(1)}
                        </Badge>
                        </div>
                        
              </Link>
            </CardContent>
          </Card>
        )})}
      </div>
      )}

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

            {folderToChangeStatus && (
        <FolderStatusModal
          isOpen={!!folderToChangeStatus}
          onClose={() => setFolderToChangeStatus(null)}
          folderId={folderToChangeStatus.id}
          currentStatus={folderToChangeStatus.status}
          folderName={folderToChangeStatus.name}
          isDimensionLeader={isDimensionLeader}
          isDimensionMember={roleDimensionMember}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      {folderToRequestRevision && (
        <RequestRevisionModal
          isOpen={!!folderToRequestRevision}
          onClose={() => setFolderToRequestRevision(null)}
          itemType="folder"
          itemId={folderToRequestRevision.id}
          itemName={folderToRequestRevision.name}
          dimensionId={dimensionId || 0}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      {folderToLock && (
        <LockFolderModal
          isOpen={!!folderToLock}
          onClose={() => setFolderToLock(null)}
          folderId={folderToLock.id}
          folderName={folderToLock.name}
          onSuccess={() => {
            setFolderToLock(null)
          }}
        />
      )}

      {folderToUnlock && (
        <UnlockFolderModal
          isOpen={!!folderToUnlock}
          onClose={() => setFolderToUnlock(null)}
          folderId={folderToUnlock.id}
          folderName={folderToUnlock.name}
          onSuccess={(token) => {
            // ✅ Save unlock token locally
            localStorage.setItem(`folder-token-${folderToUnlock.id}`, token)

            // ✅ Remember unlocked folder in current session
            setUnlockedFolders((prev) => new Set([...prev, folderToUnlock.id]))

            setFolderToUnlock(null)
          }}
        />
      )}


      {folderToResetPin && (
        <ResetPinModal
          isOpen={!!folderToResetPin}
          onClose={() => setFolderToResetPin(null)}
          folderId={folderToResetPin.id}
          folderName={folderToResetPin.name}
          onSuccess={() => {
            setFolderToResetPin(null)
          }}
        />
      )}

      {folderWithTasksModal && (
        <TasksModal
          isOpen={!!folderWithTasksModal}
          currentUser={currentUserId}
          onClose={() => setFolderWithTasksModal(null)}
          folderId={folderWithTasksModal.id}
          dimensionId={dimensionId || 0}
          folderName={folderWithTasksModal.name}
          isDimensionMember={roleDimensionMember}
        />
      )}

      {folderToViewInfo && (
        <FolderInfoModal
          isOpen={!!folderToViewInfo}
          onClose={() => setFolderToViewInfo(null)}
          folder={folderToViewInfo}
        />
      )}

      {taskLockedFolder && (
        <TaskLockedModal
          isOpen={!!taskLockedFolder}
          onClose={() => setTaskLockedFolder(null)}
          folderName={taskLockedFolder.name}
        />
      )}

    </>
  )
}
