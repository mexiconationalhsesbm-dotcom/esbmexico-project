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
      .from("folders")
      .select("id, name, dimension_id, parent_folder_id, for_archiving, local_archive, cloud_archive, dimensions(name)")
      .eq("for_archiving", true)
      .is("parent_folder_id", null) // Only root folders

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
      // Dimension members/leaders can only see their dimension
      query = query.eq("dimension_id", admin.assigned_dimension_id)
    }

    const { data: folders, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ folders })
  } catch (error: any) {
    console.error("Error fetching archiving folders:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch archiving folders" }, { status: 500 })
  }
}
