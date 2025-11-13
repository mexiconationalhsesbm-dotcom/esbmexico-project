import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

// Recursive function to count all nested folders and files
async function countNestedItems(folderId: number): Promise<{ folders: number; files: number }> {
  // Get direct child folders
  const { data: childFolders, error: foldersError } = await supabaseAdmin
    .from("folders")
    .select("id")
    .eq("parent_folder_id", folderId)

  if (foldersError) {
    console.error("Error fetching child folders:", foldersError)
    return { folders: 0, files: 0 }
  }

  // Get direct files in this folder
  const { count: filesCount, error: filesError } = await supabaseAdmin
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("folder_id", folderId)

  if (filesError) {
    console.error("Error counting files:", filesError)
    return { folders: childFolders?.length || 0, files: 0 }
  }

  // Base counts from direct children
  let totalFolders = childFolders?.length || 0
  let totalFiles = filesCount || 0

  // Recursively count items in child folders
  if (childFolders && childFolders.length > 0) {
    const nestedPromises = childFolders.map((folder) => countNestedItems(folder.id))
    const nestedResults = await Promise.all(nestedPromises)

    for (const result of nestedResults) {
      totalFolders += result.folders
      totalFiles += result.files
    }
  }

  return { folders: totalFolders, files: totalFiles }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")

    if (!folderId) {
      return NextResponse.json({ error: "Missing folder ID" }, { status: 400 })
    }

    const counts = await countNestedItems(Number(folderId))

    return NextResponse.json(counts)
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
