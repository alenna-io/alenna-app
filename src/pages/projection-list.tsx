import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, ChevronRight, BookOpen } from "lucide-react"

interface Projection {
  id: string
  schoolYear: string
  startDate: string
  endDate: string
  totalPaces: number
  completedPaces: number
  status: "active" | "completed" | "upcoming"
}

// Mock student data - in real app this would come from API
const mockStudent = {
  id: "1",
  name: "María González López",
  currentGrade: "8th Grade"
}

// Mock projections data - ordered by year (latest first)
const mockProjections: Projection[] = [
  {
    id: "3",
    schoolYear: "2025-2026",
    startDate: "2025-08-15",
    endDate: "2026-06-15",
    totalPaces: 216,
    completedPaces: 0,
    status: "upcoming"
  },
  {
    id: "2",
    schoolYear: "2024-2025",
    startDate: "2024-08-15",
    endDate: "2025-06-15",
    totalPaces: 216,
    completedPaces: 89,
    status: "active"
  },
  {
    id: "1",
    schoolYear: "2023-2024",
    startDate: "2023-08-15",
    endDate: "2024-06-15",
    totalPaces: 216,
    completedPaces: 216,
    status: "completed"
  }
]

export default function ProjectionListPage() {
  const navigate = useNavigate()
  const { studentId } = useParams()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "upcoming":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "completed":
        return "Completado"
      case "upcoming":
        return "Próximo"
      default:
        return status
    }
  }

  const getProgressPercentage = (projection: Projection) => {
    return Math.round((projection.completedPaces / projection.totalPaces) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/students")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Estudiantes
        </Button>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(mockStudent.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{mockStudent.name}</h1>
              <p className="text-muted-foreground">{mockStudent.currentGrade}</p>
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
      <div className="space-y-4">
        {mockProjections.map((projection) => (
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
                  <Badge className={getStatusColor(projection.status)}>
                    {getStatusLabel(projection.status)}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">
                      {projection.completedPaces} / {projection.totalPaces} PACEs ({getProgressPercentage(projection)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(projection)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{projection.totalPaces}</p>
                    <p className="text-xs text-muted-foreground">Total PACEs</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-600">{projection.completedPaces}</p>
                    <p className="text-xs text-muted-foreground">Completados</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-orange-600">
                      {projection.totalPaces - projection.completedPaces}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockProjections.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proyecciones</h3>
            <p className="text-muted-foreground mb-4">
              No se han creado proyecciones para este estudiante
            </p>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Crear Primera Proyección
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

