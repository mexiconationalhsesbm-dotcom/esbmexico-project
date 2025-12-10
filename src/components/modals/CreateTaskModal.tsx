"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Button2 from "@/components/ui/button/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Input from "@/components/form/input/TextInput"
import { Label } from "@/components/ui/label"
import type { Admin } from "@/types"
import { Loader2 } from "lucide-react"
import TextArea from "../form/input/TextArea"
import Checkbox from "../form/input/Checkbox"
import { DatePicker } from "../ui/calendar/date-picker"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  dimensionId: number
  onSuccess: () => void
}

export function CreateTaskModal({ isOpen, onClose, folderId, dimensionId, onSuccess }: CreateTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requiredFileType, setRequiredFileType] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [assignedToEveryone, setAssignedToEveryone] = useState(false)
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const FILE_TYPES = [
  { label: "Any", value: "" },
  { label: "PDF", value: "pdf" },
  { label: "Word Document (DOCX)", value: "docx" },
  { label: "Excel Spreadsheet (XLSX)", value: "xlsx" },
  { label: "PowerPoint (PPTX)", value: "pptx" },
  { label: "Text File (TXT)", value: "txt" },
];


  useEffect(() => {
  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admins/list")
      const data = await response.json()
      if (response.ok) {
        const dimensionAdmins = data.admins.filter(
          (admin: Admin) => admin.assigned_dimension_id === dimensionId && admin.role_id === 5
        )
        setAdmins(dimensionAdmins)
      }
    } catch (error) {
      console.error("Error fetching admins:", error)
    }
  }

  if (isOpen) {
    fetchAdmins()
  }
}, [isOpen, dimensionId])


  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Please enter a task title")
      return
    }

    if (!assignedToEveryone && selectedAdmins.length === 0) {
      setError("Please select at least one member or assign to everyone")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          dimensionId,
          title: title.trim(),
          description: description.trim() || null,
          requiredFileType: requiredFileType.trim() || null,
          dueDate: dueDate?.toISOString() || null,
          assignedToAdmins: selectedAdmins,
          assignedToEveryone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create task")
      }

      // Reset form
      setTitle("")
      setDescription("")
      setRequiredFileType("")
      setDueDate(undefined)
      setAssignedToEveryone(false)
      setSelectedAdmins([])
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminToggle = (adminId: string) => {
    setSelectedAdmins((prev) => (prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-wide text-xl">Create New Task</DialogTitle>
          <DialogDescription>Create a task for this folder and assign it to team members</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
              placeholder="Enter task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
          <Label>Required File Type</Label>

          <select
            value={requiredFileType}
            onChange={(e) => setRequiredFileType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {FILE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <p className="text-xs text-muted-foreground">
            Choose what file type members must upload
          </p>
        </div>


          <div className="space-y-2">
            <Label>Due Date</Label>
             <DatePicker
              date={dueDate}
              onDateChange={setDueDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              placeholder="Select due date"
            />
          </div>

          <div className="space-y-3">
            <Label>Assign To *</Label>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="everyone"
                checked={assignedToEveryone}
                onChange={(checked) => {
                  setAssignedToEveryone(checked);
                  if (checked) setSelectedAdmins([]);
                  setError(null);
                }}
              />
              <Label htmlFor="everyone" className="text-sm font-normal cursor-pointer">
                Assign to Everyone in Dimension
              </Label>
            </div>

            {!assignedToEveryone && (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members found in this dimension</p>
                ) : (
                  admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`admin-${admin.id}`}
                        checked={selectedAdmins.includes(admin.id)}
                        onChange={() => {
                          handleAdminToggle(admin.id);
                          setError(null);
                        }}
                      />
                      <Label htmlFor={`admin-${admin.id}`} className="text-sm font-normal cursor-pointer flex-1">
                        {admin.full_name || admin.email}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center ">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button2 onClick={handleCreate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
