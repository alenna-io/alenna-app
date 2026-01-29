import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import type { QuarterData, PaceData } from "@/types/pace"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useApi } from "@/services/api"
import type { ProjectionDetails } from "@/services/api/projections"
import { Move, Edit, Eye } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PacePickerDialog } from "@/components/pace-picker-dialog"
import { ProjectionMonthlyAssignments } from "@/components/projection-monthly-assignments"
import { toast } from "sonner"
import type { ProjectionMonthlyAssignment } from "@/services/api/monthly-assignment"

const createEmptyQuarterData = (): QuarterData => ({})

function transformProjectionToQuarterData(projection: ProjectionDetails): {
  quarters: { Q1: QuarterData; Q2: QuarterData; Q3: QuarterData; Q4: QuarterData }
  subjectToCategory: Map<string, string>
  subjectToCategoryDisplayOrder: Map<string, number> // subject -> category displayOrder
  categoryCounts: Map<string, Map<string, number>> // quarter -> category -> count
  totalPaces: number
} {
  const quarters: { Q1: QuarterData; Q2: QuarterData; Q3: QuarterData; Q4: QuarterData } = {
    Q1: createEmptyQuarterData(),
    Q2: createEmptyQuarterData(),
    Q3: createEmptyQuarterData(),
    Q4: createEmptyQuarterData(),
  }

  const subjectToCategory = new Map<string, string>()
  const subjectToCategoryDisplayOrder = new Map<string, number>()
  const categoryCounts = new Map<string, Map<string, number>>() // Track category counts per quarter

  // Group paces by quarter, subject, and week
  projection.projectionPaces.forEach((pace: ProjectionDetails['projectionPaces'][0]) => {
    // Convert quarter from number (1-4) or string ("Q1"-"Q4") to "Q1"-"Q4" format
    let quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
    if (typeof pace.quarter === 'number') {
      quarter = `Q${pace.quarter}` as 'Q1' | 'Q2' | 'Q3' | 'Q4'
    } else if (typeof pace.quarter === 'string') {
      // If it's already a string, ensure it starts with "Q"
      quarter = pace.quarter.startsWith('Q')
        ? (pace.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4')
        : `Q${pace.quarter}` as 'Q1' | 'Q2' | 'Q3' | 'Q4'
    } else {
      return
    }

    if (!quarters[quarter]) {
      return
    }

    const subjectName = pace.paceCatalog.subject.name
    const categoryName = pace.paceCatalog.subject.category.name
    const categoryDisplayOrder = pace.paceCatalog.subject.category.displayOrder
    const weekIndex = pace.week - 1 // Convert to 0-based index
    const isElectivesCategory = categoryName === 'Electives'

    // For non-Electives categories, group by category name (all subjects in same category share one row)
    // For Electives, group by subject name (each elective subject gets its own row)
    const displayKey = isElectivesCategory ? subjectName : categoryName

    // Store subject to category mapping
    if (!subjectToCategory.has(subjectName)) {
      subjectToCategory.set(subjectName, categoryName)
      subjectToCategoryDisplayOrder.set(subjectName, categoryDisplayOrder)
    }

    // Track category counts per quarter to detect duplicates
    if (!categoryCounts.has(quarter)) {
      categoryCounts.set(quarter, new Map<string, number>())
    }
    const quarterCategoryCounts = categoryCounts.get(quarter)!

    // Count unique display keys per category in this quarter
    // For non-Electives, this counts categories (should be 1 per category)
    // For Electives, this counts subjects (can be multiple)
    if (!quarters[quarter][displayKey]) {
      const currentCount = quarterCategoryCounts.get(categoryName) || 0
      quarterCategoryCounts.set(categoryName, currentCount + 1)
    }

    if (weekIndex < 0 || weekIndex >= 9) {
      return
    }

    const paceData: PaceData = {
      id: pace.id,
      number: pace.paceCatalog.code,
      grade: pace.grade,
      isCompleted: pace.status === 'COMPLETED',
      isFailed: pace.status === 'FAILED',
      isUnfinished: pace.status === 'UNFINISHED',
      originalQuarter: pace.originalQuarter || undefined,
      originalWeek: pace.originalWeek || undefined,
      orderIndex: pace.paceCatalog.orderIndex,
      gradeHistory: pace.gradeHistory.map((h: { grade: number; date: string; note: string | null }) => ({
        grade: h.grade,
        date: h.date,
        note: h.note || undefined,
      })),
    }

    // Initialize display key array if it doesn't exist
    if (!quarters[quarter][displayKey]) {
      quarters[quarter][displayKey] = Array(9).fill(null)
    }

    // Handle multiple paces in the same week (array)
    const existingPace = quarters[quarter][displayKey][weekIndex]
    if (existingPace === null) {
      quarters[quarter][displayKey][weekIndex] = paceData
    } else if (Array.isArray(existingPace)) {
      existingPace.push(paceData)
    } else {
      // Convert single pace to array
      quarters[quarter][displayKey][weekIndex] = [existingPace, paceData]
    }
  })

  return {
    quarters,
    subjectToCategory,
    subjectToCategoryDisplayOrder,
    categoryCounts,
    totalPaces: projection.projectionPaces.length
  }
}

export default function ProjectionDetailsPageV2() {
  const { projectionId, studentId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const api = useApi()

  const [projectionData, setProjectionData] = React.useState<{ Q1: QuarterData; Q2: QuarterData; Q3: QuarterData; Q4: QuarterData }>({
    Q1: createEmptyQuarterData(),
    Q2: createEmptyQuarterData(),
    Q3: createEmptyQuarterData(),
    Q4: createEmptyQuarterData(),
  })
  const [subjectToCategory, setSubjectToCategory] = React.useState<Map<string, string>>(new Map())
  const [subjectToCategoryDisplayOrder, setSubjectToCategoryDisplayOrder] = React.useState<Map<string, number>>(new Map())
  const [categoryCounts, setCategoryCounts] = React.useState<Map<string, Map<string, number>>>(new Map())
  const [totalPaces, setTotalPaces] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [projectionInfo, setProjectionInfo] = React.useState<{
    studentName: string
    schoolYear: string
    schoolYearName: string
    isActive: boolean
  } | null>(null)
  const [editMode, setEditMode] = React.useState<'view' | 'moving' | 'editing'>('view')

  const [pacePickerOpen, setPacePickerOpen] = React.useState(false)
  const [pacePickerContext, setPacePickerContext] = React.useState<{
    quarter: string
    subject: string
    weekIndex: number
  } | null>(null)
  const [existingPaceCatalogIds, setExistingPaceCatalogIds] = React.useState<string[]>([])
  const [monthlyAssignments, setMonthlyAssignments] = React.useState<ProjectionMonthlyAssignment[]>([])
  const [loadingActions, setLoadingActions] = React.useState<Map<string, boolean>>(new Map())
  const [currentWeekInfo, setCurrentWeekInfo] = React.useState<{
    currentQuarter: string | null
    currentWeek: number | null
  }>({ currentQuarter: null, currentWeek: null })
  const [selectedTab, setSelectedTab] = React.useState<string>('Q1')
  const defaultTabSetRef = React.useRef(false)

  React.useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const weekInfo = await api.schoolYears.getCurrentWeek()
        if (weekInfo?.currentQuarter) {
          const quarterName = weekInfo.currentQuarter.name
          setCurrentWeekInfo({
            currentQuarter: quarterName,
            currentWeek: weekInfo.currentWeek,
          })
          // Only set default tab once, before user has interacted
          if (!defaultTabSetRef.current) {
            setSelectedTab(quarterName)
            defaultTabSetRef.current = true
          }
        }
      } catch {
        // Silently fail - not critical
      }
    }
    fetchCurrentWeek()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const fetchProjection = async () => {
      if (!projectionId) return

      try {
        setLoading(true)
        setError(null)

        const projection = await api.projections.getById(projectionId)

        const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
        setProjectionData(quarters)
        setSubjectToCategory(subjectCategoryMap)
        setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
        setCategoryCounts(categoryCountsMap)
        setTotalPaces(totalPacesCount)

        const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
        setExistingPaceCatalogIds(paceCatalogIds)

        try {
          const assignments = await api.monthlyAssignments.getByProjection(projectionId)
          setMonthlyAssignments(assignments)
        } catch {
          setMonthlyAssignments([])
        }

        setProjectionInfo({
          studentName: `${projection.student.user.firstName || ''} ${projection.student.user.lastName || ''}`.trim(),
          schoolYear: projection.schoolYear,
          schoolYearName: projection.schoolYearName,
          isActive: projection.status === 'OPEN',
        })
      } catch (err) {
        const error = err as Error
        console.error('Error fetching projection:', error)
        setError(error.message || 'Failed to load projection')
      } finally {
        setLoading(false)
      }
    }

    if (projectionId) {
      fetchProjection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId])

  const handleRetry = React.useCallback(() => {
    if (!projectionId) return

    const fetchProjection = async () => {
      try {
        setLoading(true)
        setError(null)

        const projection = await api.projections.getById(projectionId)

        const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
        setProjectionData(quarters)
        setSubjectToCategory(subjectCategoryMap)
        setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
        setCategoryCounts(categoryCountsMap)
        setTotalPaces(totalPacesCount)

        const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
        setExistingPaceCatalogIds(paceCatalogIds)

        setProjectionInfo({
          studentName: `${projection.student.user.firstName || ''} ${projection.student.user.lastName || ''}`.trim(),
          schoolYear: projection.schoolYear,
          schoolYearName: projection.schoolYearName,
          isActive: projection.status === 'OPEN',
        })
      } catch (err) {
        const error = err as Error
        console.error('Error fetching projection:', error)
        setError(error.message || 'Failed to load projection')
      } finally {
        setLoading(false)
      }
    }

    fetchProjection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId])

  // Helper function to translate backend error messages
  const translateError = React.useCallback((errorMessage: string): string => {
    // Pattern: "Cannot add pace: cannot place pace with orderIndex X before pace with orderIndex Y (at Q1 week 4)" or "(at 1 week 4)"
    // Match both "Q1" and "1" formats for quarter - make regex case-insensitive
    const addPaceBeforeMatch = errorMessage.match(/cannot place pace with orderIndex (\d+) before pace with orderIndex (\d+) \(at (Q?\d+) week (\d+)\)/i)
    if (addPaceBeforeMatch) {
      const quarterRaw = addPaceBeforeMatch[3]
      const quarter = quarterRaw.startsWith('Q') ? quarterRaw : `Q${quarterRaw}`
      try {
        const translated = t("projections.cannotAddPaceOrderIndex", {
          newOrder: addPaceBeforeMatch[1],
          existingOrder: addPaceBeforeMatch[2],
          quarter: quarter,
          week: addPaceBeforeMatch[4]
        })
        // Check if translation was successful (not the key itself)
        if (translated && !translated.includes("projections.cannotAddPaceOrderIndex")) {
          return translated
        }
      } catch {
        // If translation fails, continue to next pattern
      }
    }

    // Pattern: "Cannot add pace: cannot place pace with orderIndex X at position that already has pace with orderIndex Y"
    const addPaceAtPositionMatch = errorMessage.match(/cannot place pace with orderIndex (\d+) at position that already has pace with orderIndex (\d+)/i)
    if (addPaceAtPositionMatch) {
      const translated = t("projections.cannotAddPaceOrderIndexAtPosition", {
        newOrder: addPaceAtPositionMatch[1],
        existingOrder: addPaceAtPositionMatch[2]
      })
      if (translated && translated !== "projections.cannotAddPaceOrderIndexAtPosition") {
        return translated
      }
    }

    // Pattern: "Cannot add pace: cannot place pace with orderIndex X after pace with orderIndex Y (at Q1 week 4)" or "(at 1 week 4)"
    const addPaceAfterMatch = errorMessage.match(/cannot place pace with orderIndex (\d+) after pace with orderIndex (\d+) \(at (Q?\d+) week (\d+)\)/i)
    if (addPaceAfterMatch) {
      const quarterRaw = addPaceAfterMatch[3]
      const quarter = quarterRaw.startsWith('Q') ? quarterRaw : `Q${quarterRaw}`
      const translated = t("projections.cannotAddPaceOrderIndexAfter", {
        newOrder: addPaceAfterMatch[1],
        existingOrder: addPaceAfterMatch[2],
        quarter: quarter,
        week: addPaceAfterMatch[4]
      })
      if (translated && translated !== "projections.cannotAddPaceOrderIndexAfter") {
        return translated
      }
    }

    // Pattern: "Cannot move pace: cannot place pace with orderIndex X before pace with orderIndex Y (at Q1 week 4)" or "(at 1 week 4)"
    const movePaceBeforeMatch = errorMessage.match(/cannot place pace with orderIndex (\d+) before pace with orderIndex (\d+) \(at (Q?\d+) week (\d+)\)/i)
    if (movePaceBeforeMatch) {
      const quarterRaw = movePaceBeforeMatch[3]
      const quarter = quarterRaw.startsWith('Q') ? quarterRaw : `Q${quarterRaw}`
      const translated = t("projections.cannotMovePaceOrderIndex", {
        newOrder: movePaceBeforeMatch[1],
        existingOrder: movePaceBeforeMatch[2],
        quarter: quarter,
        week: movePaceBeforeMatch[4]
      })
      if (translated && translated !== "projections.cannotMovePaceOrderIndex") {
        return translated
      }
    }

    // Pattern: "Cannot move pace: cannot place pace with orderIndex X at position that already has pace with orderIndex Y"
    const movePaceAtPositionMatch = errorMessage.match(/cannot place pace with orderIndex (\d+) at position that already has pace with orderIndex (\d+)/i)
    if (movePaceAtPositionMatch) {
      const translated = t("projections.cannotMovePaceOrderIndexAtPosition", {
        newOrder: movePaceAtPositionMatch[1],
        existingOrder: movePaceAtPositionMatch[2]
      })
      if (translated && translated !== "projections.cannotMovePaceOrderIndexAtPosition") {
        return translated
      }
    }

    // Pattern: "Cannot move pace: cannot place pace with orderIndex X after pace with orderIndex Y (at Q1 week 4)" or "(at 1 week 4)"
    const movePaceAfterMatch = errorMessage.match(/cannot place pace with orderIndex (\d+) after pace with orderIndex (\d+) \(at (Q?\d+) week (\d+)\)/i)
    if (movePaceAfterMatch) {
      const quarterRaw = movePaceAfterMatch[3]
      const quarter = quarterRaw.startsWith('Q') ? quarterRaw : `Q${quarterRaw}`
      const translated = t("projections.cannotMovePaceOrderIndexAfter", {
        newOrder: movePaceAfterMatch[1],
        existingOrder: movePaceAfterMatch[2],
        quarter: quarter,
        week: movePaceAfterMatch[4]
      })
      if (translated && translated !== "projections.cannotMovePaceOrderIndexAfter") {
        return translated
      }
    }

    return errorMessage
  }, [t])

  const handlePaceMove = React.useCallback(async (quarter: string, subject: string, fromWeek: number, toWeek: number) => {
    if (!projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const fromPaceRaw = quarterData[subject][fromWeek]

    const fromPace = Array.isArray(fromPaceRaw) ? null : fromPaceRaw
    if (!fromPace || !fromPace.id || !fromPace.orderIndex) {
      toast.error(t("projections.errorMovingLesson") || "Cannot move pace: invalid pace")
      return
    }

    const loadingKey = `move-${quarter}-${subject}-${fromWeek}-${toWeek}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      const allPacesInSubject: Array<{ orderIndex: number; quarter: string; weekIndex: number }> = []
      Object.entries(projectionData).forEach(([q, qData]) => {
        const subjectData = qData[subject]
        if (subjectData) {
          subjectData.forEach((pace, idx) => {
            if (!pace || Array.isArray(pace)) return
            if (q === quarter && idx === fromWeek) return
            if (pace.orderIndex !== undefined) {
              allPacesInSubject.push({ orderIndex: pace.orderIndex, quarter: q, weekIndex: idx })
            }
          })
        }
      })

      const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4']
      const targetQuarterIndex = quarterOrder.indexOf(quarter)

      const pacesBeforeTarget = allPacesInSubject.filter(item => {
        const itemQuarterIndex = quarterOrder.indexOf(item.quarter)
        const isBefore = itemQuarterIndex < targetQuarterIndex ||
          (itemQuarterIndex === targetQuarterIndex && item.weekIndex < toWeek)
        return isBefore
      })

      for (const paceBefore of pacesBeforeTarget) {
        if (paceBefore.orderIndex > fromPace.orderIndex) {
          toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
          throw new Error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
        }
      }

      const targetWeekPace = allPacesInSubject.find(item => item.quarter === quarter && item.weekIndex === toWeek)
      if (targetWeekPace && targetWeekPace.orderIndex > fromPace.orderIndex) {
        toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
        throw new Error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
      }

      await api.projections.movePace(projectionId, fromPace.id, {
        quarter,
        week: toWeek + 1
      })
      toast.success(t("projections.lessonMoved") || "Pace moved successfully")

      const projection = await api.projections.getById(projectionId)
      const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
      setProjectionData(quarters)
      setSubjectToCategory(subjectCategoryMap)
      setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
      setCategoryCounts(categoryCountsMap)
      setTotalPaces(totalPacesCount)
      const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
      setExistingPaceCatalogIds(paceCatalogIds)
    } catch (err) {
      const error = err as Error
      const translatedMessage = translateError(error.message)
      toast.error(translatedMessage || t("projections.errorMovingLesson") || "Failed to move pace")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId, api, t, translateError])

  const handlePaceAdd = React.useCallback(async (quarter: string, _subject: string, weekIndex: number, paceCatalogId: string) => {
    if (!projectionId) return

    const loadingKey = `add-${quarter}-${_subject}-${weekIndex}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await api.projections.addPace(projectionId, {
        paceCatalogId,
        quarter,
        week: weekIndex + 1
      })
      toast.success(t("projections.lessonAdded") || "Pace added successfully")

      const projection = await api.projections.getById(projectionId)
      const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
      setProjectionData(quarters)
      setSubjectToCategory(subjectCategoryMap)
      setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
      setCategoryCounts(categoryCountsMap)
      setTotalPaces(totalPacesCount)
      const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
      setExistingPaceCatalogIds(paceCatalogIds)
      setPacePickerOpen(false)
      setPacePickerContext(null)
    } catch (err) {
      const error = err as Error
      const translatedMessage = translateError(error.message)
      // Use translated message if it's different from original, otherwise use fallback
      const finalMessage = translatedMessage !== error.message ? translatedMessage : (t("projections.errorAddingLesson") || "Failed to add pace")
      toast.error(finalMessage)
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }, [projectionId, api, t, translateError])

  const handlePaceDelete = React.useCallback(async (quarter: string, subject: string, weekIndex: number) => {
    if (!projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const pace = quarterData[subject][weekIndex]
    const paceData = Array.isArray(pace) ? pace[0] : pace

    if (!paceData || !paceData.id) {
      toast.error(t("projections.errorDeletingLesson") || "Cannot delete pace: pace not found")
      return
    }

    if (paceData.grade !== null) {
      toast.error(t("projections.cannotDeleteGradedPace") || "Cannot delete graded pace")
      return
    }

    const loadingKey = `delete-${quarter}-${subject}-${weekIndex}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await api.projections.deletePace(projectionId, paceData.id)
      toast.success(t("projections.lessonDeleted") || "Pace deleted successfully")

      const projection = await api.projections.getById(projectionId)
      const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
      setProjectionData(quarters)
      setSubjectToCategory(subjectCategoryMap)
      setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
      setCategoryCounts(categoryCountsMap)
      setTotalPaces(totalPacesCount)
      const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
      setExistingPaceCatalogIds(paceCatalogIds)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("projections.errorDeletingLesson") || "Failed to delete pace")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId, api, t])

  const handleAddPaceClick = React.useCallback((quarter: string, subject: string, weekIndex: number) => {
    setPacePickerContext({ quarter, subject, weekIndex })
    setPacePickerOpen(true)
  }, [])

  const handleGradeUpdate = React.useCallback(async (quarter: string, subject: string, weekIndex: number, grade: number) => {
    if (!projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const pace = quarterData[subject][weekIndex]
    const paceData = Array.isArray(pace) ? pace[0] : pace

    if (!paceData || !paceData.id) {
      toast.error(t("projections.errorUpdatingGrade") || "Cannot update grade: pace not found")
      return
    }

    const loadingKey = `grade-${paceData.id}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await api.projections.updateGrade(projectionId, paceData.id, { grade })
      toast.success(t("projections.gradeUpdated") || "Grade updated successfully")

      const projection = await api.projections.getById(projectionId)
      const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
      setProjectionData(quarters)
      setSubjectToCategory(subjectCategoryMap)
      setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
      setCategoryCounts(categoryCountsMap)
      setTotalPaces(totalPacesCount)
      const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
      setExistingPaceCatalogIds(paceCatalogIds)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("projections.errorUpdatingGrade") || "Failed to update grade")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId, api, t])

  const handleMarkUngraded = React.useCallback(async (quarter: string, subject: string, weekIndex: number) => {
    if (!projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const pace = quarterData[subject][weekIndex]
    const paceData = Array.isArray(pace) ? pace[0] : pace

    if (!paceData || !paceData.id) {
      toast.error(t("projections.errorMarkingUngraded") || "Cannot mark as ungraded: pace not found")
      return
    }

    const loadingKey = `ungraded-${paceData.id}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await api.projections.markUngraded(projectionId, paceData.id)
      toast.success(t("projections.markedUngraded") || "Pace marked as ungraded")

      const projection = await api.projections.getById(projectionId)
      const { quarters, subjectToCategory: subjectCategoryMap, subjectToCategoryDisplayOrder: subjectCategoryDisplayOrderMap, categoryCounts: categoryCountsMap, totalPaces: totalPacesCount } = transformProjectionToQuarterData(projection)
      setProjectionData(quarters)
      setSubjectToCategory(subjectCategoryMap)
      setSubjectToCategoryDisplayOrder(subjectCategoryDisplayOrderMap)
      setCategoryCounts(categoryCountsMap)
      setTotalPaces(totalPacesCount)
      const paceCatalogIds = projection.projectionPaces.map(p => p.paceCatalogId)
      setExistingPaceCatalogIds(paceCatalogIds)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("projections.errorMarkingUngraded") || "Failed to mark as ungraded")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId, api, t])

  const handlePaceSelect = React.useCallback((paceId: string) => {
    if (!pacePickerContext) return
    handlePaceAdd(pacePickerContext.quarter, pacePickerContext.subject, pacePickerContext.weekIndex, paceId)
  }, [pacePickerContext, handlePaceAdd])

  const handleMonthlyAssignmentGradeUpdate = React.useCallback(async (monthlyAssignmentId: string, grade: number) => {
    if (!projectionId) return

    const loadingKey = `monthly-grade-${monthlyAssignmentId}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await api.monthlyAssignments.updateGrade(projectionId, monthlyAssignmentId, { grade })
      toast.success(t("monthlyAssignments.gradeUpdated") || "Grade updated successfully")

      const assignments = await api.monthlyAssignments.getByProjection(projectionId)
      setMonthlyAssignments(assignments)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("monthlyAssignments.errorUpdatingGrade") || "Failed to update grade")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }

  }, [projectionId, api, t])

  const handleMonthlyAssignmentMarkUngraded = React.useCallback(async (monthlyAssignmentId: string) => {
    if (!projectionId) return

    const loadingKey = `monthly-ungraded-${monthlyAssignmentId}`
    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await api.monthlyAssignments.markUngraded(projectionId, monthlyAssignmentId)
      toast.success(t("monthlyAssignments.markedUngraded") || "Marked as ungraded")

      const assignments = await api.monthlyAssignments.getByProjection(projectionId)
      setMonthlyAssignments(assignments)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("monthlyAssignments.errorMarkingUngraded") || "Failed to mark as ungraded")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }

  }, [projectionId, api, t])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <div className="flex items-center gap-3 mt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-12" />
            <div className="flex items-center gap-1 rounded-md border border-border bg-[#8B5CF6]/10 p-0.5 h-9">
              <Skeleton className="h-7 w-16 rounded-sm" />
              <Skeleton className="h-7 w-20 rounded-sm" />
              <Skeleton className="h-7 w-16 rounded-sm" />
            </div>
          </div>
        </div>
        <Tabs defaultValue={selectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-2">
            <TabsTrigger value="Q1">Q1</TabsTrigger>
            <TabsTrigger value="Q2">Q2</TabsTrigger>
            <TabsTrigger value="Q3">Q3</TabsTrigger>
            <TabsTrigger value="Q4">Q4</TabsTrigger>
          </TabsList>
          <TabsContent value="Q1" className="mt-6">
            <Card className="bg-transparent border">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-16" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <div className="overflow-x-auto border border-border rounded-b-xs">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left py-2 md:py-3 px-3 md:px-4 border-b border-r border-border">
                          <Skeleton className="h-4 w-24" />
                        </th>
                        {Array.from({ length: 9 }).map((_, i) => (
                          <th key={i} className="text-center py-2 md:py-3 px-2 md:px-3 border-b border-l border-border">
                            <Skeleton className="h-4 w-12 mx-auto" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-border">
                          <td className="py-2 md:py-3 px-3 md:px-4 border-r border-border">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          {Array.from({ length: 9 }).map((_, colIdx) => (
                            <td key={colIdx} className="py-1.5 md:py-2 px-2 md:px-3 text-center border-l border-border">
                              <Skeleton className="h-10 w-12 mx-auto rounded" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Card className="mt-10 border-dashed p-6">
              <CardHeader className="p-0 pb-4">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (error) {
    const isNetworkError = error.toLowerCase().includes('failed to fetch') ||
      error.toLowerCase().includes('network error') ||
      error.toLowerCase().includes('networkerror')

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <ErrorAlert
          title={t("errors.loadProjectionFailed")}
          message={error}
          onRetry={handleRetry}
          isNetworkError={isNetworkError}
        />
      </div>
    )
  }

  if (!projectionInfo) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {projectionInfo.studentName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={projectionInfo.isActive ? "default" : "secondary"}>
              {projectionInfo.isActive ? t("projections.active") : t("projections.inactive")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {projectionInfo.schoolYearName}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalPaces}</span> {t("projections.totalPaces")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {projectionInfo.isActive && (
            <div className="flex flex-col items-end gap-2">
              <div className='flex flex-col items-start gap-2'>
                <span className="text-xs font-bold text-black">
                  {t("projections.mode") || "Mode"}
                </span>
                <Tabs
                  value={editMode}
                  defaultValue="view"
                  onValueChange={(value) => {
                    setEditMode(value as 'view' | 'moving' | 'editing')
                  }}
                  className="w-auto"
                >
                  <TabsList className="h-9 p-0.5 bg-[#8B5CF6]/10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="view"
                          className="h-8 px-3 text-sm transition-all duration-200 flex items-center gap-1.5"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("projections.view") || "View"}</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("projections.view") || "View"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="moving"
                          className="h-8 px-3 text-sm transition-all duration-200 flex items-center gap-1.5"
                        >
                          <Move className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("projections.movePaces") || "Move"}</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("projections.movePaces") || "Move Lessons"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="editing"
                          className="h-8 px-3 text-sm transition-all duration-200 flex items-center gap-1.5"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("projections.edit") || "Edit"}</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("projections.edit") || "Edit"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>



      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-2">
          <TabsTrigger value="Q1">Q1</TabsTrigger>
          <TabsTrigger value="Q2">Q2</TabsTrigger>
          <TabsTrigger value="Q3">Q3</TabsTrigger>
          <TabsTrigger value="Q4">Q4</TabsTrigger>
        </TabsList>

        <TabsContent value="Q1" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q1}
                quarter="Q1"
                quarterName="Q1"
                currentWeek={currentWeekInfo.currentQuarter === 'Q1' ? currentWeekInfo.currentWeek || undefined : undefined}
                isActive={currentWeekInfo.currentQuarter === 'Q1'}
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                loadingActions={loadingActions}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'editing' ? handleAddPaceClick : undefined}
                onDeletePace={editMode === 'editing' ? handlePaceDelete : undefined}
                onGradeUpdate={editMode === 'editing' ? handleGradeUpdate : undefined}
                onMarkUngraded={editMode === 'editing' ? handleMarkUngraded : undefined}
                onWeekClick={(quarter, week) => {
                  if (!studentId || !projectionId) return
                  navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`)
                }}
              />
            </CardContent>
          </Card>
          <ProjectionMonthlyAssignments
            quarter="Q1"
            monthlyAssignments={monthlyAssignments}
            isEditing={editMode === 'editing'}
            loadingActions={loadingActions}
            onGradeUpdate={handleMonthlyAssignmentGradeUpdate}
            onMarkUngraded={handleMonthlyAssignmentMarkUngraded}
          />
        </TabsContent>

        <TabsContent value="Q2" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q2}
                quarter="Q2"
                quarterName="Q2"
                currentWeek={currentWeekInfo.currentQuarter === 'Q2' ? currentWeekInfo.currentWeek || undefined : undefined}
                isActive={currentWeekInfo.currentQuarter === 'Q2'}
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                loadingActions={loadingActions}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'editing' ? handleAddPaceClick : undefined}
                onDeletePace={editMode === 'editing' ? handlePaceDelete : undefined}
                onGradeUpdate={editMode === 'editing' ? handleGradeUpdate : undefined}
                onMarkUngraded={editMode === 'editing' ? handleMarkUngraded : undefined}
                onWeekClick={(quarter, week) => {
                  if (!studentId || !projectionId) return
                  navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`)
                }}
              />
            </CardContent>
          </Card>
          <ProjectionMonthlyAssignments
            quarter="Q2"
            monthlyAssignments={monthlyAssignments}
            isEditing={editMode === 'editing'}
            onGradeUpdate={handleMonthlyAssignmentGradeUpdate}
            onMarkUngraded={handleMonthlyAssignmentMarkUngraded}
          />
        </TabsContent>

        <TabsContent value="Q3" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q3}
                quarter="Q3"
                quarterName="Q3"
                currentWeek={currentWeekInfo.currentQuarter === 'Q3' ? currentWeekInfo.currentWeek || undefined : undefined}
                isActive={currentWeekInfo.currentQuarter === 'Q3'}
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                loadingActions={loadingActions}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'editing' ? handleAddPaceClick : undefined}
                onDeletePace={editMode === 'editing' ? handlePaceDelete : undefined}
                onGradeUpdate={editMode === 'editing' ? handleGradeUpdate : undefined}
                onMarkUngraded={editMode === 'editing' ? handleMarkUngraded : undefined}
                onWeekClick={(quarter, week) => {
                  if (!studentId || !projectionId) return
                  navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`)
                }}
              />
            </CardContent>
          </Card>
          <ProjectionMonthlyAssignments
            quarter="Q3"
            monthlyAssignments={monthlyAssignments}
            isEditing={editMode === 'editing'}
            onGradeUpdate={handleMonthlyAssignmentGradeUpdate}
            onMarkUngraded={handleMonthlyAssignmentMarkUngraded}
          />
        </TabsContent>

        <TabsContent value="Q4" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q4}
                quarter="Q4"
                quarterName="Q4"
                currentWeek={currentWeekInfo.currentQuarter === 'Q4' ? currentWeekInfo.currentWeek || undefined : undefined}
                isActive={currentWeekInfo.currentQuarter === 'Q4'}
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                loadingActions={loadingActions}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'editing' ? handleAddPaceClick : undefined}
                onDeletePace={editMode === 'editing' ? handlePaceDelete : undefined}
                onGradeUpdate={editMode === 'editing' ? handleGradeUpdate : undefined}
                onMarkUngraded={editMode === 'editing' ? handleMarkUngraded : undefined}
                onWeekClick={(quarter, week) => {
                  if (!studentId || !projectionId) return
                  navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`)
                }}
              />
            </CardContent>
          </Card>
          <ProjectionMonthlyAssignments
            quarter="Q4"
            monthlyAssignments={monthlyAssignments}
            isEditing={editMode === 'editing'}
            onGradeUpdate={handleMonthlyAssignmentGradeUpdate}
            onMarkUngraded={handleMonthlyAssignmentMarkUngraded}
          />
        </TabsContent>
      </Tabs>

      {pacePickerContext && (
        <PacePickerDialog
          open={pacePickerOpen}
          onClose={() => {
            setPacePickerOpen(false)
            setPacePickerContext(null)
          }}
          onSelect={handlePaceSelect}
          categoryFilter={(() => {
            // pacePickerContext.subject is now either a category name (non-Electives) or subject name (Electives)
            const isCategoryName = Array.from(subjectToCategory.values()).includes(pacePickerContext.subject) && pacePickerContext.subject !== 'Electives'
            if (isCategoryName) {
              // It's a category name, use it directly
              return pacePickerContext.subject
            } else {
              // It's a subject name (Electives), look up the category
              return subjectToCategory.get(pacePickerContext.subject) || undefined
            }
          })()}
          subSubjectFilter={(() => {
            // For Electives, use the subject name (which is the key)
            const category = Array.from(subjectToCategory.values()).includes(pacePickerContext.subject) && pacePickerContext.subject !== 'Electives'
              ? pacePickerContext.subject
              : subjectToCategory.get(pacePickerContext.subject)
            return category === 'Electives' ? pacePickerContext.subject : undefined
          })()}
          title={t("projections.addLesson", { subject: pacePickerContext.subject, quarter: pacePickerContext.quarter, week: pacePickerContext.weekIndex + 1 }) || `Add Lesson - ${pacePickerContext.subject}`}
          existingPaceCatalogIds={existingPaceCatalogIds}
        />
      )}
    </div>
  )
}
