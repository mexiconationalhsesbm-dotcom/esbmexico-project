import { type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return new Response(JSON.stringify({ error: "File path is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data, error } = await supabaseAdmin.storage.from("files").download(path)

    if (error || !data) {
      console.error("Download error:", error)
      return new Response(JSON.stringify({ error: error?.message || "Failed to download" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const buffer = await data.arrayBuffer()
    const filename = path.split("/").pop() || "file"

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream", 
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
