import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // ✅ Get the currently logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Fetch their admin record
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, full_name, role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    if (error || !admin) {
      throw new Error("Admin profile not found")
    }

    return NextResponse.json({ admin })
  } catch (error: any) {
    console.error("Error fetching admin profile:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin profile" },
      { status: 500 },
    )
  }
}
