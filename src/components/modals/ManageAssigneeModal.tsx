"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/tag/tag"
import { Loader2, UserPlus, UserMinus } from "lucide-react"
import type { Admin } from "@/types"
import Checkbox from "../form/input/Checkbox"

interface ManageAssigneesModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  taskTitle: string
  dimensionId: number
  onSuccess: () => void
}

export function ManageAssigneesModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  dimensionId,
  onSuccess,
}: ManageAssigneesModalProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])
  const [originalAdmins, setOriginalAdmins] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)


  /* ---------------------------- Data ---------------------------- */

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admins/list")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setAdmins(
        (data.admins as Admin[]).filter(
          (a) =>
            a.assigned_dimension_id === dimensionId &&
            a.role_id === 5
        )
      )
    } catch (err) {
      console.error(err)
      setError("Failed to load members")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAssignedAdmins = async () => {
    try {
      const response = await fetch(`/api/tasks/assignees?taskId=${taskId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      const ids = data.assignees.map((a: any) => String(a.id))

      setSelectedAdmins(ids)
      setOriginalAdmins(ids)
    } catch (err) {
      console.error(err)
      setError("Failed to load assigned members")
    }
  }

    useEffect(() => {
    if (!isOpen) return

    fetchAdmins()
    fetchAssignedAdmins()
  }, [isOpen, taskId, fetchAdmins, fetchAssignedAdmins])

  /* ---------------------------- Actions ---------------------------- */

  const toggleAdmin = (id: string) => {
    setSelectedAdmins((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    )
  }

  const hasChanges =
    selectedAdmins.length !== originalAdmins.length ||
    selectedAdmins.some((id) => !originalAdmins.includes(id))

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    const optimistic = selectedAdmins
    const rollback = originalAdmins

    setOriginalAdmins(optimistic)

    try {
      const response = await fetch("/api/tasks/manage-assignees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          assigneeIds: optimistic,
          assignToEveryone: false,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      onSuccess()
      onClose()
    } catch (err: any) {
      setSelectedAdmins(rollback)
      setOriginalAdmins(rollback)
      setError(err.message || "Failed to update assignees")
    } finally {
      setIsSaving(false)
    }
  }

  /* ---------------------------- Derived ---------------------------- */

  const assignedAdmins = admins.filter((a) =>
    selectedAdmins.includes(String(a.id))
  )

  const unassignedAdmins = admins.filter(
    (a) => !selectedAdmins.includes(String(a.id))
  )

  /* ---------------------------- UI ---------------------------- */

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Manage Assignees</DialogTitle>
          <DialogDescription>
            Add or remove members assigned to <b>{taskTitle}</b>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assigned */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-red-500" />
                Assigned
              </h4>

              {assignedAdmins.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No assigned members
                </p>
              ) : (
                <div className="space-y-2">
                  {assignedAdmins.map((admin) => (
                    <label
                      key={admin.id}
                      className="flex items-center gap-2 p-2 border rounded-md cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAdmins.includes(String(admin.id))}
                        onChange={() => toggleAdmin(String(admin.id))}
                      />
                      <span className="text-sm">
                        {admin.full_name || admin.email}
                      </span>
                      <Badge variant="secondary">Assigned</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Available */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-500" />
                Available
              </h4>

              {unassignedAdmins.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No available members
                </p>
              ) : (
                <div className="space-y-2">
                  {unassignedAdmins.map((admin) => (
                    <label
                      key={admin.id}
                      className="flex items-center gap-2 p-2 border rounded-md cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAdmins.includes(String(admin.id))}
                        onChange={() => toggleAdmin(String(admin.id))}
                      />
                      <span className="text-sm">
                        {admin.full_name || admin.email}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
