import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 })
    }

    // First, get the file to find its storage path
    const { data: file, error: fetchError } = await supabaseAdmin.from("files").select("*").eq("id", id).single()

    if (fetchError) {
      console.error("Error fetching file:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const { error: trashError } = await supabaseAdmin.from("trash").insert({
      item_id: file.id,
      item_type: "file",
      item_name: file.name,
      dimension_id: file.dimension_id,
      file_path: file.file_path,
      file_size: file.file_size,
      file_type: file.file_type,
      public_url: file.public_url,
      original_folder_id: file.folder_id,
    })

    if (trashError) {
      console.error("Error moving file to trash:", trashError)
      return NextResponse.json({ error: trashError.message }, { status: 500 })
    }

    // Delete the file record from the database
    const { error: deleteError } = await supabaseAdmin.from("files").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting file from database:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
