import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const taskId = url.searchParams.get("taskId")

  // Convert to number
  const taskIdNum = parseInt(taskId ?? "", 10)
  if (isNaN(taskIdNum)) {
    return NextResponse.json(
      { error: "Valid taskId query parameter is required" },
      { status: 400 }
    )
  }

  // Fetch assigned admin IDs
  const { data, error } = await supabase
    .from("task_assignments")
    .select("assigned_to")
    .eq("task_id", taskIdNum)

  if (error) {
    console.error("Supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    assignees: (data ?? []).map((row) => ({ id: row.assigned_to })),
  })
}
