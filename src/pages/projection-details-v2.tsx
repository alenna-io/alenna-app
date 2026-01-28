import * as React from "react"
import { useParams } from "react-router-dom"
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
  const { projectionId } = useParams()
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
    isActive: boolean
  } | null>(null)

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

        setProjectionInfo({
          studentName: `${projection.student.user.firstName || ''} ${projection.student.user.lastName || ''}`.trim(),
          schoolYear: projection.schoolYear,
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

        setProjectionInfo({
          studentName: `${projection.student.user.firstName || ''} ${projection.student.user.lastName || ''}`.trim(),
          schoolYear: projection.schoolYear,
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {projectionInfo.studentName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={projectionInfo.isActive ? "default" : "secondary"}>
              {projectionInfo.isActive ? t("projections.active") : t("projections.inactive")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {projectionInfo.schoolYear}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {totalPaces}
          </div>
          <div className="text-sm text-muted-foreground">
            {t("projections.totalPaces")}
          </div>
        </div>
      </div>

      <Tabs defaultValue="Q1" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
                isReadOnly={false}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Q2" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q2}
                quarter="Q2"
                quarterName="Q2"
                isReadOnly={false}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Q3" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q3}
                quarter="Q3"
                quarterName="Q3"
                isReadOnly={false}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Q4" className="mt-6">
          <Card className='bg-transparent'>
            <CardContent className="!p-0">
              <ACEQuarterlyTable
                data={projectionData.Q4}
                quarter="Q4"
                quarterName="Q4"
                isReadOnly={false}
                subjectToCategory={subjectToCategory}
                subjectToCategoryDisplayOrder={subjectToCategoryDisplayOrder}
                categoryCounts={categoryCounts}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
