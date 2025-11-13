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
import { Lock } from "lucide-react"
import { useAlert } from "@/context/AlertContext"

interface LockFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  folderName: string
  onSuccess: () => void
}

export function LockFolderModal({ isOpen, onClose, folderId, folderName, onSuccess }: LockFolderModalProps) {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [isLocking, setIsLocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
   const {showAlert} = useAlert();

  const handleLockFolder = async () => {
    if (!pin.trim() || !confirmPin.trim()) {
      setError("Please enter and confirm a PIN")
      return
    }

    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits")
      return
    }

    if (pin !== confirmPin) {
      setError("PINs do not match")
      return
    }

    setIsLocking(true)
    setError(null)

    try {
      const response = await fetch("/api/folders/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to lock folder")
      }

      showAlert({
        type: "success",
        title: "Folder locked.",
        message: "Folder locked successfully.",
      });
      onSuccess()
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to lock folder")
      showAlert({
        type: "error",
        title: "Failed.",
        message: "Failed to lock folder",
      });
    } finally {
      setIsLocking(false)
    }
  }

  const handleInputChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const digits = value.replace(/\D/g, "").slice(0, 6)
    return digits
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setPin("")
          setConfirmPin("")
          setError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black dark:text-white">
            <Lock className="h-5 w-5" />
            Lock Folder
          </DialogTitle>
          <DialogDescription className="text-black dark:text-white">
            Set a 6-digit PIN to lock "{folderName}". Only users with the correct PIN can unlock it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin text-black dark:text-white">6-Digit PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(handleInputChange(e.target.value))
                setError(null)
              }}
              placeholder="000000"
              maxLength={6}
              className="tracking-widest text-center text-lg text-black dark:text-white"
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground text-black dark:text-white">
              Use only numbers. This PIN will be used to unlock the folder.
            </p>
          </div>

          <div className="space-y-2 text-black dark:text-white">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
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

          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Remember your PIN - there is no recovery if you forget it</li>
              <li>Master admins and overall focal persons can reset the PIN</li>
              <li>The unlock token is valid for 1 hour</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex items-center">
          <Button variant="outline" onClick={onClose} disabled={isLocking} className="text-black dark:text-white">
            Cancel
          </Button>
          <Button2 onClick={handleLockFolder} disabled={isLocking || !pin || !confirmPin}>
            {isLocking ? "Locking..." : "Lock Folder"}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
