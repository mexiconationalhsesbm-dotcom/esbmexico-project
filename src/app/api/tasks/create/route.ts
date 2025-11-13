import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { folderId, dimensionId, title, description, assignedToAdmins, assignedToEveryone } = await request.json()

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
    const isInSameDimension = adminData?.assigned_dimension_id === dimensionId

    if (!(isLeader || isAdmin) || !isInSameDimension) {
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
        assigned_to_admins: assignedToEveryone ? [] : assignedToAdmins || [],
        assigned_to_everyone: assignedToEveryone || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 })
  }
}
