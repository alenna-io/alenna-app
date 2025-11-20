import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useTranslation } from "react-i18next"

export interface FilterField {
  key: string
  label: string
  type: "select" | "text" | "number"
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  color?: string
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

  const handleFilterChange = (key: keyof T, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    const cleared = {} as T
    fields.forEach(field => {
      (cleared as Record<string, string>)[field.key] = ""
    })
    onFiltersChange(cleared)
  }

  const hasActiveFilters = fields.some(field => filters[field.key as keyof T])

  const getLabels = () => {
    if (getActiveFilterLabels) {
      return getActiveFilterLabels(filters)
    }
    // Default implementation - include field name with value
    const labels: string[] = []
    fields.forEach(field => {
      const value = filters[field.key as keyof T]
      if (value) {
        const option = field.options?.find(opt => opt.value === value)
        const displayValue = option?.label || value
        labels.push(`${field.label}: ${displayValue}`)
      }
    })
    return labels
  }

  return (
    <Card className="w-full" style={{ border: "none", boxShadow: "none", backgroundColor: "transparent" }}>
      <CardHeader className='p-0'>
        <div className="flex items-center justify-start gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {filteredCount} {t("filters.of")} {totalItems}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="cursor-pointer">
                <X className="h-4 w-4 mr-1" />
                {t("filters.clear")}
              </Button>
            )}
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
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-muted-foreground">{t("filters.activeFilters")}</span>
            {getLabels().map((label, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {showFilters && (
        <CardContent className="pt-0">
          <div className={`grid gap-6 ${fields.length === 1 ? 'md:grid-cols-1' : fields.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {fields.map((field) => (
              <div key={field.key} className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 ${field.color || 'bg-blue-500'} rounded-full`}></span>
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={filters[field.key as keyof T] || ""}
                    onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  >
                    <option value="">{field.placeholder || t("filters.all")}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "text" ? (
                  <input
                    type="text"
                    value={filters[field.key as keyof T] || ""}
                    onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  />
                ) : (
                  <input
                    type="number"
                    value={filters[field.key as keyof T] || ""}
                    onChange={(e) => handleFilterChange(field.key as keyof T, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

