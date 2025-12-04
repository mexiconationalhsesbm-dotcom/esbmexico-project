"use client"

import { useEffect, useRef, useCallback } from "react"

interface IdleDetectionOptions {
  idleTime?: number // Time in milliseconds before showing idle modal (default: 10 minutes)
  warningTime?: number // Time in milliseconds before auto-logout (default: 1 minute)
  onIdle?: () => void
  onActive?: () => void
  onLogout?: () => void
}

export function useIdleDetection({
  idleTime = 10 * 60 * 1000, // 10 minutes
  warningTime = 1 * 60 * 1000, // 1 minute
  onIdle,
  onActive,
  onLogout,
}: IdleDetectionOptions) {
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isIdleRef = useRef(false)

  const resetIdleTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }

    isIdleRef.current = false

    if (onActive) {
      onActive()
    }

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true

      if (onIdle) {
        onIdle()
      }

      // Set warning timer for auto-logout
      warningTimerRef.current = setTimeout(() => {
        if (onLogout) {
          onLogout()
        }
      }, warningTime)
    }, idleTime)
  }, [idleTime, warningTime, onIdle, onActive, onLogout])

useEffect(() => {
  const events = ["mousedown", "keydown", "scroll", "touchstart", "click"]

  const handleActivity = () => {
    if (isIdleRef.current) return
    resetIdleTimer()
  }


    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // ✅ Handle tab switch / visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && isIdleRef.current && onIdle) {
        onIdle() // Show modal when user returns
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initialize timer on mount
    resetIdleTimer()

// Cleanup
return () => {
  events.forEach((event) => {
    document.removeEventListener(event, handleActivity)
  })
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
  if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
}

}, [resetIdleTimer, onIdle])


  return {
    isIdle: isIdleRef.current,
    resetIdleTimer,
  }
}
