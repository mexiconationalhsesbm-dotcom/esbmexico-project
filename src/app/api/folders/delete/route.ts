import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

// Recursive function to get all nested folder IDs
async function getAllNestedFolderIds(folderId: number): Promise<number[]> {
  const { data: childFolders, error } = await supabaseAdmin
    .from("folders")
    .select("id")
    .eq("parent_folder_id", folderId)

  if (error) {
    console.error("Error fetching child folders:", error)
    return []
  }

  if (!childFolders || childFolders.length === 0) {
    return []
  }

  const childFolderIds = childFolders.map((folder) => folder.id)

  // Get grandchildren recursively
  const nestedPromises = childFolderIds.map((id) => getAllNestedFolderIds(id))
  const nestedResults = await Promise.all(nestedPromises)

  // Flatten the results and combine with direct children
  const allNestedIds = [...childFolderIds]
  for (const nestedIds of nestedResults) {
    allNestedIds.push(...nestedIds)
  }

  return allNestedIds
}

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing folder ID" }, { status: 400 })
    }

    // Get the folder to move to trash
    const { data: folder, error: folderError } = await supabaseAdmin.from("folders").select("*").eq("id", id).single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    const { error: trashError } = await supabaseAdmin.from("trash").insert({
      item_id: folder.id,
      item_type: "folder",
      item_name: folder.name,
      dimension_id: folder.dimension_id,
      original_parent_id: folder.parent_folder_id,
      root_deleted_folder_id: folder.id, // Mark this as the root deleted folder
    })

    if (trashError) {
      console.error("Error moving folder to trash:", trashError)
      return NextResponse.json({ error: trashError.message }, { status: 500 })
    }

    // Get all nested folder IDs (including the target folder)
    const nestedFolderIds = [id, ...(await getAllNestedFolderIds(id))]

    // Get all files in these folders
    const { data: files, error: filesError } = await supabaseAdmin
      .from("files")
      .select("id, file_path, name, file_size, file_type, public_url, folder_id")
      .in("folder_id", nestedFolderIds)

    if (filesError) {
      console.error("Error fetching files:", filesError)
      return NextResponse.json({ error: filesError.message }, { status: 500 })
    }

    if (files && files.length > 0) {
      const fileMetadata = files.map((file) => ({
        item_id: file.id,
        item_type: "file",
        item_name: file.name,
        dimension_id: folder.dimension_id,
        file_path: file.file_path,
        file_size: file.file_size,
        file_type: file.file_type,
        public_url: file.public_url,
        original_folder_id: file.folder_id,
        root_deleted_folder_id: id, // Link to root deleted folder
      }))

      const { error: filesTrashError } = await supabaseAdmin.from("trash").insert(fileMetadata)

      if (filesTrashError) {
        console.error("Error storing file metadata in trash:", filesTrashError)
        return NextResponse.json({ error: filesTrashError.message }, { status: 500 })
      }

      // Delete file records from database
      const { error: deleteFilesError } = await supabaseAdmin
        .from("files")
        .delete()
        .in(
          "id",
          files.map((file) => file.id),
        )

      if (deleteFilesError) {
        console.error("Error deleting files from database:", deleteFilesError)
        return NextResponse.json({ error: deleteFilesError.message }, { status: 500 })
      }
    }

    const nestedFolderMetadata = await Promise.all(
      nestedFolderIds.slice(1).map(async (folderId) => {
        const { data: nestedFolder } = await supabaseAdmin.from("folders").select("*").eq("id", folderId).single()
        return {
          item_id: folderId,
          item_type: "folder",
          item_name: nestedFolder?.name || "Unknown",
          dimension_id: folder.dimension_id,
          original_parent_id: nestedFolder?.parent_folder_id || id,
          root_deleted_folder_id: id, // Link to root deleted folder
        }
      }),
    )

    if (nestedFolderMetadata.length > 0) {
      const { error: nestedTrashError } = await supabaseAdmin.from("trash").insert(nestedFolderMetadata)

      if (nestedTrashError) {
        console.error("Error storing nested folder metadata in trash:", nestedTrashError)
        return NextResponse.json({ error: nestedTrashError.message }, { status: 500 })
      }
    }

    // Delete folders from bottom up (children first, then parents)
    for (let i = nestedFolderIds.length - 1; i >= 0; i--) {
      const { error: deleteFolderError } = await supabaseAdmin.from("folders").delete().eq("id", nestedFolderIds[i])

      if (deleteFolderError) {
        console.error(`Error deleting folder ${nestedFolderIds[i]}:`, deleteFolderError)
        return NextResponse.json({ error: deleteFolderError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
