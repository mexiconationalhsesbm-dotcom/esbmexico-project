import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import JSZip from "jszip"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
// import { Storage } from "@google-cloud/storage"

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

    const { data: dimension } = await supabase.from("dimensions").select("id, name").eq("id", dimensionId).single()

    if (!folder || folder.dimension_id !== Number(dimensionId)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Create ZIP file
    const zip = new JSZip()
    await collectFolderContents(supabaseAdmin, zip, folderId, dimensionId, "")
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Get storage provider from environment or default to backblaze
    const storageProvider = process.env.ARCHIVE_STORAGE_PROVIDER || "backblaze"

    // Upload to cloud storage (implementation depends on provider)
    const storagePath = `archived-folders/${dimension?.name}/${folder.name}/${folder.name}.zip`
    let storageUrl = ""

    if (storageProvider === "backblaze") {
      // Backblaze B2 implementation
      storageUrl = await uploadToBackblaze(zipBuffer, storagePath, folder.name)
    } else if (storageProvider === "gcs") {
      // Google Cloud Storage implementation
      storageUrl = await uploadToGCS(zipBuffer, storagePath, folder.name)
    }

    // Save archived folder metadata
    const folderStructure = await buildFolderStructure(supabaseAdmin, folderId, dimensionId)

    await supabase.from("archived_folders").insert({
      folder_id: folderId,
      folder_name: folder.name,
      dimension_id: dimensionId,
      original_folder_structure: folderStructure,
      archived_by: user.id,
      storage_provider: storageProvider,
      storage_path: storagePath,
      storage_url: storageUrl,
    })

    // Update folder to mark cloud archive as true
    await supabase
      .from("folders")
      .update({ cloud_archive: true, updated_at: new Date().toISOString() })
      .eq("id", folderId)

    return NextResponse.json({
      success: true,
      message: "Folder archived to cloud storage",
      storageUrl,
    })
  } catch (error: any) {
    console.error("Error in cloud archive:", error)
    return NextResponse.json({ error: error.message || "Failed to archive to cloud" }, { status: 500 })
  }
}

  async function uploadToBackblaze(buffer: Buffer, path: string, fileName: string): Promise<string> {
    const client = new S3Client({
      region: process.env.B2_BUCKET_REGION!,
      endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
      credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
      },
    })

    // Upload the file
    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: path,
      Body: buffer,
      ContentType: "application/zip",
    })

    await client.send(command)

    // Construct the file’s URL
    const baseUrl = process.env.B2_BUCKET_BASE_URL!
    const publicUrl = `${baseUrl}/${path}`

    console.log(`✅ Uploaded to Backblaze: ${publicUrl}`)

    return publicUrl
  }

async function uploadToGCS(buffer: Buffer, path: string, fileName: string): Promise<string> {
  
  console.log(`Uploading to GCS: ${path}`)
  return `https://gcs-placeholder.com/${path}`
}

// async function uploadToGCS(buffer: Buffer, path: string): Promise<string> {
//   // Initialize Google Cloud Storage client (no external JSON file required)
//   const storage = new Storage({
//     projectId: process.env.GCS_PROJECT_ID,
//     credentials: {
//       client_email: process.env.GCS_CLIENT_EMAIL!,
//       private_key: process.env.GCS_PRIVATE_KEY!.replace(/\\n/g, "\n"), // fixes newline issue
//     },
//   })

//   const bucketName = process.env.GCS_BUCKET_NAME!
//   const bucket = storage.bucket(bucketName)
//   const file = bucket.file(path)

//   try {
//     // Upload the ZIP buffer
//     await file.save(buffer, {
//       contentType: "application/zip",
//       resumable: false,
//       public: true, // If you want public files
//     })

//     const publicUrl = `https://storage.googleapis.com/${bucketName}/${path}`

//     console.log(`✅ Uploaded to Google Cloud Storage: ${publicUrl}`)

//     return publicUrl
//   } catch (error) {
//     console.error("❌ GCS upload failed:", error)
//     throw new Error("Failed to upload to Google Cloud Storage")
//   }
// }


async function buildFolderStructure(supabase: any, folderId: number, dimensionId: number): Promise<any> {
  const { data: folder } = await supabase.from("folders").select("id, name").eq("id", folderId).single()

  const node: any = {
    id: folder.id,
    name: folder.name,
    type: "folder",
    children: [],
  }

  const { data: childFolders } = await supabase.from("folders").select("id, name").eq("parent_folder_id", folderId)

  for (const childFolder of childFolders || []) {
    const childNode = await buildFolderStructure(supabase, childFolder.id, dimensionId)
    node.children?.push(childNode)
  }

  const { data: files } = await supabase.from("files").select("id, name, file_size").eq("folder_id", folderId)

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

async function collectFolderContents(
  supabase: any,
  zip: JSZip,
  folderId: number,
  dimensionId: number,
  currentPath: string,
) {
  const { data: files } = await supabase.from("files").select("id, name, file_path").eq("folder_id", folderId)

  for (const file of files || []) {
    try {
      const { data: fileData, error } = await supabase.storage.from("files").download(file.file_path)

      if (!error && fileData) {
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        zip.file(filePath, buffer)
      }
    } catch (err) {
      console.error(`Error processing file ${file.name}:`, err)
    }
  }

  const { data: subfolders } = await supabase.from("folders").select("id, name").eq("parent_folder_id", folderId)

  for (const subfolder of subfolders || []) {
    const subfolderPath = currentPath ? `${currentPath}/${subfolder.name}` : subfolder.name
    await collectFolderContents(supabase, zip, subfolder.id, dimensionId, subfolderPath)
  }
}
