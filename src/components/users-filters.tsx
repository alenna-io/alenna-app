import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { useTranslation } from "react-i18next"

interface Filters extends Record<string, string> {
  role: string
  schoolId: string
  isActive: string
}

interface UsersFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  totalUsers: number
  filteredCount: number
  schools: Array<{ id: string; name: string }>
  roles: Array<{ id: string; name: string; displayName: string }>
}

export function UsersFilters({ filters, onFiltersChange, totalUsers, filteredCount, schools, roles }: UsersFiltersProps) {
  const { t } = useTranslation()

  const filterFields: FilterField[] = [
    {
      key: "schoolId",
      label: t("users.filterBySchool"),
      type: "select",
      color: "bg-green-500",
      placeholder: t("users.allSchools"),
      options: [
        { value: "", label: t("users.allSchools") },
        ...schools.map(school => ({ value: school.id, label: school.name }))
      ]
    },
    {
      key: "role",
      label: t("users.filterByRole"),
      type: "select",
      color: "bg-blue-500",
      placeholder: t("users.allRoles"),
      options: [
        { value: "", label: t("users.allRoles") },
        ...roles.map(role => ({ value: role.id, label: role.displayName }))
      ]
    },
    {
      key: "isActive",
      label: t("users.filterByStatus"),
      type: "select",
      color: "bg-purple-500",
      placeholder: t("users.allStatuses"),
      options: [
        { value: "", label: t("users.allStatuses") },
        { value: "true", label: t("users.active") },
        { value: "false", label: t("users.inactive") }
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.schoolId) {
      const school = schools.find(s => s.id === currentFilters.schoolId)
      labels.push(`${filterFields[0].label}: ${school?.name || currentFilters.schoolId}`)
    }
    if (currentFilters.role) {
      const role = roles.find(r => r.id === currentFilters.role)
      labels.push(`${filterFields[1].label}: ${role?.displayName || currentFilters.role}`)
    }
    if (currentFilters.isActive) {
      const statusLabel = currentFilters.isActive === "true" ? t("users.active") : t("users.inactive")
      labels.push(`${filterFields[2].label}: ${statusLabel}`)
    }
    return labels
  }

  return (
    <GenericFilters<Filters>
      filters={filters}
      onFiltersChange={onFiltersChange}
      totalItems={totalUsers}
      filteredCount={filteredCount}
      fields={filterFields}
      getActiveFilterLabels={getActiveFilterLabels}
    />
  )
}

