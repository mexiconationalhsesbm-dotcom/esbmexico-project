"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Checkbox from "../form/input/Checkbox"
import { useAlert } from "@/context/AlertContext"

interface FolderStatusModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  currentStatus: "draft" | "for_checking" | "checked" | "revisions"
  folderName: string
  isDimensionLeader: boolean
  isDimensionMember: boolean
  onSuccess: () => void
}

const statusOptions = [
  { value: "draft", label: "Draft", color: "bg-blue-100" },
  { value: "for_checking", label: "For Checking", color: "bg-yellow-100" },
  { value: "checked", label: "Checked", color: "bg-green-100" },
  { value: "revisions", label: "Revisions", color: "bg-purple-100" },
]

export function FolderStatusModal({
  isOpen,
  onClose,
  folderId,
  currentStatus,
  folderName,
  isDimensionLeader,
  isDimensionMember,
  onSuccess,
}: FolderStatusModalProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [cascadeToChildren, setCascadeToChildren] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
   const {showAlert} = useAlert();

  const handleStatusChange = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/folders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          newStatus: selectedStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update folder status")
      }

      showAlert({
        type: "success",
        title: "Update successful.",
        message: "Folder status updated successfully.",
      });

      router.refresh()
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update folder status")
      showAlert({
        type: "success",
        title: "Update failed.",
        message: "Failed to update folder status.",
      });
    } finally {
      setIsLoading(false)
    }
  }

  // Determine available status options based on role and current status
  const getAvailableStatuses = () => {
    if (!isDimensionMember) {
      // Leaders can move: draft -> for_checking -> checked -> revisions
      if (currentStatus === "draft") return ["draft", "for_checking"]
      if (currentStatus === "for_checking") return ["for_checking", "checked"]
      if (currentStatus === "checked") return ["checked", "revisions"]
      if (currentStatus === "revisions") return ["revisions", "checked"]
    } else if (isDimensionMember) {
      // Members can only move: draft -> for_checking
      if (currentStatus === "draft") return ["draft", "for_checking"]
      if (currentStatus === "revisions") return ["revisions"]
    }
    return [currentStatus]
  }

  const availableStatuses = getAvailableStatuses()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">Change Folder Status</DialogTitle>
          <DialogDescription className="text-black dark:text-white">
            Update the status of folder <strong>{folderName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <Label htmlFor="status" className="text-black dark:text-white">New Status</Label>
            <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as "draft" | "for_checking" | "checked" | "revisions")}
            disabled={availableStatuses.length <= 1}
            >

                <SelectTrigger id="status" className="text-black dark:text-white">
                <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent className="text-black dark:text-white bg-white dark:bg-gray-950">
                {availableStatuses.map((status) => {
                    const option = statusOptions.find((opt) => opt.value === status)
                    return (
                    <SelectItem key={status} value={status}>
                        {option?.label}
                    </SelectItem>
                    )
                })}
                </SelectContent>
            </Select>
            </div>

          <div className="flex items-center justify-center gap-2">

            <Label htmlFor="cascade" className="text-sm font-normal cursor-pointer text-black dark:text-white text-center border border-green-900 bg-green-100 dark:bg-green-900 py-4 px-4 rounded-2xl">
              Status applied to all nested folders and files
            </Label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm">
            <p className="font-medium mb-2 text-black dark:text-white">Status Information:</p>
            <ul className="space-y-1 text-xs text-black dark:text-white">
              <li>
                • <strong>Draft:</strong> Members can upload, delete, rename, and other actions
              </li>
              <li>
                • <strong>For Checking:</strong> Members cannot perform actions (read-only pending review)
              </li>
              <li>
                • <strong>Checked:</strong> Members can only download and request revision
              </li>
              <li>
                • <strong>Revisions:</strong> Members can perform actions again
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStatusChange} disabled={isLoading || availableStatuses.length <= 1}>
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
