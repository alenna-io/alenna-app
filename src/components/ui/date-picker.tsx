import * as React from "react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string
  max?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  min = "2020-01-01",
  max = "2050-12-31",
}: DatePickerProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event.target.value)
    }
  }

  return (
    <input
      type="date"
      value={value || ""}
      onChange={handleChange}
      placeholder={placeholder || undefined}
      disabled={disabled}
      min={min}
      max={max}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !value && "text-muted-foreground"
      )}
    />
  )
}
