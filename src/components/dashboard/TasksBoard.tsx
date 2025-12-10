"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Button2 from "@/components/ui/button/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Loader2,
  MoreVertical,
  Calendar,
  FileType,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Trash2,
  Search,
} from "lucide-react"
import { format } from "date-fns"
import { EditTaskModal } from "@/components/modals/EditTaskModal"
import { Badge } from "@/components/ui/tag/tag"
import { TaskSubmissionsModal } from "@/components/modals/TaskSubmissionModal"
import Image from "next/image"

interface Assignee {
  id: string | number
  name: string
}

interface AssignmentDetail {
  id: number
  task_id: number
  assigned_to: Assignee
  has_submissions: boolean
}

interface TaskWithDetails {
  id: number
  folder_id: number
  dimension_id: number
  title: string
  description: string | null
  required_file_type: string | null
  due_date: string | null
  status: string
  created_at: string

  folder_name: string
  dimension_name: string

  total_assigned: number
  is_assigned_to_all: boolean

  assignee_names: Assignee[]
  assignments: AssignmentDetail[]
}


export default function TaskBoard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [viewingSubmissions, setViewingSubmissions] = useState<TaskWithDetails | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = activeTab === "all" ? "" : activeTab
      const response = await fetch(`/api/tasks/leader-overview?status=${status}`)
      const data = await response.json()
      if (response.ok) {
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

    useEffect(() => {
  fetchTasks()
}, [fetchTasks])

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task? This will also delete all submissions.")) return

    setIsDeleting(taskId)
    try {
      const response = await fetch("/api/tasks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    } finally {
      setIsDeleting(null)
    }
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
  
  // Calculate summary stats
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "missing").length
  // const tasksWithSubmissions = tasks.filter((t) => t.submitted_count > 0).length
  const completedTasks = tasks.filter((t) => t.status === "completed").length

  return (
    <div className="p-2 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader className="p-8">
          <CardTitle className="tracking-wide font-bold">Tasks Overview</CardTitle>
          <CardDescription className="tracking-wide">All tasks assigned across your folders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="missing">Overdue</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No tasks found</div>
              ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">

                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-end">
                    <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Task"
                        // value={search}
                        // onChange={(e) => {
                        // setSearch(e.target.value);
                        // setCurrentPage(1);
                        // }}
                        className="text-dark-gray dark:text-white w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white/80 dark:bg-white/5 py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    </div>
                </div>
                    <div className="max-w-full overflow-x-auto">
                        <div className="min-w-[1000px]">
                        <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/5">
                            <TableRow>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Task</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Folder</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">File Type</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Due Date</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Status</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Assigned To</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Submissions</TableHead>
                            <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                            {tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell className="py-3">
                                <div>
                                    <p className="text-xs font-bold">{task.title}</p>
                                    {task.description && (
                                    <p className="text-sm font-normal text-gray-600 max-w-xs">{task.description}</p>
                                    )}
                                </div>
                                </TableCell>
                                <TableCell className="p-2 max-w-xs">
                                    <Badge>{task.folder_name}</Badge>
                                </TableCell>
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

                                <TableCell className="max-w-[220px]">
                                    {task.is_assigned_to_all ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold shadow-sm ring-1 ring-indigo-200">
                                        All Members
                                        </span>
                                    ) : task.assignments?.length > 0 ? (
                                        <div className="flex flex-col gap-1.5">
                                        {task.assignments.map((a) => (
                                            <span
                                            key={a.id}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ring-1 transition w-fit
                                                ${
                                                a.has_submissions
                                                    ? "bg-green-50 text-green-700 ring-green-200"
                                                    : "bg-gray-50 text-gray-600 ring-gray-200"
                                                }
                                            `}
                                            >
                                            <span>{a.assigned_to.name}</span>
                                            {a.has_submissions && (
                                                <span className="text-xs">✔</span>
                                            )}
                                            </span>
                                        ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">No assignees</span>
                                    )}
                                </TableCell>

                                <TableCell className="text-left">
                                <Button2 className="max-h-10" onClick={() => setViewingSubmissions(task)}>View</Button2>
                                </TableCell>

                                <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDeleteTask(task.id)}
                                        disabled={isDeleting === task.id}
                                        className="text-destructive"
                                    >
                                        {isDeleting === task.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Delete Task
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                        </div>
                    </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onSuccess={() => {
            fetchTasks()
            setEditingTask(null)
          }}
        />
      )}

      {viewingSubmissions && (
        <TaskSubmissionsModal
          isOpen={!!viewingSubmissions}
          onClose={() => setViewingSubmissions(null)}
          task={viewingSubmissions}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  )
}
