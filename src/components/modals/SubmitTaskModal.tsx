"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import Button2 from "@/components/ui/button/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import type { FolderTask } from "@/types"
import { Loader2, Upload, FileType, AlertCircle, Calendar } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

interface SubmitTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: FolderTask
  onSuccess: () => void
  currentUserId: string
}

export function SubmitTaskModal({ isOpen, onClose, task, onSuccess, currentUserId }: SubmitTaskModalProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // If a required_file_type is specified, validate against both extension and MIME.
  if (task.required_file_type) {
    // Normalize allowed types: split by comma, trim, lowercase, remove leading dot
    const allowed = task.required_file_type
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^\./, "")) // remove leading dot if present

    const fileExt = (file.name.split(".").pop() || "").toLowerCase()
    const mime = (file.type || "").toLowerCase()

    const matchesExt = fileExt && allowed.includes(fileExt)
    const matchesMime = mime && allowed.some((a) => a.includes("/") && a === mime)

    if (!matchesExt && !matchesMime) {
      setError(`Invalid file type. Required: ${task.required_file_type}`)
      setSelectedFile(null)
      return
    }
  }

  setSelectedFile(file)
  setError(null)
}

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file to submit")
      return
    }

    if (!currentUserId) {
      setError("User not authenticated")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("taskId", task.id.toString())
      formData.append("file", selectedFile)
      formData.append("userId", currentUserId)

      const response = await fetch("/api/tasks/submit", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit task")
      }

      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to submit task")
    } finally {
      setIsLoading(false)
    }
  }

    const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase()

  if (type.includes("pdf")) return "/images/icons/pdf.svg"
  if (type.includes("word") || type.includes("doc")) return "/images/icons/doc-icon.svg"
  if (type.includes("excel") || type.includes("xls")) return "/images/icons/excel-icon.svg"
  if (type.includes("powerpoint") || type.includes("ppt")) return "/images/icons/ppt-icon.svg"
  if (type.includes("text") || type.includes("txt")) return "/images/icons/txt-icon.svg"

  return "/images/icons/file-icon.svg"
}

  const isOverdue = task.due_date ? new Date(task.due_date) < new Date() : false

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white px-10 py-6">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-wide text-xl">Submit Task: {task.title}</DialogTitle>
          <DialogDescription>{task.description || "Upload your file for this task"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-destructive bg-red-100 border border-red-900 p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isOverdue && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              This task is past its due date. Submissions are disabled.
            </div>
          )}

          {task.required_file_type && (
              <div className="flex flex-row gap-4 items-center">
                <div>
                  <span className="text-md font-medium tracking-wide">Required File Type: </span>
                </div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium shadow-sm">
                                    <Image
                                        src={getFileIcon(task.required_file_type)}
                                        alt={task.required_file_type}
                                        className="object-contain"
                                        width={24}
                                        height={24}
                                    />
                                    <span className="tracking-wide">
                                        {task.required_file_type.toUpperCase()}
                                    </span>
                                    </div>
              </div>
          )}

          {task.due_date && (
            <div className="flex flex-row gap-4 items-center">
              <div>
                <span className="font-medium text-md">Due: </span>
              </div>
                                        <div
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all
                                            ${
                                            task.status === "missing"
                                                ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                                                : task.status === "completed"
                                                ? "bg-green-50 text-green-600 ring-1 ring-green-200"
                                                : task.status === "pending" || task.status === "for_revision"
                                                ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200"
                                                : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                                            }
                                        `}
                                        >
                                        <Calendar className="h-4 w-4 opacity-80" />

                                        <span className="tracking-wide">
                                            {format(new Date(task.due_date), "MMM d, yyyy")}
                                        </span>

                                        {task.status === "missing" && (
                                            <AlertCircle className="h-4 w-4 animate-pulse" />
                                        )}
                                        </div>
                                        <div className="text-sm font-medium">
                                          {format(new Date(task.due_date), "'at' h:mm a")}
                                        </div>
              </div>
            // <div className="text-sm text-muted-foreground">
            //   Due: {format(new Date(task.due_date), "MMMM d, yyyy 'at' h:mm a")}
            // </div>
                )}

          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => !isOverdue && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isOverdue}
                accept={
                  task.required_file_type
                    ? task.required_file_type
                        .split(",")
                        .map((t) => {
                          const trimmed = t.trim()
                          // if user provided a MIME (contains '/'), keep as is; otherwise ensure it starts with a dot
                          return trimmed.includes("/") ? trimmed : trimmed.startsWith(".") ? trimmed : `.${trimmed}`
                        })
                        .join(",")
                    : undefined
                }
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Click to select a file</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button2 onClick={handleSubmit} disabled={isLoading || !selectedFile || isOverdue}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit File"
            )}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
