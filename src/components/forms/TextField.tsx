import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TextFieldProps {
  label: string
  required?: boolean
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "password" | "number" | "tel" | "url"
  disabled?: boolean
  className?: string
  error?: string
  helperText?: string
}

export function TextField({
  label,
  required = false,
  value,
  onValueChange,
  placeholder,
  type = "text",
  disabled = false,
  className,
  error,
  helperText,
}: TextFieldProps) {
  return (
    <div className={className}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "transition-all duration-200 hover:border-primary/50 border-gray-300",
          "focus:border-primary focus:ring-primary/20",
          error ? "border-destructive" : ""
        )}
      />
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  )
}
