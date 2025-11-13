import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    // Get all trash items older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: oldTrashItems, error: fetchError } = await supabaseAdmin
      .from("trash")
      .select("*")
      .lt("deleted_at", thirtyDaysAgo.toISOString())

    if (fetchError) {
      console.error("Error fetching old trash items:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!oldTrashItems || oldTrashItems.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0 })
    }

    // Delete files from storage
    const filePaths = oldTrashItems.filter((item) => item.file_path).map((item) => item.file_path)

    if (filePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage.from("files").remove(filePaths)

      if (storageError) {
        console.error("Error deleting files from storage:", storageError)
      }
    }

    // Delete trash items from database
    const { error: deleteError } = await supabaseAdmin
      .from("trash")
      .delete()
      .lt("deleted_at", thirtyDaysAgo.toISOString())

    if (deleteError) {
      console.error("Error deleting old trash items:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedCount: oldTrashItems.length })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
