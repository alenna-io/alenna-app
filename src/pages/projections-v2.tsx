import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
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
  isActive: boolean
  totalPaces: number
  createdAt: string
  updatedAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    name: string
  }
}


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

  const getSchoolYearNameById = React.useCallback((id: string): string => {
    const year = schoolYears.find(sy => sy.id === id)
    return year?.name || id
  }, [schoolYears])
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

          // If current filter is a name (from old persisted state), find matching ID
          if (filters.schoolYear && filters.schoolYear !== "all") {
            const matchingYear = years.find(sy => sy.name === filters.schoolYear || sy.id === filters.schoolYear)
            if (matchingYear && matchingYear.id !== filters.schoolYear) {
              setFilters({ schoolYear: matchingYear.id })
            } else if (!matchingYear) {
              // If no match found, reset to active year or first year
              const active = years.find(sy => sy.isActive)
              if (active) {
                setFilters({ schoolYear: active.id })
              } else if (years.length > 0) {
                setFilters({ schoolYear: years[0].id })
              }
            }
          } else {
            const active = years.find(sy => sy.isActive)
            if (active && filters.schoolYear === "all") {
              setFilters({ schoolYear: active.id })
            } else if (years.length > 0 && filters.schoolYear === "all") {
              setFilters({ schoolYear: years[0].id })
            }
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

        const schoolYearFilter = filters.schoolYear && filters.schoolYear !== "all" ? filters.schoolYear : undefined
        const projectionsData = await api.projections.getList(schoolYearFilter)

        const mappedProjections: ProjectionWithStudent[] = projectionsData.map(proj => ({
          id: proj.id,
          studentId: proj.studentId,
          schoolYear: proj.schoolYear,
          isActive: proj.status === 'OPEN',
          totalPaces: proj.totalPaces,
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
          student: {
            id: proj.student.id,
            firstName: proj.student.firstName || '',
            lastName: proj.student.lastName || '',
            name: `${proj.student.firstName || ''} ${proj.student.lastName || ''}`.trim(),
          },
        }))

        setProjections(mappedProjections)
      } catch (err) {
        const error = err as Error
        console.error('Error fetching projections:', error)
        setError(error.message || 'Failed to load projections')
        toast.error("Error al cargar las proyecciones")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser) {
      fetchProjections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.schoolYear, isLoadingUser])

  const isTeacherOrAdmin = checkRole('TEACHER') || checkRole('SCHOOL_ADMIN') || checkRole('PARENT')

  const sortedProjections = React.useMemo(() => {
    let filtered = [...projections]

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
  }, [projections, searchTerm, sortField, sortDirection])

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
    navigate(`/students/${projection.studentId}/projections/${projection.id}`, {
      state: { fromProjectionsList: true, studentName: projection.student.name }
    })
  }

  const handleSelectGenerate = () => {
    setShowCreateDialog(false)
    navigate("/projections/generate")
  }

  if (isSuperAdmin) {
    return <Navigate to="/users" replace />
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
        ...schoolYears.map(sy => ({ value: sy.id, label: sy.name }))
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: { schoolYear: string }) => {
    const labels: string[] = []
    if (currentFilters.schoolYear && currentFilters.schoolYear !== "all") {
      const yearName = getSchoolYearNameById(currentFilters.schoolYear)
      labels.push(`${filterFields[0].label}: ${yearName}`)
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
        <div className="max-w-2xl">
          <ErrorAlert
            title={t("errors.loadProjectionsFailed")}
            message={error}
            isNetworkError={error.toLowerCase().includes('failed to fetch') || error.toLowerCase().includes('network error')}
          />
        </div>
      )}

      {!error && (
        isLoading || isLoadingUser ? (
          <ProjectionsTable
            projections={[]}
            onProjectionSelect={handleProjectionSelect}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            currentPage={currentPage}
            totalPages={0}
            totalItems={0}
            onPageChange={setCurrentPage}
            tableId={tableId}
            loading={true}
          />
        ) : sortedProjections.length > 0 ? (
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
            tableId={tableId}
            loading={false}
          />
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <EmptyState
                icon={Calendar}
                title={t("projections.noProjections")}
                description={
                  filters.schoolYear && filters.schoolYear !== "all"
                    ? t("projections.noProjectionsForYear", { year: getSchoolYearNameById(filters.schoolYear) })
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
        onSelectEmpty={() => setShowCreateDialog(false)}
        onSelectFromTemplate={() => setShowCreateDialog(false)}
      />
    </div>
  )
}
