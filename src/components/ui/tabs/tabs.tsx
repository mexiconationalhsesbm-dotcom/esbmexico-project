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
    throw new Error("Tabs components must be used within a Tabs provider")
  }
  return context
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, className, children, ...props }, ref) => {
    const initial = value ?? defaultValue ?? ""

    const [internalValue, setInternalValue] = React.useState(initial)

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
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  },
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
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
  },
)
TabsList.displayName = "TabsList"

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext()
    const isActive = activeTab === value

    return (
      <button
        ref={ref}
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
  },
)
TabsTrigger.displayName = "TabsTrigger"

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab } = useTabsContext()

    if (activeTab !== value) {
      return null
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={activeTab === value ? "active" : "inactive"}
        className={cn("mt-2 focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
