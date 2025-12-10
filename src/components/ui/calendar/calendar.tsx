"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/libs/utils"

interface CustomCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
}

export function CustomCalendar({ selected, onSelect, disabled, className }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date())

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (disabled && disabled(newDate)) return
    onSelect?.(newDate)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isDisabled = (day: number) => {
    if (!disabled) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return disabled(date)
  }

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
    const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth())
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDisabled = isDisabled(day)
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={dayDisabled}
          className={cn(
            "h-9 w-9 rounded-md text-sm font-medium transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90",
            isToday(day) && !isSelected(day) && "border border-primary text-primary",
            dayDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
          )}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <div className={cn("p-3 bg-popover rounded-md border shadow-md", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="h-7 w-7 bg-transparent hover:bg-accent rounded-md flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-7 w-7 bg-transparent hover:bg-accent rounded-md flex items-center justify-center transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="h-9 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  )
}
