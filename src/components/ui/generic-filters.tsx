import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { X, Filter, ChevronDown, ChevronUp, Check, ChevronsUpDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export interface FilterField {
  key: string
  label: string
  type: "select" | "text" | "number"
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  color?: string
  searchable?: boolean // Whether the select should have search functionality
}

interface GenericFiltersProps<T extends Record<string, string>> {
  filters: T
  onFiltersChange: (filters: T) => void
  totalItems: number
  filteredCount: number
  fields: FilterField[]
  getActiveFilterLabels?: (filters: T) => string[]
}

export function GenericFilters<T extends Record<string, string>>({
  filters,
  onFiltersChange,
  totalItems,
  filteredCount,
  fields,
  getActiveFilterLabels
}: GenericFiltersProps<T>) {
  const { t } = useTranslation()
  const [showFilters, setShowFilters] = React.useState(false)
  const [searchTerms, setSearchTerms] = React.useState<Record<string, string>>({})
  const [openPopovers, setOpenPopovers] = React.useState<Record<string, boolean>>({})

  const handleFilterChange = (key: keyof T, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = fields.some(field => {
    const value = filters[field.key as keyof T]
    return value && value !== "all" && value !== ""
  })

  const getActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; field: FilterField }> = []

    if (getActiveFilterLabels) {
      // Use custom function and match labels to their corresponding filter keys
      const labels = getActiveFilterLabels(filters)
      const usedLabels = new Set<string>()

      // Match each field to its label in order
      fields.forEach(field => {
        const value = filters[field.key as keyof T]
        if (value && value !== "all" && value !== "") {
          // Find the first unused label that matches this field
          const matchedLabel = labels.find(label => {
            if (usedLabels.has(label)) return false
            // Check if label starts with or contains the field label
            return label.startsWith(field.label + ":") || label.includes(field.label + ":")
          })

          if (matchedLabel) {
            usedLabels.add(matchedLabel)
            activeFilters.push({ key: field.key, label: matchedLabel, field })
          } else {
            // Fallback: generate label from field options
            const option = field.options?.find(opt => opt.value === value)
            const displayValue = option?.label || value
            const label = `${field.label}: ${displayValue}`
            activeFilters.push({ key: field.key, label, field })
          }
        }
      })
    } else {
      // Default implementation
      fields.forEach(field => {
        const value = filters[field.key as keyof T]
        if (value && value !== "all" && value !== "") {
          const option = field.options?.find(opt => opt.value === value)
          const displayValue = option?.label || value
          const label = `${field.label}: ${displayValue}`
          activeFilters.push({ key: field.key, label, field })
        }
      })
    }

    return activeFilters
  }

  const handleRemoveFilter = (key: keyof T) => {
    const field = fields.find(f => f.key === key)
    // For select fields, reset to "all", for others reset to empty string
    const resetValue = field?.type === "select" ? "all" : ""
    onFiltersChange({
      ...filters,
      [key]: resetValue as T[keyof T]
    })
  }

  return (
    <div className="w-full">
      <div className='p-0'>
        <div className="flex items-center justify-start gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-normal leading-tight tracking-tight">{t("filters.title")}</h3>
            <Badge variant="secondary" className="ml-2">
              {filteredCount} {t("filters.of")} {totalItems}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 cursor-pointer"
            >
              {showFilters ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t("filters.hide")}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t("filters.show")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm text-black">{t("filters.activeFilters")}</span>
            {getActiveFilters().map(({ key, label }) => (
              <Badge key={key} variant="default" className="text-xs flex items-center gap-1 pr-1">
                {label}
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(key as keyof T)}
                  className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 p-0.5 transition-colors cursor-pointer"
                  aria-label={`Remove ${label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="p-0 mt-4">
          <div className={`grid gap-6 ${fields.length === 1 ? 'md:grid-cols-1' : fields.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {fields.map((field) => {
              const rawValue = filters[field.key as keyof T] || ""
              // Normalize empty string to "all" for select fields that have an "all" option
              const hasAllOption = field.options?.some(opt => opt.value === "all")
              const currentValue = (rawValue === "" && hasAllOption && field.type === "select") ? "all" : rawValue
              const selectedOption = field.options?.find(opt => opt.value === currentValue)
              const isSearchable = field.searchable ?? (field.options && field.options.length > 10)
              const searchTerm = searchTerms[field.key] || ""
              const isPopoverOpen = openPopovers[field.key] || false

              // Filter options based on search term (computed inline, no useMemo in map)
              // Always include "all" option if it exists
              const getFilteredOptions = () => {
                if (!field.options) return []
                if (!searchTerm) return field.options
                const search = searchTerm.toLowerCase()
                const allOption = field.options.find(opt => opt.value === "all")
                const filtered = field.options.filter(opt =>
                  opt.value === "all" || // Always include "all"
                  opt.label.toLowerCase().includes(search) ||
                  opt.value.toLowerCase().includes(search)
                )
                // Ensure "all" is first if it exists
                if (allOption && filtered.length > 0 && filtered[0].value !== "all") {
                  return [allOption, ...filtered.filter(opt => opt.value !== "all")]
                }
                return filtered
              }
              const filteredOptions = getFilteredOptions()

              return (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    isSearchable ? (
                      // Searchable Select using Popover + Command
                      <Popover
                        open={isPopoverOpen}
                        onOpenChange={(open) => {
                          setOpenPopovers(prev => ({ ...prev, [field.key]: open }))
                          if (!open) {
                            setSearchTerms(prev => ({ ...prev, [field.key]: "" }))
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="secondary"
                            role="combobox"
                            className="w-full justify-between cursor-pointer h-10 px-3 py-2 text-sm font-normal bg-white border border-input rounded-md"
                          >
                            <span className="truncate">
                              {selectedOption?.label || field.placeholder || t("filters.select") || "Select..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder={t("filters.search") || "Search..."}
                              value={searchTerm}
                              onValueChange={(value) => {
                                setSearchTerms(prev => ({ ...prev, [field.key]: value }))
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>{t("filters.noResults") || "No results found."}</CommandEmpty>
                              <CommandGroup>
                                {(searchTerm ? filteredOptions : field.options || []).map((option) => {
                                  const isSelected = currentValue === option.value
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.value}
                                      onSelect={() => {
                                        handleFilterChange(field.key as keyof T, option.value)
                                        setOpenPopovers(prev => ({ ...prev, [field.key]: false }))
                                        setSearchTerms(prev => ({ ...prev, [field.key]: "" }))
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
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      // Simple Select using ShadCN Select
                      <Select
                        value={currentValue || undefined}
                        onValueChange={(value) => handleFilterChange(field.key as keyof T, value)}
                      >
                        <SelectTrigger className="w-full cursor-pointer h-10 bg-white">
                          <SelectValue placeholder={field.placeholder || t("filters.select") || "Select..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.filter(option => option.value !== "").map((option) => (
                            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  ) : field.type === "text" ? (
                    <input
                      type="text"
                      value={currentValue || ""}
                      onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-text"
                    />
                  ) : (
                    <input
                      type="number"
                      value={currentValue || ""}
                      onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-text"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

