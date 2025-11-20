import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { useTranslation } from "react-i18next"

interface Filters extends Record<string, string> {
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
  const { t } = useTranslation()

  const filterFields: FilterField[] = [
    {
      key: "certificationType",
      label: t("filters.certificationType"),
      type: "select",
      color: "bg-blue-500",
      placeholder: t("filters.allCertifications"),
      options: [
        { value: "INEA", label: "INEA" },
        { value: "Grace Christian", label: "Grace Christian" },
        { value: "Home Life", label: "Home Life" },
        { value: "Lighthouse", label: "Lighthouse" },
        { value: "Otro", label: t("filters.other") }
      ]
    },
    {
      key: "graduationYear",
      label: t("filters.graduationYear"),
      type: "select",
      color: "bg-green-500",
      placeholder: t("filters.allYears"),
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
      label: t("filters.levelingStatus"),
      type: "select",
      color: "bg-purple-500",
      options: [
        { value: "true", label: t("filters.leveled") },
        { value: "false", label: t("filters.notLeveled") },
        { value: "", label: t("filters.all") }
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
      filters={filters}
      onFiltersChange={onFiltersChange}
      totalItems={totalStudents}
      filteredCount={filteredCount}
      fields={filterFields}
      getActiveFilterLabels={getActiveFilterLabels}
    />
  )
}
