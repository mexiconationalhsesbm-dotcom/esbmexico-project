import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { reviewId, taskId, approve } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader
    const { data: adminData } = await supabase.from("admins").select("role_id").eq("id", user.id).single()

    if (adminData?.role_id !== 4) {
      return NextResponse.json({ error: "Only dimension leaders can approve task reviews" }, { status: 403 })
    }

    // Update review status
    const { error: reviewError } = await supabase
      .from("task_reviews")
      .update({ status: approve ? "approved" : "revision", updated_at: new Date().toISOString() })
      .eq("id", reviewId)

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 500 })
    }

    // If approved, update original task to completed, if not, then revision
    if (approve) {
      const { error: taskError } = await supabase
        .from("folder_tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", taskId)

      if (taskError) {
        return NextResponse.json({ error: taskError.message }, { status: 500 })
      }
    }else{
      const { error: taskError } = await supabase
        .from("folder_tasks")
        .update({ status: "revision", updated_at: new Date().toISOString() })
        .eq("id", taskId)

      if (taskError) {
        return NextResponse.json({ error: taskError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: approve ? "Task review approved" : "Task review result: needs revisions.",
    })
  } catch (error: any) {
    console.error("Error approving review:", error)
    return NextResponse.json({ error: error.message || "Failed to approve review" }, { status: 500 })
  }
}
