import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { folderId, newPin, reason } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get admin role
    const { data: adminData } = await supabase.from("admins").select("role_id").eq("id", user.id).single()

    // Only master admin or overall focal person can reset PIN
    const canResetPin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!canResetPin) {
      return NextResponse.json(
        { error: "Only master admins or overall focal persons can reset folder PINs" },
        { status: 403 },
      )
    }

    // Validate new PIN format
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 })
    }

    // Get folder
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("pin")
      .eq("id", folderId)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Hash new PIN
    const hashedNewPin = crypto.createHash("sha256").update(newPin).digest("hex")

    // Update folder PIN
    const { error: updateError } = await supabase
      .from("folders")
      .update({
        pin: hashedNewPin,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log the PIN reset
    await supabase.from("pin_reset_logs").insert({
      folder_id: folderId,
      reset_by: user.id,
      old_pin: folder.pin ? folder.pin.substring(0, 8) : null, // Store partial hash for audit
      new_pin: hashedNewPin.substring(0, 8), // Store partial hash for audit
      reset_reason: reason || "Admin reset",
    })

    // Clear all existing unlock tokens for this folder
    await supabase.from("unlock_tokens").delete().eq("folder_id", folderId)

    return NextResponse.json({
      success: true,
      message: "PIN reset successfully. All active unlock tokens have been cleared.",
    })
  } catch (error: any) {
    console.error("Error resetting PIN:", error)
    return NextResponse.json({ error: error.message || "Failed to reset PIN" }, { status: 500 })
  }
}
