"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FolderPlus } from "lucide-react"
import Button  from "@/components/ui/button/Button"
import { CreateFolderModal } from "./create-folder-modal"


interface CreateFolderButtonProps {
  dimensionId: number | null
  parentFolderId: number | null
  createdBy: string
}

export function CreateFolderButton({ dimensionId, parentFolderId, createdBy }: CreateFolderButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dimensionId={dimensionId}
        created={createdBy}
        parentFolderId={parentFolderId}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </>
  )
}
