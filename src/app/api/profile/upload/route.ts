import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string;

    if (!file || !accountId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${accountId}-${Date.now()}.${fileExt}`;
    const filePath = `profile_pictures/${fileName}`;

    // Upload to Supabase Storage (use admin to bypass RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile_pictures")
      .upload(filePath, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("profile_pictures")
      .getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl || "";

    // Update teacher’s profile_url using admin client
    const { error: updateError } = await supabaseAdmin
      .from("teachers")
      .update({ profile_url: publicUrl })
      .eq("account_id", accountId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile picture updated successfully",
      publicUrl,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Disable body parsing to handle formData uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
