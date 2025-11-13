import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { announcementId } = await request.json()

    if (!announcementId) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 })
    }

    const { error: dismissError } = await supabase.from("announcement_dismissals").insert({
      announcement_id: announcementId,
      user_id: user.id,
    })

    if (dismissError && !dismissError.message.includes("duplicate")) {
      return NextResponse.json({ error: dismissError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error dismissing announcement:", error)
    return NextResponse.json({ error: error.message || "Failed to dismiss announcement" }, { status: 500 })
  }
}
