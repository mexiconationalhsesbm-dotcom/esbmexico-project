import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { trashId } = await request.json()

    if (!trashId) {
      return NextResponse.json({ error: "Missing trash ID" }, { status: 400 })
    }

    // Get the trash item
    const { data: trashItem, error: fetchError } = await supabaseAdmin
      .from("trash")
      .select("*")
      .eq("id", trashId)
      .single()

    if (fetchError || !trashItem) {
      return NextResponse.json({ error: "Trash item not found" }, { status: 404 })
    }

    // Delete file from storage if it exists
    if (trashItem.file_path) {
      const { error: storageError } = await supabaseAdmin.storage.from("files").remove([trashItem.file_path])

      if (storageError) {
        console.error("Error deleting file from storage:", storageError)
        // Continue with trash deletion even if storage deletion fails
      }
    }

    // Delete from trash
    const { error: deleteError } = await supabaseAdmin.from("trash").delete().eq("id", trashId)

    if (deleteError) {
      console.error("Error deleting from trash:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
