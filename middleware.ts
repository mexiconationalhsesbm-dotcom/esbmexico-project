import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"


export async function middleware(request: NextRequest) {
  // Update the session
  const response = await updateSession(request)

  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Check if the user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/api/logout", request.url));
  }

  // Redirect authenticated users from login to dashboard
  if (user && pathname === "/login") {
    const url = new URL("/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  return response
}

// Add your own logic here to protect specific routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

async function createClient() {
  const { createServerClient } = require("@supabase/ssr")
  const { cookies } = require("next/headers")

  const cookieStore = await cookies()

return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
