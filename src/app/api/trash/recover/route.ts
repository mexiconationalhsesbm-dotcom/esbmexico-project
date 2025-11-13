import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
)

/**
 * Inserts a record safely, ignoring duplicate-key errors.
 */
async function safeInsert(table: string, row: any) {
  const { error } = await supabaseAdmin.from(table).insert(row)
  if (error) {
    const msg = (error.message || "").toLowerCase()
    if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("unique")) {
      console.warn(`safeInsert: ${table} row already exists (id=${row.id || "unknown"}) - skipping`)
      return { error: null }
    }
  }
  return { error }
}

export async function POST(request: NextRequest) {
  try {
    const { trashId, itemType } = await request.json()

    if (!trashId || !itemType) {
      return NextResponse.json({ error: "Missing trash ID or item type" }, { status: 400 })
    }

    // Fetch the trash item to recover
    const { data: trashItem, error: fetchError } = await supabaseAdmin
      .from("trash")
      .select("*")
      .eq("id", trashId)
      .single()

    if (fetchError || !trashItem) {
      console.error("[recover] Trash item not found:", fetchError)
      return NextResponse.json({ error: "Trash item not found" }, { status: 404 })
    }

    // ---------- CASE 1: FILE ----------
    if (itemType === "file") {
      const fileData = {
        id: trashItem.item_id,
        name: trashItem.item_name,
        dimension_id: trashItem.dimension_id,
        folder_id: trashItem.original_folder_id,
        file_path: trashItem.file_path,
        file_size: trashItem.file_size,
        file_type: trashItem.file_type,
        public_url: trashItem.public_url,
        uploaded_by: trashItem.uploaded_by ?? "Current User", // preserved exactly
        created_at: trashItem.created_at, // preserved exactly
        updated_at: new Date().toISOString(),
      }

      const { error: restoreError } = await safeInsert("files", fileData)
      if (restoreError) {
        console.error("[recover] Error restoring file:", restoreError)
        return NextResponse.json({ error: restoreError.message }, { status: 500 })
      }

      // Remove recovered file from trash
      const { error: deleteError } = await supabaseAdmin.from("trash").delete().eq("id", trashId)
      if (deleteError) {
        console.error("[recover] Error deleting file from trash:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // ---------- CASE 2: FOLDER (INCLUDING NESTED CONTENTS) ----------
    else if (itemType === "folder") {
      // Step 1: Restore the root folder first
      const rootFolder = {
        id: trashItem.item_id,
        name: trashItem.item_name,
        dimension_id: trashItem.dimension_id,
        parent_folder_id: trashItem.original_parent_id,
        created_at: trashItem.created_at, // preserved exactly
        updated_at: new Date().toISOString(),
      }

      const { error: restoreRootError } = await safeInsert("folders", rootFolder)
      if (restoreRootError) {
        console.error("[recover] Error restoring root folder:", restoreRootError)
        return NextResponse.json({ error: restoreRootError.message }, { status: 500 })
      }

      // Step 2: Fetch all trash items linked to this root deleted folder
      const { data: relatedTrashItems, error: relatedError } = await supabaseAdmin
        .from("trash")
        .select("*")
        .eq("root_deleted_folder_id", trashItem.item_id)

      if (relatedError) {
        console.error("[recover] Error fetching related trash items:", relatedError)
        return NextResponse.json({ error: relatedError.message }, { status: 500 })
      }

      // Step 3: Separate subfolders and files (excluding root folder)
      const subFolders = (relatedTrashItems || []).filter(
        (t) => t.item_type === "folder" && t.item_id !== trashItem.item_id,
      )
      const files = (relatedTrashItems || []).filter((t) => t.item_type === "file")

      // Step 4: Restore folders in parent-first order
      const restoredFolderIds = new Set<number>([trashItem.item_id])
      const remainingFolders = new Map(subFolders.map((f) => [f.item_id, f]))

      let progress = true
      while (remainingFolders.size > 0 && progress) {
        progress = false
        for (const [id, folder] of Array.from(remainingFolders.entries())) {
          const parentId = folder.original_parent_id
          if (parentId == null || restoredFolderIds.has(parentId)) {
            const folderData = {
              id: folder.item_id,
              name: folder.item_name,
              dimension_id: folder.dimension_id,
              parent_folder_id: folder.original_parent_id,
              created_at: folder.created_at, // preserved exactly
              updated_at: new Date().toISOString(),
            }
            const { error: folderError } = await safeInsert("folders", folderData)
            if (folderError) {
              console.error(`[recover] Error restoring folder id=${id}:`, folderError)
              return NextResponse.json({ error: folderError.message }, { status: 500 })
            }
            restoredFolderIds.add(id)
            remainingFolders.delete(id)
            progress = true
          }
        }

        // Handle orphaned folders by assigning root as fallback parent
        if (!progress && remainingFolders.size > 0) {
          console.warn("[recover] Orphaned subfolders detected, assigning root as parent.")
          for (const [id, folder] of Array.from(remainingFolders.entries())) {
            const folderData = {
              id: folder.item_id,
              name: folder.item_name,
              dimension_id: folder.dimension_id,
              parent_folder_id: trashItem.item_id,
              created_at: folder.created_at,
              updated_at: new Date().toISOString(),
            }
            const { error: folderError } = await safeInsert("folders", folderData)
            if (folderError) {
              console.error(`[recover] Error restoring orphan folder id=${id}:`, folderError)
              return NextResponse.json({ error: folderError.message }, { status: 500 })
            }
            restoredFolderIds.add(id)
            remainingFolders.delete(id)
          }
          break
        }
      }

      // Step 5: Restore files after folders exist
      for (const file of files) {
        const folderIdToUse =
          restoredFolderIds.has(file.original_folder_id) && file.original_folder_id
            ? file.original_folder_id
            : trashItem.item_id

        const fileData = {
          id: file.item_id,
          name: file.item_name,
          dimension_id: file.dimension_id,
          folder_id: folderIdToUse,
          file_path: file.file_path,
          file_size: file.file_size,
          file_type: file.file_type,
          public_url: file.public_url,
          uploaded_by: file.uploaded_by ?? "Current User", // preserved exactly
          created_at: file.created_at, // preserved exactly
          updated_at: new Date().toISOString(),
        }

        const { error: fileError } = await safeInsert("files", fileData)
        if (fileError) {
          console.error(`[recover] Error restoring file id=${file.item_id}:`, fileError)
          return NextResponse.json({ error: fileError.message }, { status: 500 })
        }
      }

      // Step 6: Remove all recovered items from trash
      const { error: deleteError } = await supabaseAdmin
        .from("trash")
        .delete()
        .eq("root_deleted_folder_id", trashItem.item_id)

      if (deleteError) {
        console.error("[recover] Error cleaning up trash:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[recover] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
