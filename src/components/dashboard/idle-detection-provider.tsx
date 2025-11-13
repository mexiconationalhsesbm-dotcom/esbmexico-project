"use client"

import type React from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import { useIdleDetection } from "@/hooks/useIdleDetection"
import { InactivityModal } from "../modals/InactivityModal"

export function IdleDetectionProvider({ children }: { children: React.ReactNode }) {
  const [showInactivityModal, setShowInactivityModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // ✅ Detect logged-in state
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setIsLoggedIn(!!data.session)
    }
    getSession()

    // ✅ Also listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }, [router, supabase])

  const handleIdle = useCallback(() => {
    setShowInactivityModal(true)
  }, [])

  const handleActive = useCallback(() => {
    setShowInactivityModal(false)
  }, [])

  // ✅ Only enable idle detection if logged in
  useIdleDetection({
    idleTime: 60 * 60 * 1000,
    warningTime: 1 * 60 * 1000,
    onIdle: isLoggedIn ? handleIdle : undefined,
    onActive: isLoggedIn ? handleActive : undefined,
    onLogout: isLoggedIn ? handleSignOut : undefined,
  })

  return (
    <>
      {children}

      {isLoggedIn && (
        <InactivityModal
          isOpen={showInactivityModal}
          onDismiss={() => setShowInactivityModal(false)}
          onLogout={handleSignOut}
          warningTime={60000}
        />
      )}
    </>
  )
}
