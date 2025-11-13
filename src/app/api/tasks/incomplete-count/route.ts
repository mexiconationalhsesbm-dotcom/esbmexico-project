import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const folderId = request.nextUrl.searchParams.get("folderId")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !folderId) {
      return NextResponse.json({ error: "Unauthorized or missing parameters" }, { status: 401 })
    }

    // Count incomplete tasks for the folder
    const { count, error: countError } = await supabase
      .from("folder_tasks")
      .select("*", { count: "exact", head: true })
      .eq("folder_id", Number.parseInt(folderId))
      .in("status", ["pending", "for checking"])

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({ incompleteCount: count || 0 })
  } catch (error: any) {
    console.error("Error fetching incomplete task count:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch incomplete task count" }, { status: 500 })
  }
}
