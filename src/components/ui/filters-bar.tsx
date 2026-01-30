import { Search, X } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
  value: string
  placeholder?: string
  showAllOption?: boolean
}

interface FiltersBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: FilterConfig[]
  onFilterChange: (key: string, value: string) => void
  onReset?: () => void
}

export function FiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  onFilterChange,
  onReset,
}: FiltersBarProps) {
  const { t } = useTranslation()
  const hasActiveFilters = filters.some((f) => f.value && f.value !== "all") || searchValue

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="w-80">
        <InputGroup className="border-gray-300 bg-white rounded-xs">
          <InputGroupAddon align="inline-start">
            <Search className="h-4 w-4 text-gray-500" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-gray-700 placeholder:text-gray-400"
          />
        </InputGroup>
      </div>
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <FilterSelect
            key={filter.key}
            label={filter.label}
            options={filter.options}
            value={filter.value}
            onChange={(value) => onFilterChange(filter.key, value)}
            placeholder={filter.placeholder}
            showAllOption={filter.showAllOption}
          />
        ))}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <span>{t("filters.reset") || "Reset"}</span>
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
