"use client";
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, Search, Upload, X } from "lucide-react"
import type { File, Folder } from "@/types"
import Button from "@/components/ui/button/Button"
import { FileTable } from "./file-table"
import { UploadFileModal } from "./upload-file-modal"
import { SortPanel, type SortOptions, type SortField } from "./sort-panel"
import Pagination from "@/components/tables/Pagination" // adjust import path
import { useMoveCopy } from "@/context/move-copy-context";
import { SharedFileTable } from "./shared-file-table";

interface ContentTableProps {
  folders: Folder[]
  files: File[]
  dimensionId: number
  dimensionSlug: string
  currentFolderId: number | null
  isSharedView?: boolean
  sharedFromDimensionId: number | null
  accessLevel?: string
}

export function ContentTableShared({ folders, files, dimensionId, dimensionSlug, currentFolderId, isSharedView = false, sharedFromDimensionId, accessLevel = "view",}: ContentTableProps) {
  const router = useRouter()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isFileSortPanelOpen, setIsFileSortPanelOpen] = useState(false)
  const [fileSearchQuery, setFileSearchQuery] = useState("")
  const [fileSortOptions, setFileSortOptions] = useState<SortOptions>({ field: "name", order: "asc" })
  const { moveItem, setMoveItem } = useMoveCopy()
  const [isMoving, setIsMoving] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Reset page if files change
  useEffect(() => {
    setCurrentPage(1)
  }, [fileSearchQuery, fileSortOptions])

  const filteredFiles = useMemo(() => {
    if (!fileSearchQuery.trim()) return files
    return files.filter(file => file.name.toLowerCase().includes(fileSearchQuery.toLowerCase()))
  }, [files, fileSearchQuery])

  const sortedFiles = useMemo(() => {
    const list = [...filteredFiles]
    switch(fileSortOptions.field) {
      case 'name':
        list.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'type':
        list.sort((a,b) => (a.file_type||'').localeCompare(b.file_type||'')); break;
      case 'size':
        list.sort((a,b) => a.file_size - b.file_size); break;
      case 'date':
        list.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
    }
    if(fileSortOptions.order === 'desc') list.reverse()
    return list
  }, [filteredFiles, fileSortOptions])

  const totalPages = Math.ceil(sortedFiles.length / itemsPerPage)
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedFiles.slice(start, start + itemsPerPage)
  }, [sortedFiles, currentPage])
  
  useEffect(() => {
  // whenever your filtered or sorted list changes…
  const newTotal = Math.ceil(sortedFiles.length / itemsPerPage);
  setCurrentPage(old => Math.min(old, Math.max(newTotal, 1)));
}, [sortedFiles]);

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
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
      <div className="flex flex-col">
        <div className="relative flex gap-4 mb-8 items-center justify-end">

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
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-white dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                  />
            </div>
            {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              className="pl-8"
              value={fileSearchQuery}
              onChange={(e) => setFileSearchQuery(e.target.value)}
            /> */}
            <Button variant="outline" onClick={() => setIsFileSortPanelOpen(true)} className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Sort
          </Button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Files</h2>
          <div className="flex gap-4"> 
            {accessLevel === "full_access" && (
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        )}
          </div>
        </div>
      </div>

      {/* Table */}
      <SharedFileTable files={sortedFiles} isSharedView={isSharedView} currentFolderId={currentFolderId} accessLevel={accessLevel}/>

      {/* Pagination Controls */}
      {totalPages >= 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Modals */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        dimensionId={sharedFromDimensionId}
        currentFolderId={currentFolderId}
        onSuccess={() => router.refresh()}
      />

      <SortPanel
        isOpen={isFileSortPanelOpen}
        onClose={() => setIsFileSortPanelOpen(false)}
        options={fileSortOptions}
        onSort={setFileSortOptions}
        title="Sort Files"
        availableFields={['name','type','size','date']}
      />
    </div>
  )
}
