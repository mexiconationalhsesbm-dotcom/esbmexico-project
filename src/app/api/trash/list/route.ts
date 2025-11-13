import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dimensionId = searchParams.get("dimensionId")

    if (!dimensionId) {
      return NextResponse.json({ error: "Missing dimension ID" }, { status: 400 })
    }

    const { data: allTrashItems, error: fetchError } = await supabaseAdmin
      .from("trash")
      .select("*")
      .eq("dimension_id", Number.parseInt(dimensionId))
      .order("deleted_at", { ascending: false })

    if (fetchError) {
      console.error("Error fetching trash items:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Show only:
    // - root deleted folders (root_deleted_folder_id === item_id)
    // - files deleted individually (root_deleted_folder_id is null)
    const topLevelItems = (allTrashItems || []).filter(
      (item) =>
        item.root_deleted_folder_id === item.item_id || // root folder
        item.root_deleted_folder_id == null // standalone file
    )

    return NextResponse.json({ items: topLevelItems })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

