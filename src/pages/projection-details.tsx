import * as React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { BackButton } from "@/components/ui/back-button"
import { StudentInfoCard } from "@/components/ui/student-info-card"
import { SectionHeader } from "@/components/ui/section-header"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import { MonthlyAssignmentsSection } from "@/components/monthly-assignments-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import type { QuarterData } from "@/types/pace"
import { useApi } from "@/services/api"
import type { ProjectionDetail, PaceDetail } from "@/types/projection-detail"
import type { MonthlyAssignment } from "@/types/monthly-assignment"
import { PacePickerDialog } from "@/components/pace-picker-dialog"
import { getCategoryOrder } from "@/utils/category-order"
import { ErrorDialog } from "@/components/ui/error-dialog"
import type { UserInfo } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useModuleAccess } from "@/hooks/useModuleAccess"


// Helper to create empty quarter data structure
const createEmptyQuarterData = (): QuarterData => ({
  Math: Array(9).fill(null),
  English: Array(9).fill(null),
  "Word Building": Array(9).fill(null),
  Science: Array(9).fill(null),
  "Social Studies": Array(9).fill(null),
  Spanish: Array(9).fill(null),
  Electives: Array(9).fill(null)
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
  const { t } = useTranslation()
  const { hasModule } = useModuleAccess()
  const [projectionData, setProjectionData] = React.useState(initialProjectionData)
  const [projectionDetail, setProjectionDetail] = React.useState<ProjectionDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)


  // Check user roles for super admin
  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])
  const isSuperAdmin = hasRole('SUPERADMIN')

  // Redirect super admins - they should not access projection detail page
  React.useEffect(() => {
    if (isSuperAdmin) {
      navigate('/users', { replace: true })
    }
  }, [isSuperAdmin, navigate])
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
  const [monthlyAssignments, setMonthlyAssignments] = React.useState<MonthlyAssignment[]>([])

  // Compute existing pace catalog IDs (for preventing re-adding deleted paces)
  const existingPaceCatalogIds = React.useMemo(() => {
    const ids = new Set<string>()
    if (projectionDetail) {
      Object.values(projectionDetail.quarters).forEach(quarter => {
        Object.values(quarter).forEach(weekPaces => {
          weekPaces.forEach(pace => {
            if (pace) ids.add(pace.paceCatalogId)
          })
        })
      })
    }
    return Array.from(ids)
  }, [projectionDetail])

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
        // Pass categories to ensure all projection categories are shown in all quarters
        const convertedData = {
          Q1: convertQuarterData(detail.quarters.Q1, detail.categories),
          Q2: convertQuarterData(detail.quarters.Q2, detail.categories),
          Q3: convertQuarterData(detail.quarters.Q3, detail.categories),
          Q4: convertQuarterData(detail.quarters.Q4, detail.categories),
        }
        setProjectionData(convertedData)

        // Fetch monthly assignments only if module is enabled
        const hasMonthlyAssignmentsModule = hasModule('monthlyAssignments')
        if (hasMonthlyAssignmentsModule) {
          try {
            const assignments = await api.monthlyAssignments.get(studentId, projectionId)
            setMonthlyAssignments(assignments)
          } catch (err) {
            // Silently fail if monthly assignments can't be fetched (module might not be enabled)
            console.warn('Could not fetch monthly assignments:', err)
            setMonthlyAssignments([])
          }
        } else {
          setMonthlyAssignments([])
        }
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
  const convertQuarterData = (
    quarterPaces: { [subject: string]: (PaceDetail | null)[] },
    projectionCategories?: string[]
  ): QuarterData => {
    // First, group sub-subjects by category from the paces in this quarter
    const categoryGroups = new Map<string, string[]>() // category -> [subjects]

    Object.keys(quarterPaces).forEach(subject => {
      const firstPace = quarterPaces[subject].find(p => p !== null)
      if (firstPace && firstPace.category) {
        const category = firstPace.category
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, [])
        }
        categoryGroups.get(category)!.push(subject)
      }
    })

    // Now build result grouped by category
    const result: QuarterData = {}

    // Use categories from projection if available, otherwise use categories from paces
    const categoriesFromPaces = Array.from(new Set(
      Array.from(categoryGroups.keys())
    ))

    // Use projection categories if available, otherwise fall back to categories from paces
    // This ensures ALL projection categories are shown, even if empty in this quarter
    const allCategories = projectionCategories && projectionCategories.length > 0
      ? new Set(projectionCategories)
      : new Set(categoriesFromPaces)

    // Sort categories by default order
    const sortedCategories = Array.from(allCategories).sort((a, b) => {
      return getCategoryOrder(a) - getCategoryOrder(b)
    })

    // Process ALL categories (even if they have no paces in this quarter)
    sortedCategories.forEach(category => {
      const subjects = categoryGroups.get(category) || [] // Empty array if category has no subjects in this quarter
      // For each week (0-8), collect all paces from all sub-subjects in this category
      const weekPaces: (import('@/types/pace').PaceData | null | import('@/types/pace').PaceData[])[] = Array(9).fill(null)

      for (let weekIndex = 0; weekIndex < 9; weekIndex++) {
        const pacesForWeek: import('@/types/pace').PaceData[] = []

        subjects.forEach(subject => {
          const pace = quarterPaces[subject]?.[weekIndex]
          if (pace) {
            pacesForWeek.push({
              id: pace.id,
              number: pace.number,
              grade: pace.grade,
              isCompleted: pace.isCompleted,
              isFailed: pace.isFailed,
              gradeHistory: pace.gradeHistory.map(gh => ({
                grade: gh.grade,
                date: gh.date,
                note: gh.note,
              })),
            })
          }
        })

        // If only one pace, store it directly; if multiple, store as array; if none, null
        if (pacesForWeek.length === 0) {
          weekPaces[weekIndex] = null
        } else if (pacesForWeek.length === 1) {
          weekPaces[weekIndex] = pacesForWeek[0]
        } else {
          weekPaces[weekIndex] = pacesForWeek
        }
      }

      // Always add the category to result, even if all weeks are null (empty row)
      result[category] = weekPaces
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

  // Handle drag and drop - SAVES TO DATABASE (with optimistic update)
  const handlePaceDrop = async (quarter: string, subject: string, fromWeek: number, toWeek: number) => {
    if (!studentId || !projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const fromPaceRaw = quarterData[subject][fromWeek]
    const toPaceRaw = quarterData[subject][toWeek]

    // Only allow dragging single paces, not arrays
    const fromPace = Array.isArray(fromPaceRaw) ? null : fromPaceRaw
    const toPace = Array.isArray(toPaceRaw) ? null : toPaceRaw

    if (!fromPace || !fromPace.id) {
      console.error('Cannot drag: source pace is invalid or an array')
      return
    }

    // OPTIMISTIC UPDATE: Immediately swap the PACEs in the UI
    const updatedProjectionData = { ...projectionData }
    updatedProjectionData[quarter as keyof typeof projectionData] = {
      ...quarterData,
      [subject]: quarterData[subject].map((pace, idx) => {
        if (idx === fromWeek) return toPaceRaw
        if (idx === toWeek) return fromPaceRaw
        return pace
      })
    }
    setProjectionData(updatedProjectionData)

    try {
      // Move the dragged PACE to the target position
      await api.projections.movePace(studentId, projectionId, fromPace.id, {
        quarter,
        week: toWeek + 1 // Convert index to week number
      })

      // If there was a PACE at the target position, swap it
      if (toPace && toPace.id) {
        await api.projections.movePace(studentId, projectionId, toPace.id, {
          quarter,
          week: fromWeek + 1 // Convert index to week number
        })
      }

      toast.success(t("projections.lessonMoved"))

      // Optionally reload to ensure consistency with backend
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
      console.error('Error moving Lecture:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to move Lecture'

      toast.error(t("projections.errorMovingLesson") + ": " + errorMessage)
      setErrorDialog({
        open: true,
        title: t("projections.errorMovingLessonTitle"),
        message: errorMessage
      })

      // ROLLBACK: Reload data to revert UI on error
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

  // Handle pace completion and grade - SAVES TO DATABASE (with optimistic update)
  const handlePaceToggle = async (quarter: string, subject: string, weekIndex: number, grade?: number) => {
    if (!studentId || !projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const pace = quarterData[subject][weekIndex]

    if (!pace || !('id' in pace)) {
      console.error('Lección no encontrada o ID faltante')
      return
    }

    const paceId = pace.id!

    // OPTIMISTIC UPDATE: Immediately update the PACE in the UI
    const updatedProjectionData = { ...projectionData }
    const updatedQuarterData = { ...quarterData }
    const updatedWeekPaces = [...quarterData[subject]]

    if (grade !== undefined) {
      // Update with new grade
      const isFailing = grade < 80
      updatedWeekPaces[weekIndex] = {
        ...pace,
        grade,
        isCompleted: true,
        isFailed: isFailing,
        gradeHistory: [
          ...(pace.gradeHistory || []),
          { grade, date: new Date().toISOString() }
        ]
      }
    } else {
      // Mark as incomplete
      updatedWeekPaces[weekIndex] = {
        ...pace,
        isCompleted: false,
        isFailed: false,
        grade: null
      }
    }

    updatedQuarterData[subject] = updatedWeekPaces
    updatedProjectionData[quarter as keyof typeof projectionData] = updatedQuarterData
    setProjectionData(updatedProjectionData)

    try {
      if (grade !== undefined) {
        // Update grade
        await api.projections.updatePaceGrade(studentId, projectionId, paceId, {
          grade,
        })
        toast.success(t("projections.lessonGradeSaved"))
      } else {
        // No grade provided = mark as incomplete
        await api.projections.markIncomplete(studentId, projectionId, paceId)
        toast.success(t("projections.lessonMarkedIncomplete"))
      }

      // Reload projection data to ensure consistency
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
      console.error('Error actualizando Lección:', err)
      const message = err instanceof Error ? err.message : 'Error al actualizar lección'

      toast.error(t("projections.errorPrefix") + ": " + message)
      setErrorDialog({
        open: true,
        title: t("projections.errorUpdatingLessonTitle"),
        message
      })

      // ROLLBACK: Reload data to revert UI on error
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
        console.error('Error reloading after failed toggle:', reloadErr)
      }
    }
  }

  // Handle week click to navigate to daily goals
  const handleWeekClick = (quarter: string, week: number) => {
    // Pass student data via state to avoid re-fetching in daily goals page
    navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`, {
      state: {
        student: projectionDetail ? {
          id: projectionDetail.studentId,
          name: projectionDetail.student.fullName,
          currentGrade: projectionDetail.student.currentLevel || "N/A",
          schoolYear: projectionDetail.schoolYear,
        } : null
      }
    })
  }

  // Handle adding new pace - Opens PACE picker
  const handleAddPace = (quarter: string, subject: string, weekIndex: number) => {
    // Open PACE picker dialog
    setPacePickerContext({ quarter, subject, weekIndex })
    setPacePickerOpen(true)
  }

  // Handle PACE selection from picker - SAVES TO DATABASE (with optimistic update)
  const handlePaceSelect = async (paceId: string, paceCode: string) => {
    if (!studentId || !projectionId || !pacePickerContext) return

    const { quarter, subject, weekIndex } = pacePickerContext

    // OPTIMISTIC UPDATE: Immediately add the PACE to the UI
    const optimisticPace = {
      id: `temp-${Date.now()}`, // Temporary ID
      number: paceCode,
      grade: null,
      isCompleted: false,
      isFailed: false,
      gradeHistory: []
    }

    const updatedProjectionData = { ...projectionData }
    const quarterData = updatedProjectionData[quarter as keyof typeof projectionData]
    const updatedQuarterData = { ...quarterData }
    const updatedWeekPaces = [...quarterData[subject]]
    updatedWeekPaces[weekIndex] = optimisticPace
    updatedQuarterData[subject] = updatedWeekPaces
    updatedProjectionData[quarter as keyof typeof projectionData] = updatedQuarterData
    setProjectionData(updatedProjectionData)

    // Close picker immediately for snappy UX
    setPacePickerContext(null)

    try {
      // Add PACE to projection
      await api.projections.addPace(studentId, projectionId, {
        paceCatalogId: paceId,
        quarter,
        week: weekIndex + 1
      })

      toast.success(t("projections.lessonAdded"))

      // Reload projection data to get the real ID and any server-side changes
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
      console.error('Error agregando Lección:', err)
      const errorMessage = err instanceof Error ? err.message : t("projections.errorAddingLesson")
      toast.error(errorMessage)

      // ROLLBACK: Re-fetch data to remove the optimistic update
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
      } catch (refetchErr) {
        console.error('Error re-fetching after failed add:', refetchErr)
      }

      setErrorDialog({
        open: true,
        title: t("projections.errorAddingLessonTitle"),
        message: err instanceof Error ? err.message : t("projections.errorAddingLesson")
      })
    }
  }

  // Handle deleting a pace - SAVES TO DATABASE (with optimistic update)
  const handleDeletePace = async (quarter: string, subject: string, weekIndex: number) => {
    if (!studentId || !projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const pace = quarterData[subject][weekIndex]

    if (!pace || !('id' in pace)) {
      console.error('Lección no encontrada o ID faltante')
      return
    }

    const paceId = pace.id!

    // OPTIMISTIC UPDATE: Immediately remove the PACE from the UI
    const updatedProjectionData = { ...projectionData }
    const updatedQuarterData = { ...quarterData }
    const updatedWeekPaces = [...quarterData[subject]]
    updatedWeekPaces[weekIndex] = null
    updatedQuarterData[subject] = updatedWeekPaces
    updatedProjectionData[quarter as keyof typeof projectionData] = updatedQuarterData
    setProjectionData(updatedProjectionData)

    try {
      // Remove PACE from projection
      await api.projections.removePace(studentId, projectionId, paceId)

      toast.success(t("projections.lessonDeleted"))

      // Reload projection data to ensure consistency
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
      console.error('Error eliminando Lección:', err)
      const errorMessage = err instanceof Error ? err.message : t("projections.errorDeletingLesson")

      toast.error(t("projections.errorPrefix") + ": " + errorMessage)
      setErrorDialog({
        open: true,
        title: t("projections.errorDeletingLessonTitle"),
        message: errorMessage
      })

      // ROLLBACK: Reload data to revert UI on error
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
        console.error('Error reloading after failed delete:', reloadErr)
      }
    }
  }


  // Monthly Assignments Handlers
  const refreshMonthlyAssignments = async () => {
    if (!studentId || !projectionId) return
    try {
      const assignments = await api.monthlyAssignments.get(studentId, projectionId)
      setMonthlyAssignments(assignments)
    } catch (err) {
      console.error('Error refreshing monthly assignments:', err)
    }
  }

  const handleGradeMonthlyAssignment = async (assignmentId: string, grade: number, note?: string) => {
    if (!studentId || !projectionId) return
    await api.monthlyAssignments.grade(studentId, projectionId, assignmentId, { grade, note })
    await refreshMonthlyAssignments()
  }

  // Check if user is a parent (read-only mode)
  const isParentOnly = userInfo?.roles.some(r => r.name === 'PARENT') &&
    !userInfo?.roles.some(r => r.name === 'TEACHER' || r.name === 'ADMIN')

  // Redirect super admins - they should not access projection detail page
  if (isSuperAdmin) {
    return <Navigate to="/users" replace />
  }

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
            {t("common.back")}
          </BackButton>
        </div>
        <Loading variant="spinner" message={t("projections.loadingProjection")} />
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
            {t("common.back")}
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
    name: t("common.loading"),
    currentGrade: '',
    schoolYear: ''
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={`/students/${studentId}/projections`}>
          {t("common.back")}
        </BackButton>
      </div>

      {/* Title with Ver Boleta button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title={t("projections.annualProjection")}
          description={t("projections.weeklyPlanningDescription", { year: student.schoolYear })}
        />
        {userInfo && (userInfo.permissions.includes('reportCards.read') || userInfo.permissions.includes('reportCards.readOwn')) && (
          <Button
            variant="default"
            onClick={() => navigate(`/students/${studentId}/report-cards/${projectionId}`)}
            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            {t("projections.viewReportCard")}
          </Button>
        )}
      </div>

      {/* Student Info Card */}
      <StudentInfoCard student={student} showBadge={false} />

      {/* PACE Picker Dialog */}
      {pacePickerContext && (
        <PacePickerDialog
          open={pacePickerOpen}
          onClose={() => {
            setPacePickerOpen(false)
            setPacePickerContext(null)
          }}
          onSelect={handlePaceSelect}
          categoryFilter={subjectToCategory.get(pacePickerContext.subject) || pacePickerContext.subject}
          title={t("projections.addLesson", { subject: pacePickerContext.subject, quarter: pacePickerContext.quarter, week: pacePickerContext.weekIndex + 1 })}
          existingPaceCatalogIds={existingPaceCatalogIds}
        />
      )}

      {/* Quarterly Tabs: show one quarter at a time (PACEs + Monthly Assignments) */}
      <Tabs defaultValue={currentQuarter || "Q1"} className="space-y-4 md:space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-4 min-w-max md:min-w-0">
            <TabsTrigger value="Q1" className="shrink-0">{t("monthlyAssignments.quarterLabelQ1")}</TabsTrigger>
            <TabsTrigger value="Q2" className="shrink-0">{t("monthlyAssignments.quarterLabelQ2")}</TabsTrigger>
            <TabsTrigger value="Q3" className="shrink-0">{t("monthlyAssignments.quarterLabelQ3")}</TabsTrigger>
            <TabsTrigger value="Q4" className="shrink-0">{t("monthlyAssignments.quarterLabelQ4")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="Q1" className="space-y-4 md:space-y-6">
          <ACEQuarterlyTable
            quarter="Q1"
            quarterName={t("monthlyAssignments.quarterLabelQ1")}
            data={projectionData.Q1}
            isActive={currentQuarter === "Q1"}
            currentWeek={currentQuarter === "Q1" ? currentWeekInQuarter ?? undefined : undefined}
            subjectToCategory={subjectToCategory}
            onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
            onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
            onWeekClick={handleWeekClick}
            onAddPace={isParentOnly ? undefined : handleAddPace}
            onDeletePace={isParentOnly ? undefined : handleDeletePace}
            isReadOnly={isParentOnly}
          />
          {hasModule('monthlyAssignments') && (
            <MonthlyAssignmentsSection
              quarter="Q1"
              assignments={monthlyAssignments}
              isReadOnly={isParentOnly}
              onGradeAssignment={handleGradeMonthlyAssignment}
            />
          )}
        </TabsContent>

        <TabsContent value="Q2" className="space-y-4 md:space-y-6">
          <ACEQuarterlyTable
            quarter="Q2"
            quarterName={t("monthlyAssignments.quarterLabelQ2")}
            data={projectionData.Q2}
            isActive={currentQuarter === "Q2"}
            currentWeek={currentQuarter === "Q2" ? currentWeekInQuarter ?? undefined : undefined}
            subjectToCategory={subjectToCategory}
            onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
            onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
            onWeekClick={handleWeekClick}
            onAddPace={isParentOnly ? undefined : handleAddPace}
            onDeletePace={isParentOnly ? undefined : handleDeletePace}
            isReadOnly={isParentOnly}
          />
          {hasModule('monthlyAssignments') && (
            <MonthlyAssignmentsSection
              quarter="Q2"
              assignments={monthlyAssignments}
              isReadOnly={isParentOnly}
              onGradeAssignment={handleGradeMonthlyAssignment}
            />
          )}
        </TabsContent>

        <TabsContent value="Q3" className="space-y-4 md:space-y-6">
          <ACEQuarterlyTable
            quarter="Q3"
            quarterName={t("monthlyAssignments.quarterLabelQ3")}
            data={projectionData.Q3}
            isActive={currentQuarter === "Q3"}
            currentWeek={currentQuarter === "Q3" ? currentWeekInQuarter ?? undefined : undefined}
            subjectToCategory={subjectToCategory}
            onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
            onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
            onWeekClick={handleWeekClick}
            onAddPace={isParentOnly ? undefined : handleAddPace}
            onDeletePace={isParentOnly ? undefined : handleDeletePace}
            isReadOnly={isParentOnly}
          />
          {hasModule('monthlyAssignments') && (
            <MonthlyAssignmentsSection
              quarter="Q3"
              assignments={monthlyAssignments}
              isReadOnly={isParentOnly}
              onGradeAssignment={handleGradeMonthlyAssignment}
            />
          )}
        </TabsContent>

        <TabsContent value="Q4" className="space-y-4 md:space-y-6">
          <ACEQuarterlyTable
            quarter="Q4"
            quarterName={t("monthlyAssignments.quarterLabelQ4")}
            data={projectionData.Q4}
            isActive={currentQuarter === "Q4"}
            currentWeek={currentQuarter === "Q4" ? currentWeekInQuarter ?? undefined : undefined}
            subjectToCategory={subjectToCategory}
            onPaceDrop={isParentOnly ? undefined : handlePaceDrop}
            onPaceToggle={isParentOnly ? undefined : handlePaceToggle}
            onWeekClick={handleWeekClick}
            onAddPace={isParentOnly ? undefined : handleAddPace}
            onDeletePace={isParentOnly ? undefined : handleDeletePace}
            isReadOnly={isParentOnly}
          />

          {hasModule('monthlyAssignments') && (
            <MonthlyAssignmentsSection
              quarter="Q4"
              assignments={monthlyAssignments}
              isReadOnly={isParentOnly}
              onGradeAssignment={handleGradeMonthlyAssignment}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Total Paces Summary */}
      {projectionDetail && (() => {
        // Calculate total paces across all quarters
        let totalPaces = 0
        Object.values(projectionDetail.quarters).forEach(quarter => {
          Object.values(quarter).forEach(weekPaces => {
            weekPaces.forEach(pace => {
              if (pace !== null) {
                totalPaces++
              }
            })
          })
        })

        return (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-blue-900">{t("projections.totalLessonsYear")}</span>
                <span className="text-2xl font-bold text-blue-700">{totalPaces}</span>
              </div>
            </CardContent>
          </Card>
        )
      })()}

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

