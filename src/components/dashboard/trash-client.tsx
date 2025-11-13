"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, Trash2 } from "lucide-react"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import Button from "@/components/ui/button/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Badge from "@/components/ui/badge/Badge"
import ConfirmPermanentDelete from "../modals/ConfirmPermaDel"
import ConfirmRecovery from "../modals/ConfirmRecovery"
import { useAlert } from "@/context/AlertContext"
import Image from "next/image"

interface TrashItem {
  id: number
  item_id: number
  item_type: "file" | "folder"
  item_name: string
  deleted_at: string
  file_size?: number
}

export function TrashClient({ dimensionId }: { dimensionId: number }) {
  const router = useRouter()
  const [items, setItems] = useState<TrashItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRecovering, setIsRecovering] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null)
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const {showAlert} = useAlert();

    const fetchTrashItems = useCallback(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/trash/list?dimensionId=${dimensionId}`);
        if (!response.ok) throw new Error("Failed to fetch trash items");

        const data = await response.json();
        setItems(data.items || []);
      } catch (error) {
        console.error("Error fetching trash items:", error);
      } finally {
        setIsLoading(false);
      }
    }, [dimensionId]);

    useEffect(() => {
      fetchTrashItems();
    }, [fetchTrashItems]); // ✅ no more ESLint warning



  // ♻️ Recover handler
  const handleRecover = async (item: TrashItem) => {
    setIsRecovering(item.id)
    try {
      const response = await fetch("/api/trash/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trashId: item.id,
          itemType: item.item_type,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to recover item")
      }
      showAlert({
        type: "success",
        title: "Item Recovered",
        message: `"${item.item_name}" was successfully restored.`,
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id))
      router.refresh()
    } catch (error: any) {
      console.error("Error recovering item:", error)
      showAlert({
        type: "error",
        title: "Recovery Failed",
        message: error.message || "An error occurred while recovering the item.",
      });
    } finally {
      setIsRecovering(null)
      setIsRecoveryModalOpen(false)
      setSelectedItem(null)
    }
  }

  // 🗑️ Permanent delete handler
  const handlePermanentDelete = async (item: TrashItem) => {
    setIsDeleting(item.id)
    try {
      const response = await fetch("/api/trash/permanent-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashId: item.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete item")
      }

      showAlert({
        type: "success",
        title: "Item Deleted Permanently",
        message: `"${item.item_name}" was permanently deleted.`,
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (error: any) {
      console.error("Error deleting item:", error)
      showAlert({
        type: "error",
        title: "Delete Failed",
        message: error.message || "An error occurred while deleting the item.",
      });
    } finally {
      setIsDeleting(null)
      setIsDeleteModalOpen(false)
      setSelectedItem(null)
    }
  }

  const getDaysRemaining = (deletedAt: string) => {
    const days = differenceInDays(
      new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000,
      new Date()
    )
    return Math.max(0, days)
  }

  const getFileIcon = (itemName: string, itemType: string) => {
    if (itemType === "folder") return "/images/icons/folder.svg"

    const ext = itemName.split(".").pop()?.toLowerCase() || ""
    if (ext === "pdf") return "/images/icons/pdf.svg"
    if (["doc", "docx"].includes(ext)) return "/images/icons/doc-icon.svg"
    if (["xls", "xlsx"].includes(ext)) return "/images/icons/excel-icon.svg"
    if (["ppt", "pptx"].includes(ext)) return "/images/icons/ppt-icon.svg"
    if (ext === "txt") return "/images/icons/txt-icon.svg"
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return "/images/icons/image-icon.svg"
    return "/images/icons/file-icon.svg"
  }

  // 🌀 Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // 🗑️ Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Trash2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg font-medium">Trash is empty</p>
        <p className="text-muted-foreground">Deleted items will appear here</p>
      </div>
    )
  }

  // 🧱 Table display
  return (
    <>
      <div className="p-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Deleted</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const daysRemaining = getDaysRemaining(item.deleted_at)
                const isExpiringSoon = daysRemaining <= 7

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image
                          src={getFileIcon(item.item_name, item.item_type)}
                          alt={item.item_type === "folder" ? "Folder" : "File"}
                          className="w-5 h-5"
                          width={5}
                          height={5}
                        />
                        <span>{item.item_name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="light">
                        {item.item_type === "file" ? "File" : "Folder"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {item.file_size
                        ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB`
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {formatDistanceToNow(new Date(item.deleted_at), {
                        addSuffix: true,
                      })}
                    </TableCell>

                    <TableCell>
                      <Badge variant={isExpiringSoon ? "solid" : "light"}>
                        {daysRemaining} days
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item)
                          setIsRecoveryModalOpen(true)
                        }}
                        disabled={isRecovering === item.id || isDeleting === item.id}
                      >
                        {isRecovering === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recover
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item)
                          setIsDeleteModalOpen(true)
                        }}
                        disabled={isRecovering === item.id || isDeleting === item.id}
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ✅ Recovery Modal */}
      <ConfirmRecovery
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        onConfirm={() => selectedItem && handleRecover(selectedItem)}
        isLoading={!!isRecovering}
        itemName={selectedItem?.item_name || ""}
      />

      {/* 🗑️ Delete Modal */}
      <ConfirmPermanentDelete
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => selectedItem && handlePermanentDelete(selectedItem)}
        isLoading={!!isDeleting}
        itemName={selectedItem?.item_name || ""}
      />
    </>
  )
}
