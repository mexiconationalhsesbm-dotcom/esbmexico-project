import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders can access this" }, { status: 403 })
    }

    let taskIds: string[] = []

    // 🔹 Leaders only see tasks inside their dimension
    if (!isAdmin && adminData?.assigned_dimension_id) {
      const { data: tasksInDimension, error: dimErr } = await supabase
        .from("folder_tasks")
        .select("id")
        .eq("dimension_id", adminData.assigned_dimension_id)

      if (dimErr) {
        return NextResponse.json({ error: dimErr.message }, { status: 500 })
      }

      taskIds = tasksInDimension?.map((t) => t.id) || []
    }

    // 🔹 Build the assignment query
    let assignmentQuery = supabase
      .from("task_assignments")
      .select("status, task_id")

    // Apply filter ONLY for leaders
    if (!isAdmin && taskIds.length > 0) {
      assignmentQuery = assignmentQuery.in("task_id", taskIds)
    }

    const { data: assignments, error } = await assignmentQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 🔥 Summary counts
    const totalAssigned = assignments.length

    const pending = assignments.filter(
      (a) => a.status === "pending" || a.status === "missing"
    ).length

    const submitted = assignments.filter(
      (a) => a.status === "submitted" || a.status === "for_revision"
    ).length

    const completed = assignments.filter((a) => a.status === "completed").length

    return NextResponse.json({
      total_assigned: totalAssigned,
      pending,
      submitted,
      completed,
    })
  } catch (error: any) {
    console.error("Summary error:", error)
    return NextResponse.json({ error: error.message || "Failed to load summary" }, { status: 500 })
  }
}
