import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { fileId, targetFolderId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 })
    }

    // Update the file's folder_id
    const { data: updatedFile, error: updateError } = await supabaseAdmin
      .from("files")
      .update({
        folder_id: targetFolderId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: updatedFile })
  } catch (error: any) {
    console.error("Error moving file:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
