export const runtime = "nodejs"; // required for file uploads in App Router
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    console.log("===== 📥 API ROUTE TRIGGERED =====");

    const formData = await request.formData();

    console.log("🔑 FormData Keys:");
    for (const key of formData.keys()) {
    console.log(" →", key);
    }

    console.log("🧪 FormData Entries:");
    for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
        console.log(`FILE → ${key}: Blob size=${value.size}, type=${value.type}, name=${(value as any).name}`);
    } else {
        console.log(`VALUE → ${key}:`, value);
    }
    }

    const dimensionId = formData.get("dimensionId") as string;
    const parentFolderId = formData.get("parentFolderId") as string | null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dimensionId) return NextResponse.json({ error: "Missing dimensionId" }, { status: 400 });

    const folderEntries = [];
    const folderMap: Record<string, number> = {};

    // Collect folder metadata
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("folders_")) {
        folderEntries.push(JSON.parse(value as string));
      }
    }

    // Create folders
    for (const entry of folderEntries) {
      if (entry.type !== "folder") continue;

      const parentPath = entry.path.split("/").slice(0, -1).join("/");
      const parentId = parentPath
        ? folderMap[parentPath]
        : parentFolderId
        ? Number(parentFolderId)
        : null;

      const { data, error } = await supabaseAdmin
        .from("folders")
        .insert({
          name: entry.name,
          dimension_id: Number(dimensionId),
          parent_folder_id: parentId,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (error) {
        console.error("Folder creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      folderMap[entry.path] = data.id;
    }

    // Upload files
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("file_")) continue;

      const blob = value as Blob;

      const originalPath = key.replace("file_", "").replace(/__/g, "/");
      const originalName = (value as any).name || "unknown";

      const folderPath = originalPath.split("/").slice(0, -1).join("/");

      const targetFolderId =
        folderMap[folderPath] ??
        (parentFolderId ? Number(parentFolderId) : null);

      // storage filename
      const ext = originalName.split(".").pop() || "bin";
      const randomName = `${Math.random().toString(36).slice(2)}.${ext}`;

      const storagePath = `${dimensionId}/${targetFolderId || "root"}/${randomName}`;

      // Upload
      const { error: uploadError } = await supabaseAdmin.storage
        .from("files")
        .upload(storagePath, blob, {
          contentType: blob.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin
        .storage.from("files")
        .getPublicUrl(storagePath);

      // Insert DB record
      const { error: dbError } = await supabaseAdmin.from("files").insert({
        name: originalName,
        file_path: storagePath,
        file_type: blob.type.substring(0, 255),
        file_size: blob.size,
        dimension_id: Number(dimensionId),
        folder_id: targetFolderId,
        uploaded_by: user.id,
        public_url: urlData.publicUrl,
      });

      if (dbError) {
        console.error("DB error:", dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
