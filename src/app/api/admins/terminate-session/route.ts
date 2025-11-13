import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { adminId } = await request.json();

    if (!adminId) {
      return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
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
      message: "All sessions terminated successfully.",
    });
  } catch (error: any) {
    console.error("Error terminating sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to terminate sessions" },
      { status: 500 }
    );
  }
}
