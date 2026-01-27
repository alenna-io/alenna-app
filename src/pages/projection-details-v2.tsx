import * as React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import type { QuarterData } from "@/types/pace"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { ErrorAlert } from "@/components/ui/error-alert"

const createEmptyQuarterData = (): QuarterData => ({
  Math: Array(9).fill(null),
  English: Array(9).fill(null),
  "Word Building": Array(9).fill(null),
  Science: Array(9).fill(null),
  "Social Studies": Array(9).fill(null),
  Spanish: Array(9).fill(null),
  Electives: Array(9).fill(null)
})

const initialProjectionData = {
  Q1: createEmptyQuarterData(),
  Q2: createEmptyQuarterData(),
  Q3: createEmptyQuarterData(),
  Q4: createEmptyQuarterData(),
}

const FAKE_PROJECTION_DATA = {
  Q1: createEmptyQuarterData(),
  Q2: createEmptyQuarterData(),
  Q3: createEmptyQuarterData(),
  Q4: createEmptyQuarterData(),
}

const FAKE_PROJECTION_INFO = {
  id: "proj-1",
  studentId: "student-1",
  schoolYear: "2024-2025",
  startDate: "2024-08-01T00:00:00.000Z",
  endDate: "2025-05-31T00:00:00.000Z",
  isActive: true,
  student: {
    id: "student-1",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
  },
}

export default function ProjectionDetailsPageV2() {
  const { studentId, projectionId } = useParams()
  const { t } = useTranslation()

  const [projectionData, setProjectionData] = React.useState(initialProjectionData)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [projectionInfo, setProjectionInfo] = React.useState(FAKE_PROJECTION_INFO)

  React.useEffect(() => {
    const fetchProjection = async () => {
      try {
        setLoading(true)
        setError(null)

        setProjectionData(FAKE_PROJECTION_DATA)
        setProjectionInfo(FAKE_PROJECTION_INFO)
        toast.info("Note: Projection details endpoint not yet available. Showing sample data.")
      } catch (err) {
        const error = err as Error
        console.error('Error fetching projection:', error)
        setError(error.message || 'Failed to load projection')
        toast.error("Error al cargar la proyección")
      } finally {
        setLoading(false)
      }
    }

    if (projectionId && studentId) {
      fetchProjection()
    }
  }, [projectionId, studentId])

  if (loading) {
    return <Loading variant="list-page" />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Error al cargar la proyección"
          message={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {projectionInfo.student.name}
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
      </div>

      <Tabs defaultValue="Q1" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Q1">Q1</TabsTrigger>
          <TabsTrigger value="Q2">Q2</TabsTrigger>
          <TabsTrigger value="Q3">Q3</TabsTrigger>
          <TabsTrigger value="Q4">Q4</TabsTrigger>
        </TabsList>

        <TabsContent value="Q1" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <ACEQuarterlyTable
                data={projectionData.Q1}
                quarter="Q1"
                quarterName="Q1"
                isReadOnly={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Q2" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <ACEQuarterlyTable
                data={projectionData.Q2}
                quarter="Q2"
                quarterName="Q2"
                isReadOnly={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Q3" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <ACEQuarterlyTable
                data={projectionData.Q3}
                quarter="Q3"
                quarterName="Q3"
                isReadOnly={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Q4" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <ACEQuarterlyTable
                data={projectionData.Q4}
                quarter="Q4"
                quarterName="Q4"
                isReadOnly={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
