import * as React from "react"
import { useParams, useLocation } from "react-router-dom"
import { BackButton } from "@/components/ui/back-button"
import { Loading } from "@/components/ui/loading"
import { StudentInfoCard } from "@/components/ui/student-info-card"
import { DailyGoalsTable } from "@/components/daily-goals-table"
import { useApi } from "@/services/api"
import type { DailyGoalData } from "@/types/pace"
import type { ProjectionDetail } from "@/types/projection-detail"
import { toast } from "sonner"

interface Student {
  id: string
  name: string
  currentGrade: string
  schoolYear: string
}

interface LocationState {
  student?: Student | null
}

// Helper function to calculate pages from input value
const calculatePagesFromValue = (value: string): number => {
  if (!value.trim()) return 0

  const trimmedValue = value.trim()

  // Check for "ST" (Self Test) - case insensitive
  if (/^st$/i.test(trimmedValue)) {
    return 3
  }

  // Check for "T" (Test) - case insensitive
  if (/^t$/i.test(trimmedValue)) {
    return 1
  }

  // Check for range format (e.g., "45-46", "1-10") - must be valid numbers 1-1000
  const rangeMatch = trimmedValue.match(/^([1-9]\d{0,3})-([1-9]\d{0,3})$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    // Validate range is within 1-1000 and start <= end
    if (start >= 1 && end <= 1000 && start <= end) {
      const pages = end - start + 1 // +1 because both start and end are included
      return pages
    }
  }

  // Check for single number (1-1000) - no leading zeros
  const singleMatch = trimmedValue.match(/^[1-9]\d{0,3}$/)
  if (singleMatch) {
    const num = parseInt(singleMatch[0])
    if (num >= 1 && num <= 1000) {
      return 1
    }
  }

  // If no valid format, return 0
  return 0
}

export default function DailyGoalsPage() {
  const { studentId, projectionId, quarter, week } = useParams()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const api = useApi()
  const [goalsData, setGoalsData] = React.useState<DailyGoalData>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [canEdit, setCanEdit] = React.useState(false)
  const [projectionDetail, setProjectionDetail] = React.useState<ProjectionDetail | null>(null)
  // Initialize student from location state if available (passed from ACE Projection)
  const [student, setStudent] = React.useState<Student | null>(locationState?.student || null)

  // Load daily goals from API
  React.useEffect(() => {
    const loadDailyGoals = async () => {
      if (!studentId || !projectionId || !quarter || !week) return

      try {
        setLoading(true)
        setError(null)
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (err) {
        console.error('Error loading daily goals:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar las metas diarias')
        // Fallback to empty data structure
        const subjects = ['Math', 'English', 'Science', 'Social Studies', 'Word Building', 'Spanish']
        const emptyData: DailyGoalData = {}
        subjects.forEach(subject => {
          emptyData[subject] = Array(5).fill(null).map(() => ({
            text: '',
            isCompleted: false,
            notes: undefined,
            notesCompleted: false,
            notesHistory: []
          }))
        })
        setGoalsData(emptyData)
      } finally {
        setLoading(false)
      }
    }

    loadDailyGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId, quarter, week])

  React.useEffect(() => {
    const loadPermissions = async () => {
      try {
        const userInfo = await api.auth.getUserInfo()
        setCanEdit(userInfo.permissions?.includes('projections.update') ?? false)
      } catch (err) {
        console.error('Error fetching permissions:', err)
        setCanEdit(false)
      }
    }

    loadPermissions()
  }, [api])

  // Load student info from projection detail only if not passed via state
  // This handles direct URL access or page refresh
  React.useEffect(() => {
    const loadStudent = async () => {
      // Skip fetch if we already have student data from location state
      if (student) return

      if (!studentId || !projectionId) return

      try {
        const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
        setProjectionDetail(detail)
        setStudent({
          id: detail.studentId,
          name: detail.student.fullName,
          currentGrade: detail.student.currentLevel || "N/A",
          schoolYear: detail.schoolYear,
        })
      } catch (err) {
        console.error("Error loading student for daily goals:", err)
        // Fallback to a generic placeholder if needed
        setStudent({
          id: studentId,
          name: "Estudiante",
          currentGrade: "",
          schoolYear: "",
        })
      }
    }

    loadStudent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId])

  // Calculate total pages for a specific day
  const calculateDayTotal = React.useMemo(() => {
    const dayTotals = [0, 0, 0, 0, 0] // 5 days

    Object.keys(goalsData).forEach(subject => {
      goalsData[subject]?.forEach((goal, dayIndex) => {
        const pages = calculatePagesFromValue(goal.text)
        dayTotals[dayIndex] += pages
      })
    })
    return dayTotals
  }, [goalsData])

  // Build subject to category mapping
  const subjectToCategory = React.useMemo(() => {
    const mapping = new Map<string, string>()
    if (projectionDetail) {
      Object.values(projectionDetail.quarters).forEach(quarter => {
        Object.entries(quarter).forEach(([subject, weekPaces]) => {
          const firstPace = weekPaces.find(p => p !== null)
          if (firstPace && firstPace.category) {
            mapping.set(subject, firstPace.category)
          }
        })
      })
    }
    return mapping
  }, [projectionDetail])

  const handleGoalUpdate = async (subject: string, dayIndex: number, value: string) => {
    if (!studentId || !projectionId || !quarter || !week) return

    const currentGoal = goalsData[subject]?.[dayIndex]

    // OPTIMISTIC UPDATE: Immediately update the goal in the UI
    const updatedGoalsData = { ...goalsData }
    if (!updatedGoalsData[subject]) {
      updatedGoalsData[subject] = Array(5).fill(null).map(() => ({
        text: '',
        isCompleted: false,
        notes: undefined,
        notesCompleted: false,
        notesHistory: []
      }))
    }

    updatedGoalsData[subject] = [...updatedGoalsData[subject]]
    updatedGoalsData[subject][dayIndex] = {
      ...currentGoal,
      text: value,
      isCompleted: currentGoal?.isCompleted || false,
      notes: currentGoal?.notes,
      notesCompleted: currentGoal?.notesCompleted || false,
      notesHistory: currentGoal?.notesHistory || []
    }
    setGoalsData(updatedGoalsData)

    try {
      if (currentGoal?.id) {
        // Update existing goal
        await api.dailyGoals.update(studentId, projectionId, currentGoal.id, {
          text: value,
          subject,
          quarter,
          week: parseInt(week),
          dayOfWeek: dayIndex
        })
        toast.success("Meta actualizada exitosamente")
      } else if (value.trim()) {
        // Create new goal
        await api.dailyGoals.create(studentId, projectionId, {
          subject,
          quarter,
          week: parseInt(week),
          dayOfWeek: dayIndex,
          text: value,
          isCompleted: false
        })
        toast.success("Meta creada exitosamente")
      }

      // Refresh data to ensure consistency
      const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
      setGoalsData(data)
    } catch (err) {
      console.error('Error updating goal:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la meta'

      toast.error(`Error: ${errorMessage}`)
      setError(errorMessage)

      // ROLLBACK: Reload data to revert UI on error
      try {
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (reloadErr) {
        console.error('Error reloading after failed goal update:', reloadErr)
      }
    }
  }

  const handleGoalToggle = async (subject: string, dayIndex: number) => {
    if (!studentId || !projectionId || !quarter || !week) return

    const currentGoal = goalsData[subject]?.[dayIndex]
    if (!currentGoal?.id) return

    const newCompleted = !currentGoal.isCompleted

    // OPTIMISTIC UPDATE: Immediately toggle completion in the UI
    const updatedGoalsData = { ...goalsData }
    updatedGoalsData[subject] = [...updatedGoalsData[subject]]
    updatedGoalsData[subject][dayIndex] = {
      ...currentGoal,
      isCompleted: newCompleted,
      // If completing and has pending notes, optimistically clear them
      notes: (newCompleted && currentGoal.notes && !currentGoal.notesCompleted) ? undefined : currentGoal.notes,
      notesCompleted: (newCompleted && currentGoal.notes && !currentGoal.notesCompleted) ? true : currentGoal.notesCompleted,
      notesHistory: (newCompleted && currentGoal.notes && !currentGoal.notesCompleted)
        ? [...(currentGoal.notesHistory || []), { text: currentGoal.notes, completedDate: new Date().toISOString() }]
        : currentGoal.notesHistory
    }
    setGoalsData(updatedGoalsData)

    try {
      await api.dailyGoals.updateCompletion(studentId, projectionId, currentGoal.id, newCompleted)

      // If goal is being marked as completed and has pending notes, auto-complete them
      if (newCompleted && currentGoal.notes && !currentGoal.notesCompleted) {
        try {
          // Add note to history and clear current note
          await api.dailyGoals.addNoteToHistory(studentId, projectionId, currentGoal.id, currentGoal.notes)
          await api.dailyGoals.updateNotes(studentId, projectionId, currentGoal.id, {
            notes: undefined,
            notesCompleted: true
          })
        } catch (notesErr) {
          console.error('Error auto-completing notes:', notesErr)
          // Don't fail the whole operation if notes completion fails
        }
      }

      toast.success(newCompleted ? "Meta completada" : "Meta marcada como incompleta")

      // Refresh data to ensure consistency
      const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
      setGoalsData(data)
    } catch (err) {
      console.error('Error toggling goal completion:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el estado de la meta'

      toast.error(`Error: ${errorMessage}`)
      setError(errorMessage)

      // ROLLBACK: Reload data to revert UI on error
      try {
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (reloadErr) {
        console.error('Error reloading after failed goal toggle:', reloadErr)
      }
    }
  }

  const handleNotesUpdate = async (subject: string, dayIndex: number, notes: string) => {
    if (!studentId || !projectionId || !quarter || !week) return

    const currentGoal = goalsData[subject]?.[dayIndex]
    if (!currentGoal?.id) return

    // OPTIMISTIC UPDATE: Immediately update notes in the UI
    const updatedGoalsData = { ...goalsData }
    updatedGoalsData[subject] = [...updatedGoalsData[subject]]
    updatedGoalsData[subject][dayIndex] = {
      ...currentGoal,
      notes: notes || undefined,
      notesCompleted: false
    }
    setGoalsData(updatedGoalsData)

    try {
      await api.dailyGoals.updateNotes(studentId, projectionId, currentGoal.id, {
        notes: notes || undefined,
        notesCompleted: false
      })

      toast.success(notes ? "Nota guardada" : "Nota eliminada")

      // Refresh data to ensure consistency
      const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
      setGoalsData(data)
    } catch (err) {
      console.error('Error updating notes:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la nota'

      toast.error(`Error: ${errorMessage}`)
      setError(errorMessage)

      // ROLLBACK: Reload data to revert UI on error
      try {
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (reloadErr) {
        console.error('Error reloading after failed notes update:', reloadErr)
      }
    }
  }




  const getQuarterName = (quarter: string) => {
    const quarterNames: { [key: string]: string } = {
      'Q1': 'Primer Bloque',
      'Q2': 'Segundo Bloque',
      'Q3': 'Tercer Bloque',
      'Q4': 'Cuarto Bloque'
    }
    return quarterNames[quarter] || quarter
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-only back button (desktop uses breadcrumb) */}
      <div className="flex items-center gap-4 md:hidden">
        <BackButton to={`/students/${studentId}/projections/${projectionId}`}>
          Volver
        </BackButton>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Info Card */}
      <StudentInfoCard
        student={student || {
          id: studentId || "",
          name: "Cargando estudiante...",
          currentGrade: "",
          schoolYear: ""
        }}
        showBadge={false}
      />

      {/* Loading State */}
      {loading ? (
        <Loading variant="spinner" message="Cargando metas diarias..." />
      ) : (
        /* Daily Goals Table */
        <DailyGoalsTable
          quarter={quarter || "Q1"}
          quarterName={quarter ? getQuarterName(quarter) : "Primer Bloque"}
          week={parseInt(week || "1")}
          data={goalsData}
          subjects={Object.keys(goalsData)}
          subjectToCategory={subjectToCategory}
          onGoalUpdate={canEdit ? handleGoalUpdate : undefined}
          onGoalToggle={canEdit ? handleGoalToggle : undefined}
          onNotesUpdate={canEdit ? handleNotesUpdate : undefined}
          dayTotals={calculateDayTotal}
        />
      )}
    </div>
  )
}

