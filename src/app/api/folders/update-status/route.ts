import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { folderId, newStatus } = await request.json()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the folder
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("*")
      .eq("id", folderId)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Get admin data for the current user
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    if (adminError || !adminData) {
      return NextResponse.json({ error: "Admin record not found" }, { status: 404 })
    }

    const isLeader = adminData.role_id === 4
    const isAdmin = adminData.role_id === 2 || adminData.role_id === 3
    const isMember = adminData.role_id === 5
    const isInSameDimension = adminData.assigned_dimension_id === folder.dimension_id

    // Permission rules
    const canChangeStatus =
      isAdmin ||
      (isLeader && isInSameDimension && newStatus !== "draft") ||
      (isMember && isInSameDimension && newStatus === "for_checking")

    if (!canChangeStatus) {
      return NextResponse.json(
        { error: "You don't have permission to change the status of this folder" },
        { status: 403 }
      )
    }

    // Recursive function to get all descendant folder IDs
    async function getAllDescendantFolderIds(parentId: string): Promise<string[]> {
      const allIds: string[] = [parentId]
      const queue: string[] = [parentId]

      while (queue.length > 0) {
        const currentId = queue.shift()!

        const { data: children, error } = await supabase
          .from("folders")
          .select("id")
          .eq("parent_folder_id", currentId)

        if (error) throw error

        if (children && children.length > 0) {
          const childIds = children.map((c) => c.id)
          allIds.push(...childIds)
          queue.push(...childIds)
        }
      }

      return allIds
    }

    // Get all folders (including nested)
    const allFolderIds = await getAllDescendantFolderIds(folderId)

    // Update folders recursively
    const { error: folderUpdateError } = await supabase
      .from("folders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in("id", allFolderIds)

    if (folderUpdateError) {
      return NextResponse.json({ error: folderUpdateError.message }, { status: 500 })
    }

    // Update all files under those folders
    const { error: fileUpdateError } = await supabase
      .from("files")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in("folder_id", allFolderIds)

    if (fileUpdateError) {
      return NextResponse.json({ error: fileUpdateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Folder and its contents updated to '${newStatus}'`,
    })
  } catch (error: any) {
    console.error("Error updating folder status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update folder status" },
      { status: 500 }
    )
  }
}
