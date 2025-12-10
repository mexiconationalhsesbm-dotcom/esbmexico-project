import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { taskId, title, description, requiredFileType, dueDate } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader or admin
    const { data: adminData } = await supabase.from("admins").select("role").eq("id", user.id).single()

    const isLeader = adminData?.role === "dimension_leader"
    const isAdmin = adminData?.role === "master_admin" || adminData?.role === "overall_focal_person"

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders can update tasks" }, { status: 403 })
    }

    const { data: task, error: updateError } = await supabase
      .from("folder_tasks")
      .update({
        title,
        description: description || null,
        required_file_type: requiredFileType || null,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 })
  }
}
