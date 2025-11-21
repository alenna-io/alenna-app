import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { useTranslation } from "react-i18next"

interface Filters extends Record<string, string> {
  schoolYear: string
  teacher: string
}

interface GroupsFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  totalGroups: number
  filteredCount: number
  schoolYears: Array<{ id: string; name: string; isActive: boolean }>
  teachers: Array<{ id: string; fullName: string }>
}

export function GroupsFilters({
  filters,
  onFiltersChange,
  totalGroups,
  filteredCount,
  schoolYears,
  teachers
}: GroupsFiltersProps) {
  const { t } = useTranslation()

  const filterFields: FilterField[] = [
    {
      key: "schoolYear",
      label: t("groups.schoolYear"),
      type: "select",
      color: "bg-blue-500",
      placeholder: t("filters.allYears"),
      options: [
        { value: "", label: t("filters.all") },
        ...schoolYears.map(sy => ({
          value: sy.id,
          label: `${sy.name}${sy.isActive ? ` (${t("common.active")})` : ""}`
        }))
      ]
    },
    {
      key: "teacher",
      label: t("groups.teacher"),
      type: "select",
      color: "bg-green-500",
      placeholder: t("filters.allTeachers"),
      options: [
        { value: "", label: t("filters.all") },
        ...teachers.map(t => ({
          value: t.id,
          label: t.fullName
        }))
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.schoolYear) {
      const year = schoolYears.find(sy => sy.id === currentFilters.schoolYear)
      if (year) {
        labels.push(`${filterFields[0].label}: ${year.name}`)
      }
    }
    if (currentFilters.teacher) {
      const teacher = teachers.find(t => t.id === currentFilters.teacher)
      if (teacher) {
        labels.push(`${filterFields[1].label}: ${teacher.fullName}`)
      }
    }
    return labels
  }

  return (
    <GenericFilters<Filters>
      filters={filters}
      onFiltersChange={onFiltersChange}
      totalItems={totalGroups}
      filteredCount={filteredCount}
      fields={filterFields}
      getActiveFilterLabels={getActiveFilterLabels}
    />
  )
}

