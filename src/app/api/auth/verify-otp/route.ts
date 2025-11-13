import { createAdminClient } from "@/utils/supabase/server-admin";
import { type NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const { email, userId, otp } = await request.json();

    if (!email || !userId || !otp) {
      return NextResponse.json({ error: "Email, userId, and OTP are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 🔹 Fetch OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json({ error: "No OTP record found for this user." }, { status: 404 });
    }

    // 🔹 Check if OTP already verified
    if (otpRecord.is_verified) {
      return NextResponse.json({ error: "This OTP has already been used." }, { status: 400 });
    }

    // 🔹 Check expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // 🔹 Check attempt limit
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Maximum OTP attempts exceeded. Please request a new one." }, { status: 400 });
    }

    // 🔹 Verify OTP
    if (otpRecord.otp_code !== otp) {
      await supabase
        .from("otp_verifications")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      return NextResponse.json({ error: "Invalid OTP code. Please try again." }, { status: 400 });
    }

    // 🔹 Mark as verified
    const { error: updateError } = await supabase
      .from("otp_verifications")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Error updating verification status:", updateError);
      return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully." });

  } catch (error) {
    console.error("Error in verify-otp route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
