"use client"

import * as React from "react"
import { format, addDays, addWeeks, addMonths, startOfToday } from "date-fns"
import { th } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  disabled = false,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    // Parse YYYY-MM-DD string to Date
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
  })

  React.useEffect(() => {
    if (!value) {
      setDate(undefined)
      return
    }
    if (value instanceof Date) {
      setDate(value)
    } else {
      const parsed = new Date(value)
      setDate(isNaN(parsed.getTime()) ? undefined : parsed)
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    onChange?.(selectedDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "d MMM yyyy", { locale: th }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2 p-3 border-b">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSelect(startOfToday())}
            >
              วันนี้
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSelect(addDays(startOfToday(), 1))}
            >
              พรุ่งนี้
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSelect(addWeeks(startOfToday(), 1))}
            >
              สัปดาห์หน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSelect(addMonths(startOfToday(), 1))}
            >
              เดือนหน้า
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            locale={th}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
