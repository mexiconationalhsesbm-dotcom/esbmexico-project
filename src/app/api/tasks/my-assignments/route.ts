import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const folderId = request.nextUrl.searchParams.get("folderId")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's assignments with task details
    let query = supabase
      .from("task_assignments")
      .select(`
        *,
        folder_tasks!inner(
          id,
          folder_id,
          dimension_id,
          title,
          description,
          required_file_type,
          due_date,
          status,
          created_at
        )
      `)
      .eq("assigned_to", user.id)

    if (folderId) {
      query = query.eq("folder_tasks.folder_id", Number.parseInt(folderId))
    }

    const { data: assignments, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get submissions for each assignment
    const assignmentIds = assignments?.map((a) => a.id) || []
    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("*")
      .in("assignment_id", assignmentIds)
      .order("version_number", { ascending: false })

    // Map submissions to assignments
    const assignmentsWithSubmissions =
      assignments?.map((assignment) => ({
        ...assignment,
        task: assignment.folder_tasks,
        submissions: submissions?.filter((s) => s.assignment_id === assignment.id) || [],
      })) || []

    return NextResponse.json({ assignments: assignmentsWithSubmissions })
  } catch (error: any) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch assignments" }, { status: 500 })
  }
}
