import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

interface FolderNode {
  id: number
  name: string
  type: "folder" | "file"
  size?: number
  children?: FolderNode[]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const dimensionId = searchParams.get("dimensionId")

    if (!folderId || !dimensionId) {
      return NextResponse.json({ error: "Folder ID and Dimension ID required" }, { status: 400 })
    }

    const folderIdNum = Number(folderId)
    const dimensionIdNum = Number(dimensionId)

    // Build folder structure recursively
    const structure = await buildFolderStructure(supabase, folderIdNum, dimensionIdNum)

    return NextResponse.json({ structure })
  } catch (error: any) {
    console.error("Error fetching folder contents:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch folder contents" }, { status: 500 })
  }
}

async function buildFolderStructure(supabase: any, folderId: number, dimensionId: number): Promise<FolderNode> {
  // Get folder info
  const { data: folder } = await supabase
    .from("folders")
    .select("id, name")
    .eq("id", folderId)
    .eq("dimension_id", dimensionId)
    .single()

  if (!folder) {
    throw new Error("Folder not found")
  }

  const node: FolderNode = {
    id: folder.id,
    name: folder.name,
    type: "folder",
    children: [],
  }

  // Get child folders
  const { data: childFolders } = await supabase
    .from("folders")
    .select("id, name")
    .eq("parent_folder_id", folderId)
    .eq("dimension_id", dimensionId)

  for (const childFolder of childFolders || []) {
    const childNode = await buildFolderStructure(supabase, childFolder.id, dimensionId)
    node.children?.push(childNode)
  }

  // Get files in this folder
  const { data: files } = await supabase
    .from("files")
    .select("id, name, file_size")
    .eq("folder_id", folderId)
    .eq("dimension_id", dimensionId)

  for (const file of files || []) {
    node.children?.push({
      id: file.id,
      name: file.name,
      type: "file",
      size: file.file_size,
    })
  }

  return node
}
