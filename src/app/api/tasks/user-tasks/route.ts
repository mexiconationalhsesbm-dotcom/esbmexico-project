import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Step 1: Get all tasks assigned to this admin or to everyone
  const { data: tasks, error: tasksError } = await supabase
    .from("folder_tasks")
    .select("*")
    .or(`assigned_to_admins.cs.{${user.id}},assigned_to_everyone.eq.true`)
    .order("created_at", { ascending: false })

  if (tasksError) {
    console.error("Error fetching user tasks:", tasksError)
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  // Step 2: Collect all related IDs
  const folderIds = [...new Set(tasks.map((t) => t.folder_id))]
  const dimensionIds = [...new Set(tasks.map((t) => t.dimension_id))]
  const adminIds = [...new Set(tasks.map((t) => t.created_by))]

  // Step 3: Fetch related data
  const [{ data: folders }, { data: dimensions }, { data: admins }] = await Promise.all([
    supabase.from("folders").select("id, name, parent_folder_id").in("id", folderIds),
    supabase.from("dimensions").select("id, name, slug").in("id", dimensionIds),
    supabase.from("admins").select("id, email").in("id", adminIds),
  ])

  // Step 4: Join teachers using admins.id = teachers.account_id
  const accountIds = admins?.map((a) => a.id).filter(Boolean) || []
  const { data: teachers, error: teacherError } = await supabase
    .from("teachers")
    .select("account_id, fullname, profile_url")
    .in("account_id", accountIds)

  if (teacherError) {
    console.error("Error fetching teacher info:", teacherError)
  }

  // Step 5: Merge all related data
  const enrichedTasks = tasks.map((t) => {
    const admin = admins?.find((a) => a.id === t.created_by)
    const teacher = teachers?.find((te) => te.account_id === admin?.id)

    return {
      ...t,
      folder: folders?.find((f) => f.id === t.folder_id) || null,
      dimension: dimensions?.find((d) => d.id === t.dimension_id) || null,
      created_by: teacher
        ? {
            ...admin,
            fullname: teacher.fullname,
            profile_url: teacher.profile_url,
          }
        : admin || null,
    }
  })

  return NextResponse.json({ tasks: enrichedTasks })
}
