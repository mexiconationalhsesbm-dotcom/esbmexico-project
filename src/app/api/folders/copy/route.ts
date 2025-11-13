import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

// Recursive function to copy a folder and all its contents
async function copyFolderRecursive(
  folderId: number,
  targetParentFolderId: number | null,
  dimensionId: number,
): Promise<number | null> {
  try {
    // Get the original folder
    const { data: originalFolder, error: fetchError } = await supabaseAdmin
      .from("folders")
      .select("*")
      .eq("id", folderId)
      .single()

    if (fetchError || !originalFolder) {
      console.error("Error fetching folder:", fetchError)
      return null
    }

    // Create a new folder
    const newFolderName = `${originalFolder.name} (copy)`
    const { data: newFolder, error: createFolderError } = await supabaseAdmin
      .from("folders")
      .insert({
        name: newFolderName,
        dimension_id: dimensionId,
        parent_folder_id: targetParentFolderId || null,
      })
      .select()
      .single()

    if (createFolderError || !newFolder) {
      console.error("Error creating new folder:", createFolderError)
      return null
    }

    // Copy all files in the original folder
    const { data: files, error: filesError } = await supabaseAdmin.from("files").select("*").eq("folder_id", folderId)

    if (!filesError && files && files.length > 0) {
      const filesToInsert = files.map((file) => ({
        name: file.name,
        file_path: file.file_path,
        file_type: file.file_type,
        file_size: file.file_size,
        dimension_id: dimensionId,
        folder_id: newFolder.id,
        uploaded_by: file.uploaded_by,
        public_url: file.public_url,
      }))

      const { error: insertFilesError } = await supabaseAdmin.from("files").insert(filesToInsert)

      if (insertFilesError) {
        console.error("Error copying files:", insertFilesError)
      }
    }

    // Recursively copy child folders
    const { data: childFolders, error: childFoldersError } = await supabaseAdmin
      .from("folders")
      .select("*")
      .eq("parent_folder_id", folderId)

    if (!childFoldersError && childFolders && childFolders.length > 0) {
      for (const childFolder of childFolders) {
        await copyFolderRecursive(childFolder.id, newFolder.id, dimensionId)
      }
    }

    return newFolder.id
  } catch (error) {
    console.error("Error in copyFolderRecursive:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { folderId, targetParentFolderId, dimensionId } = await request.json()

    if (!folderId || !dimensionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newFolderId = await copyFolderRecursive(folderId, targetParentFolderId || null, dimensionId)

    if (!newFolderId) {
      return NextResponse.json({ error: "Failed to copy folder" }, { status: 500 })
    }

    return NextResponse.json({ success: true, folderId: newFolderId })
  } catch (error: any) {
    console.error("Error copying folder:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
