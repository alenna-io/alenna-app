import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

interface MonthYearPickerProps {
  value?: string // Format: "MM/YYYY" or "all"
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MonthYearPicker({ value, onChange, placeholder, className }: MonthYearPickerProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const locale = i18n.language === 'es' ? es : enUS

  // Parse value to Date (first day of the month)
  const selectedDate = React.useMemo(() => {
    if (value && value !== "all") {
      const [month, year] = value.split('/').map(Number)
      if (month && year) {
        return new Date(year, month - 1, 1)
      }
    }
    return undefined
  }, [value])

  // Display value
  const displayValue = React.useMemo(() => {
    if (selectedDate) {
      return format(selectedDate, "MMMM yyyy", { locale })
    }
    return placeholder || t("billing.allMonths")
  }, [selectedDate, placeholder, t, locale])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      onChange(`${month}/${year}`)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange("all")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1">{displayValue}</span>
          {selectedDate && (
            <X
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          fromYear={2020}
          toYear={2100}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  )
}
