"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Button2 from "@/components/ui/button/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Download, CheckCircle, RefreshCw, XCircle, MoreVertical, User, Clock, FileText } from "lucide-react"
import { format } from "date-fns"
import TextArea from "../form/input/TextArea"
import { Badge } from "../ui/tag/tag"

interface Submission {
  id: number
  task_id: number
  assignment_id: number
  submitted_by: string
  version_number: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  public_url: string | null
  leader_comment: string | null
  leader_tag: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  submitter_name?: string
  submitter_email?: string
}

interface Assignment {
  id: number
  task_id: number
  assigned_to: {
  id: string | number
  name: string
}
  has_submissions: boolean
}


interface TaskDetails {
  id: number
  title: string
  description: string | null
  required_file_type: string | null
  due_date: string | null
  status: string
  folder_name: string
  assignments: Assignment[]
}

interface TaskSubmissionsModalProps {
  isOpen: boolean
  onClose: () => void
  task: TaskDetails
  onUpdate?: () => void
}

export function TaskSubmissionsModal({ isOpen, onClose, task, onUpdate }: TaskSubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const [reviewTag, setReviewTag] = useState<string>("")
  const [reviewComment, setReviewComment] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

const fetchSubmissions = useCallback(async () => {
  if (!task?.id) return
  setIsLoading(true)
  try {
    const response = await fetch(`/api/tasks/submissions?taskId=${task.id}`)
    const data = await response.json()
    if (response.ok) setSubmissions(data.submissions || [])
  } catch (error) {
    console.error("Error fetching submissions:", error)
  } finally {
    setIsLoading(false)
  }
}, [task?.id])

useEffect(() => {
  if (isOpen && task?.id) {
    fetchSubmissions()
  }
}, [isOpen, task?.id, fetchSubmissions])

  const handleReview = async () => {
    if (!reviewingSubmission || !reviewTag) return 

    setIsReviewing(true)
    try {
      const response = await fetch("/api/tasks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: reviewingSubmission.id,
          tag: reviewTag,
          comment: reviewComment || null,
        }),
      })

      if (response.ok) {
        fetchSubmissions()
        onUpdate?.()
        setReviewingSubmission(null)
        setReviewTag("")
        setReviewComment("")
      }
    } catch (error) {
      console.error("Error reviewing submission:", error)
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      submitted: { variant: "outline", label: "Submitted" },
      completed: { variant: "default", label: "Completed" },
      missing: { variant: "destructive", label: "Missing" },
      for_revision: { variant: "outline", label: "For Revision" },
    }
    const { variant, label } = config[status] || { variant: "secondary", label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getTagBadge = (tag: string | null) => {
  if (!tag) {
    return (
      <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
        Not Reviewed
      </Badge>
    )
  }

  const config: Record<
    string,
    { className: string; icon?: any; label: string }
  > = {
    accepted: {
      className: "bg-green-100 text-green-700 border border-green-300",
      icon: CheckCircle,
      label: "Accepted",
    },
    for_revision: {
      className: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      icon: RefreshCw,
      label: "For Revision",
    },
    rejected: {
      className: "bg-red-100 text-red-700 border border-red-300",
      icon: XCircle,
      label: "Rejected",
    },
  }

  const { className, icon: Icon, label } =
    config[tag] || {
      className: "bg-gray-100 text-gray-700 border border-gray-300",
      label: tag,
    }

  return (
    <Badge className={`gap-1 ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  )
}




  const getVersionLabel = (version: number) => {
    const labels = ["1st", "2nd", "3rd", "4th", "5th"]
    return labels[version - 1] || `${version}th`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {task.title} - Submissions
            </DialogTitle>
            <DialogDescription>
              Review submissions for this task. Folder: {task.folder_name}
              {task.due_date && ` • Due: ${format(new Date(task.due_date), "MMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Task Info */}
            {task.description && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <strong>Description:</strong> {task.description}
              </div>
            )}

            {/* Assigned Members Summary */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned Members ({task.assignments?.length || 0})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {task.assignments?.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm truncate">
                        {assignment.assigned_to?.name || "Unknown"}
                      </span>
                      {assignment.has_submissions ? (
                        <Badge variant="default">Submitted</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}

                  </div>
                ))}
              </div>
            </div>

            {/* Submissions Table */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/30">
                <h4 className="font-semibold">All Submissions ({submissions.length})</h4>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No submissions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Submission</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Review Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              {submission.submitter_name || "Unknown"}
                              <span className="text-xs text-gray-600">{submission.submitter_email || "Unknown"}</span>
                            </div></TableCell>
                          <TableCell>
                            <Badge variant="outline">{getVersionLabel(submission.version_number)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[150px]">{submission.file_name}</span>
                              {submission.leader_tag !== "accepted" && (
                              <Button2
                                size="sm"
                                className="h-fit w-fit text-white"
                                onClick={() => window.open(submission.public_url || "")}
                              >
                                <Download className="h-4 w-4" />
                              </Button2>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(submission.created_at), "MMM d, h:mm a")}
                            </div>
                          </TableCell>
                          <TableCell>{getTagBadge(submission.leader_tag)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-99999999999">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setReviewingSubmission(submission)
                                    setReviewTag("accepted")
                                  }}
                                  disabled={submission.leader_tag === "accepted"} // <-- disable if already accepted
                                  className={submission.leader_tag === "accepted" ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Mark as Accepted
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setReviewingSubmission(submission)
                                    setReviewTag("for_revision")
                                  }}
                                  disabled={submission.leader_tag === "accepted"} // <-- disable if already accepted
                                  className={submission.leader_tag === "accepted" ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2 text-yellow-600" />
                                  Request Revision
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setReviewingSubmission(submission)
                                    setReviewTag("rejected")
                                  }}
                                  disabled={submission.leader_tag === "accepted"} // <-- disable if already accepted
                                  className={submission.leader_tag === "accepted" ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>

                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewingSubmission} onOpenChange={() => setReviewingSubmission(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewTag === "accepted" && "Accept Submission"}
              {reviewTag === "for_revision" && "Request Revision"}
              {reviewTag === "rejected" && "Reject Submission"}
            </DialogTitle>
            <DialogDescription>
              {reviewingSubmission?.file_name} by {reviewingSubmission?.submitter_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <TextArea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment for the member..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center">
            <Button variant="outline" onClick={() => setReviewingSubmission(null)} disabled={isReviewing}>
              Cancel
            </Button>
            <Button2
              onClick={handleReview}
              disabled={isReviewing}
            >
              {isReviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm"
              )}
            </Button2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
