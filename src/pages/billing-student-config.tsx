import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { EditScholarshipDialog } from "@/components/billing/edit-scholarship-dialog"
import { useTranslation } from "react-i18next"

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface StudentScholarship {
  id: string
  studentId: string
  tuitionTypeId?: string | null
  scholarshipType?: 'percentage' | 'fixed' | null
  scholarshipValue?: number | null
}

interface TuitionType {
  id: string
  name: string
  baseAmount: number
}

export default function BillingStudentConfigPage() {
  const api = useApi()
  const [students, setStudents] = React.useState<Student[]>([])
  const [scholarships, setScholarships] = React.useState<Map<string, StudentScholarship>>(new Map())
  const [tuitionTypes, setTuitionTypes] = React.useState<TuitionType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editScholarshipDialogOpen, setEditScholarshipDialogOpen] = React.useState(false)
  const [selectedStudentForScholarship, setSelectedStudentForScholarship] = React.useState<Student | null>(null)
  const { t } = useTranslation()

  const loadingRef = React.useRef(false)

  const loadData = React.useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      setIsLoading(true)
      setError(null)

      const [studentsData, typesData] = await Promise.all([
        api.students.getAll().catch(() => []),
        api.billing.getTuitionTypes().catch(() => []),
      ])

      setStudents(studentsData || [])
      setTuitionTypes(typesData || [])

      // Load scholarships for all students (404s are handled by API, returns null)
      if (studentsData && Array.isArray(studentsData)) {
        const scholarshipMap = new Map<string, StudentScholarship>()
        await Promise.all(
          studentsData.map(async (student: Student) => {
            const scholarship = await api.billing.getStudentScholarship(student.id)
            if (scholarship) {
              scholarshipMap.set(student.id, scholarship)
            }
          })
        )
        setScholarships(scholarshipMap)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load student billing data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatScholarship = (studentId: string) => {
    const scholarship = scholarships.get(studentId)
    if (!scholarship || !scholarship.scholarshipType || scholarship.scholarshipValue === null || scholarship.scholarshipValue === undefined || scholarship.scholarshipValue === 0) {
      return "—"
    }
    if (scholarship.scholarshipType === 'percentage') {
      return `${scholarship.scholarshipValue}%`
    }
    return formatCurrency(scholarship.scholarshipValue)
  }

  const getTuitionTypeName = (studentId: string) => {
    const scholarship = scholarships.get(studentId)
    if (!scholarship?.tuitionTypeId) {
      // Default to first tuition type if none selected
      return tuitionTypes.length > 0 ? tuitionTypes[0].name : "—"
    }
    const type = tuitionTypes.find(t => t.id === scholarship.tuitionTypeId)
    return type?.name || "—"
  }

  const getTuitionAmount = (studentId: string) => {
    const scholarship = scholarships.get(studentId)
    if (!scholarship?.tuitionTypeId) {
      // Default to first tuition type if none selected
      return tuitionTypes.length > 0 ? tuitionTypes[0].baseAmount : 0
    }
    const type = tuitionTypes.find(t => t.id === scholarship.tuitionTypeId)
    return type?.baseAmount || 0
  }

  const getTotalAmount = (studentId: string) => {
    const tuitionAmount = getTuitionAmount(studentId)
    const scholarship = scholarships.get(studentId)
    if (!scholarship || !scholarship.scholarshipType || scholarship.scholarshipValue === null || scholarship.scholarshipValue === undefined || scholarship.scholarshipValue === 0) {
      return tuitionAmount
    }
    if (scholarship.scholarshipType === 'percentage') {
      return tuitionAmount - (tuitionAmount * scholarship.scholarshipValue / 100)
    }
    return tuitionAmount - scholarship.scholarshipValue
  }

  const handleEditScholarship = (student: Student) => {
    setSelectedStudentForScholarship(student)
    setEditScholarshipDialogOpen(true)
  }

  if (isLoading) {
    return <Loading variant="page" />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Billing Configuration" description="Configure tuition types and scholarships for each student" />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        moduleKey="billing"
        title="Student Billing Configuration"
        description="Configure tuition types and scholarships for each student. Changes affect all future billing records."
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.studentBillingSettings")}</CardTitle>
          <CardDescription>
            {t("billing.studentBillingSettingsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm">
                    {t("billing.studentName")}
                  </th>
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                    {t("billing.email")}
                  </th>
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                    {t("billing.tuitionType")}
                  </th>
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                    {t("billing.tuition")}
                  </th>
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                    {t("billing.scholarshipColumn")}
                  </th>
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                    {t("billing.total")}
                  </th>
                  <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                    {t("billing.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {t("billing.noStudentsFound")}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 align-middle first:px-6">
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {student.email}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">
                          {getTuitionTypeName(student.id)}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        {formatCurrency(getTuitionAmount(student.id))}
                      </td>
                      <td className="p-4 align-middle">
                        {formatScholarship(student.id)}
                      </td>
                      <td className="p-4 align-middle font-semibold">
                        {formatCurrency(getTotalAmount(student.id))}
                      </td>
                      <td className="p-4 align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditScholarship(student)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t("billing.edit")}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditScholarshipDialog
        open={editScholarshipDialogOpen}
        onOpenChange={setEditScholarshipDialogOpen}
        student={selectedStudentForScholarship}
        scholarship={selectedStudentForScholarship ? scholarships.get(selectedStudentForScholarship.id) || null : null}
        onSuccess={loadData}
      />
    </div>
  )
}

