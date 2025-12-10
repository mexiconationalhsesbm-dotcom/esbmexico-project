import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const status = request.nextUrl.searchParams.get("status")

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
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders can access this" }, { status: 403 })
    }

    // Fetch tasks
    let query = supabase.from("folder_tasks").select(`
      *,
      folders!inner(name),
      dimensions!inner(name)
    `)

    if (!isAdmin && adminData?.assigned_dimension_id) {
      query = query.eq("dimension_id", adminData.assigned_dimension_id)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: tasks, error: tasksError } = await query.order("created_at", { ascending: false })

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 })
    }

    const taskIds = tasks?.map((t) => t.id) || []

    // Fetch assignments (each row = one admin)
    const { data: assignments } = await supabase
      .from("task_assignments")
      .select("*")
      .in("task_id", taskIds.length ? taskIds : [-1])

    // Collect IDs of all assigned admins
    const adminIds = [...new Set(assignments?.map(a => a.assigned_to) || [])]

    // Fetch admin profiles
    const { data: adminProfiles } = await supabase
      .from("admins")
      .select("id, full_name, email")
      .in("id", adminIds.length ? adminIds : [-1])

    const adminMap = Object.fromEntries(
      (adminProfiles || []).map(a => [a.id, a])
    )

    // Fetch submissions
    const assignmentIds = assignments?.map((a) => a.id) || []

    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("assignment_id")
      .in("assignment_id", assignmentIds.length ? assignmentIds : [-1])

    // Fetch admins grouped by dimension
    const dimensionIds = [...new Set(tasks?.map((t) => t.dimension_id) || [])]

    const { data: dimensionAdmins } = await supabase
      .from("admins")
      .select("id, assigned_dimension_id")
      .in("assigned_dimension_id", dimensionIds.length ? dimensionIds : [-1])

    // Build final task object
    const tasksWithDetails =
      tasks?.map((task) => {
        const taskAssignments =
          assignments?.filter((a) => a.task_id === task.id) || []

        // list of admin IDs assigned to this task
        const assignedIds = taskAssignments.map(a => a.assigned_to)

        const allMembersForDimension =
          dimensionAdmins?.filter((d) => d.assigned_dimension_id === task.dimension_id) || []

        const allMemberIds = allMembersForDimension.map((m) => m.id)

        const isAssignedToAll =
          allMemberIds.length > 0 &&
          allMemberIds.every((id: string) => assignedIds.includes(id))

        return {
          ...task,
          folder_name: task.folders?.name,
          dimension_name: task.dimensions?.name,
          total_assigned: taskAssignments.length,
          is_assigned_to_all: isAssignedToAll,

          assignee_names: assignedIds.map((id: string) => ({
            id,
            name: adminMap[id]?.full_name || adminMap[id]?.email
          })),

          assignments: taskAssignments.map((a) => ({
            ...a,
            assigned_to: {
              id: a.assigned_to,
              name: adminMap[a.assigned_to]?.full_name || adminMap[a.assigned_to]?.email
            },
            has_submissions: submissions?.some((s) => s.assignment_id === a.id),
          })),
        }
      }) || []

    // Mark overdue tasks as missing
    const now = new Date()
    for (const task of tasksWithDetails) {
      if (task.due_date && new Date(task.due_date) < now && task.status === "pending") {
        await supabase.from("folder_tasks").update({ status: "missing" }).eq("id", task.id)
        task.status = "missing"
      }
    }

    return NextResponse.json({ tasks: tasksWithDetails })
  } catch (error: any) {
    console.error("Error fetching leader overview:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 })
  }
}
  