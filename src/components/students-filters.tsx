import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react"

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

  const certificationTypes = [
    { value: "INEA", label: "INEA", color: "bg-blue-100 text-blue-800" },
    { value: "Grace Christian", label: "Grace Christian", color: "bg-green-100 text-green-800" },
    { value: "Home Life", label: "Home Life", color: "bg-purple-100 text-purple-800" },
    { value: "Lighthouse", label: "Lighthouse", color: "bg-orange-100 text-orange-800" },
    { value: "Otro", label: "Otro", color: "bg-gray-100 text-gray-800" }
  ]

  const graduationYears = ["2024", "2025", "2026", "2027", "2028"]
  const levelingOptions = [
    { value: "true", label: "Nivelados", color: "bg-green-100 text-green-800" },
    { value: "false", label: "No Nivelados", color: "bg-orange-100 text-orange-800" },
    { value: "", label: "Todos", color: "bg-gray-100 text-gray-800" }
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

  const getActiveFilterLabels = () => {
    const labels = []
    if (filters.certificationType) {
      const cert = certificationTypes.find(c => c.value === filters.certificationType)
      labels.push(cert?.label || filters.certificationType)
    }
    if (filters.graduationYear) {
      labels.push(`Graduación ${filters.graduationYear}`)
    }
    if (filters.isLeveled) {
      const level = levelingOptions.find(l => l.value === filters.isLeveled)
      labels.push(level?.label || filters.isLeveled)
    }
    return labels
  }

  return (
    <Card className="w-full" style={{ border: "none", boxShadow: "none", backgroundColor: "transparent" }}>
      <CardHeader className='p-0'>
        <div className="flex items-center justify-start gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {filteredCount} de {totalStudents}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="cursor-pointer">
                <X className="h-4 w-4 mr-1" />
                Limpiar
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
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Mostrar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {getActiveFilterLabels().map((label, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {showFilters && (
        <CardContent className="pt-0">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Certification Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Tipo de Certificación
              </label>
              <select
                value={filters.certificationType}
                onChange={(e) => handleFilterChange("certificationType", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                <option value="">Todas las certificaciones</option>
                {certificationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Graduation Year Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Año de Graduación
              </label>
              <select
                value={filters.graduationYear}
                onChange={(e) => handleFilterChange("graduationYear", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
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
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Estado de Nivelación
              </label>
              <select
                value={filters.isLeveled}
                onChange={(e) => handleFilterChange("isLeveled", e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
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
