import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    const body = await req.json();
    const { accountId, address } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Missing accountId." },
        { status: 400 }
      );
    }

    // ✅ Update teacher's address
    const { error: teacherError } = await supabase
      .from("teachers")
      .update({
        address,
      })
      .eq("account_id", accountId);

    if (teacherError) {
      console.error("Error updating teacher address:", teacherError);
      return NextResponse.json(
        { success: false, error: teacherError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected server error:", err);
    return NextResponse.json(
      { success: false, error: "Server error occurred." },
      { status: 500 }
    );
  }
}
