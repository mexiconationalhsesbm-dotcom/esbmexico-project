import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // ✅ 1️⃣ Get current logged-in leader
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Current user.id:", user.id)

    // ✅ 2️⃣ Fetch all task reviews assigned to this leader
    const { data: reviewTasks, error: taskError } = await supabase
      .from("task_reviews")
      .select(`
        id,
        original_task_id,
        folder_id,
        dimension_id,
        task_title,
        task_description,
        status,
        created_at,
        submitted_by
      `)
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false })
      .filter("status", "not.in", "(revision,approved)")

    if (taskError) throw new Error(taskError.message)
    if (!reviewTasks?.length)
      return NextResponse.json({ tasks: [] }, { status: 200 })

    // ✅ 3️⃣ Collect related IDs
    const folderIds = [
      ...new Set(reviewTasks.map((t) => t.folder_id).filter(Boolean)),
    ]
    const adminIds = [
      ...new Set(reviewTasks.map((t) => t.submitted_by).filter(Boolean)),
    ]
    const dimensionIds = [
      ...new Set(reviewTasks.map((t) => t.dimension_id).filter(Boolean)),
    ]

    // ✅ 4️⃣ Fetch folders
    let folderMap: Record<string, any> = {}
    if (folderIds.length > 0) {
      const { data: folders, error: folderError } = await supabase
        .from("folders")
        .select("id, name, parent_folder_id")
        .in("id", folderIds)

      if (folderError) throw new Error(folderError.message)
      folderMap = Object.fromEntries(folders.map((f) => [f.id, f]))
    }

    // ✅ 5️⃣ Fetch admins (submitters)
    let admins: any[] = []
    if (adminIds.length > 0) {
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id, email, full_name")
        .in("id", adminIds)

      if (adminError) throw new Error(adminError.message)
      admins = adminData || []
    }

    // ✅ 6️⃣ Fetch teachers (join with admins)
    const accountIds = admins.map((a) => a.id).filter(Boolean)
    let teachers: any[] = []
    if (accountIds.length > 0) {
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("account_id, fullname, profile_url")
        .in("account_id", accountIds)

      if (teacherError) throw new Error(teacherError.message)
      teachers = teacherData || []
    }

    // ✅ 7️⃣ Merge admins with their teacher info
    const adminMap: Record<string, any> = Object.fromEntries(
      admins.map((a) => {
        const teacher = teachers.find((t) => t.account_id === a.id)
        return [
          a.id,
          {
            ...a,
            fullname: teacher?.fullname || a.full_name || null,
            profile_url: teacher?.profile_url || null,
          },
        ]
      })
    )

    // ✅ 8️⃣ Fetch dimensions
    let dimensionMap: Record<string, any> = {}
    if (dimensionIds.length > 0) {
      const { data: dimensions, error: dimensionError } = await supabase
        .from("dimensions")
        .select("id, name, slug")
        .in("id", dimensionIds)

      if (dimensionError) throw new Error(dimensionError.message)
      dimensionMap = Object.fromEntries(dimensions.map((d) => [d.id, d]))
    }

    // ✅ 9️⃣ Merge all related data
    const enrichedTasks = reviewTasks.map((task) => ({
      ...task,
      folder: folderMap[task.folder_id] || null,
      submitted_by_admin: adminMap[task.submitted_by] || null,
      dimension: dimensionMap[task.dimension_id] || null,
    }))

    return NextResponse.json({ tasks: enrichedTasks }, { status: 200 })
  } catch (error: any) {
    console.error("❌ Error fetching review tasks:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
