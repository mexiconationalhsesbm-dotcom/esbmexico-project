import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const folderId = request.nextUrl.searchParams.get("folderId")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !folderId) {
      return NextResponse.json({ error: "Unauthorized or missing parameters" }, { status: 401 })
    }

    // Get tasks for the folder
    const { data: tasks, error: tasksError } = await supabase
      .from("folder_tasks")
      .select("*")
      .eq("folder_id", Number.parseInt(folderId))

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: tasks || [] })
  } catch (error: any) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 })
  }
}
