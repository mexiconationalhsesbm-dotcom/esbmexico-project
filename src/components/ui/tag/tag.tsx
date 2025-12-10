"use client"

import type * as React from "react"
import { cn } from "@/libs/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-primary text-primary-foreground border-transparent",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    destructive: "bg-destructive text-destructive-foreground border-transparent",
    outline: "bg-transparent text-foreground border-border",
    success: "bg-green-100 text-green-800 border-transparent dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900/30 dark:text-yellow-400",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
