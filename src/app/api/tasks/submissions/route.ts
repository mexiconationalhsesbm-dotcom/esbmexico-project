import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const taskId = request.nextUrl.searchParams.get("taskId")
    const assignmentId = request.nextUrl.searchParams.get("assignmentId")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase.from("task_submissions").select(`
      *,
      admins (
        id,
        full_name,
        email
      )
    `)


    if (taskId) {
      query = query.eq("task_id", Number.parseInt(taskId))
    }

    if (assignmentId) {
      query = query.eq("assignment_id", Number.parseInt(assignmentId))
    }

    const { data: submissions, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const submissionsWithNames =
      submissions?.map((s) => ({
        ...s,
        submitter_name: s.admins?.full_name || s.admins?.email,
        submitter_email: s.admins?.email,
      })) || []

    return NextResponse.json({ submissions: submissionsWithNames })
  } catch (error: any) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status: 500 })
  }
}
