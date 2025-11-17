import * as React from "react"
import { useParams } from "react-router-dom"
import { Loading } from "@/components/ui/loading"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Navigate } from "react-router-dom"
import { Download, Printer } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { ReportCardTable } from "@/components/report-card-table"

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

  const [reportCard, setReportCard] = React.useState<ReportCardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)

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
            setError(error.message || 'Error al cargar la boleta')
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

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!reportCard) return

    // Export all quarters - for now export Q1 as example
    const content = generatePDFContent(reportCard, reportCard.quarters.Q1)

    // Create a blob and download
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Boleta_${reportCard.studentName}_${reportCard.schoolYear}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePDFContent = (data: ReportCardData, quarter: ReportCardQuarterData): string => {
    // This is a simple HTML export - you could enhance this with a proper PDF library
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Boleta de Calificaciones - ${data.studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .header-row { background-color: #FF9800; color: white; }
          </style>
        </head>
        <body>
          <h1>Boleta de Calificaciones</h1>
          <p><strong>Estudiante:</strong> ${data.studentName}</p>
          <p><strong>Año Escolar:</strong> ${data.schoolYear}</p>
          <p><strong>Trimestre:</strong> ${quarter.quarter}</p>
          <!-- Add table content here -->
        </body>
      </html>
    `
  }

  if (!hasPermission || !canViewReportCard) {
    return <Navigate to="/404" replace />
  }

  if (loading || isLoadingUser) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="md:hidden">
          <BackButton to={`/students/${studentId}/report-cards`}>
            Volver
          </BackButton>
        </div>
        <Loading variant="spinner" message="Cargando boleta..." />
      </div>
    )
  }

  if (error || !reportCard) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="md:hidden">
          <BackButton to={`/students/${studentId}/report-cards`}>
            Volver
          </BackButton>
        </div>
        <ErrorAlert
          title="Error al cargar la boleta"
          message={error || 'No se pudo cargar la boleta de calificaciones'}
        />
      </div>
    )
  }

  const roles = userInfo?.roles.map((role) => role.name) ?? []
  const hasRole = (role: string) => roles.includes(role)
  const isStudentOnly = hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('SCHOOL_ADMIN') && !hasRole('ADMIN') && !hasRole('SUPERADMIN')
  const backDestination = isStudentOnly ? '/my-profile' : `/students/${studentId}/report-cards`

  return (
    <div className="space-y-4 md:space-y-6 print:space-y-2">
      {/* Mobile back button */}
      <div className="md:hidden print:hidden">
        <BackButton to={backDestination}>
          Volver
        </BackButton>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Boleta de Calificaciones</h1>
          <p className="text-muted-foreground">
            {reportCard.studentName} - Año Escolar {reportCard.schoolYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quarterly Tabs */}
      <Tabs defaultValue="Q1" className="space-y-4 md:space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 print:hidden">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-4 min-w-max md:min-w-0">
            <TabsTrigger value="Q1" className="flex-shrink-0">Bloque 1</TabsTrigger>
            <TabsTrigger value="Q2" className="flex-shrink-0">Bloque 2</TabsTrigger>
            <TabsTrigger value="Q3" className="flex-shrink-0">Bloque 3</TabsTrigger>
            <TabsTrigger value="Q4" className="flex-shrink-0">Bloque 4</TabsTrigger>
          </TabsList>
        </div>

        {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => {
          const quarterData = reportCard.quarters[quarter]
          return (
            <TabsContent key={quarter} value={quarter} className="space-y-4 md:space-y-6">
              <ReportCardTable
                studentName={reportCard.studentName}
                schoolYear={reportCard.schoolYear}
                quarter={quarterData}
              />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

