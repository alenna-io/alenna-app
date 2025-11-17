import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"

interface Filters {
  role: string
  schoolId: string
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
  const filterFields: FilterField[] = [
    {
      key: "role",
      label: "Rol",
      type: "select",
      color: "bg-blue-500",
      placeholder: "Todos los roles",
      options: [
        { value: "", label: "Todos los roles" },
        ...roles.map(role => ({ value: role.id, label: role.displayName }))
      ]
    },
    {
      key: "schoolId",
      label: "Escuela",
      type: "select",
      color: "bg-green-500",
      placeholder: "Todas las escuelas",
      options: [
        { value: "", label: "Todas las escuelas" },
        ...schools.map(school => ({ value: school.id, label: school.name }))
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.role) {
      const role = roles.find(r => r.id === currentFilters.role)
      labels.push(`${filterFields[0].label}: ${role?.displayName || currentFilters.role}`)
    }
    if (currentFilters.schoolId) {
      const school = schools.find(s => s.id === currentFilters.schoolId)
      labels.push(`${filterFields[1].label}: ${school?.name || currentFilters.schoolId}`)
    }
    return labels
  }

  return (
    <GenericFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      totalItems={totalUsers}
      filteredCount={filteredCount}
      fields={filterFields}
      getActiveFilterLabels={getActiveFilterLabels}
    />
  )
}

