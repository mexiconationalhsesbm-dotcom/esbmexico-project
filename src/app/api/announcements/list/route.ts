import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's role to filter announcements based on visibility
    const { data: admin } = await supabase.from("admins").select("role_id").eq("id", user.id).single()

    let query = supabase
      .from("announcements")
      .select(
        `
        id,
        title,
        content,
        visibility,
        is_active,
        created_at,
        expires_at,
        created_by
      `,
      )
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })

    // Filter by visibility based on user role
    if (admin && [2, 3, 4].includes(admin.role_id)) {
      query = query.in("visibility", ["all", "leaders"])
    } else {
      query = query.eq("visibility", "all")
    }

    const { data: announcements, error: listError } = await query

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    return NextResponse.json({ announcements: announcements  || [] })
  } catch (error: any) {
    console.error("Error listing announcements:", error)
    return NextResponse.json({ error: error.message || "Failed to list announcements" }, { status: 500 })
  }
}
