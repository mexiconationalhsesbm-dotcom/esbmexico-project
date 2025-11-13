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

    // Get user's role and dimension
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const isLeader = adminData.role_id === 4
    const isAdmin = adminData.role_id === 2|| adminData.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ count: 0 })
    }

    // Query pending revision requests
    let query = supabase.from("revision_requests").select("id", { count: "exact" }).eq("status", "pending")

    if (!isAdmin && adminData.assigned_dimension_id) {
      query = query.eq("dimension_id", adminData.assigned_dimension_id)
    }

    const { count, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    console.error("Error fetching pending revisions count:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch pending count" }, { status: 500 })
  }
}
