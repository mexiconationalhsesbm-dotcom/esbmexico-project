import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all files with their sizes
    const { data: files, error } = await supabase.from("files").select("id, file_size").not("file_size", "is", null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate total storage used in bytes
    const totalStorageUsed = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0

    // Convert bytes to GB
    const totalStorageGB = totalStorageUsed / (1024 * 1024 * 1024)
    const totalStorageLimit = 100 // GB

    // Calculate percentage
    const percentageUsed = (totalStorageGB / totalStorageLimit) * 100

    return NextResponse.json({
      totalStorageUsed: totalStorageGB,
      totalStorageLimit,
      percentageUsed: Math.min(percentageUsed, 100),
      totalFiles: files?.length || 0,
    })
  } catch (error: any) {
    console.error("Storage calculation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
