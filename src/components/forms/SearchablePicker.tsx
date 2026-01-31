import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { includesIgnoreAccents } from "@/lib/string-utils"

export interface SearchablePickerOption {
  id: string
  label: string
  group?: string
  [key: string]: unknown
}

interface SearchablePickerProps<T extends SearchablePickerOption> {
  label: string
  required?: boolean
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: T[]
  availableOptions?: T[]
  searchTerm: string
  onSearchChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  getDisplayValue: (value: string) => string
  searchPlaceholder?: string
  emptyMessage?: string
  groupBy?: (option: T) => string | null
  filterOptions?: (option: T, searchTerm: string) => boolean
  className?: string
  disabled?: boolean
}

export function SearchablePicker<T extends SearchablePickerOption>({
  label,
  required = false,
  value,
  onValueChange,
  placeholder,
  options,
  availableOptions,
  searchTerm,
  onSearchChange,
  open,
  onOpenChange,
  getDisplayValue,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  groupBy,
  filterOptions,
  className,
  disabled = false,
}: SearchablePickerProps<T>) {
  const filteredOptions = React.useMemo(() => {
    let filtered = options

    // Filter by available options if provided
    if (availableOptions) {
      const availableIds = new Set(availableOptions.map(o => o.id))
      filtered = filtered.filter(o => availableIds.has(o.id))
    }

    // Apply custom filter if provided
    if (filterOptions && searchTerm) {
      filtered = filtered.filter(o => filterOptions(o, searchTerm))
    } else if (searchTerm) {
      // Default search: search in label (ignoring accents and case)
      filtered = filtered.filter(o =>
        includesIgnoreAccents(o.label, searchTerm)
      )
    }

    return filtered
  }, [options, availableOptions, searchTerm, filterOptions])

  const groupedOptions = React.useMemo(() => {
    if (!groupBy) {
      return { "": filteredOptions }
    }

    const groups: Record<string, T[]> = {}
    filteredOptions.forEach(option => {
      const group = groupBy(option) || ""
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(option)
    })

    return groups
  }, [filteredOptions, groupBy])

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between transition-all duration-200 !rounded-sm hover:border-primary/50 border border-gray-300 focus:border-primary focus:ring-primary/20"
            disabled={disabled}
          >
            {value ? getDisplayValue(value) : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={onSearchChange}
              className="cursor-pointer"
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
                if (groupOptions.length === 0) return null

                return (
                  <CommandGroup key={groupName} heading={groupName || undefined}>
                    {groupOptions.map((option) => {
                      const isSelected = value === option.id
                      return (
                        <CommandItem
                          key={option.id}
                          value={option.id}
                          onSelect={() => {
                            onValueChange(option.id)
                            onOpenChange(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
