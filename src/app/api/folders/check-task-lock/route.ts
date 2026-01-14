import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const folderId = request.nextUrl.searchParams.get("folderId")

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    const { data: folder, error } = await supabase
      .from("folders")
      .select("task_locked")
      .eq("id", Number(folderId))
      .single()

    if (error || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    return NextResponse.json({ taskLocked: folder.task_locked || false })
  } catch (error: any) {
    console.error("Error checking folder lock status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
