import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const supabaseAdmin = (() => {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
})()

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folderId, dimensionId } = await request.json()

    if (!folderId || !dimensionId) {
      return NextResponse.json({ error: "Folder ID and Dimension ID required" }, { status: 400 })
    }

    // Verify folder exists
    const { data: folder } = await supabase.from("folders").select("id, name, dimension_id").eq("id", folderId).single()
    const { data: dimension } = await supabase.from("dimensions").select("id, name").eq("id", folder?.dimension_id).single()

    if (!folder || folder.dimension_id !== Number(dimensionId)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Update folder to mark as archived
    await supabase
      .from("archived_folders")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        archived_by: user.id,
      })
      .eq("folder_id", folderId)

    // Delete all files in this folder and subfolders from storage
    await deleteAllFiles(supabaseAdmin, folderId, dimensionId)

    await supabase.from("system_logs").insert({
      account_id: user.id,
      action: "ARCHIVE_COMPLETE",
      entity_type: "archive",
      entity_id: folder.id,
      entity_name: folder.name,
      status: "success",
      description:`Successfully archived folder (${folder.name}) from Dimension: ${dimension?.name}`
    })
    
    return NextResponse.json({
      success: true,
      message: "Folder marked as archived and files deleted",
    })
  } catch (error: any) {
    console.error("Error marking as archived:", error)
    return NextResponse.json({ error: error.message || "Failed to mark as archived" }, { status: 500 })
  }
}

async function deleteAllFiles(supabase: any, folderId: number, dimensionId: number) {
  // 🗑️ Delete revision requests and shared items for this folder
  await Promise.all([
    supabase.from("revision_requests").delete().eq("item_id", folderId).eq("item_type", "folder"),
    supabase.from("shared_items").delete().eq("item_id", folderId).eq("item_type", "folder"),
  ])

  // 📁 Get all files in this folder
  const { data: files } = await supabase.from("files").select("id, file_path").eq("folder_id", folderId)

  if (files && files.length > 0) {
    // Delete related revision requests and shared items for all files at once
    const fileIds = files.map((f: any) => f.id)

    await Promise.all([
      supabase.from("revision_requests").delete().in("item_id", fileIds).eq("item_type", "file"),
      supabase.from("shared_items").delete().in("item_id", fileIds).eq("item_type", "file"),
    ])

    for (const file of files) {
      try {
        // Delete from storage
        await supabase.storage.from("files").remove([file.file_path])

        // Delete from database
        await supabase.from("files").delete().eq("id", file.id)
      } catch (err) {
        console.error(`❌ Error deleting file ${file.id}:`, err)
      }
    }
  }

  // 🪜 Recursively delete subfolders
  const { data: subfolders } = await supabase.from("folders").select("id").eq("parent_folder_id", folderId)

  if (subfolders && subfolders.length > 0) {
    for (const subfolder of subfolders) {
      await deleteAllFiles(supabase, subfolder.id, dimensionId)
    }
  }

  // 🧾 Finally, delete the current folder
  try {
    const { error } = await supabase.from("folders").delete().eq("id", folderId)
    if (error) throw error
    console.log(`🗑️ Deleted folder ${folderId}`)
  } catch (err) {
    console.error(`❌ Error deleting folder ${folderId}:`, err)
  }
}


