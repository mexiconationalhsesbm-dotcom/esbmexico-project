import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, context: any) {
  const supabase = await createClient();
  const { params } = context;
  const body = await req.json();

  if (!params?.id) {
    return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
  }

  const { title, content, visibility } = body;

  const { data, error } = await supabase
    .from("announcements")
    .update({ title, content, visibility })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request, context: any) {
  const supabase = await createClient();
  const { params } = context;

  if (!params?.id) {
    return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
