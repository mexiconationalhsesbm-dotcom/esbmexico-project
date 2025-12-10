"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import TextArea from "../form/input/TextArea"
import { DatePicker } from "../ui/calendar/date-picker"

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: {
    id: number
    title: string
    description: string | null
    required_file_type: string | null
    due_date: string | null
  }
  onSuccess: () => void
}

export function EditTaskModal({ isOpen, onClose, task, onSuccess }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [requiredFileType, setRequiredFileType] = useState(task.required_file_type || "")
  const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? new Date(task.due_date) : undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError("Please enter a task title")
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
          requiredFileType: requiredFileType.trim() || null,
          dueDate: dueDate?.toISOString() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update task")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to update task")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details</DialogDescription>
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
            <Label htmlFor="fileType">Required File Type</Label>
            <Input
              id="fileType"
              value={requiredFileType}
              onChange={(e) => setRequiredFileType(e.target.value)}
              placeholder="e.g., .pdf, .docx, .png"
            />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
