import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"

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
  const filterFields: FilterField[] = [
    {
      key: "certificationType",
      label: "Tipo de Certificación",
      type: "select",
      color: "bg-blue-500",
      placeholder: "Todas las certificaciones",
      options: [
        { value: "INEA", label: "INEA" },
        { value: "Grace Christian", label: "Grace Christian" },
        { value: "Home Life", label: "Home Life" },
        { value: "Lighthouse", label: "Lighthouse" },
        { value: "Otro", label: "Otro" }
      ]
    },
    {
      key: "graduationYear",
      label: "Año de Graduación",
      type: "select",
      color: "bg-green-500",
      placeholder: "Todos los años",
      options: [
        { value: "2024", label: "2024" },
        { value: "2025", label: "2025" },
        { value: "2026", label: "2026" },
        { value: "2027", label: "2027" },
        { value: "2028", label: "2028" }
      ]
    },
    {
      key: "isLeveled",
      label: "Estado de Nivelación",
      type: "select",
      color: "bg-purple-500",
      options: [
        { value: "true", label: "Nivelados" },
        { value: "false", label: "No Nivelados" },
        { value: "", label: "Todos" }
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.certificationType) {
      const cert = filterFields[0].options?.find(c => c.value === currentFilters.certificationType)
      labels.push(`${filterFields[0].label}: ${cert?.label || currentFilters.certificationType}`)
    }
    if (currentFilters.graduationYear) {
      labels.push(`${filterFields[1].label}: ${currentFilters.graduationYear}`)
    }
    if (currentFilters.isLeveled) {
      const level = filterFields[2].options?.find(l => l.value === currentFilters.isLeveled)
      labels.push(`${filterFields[2].label}: ${level?.label || currentFilters.isLeveled}`)
    }
    return labels
  }

  return (
    <GenericFilters<Filters>
      filters={filters as Record<string, string>}
      onFiltersChange={onFiltersChange as (filters: Record<string, string>) => void}
      totalItems={totalStudents}
      filteredCount={filteredCount}
      fields={filterFields}
      getActiveFilterLabels={getActiveFilterLabels as (filters: Record<string, string>) => string[]}
    />
  )
}
