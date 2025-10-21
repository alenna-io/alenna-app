import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { NoPermission } from "@/components/no-permission"
import { Calendar, ChevronRight, BookOpen, AlertCircle } from "lucide-react"
import { useApi } from "@/services/api"
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
          // Check if it's a permission error
          if (error.message?.includes('permiso')) {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Activo" : "Inactivo"
  }

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <NoPermission onBack={() => navigate(`/students/${studentId}`)} />
  }

  if (isLoading) {
    return <LoadingSkeleton variant="list" />
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => navigate(`/students/${studentId}`)}>
          Volver al Perfil
        </BackButton>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Error al cargar datos
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error || 'No se pudo cargar el estudiante'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton onClick={() => navigate(`/students/${studentId}`)}>
          Volver al Perfil
        </BackButton>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <p className="text-muted-foreground">{student.certificationType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Proyecciones A.C.E.
        </h2>
        <p className="text-muted-foreground">
          Historial de proyecciones por año escolar
        </p>
      </div>

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
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
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
                    <Badge className={getStatusColor(projection.isActive)}>
                      {getStatusLabel(projection.isActive)}
                    </Badge>
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
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proyecciones</h3>
            <p className="text-muted-foreground mb-4">
              No se han creado proyecciones para este estudiante
            </p>
            <Button onClick={() => {
              // TODO: Implement create projection dialog
              console.log('Create projection')
            }}>
              <Calendar className="h-4 w-4 mr-2" />
              Crear Primera Proyección
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
