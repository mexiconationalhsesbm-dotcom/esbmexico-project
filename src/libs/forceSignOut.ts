"use client"

import { supabase } from "@/libs/supabase"

export async function forceSignOut() {
  try {
    console.log("🔄 Forcing full sign-out...")

    // 1️⃣ Clear Supabase client session
    await supabase.auth.signOut()

    // 2️⃣ Hit your cookie clearing endpoint (optional, but good for SSR sync)
    await fetch("/api/auth/clear-cookies", { method: "POST", cache: "no-store" })

    // 3️⃣ Clear any possible stale storage (defense-in-depth)
    localStorage.removeItem("supabase.auth.token")
    sessionStorage.removeItem("supabase.auth.token")

    // 4️⃣ Clear URL params if this was triggered via redirect
    const url = new URL(window.location.href)
    url.searchParams.delete("error")
    window.history.replaceState({}, document.title, url.toString())

    console.log("✅ Fully signed out and cleaned up")
  } catch (err) {
    console.error("❌ Force sign-out failed:", err)
  }
}
