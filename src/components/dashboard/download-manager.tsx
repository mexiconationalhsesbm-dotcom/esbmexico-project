"use client"

import { useState } from "react"
import {
  X,
  Download,
  CheckCircle,
  AlertCircle,
  Minimize2,
  Maximize2,
  Trash2,
} from "lucide-react"
import { useDownload } from "@/context/downlod-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

// Helper to render file icons based on extension
const renderFileIcon = (ext: string | undefined) => {
  switch (ext?.toLowerCase()) {
    case "pdf":
      return <Image src="/images/icons/pdf.svg" alt="PDF Icon" className="w-8 h-8" width={8} height={8}/>
    case "docx":
    case "doc":
      return <Image src="/images/icons/doc-icon.svg" alt="DOCX Icon" className="w-8 h-8" width={8} height={8}/>
    case "pptx":
    case "ppt":
      return <Image src="/images/icons/ppt-icon.svg" alt="PPTX Icon" className="w-8 h-8" width={8} height={8}/>
    case "xlsx":
    case "xls":
      return <Image src="/images/icons/excel-icon.svg" alt="XLSX Icon" className="w-8 h-8" width={8} height={8}/>
    case "txt":
      return <Image src="/images/icons/txt-icon.svg" alt="TXT Icon" className="w-8 h-8" width={8} height={8}/>
    case "zip":
      return <Image src="/images/icons/zip-icon.svg" alt="ZIP Icon" className="w-8 h-8" width={8} height={8}/>
    default:
      return <Image src="/images/icons/file.svg" alt="Default File Icon" className="w-8 h-8" width={8} height={8}/>
  }
}

// Helper to render folder icons
const renderFolderIcon = () => {
  return <Image src="/images/icons/folder.svg" alt="Folder Icon" className="w-8 h-8" />
}

export function DownloadManager() {
  const { downloads, removeDownload, clearCompleted } = useDownload()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Don't show if no downloads or closed
  if (downloads.length === 0 || !isVisible) {
    return null
  }

  const completedDownloads = downloads.filter((d) => d.status === "completed")

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-lg border-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-md font-medium flex items-center gap-2 dark:text-white">
              <Download className="h-4 w-4" />
              Downloads ({downloads.length})
            </CardTitle>
            <div className="flex items-center gap-1">
              {completedDownloads.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="h-6 px-2 text-xs dark:text-white"
                  title="Clear completed"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 dark:text-white"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 dark:text-white"
                title="Close"
              >
                <X className="h-3 w-3" />
              </Button> */}
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="pt-0 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {downloads.map((download) => {
                const ext = download.name.split(".").pop()
                const isFolder = download.type === "folder"

                return (
                  <div key={download.id} className="space-y-2 border-b pb-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isFolder ? renderFolderIcon() : renderFileIcon(ext)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate dark:text-white">
                            {download.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-400">
                            {isFolder ? "Folder" : ext?.toUpperCase() || "File"}
                            {download.status === "error" && download.error && (
                              <p className="text-xs text-red-400 truncate">{download.error}</p>
                            )}
                          </div>
                        </div>

                        {download.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {download.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        {(download.status === "downloading" || download.status === "pending") && (
                          <Download className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDownload(download.id)}
                        className="h-6 w-6 p-0 flex-shrink-0 dark:text-white"
                        title="Remove download"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {(download.status === "downloading" || download.status === "pending") && (
                      <div className="space-y-1">
                        <Progress value={download.progress} />
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                          {download.status === "pending"
                            ? "Preparing..."
                            : `${Math.round(download.progress)}%`}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
