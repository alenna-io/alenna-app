import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { EditScholarshipDialog } from "@/components/billing/edit-scholarship-dialog"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

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
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
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

  // Pagination
  const totalPages = Math.ceil(students.length / itemsPerPage)
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return students.slice(startIndex, startIndex + itemsPerPage)
  }, [students, currentPage, itemsPerPage])

  const columns: AlennaTableColumn<Student>[] = [
    {
      key: 'name',
      label: t("billing.studentName"),
      render: (student) => (
        <div className="font-medium">{student.firstName} {student.lastName}</div>
      )
    },
    {
      key: 'tuitionType',
      label: t("billing.tuitionType"),
      render: (student) => (
        <div className="font-medium">{getTuitionTypeName(student.id)}</div>
      )
    },
    {
      key: 'tuition',
      label: t("billing.tuition"),
      render: (student) => formatCurrency(getTuitionAmount(student.id))
    },
    {
      key: 'scholarship',
      label: t("billing.scholarshipColumn"),
      render: (student) => formatScholarship(student.id)
    },
    {
      key: 'total',
      label: t("billing.total"),
      render: (student) => (
        <div className="font-semibold">{formatCurrency(getTotalAmount(student.id))}</div>
      )
    }
  ]

  const actions: AlennaTableAction<Student>[] = [
    {
      label: t("billing.edit"),
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditScholarship
    }
  ]

  if (isLoading) {
    return <Loading variant="list-page" showCreateButton={false} view="table" showFilters={false} />
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
        title={t("billing.studentBillingConfiguration")}
        description={t("billing.studentBillingConfigurationDescription")}
      />

      <AlennaTable
        columns={columns}
        data={paginatedStudents}
        actions={actions}
        pagination={{
          currentPage,
          totalPages,
          totalItems: students.length,
          pageSize: itemsPerPage,
          onPageChange: setCurrentPage
        }}
        emptyState={{
          message: t("billing.noStudentsFound")
        }}
        getRowId={(student) => student.id}
      />

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

