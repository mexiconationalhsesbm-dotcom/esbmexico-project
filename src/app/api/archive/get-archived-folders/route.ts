import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dimensionId = searchParams.get("dimensionId")
    const search = searchParams.get("search")

    // Get admin info to check permissions
    const { data: admin } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    let query = supabase
      .from("archived_folders")
      .select("id, folder_id, folder_name, dimension_id, original_folder_structure, archived_at, storage_url)")

    // Filter by dimension if provided and user has access
    if (dimensionId) {
      if (
        admin.role_id !== 2 &&
        admin.role_id !== 3 &&
        admin.assigned_dimension_id !== Number(dimensionId)
      ) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      query = query.eq("dimension_id", Number(dimensionId))
    } else if (admin.role_id !== 2 && admin.role_id !== 3) {
      query = query.eq("dimension_id", admin.assigned_dimension_id)
    }

    // Apply search filter
    if (search) {
      query = query.ilike("folder_name", `%${search}%`)
    }

    const { data: folders, error } = await query.order("archived_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ folders })
  } catch (error: any) {
    console.error("Error fetching archived folders:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch archived folders" }, { status: 500 })
  }
}
