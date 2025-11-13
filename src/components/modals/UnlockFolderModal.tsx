"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Button2 from "@/components/ui/button/Button"
import { Label } from "@/components/ui/label"
import { LockOpen } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAlert } from "@/context/AlertContext"

interface UnlockFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  folderName: string
  onSuccess: (token: string) => void
  onForgotPin?: () => void
}

export function UnlockFolderModal({
  isOpen,
  onClose,
  folderId,
  folderName,
  onSuccess,
  onForgotPin,
}: UnlockFolderModalProps) {
  const router = useRouter()
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(""))
  const [isUnlocking, setIsUnlocking] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [attempts, setAttempts] = React.useState(0)
  const [shake, setShake] = React.useState(false)
  const maxAttempts = 5
  const isLockedOut = attempts >= maxAttempts
   const {showAlert} = useAlert();

  React.useEffect(() => {
    if (!isOpen) {
      setDigits(Array(6).fill(""))
      setError(null)
      setAttempts(0)
    }
  }, [isOpen])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const pinValue = digits.join("")

  const handleUnlock = async () => {
    if (pinValue.length !== 6) {
      setError("PIN must be exactly 6 digits")
      triggerShake()
      return
    }

    setIsUnlocking(true)
    setError(null)

    try {
      // Helpful debug - remove in production
      // console.log("Unlock attempt PIN:", pinValue)

      const response = await fetch("/api/folders/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, pin: pinValue }),
      })

      const data = await response.json()
      // console.log("Unlock response:", response.status, data)

      if (!response.ok) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        triggerShake()
        if (newAttempts >= maxAttempts) {
          setError("Too many failed attempts. Please try again later.")
        } else {
          setError(`${data.error || "Invalid PIN"}. Attempts remaining: ${maxAttempts - newAttempts}`)
        }
        return
      }

      onSuccess(data.token)
      showAlert({
        type: "success",
        title: "Folder unlocked.",
        message: "Folder unlocked successfully.",
      });
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to unlock folder")
      triggerShake()
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleChange = (value: string, index: number) => {
    // allow only single digit
    const digit = value.replace(/\D/g, "").slice(-1)
    if (!digit && value !== "") return // ignore non-digits
    setDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })

    if (digit) {
      // move to next input
      const nextEl = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null
      if (nextEl) nextEl.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (digits[index] === "") {
        const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null
        if (prev) {
          prev.focus()
          setDigits((prevArr) => {
            const copy = [...prevArr]
            copy[index - 1] = ""
            return copy
          })
        }
      } else {
        // clear current
        setDigits((prevArr) => {
          const copy = [...prevArr]
          copy[index] = ""
          return copy
        })
      }
    }

    // allow arrow navigation
    if (e.key === "ArrowLeft" && index > 0) {
      (document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null)?.focus()
    }
    if (e.key === "ArrowRight" && index < 5) {
      (document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null)?.focus()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDigits(Array(6).fill(""))
          setError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/80 dark:bg-gray-900/70 border border-gray-200/30 dark:border-gray-800/30 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <LockOpen className="h-5 w-5" />
            <DialogTitle>Unlock Folder</DialogTitle>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Enter the 6-digit PIN to unlock <strong>“{folderName}”</strong>.
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Label className="text-black dark:text-white">6-Digit PIN</Label>

          <motion.div
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.45 }}
            className="flex justify-center gap-3"
          >
            {digits.map((d, i) => (
              <div key={i} className="relative">
                <input
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  disabled={isLockedOut}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-14 rounded-xl border border-gray-300/60 dark:border-gray-700/50
                            bg-white/80 dark:bg-gray-800/70 text-xl font-semibold text-center
                            focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm
                            text-transparent caret-transparent selection:bg-transparent relative"
                  style={{ caretColor: "transparent" }}
                />

                {/* dot overlay — pointer-events none so it doesn't block input */}
                <AnimatePresence>
                  {d && (
                    <motion.span
                      key={`dot-${i}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl text-black dark:text-white"
                    >
                      •
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>

          {error && (
            <div className={`text-sm p-2 rounded ${isLockedOut ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600"}`}>
              {error}
            </div>
          )}

          {!isLockedOut && (
            <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/40 dark:border-blue-800/30 rounded p-3 text-sm text-blue-800 dark:text-blue-300">
              <div className="font-medium">Session valid for 24 hours</div>
              <div className="text-xs opacity-90">Once you unlock this folder, you won’t need to re-enter the PIN until your session expires.</div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isUnlocking || isLockedOut} className="text-black dark:text-white">
            Cancel
          </Button>
          <Button2 onClick={handleUnlock} disabled={isUnlocking || pinValue.length !== 6 || isLockedOut}>
            {isUnlocking ? "Unlocking..." : "Unlock Folder"}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
