import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")

    if (!folderId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role
    const { data: adminData } = await supabase.from("admins").select("role_id").eq("id", user.id).single()

    if (!adminData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Higher roles never see locked folders
    if (
      adminData.role_id === 2||
      adminData.role_id === 3||
      adminData.role_id === 4
    ) {
      return NextResponse.json({ isLocked: false })
    }

    // For dimension members, check if they have any task assignments in this folder
    const { data: assignments } = await supabase
      .from("task_assignments")
      .select("id, folder_tasks!inner(folder_id)")
      .eq("assigned_to", user.id)
      .eq("folder_tasks.folder_id", Number.parseInt(folderId))
      .limit(1)

    // If no assignments found, the folder is locked
    const isLocked = !assignments || assignments.length === 0

    return NextResponse.json({ isLocked })
  } catch (error: any) {
    console.error("Error checking folder access:", error)
    return NextResponse.json({ error: error.message || "Failed to check folder access" }, { status: 500 })
  }
}
