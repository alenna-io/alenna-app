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
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-base font-medium leading-tight tracking-tight">{t("filters.title")}</h3>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {filteredCount} {t("filters.of")} {totalItems}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 h-8 px-3 text-sm transition-all duration-200 hover:bg-primary-soft"
          >
            {showFilters ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 transition-transform duration-200" />
                {t("filters.hide")}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
                {t("filters.show")}
              </>
            )}
          </Button>
        </div>

        {/* Active Filters Display - Pill-based */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-sm font-medium text-muted-foreground">{t("filters.activeFilters")}:</span>
            {getActiveFilters().map(({ key, label }, index) => (
              <Badge
                key={key}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                style={{
                  animationDelay: `${index * 50}ms`,
                  backgroundColor: 'var(--color-primary-soft)',
                  color: 'var(--color-primary)',
                  border: 'none'
                }}
              >
                <span className="pr-1.5">{label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(key as keyof T)}
                  className="ml-0.5 rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-0.5 transition-all duration-150 hover:bg-primary/20 cursor-pointer"
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
        <div className="p-0 mt-2 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          <div className={`grid gap-4 ${fields.length === 1 ? 'md:grid-cols-1' : fields.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {fields.map((field, index) => {
              const rawValue = filters[field.key as keyof T] || ""
              // Normalize empty string to "all" for select fields that have an "all" option
              const hasAllOption = field.options?.some(opt => opt.value === "all")
              const currentValue = (rawValue === "" && hasAllOption && field.type === "select") ? "all" : rawValue
              const selectedOption = field.options?.find(opt => opt.value === currentValue)
              const isSearchable = field.searchable ?? (field.options && field.options.length > 10)
              const searchTerm = searchTerms[field.key] || ""
              const isPopoverOpen = openPopovers[field.key] || false
              const isFilterActive = currentValue && currentValue !== "all" && currentValue !== ""

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
                <div
                  key={field.key}
                  className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
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
                            className={cn(
                              "w-full justify-between cursor-pointer h-10 px-3 py-2 text-sm font-normal bg-white border border-input rounded-lg transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
                              isFilterActive && "border-primary/30 bg-primary-soft/30"
                            )}
                          >
                            <span className="truncate">
                              {selectedOption?.label || field.placeholder || t("filters.select") || "Select..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-border" align="start">
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
                                      className="cursor-pointer transition-colors duration-150"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 transition-opacity duration-150",
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
                        <SelectTrigger className={cn(
                          "w-full cursor-pointer h-10 bg-white border-input rounded-lg transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
                          isFilterActive && "border-primary/30 bg-primary-soft/30"
                        )}>
                          <SelectValue placeholder={field.placeholder || t("filters.select") || "Select..."} />
                        </SelectTrigger>
                        <SelectContent className="shadow-lg border-border">
                          {field.options?.filter(option => option.value !== "").map((option) => (
                            <SelectItem key={option.value} value={option.value} className="cursor-pointer transition-colors duration-150">
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
                      className={cn(
                        "w-full h-10 px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 cursor-text hover:border-primary/50",
                        isFilterActive && "border-primary/30 bg-primary-soft/30"
                      )}
                    />
                  ) : (
                    <input
                      type="number"
                      value={currentValue || ""}
                      onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
                      placeholder={field.placeholder}
                      className={cn(
                        "w-full h-10 px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 cursor-text hover:border-primary/50",
                        isFilterActive && "border-primary/30 bg-primary-soft/30"
                      )}
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

