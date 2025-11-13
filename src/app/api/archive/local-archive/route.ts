import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/utils/supabase/server"
import JSZip from "jszip"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

// ✅ Create Supabase Admin Client (for bypassing RLS)
const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // ✅ Authenticate the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Parse request body
    const { folderId, dimensionId } = await request.json()

    if (!folderId || !dimensionId) {
      return NextResponse.json({ error: "Folder ID and Dimension ID required" }, { status: 400 })
    }

    // ✅ Validate folder existence
    const { data: folder, error: folderError } = await supabaseAdmin
      .from("folders")
      .select("id, name, dimension_id")
      .eq("id", folderId)
      .single()

    if (folderError || !folder || folder.dimension_id !== Number(dimensionId)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // ✅ Build ZIP file
    const zip = new JSZip()
    await collectFolderContents(zip, folderId, dimensionId, "")

    // ✅ Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // ✅ Mark folder as archived (local)
    await supabaseAdmin
      .from("folders")
      .update({
        local_archive: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folderId)

      const uint8Array = new Uint8Array(zipBuffer)

    // ✅ Return ZIP download
    return new NextResponse(new Blob([uint8Array]), {
    headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folder.name}_local_archive.zip"`,
    },
    })
  } catch (error: any) {
    console.error("Error in local archive:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create local archive" },
      { status: 500 }
    )
  }
}

// ✅ Recursive function to collect all files/folders
async function collectFolderContents(zip: JSZip, folderId: number, dimensionId: number, currentPath: string) {
  // Fetch files in this folder
  const { data: files, error: fileError } = await supabaseAdmin
    .from("files")
    .select("id, name, file_path")
    .eq("folder_id", folderId)
    .eq("dimension_id", dimensionId)

  if (fileError) {
    console.error("Error fetching files:", fileError)
  }

  for (const file of files || []) {
    try {
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("files")
        .download(file.file_path)

      if (!downloadError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        zip.file(filePath, buffer)
      }
    } catch (err) {
      console.error(`Error processing file "${file.name}":`, err)
    }
  }

  // Fetch subfolders
  const { data: subfolders, error: subfolderError } = await supabaseAdmin
    .from("folders")
    .select("id, name")
    .eq("parent_folder_id", folderId)
    .eq("dimension_id", dimensionId)

  if (subfolderError) {
    console.error("Error fetching subfolders:", subfolderError)
  }

  for (const subfolder of subfolders || []) {
    const subfolderPath = currentPath ? `${currentPath}/${subfolder.name}` : subfolder.name
    await collectFolderContents(zip, subfolder.id, dimensionId, subfolderPath)
  }
}
