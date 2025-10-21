import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { Calendar, GraduationCap, Clock } from "lucide-react"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import type { QuarterData } from "@/types/pace"
import { useApi } from "@/services/api"
import type { ProjectionDetail, PaceDetail } from "@/types/projection-detail"
import { PacePickerDialog } from "@/components/pace-picker-dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"


// Helper to create empty quarter data structure
const createEmptyQuarterData = (): QuarterData => ({
  Math: Array(9).fill(null),
  English: Array(9).fill(null),
  Science: Array(9).fill(null),
  "Social Studies": Array(9).fill(null),
  "Word Building": Array(9).fill(null),
  Spanish: Array(9).fill(null)
})

// Empty initial state (will be replaced by API data)
const initialProjectionData = {
  Q1: createEmptyQuarterData(),
  Q2: createEmptyQuarterData(),
  Q3: createEmptyQuarterData(),
  Q4: createEmptyQuarterData(),
}

export default function ACEProjectionPage() {
  const navigate = useNavigate()
  const { studentId, projectionId } = useParams()
  const api = useApi()
  const [projectionData, setProjectionData] = React.useState(initialProjectionData)
  const [projectionDetail, setProjectionDetail] = React.useState<ProjectionDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pacePickerOpen, setPacePickerOpen] = React.useState(false)
  const [pacePickerContext, setPacePickerContext] = React.useState<{
    quarter: string
    subject: string
    weekIndex: number
  } | null>(null)
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean
    title?: string
    message: string
  }>({ open: false, message: "" })

  // Fetch projection detail from API
  React.useEffect(() => {
    const fetchProjectionDetail = async () => {
      if (!studentId || !projectionId) return

      try {
        setLoading(true)
        setError(null)
        const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
        setProjectionDetail(detail)

        // Convert API data to the format expected by ACEQuarterlyTable
        const convertedData = {
          Q1: convertQuarterData(detail.quarters.Q1),
          Q2: convertQuarterData(detail.quarters.Q2),
          Q3: convertQuarterData(detail.quarters.Q3),
          Q4: convertQuarterData(detail.quarters.Q4),
        }
        setProjectionData(convertedData)
      } catch (err) {
        console.error('Error fetching projection detail:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projection')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectionDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId])

  // Helper function to convert API pace detail to PaceData (including ID for updates)
  const convertQuarterData = (quarterPaces: { [subject: string]: (PaceDetail | null)[] }): QuarterData => {
    const result: QuarterData = {}

    Object.keys(quarterPaces).forEach(subject => {
      result[subject] = quarterPaces[subject].map(pace => {
        if (!pace) return null

        return {
          id: pace.id, // Include ID for updates/deletes
          number: pace.number,
          grade: pace.grade,
          isCompleted: pace.isCompleted,
          isFailed: pace.isFailed,
          gradeHistory: pace.gradeHistory.map(gh => ({
            grade: gh.grade,
            date: gh.date,
            note: gh.note,
          })),
        }
      })
    })

    return result
  }

  // Calculate current week (mock - in real app this would come from backend)
  // For demo: Q2, Week 5
  const currentQuarter: string = "Q2"
  const currentWeekInQuarter = 5
  const currentSchoolWeek = 14 // Overall week 14 = Q2 Week 5

  // Handle drag and drop - SAVES TO DATABASE
  const handlePaceDrop = async (quarter: string, subject: string, fromWeek: number, toWeek: number) => {
    if (!studentId || !projectionId) return

    try {
      const quarterData = projectionData[quarter as keyof typeof projectionData]
      const fromPace = quarterData[subject][fromWeek]
      const toPace = quarterData[subject][toWeek]

      // Move the dragged PACE to the target position
      if (fromPace && fromPace.id) {
        await api.projections.movePace(studentId, projectionId, fromPace.id, {
          quarter,
          week: toWeek + 1 // Convert index to week number
        })
      }

      // If there was a PACE at the target position, swap it
      if (toPace && toPace.id) {
        await api.projections.movePace(studentId, projectionId, toPace.id, {
          quarter,
          week: fromWeek + 1 // Convert index to week number
        })
      }

      // Reload projection data to reflect changes
      const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
      setProjectionDetail(detail)
      const convertedData = {
        Q1: convertQuarterData(detail.quarters.Q1),
        Q2: convertQuarterData(detail.quarters.Q2),
        Q3: convertQuarterData(detail.quarters.Q3),
        Q4: convertQuarterData(detail.quarters.Q4),
      }
      setProjectionData(convertedData)
    } catch (err) {
      console.error('Error moving PACE:', err)
      setErrorDialog({
        open: true,
        title: "Error Moving PACE",
        message: err instanceof Error ? err.message : 'Failed to move PACE'
      })

      // Reload data to revert UI on error
      try {
        const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
        setProjectionDetail(detail)
        const convertedData = {
          Q1: convertQuarterData(detail.quarters.Q1),
          Q2: convertQuarterData(detail.quarters.Q2),
          Q3: convertQuarterData(detail.quarters.Q3),
          Q4: convertQuarterData(detail.quarters.Q4),
        }
        setProjectionData(convertedData)
      } catch (reloadErr) {
        console.error('Error reloading after failed move:', reloadErr)
      }
    }
  }

  // Handle pace completion and grade - SAVES TO DATABASE
  const handlePaceToggle = async (quarter: string, subject: string, weekIndex: number, grade?: number, comment?: string) => {
    if (!studentId || !projectionId) return

    try {
      const quarterData = projectionData[quarter as keyof typeof projectionData]
      const pace = quarterData[subject][weekIndex]

      if (!pace || !('id' in pace)) {
        console.error('PACE not found or missing ID')
        return
      }

      const paceId = pace.id!

      if (grade !== undefined) {
        // Update grade
        await api.projections.updatePaceGrade(studentId, projectionId, paceId, {
          grade,
          note: comment,
        })

        // Reload projection data
        const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
        setProjectionDetail(detail)
        const convertedData = {
          Q1: convertQuarterData(detail.quarters.Q1),
          Q2: convertQuarterData(detail.quarters.Q2),
          Q3: convertQuarterData(detail.quarters.Q3),
          Q4: convertQuarterData(detail.quarters.Q4),
        }
        setProjectionData(convertedData)
      }
    } catch (err) {
      console.error('Error updating PACE grade:', err)
      setErrorDialog({
        open: true,
        title: "Error Updating Grade",
        message: err instanceof Error ? err.message : 'Failed to update PACE grade'
      })
    }
  }

  // Handle week click to navigate to daily goals
  const handleWeekClick = (quarter: string, week: number) => {
    navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`)
  }

  // Handle adding new pace - Opens PACE picker
  const handleAddPace = (quarter: string, subject: string, weekIndex: number) => {
    // Open PACE picker dialog
    setPacePickerContext({ quarter, subject, weekIndex })
    setPacePickerOpen(true)
  }

  // Handle PACE selection from picker - SAVES TO DATABASE
  const handlePaceSelect = async (paceId: string) => {
    if (!studentId || !projectionId || !pacePickerContext) return

    try {
      const { quarter, weekIndex } = pacePickerContext

      // Add PACE to projection
      await api.projections.addPace(studentId, projectionId, {
        paceCatalogId: paceId,
        quarter,
        week: weekIndex + 1
      })

      // Reload projection data
      const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
      setProjectionDetail(detail)
      const convertedData = {
        Q1: convertQuarterData(detail.quarters.Q1),
        Q2: convertQuarterData(detail.quarters.Q2),
        Q3: convertQuarterData(detail.quarters.Q3),
        Q4: convertQuarterData(detail.quarters.Q4),
      }
      setProjectionData(convertedData)

      setPacePickerContext(null)
    } catch (err) {
      console.error('Error agregando PACE:', err)
      setErrorDialog({
        open: true,
        title: "Error agregando PACE",
        message: err instanceof Error ? err.message : 'Error al agregar PACE'
      })
    }
  }

  // Handle deleting a pace - SAVES TO DATABASE
  const handleDeletePace = async (quarter: string, subject: string, weekIndex: number) => {
    if (!studentId || !projectionId) return

    try {
      const quarterData = projectionData[quarter as keyof typeof projectionData]
      const pace = quarterData[subject][weekIndex]

      if (!pace || !('id' in pace)) {
        console.error('PACE no encontrado o ID faltante')
        return
      }

      const paceId = pace.id!

      // Remove PACE from projection
      await api.projections.removePace(studentId, projectionId, paceId)

      // Reload projection data
      const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
      setProjectionDetail(detail)
      const convertedData = {
        Q1: convertQuarterData(detail.quarters.Q1),
        Q2: convertQuarterData(detail.quarters.Q2),
        Q3: convertQuarterData(detail.quarters.Q3),
        Q4: convertQuarterData(detail.quarters.Q4),
      }
      setProjectionData(convertedData)
    } catch (err) {
      console.error('Error eliminando PACE:', err)
      setErrorDialog({
        open: true,
        title: "Error eliminando PACE",
        message: err instanceof Error ? err.message : 'Error al eliminar PACE'
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
            <span className="hidden sm:inline">Volver a Proyecciones</span>
            <span className="sm:hidden">Volver</span>
          </BackButton>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Cargando proyección...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
            <span className="hidden sm:inline">Volver a Proyecciones</span>
            <span className="sm:hidden">Volver</span>
          </BackButton>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use projection detail for student data
  const student = projectionDetail ? {
    id: projectionDetail.studentId,
    name: projectionDetail.student.fullName,
    currentGrade: projectionDetail.student.currentLevel || 'N/A',
    schoolYear: projectionDetail.schoolYear,
  } : {
    id: '',
    name: 'Cargando...',
    currentGrade: '',
    schoolYear: ''
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
          <span className="hidden sm:inline">Volver a Proyecciones</span>
          <span className="sm:hidden">Volver</span>
        </BackButton>
      </div>

      {/* Current Week Indicator */}
      <Card className="border-green-500 bg-green-50/50">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-green-900">Semana Actual</h3>
                <p className="text-xs md:text-sm text-green-700">
                  {currentQuarter} - Semana {currentWeekInQuarter}
                  <span className="hidden sm:inline"> (Semana {currentSchoolWeek} del año escolar)</span>
                </p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <Badge className="bg-green-600 text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                Semana {currentSchoolWeek}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Info Card */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0">
              <AvatarFallback className="text-xl md:text-2xl font-semibold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold mb-2 truncate">{student.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>{student.currentGrade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="truncate">Año Escolar: {student.schoolYear}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 md:py-2 self-end sm:self-auto">
              A.C.E. System
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Proyección de PACEs</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Planificación semanal por bloque para el año escolar {student.schoolYear}
        </p>
      </div>

      {/* PACE Picker Dialog */}
      {pacePickerContext && (
        <PacePickerDialog
          open={pacePickerOpen}
          onClose={() => {
            setPacePickerOpen(false)
            setPacePickerContext(null)
          }}
          onSelect={handlePaceSelect}
          categoryFilter={pacePickerContext.subject}
          levelFilter={projectionDetail?.student.currentLevel}
          title={`Agregar PACE - ${pacePickerContext.subject} (${pacePickerContext.quarter} Semana ${pacePickerContext.weekIndex + 1})`}
        />
      )}

      {/* Quarterly Tables */}
      <div className="space-y-4 md:space-y-8">
        <ACEQuarterlyTable
          quarter="Q1"
          quarterName="Bloque 1"
          data={projectionData.Q1}
          isActive={currentQuarter === "Q1"}
          currentWeek={currentQuarter === "Q1" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
        <ACEQuarterlyTable
          quarter="Q2"
          quarterName="Bloque 2"
          data={projectionData.Q2}
          isActive={currentQuarter === "Q2"}
          currentWeek={currentQuarter === "Q2" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
        <ACEQuarterlyTable
          quarter="Q3"
          quarterName="Bloque 3"
          data={projectionData.Q3}
          isActive={currentQuarter === "Q3"}
          currentWeek={currentQuarter === "Q3" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
        <ACEQuarterlyTable
          quarter="Q4"
          quarterName="Bloque 4"
          data={projectionData.Q4}
          isActive={currentQuarter === "Q4"}
          currentWeek={currentQuarter === "Q4" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
      </div>

      {/* Error Dialog */}
      <AlertDialog
        isOpen={errorDialog.open}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        confirmText="Entendido"
        cancelText=""
        variant="danger"
        onConfirm={() => setErrorDialog(prev => ({ ...prev, open: false }))}
        onCancel={() => setErrorDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}

