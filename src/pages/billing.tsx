import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Users, Settings, Plus } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { SearchBar } from "@/components/ui/search-bar"
import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle2, Send, X, RotateCcw } from "lucide-react"

interface BillingRecord {
  id: string
  studentId: string
  studentName?: string
  schoolYearId: string
  billingMonth: number
  billingYear: number
  tuitionTypeSnapshot: {
    tuitionTypeId: string
    tuitionTypeName: string
    baseAmount: number
    lateFeeType: 'fixed' | 'percentage'
    lateFeeValue: number
  }
  effectiveTuitionAmount: number
  scholarshipAmount: number
  discountAdjustments: Array<{ type: 'percentage' | 'fixed'; value: number; description?: string }>
  extraCharges: Array<{ amount: number; description?: string }>
  finalAmount: number
  lateFeeAmount: number
  billStatus: 'required' | 'sent' | 'not_required' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid'
  paidAt: string | null
  lockedAt: string | null
  paymentMethod: 'manual' | 'online' | 'other' | null
  paymentNote: string | null
  dueDate: string
  isOverdue: boolean
  isPaid: boolean
  isLocked: boolean
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface DashboardData {
  totalIncome: number
  expectedIncome: number
  missingIncome: number
  totalStudentsPaid: number
  totalStudentsNotPaid: number
  lateFeesApplied: number
}

interface Filters extends Record<string, string> {
  month: string
  student: string
  status: string
}

export default function BillingPage() {
  const { t } = useTranslation()
  const api = useApi()
  const [records, setRecords] = React.useState<BillingRecord[]>([])
  const [students, setStudents] = React.useState<Student[]>([])
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [generatingBills, setGeneratingBills] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Filters
  const [filters, setFilters] = React.useState<Filters>({
    month: "all",
    student: "all",
    status: "all",
  })

  const loadingRef = React.useRef(false)

  const loadData = React.useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      setIsLoading(true)
      setError(null)

      const [recordsData, studentsData, config] = await Promise.all([
        api.billing.getAll(),
        api.students.getAll().catch(() => []),
        api.billing.getTuitionConfig().catch(() => null),
      ])

      // Records already include studentName from API
      setRecords(recordsData || [])
      setStudents(studentsData || [])

      // Calculate dashboard data
      if (recordsData && recordsData.length > 0) {

        // Calculate dashboard metrics from records (including pending late fees)
        if (config) {
          // Calculate metrics
          let totalIncome = 0
          let expectedIncome = 0
          let missingIncome = 0
          let totalStudentsPaid = 0
          let totalStudentsNotPaid = 0
          let lateFeesTotal = 0
          const paidStudentIds = new Set<string>()
          const unpaidStudentIds = new Set<string>()

          recordsData.forEach((record: BillingRecord) => {
            // Calculate pending late fee if overdue
            const dueDate = new Date(record.dueDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            dueDate.setHours(0, 0, 0, 0)
            const isOverdue = today > dueDate
            const hasPendingLateFee = isOverdue && !record.isPaid && record.billStatus !== 'cancelled' && record.billStatus !== 'not_required' && record.lateFeeAmount === 0

            let pendingLateFee = 0
            if (hasPendingLateFee) {
              // Calculate discount amount
              const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
                if (adj.type === 'percentage') {
                  return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
                }
                return sum + adj.value
              }, 0)
              const amountAfterDiscounts = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount

              // Calculate late fee based on snapshot
              if (record.tuitionTypeSnapshot.lateFeeType === 'fixed') {
                pendingLateFee = record.tuitionTypeSnapshot.lateFeeValue
              } else {
                pendingLateFee = amountAfterDiscounts * (record.tuitionTypeSnapshot.lateFeeValue / 100)
              }
            }

            const totalLateFee = record.lateFeeAmount + pendingLateFee
            const extraAmount = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
            const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
              if (adj.type === 'percentage') {
                return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
              }
              return sum + adj.value
            }, 0)
            const totalFinalAmount = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount + extraAmount + totalLateFee

            // Count paid bills
            if (record.paymentStatus === 'paid') {
              totalIncome += record.finalAmount // Use stored finalAmount for paid bills
              paidStudentIds.add(record.studentId)
            }

            // Count expected income (all bills that should be paid)
            if (['required', 'sent'].includes(record.billStatus) || record.paymentStatus === 'paid') {
              expectedIncome += totalFinalAmount // Include pending late fees
            }

            // Count unpaid students
            if (['required', 'sent'].includes(record.billStatus) && record.paymentStatus === 'unpaid') {
              unpaidStudentIds.add(record.studentId)
            }

            // Sum late fees (both applied and pending)
            lateFeesTotal += totalLateFee
          })

          missingIncome = expectedIncome - totalIncome
          totalStudentsPaid = paidStudentIds.size
          totalStudentsNotPaid = unpaidStudentIds.size

          setDashboardData({
            totalIncome,
            expectedIncome,
            missingIncome,
            totalStudentsPaid,
            totalStudentsNotPaid,
            lateFeesApplied: lateFeesTotal, // Total late fees (applied + pending)
          })
        }
      }

      // Automatically apply late fees for overdue bills
      if (recordsData && config && Array.isArray(recordsData)) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueBills = recordsData.filter((record: BillingRecord) => {
          const dueDate = new Date(record.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return (
            today > dueDate &&
            record.paymentStatus !== 'paid' &&
            record.billStatus !== 'cancelled' &&
            record.billStatus !== 'not_required' &&
            record.lateFeeAmount === 0
          )
        })

        if (overdueBills.length > 0) {
          try {
            await api.billing.bulkApplyLateFee({})
            // Reload data to get updated records with late fees
            const updatedRecords = await api.billing.getAll()
            setRecords(updatedRecords || [])
          } catch (err: unknown) {
            // Silently fail - late fees will be applied on next load
            console.warn('Failed to automatically apply late fees:', err)
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load billing data'
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

  const getStatusBadge = (billStatus: string, paymentStatus: string, isOverdue: boolean) => {
    if (paymentStatus === 'paid') {
      return (
        <Badge className="bg-green-600 text-white">
          {t("billing.status.paid")}
        </Badge>
      )
    }

    switch (billStatus) {
      case 'sent':
        return (
          <Badge className={isOverdue ? "bg-orange-600 text-white" : "bg-blue-600 text-white"}>
            {t("billing.status.sent")}
          </Badge>
        )
      case 'required':
        return (
          <Badge className={isOverdue ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}>
            {t("billing.status.required")}
          </Badge>
        )
      case 'not_required':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            {t("billing.status.notRequired")}
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            {t("billing.status.cancelled")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{billStatus}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long' })
  }

  const handleStatusUpdate = async (recordId: string, newBillStatus: BillingRecord['billStatus']) => {
    try {
      await api.billing.update(recordId, { billStatus: newBillStatus })
      toast.success(t("billing.statusUpdated"))
      await loadData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status"
      toast.error(errorMessage)
    }
  }

  const handleMarkAsPaid = async (recordId: string) => {
    try {
      await api.billing.recordPayment(recordId, {
        paymentMethod: 'manual',
      })
      toast.success(t("billing.paymentRecorded"))
      await loadData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to record payment"
      toast.error(errorMessage)
    }
  }


  const handleBulkGenerateBills = async () => {
    try {
      setGeneratingBills(true)
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      // Get active school year - for now, use a placeholder or get from API
      // You may need to adjust this based on your school year logic
      const schoolYearId = records[0]?.schoolYearId || ""

      if (!schoolYearId) {
        toast.error("No active school year found. Please create a school year first.")
        return
      }

      await api.billing.bulkCreate({
        schoolYearId,
        billingMonth: currentMonth,
        billingYear: currentYear,
      })

      toast.success("Bills generated successfully for all students")
      await loadData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate bills"
      toast.error(errorMessage)
    } finally {
      setGeneratingBills(false)
    }
  }

  const getScholarshipDisplay = (record: BillingRecord) => {
    // If no scholarship, show effective tuition amount
    if (record.scholarshipAmount === 0) {
      return formatCurrency(record.effectiveTuitionAmount)
    }
    return <span className="text-green-600">-{formatCurrency(record.scholarshipAmount)}</span>
  }

  const getLateFeeDisplay = (record: BillingRecord) => {
    // Show late fee if:
    // 1. Late fee has been applied (lateFeeAmount > 0), OR
    // 2. Bill is unpaid and overdue (after due date)
    const dueDate = new Date(record.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)

    const isOverdue = today > dueDate
    const shouldShowLateFee = record.lateFeeAmount > 0 || (isOverdue && !record.isPaid && record.billStatus !== 'cancelled' && record.billStatus !== 'not_required')

    if (shouldShowLateFee) {
      // Calculate late fee if not already applied
      if (record.lateFeeAmount === 0) {
        // Calculate discount amount
        const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
          if (adj.type === 'percentage') {
            return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
          }
          return sum + adj.value
        }, 0)
        const amountAfterDiscounts = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount

        // Calculate late fee based on snapshot
        let calculatedLateFee = 0
        if (record.tuitionTypeSnapshot.lateFeeType === 'fixed') {
          calculatedLateFee = record.tuitionTypeSnapshot.lateFeeValue
        } else {
          calculatedLateFee = amountAfterDiscounts * (record.tuitionTypeSnapshot.lateFeeValue / 100)
        }
        return <span className="text-orange-600">+{formatCurrency(calculatedLateFee)}</span>
      }
      return <span className="text-red-600">+{formatCurrency(record.lateFeeAmount)}</span>
    }
    return <span className="text-muted-foreground">—</span>
  }

  // Filter records
  const filteredRecords = records.filter((record) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesName = record.studentName?.toLowerCase().includes(searchLower)
      const matchesMonth = getMonthName(record.billingMonth).toLowerCase().includes(searchLower)
      if (!matchesName && !matchesMonth) return false
    }

    // Other filters
    if (filters.month !== "all" && `${record.billingMonth}/${record.billingYear}` !== filters.month) return false
    if (filters.student !== "all" && record.studentId !== filters.student) return false
    if (filters.status !== "all") {
      // Handle both old 'paid' status and new billStatus/paymentStatus
      if (filters.status === 'paid') {
        if (record.paymentStatus !== 'paid') return false
      } else {
        if (record.billStatus !== filters.status) return false
      }
    }
    return true
  })

  // Get unique months for filter
  const months = React.useMemo(() => {
    const monthSet = new Set<string>()
    records.forEach((r) => {
      monthSet.add(`${r.billingMonth}/${r.billingYear}`)
    })
    return Array.from(monthSet).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number)
      const [m2, y2] = b.split('/').map(Number)
      if (y1 !== y2) return y2 - y1
      return m2 - m1
    })
  }, [records])

  const filterFields: FilterField[] = [
    {
      key: "month",
      label: t("billing.month"),
      type: "select",
      color: "bg-blue-500",
      placeholder: t("billing.allMonths"),
      options: [
        { value: "all", label: t("billing.allMonths") },
        ...months.map((month) => {
          const [m, y] = month.split('/').map(Number)
          return {
            value: month,
            label: `${getMonthName(m)} ${y}`,
          }
        }),
      ],
    },
    {
      key: "student",
      label: t("billing.studentName"),
      type: "select",
      color: "bg-green-500",
      placeholder: t("billing.allStudents"),
      searchable: true,
      options: [
        { value: "all", label: t("billing.allStudents") },
        ...students.map((student) => ({
          value: student.id,
          label: `${student.firstName} ${student.lastName}`,
        })),
      ],
    },
    {
      key: "status",
      label: t("billing.billStatus"),
      type: "select",
      color: "bg-purple-500",
      placeholder: t("billing.allStatuses"),
      options: [
        { value: "all", label: t("billing.allStatuses") },
        { value: "required", label: t("billing.status.required") },
        { value: "sent", label: t("billing.status.sent") },
        { value: "paid", label: t("billing.status.paid") },
        { value: "not_required", label: t("billing.status.notRequired") },
        { value: "cancelled", label: t("billing.status.cancelled") },
      ],
    },
  ]

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.month && currentFilters.month !== "all") {
      const [m, y] = currentFilters.month.split('/').map(Number)
      labels.push(`Month: ${getMonthName(m)} ${y}`)
    }
    if (currentFilters.student && currentFilters.student !== "all") {
      const student = students.find((s) => s.id === currentFilters.student)
      if (student) {
        labels.push(`Student: ${student.firstName} ${student.lastName}`)
      }
    }
    if (currentFilters.status && currentFilters.status !== "all") {
      labels.push(`Status: ${currentFilters.status.charAt(0).toUpperCase() + currentFilters.status.slice(1).replace('_', ' ')}`)
    }
    return labels
  }

  if (isLoading) {
    return <Loading variant="page" />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" description="Manage monthly tuition billing" />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalStudents = dashboardData ? (dashboardData.totalStudentsPaid || 0) + (dashboardData.totalStudentsNotPaid || 0) : 0
  const paymentRate = totalStudents > 0 && dashboardData ? Math.round(((dashboardData.totalStudentsPaid || 0) / totalStudents) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          moduleKey="billing"
          title={t("billing.title")}
          description={t("billing.description")}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBulkGenerateBills}
            disabled={generatingBills}
          >
            <Plus className="mr-2 h-4 w-4" />
            {generatingBills ? t("billing.generating") : t("billing.generateBills")}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/billing/config">
              <Settings className="mr-2 h-4 w-4" />
              {t("billing.configurationButton")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income & Expected Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("billing.incomeOverview")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData?.totalIncome || 0)}</div>
                <p className="text-xs text-muted-foreground">Total Income</p>
              </div>
              <div className="pt-2 border-t">
                <div className="text-lg font-semibold text-blue-600">{formatCurrency(dashboardData?.expectedIncome || 0)}</div>
                <p className="text-xs text-muted-foreground">Expected Income</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missing Money & Interests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData?.missingIncome || 0)}</div>
                <p className="text-xs text-muted-foreground">Missing Money</p>
              </div>
              <div className="pt-2 border-t">
                <div className="text-lg font-semibold text-orange-600">
                  {formatCurrency(dashboardData?.lateFeesApplied || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Late Fees (Interests)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid vs Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">
                  {dashboardData?.totalStudentsPaid || 0} / {totalStudents}
                </div>
                <p className="text-xs text-muted-foreground">{t("billing.studentsPaidTotal", { paid: dashboardData?.totalStudentsPaid || 0, total: totalStudents })}</p>
              </div>
              <div className="pt-2 border-t">
                <div className="text-lg font-semibold text-green-600">
                  {paymentRate}%
                </div>
                <p className="text-xs text-muted-foreground">{t("billing.paymentRate")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Records Section */}
      <div className="space-y-6">
        {/* Search */}
        <SearchBar
          placeholder="Search by student name or month..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Filters */}
        <GenericFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalItems={records.length}
          filteredCount={filteredRecords.length}
          fields={filterFields}
          getActiveFilterLabels={getActiveFilterLabels}
        />

        {/* Billing Records Table */}
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm">
                      {t("billing.studentName")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.month")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.tuition")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.lateFee")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.total")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.billStatus")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.dueDate")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.paidDate")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        {t("billing.noRecordsFound")}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle first:px-6">
                          <div className="font-medium">{record.studentName || 'Unknown Student'}</div>
                        </td>
                        <td className="p-4 align-middle">
                          {getMonthName(record.billingMonth)} {record.billingYear}
                        </td>
                        <td className="p-4 align-middle">
                          {getScholarshipDisplay(record)}
                        </td>
                        <td className="p-4 align-middle">
                          {getLateFeeDisplay(record)}
                        </td>
                        <td className="p-4 align-middle font-semibold">
                          {(() => {
                            // Calculate final amount: effectiveTuitionAmount - scholarshipAmount - discounts + extras + lateFeeAmount
                            // If there's a pending late fee, include it in the display
                            const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
                              if (adj.type === 'percentage') {
                                return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
                              }
                              return sum + adj.value
                            }, 0)
                            const extraAmount = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
                            const appliedLateFee = record.lateFeeAmount

                            // Check if there's a pending late fee
                            const dueDate = new Date(record.dueDate)
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            dueDate.setHours(0, 0, 0, 0)
                            const isOverdue = today > dueDate
                            const hasPendingLateFee = isOverdue && !record.isPaid && record.billStatus !== 'cancelled' && record.billStatus !== 'not_required' && appliedLateFee === 0

                            let pendingLateFee = 0
                            if (hasPendingLateFee) {
                              const amountAfterDiscounts = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount
                              if (record.tuitionTypeSnapshot.lateFeeType === 'fixed') {
                                pendingLateFee = record.tuitionTypeSnapshot.lateFeeValue
                              } else {
                                pendingLateFee = amountAfterDiscounts * (record.tuitionTypeSnapshot.lateFeeValue / 100)
                              }
                            }

                            const totalFinalAmount = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount + extraAmount + appliedLateFee + pendingLateFee
                            return formatCurrency(totalFinalAmount)
                          })()}
                        </td>
                        <td className="p-4 align-middle">
                          {getStatusBadge(record.billStatus, record.paymentStatus, record.isOverdue)}
                        </td>
                        <td className="p-4 align-middle">
                          <div className={record.isOverdue && !record.isPaid ? 'text-red-600 font-medium' : ''}>
                            {formatDate(record.dueDate)}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {record.paidAt ? formatDate(record.paidAt) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {record.paymentStatus !== 'paid' && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsPaid(record.id)}
                                  className="cursor-pointer"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  {t("billing.markAsPaid")}
                                </DropdownMenuItem>
                              )}
                              {record.paymentStatus !== 'paid' && record.billStatus !== 'cancelled' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(record.id, 'sent')}
                                    className="cursor-pointer"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    {t("billing.markBillAsSent")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(record.id, 'not_required')}
                                    className="cursor-pointer"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    {t("billing.markBillAsNotRequired")}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {record.paymentStatus === 'paid' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(record.id, 'required')}
                                  className="cursor-pointer"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  {t("billing.reopenBill")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
