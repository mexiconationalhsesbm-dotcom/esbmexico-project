import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function GET() {
  try {
    // Get all dimensions
    const { data: dimensions, error: dimensionsError } = await supabaseAdmin.from("dimensions").select("*")

    if (dimensionsError) {
      return NextResponse.json({ error: dimensionsError.message }, { status: 500 })
    }

    if (!dimensions || dimensions.length === 0) {
      return NextResponse.json({ error: "No dimensions found" }, { status: 404 })
    }

    const results = []

    // Create sample folders and files for each dimension
    for (const dimension of dimensions) {
      // Create root folders
      const rootFolderNames = ["Reports", "Presentations", "Documents", "Templates"]

      for (const folderName of rootFolderNames) {
        // Create root folder
        const { data: rootFolder, error: rootFolderError } = await supabaseAdmin
          .from("folders")
          .insert({
            name: `${folderName} - ${dimension.name}`,
            dimension_id: dimension.id,
            parent_folder_id: null,
          })
          .select()
          .single()

        if (rootFolderError) {
          results.push({ error: `Error creating root folder ${folderName}: ${rootFolderError.message}` })
          continue
        }

        results.push({ success: `Created root folder: ${folderName} for ${dimension.name}` })

        // Create a subfolder
        const { data: subFolder, error: subFolderError } = await supabaseAdmin
          .from("folders")
          .insert({
            name: `${folderName} Subfolder`,
            dimension_id: dimension.id,
            parent_folder_id: rootFolder.id,
          })
          .select()
          .single()

        if (subFolderError) {
          results.push({ error: `Error creating subfolder: ${subFolderError.message}` })
        } else {
          results.push({ success: `Created subfolder for ${folderName}` })
        }

        // Create a sample file record (without actual file upload)
        const { data: fileData, error: fileError } = await supabaseAdmin
          .from("files")
          .insert({
            name: `Sample ${folderName} File.pdf`,
            file_path: `${dimension.id}/${rootFolder.id}/sample-file.pdf`,
            file_type: "application/pdf",
            file_size: 12345,
            dimension_id: dimension.id,
            folder_id: rootFolder.id,
            uploaded_by: "Seed Script",
            public_url: "https://example.com/sample.pdf",
          })
          .select()
          .single()

        if (fileError) {
          results.push({ error: `Error creating file record: ${fileError.message}` })
        } else {
          results.push({ success: `Created sample file in ${folderName}` })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sample data created successfully",
      results,
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
