import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

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

export default function ReportCardsPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const [projections, setProjections] = React.useState<ProjectionWithStudent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string }>>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<{ schoolYear: string }>({
    schoolYear: ""
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const sortDirection: "asc" | "desc" = "asc"

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

  // Fetch projections (which are the report cards)
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
        console.error('Error fetching report cards:', error)
        setError(error.message || t("reportCards.loadError"))
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser) {
      fetchProjections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.schoolYear, isLoadingUser])

  const handleProjectionClick = (projection: ProjectionWithStudent) => {
    navigate(`/students/${projection.studentId}/report-cards/${projection.id}`)
  }

  const filterFields: FilterField[] = [
    {
      key: "schoolYear",
      label: t("projections.schoolYear"),
      type: "select",
      color: "bg-blue-500",
      placeholder: t("filters.allYears"),
      options: schoolYears.map(sy => ({ value: sy.name, label: sy.name }))
    }
  ]

  // Filter and sort projections - MUST be before any conditional returns
  const filteredProjections = React.useMemo(() => {
    let filtered = [...projections]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        includesIgnoreAccents(p.student.name.toLowerCase(), searchTerm.toLowerCase()) ||
        includesIgnoreAccents(p.schoolYear.toLowerCase(), searchTerm.toLowerCase())
      )
    }

    // Apply sorting by last name
    filtered.sort((a, b) => {
      const aValue = a.student.lastName || a.student.firstName || ""
      const bValue = b.student.lastName || b.student.firstName || ""
      const comparison = aValue.localeCompare(bValue, "es", { sensitivity: "base" })
      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [projections, searchTerm, sortDirection])

  // Pagination - MUST be before any conditional returns
  const totalPages = Math.ceil(filteredProjections.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjections = filteredProjections.slice(startIndex, startIndex + itemsPerPage)

  const getActiveFilterLabels = (currentFilters: { schoolYear: string }) => {
    const labels: string[] = []
    if (currentFilters.schoolYear) {
      labels.push(`${filterFields[0].label}: ${currentFilters.schoolYear}`)
    }
    return labels
  }

  if (isLoading || isLoadingUser) {
    return <Loading variant="list" />
  }

  if (!userInfo) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title={t("common.error")}
          message={t("users.loadError")}
        />
      </div>
    )
  }

  // Check permissions
  const canViewReportCards = userInfo.permissions.includes('reportCards.read') || userInfo.permissions.includes('reportCards.readOwn')

  if (!canViewReportCards) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title={t("common.accessDenied")}
          message={t("common.accessDeniedMessage")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <PageHeader
        title={t("reportCards.title")}
        description={t("reportCards.description")}
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("reportCards.searchPlaceholder")}
        />

        <GenericFilters
          fields={filterFields}
          filters={filters}
          onFiltersChange={(newFilters) => setFilters(newFilters as { schoolYear: string })}
          totalItems={projections.length}
          filteredCount={filteredProjections.length}
          getActiveFilterLabels={getActiveFilterLabels}
        />
      </div>

      {/* Projections List */}
      {error ? (
        <ErrorAlert title={t("common.error")} message={error} />
      ) : paginatedProjections.length > 0 ? (
        <div className="space-y-4">
          {paginatedProjections.map((projection) => (
            <Card
              key={projection.id}
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleProjectionClick(projection)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {projection.student.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {t("projections.schoolYear")} {projection.schoolYear}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(projection.startDate).toLocaleDateString("es-MX")} - {new Date(projection.endDate).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge isActive={projection.isActive} />
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardHeader>
              {projection.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{projection.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={FileText}
              title={t("reportCards.noReportCards")}
              description={searchTerm || filters.schoolYear
                ? t("reportCards.noReportCardsWithFilters")
                : t("reportCards.noProjectionsYet")}
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("reportCards.showing", { start: startIndex + 1, end: Math.min(startIndex + itemsPerPage, filteredProjections.length), total: filteredProjections.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
            >
              {t("common.previous")}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

