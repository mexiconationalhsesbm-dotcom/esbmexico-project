import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { submissionId, tag, comment } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader or admin
    const { data: adminData } = await supabase.from("admins").select("role_id").eq("id", user.id).single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders can review submissions" }, { status: 403 })
    }

    // Update the submission with review
    const { data: submission, error: updateError } = await supabase
      .from("task_submissions")
      .update({
        leader_tag: tag,
        leader_comment: comment || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select("*, task_assignments(*)")
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update assignment status based on tag
    if (submission?.task_assignments) {
      let newStatus = "submitted"
      if (tag === "accepted") {
        newStatus = "completed"
      } else if (tag === "for_revision") {
        newStatus = "for_revision"
      } else if (tag === "rejected") {
        newStatus = "pending"
      }

      await supabase
        .from("task_assignments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", submission.task_assignments.id)

      // Check if all assignments are completed to update task status
      if (tag === "accepted") {
        const { data: allAssignments } = await supabase
          .from("task_assignments")
          .select("status")
          .eq("task_id", submission.task_id)

        const allCompleted = allAssignments?.every((a) => a.status === "completed")
        if (allCompleted) {
          await supabase
            .from("folder_tasks")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", submission.task_id)
        }
      }
    }

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    console.error("Error reviewing submission:", error)
    return NextResponse.json({ error: error.message || "Failed to review submission" }, { status: 500 })
  }
}
