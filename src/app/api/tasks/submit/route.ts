import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const taskId = formData.get("taskId") as string
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!taskId || !file || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: adminData } = await supabaseAdmin.from("admins").select("full_name, role_id").eq("id", userId).single()

    const admin = adminData?.full_name

    // Get the task to check file type requirements
    const { data: task, error: taskError } = await supabaseAdmin
      .from("folder_tasks")
      .select("*, folders(dimension_id)")
      .eq("id", Number.parseInt(taskId))
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if task is overdue
    if (task.due_date && new Date(task.due_date) < new Date()) {
      return NextResponse.json({ error: "This task is past its due date" }, { status: 400 })
    }

    // ✅ Validate file type if required (fixed)
    if (task.required_file_type) {
      const allowed = task.required_file_type
        .split(",")
        .map((t: string) => t.trim().toLowerCase().replace(/^\./, "")) // normalize

      const fileName = file.name
      const fileExt = (fileName.split(".").pop() || "").toLowerCase()
      const mime = (file.type || "").toLowerCase()

      const matchesExt = allowed.includes(fileExt)
      const matchesMime = allowed.some((t: string) => t.includes("/") && t === mime)

      if (!matchesExt && !matchesMime) {
        return NextResponse.json(
          { error: `Invalid file type. Required: ${task.required_file_type}` },
          { status: 400 }
        )
      }
    }

    // Get or create assignment
    let { data: assignment } = await supabaseAdmin
      .from("task_assignments")
      .select("*")
      .eq("task_id", Number.parseInt(taskId))
      .eq("assigned_to", userId)
      .single()

    if (!assignment) {
      const { data: newAssignment, error: assignmentError } = await supabaseAdmin
        .from("task_assignments")
        .insert({
          task_id: Number.parseInt(taskId),
          assigned_to: userId,
          status: "pending",
        })
        .select()
        .single()

      if (assignmentError) {
        return NextResponse.json({ error: assignmentError.message }, { status: 500 })
      }
      assignment = newAssignment
    }

    // Get current version number
    const { data: existingSubmissions } = await supabaseAdmin
      .from("task_submissions")
      .select("version_number")
      .eq("assignment_id", assignment.id)
      .order("version_number", { ascending: false })
      .limit(1)

    const nextVersion = (existingSubmissions?.[0]?.version_number || 0) + 1

    const dimensionId = task.folders?.dimension_id
    if (!dimensionId) {
      return NextResponse.json({ error: "Missing dimension ID" }, { status: 400 })
    }

    // Upload file to storage
    const fileExt = file.name.split(".").pop()
    const originalName = file.name.replace(/\.[^/.]+$/, "")
    const fileName = `${admin}_${originalName}_v${nextVersion}.${fileExt}`
    const filePath = `${dimensionId}/${task.folder_id || "root"}/task_files/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("files")
      .upload(filePath, file, { upsert: true, cacheControl: "3600" })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("files").getPublicUrl(filePath)

    // Create submission record
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("task_submissions")
      .insert({
        task_id: Number.parseInt(taskId),
        assignment_id: assignment.id,
        submitted_by: userId,
        version_number: nextVersion,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        public_url: urlData?.publicUrl || null,
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    // Update assignment status to submitted
    await supabaseAdmin
      .from("task_assignments")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", assignment.id)

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    console.error("Error submitting task:", error)
    return NextResponse.json({ error: error.message || "Failed to submit task" }, { status: 500 })
  }
}
