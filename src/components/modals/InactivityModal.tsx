"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

interface InactivityModalProps {
  isOpen: boolean
  onDismiss: () => void
  onLogout: () => void
  warningTime?: number // Time in milliseconds before auto-logout
}

export function InactivityModal({ isOpen, onDismiss, onLogout, warningTime = 60000 }: InactivityModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(warningTime / 1000))
  const router = useRouter()

    const handleLogout = useCallback(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.replace("/login")
        router.refresh()
        onDismiss()
      }, [router, onDismiss]) // ✅ dependencies included

      useEffect(() => {
        if (!isOpen) {
          setSecondsRemaining(Math.ceil(warningTime / 1000))
          return
        }

        setSecondsRemaining(Math.ceil(warningTime / 1000))

        const interval = setInterval(() => {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              handleLogout()
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(interval)
      }, [isOpen, warningTime, handleLogout]) 

//   const handleLogout = async () => {
//     await signOut()
//     onLogout()
//   }

  const handleStayActive = () => {
    setSecondsRemaining(Math.ceil(warningTime / 1000))
    onDismiss()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleStayActive()}>
      <AlertDialogContent className="max-w-md bg-white dark:bg-gray-950">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            You have been inactive for 10 minutes. Your session will automatically expire in{" "}
            <span className="font-bold text-red-600">{secondsRemaining}</span> seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 mt-6">
          <AlertDialogCancel onClick={handleStayActive} className="flex-1">
            Stay Active
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} className="flex-1 bg-destructive hover:bg-destructive/90">
            Sign Out
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
