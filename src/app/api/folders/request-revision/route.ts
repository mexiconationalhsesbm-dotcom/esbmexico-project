import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { itemType, itemId, dimensionId, reason } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a member of the dimension
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single()

    if (adminData?.assigned_dimension_id !== dimensionId) {
      return NextResponse.json({ error: "You can only request revisions for items in your dimension" }, { status: 403 })
    }

    // Create or update revision request
    const { data, error } = await supabase
      .from("revision_requests")
      .upsert(
        {
          item_type: itemType,
          item_id: itemId,
          dimension_id: dimensionId,
          requested_by: user.id,
          status: "pending",
          request_reason: reason,
        },
        { onConflict: "item_type,item_id,dimension_id,status" },
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Revision request submitted successfully",
      data,
    })
  } catch (error: any) {
    console.error("Error creating revision request:", error)
    return NextResponse.json({ error: error.message || "Failed to create revision request" }, { status: 500 })
  }
}
