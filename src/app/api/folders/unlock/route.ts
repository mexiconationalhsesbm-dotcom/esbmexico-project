import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import crypto from "crypto"

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { folderId, pin } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get folder
    const { data: folder, error: folderError } = await supabase.from("folders").select("*").eq("id", folderId).single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    if (!folder.is_locked) {
      return NextResponse.json({ error: "Folder is not locked" }, { status: 400 })
    }

    // Verify PIN
    const hashedPin = crypto.createHash("sha256").update(pin).digest("hex")

    if (hashedPin !== folder.pin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
    }

    // Generate unlock token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store unlock token
    const { error: tokenError } = await supabase.from("unlock_tokens").insert({
      folder_id: folderId,
      user_id: user.id,
      token: token,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      return NextResponse.json({ error: tokenError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token: token,
      expiresAt: expiresAt.toISOString(),
      message: "Folder unlocked successfully",
    })
  } catch (error: any) {
    console.error("Error unlocking folder:", error)
    return NextResponse.json({ error: error.message || "Failed to unlock folder" }, { status: 500 })
  }
}
