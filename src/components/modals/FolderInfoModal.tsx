"use client"

import { Modal } from "@/components/ui/modal"
import { format } from "date-fns"
import Badge from "../ui/badge/Badge"

interface FolderInfoModalProps {
  isOpen: boolean
  onClose: () => void
  folder: {
    id: number
    name: string
    status: string
    created_at?: string
    updated_at?: string
    dimension_id?: number | null
    is_locked?: boolean
    description?: string | null
  }
}

export function FolderInfoModal({ isOpen, onClose, folder }: FolderInfoModalProps) {
  if (!folder) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}

      className="max-w-[700px] py-12 px-20"
    >
        <div className="w-full flex flex-col justify-start">
          <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Folder Information 
          </h4>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            See information for the folder {folder.name}.
          </p>
        </div>

      <div className="space-y-4 mt-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</h4>
          <p className="text-gray-900 dark:text-gray-100">{folder.name}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</h4>
          <Badge
            className={
              folder.status === "draft"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white"
                : folder.status === "for_checking"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-white"
                  : folder.status === "checked"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-white"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-white"
            }
          >
            {folder.status.charAt(0).toUpperCase() + folder.status.slice(1).replace("_", " ")}
          </Badge>
        </div>

        {folder.dimension_id && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dimension ID</h4>
            <p className="text-gray-900 dark:text-gray-100">{folder.dimension_id}</p>
          </div>
        )}

        {folder.description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</h4>
            <p className="text-gray-900 dark:text-gray-100">{folder.description}</p>
          </div>
        )}

        {folder.is_locked && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lock Status</h4>
            <p className="text-gray-900 dark:text-gray-100">
              {folder.is_locked ? "🔒 Locked" : "🔓 Unlocked"}
            </p>
          </div>
        )}

        {folder.created_at && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Created</h4>
            <p className="text-gray-900 dark:text-gray-100">
              {format(new Date(folder.created_at), "PPP p")}
            </p>
          </div>
        )}

        {folder.updated_at && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Updated</h4>
            <p className="text-gray-900 dark:text-gray-100">
              {format(new Date(folder.updated_at), "PPP p")}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
