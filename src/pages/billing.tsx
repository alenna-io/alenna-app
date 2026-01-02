import * as React from "react"
import { useApi } from "@/services/api"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { AlennaSkeleton } from "@/components/ui/alenna-skeleton"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Users, Plus, CheckCircle2, Send, X, Pencil, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { SearchBar } from "@/components/ui/search-bar"
import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { AlennaTable } from "@/components/ui/alenna-table"
import { PartialPaymentDialog } from "@/components/billing/partial-payment-dialog"
import { PaymentHistoryDialog } from "@/components/billing/payment-history-dialog"
import { EditBillingRecordDialog } from "@/components/billing/edit-billing-record-dialog"
import { usePersistedState } from "@/hooks/use-table-state"

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
  billStatus: 'not_required' | 'required' | 'sent'
  paymentStatus: 'pending' | 'delayed' | 'partial_payment' | 'paid'
  paidAmount: number
  paidAt: string | null
  lockedAt: string | null
  paymentMethod: 'manual' | 'online' | 'other' | null
  paymentNote: string | null
  dueDate: string
  isOverdue: boolean
  isPaid: boolean
  isLocked: boolean
  paymentTransactions?: Array<{
    id: string
    amount: number
    paymentMethod: 'manual' | 'online' | 'other'
    paymentNote?: string | null
    paidBy: string
    paidByName?: string
    paidAt: string
    createdAt: string
  }>
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

interface Filters {
  dateRange: 'month' | 'dateRange' | 'fromDate'
  billingMonth?: number
  billingYear?: number
  startDate?: string
  endDate?: string
  paymentStatus: string
  studentId: string
}

export default function BillingPage() {
  const { t } = useTranslation()
  const api = useApi()
  const [records, setRecords] = React.useState<BillingRecord[]>([])
  const [recordsTotal, setRecordsTotal] = React.useState(0)
  const [students, setStudents] = React.useState<Student[]>([])
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingDashboard, setIsLoadingDashboard] = React.useState(false)
  const [isLoadingTable, setIsLoadingTable] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [generatingBills, setGeneratingBills] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const tableId = "billing"
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
  const itemsPerPage = 10
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = React.useState(false)
  const [selectedRecordForPartialPayment, setSelectedRecordForPartialPayment] = React.useState<BillingRecord | null>(null)
  const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = React.useState(false)
  const [selectedRecordForHistory, setSelectedRecordForHistory] = React.useState<BillingRecord | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedRecordForEdit, setSelectedRecordForEdit] = React.useState<BillingRecord | null>(null)
  const [updatingAllRecords, setUpdatingAllRecords] = React.useState(false)

  // Sorting - persisted
  const [sortField, setSortField] = usePersistedState<string | null>("sortField", null, tableId)
  const [sortDirection, setSortDirection] = usePersistedState<'asc' | 'desc'>("sortDirection", 'asc', tableId)

  // Filters - default to current month, persisted
  const getDefaultFilters = (): Filters => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    return {
      dateRange: 'month',
      billingMonth: currentMonth,
      billingYear: currentYear,
      paymentStatus: "all",
      studentId: "all",
    }
  }
  const [filters, setFilters] = usePersistedState<Filters>("filters", getDefaultFilters(), tableId)

  const loadingRef = React.useRef(false)

  // Build filter params for API calls
  const buildFilterParams = React.useCallback((currentFilters: Filters) => {
    const params: {
      startDate?: string
      endDate?: string
      billingMonth?: number
      billingYear?: number
      paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid'
      studentId?: string
    } = {}

    // Filter logic: If month is selected, use it and ignore dates
    if (currentFilters.dateRange === 'month' && currentFilters.billingMonth && currentFilters.billingYear) {
      params.billingMonth = currentFilters.billingMonth
      params.billingYear = currentFilters.billingYear
    } else if (currentFilters.dateRange === 'dateRange') {
      if (currentFilters.startDate) params.startDate = currentFilters.startDate
      if (currentFilters.endDate) params.endDate = currentFilters.endDate
    } else if (currentFilters.dateRange === 'fromDate' && currentFilters.startDate) {
      params.startDate = currentFilters.startDate
    }

    if (currentFilters.paymentStatus && currentFilters.paymentStatus !== 'all') {
      params.paymentStatus = currentFilters.paymentStatus as 'pending' | 'delayed' | 'partial_payment' | 'paid'
    }

    if (currentFilters.studentId && currentFilters.studentId !== 'all') {
      params.studentId = currentFilters.studentId
    }

    return params
  }, [])

  const loadBillingData = React.useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      // Only set initial loading on first load
      if (isLoading) {
        setIsLoading(true)
      } else {
        setIsLoadingDashboard(true)
        setIsLoadingTable(true)
      }
      setError(null)

      const filterParams = buildFilterParams(filters)
      const offset = (currentPage - 1) * itemsPerPage

      // Call both endpoints simultaneously
      const [aggregatedData, recordsResult, studentsData] = await Promise.all([
        api.billing.getAggregatedFinancials(filterParams),
        api.billing.getRecords({
          ...filterParams,
          offset,
          limit: itemsPerPage,
          sortField: sortField || undefined,
          sortDirection: sortDirection,
        }),
        api.students.getAll().catch(() => []),
      ])

      setDashboardData(aggregatedData || null)
      setRecords(recordsResult?.records || [])
      setRecordsTotal(recordsResult?.total || 0)
      setStudents(studentsData || [])

      // Automatically mark overdue records as delayed and apply late fees
      // This is handled by the backend job, but we trigger it here for immediate updates
      if (recordsResult?.records && recordsResult.records.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueBills = recordsResult.records.filter((record: BillingRecord) => {
          const dueDate = new Date(record.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return (
            today > dueDate &&
            record.paymentStatus !== 'paid' &&
            (record.paymentStatus === 'pending' || record.paymentStatus === 'partial_payment')
          )
        })

        if (overdueBills.length > 0) {
          try {
            // This will mark as delayed and apply late fees (backend saves to DB)
            await api.billing.bulkApplyLateFee({})
            // Reload data to get updated records from DB
            const updatedResult = await api.billing.getRecords({
              ...filterParams,
              offset,
              limit: itemsPerPage,
              sortField: sortField || undefined,
              sortDirection: sortDirection,
            })
            setRecords(updatedResult?.records || [])
            setRecordsTotal(updatedResult?.total || 0)
          } catch (err: unknown) {
            // Silently fail - will be handled by background job
            console.warn('Failed to automatically update overdue records:', err)
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load billing data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setIsLoadingDashboard(false)
      setIsLoadingTable(false)
      loadingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, sortField, sortDirection, buildFilterParams, isLoading])

  React.useEffect(() => {
    loadBillingData()
  }, [loadBillingData])

  const calculateActualFinalAmount = (record: BillingRecord): number => {
    const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
      if (adj.type === 'percentage') {
        return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
      }
      return sum + adj.value
    }, 0)
    const extraAmount = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
    const appliedLateFee = record.lateFeeAmount

    const dueDate = new Date(record.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    const isOverdue = today > dueDate
    const hasPendingLateFee = isOverdue && !record.isPaid && record.billStatus !== 'not_required' && appliedLateFee === 0

    let pendingLateFee = 0
    if (hasPendingLateFee) {
      const amountAfterDiscounts = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount
      if (record.tuitionTypeSnapshot.lateFeeType === 'fixed') {
        pendingLateFee = record.tuitionTypeSnapshot.lateFeeValue
      } else {
        pendingLateFee = amountAfterDiscounts * (record.tuitionTypeSnapshot.lateFeeValue / 100)
      }
    }

    return record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount + extraAmount + appliedLateFee + pendingLateFee
  }

  const getPaymentStatusBadge = (record: BillingRecord) => {
    switch (record.paymentStatus) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-700 border border-green-300">
            {t("billing.paymentStatus.paid")}
          </Badge>
        )
      case 'partial_payment': {
        const paidAmt = record.paidAmount ?? 0
        const actualFinalAmount = calculateActualFinalAmount(record)
        return (
          <div className="flex flex-col gap-1">
            <Badge className="bg-blue-100 text-blue-700 border border-blue-300">
              {t("billing.paymentStatus.partialPayment")}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(paidAmt)} / {formatCurrency(actualFinalAmount)}
            </div>
          </div>
        )
      }
      case 'delayed':
        return (
          <Badge className="bg-red-100 text-red-700 border border-red-300">
            {t("billing.paymentStatus.delayed")}
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
            {t("billing.paymentStatus.pending")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{record.paymentStatus}</Badge>
    }
  }

  const getTaxableBillStatusBadge = (billStatus: string) => {
    switch (billStatus) {
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-300">
            {t("billing.taxableBillStatus.sent")}
          </Badge>
        )
      case 'required':
        return (
          <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
            {t("billing.taxableBillStatus.required")}
          </Badge>
        )
      case 'not_required':
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
            {t("billing.taxableBillStatus.notRequired")}
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
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getMonthName = React.useCallback((month: number, year: number) => {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    const monthKey = monthNames[month - 1]
    return `${t(`common.months.${monthKey}`)} ${year}`
  }, [t])

  const handleStatusUpdate = async (recordId: string, newBillStatus: BillingRecord['billStatus']) => {
    const record = records.find(r => r.id === recordId)
    if (!record) return

    // Optimistic update
    const updatedRecords = records.map(r =>
      r.id === recordId ? { ...r, billStatus: newBillStatus } : r
    )
    setRecords(updatedRecords)

    try {
      await api.billing.update(recordId, { taxableBillStatus: newBillStatus })
      toast.success(t("billing.statusUpdated"))
    } catch (err: unknown) {
      // Revert on error
      setRecords(records)
      const errorMessage = err instanceof Error ? err.message : "Failed to update status"
      toast.error(errorMessage)
    }
  }

  const handleMarkAsPaid = async (recordId: string) => {
    const record = records.find(r => r.id === recordId)
    if (!record) return

    const actualFinalAmount = calculateActualFinalAmount(record)

    // Optimistic update
    const updatedRecords = records.map(r =>
      r.id === recordId
        ? {
          ...r,
          paymentStatus: 'paid' as const,
          paidAmount: actualFinalAmount,
          paidAt: new Date().toISOString(),
          isPaid: true,
        }
        : r
    )
    setRecords(updatedRecords)

    try {
      await api.billing.recordPayment(recordId, {
        paymentMethod: 'manual',
      })
      toast.success(t("billing.paymentRecorded"))
    } catch (err: unknown) {
      // Revert on error
      setRecords(records)
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

      const currentWeekInfo = await api.schoolYears.getCurrentWeek()
      
      if (!currentWeekInfo?.schoolYear?.id) {
        toast.error(t("billing.noActiveSchoolYear"))
        return
      }

      await api.billing.bulkCreate({
        schoolYearId: currentWeekInfo.schoolYear.id,
        billingMonth: currentMonth,
        billingYear: currentYear,
      })

      toast.success(t("billing.billsGeneratedSuccessfully"))
      await loadBillingData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("billing.failedToGenerateBills")
      toast.error(errorMessage)
    } finally {
      setGeneratingBills(false)
    }
  }

  const handleBulkUpdateBills = async () => {
    try {
      setUpdatingAllRecords(true)
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      const currentWeekInfo = await api.schoolYears.getCurrentWeek()
      
      if (!currentWeekInfo?.schoolYear?.id) {
        toast.error(t("billing.noActiveSchoolYear"))
        return
      }

      const schoolYearId = currentWeekInfo.schoolYear.id

      const currentMonthRecords = records.filter(r =>
        r.billingMonth === currentMonth &&
        r.billingYear === currentYear &&
        r.paymentStatus !== 'paid' &&
        !r.isLocked
      )

      if (currentMonthRecords.length === 0) {
        toast.error(t("billing.noRecordsToUpdate"))
        return
      }

      const result = await api.billing.bulkUpdate({
        schoolYearId,
        billingMonth: currentMonth,
        billingYear: currentYear,
      })

      toast.success(t("billing.recordsUpdated", { updated: result.updated, skipped: result.skipped }))
      await loadBillingData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("billing.failedToUpdateRecords")
      toast.error(errorMessage)
    } finally {
      setUpdatingAllRecords(false)
    }
  }

  const getScholarshipDisplay = (record: BillingRecord) => {
    // Calculate tuition with scholarship, discounts, and extra charges (but not late fees)
    const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
      if (adj.type === 'percentage') {
        return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
      }
      return sum + adj.value
    }, 0)
    const extraAmount = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)

    const tuitionWithAdjustments = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount + extraAmount
    return formatCurrency(tuitionWithAdjustments)
  }

  const getLateFeeDisplay = (record: BillingRecord) => {
    // Show late fee if:
    // 1. Late fee has been applied (lateFeeAmount > 0), OR
    // 2. Bill is delayed (paymentStatus === 'delayed'), OR
    // 3. Bill is unpaid and overdue (after due date) and requires taxable bill
    const dueDate = new Date(record.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)

    const isOverdue = today > dueDate
    const isDelayed = record.paymentStatus === 'delayed'
    const shouldShowLateFee = record.lateFeeAmount > 0 || isDelayed || (isOverdue && !record.isPaid && record.billStatus !== 'not_required')

    if (shouldShowLateFee) {
      // If late fee is already applied, show it
      if (record.lateFeeAmount > 0) {
        return <span className="text-orange-600">+{formatCurrency(record.lateFeeAmount)}</span>
      }

      // Calculate late fee if not already applied
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
    return <span className="text-muted-foreground">—</span>
  }

  // Filter records by search term only (backend handles other filters)
  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return records
    const searchLower = searchTerm.toLowerCase()
    return records.filter((record) => {
      const matchesName = record.studentName?.toLowerCase().includes(searchLower)
      const matchesMonth = getMonthName(record.billingMonth, record.billingYear).toLowerCase().includes(searchLower)
      return matchesName || matchesMonth
    })
  }, [records, searchTerm, getMonthName])

  // Pagination - backend handles pagination, but we still need to filter by search
  const totalPages = Math.ceil(recordsTotal / itemsPerPage)
  const paginatedRecords = filteredRecords

  // Reset to page 1 when filters/sort change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters.dateRange, filters.billingMonth, filters.billingYear, filters.startDate, filters.endDate, filters.studentId, filters.paymentStatus, sortField, sortDirection, setCurrentPage])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filterFields: FilterField[] = [
    {
      key: "month",
      label: t("billing.month") || "Mes",
      type: "monthyear",
      placeholder: t("billing.allMonths") || "Todos los meses",
    },
    {
      key: "name",
      label: t("billing.studentName") || "Nombre",
      type: "select",
      color: "bg-green-500",
      placeholder: t("billing.allStudents") || "Todos los estudiantes",
      searchable: true,
      options: [
        { value: "all", label: t("billing.allStudents") || "Todos los estudiantes" },
        ...students.map((student) => ({
          value: student.id,
          label: `${student.firstName} ${student.lastName}`,
        })),
      ],
    },
    {
      key: "paymentStatus",
      label: t("billing.paymentStatusLabel") || "Estado de Pago",
      type: "select",
      color: "bg-purple-500",
      placeholder: t("billing.allStatuses") || "Todos los estados",
      options: [
        { value: "all", label: t("billing.allStatuses") || "Todos los estados" },
        { value: "pending", label: t("billing.paymentStatus.pending") || "Pendiente" },
        { value: "delayed", label: t("billing.paymentStatus.delayed") || "Atrasado" },
        { value: "partial_payment", label: t("billing.paymentStatus.partialPayment") || "Pago Parcial" },
        { value: "paid", label: t("billing.paymentStatus.paid") || "Pagado" },
      ],
    },
  ]

  const getActiveFilterLabels = React.useCallback((currentFilters: Record<string, string>) => {
    const labels: string[] = []
    // Use the actual filters state instead of the converted format
     
    void currentFilters
    if (filters.dateRange === 'month' && filters.billingMonth && filters.billingYear) {
      labels.push(`${t("billing.month") || "Mes"}: ${getMonthName(filters.billingMonth, filters.billingYear)}`)
    }
    if (filters.studentId && filters.studentId !== "all") {
      const student = students.find((s) => s.id === filters.studentId)
      if (student) {
        labels.push(`${t("billing.studentName") || "Nombre"}: ${student.firstName} ${student.lastName}`)
      }
    }
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      const statusLabel = filters.paymentStatus === 'pending'
        ? t("billing.paymentStatus.pending") || "Pendiente"
        : filters.paymentStatus === 'delayed'
          ? t("billing.paymentStatus.delayed") || "Atrasado"
          : filters.paymentStatus === 'partial_payment'
            ? t("billing.paymentStatus.partialPayment") || "Pago Parcial"
            : t("billing.paymentStatus.paid") || "Pagado"
      labels.push(`${t("billing.paymentStatusLabel") || "Estado de Pago"}: ${statusLabel}`)
    }
    return labels
  }, [filters, students, t, getMonthName])

  // Handle filter changes - convert old filter format to new format
  const handleFilterChange = React.useCallback((newFilters: Record<string, string>) => {
    setFilters((prev) => {
      const updated: Filters = { ...prev }

      // Handle month filter
      if (newFilters.month !== undefined) {
        if (newFilters.month === "all") {
          updated.dateRange = 'month'
          updated.billingMonth = undefined
          updated.billingYear = undefined
        } else {
          const [m, y] = newFilters.month.split('/').map(Number)
          updated.dateRange = 'month'
          updated.billingMonth = m
          updated.billingYear = y
        }
      }

      // Handle student filter
      if (newFilters.name !== undefined) {
        updated.studentId = newFilters.name
      }

      // Handle payment status filter
      if (newFilters.paymentStatus !== undefined) {
        updated.paymentStatus = newFilters.paymentStatus
      }

      return updated
    })
  }, [setFilters])

  // Convert new filter format to old format for GenericFilters component
  const filtersForComponent = React.useMemo(() => {
    const result: Record<string, string> = {
      paymentStatus: filters.paymentStatus,
      name: filters.studentId,
    }
    if (filters.dateRange === 'month' && filters.billingMonth && filters.billingYear) {
      result.month = `${filters.billingMonth}/${filters.billingYear}`
    } else {
      result.month = "all"
    }
    return result
  }, [filters])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <AlennaSkeleton height={28} width="40%" className="max-w-md" />
            <AlennaSkeleton height={20} width="70%" variant="text" className="max-w-2xl" />
          </div>
          <div className="flex gap-2">
            <AlennaSkeleton height={40} width={160} className="rounded-md" />
            <AlennaSkeleton height={40} width={160} className="rounded-md" />
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <AlennaSkeleton height={16} width="40%" variant="text" />
                <AlennaSkeleton height={16} width={16} variant="circular" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <AlennaSkeleton height={32} width="60%" />
                  <AlennaSkeleton height={14} width="50%" variant="text" />
                  <div className="pt-2 border-t">
                    <AlennaSkeleton height={24} width="50%" />
                    <AlennaSkeleton height={14} width="60%" variant="text" className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
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
          {records.length > 0 ? (() => {
            const now = new Date()
            const currentMonth = now.getMonth() + 1
            const currentYear = now.getFullYear()
            const currentMonthRecords = records.filter(r =>
              r.billingMonth === currentMonth &&
              r.billingYear === currentYear &&
              r.paymentStatus !== 'paid' &&
              !r.isLocked
            )
            const hasUpdatableRecords = currentMonthRecords.length > 0

            return (
              <Button
                onClick={handleBulkUpdateBills}
                disabled={updatingAllRecords || !hasUpdatableRecords}
                title={!hasUpdatableRecords ? t("billing.noRecordsToUpdate") || "No records available to update for the current month" : ""}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${updatingAllRecords ? 'animate-spin' : ''}`} />
                {updatingAllRecords ? t("billing.updating") || "Updating..." : t("billing.updateAllRecords") || "Update All Records"}
              </Button>
            )
          })() : (
            <Button
              onClick={handleBulkGenerateBills}
              disabled={generatingBills}
            >
              <Plus className="mr-2 h-4 w-4" />
              {generatingBills ? t("billing.generating") : t("billing.generateBills")}
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingDashboard ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <AlennaSkeleton height={16} width="40%" variant="text" />
                  <AlennaSkeleton height={16} width={16} variant="circular" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <AlennaSkeleton height={32} width="60%" />
                    <AlennaSkeleton height={14} width="50%" variant="text" />
                    <div className="pt-2 border-t">
                      <AlennaSkeleton height={24} width="50%" />
                      <AlennaSkeleton height={14} width="60%" variant="text" className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : dashboardData ? (
          <>
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
                    <p className="text-xs text-muted-foreground">{t("billing.totalIncome")}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-lg font-semibold text-blue-600">{formatCurrency(dashboardData?.expectedIncome || 0)}</div>
                    <p className="text-xs text-muted-foreground">{t("billing.expectedIncome")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Money & Interests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("billing.outstanding")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData?.missingIncome || 0)}</div>
                    <p className="text-xs text-muted-foreground">{t("billing.missingMoney")}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(dashboardData?.lateFeesApplied || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("billing.lateFeesInterests")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paid vs Total Students */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("billing.paymentStatusLabel")}</CardTitle>
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
          </>
        ) : null}
      </div>

      {/* Billing Records Section */}
      <div className="space-y-6">
        {/* Search */}
        <SearchBar
          placeholder={t("billing.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Filters */}
        <GenericFilters
          filters={filtersForComponent}
          onFiltersChange={handleFilterChange}
          totalItems={recordsTotal}
          filteredCount={records.length}
          fields={filterFields}
          getActiveFilterLabels={getActiveFilterLabels}
        />

        {/* Billing Records Table */}
        {isLoadingTable ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <th key={i} className="h-14 px-4 text-left">
                          <AlennaSkeleton height={16} width={80} variant="text" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="p-4">
                            <AlennaSkeleton height={16} width={j === 0 ? 120 : j === 7 ? 40 : 100} variant="text" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
              <AlennaSkeleton height={16} width={120} variant="text" />
              <div className="flex items-center gap-2">
                <AlennaSkeleton height={36} width={36} className="rounded-md" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <AlennaSkeleton key={i} height={36} width={36} className="rounded-md" />
                ))}
                <AlennaSkeleton height={36} width={36} className="rounded-md" />
              </div>
            </CardFooter>
          </Card>
        ) : (
          <AlennaTable
            columns={[
              {
                key: 'studentName',
                label: t("billing.studentName"),
                sortable: true,
                className: 'text-left',
                render: (record) => (
                  <div className="font-medium text-left">{record.studentName || 'Unknown Student'}</div>
                )
              },
              {
                key: 'month',
                label: t("billing.month"),
                sortable: true,
                className: 'text-left',
                render: (record) => (
                  <div className="text-sm text-left">
                    {getMonthName(record.billingMonth, record.billingYear)}
                  </div>
                )
              },
              {
                key: 'tuition',
                label: t("billing.tuition"),
                sortable: true,
                className: 'text-left',
                render: (record) => <div className="text-left">{getScholarshipDisplay(record)}</div>
              },
              {
                key: 'lateFee',
                label: t("billing.lateFee"),
                sortable: true,
                className: 'text-left',
                render: (record) => <div className="text-left">{getLateFeeDisplay(record)}</div>
              },
              {
                key: 'total',
                label: t("billing.total"),
                sortable: true,
                className: 'text-left',
                render: (record) => {
                  const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
                    if (adj.type === 'percentage') {
                      return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
                    }
                    return sum + adj.value
                  }, 0)
                  const extraAmount = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
                  const appliedLateFee = record.lateFeeAmount

                  const dueDate = new Date(record.dueDate)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  dueDate.setHours(0, 0, 0, 0)
                  const isOverdue = today > dueDate
                  const hasPendingLateFee = isOverdue && !record.isPaid && record.billStatus !== 'not_required' && appliedLateFee === 0

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
                  return <div className="font-semibold text-left">{formatCurrency(totalFinalAmount)}</div>
                }
              },
              {
                key: 'paymentStatus',
                label: t("billing.paymentStatusLabel"),
                sortable: true,
                className: 'text-left',
                render: (record) => <div className="text-left">{getPaymentStatusBadge(record)}</div>
              },
              {
                key: 'dueDate',
                label: t("billing.dueDate"),
                sortable: true,
                className: 'text-left',
                render: (record) => (
                  <div className={`text-left ${record.isOverdue && !record.isPaid ? 'text-red-600 font-medium' : ''}`}>
                    {formatDate(record.dueDate)}
                  </div>
                )
              },
              {
                key: 'paidDate',
                label: t("billing.paidDate"),
                sortable: true,
                className: 'text-left',
                render: (record) => (
                  <div className="text-left">
                    {record.paidAt ? formatDate(record.paidAt) : <span className="text-muted-foreground">—</span>}
                  </div>
                )
              },
              {
                key: 'billStatus',
                label: t("billing.taxableBillStatusLabel") || t("billing.billStatus"),
                sortable: true,
                className: 'text-left',
                render: (record) => <div className="text-left">{getTaxableBillStatusBadge(record.billStatus)}</div>
              }
            ]}
            data={paginatedRecords}
            pagination={{
              currentPage,
              totalPages,
              totalItems: recordsTotal,
              pageSize: itemsPerPage,
              onPageChange: setCurrentPage
            }}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            actions={[
              {
                label: t("billing.editRecord") || "Edit Record",
                icon: <Pencil className="h-4 w-4" />,
                onClick: (record) => {
                  setSelectedRecordForEdit(record)
                  setEditDialogOpen(true)
                },
                disabled: (record) => record.isLocked || record.paymentStatus === 'paid',
                section: t("billing.recordManagement") || "Record Management"
              },
              {
                label: t("billing.markAsPaid"),
                icon: <CheckCircle2 className="h-4 w-4" />,
                onClick: (record) => handleMarkAsPaid(record.id),
                disabled: (record) => record.paymentStatus === 'paid',
                section: t("billing.payments") || "Payments"
              },
              {
                label: t("billing.addPartialPayment"),
                icon: <DollarSign className="h-4 w-4" />,
                onClick: (record) => {
                  setSelectedRecordForPartialPayment(record)
                  setPartialPaymentDialogOpen(true)
                },
                disabled: (record) => record.paymentStatus === 'paid' || (record.finalAmount - (record.paidAmount ?? 0)) <= 0,
                section: t("billing.payments") || "Payments"
              },
              {
                label: t("billing.paymentHistory"),
                icon: <DollarSign className="h-4 w-4" />,
                onClick: (record) => {
                  setSelectedRecordForHistory(record)
                  setPaymentHistoryDialogOpen(true)
                },
                section: t("billing.payments") || "Payments"
              },
              {
                label: t("billing.markBillAsSent"),
                icon: <Send className="h-4 w-4" />,
                onClick: (record) => handleStatusUpdate(record.id, 'sent'),
                disabled: (record) => record.billStatus === 'sent' || record.paymentStatus !== 'paid',
                section: t("billing.invoiceBill") || "Invoice/Bill"
              },
              {
                label: t("billing.markBillAsNotRequired"),
                icon: <X className="h-4 w-4" />,
                onClick: (record) => handleStatusUpdate(record.id, 'not_required'),
                disabled: (record) => record.billStatus === 'not_required',
                section: t("billing.invoiceBill") || "Invoice/Bill"
              }
            ]}
            emptyState={{
              message: t("billing.noRecordsFound")
            }}
            getRowId={(record) => record.id}
            loading={isLoadingTable}
            tableId={tableId}
          />
        )}

        <EditBillingRecordDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          record={selectedRecordForEdit}
          onSuccess={async () => {
            if (selectedRecordForEdit) {
              try {
                const updatedRecord = await api.billing.getById(selectedRecordForEdit.id)
                if (updatedRecord) {
                  const updatedRecords = records.map(r =>
                    r.id === selectedRecordForEdit.id ? updatedRecord : r
                  )
                  setRecords(updatedRecords)
                }
              } catch {
                await loadBillingData()
              }
            }
          }}
        />
        <PartialPaymentDialog
          open={partialPaymentDialogOpen}
          onOpenChange={setPartialPaymentDialogOpen}
          record={selectedRecordForPartialPayment}
          onSuccess={async () => {
            // Reload all data to ensure we have the latest state
            await loadBillingData()
          }}
        />
        <PaymentHistoryDialog
          open={paymentHistoryDialogOpen}
          onOpenChange={setPaymentHistoryDialogOpen}
          record={selectedRecordForHistory}
        />
      </div>
    </div>
  )
}
