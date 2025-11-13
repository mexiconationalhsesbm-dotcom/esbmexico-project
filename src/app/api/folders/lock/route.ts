import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import crypto from "crypto"

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

    // Validate PIN format (6 digits)
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 })
    }

    // Get folder and check permissions
    const { data: folder, error: folderError } = await supabase.from("folders").select("*").eq("id", folderId).single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Check if user has permission (only uploaders and admins can lock)
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    const canLock =
      adminData?.role_id === 2 ||
      adminData?.role_id === 3 ||
      (adminData?.role_id === 4 && adminData?.assigned_dimension_id === folder.dimension_id) ||
      (adminData?.role_id === 5 && adminData?.assigned_dimension_id === folder.dimension_id)

    if (!canLock) {
      return NextResponse.json({ error: "You don't have permission to lock this folder" }, { status: 403 })
    }

    // Hash the PIN (using simple hash for storage)
    const hashedPin = crypto.createHash("sha256").update(pin).digest("hex")

    // Update folder with PIN and locked status
    const { error: updateError } = await supabase
      .from("folders")
      .update({
        pin: hashedPin,
        is_locked: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Folder locked successfully",
    })
  } catch (error: any) {
    console.error("Error locking folder:", error)
    return NextResponse.json({ error: error.message || "Failed to lock folder" }, { status: 500 })
  }
}
