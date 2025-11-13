"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface DownloadItem {
  id: string
  name: string
  type: "file" | "folder"
  progress: number
  status: "pending" | "downloading" | "completed" | "error"
  error?: string
}

interface DownloadContextType {
  downloads: DownloadItem[]
  addDownload: (item: Omit<DownloadItem, "id" | "progress" | "status">) => string
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void
  removeDownload: (id: string) => void
  clearCompleted: () => void
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined)

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])

  const addDownload = (item: Omit<DownloadItem, "id" | "progress" | "status">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newDownload: DownloadItem = {
      ...item,
      id,
      progress: 0,
      status: "pending",
    }
    setDownloads((prev) => [...prev, newDownload])
    return id
  }

  const updateDownload = (id: string, updates: Partial<DownloadItem>) => {
    setDownloads((prev) => prev.map((download) => (download.id === id ? { ...download, ...updates } : download)))
  }

  const removeDownload = (id: string) => {
    setDownloads((prev) => prev.filter((download) => download.id !== id))
  }

  const clearCompleted = () => {
    setDownloads((prev) => prev.filter((download) => download.status !== "completed" && download.status !== "error"))
  }

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        addDownload,
        updateDownload,
        removeDownload,
        clearCompleted,
      }}
    >
      {children}
    </DownloadContext.Provider>
  )
}

export function useDownload() {
  const context = useContext(DownloadContext)
  if (context === undefined) {
    throw new Error("useDownload must be used within a DownloadProvider")
  }
  return context
}
