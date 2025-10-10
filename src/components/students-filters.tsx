import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Filter } from "lucide-react"

interface Filters {
  certificationType: string
  graduationYear: string
  isLeveled: string
}

interface StudentsFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  totalStudents: number
  filteredCount: number
}

export function StudentsFilters({ filters, onFiltersChange, totalStudents, filteredCount }: StudentsFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false)

  const certificationTypes = ["INEA", "Grace Christian", "Home Life", "Lighthouse", "Otro"]
  const graduationYears = ["2024", "2025", "2026", "2027", "2028"]
  const levelingOptions = [
    { value: "true", label: "Nivelados" },
    { value: "false", label: "No Nivelados" },
    { value: "", label: "Todos" }
  ]

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      certificationType: "",
      graduationYear: "",
      isLeveled: ""
    })
  }

  const hasActiveFilters = filters.certificationType || filters.graduationYear || filters.isLeveled

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filtros</CardTitle>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
                {filteredCount} de {totalStudents}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Certification Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Certificación</label>
              <select
                value={filters.certificationType}
                onChange={(e) => handleFilterChange("certificationType", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todas las certificaciones</option>
                {certificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Graduation Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Año de Graduación</label>
              <select
                value={filters.graduationYear}
                onChange={(e) => handleFilterChange("graduationYear", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos los años</option>
                {graduationYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Leveling Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de Nivelación</label>
              <select
                value={filters.isLeveled}
                onChange={(e) => handleFilterChange("isLeveled", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {levelingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
