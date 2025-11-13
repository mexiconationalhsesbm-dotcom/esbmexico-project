import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"


export async function POST(request: Request) {

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Check if user is admin or OFP
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("role_id")
      .eq("id", user.id)
      .single()

    if (adminError || !admin || ![2, 3].includes(admin.role_id)) {
      return NextResponse.json({ error: "Forbidden: Only admins and OFP can create announcements" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, visibility = "all", expiresAt } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const { data: announcement, error: createError } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        visibility,
        created_by: user.id,
        expires_at: expiresAt || null,
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json(announcement)
}
