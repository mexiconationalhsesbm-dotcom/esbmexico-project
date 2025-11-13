import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createSupabaseClient } from "@/utils/supabase/server"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {

    const supabase = await createSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const uploadedBy = user?.id

    const formData = await request.formData()
    const file = formData.get("file") as File
    const dimensionId = formData.get("dimensionId") as string
    const folderId = formData.get("folderId") as string | null

    if (!file || !dimensionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${dimensionId}/${folderId || "root"}/${fileName}`

    // Upload file to storage using admin client to bypass RLS
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from("files").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get the public URL for the file
    const { data: urlData } = supabaseAdmin.storage.from("files").getPublicUrl(filePath)
    const publicUrl = urlData?.publicUrl || ""

    // Still truncate file_type but to 255 characters as a safety measure
    const truncatedFileType = file.type.substring(0, 255)

    // Insert file record into database using admin client to bypass RLS
    const { data: fileData, error: dbError } = await supabaseAdmin
      .from("files")
      .insert({
        name: file.name,
        file_path: filePath,
        file_type: truncatedFileType, // Now truncated to 255 characters
        file_size: file.size,
        dimension_id: Number.parseInt(dimensionId),
        folder_id: folderId ? Number.parseInt(folderId) : null,
        uploaded_by: uploadedBy, // Replace with actual user info when auth is implemented
        public_url: publicUrl,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: fileData })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
