import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {

    const supabase = await createClient()

    const { data: admins, error } = await supabase
      .from("admins")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ admins })
  } catch (error: any) {
    console.error("Error listing admins:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// const { data: admins, error } = await supabaseAdmin
//   .from("admins")
//   .select("*, admin_sessions(is_active)")
//   .order("created_at", { ascending: false })

// const adminsWithSessions = admins.map((admin) => ({
//   ...admin,
//   hasActiveSession: admin.admin_sessions?.some((s) => s.is_active) || false,
// }))

// import { type NextRequest, NextResponse } from "next/server"
// import { createClient } from "@supabase/supabase-js"

// const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
//   auth: {
//     persistSession: false,
//   },
// })

// export async function GET(request: NextRequest) {
//   try {
//     // Fetch all admins with their session information
//     const { data: admins, error: adminsError } = await supabaseAdmin
//       .from("admins")
//       .select("*")
//       .order("created_at", { ascending: false })

//     if (adminsError) {
//       return NextResponse.json({ error: adminsError.message }, { status: 500 })
//     }

//     // Get active sessions for each admin
//     const adminsWithSessions = await Promise.all(
//       admins.map(async (admin) => {
//         const { data: sessions } = await supabaseAdmin.auth.admin.listUserSessions(admin.id)
//         return {
//           ...admin,
//           activeSessions: sessions?.length || 0,
//           hasActiveSession: (sessions?.length || 0) > 0,
//         }
//       }),
//     )

//     return NextResponse.json({ admins: adminsWithSessions })
//   } catch (error: any) {
//     console.error("[v0] Error listing admins:", error)
//     return NextResponse.json({ error: error.message || "Failed to list admins" }, { status: 500 })
//   }
// }
