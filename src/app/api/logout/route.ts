import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()

  // Delete all Supabase auth cookies
  for (const cookie of (await cookieStore).getAll()) {
    if (cookie.name.includes("sb-") && cookie.name.includes("-auth-token")) {
      (await cookieStore).delete(cookie.name)
    }
  }

  // Redirect to login after clearing
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
}
