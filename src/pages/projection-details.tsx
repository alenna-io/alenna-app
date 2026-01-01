import * as React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { BackButton } from "@/components/ui/back-button"
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
import { FileText, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { useQuarterStatus } from "@/hooks/useQuarterStatus"


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
  const [schoolYearId, setSchoolYearId] = React.useState<string | null>(null)

  // Get quarter status using the hook
  const { isQuarterClosed: isQuarterClosedHook, quarters: quarterStatuses } = useQuarterStatus(schoolYearId)

  // Helper function to check if a quarter is closed (with fallback)
  const isQuarterClosed = React.useCallback((quarter: string): boolean => {
    if (!isQuarterClosedHook) return false
    return isQuarterClosedHook(quarter)
  }, [isQuarterClosedHook])

  // Check if at least one quarter is closed
  const hasAtLeastOneClosedQuarter = React.useMemo(() => {
    return quarterStatuses.some(q => q.status === 'closed')
  }, [quarterStatuses])

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

        // Look up schoolYearId by name to use with useQuarterStatus hook
        try {
          const schoolYears = await api.schoolYears.getAll()
          const matchingSchoolYear = schoolYears.find((sy: { name: string; id: string }) => sy.name === detail.schoolYear)
          if (matchingSchoolYear) {
            setSchoolYearId(matchingSchoolYear.id)
          }
        } catch (err) {
          console.warn('Could not fetch school years for quarter status:', err)
        }

        // Collect all unique sub-subjects from ALL quarters and their categories
        // This ensures we can display all sub-subjects even if they have no paces in a particular quarter
        const allSubSubjects = new Set<string>()
        const subSubjectToCategory = new Map<string, string>() // subject -> category

        Object.values(detail.quarters).forEach(quarter => {
          Object.keys(quarter).forEach(subject => {
            allSubSubjects.add(subject)
            // Get category from first non-null pace for this subject
            const firstPace = quarter[subject]?.find(p => p !== null)
            if (firstPace && firstPace.category && !subSubjectToCategory.has(subject)) {
              subSubjectToCategory.set(subject, firstPace.category)
            }
          })
        })

        // Convert API data to the format expected by ACEQuarterlyTable
        // Pass categories, all sub-subjects, and their category mapping to ensure all projection sub-subjects are shown in all quarters
        const convertedData = {
          Q1: convertQuarterData(detail.quarters.Q1, detail.categories, Array.from(allSubSubjects), subSubjectToCategory),
          Q2: convertQuarterData(detail.quarters.Q2, detail.categories, Array.from(allSubSubjects), subSubjectToCategory),
          Q3: convertQuarterData(detail.quarters.Q3, detail.categories, Array.from(allSubSubjects), subSubjectToCategory),
          Q4: convertQuarterData(detail.quarters.Q4, detail.categories, Array.from(allSubSubjects), subSubjectToCategory),
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
    projectionCategories?: string[],
    allProjectionSubSubjects?: string[],
    allSubSubjectToCategory?: Map<string, string>
  ): QuarterData => {
    // For electives, each subject is already formatted as "Elective: Name" and should be a separate row
    // For other categories, group sub-subjects by category
    const result: QuarterData = {}

    // Build category mapping: use provided mapping first, then fall back to current quarter's paces
    const subjectToCategory = new Map<string, string>(allSubSubjectToCategory || [])

    // Also get categories from current quarter's paces (in case a subject only appears in this quarter)
    Object.keys(quarterPaces).forEach(subject => {
      const firstPace = quarterPaces[subject].find(p => p !== null)
      if (firstPace && firstPace.category && !subjectToCategory.has(subject)) {
        subjectToCategory.set(subject, firstPace.category)
      }
    })

    // Identify electives (subjects that start with "Elective: ")
    const electiveSubjects: string[] = []
    const categoryGroups = new Map<string, string[]>() // category -> [subjects]

    // Process subjects that have paces in this quarter
    Object.keys(quarterPaces).forEach(subject => {
      const category = subjectToCategory.get(subject)
      if (category) {
        // Check if this is an elective (starts with "Elective: ")
        if (subject.startsWith('Elective: ')) {
          electiveSubjects.push(subject)
        } else {
          // For non-electives, group by category
          if (!categoryGroups.has(category)) {
            categoryGroups.set(category, [])
          }
          categoryGroups.get(category)!.push(subject)
        }
      }
    })

    // Also include all sub-subjects from the projection that might not have paces in this quarter
    if (allProjectionSubSubjects) {
      allProjectionSubSubjects.forEach(subject => {
        const category = subjectToCategory.get(subject)
        if (category) {
          if (subject.startsWith('Elective: ')) {
            if (!electiveSubjects.includes(subject)) {
              electiveSubjects.push(subject)
            }
          } else {
            if (!categoryGroups.has(category)) {
              categoryGroups.set(category, [])
            }
            if (!categoryGroups.get(category)!.includes(subject)) {
              categoryGroups.get(category)!.push(subject)
            }
          }
        }
      })
    }

    // Process non-elective categories FIRST (grouped as before)
    // Use categories from projection if available, otherwise use categories from paces
    const categoriesFromPaces = Array.from(new Set(
      Array.from(categoryGroups.keys())
    ))

    // Use projection categories if available, otherwise fall back to categories from paces
    // This ensures ALL projection categories are shown, even if empty in this quarter
    // Filter out "Electives" category since we handle electives separately below
    const allCategories = projectionCategories && projectionCategories.length > 0
      ? new Set(projectionCategories.filter(cat => cat !== 'Electives'))
      : new Set(categoriesFromPaces.filter(cat => cat !== 'Electives'))

    // Sort categories by default order
    const sortedCategories = Array.from(allCategories).sort((a, b) => {
      return getCategoryOrder(a) - getCategoryOrder(b)
    })

    // Process ALL categories FIRST (even if they have no paces in this quarter)
    // This ensures categories appear before electives
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
              isUnfinished: pace.isUnfinished,
              originalQuarter: pace.originalQuarter,
              originalWeek: pace.originalWeek,
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

    // Add electives as separate rows AFTER categories
    // Include ALL electives from the projection, even if they have no paces in this quarter
    const allElectiveSubjects = allProjectionSubSubjects
      ? allProjectionSubSubjects.filter(sub => sub.startsWith('Elective: '))
      : electiveSubjects

    // Ensure we include all electives, not just those with paces in this quarter
    const uniqueElectives = new Set([...electiveSubjects, ...allElectiveSubjects])

    Array.from(uniqueElectives).sort().forEach(electiveSubject => {
      const weekPaces: (import('@/types/pace').PaceData | null | import('@/types/pace').PaceData[])[] = Array(9).fill(null)

      for (let weekIndex = 0; weekIndex < 9; weekIndex++) {
        const pace = quarterPaces[electiveSubject]?.[weekIndex]
        if (pace) {
          weekPaces[weekIndex] = {
            id: pace.id,
            number: pace.number,
            grade: pace.grade,
            isCompleted: pace.isCompleted,
            isFailed: pace.isFailed,
            isUnfinished: pace.isUnfinished,
            originalQuarter: pace.originalQuarter,
            originalWeek: pace.originalWeek,
            gradeHistory: pace.gradeHistory.map(gh => ({
              grade: gh.grade,
              date: gh.date,
              note: gh.note,
            })),
          }
        }
      }

      result[electiveSubject] = weekPaces
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

    // Validate sequential order before allowing the move
    // Rule: Paces must always be in sequential order (e.g., 1087 must come before 1088)
    const fromPaceNumber = parseInt(fromPace.number) || 0
    const toPaceNumber = toPace ? (parseInt(toPace.number) || 0) : 0

    // Simple check: if we're swapping paces, ensure the lower-numbered pace doesn't end up after the higher-numbered one
    if (toPace && toPaceNumber > 0) {
      // We're swapping two paces
      // After swap: fromPace (lower number) goes to toWeek, toPace (higher number) goes to fromWeek
      // This is valid only if fromWeek < toWeek (lower number in earlier week)
      // But if fromPaceNumber < toPaceNumber and fromWeek > toWeek, that breaks order
      // Actually, the rule is simpler: lower-numbered paces must come before higher-numbered paces
      // So if fromPaceNumber < toPaceNumber, then fromWeek must be <= toWeek
      if (fromPaceNumber < toPaceNumber && fromWeek > toWeek) {
        // Lower-numbered pace is being moved to a later week than higher-numbered pace - invalid
        toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move PACE: This action would break the sequential order of paces.")
        return
      }
      if (fromPaceNumber > toPaceNumber && fromWeek < toWeek) {
        // Higher-numbered pace is being moved to an earlier week than lower-numbered pace - invalid
        toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move PACE: This action would break the sequential order of paces.")
        return
      }
    } else {
      // Moving to an empty cell - check if this would break sequential order with other paces
      const allPacesInSubject = quarterData[subject]
        .map((pace, idx) => {
          if (!pace || Array.isArray(pace) || idx === fromWeek) return null
          const paceNum = parseInt(pace.number) || 0
          return { paceNum, weekIndex: idx }
        })
        .filter((item): item is { paceNum: number, weekIndex: number } => item !== null)

      // Check if moving to toWeek would place fromPace after a higher-numbered pace
      const targetWeekPace = allPacesInSubject.find(item => item.weekIndex === toWeek)
      if (targetWeekPace && targetWeekPace.paceNum > fromPaceNumber) {
        // Cannot place lower-numbered pace after higher-numbered pace
        toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move PACE: This action would break the sequential order of paces.")
        return
      }

      // Check if there are consecutive paces that would be broken
      const sortedPaces = [...allPacesInSubject, { paceNum: fromPaceNumber, weekIndex: toWeek }]
        .sort((a, b) => a.paceNum - b.paceNum)

      for (let i = 0; i < sortedPaces.length - 1; i++) {
        const current = sortedPaces[i]
        const next = sortedPaces[i + 1]

        // If two consecutive pace numbers are in non-sequential weeks, that's a problem
        if (next.paceNum - current.paceNum === 1 && current.weekIndex > next.weekIndex) {
          toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move PACE: This action would break the sequential order of paces.")
          return
        }
      }
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

    if (isQuarterClosed(quarter)) {
      toast.error(t("projections.cannotEditClosedQuarter") || "Cannot edit grades for closed quarter")
      return
    }

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

    // Validate sequential order before allowing the addition
    const newPaceNumber = parseInt(paceCode) || 0
    const quarterData = projectionData[quarter as keyof typeof projectionData]

    // Get all paces in the same subject and quarter
    const allPacesInSubject = quarterData[subject]
      .map((pace, idx) => {
        if (!pace || Array.isArray(pace)) return null
        const paceNum = parseInt(pace.number) || 0
        return { paceNum, weekIndex: idx }
      })
      .filter((item): item is { paceNum: number, weekIndex: number } => item !== null)

    // Find the pace that should come immediately before and after the new pace in sequential order
    let beforePace: { paceNum: number, weekIndex: number } | null = null
    let afterPace: { paceNum: number, weekIndex: number } | null = null

    for (const item of allPacesInSubject) {
      if (item.paceNum < newPaceNumber) {
        if (!beforePace || item.paceNum > beforePace.paceNum) {
          beforePace = { paceNum: item.paceNum, weekIndex: item.weekIndex }
        }
      } else if (item.paceNum > newPaceNumber) {
        if (!afterPace || item.paceNum < afterPace.paceNum) {
          afterPace = { paceNum: item.paceNum, weekIndex: item.weekIndex }
        }
      }
    }

    // Case 1: If there's an afterPace but no beforePace, the new pace must come before the afterPace
    // (e.g., adding 1009 when 1088 exists - 1009 must be in an earlier week than 1088)
    if (!beforePace && afterPace) {
      if (weekIndex >= afterPace.weekIndex) {
        toast.error(t("projections.cannotAddPaceSequentialOrder") || "Cannot add Lecture: This action would break the sequential order of lectures.")
        return
      }
    }

    // Case 2: If there's a beforePace but no afterPace, the new pace must come after the beforePace
    // (e.g., adding 1100 when 1088 exists - 1100 must be in a later week than 1088)
    if (beforePace && !afterPace) {
      if (weekIndex <= beforePace.weekIndex) {
        toast.error(t("projections.cannotAddPaceSequentialOrder") || "Cannot add Lecture: This action would break the sequential order of lectures.")
        return
      }
    }

    // Case 3: If there's a pace before and after, check if they're consecutive
    // If they are consecutive (e.g., 1087 and 1088), we cannot insert between them
    if (beforePace && afterPace) {
      const beforeNum = beforePace.paceNum
      const afterNum = afterPace.paceNum

      // If before and after are consecutive (e.g., 1087 and 1088), cannot insert between them
      if (afterNum - beforeNum === 1) {
        toast.error(t("projections.cannotAddPaceSequentialOrder") || "Cannot add Lecture: This action would break the sequential order of lectures.")
        return
      }

      // Check if adding to targetWeek would place the new pace after a higher-numbered pace
      // or before a lower-numbered pace in a way that breaks order
      if (afterPace.weekIndex < weekIndex && afterNum > newPaceNumber) {
        // Higher-numbered pace is in an earlier week - invalid
        toast.error(t("projections.cannotAddPaceSequentialOrder") || "Cannot add Lecture: This action would break the sequential order of lectures.")
        return
      }
      if (beforePace.weekIndex > weekIndex && beforeNum < newPaceNumber) {
        // Lower-numbered pace is in a later week - invalid
        toast.error(t("projections.cannotAddPaceSequentialOrder") || "Cannot add Lecture: This action would break the sequential order of lectures.")
        return
      }
    }

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

  // Calculate total paces for summary (must be before early returns)
  // Exclude unfinished references in original quarters to avoid double counting
  const totalPaces = React.useMemo(() => {
    if (!projectionDetail) return 0
    let count = 0
    Object.entries(projectionDetail.quarters).forEach(([quarterKey, quarter]) => {
      Object.values(quarter).forEach(weekPaces => {
        weekPaces.forEach(pace => {
          if (pace !== null) {
            // Exclude unfinished paces that are in their original quarter (they're just references)
            // The actual pace is counted in the quarter where it was moved
            const isUnfinishedReference = pace.isUnfinished && pace.originalQuarter === quarterKey
            if (!isUnfinishedReference) {
              count++
            }
          }
        })
      })
    })
    return count
  }, [projectionDetail])

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
    return <Loading variant="projection-details" />
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

  // Helper function to render quarter content (reduces code duplication)
  const renderQuarterContent = (quarter: "Q1" | "Q2" | "Q3" | "Q4", quarterName: string) => {
    const isClosed = isQuarterClosed(quarter)
    const isReadOnlyQuarter = isParentOnly || isClosed
    return (
      <div className="space-y-5 md:space-y-6 animate-tab-content">
        <ACEQuarterlyTable
          quarter={quarter}
          quarterName={quarterName}
          data={projectionData[quarter]}
          isActive={currentQuarter === quarter}
          currentWeek={currentQuarter === quarter ? currentWeekInQuarter ?? undefined : undefined}
          subjectToCategory={subjectToCategory}
          onPaceDrop={isReadOnlyQuarter ? undefined : handlePaceDrop}
          onPaceToggle={isReadOnlyQuarter ? undefined : handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={isReadOnlyQuarter ? undefined : handleAddPace}
          onDeletePace={isReadOnlyQuarter ? undefined : handleDeletePace}
          isReadOnly={isReadOnlyQuarter}
          isQuarterClosed={isClosed}
        />
        {hasModule('monthlyAssignments') && (
          <div className="animate-staggered" style={{ animationDelay: '100ms' }}>
            <MonthlyAssignmentsSection
              quarter={quarter}
              assignments={monthlyAssignments}
              isReadOnly={isParentOnly}
              isQuarterClosed={isClosed}
              onGradeAssignment={handleGradeMonthlyAssignment}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-page-entrance">
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={`/students/${studentId}/projections`}>
          {t("common.back")}
        </BackButton>
      </div>

      {/* Simplified Header */}
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row justify-start lg:justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold">{t("projections.annualProjection")} - {student.schoolYear}</h1>
            {/* Minimal Student Info */}
            <div className="flex items-center gap-2">
              <p className="text-xl text-gray-700">{student.name}</p>
              <Badge variant="primary-soft" className="text-sm">{student.currentGrade}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {projectionDetail && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-soft text-primary">
                <span className="text-sm font-medium">{t("projections.totalLessonsYear")}:</span>
                <span className="text-lg font-semibold">{totalPaces}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-0">
              {currentQuarter && currentWeekInQuarter !== null && (
                <Button
                  variant="default"
                  onClick={() => handleWeekClick(currentQuarter, currentWeekInQuarter)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:shadow-md"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t("projections.viewCurrentWeekDailyGoals")}
                </Button>
              )}
              {userInfo && (userInfo.permissions.includes('reportCards.read') || userInfo.permissions.includes('reportCards.readOwn')) && hasAtLeastOneClosedQuarter && (
                <Button
                  variant="default"
                  onClick={() => navigate(`/students/${studentId}/report-cards/${projectionId}`)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:shadow-md"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t("projections.viewReportCard")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Total Paces */}
        {projectionDetail && (
          <div className="sm:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-soft text-primary animate-staggered" style={{ animationDelay: '75ms' }}>
            <span className="text-sm font-medium">{t("projections.totalLessonsYear")}:</span>
            <span className="text-lg font-semibold">{totalPaces}</span>
          </div>
        )}
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
          categoryFilter={subjectToCategory.get(pacePickerContext.subject) || pacePickerContext.subject}
          title={t("projections.addLesson", { subject: pacePickerContext.subject, quarter: pacePickerContext.quarter, week: pacePickerContext.weekIndex + 1 })}
          existingPaceCatalogIds={existingPaceCatalogIds}
        />
      )}

      {/* Quarterly Tabs: Enhanced premium design */}
      <Tabs defaultValue={currentQuarter || "Q1"} className="w-full mt-8">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-4 min-w-max md:min-w-0 h-12 bg-secondary/30 p-1.5 rounded-xl border border-border/50">
            <TabsTrigger
              value="Q1"
              className="shrink-0 transition-all duration-300 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-[1.02] hover:bg-primary/10"
            >
              {t("monthlyAssignments.quarterLabelQ1")}
            </TabsTrigger>
            <TabsTrigger
              value="Q2"
              className="shrink-0 transition-all duration-300 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-[1.02] hover:bg-primary/10"
            >
              {t("monthlyAssignments.quarterLabelQ2")}
            </TabsTrigger>
            <TabsTrigger
              value="Q3"
              className="shrink-0 transition-all duration-300 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-[1.02] hover:bg-primary/10"
            >
              {t("monthlyAssignments.quarterLabelQ3")}
            </TabsTrigger>
            <TabsTrigger
              value="Q4"
              className="shrink-0 transition-all duration-300 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-[1.02] hover:bg-primary/10"
            >
              {t("monthlyAssignments.quarterLabelQ4")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="Q1" className="mt-0">
          {renderQuarterContent("Q1", t("monthlyAssignments.quarterLabelQ1"))}
        </TabsContent>

        <TabsContent value="Q2" className="mt-0">
          {renderQuarterContent("Q2", t("monthlyAssignments.quarterLabelQ2"))}
        </TabsContent>

        <TabsContent value="Q3" className="mt-0">
          {renderQuarterContent("Q3", t("monthlyAssignments.quarterLabelQ3"))}
        </TabsContent>

        <TabsContent value="Q4" className="mt-0">
          {renderQuarterContent("Q4", t("monthlyAssignments.quarterLabelQ4"))}
        </TabsContent>
      </Tabs>

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

