"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import Button from "@/components/ui/button/Button"
import { Lock } from "lucide-react"

interface TaskLockedModalProps {
  isOpen: boolean
  onClose: () => void
  folderName: string
}

export function TaskLockedModal({
  isOpen,
  onClose,
  folderName,
}: TaskLockedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTitle className="hidden"></DialogTitle>
      <DialogContent className="max-w-[600px] p-6 lg:p-10 bg-white">
        <div className="text-center">
          {/* Icon */}
          <div className="relative flex items-center justify-center mb-7">
            {/* Background shape */}
            <svg
              className="fill-red-100 dark:fill-red-500/15"
              width="90"
              height="90"
              viewBox="0 0 90 90"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z" />
            </svg>

            {/* Lock icon */}
            <span className="absolute inset-0 flex items-center justify-center">
              <Lock className="h-9 w-9 text-red-500" />
            </span>
          </div>

          {/* Title */}
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Folder Locked
          </h4>

          {/* Description */}
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            A task has been assigned to{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {folderName}
            </span>
            . This folder is temporarily locked to prevent additional uploads
            while the task is in progress.
          </p>

          {/* Info box */}
          <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-100">
            <span className="font-medium">This folder will be unlocked when:</span>
            <br />
            The assigned task is completed and all submissions are reviewed.
          </div>

          {/* Action */}
          <div className="mt-8 flex justify-center">
            <Button onClick={onClose} className="w-full sm:w-auto">
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
