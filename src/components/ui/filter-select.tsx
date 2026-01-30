import * as React from "react"
import { Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { includesIgnoreAccents } from "@/lib/string-utils"

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showAllOption?: boolean
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  showAllOption = true,
}: FilterSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedOption = options.find((opt) => opt.value === value)
  const isActive = value && value !== "all"

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options

    const allOption = showAllOption ? options.find((opt) => opt.value === "all") : null
    const filtered = options.filter(
      (opt) =>
        opt.value === "all" ||
        includesIgnoreAccents(opt.label, searchTerm) ||
        includesIgnoreAccents(opt.value, searchTerm)
    )

    // Ensure "all" is first if it exists
    if (allOption && filtered.length > 0 && filtered[0].value !== "all") {
      return [allOption, ...filtered.filter((opt) => opt.value !== "all")]
    }
    return filtered
  }, [options, searchTerm, showAllOption])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
    setSearchTerm("")
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-2 px-3 text-sm font-medium border border-dashed transition-all bg-white",
            isActive
              ? "border-gray-400 bg-gray-50 text-gray-900"
              : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          )}
        >
          <Plus className="h-4 w-4 text-gray-600" />
          <span>{label}</span>
          {isActive && selectedOption && (
            <span className="ml-1 text-gray-600 font-normal">
              {selectedOption.label}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder || "Search..."}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = value === option.value
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      "cursor-pointer rounded-xs"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-[2px] border-2 flex items-center justify-center mr-2 shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-gray-400"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
