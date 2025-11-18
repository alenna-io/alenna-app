import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { EmptyState } from "@/components/ui/empty-state"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { ProjectionsTable } from "@/components/projections-table"
import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"
import { CreateProjectionDialog } from "@/components/create-projection-dialog"
import { CreateEmptyProjectionDialog } from "@/components/create-empty-projection-dialog"
import { CreateFromTemplateDialog } from "@/components/create-from-template-dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

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
  const [deleteErrorDialogOpen, setDeleteErrorDialogOpen] = React.useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState<string>("")
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string; isActive?: boolean }>>([])
  const [activeSchoolYear, setActiveSchoolYear] = React.useState<{ id: string; name: string } | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<{ schoolYear: string }>({
    schoolYear: ""
  })
  const [sortField, setSortField] = React.useState<"firstName" | "lastName">("lastName")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [showEmptyDialog, setShowEmptyDialog] = React.useState(false)
  const [showFromTemplateDialog, setShowFromTemplateDialog] = React.useState(false)

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
        const data = await api.schoolYears.getAll() as Array<{ id: string; name: string; isActive?: boolean }>
        setSchoolYears(data)

        // Find active school year
        const active = data.find(sy => sy.isActive)
        if (active) {
          setActiveSchoolYear({ id: active.id, name: active.name })
          setFilters({ schoolYear: active.name })
        } else {
          // Set default filter to current year if no active year
          const currentYear = data.find(sy => sy.name === currentSchoolYear)
          if (currentYear) {
            setFilters({ schoolYear: currentYear.name })
          } else if (data.length > 0) {
            // If current year not found, use first available
            setFilters({ schoolYear: data[0].name })
          }
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

  const handleProjectionDelete = async (projection: ProjectionWithStudent) => {
    try {
      await api.projections.delete(projection.studentId, projection.id)
      // Refresh projections
      const year = filters.schoolYear || undefined
      const updatedProjections = await api.projections.getAll(year) as ProjectionWithStudent[]
      setProjections(updatedProjections)
    } catch (error) {
      console.error("Error deleting projection:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la proyección. Asegúrate de que esté vacía (sin lecciones)."
      setDeleteErrorMessage(errorMessage)
      setDeleteErrorDialogOpen(true)
    }
  }

  const handleCreateEmpty = async (data: { studentId: string; schoolYear: string }) => {
    try {
      await api.projections.create(data.studentId, {
        schoolYear: data.schoolYear,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: true,
      })
      // Refresh projections
      const year = filters.schoolYear || undefined
      const updatedProjections = await api.projections.getAll(year) as ProjectionWithStudent[]
      setProjections(updatedProjections)
      setShowEmptyDialog(false)
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error creating empty projection:", error)
      throw error
    }
  }


  if (isLoading || isLoadingUser) {
    return <Loading variant="list" />
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
      <div className="flex items-center justify-between">
        <PageHeader
          title="Proyecciones"
          description="Gestiona las proyecciones académicas de los estudiantes"
        />
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Proyección
        </Button>
      </div>

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
            onProjectionDelete={handleProjectionDelete}
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

      {/* Create Projection Dialogs */}
      <CreateProjectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSelectEmpty={() => {
          setShowCreateDialog(false)
          setShowEmptyDialog(true)
        }}
        onSelectGenerate={() => {
          setShowCreateDialog(false)
          navigate("/projections/generate")
        }}
        onSelectFromTemplate={() => {
          setShowCreateDialog(false)
          setShowFromTemplateDialog(true)
        }}
      />

      <CreateEmptyProjectionDialog
        open={showEmptyDialog}
        onOpenChange={setShowEmptyDialog}
        onCreate={handleCreateEmpty}
        activeSchoolYear={activeSchoolYear}
      />

      <CreateFromTemplateDialog
        open={showFromTemplateDialog}
        onOpenChange={setShowFromTemplateDialog}
        activeSchoolYear={activeSchoolYear}
        onSuccess={async () => {
          // Refresh projections
          const year = filters.schoolYear || undefined
          const updatedProjections = await api.projections.getAll(year) as ProjectionWithStudent[]
          setProjections(updatedProjections)
        }}
      />

      {deleteErrorMessage && (
        <ConfirmationDialog
          open={deleteErrorDialogOpen}
          onOpenChange={setDeleteErrorDialogOpen}
          title="Error al Eliminar Proyección"
          message={deleteErrorMessage}
          confirmText="Aceptar"
          cancelText=""
          onConfirm={() => {
            setDeleteErrorDialogOpen(false)
            setDeleteErrorMessage("")
          }}
          variant="default"
        />
      )}
    </div>
  )
}

