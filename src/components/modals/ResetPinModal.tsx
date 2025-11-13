"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Button2 from "@/components/ui/button/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import TextArea from "../form/input/TextArea"
import { useAlert } from "@/context/AlertContext"

interface ResetPinModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  folderName: string
  onSuccess: () => void
}

export function ResetPinModal({ isOpen, onClose, folderId, folderName, onSuccess }: ResetPinModalProps) {
  const router = useRouter()
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [reason, setReason] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
   const {showAlert} = useAlert();

  const handleResetPin = async () => {
    if (!newPin.trim() || !confirmPin.trim()) {
      setError("Please enter and confirm a new PIN")
      return
    }

    if (!/^\d{6}$/.test(newPin)) {
      setError("PIN must be exactly 6 digits")
      return
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match")
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      const response = await fetch("/api/folders/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, newPin, reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset PIN")
      }

      showAlert({
        type: "success",
        title: "PIN Reset.",
        message: "Folder PIN reset successful.",
      });

      onSuccess()
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to reset PIN")
      showAlert({
        type: "error",
        title: "PIN Reset.",
        message: "Failed to reset PIN.",
      });
    } finally {
      setIsResetting(false)
    }
  }

  const handleInputChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6)
    return digits
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setNewPin("")
          setConfirmPin("")
          setReason("")
          setError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5 text-black dark:text-white" />
            Reset Folder PIN
          </DialogTitle>
          <DialogDescription className="text-black dark:text-white">
            You are about to reset the PIN for "{folderName}". This action will clear all active unlock tokens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Warning:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>All users with active unlock tokens will be locked out</li>
              <li>Users will need to enter the new PIN to regain access</li>
              <li>This action is logged for audit purposes</li>
            </ul>
          </div>

          <div className="space-y-2 text-black dark:text-white">
            <Label htmlFor="new-pin text-black dark:text-white">New 6-Digit PIN</Label>
            <Input
              id="new-pin"
              type="password"
              value={newPin}
              onChange={(e) => {
                setNewPin(handleInputChange(e.target.value))
                setError(null)
              }}
              placeholder="000000"
              maxLength={6}
              className="tracking-widest text-center text-lg text-black dark:text-white"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2 text-black dark:text-white">
            <Label htmlFor="confirm-pin">Confirm PIN</Label>
            <Input
              id="confirm-pin"
              type="password"
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(handleInputChange(e.target.value))
                setError(null)
              }}
              placeholder="000000"
              maxLength={6}
              className="tracking-widest text-center text-lg text-black dark:text-white"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2 text-black dark:text-white">
            <Label htmlFor="reason">Reason for Reset</Label>
            <TextArea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., User forgot PIN, security breach, etc."
              className="text-sm resize-none text-black dark:text-white"
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
        </div>

        <DialogFooter className="flex items-center">
          <Button variant="outline" onClick={onClose} disabled={isResetting} className="text-black dark:text-white">
            Cancel
          </Button>
          <Button2 onClick={handleResetPin} disabled={isResetting || !newPin || !confirmPin}>
            {isResetting ? "Resetting..." : "Reset PIN"}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
