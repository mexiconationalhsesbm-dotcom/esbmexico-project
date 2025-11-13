import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { folderId, targetParentFolderId } = await request.json()

    if (!folderId) {
      return NextResponse.json({ error: "Missing folder ID" }, { status: 400 })
    }

    // Check if the target folder is a child of the folder being moved (prevent circular references)
    if (targetParentFolderId) {
      const { data: targetFolder, error: fetchError } = await supabaseAdmin
        .from("folders")
        .select("*")
        .eq("id", targetParentFolderId)
        .single()

      if (fetchError || !targetFolder) {
        return NextResponse.json({ error: "Target folder not found" }, { status: 404 })
      }

      // Simple check: prevent moving a folder into itself
      if (targetParentFolderId === folderId) {
        return NextResponse.json({ error: "Cannot move a folder into itself" }, { status: 400 })
      }
    }

    // Update the folder's parent_folder_id
    const { data: updatedFolder, error: updateError } = await supabaseAdmin
      .from("folders")
      .update({
        parent_folder_id: targetParentFolderId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, folder: updatedFolder })
  } catch (error: any) {
    console.error("Error moving folder:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
