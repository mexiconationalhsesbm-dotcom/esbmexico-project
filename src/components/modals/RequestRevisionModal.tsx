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
import TextArea from "../form/input/TextArea"
import { useAlert } from "@/context/AlertContext"

interface RequestRevisionModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: "file" | "folder"
  itemId: number
  itemName: string
  dimensionId: number
  onSuccess: () => void
}

export function RequestRevisionModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  dimensionId,
  onSuccess,
}: RequestRevisionModalProps) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
   const {showAlert} = useAlert();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for revision")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/folders/request-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          itemId,
          dimensionId,
          reason: reason.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to request revision")
      }

      showAlert({
        type: "success",
        title: "Request submited.",
        message: "Successfully requested revision.",
      });

      router.refresh()
      onSuccess()
      onClose()
      setReason("")
    } catch (err: any) {
      setError(err.message || "Failed to request revision")
      showAlert({
        type: "error",
        title: "Request failed.",
        message: "Failed to request revision.",
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">Request for Revision</DialogTitle>
          <DialogDescription className="text-black dark:text-white">
            Request additional changes to {itemType}: <strong>{itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && 

            <div className="mt-2 flex items-start space-x-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>

          }

          <div>
            <Label htmlFor="reason" className="text-black dark:text-white">Reason for Revision</Label>
        <TextArea
              id="reason"
              placeholder="Describe what additional changes you need..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={!!error}
              className="text-black dark:text-white"
              hint={
                error
                  ? error
                  : "Your revision request will be sent to the dimension leader for approval."
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="text-black dark:text-white" onClick={onClose}>
            Cancel
          </Button>
          <Button className="text-black dark:text-white" onClick={handleSubmit} disabled={isLoading || !reason.trim()}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
