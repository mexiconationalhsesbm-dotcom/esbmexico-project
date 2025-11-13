import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import JSZip from "jszip"
import { Readable } from "stream"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const dimensionId = searchParams.get("dimensionId")

    if (!folderId || !dimensionId) {
      return NextResponse.json({ error: "Folder ID and Dimension ID are required" }, { status: 400 })
    }

    // Get folder details
    const { data: folder, error: folderError } = await supabaseAdmin
      .from("folders")
      .select("*")
      .eq("id", folderId)
      .eq("dimension_id", dimensionId)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Create ZIP file
    const zip = new JSZip()

    // Recursively collect files/folders
    await collectFolderContents(zip, Number(folderId), Number(dimensionId), "")

    // Create a Node.js readable stream
    const nodeStream = zip.generateNodeStream({ type: "nodebuffer", streamFiles: true })

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk))
        nodeStream.on("end", () => controller.close())
        nodeStream.on("error", (err) => controller.error(err))
      },
    })

    // Return streaming response
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folder.name}.zip"`,
      },
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

async function collectFolderContents(zip: JSZip, folderId: number, dimensionId: number, currentPath: string) {
  // Fetch files
  const { data: files } = await supabaseAdmin
    .from("files")
    .select("id, name, file_path, folder_id")
    .eq("folder_id", folderId)
    .eq("dimension_id", dimensionId)

  for (const file of files || []) {
    const { data: fileData } = await supabaseAdmin.storage.from("files").download(file.file_path)
    if (!fileData) continue

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
    zip.file(filePath, buffer)
  }

  // Fetch subfolders
  const { data: subfolders } = await supabaseAdmin
    .from("folders")
    .select("id, name, parent_folder_id")
    .eq("parent_folder_id", folderId)
    .eq("dimension_id", dimensionId)

  for (const subfolder of subfolders || []) {
    const subfolderPath = currentPath ? `${currentPath}/${subfolder.name}` : subfolder.name
    await collectFolderContents(zip, subfolder.id, dimensionId, subfolderPath)
  }
}
