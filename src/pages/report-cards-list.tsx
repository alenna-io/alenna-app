import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Navigate } from "react-router-dom"
import { ErrorAlert } from "@/components/ui/error-alert"
import { StatusBadge } from "@/components/ui/status-badge"
import { FileText, ChevronRight } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import type { Projection } from "@/types/projection"
import type { Student } from "@/types/student"
import { useTranslation } from "react-i18next"

export default function ReportCardsListPage() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const api = useApi()
  const { t } = useTranslation()

  const [student, setStudent] = React.useState<Student | null>(null)
  const [projections, setProjections] = React.useState<Projection[]>([])
  const [schoolYearClosedQuarters, setSchoolYearClosedQuarters] = React.useState<Map<string, boolean>>(new Map())
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const { userInfo, isLoading: isLoadingUser } = useUser()

  // Fetch student and projections
  React.useEffect(() => {
    if (!studentId) return

    let isMounted = true

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch student and projections in parallel
        const [studentData, projectionsData] = await Promise.all([
          api.students.getById(studentId),
          api.projections.getByStudentId(studentId),
        ])

        if (isMounted) {
          setStudent(studentData as unknown as Student)
          setProjections(projectionsData as unknown as Projection[])

          // Fetch school years and check for closed quarters
          try {
            const schoolYears = await api.schoolYears.getAll() as Array<{ id: string; name: string }>
            const closedQuartersMap = new Map<string, boolean>()
            for (const schoolYear of schoolYears) {
              try {
                const quarters = await api.quarters.getStatus(schoolYear.id) as Array<{ name: string; isClosed: boolean }>
                const hasClosedQuarter = quarters.some(q => q.isClosed)
                closedQuartersMap.set(schoolYear.name, hasClosedQuarter)
              } catch (err) {
                console.warn(`Error fetching quarter status for ${schoolYear.name}:`, err)
                closedQuartersMap.set(schoolYear.name, false)
              }
            }
            setSchoolYearClosedQuarters(closedQuartersMap)
          } catch (err) {
            console.warn('Error fetching school years for closed quarters:', err)
          }
        }
      } catch (err) {
        const error = err as Error
        console.error('Error fetching data:', error)
        if (isMounted) {
          // Check if it's a permission error or not found error
          if (error.message?.includes('permiso') || error.message?.includes('not found') || error.message?.includes('Student not found') || error.message?.includes('no encontrada') || error.message?.includes('no encontrado')) {
            setHasPermission(false)
          } else {
            setError(error.message || 'Failed to load data')
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  if (isLoading || isLoadingUser) {
    return <Loading variant="report-cards-list" />
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Error al cargar datos"
          message={error || 'No se pudo cargar el estudiante'}
        />
      </div>
    )
  }

  const roles = userInfo?.roles.map((role) => role.name) ?? []
  const hasRole = (role: string) => roles.includes(role)
  const isStudentOnly = hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('SCHOOL_ADMIN') && !hasRole('ADMIN') && !hasRole('SUPERADMIN')

  const backDestination = isStudentOnly ? '/my-profile' : `/students/${studentId}`

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={backDestination}>
          {t("common.back")}
        </BackButton>
      </div>

      {/* Page Title */}
      <PageHeader
        moduleKey="reportCards"
        title={t("reportCards.listTitle")}
        description={t("reportCards.listDescription")}
      />

      {/* Projections List */}
      {(() => {
        // Filter projections to only show those with at least one closed quarter
        const filteredProjections = projections.filter(projection => {
          const hasClosedQuarter = schoolYearClosedQuarters.get(projection.schoolYear) ?? false
          return hasClosedQuarter
        })

        return filteredProjections.length > 0 ? (
          <div className="space-y-4">
            {filteredProjections.map((projection) => (
              <Card
                key={projection.id}
                className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/students/${studentId}/report-cards/${projection.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {t("projections.schoolYear")} {projection.schoolYear}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(projection.startDate).toLocaleDateString()} - {new Date(projection.endDate).toLocaleDateString()}
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
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {t("reportCards.noReportCards")}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              {t("reportCards.noProjectionsYet")}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

