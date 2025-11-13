"use client"

import { useCallback, useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import  Button2  from "@/components/ui/button/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { supabase } from "@/libs/supabase"
import type { Admin, RevisionRequest } from "@/types"
import { formatDistanceToNow } from "date-fns"
import Badge from "@/components/ui/badge/Badge"
import Image from "next/image"

interface RevisionRequestWithDetails extends RevisionRequest {
    requester_name?: string
    requester_profile?: string
  requester_email?: string
  item_name?: string
}

interface RevisionTableProps {
  admin: Admin
}

export default function RevisionsTable({admin} :RevisionTableProps) {
  const router = useRouter()
  const [revisions, setRevisions] = useState<RevisionRequestWithDetails[]>([])
  const [filteredRevisions, setFilteredRevisions] = useState<RevisionRequestWithDetails[]>([])
  const [isLoading2, setIsLoading2] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const [processingId, setProcessingId] = useState<number | null>(null)

  const isDimensionLeader = admin?.role_id === 4
  const isMasterAdmin = admin?.role_id === 2
  const assignedDimensionId = admin.assigned_dimension_id

  const fetchRevisions = useCallback(async () => {
    setIsLoading2(true)
    setError(null)

    try {
      let query = supabase
        .from("revision_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (!isMasterAdmin && assignedDimensionId) {
        query = query.eq("dimension_id", assignedDimensionId)
      }

      const { data: revisionData, error: fetchError } = await query
      if (fetchError) throw fetchError

      if (!revisionData || revisionData.length === 0) {
        setRevisions([])
        return
      }

      // 🧩 Extract requester IDs
      const requesterIds = [...new Set(revisionData.map((r) => r.requested_by).filter(Boolean))]

      // 👤 Fetch all admins + teacher info
      const { data: adminTeacherData, error: joinError } = await supabase
        .from("admins")
        .select(`
          id,
          email,
          role_id,
          teachers:teachers!inner (
            id,
            teacher_id,
            fullname,
            profile_url
          )
        `)
        .in("id", requesterIds)

      if (joinError) throw joinError

      const adminTeacherMap = new Map(
        adminTeacherData.map((a) => [
          a.id,
          {
            email: a.email,
            role_id: a.role_id,
            teacher: a.teachers ? a.teachers[0] : null,
          },
        ])
      )

      // 🗂️ Enrich revisions
      const enrichedRevisions = await Promise.all(
        revisionData.map(async (revision) => {
          try {
            let itemName = null
            let itemStatus = null

            if (revision.item_type === "folder") {
              const { data: folderData } = await supabase
                .from("folders")
                .select("name, status")
                .eq("id", revision.item_id)
                .single()
              itemName = folderData?.name
              itemStatus = folderData?.status
            } else if (revision.item_type === "file") {
              const { data: fileData } = await supabase
                .from("files")
                .select("name, status")
                .eq("id", revision.item_id)
                .single()
              itemName = fileData?.name
              itemStatus = fileData?.status
            }

            const requesterInfo = adminTeacherMap.get(revision.requested_by)
            const teacher = requesterInfo?.teacher

            return {
              ...revision,
              item_name: itemName,
              item_status: itemStatus,
              requester_email: requesterInfo?.email,
              requester_name: teacher?.fullname,
              requester_teacher_id: teacher?.teacher_id,
              requester_profile: teacher?.profile_url,
            }
          } catch {
            return { ...revision, item_name: "(Item not found)" }
          }
        })
      )

      setRevisions(enrichedRevisions)
    } catch (err: any) {
      console.error("Error fetching revisions:", err)
      setError(err.message || "Failed to load revision requests")
    } finally {
      setIsLoading2(false)
    }
  }, [isMasterAdmin, assignedDimensionId])

  useEffect(() => {
    if (!isDimensionLeader && !isMasterAdmin) {
      notFound()
    }
    fetchRevisions()
  }, [isDimensionLeader, isMasterAdmin, fetchRevisions])


  useEffect(() => {
    if (filter === "all") {
      setFilteredRevisions(revisions)
    } else {
      setFilteredRevisions(revisions.filter((r) => r.status === filter))
    }
  }, [revisions, filter])

  const handleApprove = async (revisionId: number) => {
    setProcessingId(revisionId)
    try {
      const response = await fetch("/api/folders/approve-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisionRequestId: revisionId,
          approve: true,
          reviewerNotes: "Approved",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve revision")
      }

      router.refresh()
      fetchRevisions()
    } catch (err: any) {
      console.error("Error approving revision:", err)
      alert(err.message || "Failed to approve revision")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (revisionId: number) => {
    setProcessingId(revisionId)
    try {
      const response = await fetch("/api/folders/approve-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisionRequestId: revisionId,
          approve: false,
          reviewerNotes: "Rejected",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject revision")
      }

      router.refresh()
      fetchRevisions()
    } catch (err: any) {
      console.error("Error rejecting revision:", err)
      alert(err.message || "Failed to reject revision")
    } finally {
      setProcessingId(null)
    }
  }

//   if (isLoading) {
//     return <div className="p-6">Loading...</div>
//   }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Revision Requests</h1>
        <p className="text-muted-foreground">Review and manage revision requests from dimension members</p>
      </div>

      {error && (
        // <Alert variant="destructive">
        //   <AlertCircle className="h-4 w-4" />
        //   <AlertDescription>{error}</AlertDescription>
        // </Alert>
        <div>
          <AlertCircle className="h-4 w-4" />
          <div>{error}</div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Pending ({revisions.filter((r) => r.status === "pending").length})
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          onClick={() => setFilter("approved")}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approved ({revisions.filter((r) => r.status === "approved").length})
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          onClick={() => setFilter("rejected")}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Rejected ({revisions.filter((r) => r.status === "rejected").length})
        </Button>
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All ({revisions.length})
        </Button>
      </div>

      {isLoading2 ? (
        <div className="text-center py-8 text-muted-foreground">Loading revision requests...</div>
      ) : filteredRevisions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No {filter !== "all" ? filter : ""} revision requests found
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRevisions.map((revision) => (
            <Card key={revision.id}>
              <CardHeader>
                
                <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <div className="flex flex-row gap-2">
                    <h4 className="font-medium text-sm mb-2">Requested By:</h4>
                    <div className="flex items-center justify-center">
                        <div className="w-15 h-15 flex items-center">
                                <Image
                                src={revision.requester_profile || "/images/icons/admin_profile.svg"}
                                alt={`${revision.requester_name}'s profile`}
                                width={45}
                                height={45}
                                className="w-[45px] h-[45px] rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                onError={(e) => (e.currentTarget.src = "/images/icons/admin_profile.svg")}
                                />
                            </div>
                        <p className="text-sm text-muted-foreground bg-muted rounded">
                            {revision.requester_name}
                            <span className="text-xs text-gray-500">{` (${revision.requester_email})`}</span>
                        </p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <CardTitle className="text-xl">
                        {`${revision.item_type}: ${revision.item_name}`}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                        Requested {formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })}
                        </p>
                    </div>
                  </div>
                  <Badge
                    variant="light"
                    color={
                        revision.status === "pending"
                        ? "warning"
                        : revision.status === "approved"
                            ? "success"
                            : "error"
                    }
                    >
                    {revision.status === "pending" && "Pending"}
                    {revision.status === "approved" && "Approved"}
                    {revision.status === "rejected" && "Rejected"}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Reason for Revision:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {revision.request_reason || "No reason provided"}
                  </p>
                </div>

                {revision.reviewer_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Reviewer Notes:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{revision.reviewer_notes}</p>
                  </div>
                )}

                {revision.status === "pending" && (
                  <div className="flex gap-2 pt-4 items-center">
                    <Button2
                      onClick={() => handleApprove(revision.id)}
                      disabled={processingId === revision.id}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button2>
                    <Button
                      onClick={() => handleReject(revision.id)}
                      disabled={processingId === revision.id}
                      variant="destructive"
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
