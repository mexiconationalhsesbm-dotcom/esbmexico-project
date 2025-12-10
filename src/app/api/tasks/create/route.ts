import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// export async function POST(request: NextRequest) {
//   try {
//     const supabase = await createClient()
//     const { folderId, dimensionId, title, description, assignedToAdmins, assignedToEveryone } = await request.json()

//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     // Check if user is a leader or master admin
//     const { data: adminData } = await supabase
//       .from("admins")
//       .select("role_id, assigned_dimension_id")
//       .eq("id", user.id)
//       .single()

//     const isLeader = adminData?.role_id === 4
//     const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3
//     const isInSameDimension = adminData?.assigned_dimension_id === dimensionId

//     if (!(isLeader || isAdmin) || !isInSameDimension) {
//       return NextResponse.json({ error: "You don't have permission to create tasks" }, { status: 403 })
//     }

//     // Create the task
//     const { data: task, error: taskError } = await supabase
//       .from("folder_tasks")
//       .insert({
//         folder_id: folderId,
//         dimension_id: dimensionId,
//         title,
//         description: description || null,
//         assigned_to_admins: assignedToEveryone ? [] : assignedToAdmins || [],
//         assigned_to_everyone: assignedToEveryone || false,
//         created_by: user.id,
//       })
//       .select()
//       .single()

//     if (taskError) {
//       return NextResponse.json({ error: taskError.message }, { status: 500 })
//     }

//     return NextResponse.json({ success: true, task })
//   } catch (error: any) {
//     console.error("Error creating task:", error)
//     return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 })
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      folderId,
      dimensionId,
      title,
      description,
      requiredFileType,
      dueDate,
      assignedToAdmins,
      assignedToEveryone,
    } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader or master admin
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!(isLeader || isAdmin)) {
      return NextResponse.json({ error: "You don't have permission to create tasks" }, { status: 403 })
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from("folder_tasks")
      .insert({
        folder_id: folderId,
        dimension_id: dimensionId,
        title,
        description: description || null,
        required_file_type: requiredFileType || null,
        due_date: dueDate || null,
        assigned_to_admins: assignedToEveryone ? [] : assignedToAdmins || [],
        assigned_to_everyone: assignedToEveryone || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }

    // Create task assignments for each assigned admin
    let assigneeIds: string[] = []

    if (assignedToEveryone) {
      // Get all members in the dimension
      const { data: dimensionMembers } = await supabase
        .from("admins")
        .select("id")
        .eq("assigned_dimension_id", dimensionId)
        .in("role_id", [5])

      assigneeIds = dimensionMembers?.map((m) => m.id) || []
    } else if (assignedToAdmins && assignedToAdmins.length > 0) {
      // Get user IDs from admin IDs
      const { data: admins } = await supabase.from("admins").select("id").in("id", assignedToAdmins.map(String))

      assigneeIds = admins?.map((a) => a.id) || []
    }

    // Create assignments
    if (assigneeIds.length > 0) {
      const assignments = assigneeIds.map((userId) => ({
        task_id: task.id,
        assigned_to: userId,
        status: "pending",
      }))

      await supabase.from("task_assignments").insert(assignments)
    }

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 })
  }
}

