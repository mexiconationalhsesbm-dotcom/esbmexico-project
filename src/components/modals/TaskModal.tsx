"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/button/Button"
import { Button as Button2 } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus, Trash2, Upload, Eye, Loader2, Calendar, FileType, AlertCircle } from "lucide-react"
import type { FolderTask, TaskAssignment } from "@/types"
import { format } from "date-fns"
import { Badge } from "../ui/tag/tag"
import { CreateTaskModal } from "./CreateTaskModal"
import { SubmitTaskModal } from "./SubmitTaskModal"
import { ViewSubmissionsModal } from "./ViewSubmissionsModal"
import Image from "next/image"

interface TasksModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  dimensionId: number
  folderName: string
  isDimensionMember: boolean
  currentUser: string
}

export function TasksModal({ isOpen, onClose, folderId, dimensionId, folderName, isDimensionMember, currentUser }: TasksModalProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<(FolderTask & { assignments?: TaskAssignment[] })[]>([])
  const [myAssignments, setMyAssignments] = useState<TaskAssignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [submitModalTask, setSubmitModalTask] = useState<FolderTask | null>(null)
  const [viewSubmissionsTask, setViewSubmissionsTask] = useState<{
    task: FolderTask
    assignment: TaskAssignment
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const canCreateTask = !isDimensionMember
  const isLeaderOrAdmin = canCreateTask

 const fetchTasks = useCallback(async () => {
  setIsLoading(true)
  try {
    const response = await fetch(`/api/tasks/list?folderId=${folderId}`)
    const data = await response.json()
    if (response.ok) setTasks(data.tasks || [])
  } catch (error) {
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}, [folderId])

const fetchMyAssignments = useCallback(async () => {
  setIsLoading(true)
  try {
    const response = await fetch(`/api/tasks/my-assignments?folderId=${folderId}`)
    const data = await response.json()
    if (response.ok) setMyAssignments(data.assignments || [])
  } catch (error) {
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}, [folderId])

useEffect(() => {
  if (isOpen) {
    if (isLeaderOrAdmin) fetchTasks()
    else fetchMyAssignments()
  }
}, [isOpen, isLeaderOrAdmin, fetchTasks, fetchMyAssignments])

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    setIsDeleting(taskId)
    try {
      const response = await fetch("/api/tasks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })

      if (response.ok) {
        fetchTasks()
        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      submitted: "outline",
      completed: "default",
      missing: "destructive",
      for_revision: "outline",
    }
    const labels: Record<string, string> = {
      pending: "Pending",
      submitted: "Submitted",
      completed: "Completed",
      missing: "Missing",
      for_revision: "For Revision",
    }
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>
  }

    const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase()

  if (type.includes("pdf")) return "/images/icons/pdf.svg"
  if (type.includes("word") || type.includes("doc")) return "/images/icons/doc-icon.svg"
  if (type.includes("excel") || type.includes("xls")) return "/images/icons/excel-icon.svg"
  if (type.includes("powerpoint") || type.includes("ppt")) return "/images/icons/ppt-icon.svg"
  if (type.includes("text") || type.includes("txt")) return "/images/icons/txt-icon.svg"

  return "/images/icons/file-icon.svg"
}

  const isTaskOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-white px-12">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-wide font-bold">Tasks for: {folderName}</DialogTitle>
            <DialogDescription>
              {isLeaderOrAdmin
                ? "Manage tasks and view submissions for this folder"
                : "View and submit your assigned tasks for this folder"}
            </DialogDescription>
          </DialogHeader>

          {canCreateTask && (
            <div className="mb-4">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isLeaderOrAdmin ? (
            // Leader/Admin View
            tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tasks found for this folder</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>File Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{task.description || "—"}</TableCell>
                      <TableCell>
                                {task.required_file_type ? (
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium shadow-sm">
                                    <Image
                                        src={getFileIcon(task.required_file_type)}
                                        alt={task.required_file_type}
                                        className="object-contain"
                                        width={24}
                                        height={24}
                                    />
                                    <span className="tracking-wide">
                                        {task.required_file_type.toUpperCase()}
                                    </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm italic">Any</span>
                                )}
                                </TableCell>
                                  <TableCell>
                                    {task.due_date ? (
                                        <div
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all
                                            ${
                                            task.status === "missing"
                                                ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                                                : task.status === "completed"
                                                ? "bg-green-50 text-green-600 ring-1 ring-green-200"
                                                : task.status === "pending" || task.status === "for_revision"
                                                ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200"
                                                : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                                            }
                                        `}
                                        >
                                        <Calendar className="h-4 w-4 opacity-80" />

                                        <span className="tracking-wide">
                                            {format(new Date(task.due_date), "MMM d, yyyy")}
                                        </span>

                                        {task.status === "missing" && (
                                            <AlertCircle className="h-4 w-4 animate-pulse" />
                                        )}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-500 text-xs italic shadow-sm">
                                        <Calendar className="h-4 w-4 opacity-70" />
                                        No Deadline
                                        </div>
                                    )}
                                    </TableCell>
                                    <TableCell>
                                    <span
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm
                                        ${
                                            task.status === "for_revision"
                                            ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                                            : task.status === "completed"
                                            ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                                            : task.status === "missing"
                                            ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                                            : task.status === "submitted"
                                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                                            : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
                                        }
                                        `}
                                    >
                                        {task.status.toUpperCase()}
                                    </span>
                                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : // Member View
          myAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tasks assigned to you for this folder</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Required File</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAssignments.map((assignment) => {
                  const task = assignment.task as FolderTask
                  const isOverdue = isTaskOverdue(task?.due_date || null)
                  const canSubmit = !isOverdue && assignment.status !== "completed"

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{task?.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{task?.description || "—"}</TableCell>
                      <TableCell>
                         {task.required_file_type ? (
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium shadow-sm">
                                    <Image
                                        src={getFileIcon(task.required_file_type)}
                                        alt={task.required_file_type}
                                        className="object-contain"
                                        width={24}
                                        height={24}
                                    />
                                    <span className="tracking-wide">
                                        {task.required_file_type.toUpperCase()}
                                    </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm italic">Any</span>
                                )}
                      </TableCell>
                      <TableCell>
                                    {task.due_date ? (
                                        <div
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all
                                            ${
                                            task.status === "for_revision"
                                            ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                                            : task.status === "completed"
                                            ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                                            : task.status === "missing"
                                            ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                                            : task.status === "submitted"
                                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                                            : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
                                        }
                                        `}
                                        >
                                        <Calendar className="h-4 w-4 opacity-80" />

                                        <span className="tracking-wide">
                                            {format(new Date(task.due_date), "MMM d, yyyy")}
                                        </span>

                                        {task.status === "missing" && (
                                            <AlertCircle className="h-4 w-4 animate-pulse" />
                                        )}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-500 text-xs italic shadow-sm">
                                        <Calendar className="h-4 w-4 opacity-70" />
                                        No Deadline
                                        </div>
                                    )}
                                    </TableCell>
                      <TableCell>
                                    <span
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm
                                        ${
                                            assignment.status === "for_revision"
                                            ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                                            : assignment.status === "completed"
                                            ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                                            : assignment.status === "missing"
                                            ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                                            : assignment.status === "submitted"
                                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                                            : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
                                        }
                                        `}
                                    >
                                        {assignment.status.toUpperCase()}
                                    </span>
                                    </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canSubmit && (
                            <Button className="h-10" size="sm" onClick={() => setSubmitModalTask(task)} disabled={isOverdue}>
                              <Upload className="h-4 w-4 mr-1" />
                              {assignment.submissions && assignment.submissions.length > 0 ? "Replace" : "Submit"}
                            </Button>
                          )}
                          {assignment.submissions && assignment.submissions.length > 0 && (
                            <Button2
                              variant="outline"
                              onClick={() => setViewSubmissionsTask({ task, assignment })}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View ({assignment.submissions.length})
                            </Button2>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        folderId={folderId}
        dimensionId={dimensionId}
        onSuccess={() => {
          fetchTasks()
          router.refresh()
        }}
      />

      {submitModalTask && (
        <SubmitTaskModal
          isOpen={!!submitModalTask}
          onClose={() => setSubmitModalTask(null)}
          task={submitModalTask}
          currentUserId={currentUser}
          onSuccess={() => {
            fetchMyAssignments()
            setSubmitModalTask(null)
            router.refresh()
          }}
        />
      )}

      {viewSubmissionsTask && (
        <ViewSubmissionsModal
          isOpen={!!viewSubmissionsTask}
          onClose={() => setViewSubmissionsTask(null)}
          task={viewSubmissionsTask.task}
          assignmentId={viewSubmissionsTask.assignment.id}
        />
      )}
    </>
  )
}
