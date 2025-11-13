import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // ⬅️ FIX: Await createClient() since it returns a Promise
  const supabase = await createClient();

  try {
    const body = await req.json();

    const {
      accountId,
      firstname,
      middlename,
      lastname,
      gender,
      birthdate,
      age,
      email,
      phone,
    } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Missing accountId." },
        { status: 400 }
      );
    }

    // ✅ 1. Update teacher personal info
    const { error: teacherError } = await supabase
      .from("teachers")
      .update({
        firstname,
        middlename,
        lastname,
        gender,
        birthdate,
        age,
      })
      .eq("account_id", accountId);

    if (teacherError) {
      console.error("Error updating teacher info:", teacherError);
      return NextResponse.json(
        { success: false, error: teacherError.message },
        { status: 400 }
      );
    }

    // ✅ 2. Update admin contact info
    const { error: adminError } = await supabase
      .from("admins")
      .update({
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);

    if (adminError) {
      console.error("Error updating admin info:", adminError);
      return NextResponse.json(
        { success: false, error: adminError.message },
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
