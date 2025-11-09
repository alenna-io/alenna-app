import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { StudentInfoCard } from "@/components/ui/student-info-card"
import { SectionHeader } from "@/components/ui/section-header"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import type { QuarterData } from "@/types/pace"
import { useApi } from "@/services/api"
import type { ProjectionDetail, PaceDetail } from "@/types/projection-detail"
import { PacePickerDialog } from "@/components/pace-picker-dialog"
import { ErrorDialog } from "@/components/ui/error-dialog"
import { Navigate } from "react-router-dom"
import type { UserInfo } from "@/services/api"


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
  const [hasPermission, setHasPermission] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
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

  // Fetch user info to check if parent
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const info = await api.auth.getUserInfo()
        setUserInfo(info)
      } catch (err) {
        console.error('Error fetching user info:', err)
      }
    }

    fetchUserInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        const errorMessage = err instanceof Error ? err.message : 'Failed to load projection'

        // Check if it's a permission error or not found error
        if (errorMessage.includes('permiso') || errorMessage.includes('not found') || errorMessage.includes('Student not found') || errorMessage.includes('Proyección no encontrada') || errorMessage.includes('no encontrada') || errorMessage.includes('no encontrado')) {
          setHasPermission(false)
        } else {
          setError(errorMessage)
        }
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

  // Get current quarter and week from API (this will be null if no active school year)
  const [currentWeekInfo, setCurrentWeekInfo] = React.useState<{ quarter: string | null, week: number | null }>({ quarter: null, week: null })

  React.useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const weekInfo = await api.schoolYears.getCurrentWeek()
        setCurrentWeekInfo({
          quarter: weekInfo.currentQuarter?.name || null,
          week: weekInfo.currentWeek || null
        })
      } catch (err) {
        console.error('Error fetching current week:', err)
      }
    }

    fetchCurrentWeek()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentQuarter = currentWeekInfo.quarter
  const currentWeekInQuarter = currentWeekInfo.week

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
      } else {
        // No grade provided = mark as incomplete
        await api.projections.markIncomplete(studentId, projectionId, paceId)
      }

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
      console.error('Error actualizando PACE:', err)
      setErrorDialog({
        open: true,
        title: "Error actualizando PACE",
        message: err instanceof Error ? err.message : 'Error al actualizar PACE'
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


  // Check if user is a parent (read-only mode)
  const isParentOnly = userInfo?.roles.some(r => r.name === 'PARENT') &&
    !userInfo?.roles.some(r => r.name === 'TEACHER' || r.name === 'ADMIN')

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Mobile back button */}
        <div className="md:hidden">
          <BackButton to={`/students/${studentId}/projections`}>
            Volver
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
        {/* Mobile back button */}
        <div className="md:hidden">
          <BackButton to={`/students/${studentId}/projections`}>
            Volver
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
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={`/students/${studentId}/projections`}>
          Volver
        </BackButton>
      </div>

      {/* Student Info Card */}
      <StudentInfoCard student={student} showBadge={false} />

      {/* Title */}
      <SectionHeader
        title="Proyección Anual"
        description={`Planificación semanal por bloque para el año escolar ${student.schoolYear}`}
      />

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
          currentWeek={currentQuarter === "Q1" ? currentWeekInQuarter ?? undefined : undefined}
          onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
          onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={isParentOnly ? undefined : handleAddPace}
          onDeletePace={isParentOnly ? undefined : handleDeletePace}
          isReadOnly={isParentOnly}
        />
        <ACEQuarterlyTable
          quarter="Q2"
          quarterName="Bloque 2"
          data={projectionData.Q2}
          isActive={currentQuarter === "Q2"}
          currentWeek={currentQuarter === "Q2" ? currentWeekInQuarter ?? undefined : undefined}
          onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
          onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={isParentOnly ? undefined : handleAddPace}
          onDeletePace={isParentOnly ? undefined : handleDeletePace}
          isReadOnly={isParentOnly}
        />
        <ACEQuarterlyTable
          quarter="Q3"
          quarterName="Bloque 3"
          data={projectionData.Q3}
          isActive={currentQuarter === "Q3"}
          currentWeek={currentQuarter === "Q3" ? currentWeekInQuarter ?? undefined : undefined}
          onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
          onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={isParentOnly ? undefined : handleAddPace}
          onDeletePace={isParentOnly ? undefined : handleDeletePace}
          isReadOnly={isParentOnly}
        />
        <ACEQuarterlyTable
          quarter="Q4"
          quarterName="Bloque 4"
          data={projectionData.Q4}
          isActive={currentQuarter === "Q4"}
          currentWeek={currentQuarter === "Q4" ? currentWeekInQuarter ?? undefined : undefined}
          onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
          onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={isParentOnly ? undefined : handleAddPace}
          onDeletePace={isParentOnly ? undefined : handleDeletePace}
          isReadOnly={isParentOnly}
        />
      </div>

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        confirmText="Entendido"
      />
    </div>
  )
}

