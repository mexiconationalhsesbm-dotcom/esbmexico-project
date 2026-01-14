"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ClipboardList, X, Filter, EyeOff, Eye, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/tag/tag"
import { cn } from "@/libs/utils"
import { TasksModal } from "../modals/TaskModal"

interface CustomUser {
  id: string
  email: string
  role?: {
    role_id: number
    role: string
  } | null
  teacher?: {
    teacher_id: string
    fullname: string
    email: string
    profile_url: string
  } | null
  dimension?: {
    id: number
    name: string
    slug: string
  } | null
}

interface ActivityItem {
  id: string
  type: "task_assigned" | "task_created" | "submission_received" | "submission_reviewed"
  category: "tasks" | "submissions"
  title: string
  description: string
  status: string
  due_date?: string
  created_at: string
  folder?: { id: number; name: string }
  dimension?: { id: number; name: string; slug: string }
  task_id?: number
  assignment_id?: number
  submission_id?: number
  version_number?: number
  reviewer_comment?: string
  assigned_by?: {
    id: string
    fullname: string
    email: string
    profile_url: string | null
  }
  submitter?: {
    id: string
    fullname: string
    email: string
    profile_url: string | null
  }
  reviewer?: {
    id: string
    fullname: string
    email: string
    profile_url: string | null
  }
}

interface AdminInfo {
  id: string
  fullname: string
  email: string
  profile_url: string | null
  role: string
}

type FilterCategory = "all" | "tasks" | "submissions"

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min${diff < 120 ? "" : "s"} ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${diff < 7200 ? "" : "s"} ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${diff < 172800 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "accepted":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "pending":
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "for_revision":
    case "revision":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
    case "rejected":
    case "missing":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  }
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "accepted":
      return <CheckCircle2 className="h-3 w-3" />
    case "pending":
    case "in_progress":
      return <Clock className="h-3 w-3" />
    case "for_revision":
    case "revision":
    case "rejected":
    case "missing":
      return <AlertCircle className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

export function ActivityCenter({ user }: { user: CustomUser }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const [isLeader, setIsLeader] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all")
  const [hideCompleted, setHideCompleted] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const isDimensionMember = user.role?.role_id === 5

  useEffect(() => {
    if (isOpen) {
      fetchActivities()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/activity")
      const data = await res.json()

      if (res.ok) {
        setActivities(data.activities || [])
        setAdminInfo(data.admin || null)
        setIsLeader(data.isLeader || false)
      }
    } catch (err) {
      console.error("Error fetching activities:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleActivityClick = (activity: ActivityItem) => {
    setIsOpen(false)
    if (activity.folder?.id && activity.dimension?.id) {
      setSelectedActivity(activity)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    // Category filter
    if (filterCategory !== "all" && activity.category !== filterCategory) {
      return false
    }

    // Hide completed filter
    if (hideCompleted) {
      const completedStatuses = ["completed", "accepted"]
      if (completedStatuses.includes(activity.status?.toLowerCase())) {
        return false
      }
    }

    return true
  })

  const unreadCount = activities.filter((a) => {
    const completedStatuses = ["completed", "accepted"]
    return !completedStatuses.includes(a.status?.toLowerCase())
  }).length

  const getActivityPerson = (activity: ActivityItem) => {
    if (activity.type === "task_assigned" && activity.assigned_by) {
      return activity.assigned_by
    }
    if (activity.type === "submission_received" && activity.submitter) {
      return activity.submitter
    }
    if (activity.type === "submission_reviewed" && activity.reviewer) {
      return activity.reviewer
    }
    return null
  }

  const getAvatarUser = (activity: ActivityItem) => {
  if (activity.type === "task_created") {
    return {
      fullname: user.teacher?.fullname || "You",
      profile_url: user.teacher?.profile_url || null,
    }
  }

  return getActivityPerson(activity)
}

  const getActivityMessage = (activity: ActivityItem) => {
    const person = getActivityPerson(activity)

    switch (activity.type) {
      case "task_assigned":
        return (
          <>
            <span className="font-medium text-foreground">{person?.fullname || "Unknown"}</span>
            <span> assigned you task: </span>
            <span className="font-medium text-foreground">{activity.title}</span>
            <span> for folder </span>
            <span className="font-medium text-foreground">{activity.folder?.name || "Unknown"}</span>
          </>
        )
      case "task_created":
        return (
          <>
            <span>You created task: </span>
            <span className="font-medium text-foreground">{activity.title}</span>
            <span> in folder </span>
            <span className="font-medium text-foreground">{activity.folder?.name || "Unknown"}</span>
          </>
        )
      case "submission_received":
        return (
          <>
            <span className="font-medium text-foreground">{person?.fullname || "A member"}</span>
            <span> submitted a file for task: </span>
            <span className="font-medium text-foreground">{activity.title}</span>
            <span> in folder </span>
            <span className="font-medium text-foreground">{activity.folder?.name || "Unknown"}</span>
            <span> - awaiting your review</span>
          </>
        )
      case "submission_reviewed":
        return (
          <>
            <span className="font-medium text-foreground">{person?.fullname || "Unknown"}</span>
            <span> reviewed your submission for task: </span>
            <span className="font-medium text-foreground">{activity.title}</span>
            {activity.reviewer_comment && (
              <>
                <span className="block mt-1 text-xs italic">"{activity.reviewer_comment}"</span>
              </>
            )}
          </>
        )
      default:
        return activity.description
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        className="relative flex items-center justify-center text-muted-foreground text-gray-500 transition-colors bg-background border border-border rounded-full hover:text-foreground h-11 w-11 hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 z-10 h-3 w-3 rounded-full bg-orange-400 flex overflow-visible">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping text-center"></span>
          </span>
        )}
        <ClipboardList className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bg-white right-0 mt-2 flex h-fit max-h-[520px] w-[380px] flex-col rounded-2xl border border-border bg-card p-3 shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
            <h5 className="text-lg font-semibold text-foreground">Activity Center</h5>
            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <div className="relative" ref={filterMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <Filter className="h-4 w-4" />
                </Button>

                {/* Filter Menu */}
                {showFilterMenu && (
                  <div className="absolute bg-white right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover p-2 shadow-lg z-50">
                    <div className="space-y-1">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Category</p>
                      {(["all", "tasks", "submissions"] as FilterCategory[]).map((cat) => (
                        <button
                          key={cat}
                          className={cn(
                            "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                            filterCategory === cat
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50 text-foreground",
                          )}
                          onClick={() => {
                            setFilterCategory(cat)
                            setShowFilterMenu(false)
                          }}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}

                      <div className="my-2 border-t border-border" />

                      <button
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 text-foreground transition-colors"
                        onClick={() => setHideCompleted(!hideCompleted)}
                      >
                        {hideCompleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {hideCompleted ? "Show Completed" : "Hide Completed"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filterCategory !== "all" || hideCompleted) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filterCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {filterCategory}
                  <button className="ml-1" onClick={() => setFilterCategory("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {hideCompleted && (
                <Badge variant="secondary" className="text-xs">
                  Hiding completed
                  <button className="ml-1" onClick={() => setHideCompleted(false)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-10 text-muted-foreground">Loading...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mb-2 opacity-50" />
              <p>No activities found</p>
              {(filterCategory !== "all" || hideCompleted) && (
                <p className="text-xs mt-1">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar max-h-[350px]">
              {filteredActivities.map((activity) => {
                const person = getActivityPerson(activity)

                return (
                  <li key={activity.id}>
                    <button
                      onClick={() => handleActivityClick(activity)}
                      className="flex gap-3 w-full text-left rounded-lg border-b border-border p-3 hover:bg-gray-100 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted">
                        {(() => {
                          const avatarUser = getAvatarUser(activity)

                          return avatarUser?.profile_url ? (
                            <Image
                              width={40}
                              height={40}
                              src={avatarUser.profile_url}
                              alt={avatarUser.fullname || "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image
                              width={40}
                              height={40}
                              src="/images/icons/admin_profile.svg"
                              alt="Default avatar"
                              className="w-full h-full object-cover"
                            />
                          )
                        })()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">{getActivityMessage(activity)}</p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={cn("text-xs gap-1", getStatusColor(activity.status))}>
                            {getStatusIcon(activity.status)}
                            {activity.status?.replace("_", " ") || "Pending"}
                          </Badge> 
                          <span className="text-xs text-muted-foreground">{timeAgo(activity.created_at)}</span>
                          {activity.version_number && activity.version_number > 1 && (
                            <span className="text-xs text-muted-foreground">v{activity.version_number}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Footer */}
          <div className="pt-3 mt-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setIsOpen(false)
                router.push("/dashboard/task")
              }}
            >
              View All Tasks
            </Button>
          </div>
        </div>
      )}

      {selectedActivity && selectedActivity.folder?.id && selectedActivity.dimension?.id && (
        <TasksModal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          currentUser={user.id}
          folderId={selectedActivity.folder.id}
          dimensionId={selectedActivity.dimension.id}
          folderName={selectedActivity.folder.name}
          isDimensionMember={isDimensionMember}
        />
      )}
    </div>
  )
}
