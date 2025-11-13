import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  } else {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/logout`, {
      method: "POST",
    })

    // Then redirect to a real page
    redirect("/login")
  }

  return null
}
