"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export type MoveItem = {
  type: "file" | "folder"
  id: number
  name: string
  currentFolderId: number | null
}

type MoveCopyContextType = {
  moveItem: MoveItem | null
  setMoveItem: (item: MoveItem | null) => void
  cancelMove: () => void
}

const MoveCopyContext = createContext<MoveCopyContextType | undefined>(undefined)

export function MoveCopyProvider({ children }: { children: React.ReactNode }) {
  const [moveItem, setMoveItem] = useState<MoveItem | null>(null)

  const cancelMove = () => {
    setMoveItem(null)
  }

  const value = {
    moveItem,
    setMoveItem,
    cancelMove,
  }

  return <MoveCopyContext.Provider value={value}>{children}</MoveCopyContext.Provider>
}

export const useMoveCopy = () => {
  const context = useContext(MoveCopyContext)
  if (context === undefined) {
    throw new Error("useMoveCopy must be used within a MoveCopyProvider")
  }
  return context
}
