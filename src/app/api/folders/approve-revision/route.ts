import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { revisionRequestId, approve, reviewerNotes } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders can approve revision requests" }, { status: 403 })
    }

    // Get revision request
    const { data: revisionRequest, error: requestError } = await supabase
      .from("revision_requests")
      .select("*")
      .eq("id", revisionRequestId)
      .single()

    if (requestError || !revisionRequest) {
      return NextResponse.json({ error: "Revision request not found" }, { status: 404 })
    }

    if (!isAdmin && revisionRequest.dimension_id !== adminData?.assigned_dimension_id) {
      return NextResponse.json({ error: "You can only review requests for your dimension" }, { status: 403 })
    }

    // Update revision request status
    const newStatus = approve ? "approved" : "rejected"

    const { error: updateError } = await supabase
      .from("revision_requests")
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewer_notes: reviewerNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", revisionRequestId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If approved, update item status to "revisions"
    if (approve) {
      if (revisionRequest.item_type === "folder") {
        await supabase
          .from("folders")
          .update({ status: "revisions", updated_at: new Date().toISOString() })
          .eq("id", revisionRequest.item_id)
      } else if (revisionRequest.item_type === "file") {
        await supabase
          .from("files")
          .update({ status: "revisions", updated_at: new Date().toISOString() })
          .eq("id", revisionRequest.item_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Revision request ${newStatus}`,
    })
  } catch (error: any) {
    console.error("Error approving/rejecting revision:", error)
    return NextResponse.json({ error: error.message || "Failed to process revision request" }, { status: 500 })
  }
}
