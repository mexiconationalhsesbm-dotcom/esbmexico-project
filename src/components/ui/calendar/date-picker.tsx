"use client"

import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/libs/utils"
import { CustomPopover } from "../popover/popover"
import { CustomCalendar } from "./calendar"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  placeholder?: string
  className?: string
}

export function DatePicker({ date, onDateChange, disabled, placeholder = "Select date", className }: DatePickerProps) {
  return (
    <CustomPopover
      align="start"
      trigger={
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      }
    >
      <CustomCalendar selected={date} onSelect={onDateChange} disabled={disabled} />
    </CustomPopover>
  )
}
