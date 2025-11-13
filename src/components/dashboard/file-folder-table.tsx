"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FolderIcon, FileIcon, MoreVertical, Download, Trash2, Edit, Upload } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { File, Folder } from "@/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UploadFileModal } from "./upload-file-modal"

interface FileFolderTableProps {
  folders?: Folder[]
  files?: File[]
  dimensionId: number
  dimensionSlug: string
  currentFolderId: number | null
}

export function FileFolderTable({
  folders = [],
  files = [],
  dimensionId,
  dimensionSlug,
  currentFolderId,
}: FileFolderTableProps) {
  const router = useRouter()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Add console logs to debug
  console.log("FileFolderTable Props:", { dimensionId, dimensionSlug, currentFolderId })
  console.log("Folders:", folders)
  console.log("Files:", files)

  const handleDownloadFile = async (file: File) => {
    try {
      // If we have a public URL, use it directly
      if (file.public_url) {
        const a = document.createElement("a")
        a.href = file.public_url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        return
      }

      // Otherwise try to download via the API
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(file.file_path)}`)

      if (!response.ok) {
        throw new Error("Failed to download file")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Error downloading file. Please try again.")
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Files and Folders</h2>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folders.length === 0 && files.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No files or folders found
                </TableCell>
              </TableRow>
            )}

            {folders?.map((folder) => (
              <TableRow key={`folder-${folder.id}`}>
                <TableCell>
                  <Link
                    href={`/dashboard/${dimensionSlug}/${folder.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <FolderIcon className="h-4 w-4 text-blue-500" />
                    {folder.name}
                  </Link>
                </TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  {folder.updated_at
                    ? formatDistanceToNow(new Date(folder.updated_at), { addSuffix: true })
                    : "Unknown"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {files?.map((file) => (
              <TableRow key={`file-${file.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                    {file.name}
                  </div>
                </TableCell>
                <TableCell>{file.file_type || "Unknown"}</TableCell>
                <TableCell>{file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "-"}</TableCell>
                <TableCell>
                  {file.updated_at ? formatDistanceToNow(new Date(file.updated_at), { addSuffix: true }) : "Unknown"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        dimensionId={dimensionId}
        currentFolderId={currentFolderId}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </>
  )
}
