import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// export async function GET(request: NextRequest) {
//   try {
//     const supabase = await createClient()
//     const folderId = request.nextUrl.searchParams.get("folderId")

//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     if (!user || !folderId) {
//       return NextResponse.json({ error: "Unauthorized or missing parameters" }, { status: 401 })
//     }

//     // Get tasks for the folder
//     const { data: tasks, error: tasksError } = await supabase
//       .from("folder_tasks")
//       .select("*")
//       .eq("folder_id", Number.parseInt(folderId))

//     if (tasksError) {
//       return NextResponse.json({ error: tasksError.message }, { status: 500 })
//     }

//     return NextResponse.json({ tasks: tasks || [] })
//   } catch (error: any) {
//     console.error("Error fetching tasks:", error)
//     return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 })
//   }
// }


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const folderId = request.nextUrl.searchParams.get("folderId")
    const dimensionId = request.nextUrl.searchParams.get("dimensionId")
    const forLeader = request.nextUrl.searchParams.get("forLeader") === "true"

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current admin info
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    let query = supabase.from("folder_tasks").select(`
      *,
      folders!inner(name),
      dimensions!inner(name)
    `)

    if (folderId) {
      query = query.eq("folder_id", Number.parseInt(folderId))
    }

    if (dimensionId) {
      query = query.eq("dimension_id", Number.parseInt(dimensionId))
    } else if (!isAdmin && adminData?.assigned_dimension_id) {
      // Filter by user's dimension if not admin
      query = query.eq("dimension_id", adminData.assigned_dimension_id)
    }

    const { data: tasks, error: tasksError } = await query.order("created_at", { ascending: false })

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 })
    }

    // For members, filter to only show tasks assigned to them
    let filteredTasks = tasks || []

    if (!isLeader && !isAdmin) {
      // Get user's assignments
      const { data: assignments } = await supabase.from("task_assignments").select("task_id").eq("assigned_to", user.id)

      const assignedTaskIds = assignments?.map((a) => a.task_id) || []
      filteredTasks = filteredTasks.filter((t) => assignedTaskIds.includes(t.id))
    }

    // Get assignments for each task
    const taskIds = filteredTasks.map((t) => t.id)
    const { data: allAssignments } = await supabase
      .from("task_assignments")
      .select(`
        *,
        admins!inner(id, full_name, email)
      `)
      .in("task_id", taskIds)

    // Get submissions count for each assignment
    const assignmentIds = allAssignments?.map((a) => a.id) || []
    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("assignment_id, id")
      .in("assignment_id", assignmentIds)

    // Map assignments and submissions to tasks
    const tasksWithData = filteredTasks.map((task) => {
      const taskAssignments = allAssignments?.filter((a) => a.task_id === task.id) || []
      const assignmentsWithSubmissions = taskAssignments.map((assignment) => ({
        ...assignment,
        assignee_name: assignment.admins?.full_name || assignment.admins?.email,
        submissions_count: submissions?.filter((s) => s.assignment_id === assignment.id).length || 0,
      }))

      return {
        ...task,
        folder_name: task.folders?.name,
        dimension_name: task.dimensions?.name,
        assignments: assignmentsWithSubmissions,
      }
    })

    // Check for overdue tasks and update status
    const now = new Date()
    for (const task of tasksWithData) {
      if (task.due_date && new Date(task.due_date) < now && task.status === "pending") {
        await supabase.from("folder_tasks").update({ status: "missing" }).eq("id", task.id)
        task.status = "missing"

        // Update assignments to missing
        await supabase
          .from("task_assignments")
          .update({ status: "missing" })
          .eq("task_id", task.id)
          .eq("status", "pending")
      }
    }

    return NextResponse.json({ tasks: tasksWithData })
  } catch (error: any) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 })
  }
}

