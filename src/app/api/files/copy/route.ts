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

    // Get the original file
    const { data: originalFile, error: fetchError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single()

    if (fetchError || !originalFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Create a new file record with the same data but in the target folder
    const newFileName = `Copy of ${originalFile.name}`
    const { data: newFile, error: createError } = await supabaseAdmin
      .from("files")
      .insert({
        name: newFileName,
        file_path: originalFile.file_path,
        file_type: originalFile.file_type,
        file_size: originalFile.file_size,
        dimension_id: originalFile.dimension_id,
        folder_id: targetFolderId || null,
        uploaded_by: originalFile.uploaded_by,
        public_url: originalFile.public_url,
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: newFile })
  } catch (error: any) {
    console.error("Error copying file:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
