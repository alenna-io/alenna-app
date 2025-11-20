import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Navigate } from "react-router-dom"
import { ErrorAlert } from "@/components/ui/error-alert"
import { EmptyState } from "@/components/ui/empty-state"
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
    return <Loading variant="list" />
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
        title={t("reportCards.listTitle")}
        description={t("reportCards.listDescription")}
      />

      {/* Projections List */}
      {projections.length > 0 ? (
        <div className="space-y-4">
          {projections.map((projection) => (
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
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={FileText}
              title={t("reportCards.noReportCards")}
              description={t("reportCards.noProjectionsYet")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

