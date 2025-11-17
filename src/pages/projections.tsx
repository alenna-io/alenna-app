import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { EmptyState } from "@/components/ui/empty-state"
import { Calendar } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { ProjectionsTable } from "@/components/projections-table"
import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"

interface ProjectionWithStudent {
  id: string
  studentId: string
  schoolYear: string
  startDate: string
  endDate: string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    name: string
  }
}

export default function ProjectionsPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()

  const [projections, setProjections] = React.useState<ProjectionWithStudent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string }>>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<{ schoolYear: string }>({
    schoolYear: ""
  })
  const [sortField, setSortField] = React.useState<"firstName" | "lastName">("lastName")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Determine current school year
  const getCurrentSchoolYear = React.useCallback(() => {
    const now = new Date()
    const month = now.getMonth() // 0-11
    let schoolYearStart: number
    let schoolYearEnd: number

    if (month >= 7) { // August or later
      schoolYearStart = now.getFullYear()
      schoolYearEnd = now.getFullYear() + 1
    } else { // Before August
      schoolYearStart = now.getFullYear() - 1
      schoolYearEnd = now.getFullYear()
    }

    return `${schoolYearStart}-${schoolYearEnd}`
  }, [])

  const currentSchoolYear = getCurrentSchoolYear()

  // Fetch school years
  React.useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const data = await api.schoolYears.getAll() as Array<{ id: string; name: string }>
        setSchoolYears(data)

        // Set default filter to current year
        const currentYear = data.find(sy => sy.name === currentSchoolYear)
        if (currentYear) {
          setFilters({ schoolYear: currentYear.name })
        } else if (data.length > 0) {
          // If current year not found, use first available
          setFilters({ schoolYear: data[0].name })
        }
      } catch (err) {
        console.error('Error fetching school years:', err)
      }
    }

    if (!isLoadingUser) {
      fetchSchoolYears()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser])

  // Fetch projections
  React.useEffect(() => {
    const fetchProjections = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const year = filters.schoolYear || undefined
        const data = await api.projections.getAll(year) as ProjectionWithStudent[]

        setProjections(data)
      } catch (err) {
        const error = err as Error
        console.error('Error fetching projections:', error)
        setError(error.message || 'Failed to load projections')
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser && filters.schoolYear) {
      fetchProjections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.schoolYear, isLoadingUser])

  // Check permissions
  const roles = userInfo?.roles.map((role) => role.name) ?? []
  const hasRole = (role: string) => roles.includes(role)
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('SCHOOL_ADMIN')

  // Group projections by student to show one per student
  const projectionsByStudent = React.useMemo(() => {
    const grouped = new Map<string, ProjectionWithStudent>()

    projections.forEach(projection => {
      const existing = grouped.get(projection.studentId)
      // If no existing projection for this student, or if this one is more recent
      if (!existing || new Date(projection.createdAt) > new Date(existing.createdAt)) {
        grouped.set(projection.studentId, projection)
      }
    })

    return Array.from(grouped.values())
  }, [projections])

  // Filter and sort projections
  const sortedProjections = React.useMemo(() => {
    let filtered = [...projectionsByStudent]

    // Apply search filter (accent-insensitive)
    if (searchTerm) {
      filtered = filtered.filter(projection => {
        const fullName = `${projection.student.firstName} ${projection.student.lastName}`
        return includesIgnoreAccents(fullName, searchTerm) ||
          includesIgnoreAccents(projection.student.firstName, searchTerm) ||
          includesIgnoreAccents(projection.student.lastName, searchTerm)
      })
    }

    // Sort projections
    filtered.sort((a, b) => {
      let aValue: string
      let bValue: string

      if (sortField === "firstName") {
        aValue = a.student.firstName.toLowerCase()
        bValue = b.student.firstName.toLowerCase()
      } else {
        aValue = a.student.lastName.toLowerCase()
        bValue = b.student.lastName.toLowerCase()
      }

      const comparison = aValue.localeCompare(bValue)
      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [projectionsByStudent, searchTerm, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedProjections.length / itemsPerPage)
  const paginatedProjections = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedProjections.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedProjections, currentPage, itemsPerPage])

  // Reset to page 1 when filters/sort/search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters.schoolYear, sortField, sortDirection, searchTerm])

  const handleSort = (field: "firstName" | "lastName") => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleProjectionSelect = (projection: ProjectionWithStudent) => {
    navigate(`/students/${projection.studentId}/projections/${projection.id}`)
  }

  if (isLoading || isLoadingUser) {
    return <LoadingState variant="list" />
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Acceso denegado"
          message="No tienes permiso para ver esta página"
        />
      </div>
    )
  }

  const filterFields: FilterField[] = [
    {
      key: "schoolYear",
      label: "Año Escolar",
      type: "select",
      color: "bg-blue-500",
      placeholder: "Todos los años",
      options: [
        { value: "", label: "Todos los años" },
        ...schoolYears.map(sy => ({ value: sy.name, label: sy.name }))
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: { schoolYear: string }) => {
    const labels: string[] = []
    if (currentFilters.schoolYear) {
      labels.push(`${filterFields[0].label}: ${currentFilters.schoolYear}`)
    }
    return labels
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <PageHeader
        title="Proyecciones"
        description="Gestiona las proyecciones académicas de los estudiantes"
      />

      {/* Search */}
      <SearchBar
        placeholder="Buscar proyecciones por nombre del estudiante..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filters */}
      <GenericFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalItems={projections.length}
        filteredCount={sortedProjections.length}
        fields={filterFields}
        getActiveFilterLabels={getActiveFilterLabels}
      />

      {/* Error State */}
      {error && (
        <ErrorAlert
          title="Error al cargar proyecciones"
          message={error}
        />
      )}

      {/* Projections Table */}
      {!error && (
        sortedProjections.length > 0 ? (
          <ProjectionsTable
            projections={paginatedProjections}
            onProjectionSelect={handleProjectionSelect}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedProjections.length}
            onPageChange={setCurrentPage}
          />
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="p-12 text-center">
              <EmptyState
                icon={Calendar}
                title="No hay proyecciones"
                description={
                  filters.schoolYear
                    ? `No se encontraron proyecciones para el año escolar ${filters.schoolYear}`
                    : "No se encontraron proyecciones"
                }
              />
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}

