import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { folderId, token } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if valid unlock token exists
    const { data: unlockToken, error } = await supabase
      .from("unlock_tokens")
      .select("*")
      .eq("folder_id", folderId)
      .eq("user_id", user.id)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !unlockToken) {
      return NextResponse.json({ error: "Invalid or expired unlock token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      isUnlocked: true,
    })
  } catch (error: any) {
    console.error("Error verifying unlock token:", error)
    return NextResponse.json({ error: error.message || "Failed to verify token" }, { status: 500 })
  }
}
