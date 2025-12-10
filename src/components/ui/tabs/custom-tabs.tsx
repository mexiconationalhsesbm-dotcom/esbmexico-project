"use client"

import * as React from "react"
import { cn } from "@/libs/utils"

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a CustomTabs provider")
  }
  return context
}

export interface CustomTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function CustomTabs({ defaultValue, value, onValueChange, className, children, ...props }: CustomTabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)

  const activeTab = value !== undefined ? value : internalValue

  const setActiveTab = React.useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [value, onValueChange],
  )

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function CustomTabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CustomTabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function CustomTabsTrigger({ value, className, children, ...props }: CustomTabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export interface CustomTabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function CustomTabsContent({ value, className, children, ...props }: CustomTabsContentProps) {
  const { activeTab } = useTabsContext()

  if (activeTab !== value) {
    return null
  }

  return (
    <div
      role="tabpanel"
      data-state={activeTab === value ? "active" : "inactive"}
      className={cn("mt-2 focus-visible:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  )
}
