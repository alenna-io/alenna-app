import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SelectFieldProps {
  label: string
  required?: boolean
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  className?: string
}

export function SelectField({
  label,
  required = false,
  value,
  onValueChange,
  placeholder,
  options,
  disabled = false,
  className,
}: SelectFieldProps) {
  return (
    <div className={className}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(
          "cursor-pointer transition-all duration-200 hover:border-primary/50 border-gray-300",
          "focus:border-primary focus:ring-primary/20"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
