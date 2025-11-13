import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Aggregate storage by dimension directly in SQL
    const { data, error } = await supabase
      .from("files")
      .select("dimension_id, file_size")
    
    if (error) throw error

    // Group totals in memory (since file count can be large)
    const dimensionTotals = data.reduce((acc: Record<number, { total: number; count: number }>, file) => {
      if (!file.dimension_id) return acc
      if (!acc[file.dimension_id]) acc[file.dimension_id] = { total: 0, count: 0 }
      acc[file.dimension_id].total += file.file_size || 0
      acc[file.dimension_id].count += 1
      return acc
    }, {})

    // Get dimension names
    const { data: dimensions, error: dimError } = await supabase
      .from("dimensions")
      .select("id, name, slug")
    
    if (dimError) throw dimError

    const result = dimensions.map((d) => ({
      dimension_id: d.id,
      dimension_name: d.name,
      dimension_slug: d.slug,
      totalFiles: dimensionTotals[d.id]?.count || 0,
      totalStorageGB: (dimensionTotals[d.id]?.total || 0) / (1024 * 1024 * 1024),
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Storage aggregation failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
