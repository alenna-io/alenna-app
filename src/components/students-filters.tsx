import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { useTranslation } from "react-i18next"

interface Filters extends Record<string, string> {
  certificationType: string
  graduationYear: string
  isLeveled: string
  groupId: string
}

interface StudentsFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  totalStudents: number
  filteredCount: number
  groups?: Array<{ id: string; name: string | null; teacherName: string }>
}

export function StudentsFilters({ filters, onFiltersChange, totalStudents, filteredCount, groups = [] }: StudentsFiltersProps) {
  const { t } = useTranslation()

  const filterFields: FilterField[] = [
    ...(groups.length > 0 ? [{
      key: "groupId",
      label: t("filters.group"),
      type: "select" as const,
      color: "bg-orange-500",
      placeholder: t("filters.allGroups"),
      options: [
        { value: "", label: t("filters.allGroups") },
        ...groups.map(g => ({
          value: g.id,
          label: g.name || `${t("groups.defaultGroupName")} - ${g.teacherName}`
        }))
      ]
    }] : []),
    {
      key: "certificationType",
      label: t("filters.certificationType"),
      type: "select" as const,
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
      type: "select" as const,
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
      type: "select" as const,
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
    let fieldIndex = 0
    if (groups.length > 0) {
      if (currentFilters.groupId) {
        const group = groups.find(g => g.id === currentFilters.groupId)
        if (group) {
          labels.push(`${filterFields[fieldIndex].label}: ${group.name || t("groups.defaultGroupName")}`)
        }
      }
      fieldIndex++
    }
    if (currentFilters.certificationType) {
      const cert = filterFields[fieldIndex].options?.find(c => c.value === currentFilters.certificationType)
      labels.push(`${filterFields[fieldIndex].label}: ${cert?.label || currentFilters.certificationType}`)
    }
    fieldIndex++
    if (currentFilters.graduationYear) {
      labels.push(`${filterFields[fieldIndex].label}: ${currentFilters.graduationYear}`)
    }
    fieldIndex++
    if (currentFilters.isLeveled) {
      const level = filterFields[fieldIndex].options?.find(l => l.value === currentFilters.isLeveled)
      labels.push(`${filterFields[fieldIndex].label}: ${level?.label || currentFilters.isLeveled}`)
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
