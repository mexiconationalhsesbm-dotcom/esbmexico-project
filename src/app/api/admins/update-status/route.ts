import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { adminId, status } = await request.json()

    if (!adminId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update admin status
    const { error: updateError } = await supabaseAdmin
      .from("admins")
      .update({ status: status })
      .eq("id", adminId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

// ✅ Call the RPC to force sign-out
    const { error } = await supabaseAdmin.rpc("force_sign_out", {
      user_uid: adminId,
    });

    if (error) {
      console.error("Error running RPC:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: status === "suspended" ? "Account suspended and sessions terminated" : "Account reactivated",
    })
  } catch (error: any) {
    console.error("[v0] Error updating admin status:", error)
    return NextResponse.json({ error: error.message || "Failed to update admin status" }, { status: 500 })
  }
}
