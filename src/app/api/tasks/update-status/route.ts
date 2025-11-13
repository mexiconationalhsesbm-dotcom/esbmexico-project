import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { taskId, newStatus } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If marking as completed, create a review task
    if (newStatus === "completed") {
      // Get the original task
      const { data: originalTask } = await supabase.from("folder_tasks").select("*").eq("id", taskId).single()

      if (!originalTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }

      // Get the dimension leader
      const { data: leader } = await supabase
        .from("admins")
        .select("id")
        .eq("role_id", 4)
        .eq("assigned_dimension_id", originalTask.dimension_id)
        .single()

      if (!leader) {
        return NextResponse.json({ error: "Dimension leader not found" }, { status: 404 })
      }

      // Create review task for leader
      const { error: reviewError } = await supabase.from("task_reviews").insert({
        original_task_id: taskId,
        folder_id: originalTask.folder_id,
        dimension_id: originalTask.dimension_id,
        review_type: "review",
        assigned_to: leader.id,
        submitted_by: user.id,
        task_title: `Checking of Task: ${originalTask.title}`,
        task_description: originalTask.description,
        status: "pending",
      })

      if (reviewError) {
        return NextResponse.json({ error: reviewError.message }, { status: 500 })
      }

      // Update original task status to pending (waiting for review)
      const { error: updateError } = await supabase
        .from("folder_tasks")
        .update({ status: "for checking", updated_at: new Date().toISOString() })
        .eq("id", taskId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Task status updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating task status:", error)
    return NextResponse.json({ error: error.message || "Failed to update task status" }, { status: 500 })
  }
}
