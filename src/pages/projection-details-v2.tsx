import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
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

    // Count unique subjects per category in this quarter
    if (!quarters[quarter][subjectName]) {
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

    // Initialize subject array if it doesn't exist
    if (!quarters[quarter][subjectName]) {
      quarters[quarter][subjectName] = Array(9).fill(null)
    }

    // Handle multiple paces in the same week (array)
    const existingPace = quarters[quarter][subjectName][weekIndex]
    if (existingPace === null) {
      quarters[quarter][subjectName][weekIndex] = paceData
    } else if (Array.isArray(existingPace)) {
      existingPace.push(paceData)
    } else {
      // Convert single pace to array
      quarters[quarter][subjectName][weekIndex] = [existingPace, paceData]
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

  React.useEffect(() => {
    console.log('[DEBUG] editMode changed to:', editMode)
  }, [editMode])
  const [pacePickerOpen, setPacePickerOpen] = React.useState(false)
  const [pacePickerContext, setPacePickerContext] = React.useState<{
    quarter: string
    subject: string
    weekIndex: number
  } | null>(null)
  const [existingPaceCatalogIds, setExistingPaceCatalogIds] = React.useState<string[]>([])
  const [monthlyAssignments, setMonthlyAssignments] = React.useState<ProjectionMonthlyAssignment[]>([])

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

  const handlePaceMove = React.useCallback(async (quarter: string, subject: string, fromWeek: number, toWeek: number) => {
    if (!projectionId) return

    const quarterData = projectionData[quarter as keyof typeof projectionData]
    const fromPaceRaw = quarterData[subject][fromWeek]

    const fromPace = Array.isArray(fromPaceRaw) ? null : fromPaceRaw
    if (!fromPace || !fromPace.id || !fromPace.orderIndex) {
      toast.error(t("projections.errorMovingLesson") || "Cannot move pace: invalid pace")
      return
    }

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
        return
      }
    }

    const targetWeekPace = allPacesInSubject.find(item => item.quarter === quarter && item.weekIndex === toWeek)
    if (targetWeekPace && targetWeekPace.orderIndex > fromPace.orderIndex) {
      toast.error(t("projections.cannotMovePaceSequentialOrder") || "Cannot move pace: would break sequential order")
      return
    }

    try {
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
      toast.error(error.message || t("projections.errorMovingLesson") || "Failed to move pace")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId, api, t])

  const handlePaceAdd = React.useCallback(async (quarter: string, _subject: string, weekIndex: number, paceCatalogId: string) => {
    if (!projectionId) return

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
      toast.error(error.message || t("projections.errorAddingLesson") || "Failed to add pace")
    }
  }, [projectionId, api, t])

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId, api, t])

  const handlePaceSelect = React.useCallback((paceId: string) => {
    if (!pacePickerContext) return
    handlePaceAdd(pacePickerContext.quarter, pacePickerContext.subject, pacePickerContext.weekIndex, paceId)
  }, [pacePickerContext, handlePaceAdd])

  const handleMonthlyAssignmentGradeUpdate = React.useCallback(async (monthlyAssignmentId: string, grade: number) => {
    if (!projectionId) return

    try {
      await api.monthlyAssignments.updateGrade(projectionId, monthlyAssignmentId, { grade })
      toast.success(t("monthlyAssignments.gradeUpdated") || "Grade updated successfully")

      const assignments = await api.monthlyAssignments.getByProjection(projectionId)
      setMonthlyAssignments(assignments)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("monthlyAssignments.errorUpdatingGrade") || "Failed to update grade")
    }

  }, [projectionId, api, t])

  const handleMonthlyAssignmentMarkUngraded = React.useCallback(async (monthlyAssignmentId: string) => {
    if (!projectionId) return

    try {
      await api.monthlyAssignments.markUngraded(projectionId, monthlyAssignmentId)
      toast.success(t("monthlyAssignments.markedUngraded") || "Marked as ungraded")

      const assignments = await api.monthlyAssignments.getByProjection(projectionId)
      setMonthlyAssignments(assignments)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("monthlyAssignments.errorMarkingUngraded") || "Failed to mark as ungraded")
    }

  }, [projectionId, api, t])

  if (loading) {
    return <Loading variant="list-page" />
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
                    console.log('[DEBUG] Tabs onValueChange called with:', value)
                    setEditMode(value as 'view' | 'moving' | 'editing')
                  }}
                  className="w-auto"
                >
                  <TabsList className="h-8 p-0.5 bg-[#8B5CF6]/10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value="view"
                          className="h-7 px-2.5 text-sm transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
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
                          className="h-7 px-2.5 text-sm transition-all duration-200"
                        >
                          <Move className="h-4 w-4" />
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
                          className="h-7 px-2.5 text-sm transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
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



      <Tabs defaultValue="Q1" className="w-full">
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
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'moving' ? handleAddPaceClick : undefined}
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
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'moving' ? handleAddPaceClick : undefined}
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
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'moving' ? handleAddPaceClick : undefined}
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
                isReadOnly={!projectionInfo.isActive || editMode === 'view'}
                editMode={editMode}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
                onPaceDrop={editMode === 'moving' ? handlePaceMove : undefined}
                onAddPace={editMode === 'moving' ? handleAddPaceClick : undefined}
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
          categoryFilter={subjectToCategory.get(pacePickerContext.subject)}
          subSubjectFilter={subjectToCategory.get(pacePickerContext.subject) === 'Electives' ? pacePickerContext.subject : undefined}
          title={t("projections.addLesson", { subject: pacePickerContext.subject, quarter: pacePickerContext.quarter, week: pacePickerContext.weekIndex + 1 }) || `Add Lesson - ${pacePickerContext.subject}`}
          existingPaceCatalogIds={existingPaceCatalogIds}
        />
      )}
    </div>
  )
}
