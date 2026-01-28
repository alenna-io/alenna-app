import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
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
import { useTranslation } from "react-i18next"
import { usePersistedState } from "@/hooks/use-table-state"
import { toast } from "sonner"
import { CreateProjectionDialog } from "@/components/create-projection-dialog"

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

const FAKE_PROJECTIONS: ProjectionWithStudent[] = [
  {
    id: "proj-1",
    studentId: "student-1",
    schoolYear: "2024-2025",
    startDate: "2024-08-01T00:00:00.000Z",
    endDate: "2025-05-31T00:00:00.000Z",
    isActive: true,
    createdAt: "2024-08-01T00:00:00.000Z",
    updatedAt: "2024-08-01T00:00:00.000Z",
    student: {
      id: "student-1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
    },
  },
  {
    id: "proj-2",
    studentId: "student-2",
    schoolYear: "2024-2025",
    startDate: "2024-08-01T00:00:00.000Z",
    endDate: "2025-05-31T00:00:00.000Z",
    isActive: true,
    createdAt: "2024-08-01T00:00:00.000Z",
    updatedAt: "2024-08-01T00:00:00.000Z",
    student: {
      id: "student-2",
      firstName: "Jane",
      lastName: "Smith",
      name: "Jane Smith",
    },
  },
]

export default function ProjectionsPageV2() {
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const checkRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])
  const isSuperAdmin = checkRole('SUPERADMIN')

  React.useEffect(() => {
    if (isSuperAdmin) {
      navigate('/users', { replace: true })
    }
  }, [isSuperAdmin, navigate])

  const [projections, setProjections] = React.useState<ProjectionWithStudent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string; isActive?: boolean }>>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const tableId = "projections-v2"
  const [filters, setFilters] = usePersistedState<{ schoolYear: string }>("filters", {
    schoolYear: "all"
  }, tableId)
  const [sortField, setSortField] = usePersistedState<"firstName" | "lastName">("sortField", "lastName", tableId)
  const [sortDirection, setSortDirection] = usePersistedState<"asc" | "desc">("sortDirection", "asc", tableId)
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
  const itemsPerPage = 10
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  React.useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const schoolData = await api.schools.getWithCurrentYear()
        if (schoolData?.schoolYears && schoolData.schoolYears.length > 0) {
          const years = schoolData.schoolYears.map(sy => ({
            id: sy.id,
            name: sy.name,
            isActive: sy.status === 'CURRENT_YEAR',
          }))
          setSchoolYears(years)

          const active = years.find(sy => sy.isActive)
          if (active && filters.schoolYear === "all") {
            setFilters({ schoolYear: active.name })
          } else if (years.length > 0 && filters.schoolYear === "all") {
            setFilters({ schoolYear: years[0].name })
          }
        }
      } catch (err) {
        console.error('Error fetching school data:', err)
      }
    }

    if (!isLoadingUser) {
      fetchSchoolData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser])

  React.useEffect(() => {
    const fetchProjections = async () => {
      try {
        setIsLoading(true)
        setError(null)

        setProjections(FAKE_PROJECTIONS)
      } catch (err) {
        const error = err as Error
        console.error('Error fetching projections:', error)
        setError(error.message || 'Failed to load projections')
        toast.error("Note: Projection listing endpoint not yet available. Showing sample data.")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser) {
      fetchProjections()
    }
  }, [filters.schoolYear, isLoadingUser])

  const isTeacherOrAdmin = checkRole('TEACHER') || checkRole('SCHOOL_ADMIN') || checkRole('PARENT')

  const projectionsByStudent = React.useMemo(() => {
    const grouped = new Map<string, ProjectionWithStudent>()

    projections.forEach(projection => {
      const existing = grouped.get(projection.studentId)
      if (!existing || new Date(projection.createdAt) > new Date(existing.createdAt)) {
        grouped.set(projection.studentId, projection)
      }
    })

    return Array.from(grouped.values())
  }, [projections])

  const sortedProjections = React.useMemo(() => {
    let filtered = [...projectionsByStudent]

    if (searchTerm) {
      filtered = filtered.filter(projection => {
        const fullName = `${projection.student.firstName} ${projection.student.lastName}`
        return includesIgnoreAccents(fullName, searchTerm) ||
          includesIgnoreAccents(projection.student.firstName, searchTerm) ||
          includesIgnoreAccents(projection.student.lastName, searchTerm)
      })
    }

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

  const totalPages = Math.ceil(sortedProjections.length / itemsPerPage)
  const paginatedProjections = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedProjections.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedProjections, currentPage, itemsPerPage])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters.schoolYear, sortField, sortDirection, searchTerm, setCurrentPage])

  const handleSort = (field: "firstName" | "lastName") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleProjectionSelect = (projection: ProjectionWithStudent) => {
    navigate(`/students/${projection.studentId}/projections/${projection.id}/v2`, {
      state: { fromProjectionsList: true, studentName: projection.student.name }
    })
  }

  const handleSelectGenerate = () => {
    setShowCreateDialog(false)
    navigate("/projections/generate")
  }

  const handleSelectEmpty = () => {
    setShowCreateDialog(false)
    toast.info("Empty projection creation coming soon")
  }

  const handleSelectFromTemplate = () => {
    setShowCreateDialog(false)
    toast.info("Template-based projection coming soon")
  }

  const handleProjectionDelete = async (projection: ProjectionWithStudent) => {
    try {
      console.log("Delete projection:", projection.id)
      toast.error("Delete endpoint not yet available")
    } catch (error) {
      console.error("Error deleting projection:", error)
      toast.error("Error al eliminar la proyección")
    }
  }

  if (isSuperAdmin) {
    return <Navigate to="/users" replace />
  }

  if (isLoading || isLoadingUser) {
    return <Loading variant="list-page" showCreateButton={true} view="table" showFilters={true} />
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title={t("common.accessDenied")}
          message={t("common.accessDeniedMessage")}
        />
      </div>
    )
  }

  const filterFields: FilterField[] = [
    {
      key: "schoolYear",
      label: t("projections.schoolYear"),
      type: "select",
      color: "bg-blue-500",
      placeholder: t("filters.allYears"),
      options: [
        { value: "all", label: t("filters.allYears") },
        ...schoolYears.map(sy => ({ value: sy.name, label: sy.name }))
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: { schoolYear: string }) => {
    const labels: string[] = []
    if (currentFilters.schoolYear && currentFilters.schoolYear !== "all") {
      labels.push(`${filterFields[0].label}: ${currentFilters.schoolYear}`)
    }
    return labels
  }

  return (
    <div className="space-y-6">
      <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
        <PageHeader
          moduleKey="projections"
          title={t("projections.title")}
          description={t("projections.description")}
        />
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("projections.createProjection")}
        </Button>
      </div>

      <SearchBar
        placeholder={t("projections.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <GenericFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalItems={projections.length}
        filteredCount={sortedProjections.length}
        fields={filterFields}
        getActiveFilterLabels={getActiveFilterLabels}
      />

      {error && (
        <ErrorAlert
          title="Error al cargar proyecciones"
          message={error}
        />
      )}

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
            tableId={tableId}
          />
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <EmptyState
                icon={Calendar}
                title={t("projections.noProjections")}
                description={
                  filters.schoolYear && filters.schoolYear !== "all"
                    ? t("projections.noProjectionsForYear", { year: filters.schoolYear })
                    : t("projections.noProjectionsFound")
                }
              />
            </CardContent>
          </Card>
        )
      )}

      <CreateProjectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSelectGenerate={handleSelectGenerate}
        onSelectEmpty={handleSelectEmpty}
        onSelectFromTemplate={handleSelectFromTemplate}
      />
    </div>
  )
}
