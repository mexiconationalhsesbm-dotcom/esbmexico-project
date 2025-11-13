import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)
    const ids = url.searchParams.get("ids")?.split(",").map(Number) || []

    if (ids.length === 0)
      return NextResponse.json({ dimensions: [] })

    const { data, error } = await supabase
      .from("dimensions")
      .select("id, name")
      .in("id", ids)

    if (error) throw error

    return NextResponse.json({ dimensions: data })
  } catch (err: any) {
    console.error("Error fetching dimensions:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
