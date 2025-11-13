import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/libs/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    const { name, file_path, file_type, file_size, dimension_id, folder_id, public_url } = body

    // Validate required fields
    if (!name || !file_path || !dimension_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert file record into database
    const { data, error } = await supabase
      .from("files")
      .insert({
        name,
        file_path,
        file_type,
        file_size,
        dimension_id,
        folder_id,
        uploaded_by: "Current User", // Replace with actual user info when auth is implemented
        public_url,
      })
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: data[0] })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
