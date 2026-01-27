import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logTaskActivity } from "@/libs/task-activity-logger"

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

    // 🔐 Permission check
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin record not found" }, { status: 403 })
    }

    const isLeader = adminData.role_id === 4
    const isAdmin = adminData.role_id === 2 || adminData.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to create tasks" },
        { status: 403 }
      )
    }

    // 📌 Resolve assignees FIRST
    let resolvedAdminIds: string[] = []

    if (assignedToEveryone) {
      // Fetch ALL admins/members in this dimension
      const { data: dimensionAdmins, error } = await supabase
        .from("admins")
        .select("id")
        .eq("assigned_dimension_id", dimensionId)
        .eq("role_id", 5)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      resolvedAdminIds = dimensionAdmins?.map(a => a.id) ?? []
    } else if (Array.isArray(assignedToAdmins) && assignedToAdmins.length > 0) {
      resolvedAdminIds = assignedToAdmins.map(String)
    }

    if (resolvedAdminIds.length === 0) {
      return NextResponse.json(
        { error: "No assignees resolved for this task" },
        { status: 400 }
      )
    }

    // 📌 Create the task (NO assigned_to_everyone)
    const { data: task, error: taskError } = await supabase
      .from("folder_tasks")
      .insert({
        folder_id: folderId,
        dimension_id: dimensionId,
        title,
        description: description || null,
        required_file_type: requiredFileType || null,
        due_date: dueDate || null,
        assigned_to_admins: resolvedAdminIds,
        created_by: user.id,
      })
      .select()
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: taskError?.message || "Failed to create task" },
        { status: 500 }
      )
    }

    const { data: folderData } = await supabase
        .from("folders")
        .select("name")
        .eq("id", folderId)
        .single()

    const folder_name = folderData?.name

    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      : null;

    const dueDateText = formattedDueDate
  ? `due ${formattedDueDate}`
  : 'with no due date';

    await logTaskActivity({
      taskId: task.id,
      folderId,
      dimensionId,
      action: "Task Creation",
      actorId: user.id,
      actorRole: "Dimension Leader",
      description: `Created task "${title}" in folder ${folder_name} ${dueDateText}`,
      remarks: "Created",
      due: dueDate,
      metadata: {
        dueDate,
        assignedToEveryone,
        assignmentCount: assignedToAdmins?.length || 0,
      },
    })

    // 📌 Create task assignments (REAL rows only)
    const assignments = resolvedAdminIds.map(adminId => ({
      task_id: task.id,
      assigned_to: adminId,
      status: "pending",
    }))

    const { error: assignmentError } = await supabase
      .from("task_assignments")
      .insert(assignments)

    if (assignmentError) {
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
    })
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    )
  }
}
