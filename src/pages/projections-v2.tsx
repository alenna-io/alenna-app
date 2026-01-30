import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { ProjectionsTable } from "@/components/projections-table"
import { FiltersBar, type FilterConfig } from "@/components/ui/filters-bar"
import { includesIgnoreAccents } from "@/lib/string-utils"
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

function EmptyStateComponent({ title, description }: { title: string; description: string }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="-mx-4 md:-mx-6 px-4 md:px-6 py-10 bg-gray-50">
      <div
        className={`
          mx-auto
          flex
          min-h-[260px]
          max-w-4xl
          flex-col
          items-center
          justify-center
          rounded-2xl
          bg-white/70
          backdrop-blur
          border
          border-gray-100
          shadow-[0_20px_40px_-20px_rgba(0,0,0,0.12)]
          transition-all
          duration-300
          ease-out
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`
              mb-5
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-indigo-50
              transition-transform
              duration-300
              ease-out
              ${mounted ? 'scale-100' : 'scale-95'}
            `}
          >
            <Calendar className="h-7 w-7 text-indigo-400" />
          </div>
          <h3
            className="
              text-base
              font-semibold
              tracking-tight
              text-gray-900
            "
          >
            {title}
          </h3>
          <p
            className="
              mt-1
              max-w-sm
              text-center
              text-sm
              text-gray-500
              leading-relaxed
            "
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
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
  const [filters, setFilters] = usePersistedState<{ schoolYear: string; projectionStatus: string }>("filters", {
    schoolYear: "all",
    projectionStatus: "all"
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

          // If current filter is a name (from old persisted state), find matching ID
          if (filters.schoolYear && filters.schoolYear !== "all") {
            const matchingYear = years.find(sy => sy.name === filters.schoolYear || sy.id === filters.schoolYear)
            if (matchingYear && matchingYear.id !== filters.schoolYear) {
              setFilters(prev => ({ ...prev, schoolYear: matchingYear.id }))
            } else if (!matchingYear) {
              // If no match found, reset to active year or first year
              const active = years.find(sy => sy.isActive)
              if (active) {
                setFilters(prev => ({ ...prev, schoolYear: active.id }))
              } else if (years.length > 0) {
                setFilters(prev => ({ ...prev, schoolYear: years[0].id }))
              }
            }
          } else {
            const active = years.find(sy => sy.isActive)
            if (active && filters.schoolYear === "all") {
              setFilters(prev => ({ ...prev, schoolYear: active.id }))
            } else if (years.length > 0 && filters.schoolYear === "all") {
              setFilters(prev => ({ ...prev, schoolYear: years[0].id }))
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

    // Filter by projection status
    if (filters.projectionStatus && filters.projectionStatus !== "all") {
      if (filters.projectionStatus === "active") {
        filtered = filtered.filter(projection => projection.isActive)
      } else if (filters.projectionStatus === "closed") {
        filtered = filtered.filter(projection => !projection.isActive)
      }
    }

    // Filter by search term (student name)
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
  }, [projections, filters.projectionStatus, searchTerm, sortField, sortDirection])

  const totalPages = Math.ceil(sortedProjections.length / itemsPerPage)
  const paginatedProjections = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedProjections.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedProjections, currentPage, itemsPerPage])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters.schoolYear, filters.projectionStatus, sortField, sortDirection, searchTerm, setCurrentPage])

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

  const filterConfigs: FilterConfig[] = [
    {
      key: "schoolYear",
      label: t("filters.schoolYear") || "School Year",
      options: [
        { value: "all", label: t("filters.all") || "All" },
        ...schoolYears.map(sy => ({ value: sy.id, label: sy.name }))
      ],
      value: filters.schoolYear,
      showAllOption: true,
    },
    {
      key: "projectionStatus",
      label: t("filters.projectionStatus") || "Status",
      options: [
        { value: "all", label: t("filters.all") || "All" },
        { value: "active", label: t("filters.active") || "Active" },
        { value: "closed", label: t("filters.closed") || "Closed" },
      ],
      value: filters.projectionStatus,
      showAllOption: true,
    },
  ]

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
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

      <FiltersBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("projections.searchPlaceholder")}
        filters={filterConfigs}
        onFilterChange={handleFilterChange}
        onReset={() => {
          setSearchTerm("")
          setFilters({ schoolYear: "all", projectionStatus: "all" })
        }}
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
          <EmptyStateComponent
            title={t("projections.noProjections")}
            description={t("projections.noProjectionsDescription")}
          />
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
