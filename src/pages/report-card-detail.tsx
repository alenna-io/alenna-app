import * as React from "react"
import { useParams } from "react-router-dom"
import { Loading } from "@/components/ui/loading"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Navigate } from "react-router-dom"
import { Download } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { ReportCardTable } from "@/components/report-card-table"
import { pdf } from "@react-pdf/renderer"
import { ReportCardPDF } from "@/components/report-card-pdf"
import { useTranslation } from "react-i18next"

interface ReportCardSubjectData {
  subject: string
  paces: Array<{
    id: string
    code: string
    grade: number | null
    isCompleted: boolean
    isFailed: boolean
  }>
  average: number | null
  passedCount: number
}

interface ReportCardMonthlyAssignment {
  id: string
  name: string
  grade: number | null
  percentage: number
}

interface ReportCardQuarterData {
  quarter: string
  subjects: ReportCardSubjectData[]
  monthlyAssignments: ReportCardMonthlyAssignment[]
  monthlyAssignmentAverage: number | null
  monthlyAssignmentPercentage: number
  pacePercentage: number
  overallAverage: number | null
  finalGrade: number | null
  totalPassedPaces: number
  academicProjectionCompleted: boolean
}

interface ReportCardData {
  projectionId: string
  studentId: string
  studentName: string
  schoolYear: string
  quarters: {
    Q1: ReportCardQuarterData
    Q2: ReportCardQuarterData
    Q3: ReportCardQuarterData
    Q4: ReportCardQuarterData
  }
}

export default function ReportCardDetailPage() {
  const { studentId, projectionId } = useParams()
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const [reportCard, setReportCard] = React.useState<ReportCardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [activeQuarter, setActiveQuarter] = React.useState<string>("Q1")
  const reportCardRef = React.useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // Fetch report card data
  React.useEffect(() => {
    if (!studentId || !projectionId) return

    let isMounted = true

    const fetchReportCard = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await api.reportCards.get(studentId, projectionId) as ReportCardData
        if (isMounted) {
          setReportCard(data)
        }
      } catch (err) {
        const error = err as Error
        console.error('Error fetching report card:', error)
        if (isMounted) {
          if (error.message?.includes('permiso') || error.message?.includes('not found') || error.message?.includes('no encontrada') || error.message?.includes('no encontrado')) {
            setHasPermission(false)
          } else {
            setError(error.message || t("reportCards.errorMessage"))
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchReportCard()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId])

  // Check permissions
  const canViewReportCard = React.useMemo(() => {
    if (!userInfo) return false
    return userInfo.permissions.includes('reportCards.read') || userInfo.permissions.includes('reportCards.readOwn')
  }, [userInfo])

  const handleExport = async () => {
    if (!reportCard) return

    setIsExporting(true)

    try {
      // Generate PDF using @react-pdf/renderer
      const pdfDoc = (
        <ReportCardPDF
          studentName={reportCard.studentName}
          schoolYear={reportCard.schoolYear}
          quarters={reportCard.quarters}
          translations={{
            detailTitle: t("reportCards.detailTitle"),
            schoolYearLabel: t("reportCards.schoolYearLabel"),
            quarterQ1: t("monthlyAssignments.quarterLabelQ1"),
            quarterQ2: t("monthlyAssignments.quarterLabelQ2"),
            quarterQ3: t("monthlyAssignments.quarterLabelQ3"),
            quarterQ4: t("monthlyAssignments.quarterLabelQ4"),
            lessons: t("reportCards.lessons"),
            subject: t("reportCards.subject"),
            lesson: t("reportCards.lesson"),
            average: t("reportCards.average"),
            academicProjectionCompleted: t("reportCards.academicProjectionCompleted"),
            yes: t("reportCards.yes"),
            no: t("reportCards.no"),
            monthlyAssignments: t("reportCards.monthlyAssignments"),
            assignment: t("reportCards.assignment"),
            grade: t("reportCards.grade"),
            averageLabel: t("reportCards.averageLabel"),
            lessonsAverage: t("reportCards.lessonsAverage"),
            monthlyAssignmentsAverage: t("reportCards.monthlyAssignmentsAverage"),
            passedLessons: t("reportCards.passedLessons"),
            finalGrade: t("reportCards.finalGrade"),
            noLessonsAssigned: t("reportCards.noLessonsAssigned"),
            noMonthlyAssignments: t("reportCards.noMonthlyAssignments"),
          }}
        />
      )

      // Generate PDF blob
      const blob = await pdf(pdfDoc).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${t("reportCards.detailTitle")}_${reportCard.studentName.replace(
        /\s+/g,
        "_"
      )}_${reportCard.schoolYear}_${t("common.complete")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("[PDF Export] PDF saved successfully with all 4 quarters")
    } catch (error) {
      console.error("Error in export process:", error)
      setError(t("reportCards.exportError") || "Error exporting PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  if (!hasPermission || !canViewReportCard) {
    return <Navigate to="/404" replace />
  }

  if (loading || isLoadingUser) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="md:hidden">
          <BackButton to={`/students/${studentId}/report-cards`}>
            {t("common.back")}
          </BackButton>
        </div>
        <Loading variant="spinner" message={t("reportCards.loadingReportCard")} />
      </div>
    )
  }

  if (error || !reportCard) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="md:hidden">
          <BackButton to={`/students/${studentId}/report-cards`}>
            {t("common.back")}
          </BackButton>
        </div>
        <ErrorAlert
          title={t("reportCards.errorLoadingReportCard")}
          message={error || t("reportCards.errorMessage")}
        />
      </div>
    )
  }

  const roles = userInfo?.roles.map((role) => role.name) ?? []
  const hasRole = (role: string) => roles.includes(role)
  const isStudentOnly = hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('SCHOOL_ADMIN') && !hasRole('ADMIN') && !hasRole('SUPERADMIN')
  const backDestination = isStudentOnly ? '/my-profile' : `/students/${studentId}/report-cards`

  return (
    <div className="space-y-4 md:space-y-6 print:space-y-2 min-h-screen">
      {/* Mobile back button */}
      <div className="md:hidden print:hidden">
        <BackButton to={backDestination}>
          {t("common.back")}
        </BackButton>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">{t("reportCards.detailTitle")}</h1>
          <p className="text-muted-foreground">
            {reportCard.studentName} - {t("reportCards.schoolYearLabel")} {reportCard.schoolYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? t("reportCards.exporting") : t("reportCards.export")}
          </Button>
        </div>
      </div>

      {/* Quarterly Tabs */}
      <div ref={reportCardRef}>
        <Tabs
          defaultValue="Q1"
          value={activeQuarter}
          onValueChange={setActiveQuarter}
          className="space-y-4 md:space-y-6"
        >
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 print:hidden">
            <TabsList className="inline-flex w-full md:grid md:grid-cols-4 min-w-max md:min-w-0">
              <TabsTrigger value="Q1" className="shrink-0">
                {t("monthlyAssignments.quarterLabelQ1")}
              </TabsTrigger>
              <TabsTrigger value="Q2" className="shrink-0">
                {t("monthlyAssignments.quarterLabelQ2")}
              </TabsTrigger>
              <TabsTrigger value="Q3" className="shrink-0">
                {t("monthlyAssignments.quarterLabelQ3")}
              </TabsTrigger>
              <TabsTrigger value="Q4" className="shrink-0">
                {t("monthlyAssignments.quarterLabelQ4")}
              </TabsTrigger>
            </TabsList>
          </div>

          {(["Q1", "Q2", "Q3", "Q4"] as const).map((quarter) => {
            const quarterData = reportCard.quarters[quarter]
            return (
              <TabsContent
                key={quarter}
                value={quarter}
                className="space-y-4 md:space-y-6"
              >
                <div data-quarter={quarter}>
                  <ReportCardTable
                    studentName={reportCard.studentName}
                    schoolYear={reportCard.schoolYear}
                    quarter={quarterData}
                  />
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}

