import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { taskId } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader or admin
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2|| adminData?.role_id === 3

    if (!(isLeader || isAdmin)) {
      return NextResponse.json({ error: "You don't have permission to delete tasks" }, { status: 403 })
    }

    // Delete task (cascade will handle task_reviews)
    const { error: deleteError } = await supabase.from("folder_tasks").delete().eq("id", taskId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 })
  }
}
