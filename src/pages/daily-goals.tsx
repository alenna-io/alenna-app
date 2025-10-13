import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { Calendar, Target } from "lucide-react"

export default function DailyGoalsPage() {
  const navigate = useNavigate()
  const { studentId, projectionId, quarter, week } = useParams()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton onClick={() => navigate(`/students/${studentId}/projections/${projectionId}`)}>
          Volver a Proyección
        </BackButton>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Target className="h-8 w-8" />
          Metas Diarias
        </h1>
        <p className="text-muted-foreground">
          {quarter} - Semana {week}
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planificación Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Próximamente</p>
              <p>Aquí podrás gestionar las metas diarias para esta semana</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

