"use client"

import Link from "next/link"
import { ChevronRight, Home, Share2 } from "lucide-react"
import type { Breadcrumb } from "@/types"

interface BreadcrumbNavProps {
  items: Breadcrumb[]
  dimensionSlug: string
  isSharedPage?: boolean
}

export function BreadcrumbNav({ items, dimensionSlug, isSharedPage = false }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {isSharedPage ? (
        <>
          <Link href="/dashboard/shared" className="flex items-center hover:text-foreground transition-colors text-black dark:text-white">
            <Share2 className="h-4 w-4 mr-1" />
            Shared with me
          </Link>
        </>
      ) : (
        <>
          <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors text-black dark:text-white">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-black dark:text-white" />
          <Link href={`/dashboard/${dimensionSlug}`} className="hover:text-foreground transition-colors text-black dark:text-white border-none rounded-2xl p-3 hover:bg-gray-200 hover:dark:bg-gray-600">
            {dimensionSlug.charAt(0).toUpperCase() + dimensionSlug.slice(1).replace(/([A-Z])/g, " $1")}
          </Link>
        </>
      )}

      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.name}</span>
          ) : (
            <Link href={item.path} className="hover:text-foreground transition-colors border-none rounded-2xl p-3 hover:bg-gray-200 hover:dark:bg-gray-600">
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
