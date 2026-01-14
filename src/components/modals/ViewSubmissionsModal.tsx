"use client"

import { useState, useEffect, useCallback } from "react"
import Button from "@/components/ui/button/Button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { FolderTask, TaskSubmission } from "@/types"
import { Loader2, Download, CheckCircle, RefreshCw, XCircle, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "../ui/tag/tag"

interface ViewSubmissionsModalProps {
  isOpen: boolean
  onClose: () => void
  task: FolderTask
  assignmentId: number
}

export function ViewSubmissionsModal({ isOpen, onClose, task, assignmentId }: ViewSubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/submissions?assignmentId=${assignmentId}`)
      const data = await response.json()
      if (response.ok) {
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchSubmissions()
    }
  }, [isOpen, assignmentId, fetchSubmissions])

  const getVersionLabel = (version: number) => {
    const labels = ["First", "Second", "Third", "Fourth", "Fifth"]
    return `${labels[version - 1] || `${version}th`} Submission`
  }

    const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-green-50 text-green-700 ring-1 ring-green-200"
    case "missing":
      return "bg-red-50 text-red-700 ring-1 ring-red-200"
    case "for_revision":
      return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200"
    case "submitted":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
    default:
      return "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
  }
}

  const getTagBadge = (tag: string | null) => {
    if (!tag) return null
    const config: Record<string, { variant: "default" | "destructive" | "outline"; icon: any; label: string }> = {
      accepted: { variant: "default", icon: CheckCircle, label: "Accepted" },
      for_revision: { variant: "outline", icon: RefreshCw, label: "For Revision" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
    }
    const { variant, icon: Icon, label } = config[tag] || { variant: "outline", icon: null, label: tag }
    return (
      <Badge variant="default" className="gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white p-8">
        <DialogHeader>
          <DialogTitle>My Submissions: {task.title}</DialogTitle>
          <DialogDescription>View your submission history and leader feedback</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No submissions yet</div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission, index) => (
              <div key={submission.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">
                      {getVersionLabel(submission.version_number)}
                    </h4>

                    {submission.leader_tag ? (
                      <span
                        className={`px-3 py-1 text-xs font-semibold tracking-wide ${getTaskStatusStyles(
                          submission.leader_tag
                        )}`}
                      >
                        {getTagBadge(submission.leader_tag)}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                        Not Yet Reviewed
                      </span>
                    )}
                  </div>



                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">{submission.file_name}</span>
                      
                      {submission.leader_tag !== "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(submission.public_url || "", "_blank")}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {format(new Date(submission.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {submission.leader_comment && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <MessageSquare className="h-4 w-4" />
                        Leader Comment
                      </div>
                      <p className="text-sm text-muted-foreground">{submission.leader_comment}</p>
                      {submission.reviewed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Reviewed: {format(new Date(submission.reviewed_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
