import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { LoadingState } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { Navigate } from "react-router-dom"
import { ErrorAlert } from "@/components/ui/error-alert"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Calendar, ChevronRight, BookOpen } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import type { Projection } from "@/types/projection"
import type { Student } from "@/types/student"

export default function ProjectionListPage() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const api = useApi()

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
    return <LoadingState variant="list" />
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
  const isParentOnly = hasRole('PARENT') && !hasRole('TEACHER') && !hasRole('SCHOOL_ADMIN') && !hasRole('ADMIN') && !hasRole('SUPERADMIN')
  const canCreateProjection = userInfo?.permissions.includes('projections.create') ?? false

  const backDestination = isStudentOnly ? '/my-profile' : `/students/${studentId}`

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={backDestination}>
          Volver
        </BackButton>
      </div>

      {/* Page Title */}
      <PageHeader
        title="Proyecciones Académicas"
        description="Historial de proyecciones por año escolar"
      />

      {/* Projections List */}
      {projections.length > 0 ? (
        <div className="space-y-4">
          {projections.map((projection) => (
            <Card
              key={projection.id}
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/students/${studentId}/projections/${projection.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        Año Escolar {projection.schoolYear}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
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
        /* Empty State */
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={Calendar}
              title="No hay proyecciones"
              description="No se han creado proyecciones para este estudiante"
              action={canCreateProjection && !isStudentOnly && !isParentOnly ? {
                label: "Crear Primera Proyección",
                onClick: () => {
                  console.log('Create projection')
                }
              } : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
