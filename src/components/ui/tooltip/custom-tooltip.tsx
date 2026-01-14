"use client"

import * as React from "react"
import { cn } from "@/libs/utils"

interface CustomTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  sideOffset?: number
  className?: string
  disabled?: boolean
}

export function CustomTooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 200,
  sideOffset = 8,
  className,
  disabled = false,
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)


  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    let top = 0
    let left = 0

    // Calculate position based on side
    switch (side) {
      case "top":
        top = triggerRect.top - tooltipRect.height - sideOffset
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        if (align === "start") left = triggerRect.left
        if (align === "end") left = triggerRect.right - tooltipRect.width
        break
      case "bottom":
        top = triggerRect.bottom + sideOffset
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        if (align === "start") left = triggerRect.left
        if (align === "end") left = triggerRect.right - tooltipRect.width
        break
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.left - tooltipRect.width - sideOffset
        if (align === "start") top = triggerRect.top
        if (align === "end") top = triggerRect.bottom - tooltipRect.height
        break
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        left = triggerRect.right + sideOffset
        if (align === "start") top = triggerRect.top
        if (align === "end") top = triggerRect.bottom - tooltipRect.height
        break
    }

    // Keep tooltip within viewport
    const padding = 8
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

    setPosition({ top, left })
  }, [side, align, sideOffset])

  const handleMouseEnter = () => {
    if (disabled || !content) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delayDuration)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  React.useEffect(() => {
    if (isVisible) {
      calculatePosition()
      window.addEventListener("scroll", calculatePosition, true)
      window.addEventListener("resize", calculatePosition)
      return () => {
        window.removeEventListener("scroll", calculatePosition, true)
        window.removeEventListener("resize", calculatePosition)
      }
    }
  }, [isVisible, calculatePosition])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (disabled || !content) {
    return <>{children}</>
  }

  return (
    <>
      <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="inline-block">
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 px-3 py-1.5 text-sm rounded-md shadow-md",
            "bg-popover text-popover-foreground border border-border",
            "animate-in fade-in-0 zoom-in-95",
            className,
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
        </div>
      )}
    </>
  )
}

// Simple text tooltip variant
interface SimpleTooltipProps {
  children: React.ReactNode
  text: string
  side?: "top" | "right" | "bottom" | "left"
  delayDuration?: number
}

export function SimpleTooltip({ children, text, side = "top", delayDuration = 200 }: SimpleTooltipProps) {
  return (
    <CustomTooltip content={<p>{text}</p>} side={side} delayDuration={delayDuration}>
      {children}
    </CustomTooltip>
  )
}
