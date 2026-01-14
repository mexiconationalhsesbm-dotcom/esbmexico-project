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
import { AlertCircle, Loader2 } from "lucide-react"
import TextArea from "../form/input/TextArea"
import Checkbox from "../form/input/Checkbox"
import { DatePicker } from "../ui/calendar/date-picker"
import type { Admin } from "@/types"

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: {
    id: number
    title: string
    description: string | null
    required_file_type: string | null
    due_date: string | null
    assigned_to_everyone: boolean
    assignee_ids: number[]
    dimension_id: number
  }
  onSuccess: () => void
}

const FILE_TYPES = [
  { label: "Any", value: "" },
  { label: "PDF", value: "pdf" },
  { label: "Word Document (DOCX)", value: "docx" },
  { label: "Excel Spreadsheet (XLSX)", value: "xlsx" },
  { label: "PowerPoint (PPTX)", value: "pptx" },
  { label: "Text File (TXT)", value: "txt" },
]

export function EditTaskModal({ isOpen, onClose, task, onSuccess }: EditTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requiredFileType, setRequiredFileType] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [assignedToEveryone, setAssignedToEveryone] = useState(false)
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* 🔑 Sync when modal opens */
  useEffect(() => {
    if (!isOpen) return

    setTitle(task.title)
    setDescription(task.description || "")
    setRequiredFileType(task.required_file_type || "")
    setDueDate(task.due_date ? new Date(task.due_date) : undefined)
    setAssignedToEveryone(task.assigned_to_everyone)
    setSelectedAdmins(task.assigned_to_everyone ? [] : task.assignee_ids.map(String))
    setError(null)
  }, [isOpen, task])

  /* 🔑 Load dimension admins */
  useEffect(() => {
    if (!isOpen) return

    const fetchAdmins = async () => {
      try {
        const res = await fetch("/api/admins/list")
        const data = await res.json()

        if (res.ok) {
          setAdmins(
            data.admins.filter(
              (a: Admin) =>
                a.assigned_dimension_id === task.dimension_id &&
                a.role_id === 5
            )
          )
        }
      } catch (err) {
        console.error("Error fetching admins", err)
      }
    }

    fetchAdmins()
  }, [isOpen, task.dimension_id])

  const toggleAdmin = (id: string) => {
    setSelectedAdmins((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleUpdate = async () => {
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
      const response = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          title: title.trim(),
          description: description.trim() || null,
          requiredFileType: requiredFileType || null,
          dueDate: dueDate?.toISOString() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update task")
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update task")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-wide text-xl">
            Edit Task
          </DialogTitle>
          <DialogDescription>
            Update task details and assignees
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-destructive/10 border border-red-900 bg-red-100 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              {/* Optional dismiss button */}
              {/* <Button
                variant="ghost"
                size="icon"
                className="ml-auto text-destructive"
                onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </Button> */}
            </div>
          )}


          {/* Title */}
          <div className="space-y-2">
            <Label>Task Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* File type */}
          <div className="space-y-2">
            <Label>Required File Type</Label>
            <select
              value={requiredFileType}
              onChange={(e) => setRequiredFileType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {FILE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <DatePicker
              date={dueDate}
              onDateChange={setDueDate}
              disabled={(d) =>
                d < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button2 onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Task"
            )}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
