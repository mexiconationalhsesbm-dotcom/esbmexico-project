"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Download, Trash2, Edit, Share, Copy, CopyCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { File } from "@/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table/index";
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { useAuth } from "@/context/auth-context"
import { ShareModal } from "./share-modal"
import { useDownload } from "@/context/downlod-context"
import { useMoveCopy } from "@/context/move-copy-context"
import Badge from "../ui/badge/Badge"
import RenameModal from "./rename-modal"
import Image from "next/image"

interface FileTableProps {
  files: File[]
  currentFolderId: number | null
  isSharedView?: boolean
  accessLevel: string
}

export function SharedFileTable({ files, currentFolderId, isSharedView = false, accessLevel = "view", }: FileTableProps) {
  const {user} = useAuth()
  const router = useRouter()
  const [fileToShare, setFileToShare] = useState<File | null>(null)
  const [fileToRename, setFileToRename] = useState<File | null>(null)
  const [fileToDelete, setFileToDelete] = useState<File | null>(null)
  const { addDownload, updateDownload } = useDownload()
  const { moveItem, setMoveItem } = useMoveCopy()
  const [isMoving, setIsMoving] = useState(false)

  const renderFileIcon = (ext: string | undefined) => {
  switch (ext?.toLowerCase()) {
    case "pdf":
      return <Image src="/images/icons/pdf.svg" alt="PDF Icon" className="w-10 h-10" width={10} height={10} />;
    case "docx":
      return <Image src="/images/icons/doc-icon.svg" alt="DOCX Icon" className="w-7 h-7" width={10} height={10}/>;
    case "pptx":
      return <Image src="/images/icons/ppt-icon.svg" alt="PPTX Icon" className="w-10 h-10" width={10} height={10}/>;
    case "xlsx":
      return <Image src="/images/icons/excel-icon.svg" alt="XLSX Icon" className="w-10 h-10" width={10} height={10}/>;
    case "txt":
      return <Image src="/images/icons/txt-icon.svg" alt="TXT Icon" className="w-10 h-10" width={10} height={10}/>;
    default:
      return <Image src="/images/icons/txt-icon.svg" alt="Default Icon" className="w-10 h-10" width={10} height={10}/>;
  }
};

  const handleMoveFile = (file: File) => {
    setMoveItem({
      type: "file",
      id: file.id,
      name: file.name,
      currentFolderId: file.folder_id || null,
    })
  }

  const handleCopyFile = async (file: File) => {
    try {
      const response = await fetch("/api/files/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: file.id,
          targetFolderId: currentFolderId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to copy file")
      }

      router.refresh()
    } catch (error: any) {
      console.error("Error copying file:", error)
      alert(`Error copying file: ${error.message}`)
    }
  }

  const handleMoveFileHere = async () => {
    if (!moveItem || moveItem.type !== "file") return

    setIsMoving(true)
    try {
      const response = await fetch("/api/files/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: moveItem.id,
          targetFolderId: currentFolderId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to move file")
      }

      setMoveItem(null)
      router.refresh()
    } catch (error: any) {
      console.error("Error moving file:", error)
      alert(`Error moving file: ${error.message}`)
    } finally {
      setIsMoving(false)
    }
  }

  const handleDownloadFile = async (file: File) => {
    const downloadId = addDownload({
      name: file.name,
      type: "file",
    })

    try {
      updateDownload(downloadId, { status: "downloading", progress: 10 })

      // // If we have a public URL, use it directly
      // if (file.public_url) {
      //   updateDownload(downloadId, { progress: 50 })
      //   const a = document.createElement("a")
      //   a.href = file.public_url
      //   a.download = file.name
      //   document.body.appendChild(a)
      //   a.click()
      //   document.body.removeChild(a)
      //   updateDownload(downloadId, { status: "completed", progress: 100 })
      //   return
      // }

      // Otherwise try to download via the API
      updateDownload(downloadId, { progress: 30 })
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(file.file_path)}`)

      if (!response.ok) {
        throw new Error("Failed to download file")
      }

      updateDownload(downloadId, { progress: 70 })
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      updateDownload(downloadId, { status: "completed", progress: 100 })
    } catch (error) {
      console.error("Error downloading file:", error)
      updateDownload(downloadId, {
        status: "error",
        error: error instanceof Error ? error.message : "Download failed",
      })
    }
  }


  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        There are currently no FILES.
        {/* No files found. {isUploader && "Upload a file to get started."} */}
      </div>
    )
  }

  return (
    <>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px]">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Document
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Dimension
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Access Level
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Shared Date
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
  
                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center">
                            {renderFileIcon(file?.name.split(".").pop())}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {file.name}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {file.folder?.name || "-"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {file.shared_info?.shared_from_dimension?.name || "—"}              
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          variant={
                            (file.shared_info?.access_level || accessLevel) === "full_access"
                              ? "solid"
                              : "light"
                          }
                        >
                          {(file.shared_info?.access_level || accessLevel) === "full_access"
                            ? "Full Access"
                            : "View Only"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {file.shared_info?.created_at
                        ? formatDistanceToNow(new Date(file.shared_info.created_at), { addSuffix: true })
                        : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <DropdownMenu>
                    
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-4">
                      <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {(file.shared_info?.access_level ?? accessLevel) === "full_access" && (
                        <DropdownMenuItem onClick={() => setFileToRename(file)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        )}
                        {(file.shared_info?.access_level ?? accessLevel) === "full_access" && (
                        <DropdownMenuItem className="text-destructive" onClick={() => setFileToDelete(file)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      
      {fileToRename && (
        <RenameModal
          isOpen={!!fileToRename}
          onClose={() => setFileToRename(null)}
          itemType="file"
          itemId={fileToRename.id}
          currentName={fileToRename.name}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      {fileToDelete && (
        <DeleteConfirmationModal
          isOpen={!!fileToDelete}
          onClose={() => setFileToDelete(null)}
          itemType="file"
          itemId={fileToDelete.id}
          itemName={fileToDelete.name}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      {fileToShare && (
        <ShareModal
          isOpen={!!fileToShare}
          onClose={() => setFileToShare(null)}
          itemType="file"
          itemId={fileToShare.id}
          itemName={fileToShare.name}
          currentDimensionId={fileToShare.dimension_id}
          // currentUser={user?.id}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </>
  )
}
