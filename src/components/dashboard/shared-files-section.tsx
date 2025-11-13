"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation"
import { FolderIcon, FileIcon, Download, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import  Badge  from "@/components/ui/badge/Badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/libs/supabase"
import type { SharedItem, File, Folder } from "@/types"
import { useAuth } from "@/context/auth-context"
import ComponentCard from "../common/ComponentCard"
import Image from "next/image";

interface SharedFilesSectionProps {
  currentDimensionId: number
  dimensionSlug: string
}

export function SharedFilesSection({ currentDimensionId, dimensionSlug }: SharedFilesSectionProps) {
  const router = useRouter()
  const { assignedDimensionId, canAccessAllDimensions } = useAuth()
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null);

  const renderFileIcon = (ext: string | undefined) => {
  switch (ext?.toLowerCase()) {
    case "pdf":
      return <Image src="/images/icons/pdf.svg" alt="PDF Icon" className="w-10 h-10" />;
    case "docx":
      return <Image src="/images/icons/doc-icon.svg" alt="DOCX Icon" className="w-7 h-7" />;
    case "pptx":
      return <Image src="/images/icons/ppt-icon.svg" alt="PPTX Icon" className="w-10 h-10" />;
    case "xlsx":
      return <Image src="/images/icons/excel-icon.svg" alt="XLSX Icon" className="w-10 h-10" />;
    case "txt":
      return <Image src="/images/icons/txt-icon.svg" alt="TXT Icon" className="w-10 h-10" />;
    default:
      return <Image src="/images/icons/txt-icon.svg" alt="Default Icon" className="w-10 h-10" />;
  }
};

const fetchSharedItems = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    // Fetch shared items for this dimension
    const { data: sharedData, error: sharedError } = await supabase
      .from("shared_items")
      .select(`
        *,
        shared_from_dimension:dimensions!shared_items_shared_from_dimension_id_fkey(id, name, slug)
      `)
      .eq("shared_to_dimension_id", currentDimensionId)
      .order("created_at", { ascending: false });

    if (sharedError) throw sharedError;

    const itemsWithData: SharedItem[] = [];

    for (const item of sharedData || []) {
      let itemData = null;
      let itemName = "";

      if (item.item_type === "file") {
        const { data: fileData } = await supabase.from("files").select("*").eq("id", item.item_id).single();
        itemData = fileData;
        itemName = fileData?.name || "Unknown File";
      } else if (item.item_type === "folder") {
        const { data: folderData } = await supabase.from("folders").select("*").eq("id", item.item_id).single();
        itemData = folderData;
        itemName = folderData?.name || "Unknown Folder";
      }

      itemsWithData.push({
        ...item,
        item_name: itemName,
        item_data: itemData,
        shared_from_dimension: item.shared_from_dimension,
      });
    }

    setSharedItems(itemsWithData);
  } catch (err: any) {
    console.error("Error fetching shared items:", err);
    setError("Failed to load shared files");
  } finally {
    setIsLoading(false);
  }
}, [currentDimensionId]); 

  useEffect(() => {
    fetchSharedItems();
  }, [fetchSharedItems]);

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

  const handleFolderClick = (folder: Folder, sharedFromDimensionSlug: string) => {
    // Navigate to the shared folder in the original dimension
    router.push(`/dashboard/${sharedFromDimensionSlug}/${folder.id}?shared=true`)
  }


  if (isLoading) {
    return (
      <div className="space-y-6 mt-8">
        <ComponentCard title="Shared Files">
          <div className="text-center py-6">Loading shared files...</div>
        </ComponentCard>
      </div>
    )
  }

    if (error) {
    return (
      <div className="space-y-6 mt-8">
        <ComponentCard title="Shared Files">
          <div className="text-center py-6 text-destructive">{error}</div>
        </ComponentCard>
      </div>
    )
  }

    return (
      <div className="space-y-6 mt-8">
        <ComponentCard title="Shared Files">
          {sharedItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No files have been shared with this dimension</div>
        ) : (
          <div>
        <div className="pb-6 flex justify-end">
              <form>
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
                    ref={inputRef}
                    type="text"
                    placeholder="Search Document"
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                  />
                </div>
              </form>
            </div>
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
                      Name
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Shared From
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Access Level
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Shared
                    </TableCell>
                     <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
  
                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {sharedItems.map((item) => (
                    <TableRow key={`${item.item_type}-${item.item_id}-${item.id}`}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center">
                            {item.item_type === "folder" ? (
                              <Image
                                width={30}
                                height={30}
                                src="/images/icons/folder.svg"
                                alt="foldericon"
                              />
                            ) : (
                            <div className="w-10 h-10 flex items-center">
                              {renderFileIcon(item.item_name?.split(".").pop())}
                            </div>
                            )}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {item.item_name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {item.item_type}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {item.shared_from_dimension?.name}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <Badge variant={item.access_level === "full_access" ? "solid" : "light"}>
                          {item.access_level === "full_access" ? "Full Access" : "View Only"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {item.item_type === "file" && item.item_data ? (
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadFile(item.item_data as File)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : item.item_type === "folder" && item.item_data ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleFolderClick(item.item_data as Folder, item.shared_from_dimension?.slug || "")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
        )}
        </ComponentCard>
      </div>
    )
  
}
