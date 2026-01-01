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

interface Filters extends Record<string, string> {
  month: string
  name: string
  paymentStatus: string
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
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = React.useState(false)
  const [selectedRecordForPartialPayment, setSelectedRecordForPartialPayment] = React.useState<BillingRecord | null>(null)
  const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = React.useState(false)
  const [selectedRecordForHistory, setSelectedRecordForHistory] = React.useState<BillingRecord | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedRecordForEdit, setSelectedRecordForEdit] = React.useState<BillingRecord | null>(null)
  const [updatingAllRecords, setUpdatingAllRecords] = React.useState(false)

  // Sorting
  const [sortField, setSortField] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  // Filters
  const [filters, setFilters] = React.useState<Filters>({
    month: "all",
    name: "all",
    paymentStatus: "all",
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
            const hasPendingLateFee = isOverdue && !record.isPaid && record.billStatus !== 'not_required' && record.lateFeeAmount === 0

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

            // Count total income: sum of paidAmount for all records (includes partial payments)
            const paidAmt = record.paidAmount ?? 0
            totalIncome += paidAmt

            // Count paid students (fully paid only)
            if (record.paymentStatus === 'paid') {
              paidStudentIds.add(record.studentId)
            }

            // Count expected income: sum of finalAmount for all records
            expectedIncome += totalFinalAmount

            // Count unpaid students (pending, delayed, or partial payment)
            if (['pending', 'delayed', 'partial_payment'].includes(record.paymentStatus)) {
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

      // Automatically mark overdue records as delayed and apply late fees
      // This is handled by the backend job, but we trigger it here for immediate updates
      if (recordsData && config && Array.isArray(recordsData)) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueBills = recordsData.filter((record: BillingRecord) => {
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
            const updatedRecords = await api.billing.getAll()
            setRecords(updatedRecords || [])
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
      loadingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

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

  const getMonthName = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')}/${year}`
  }

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

  const handleBulkUpdateBills = async () => {
    try {
      setUpdatingAllRecords(true)
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      const schoolYearId = records[0]?.schoolYearId || ""

      if (!schoolYearId) {
        toast.error("No active school year found.")
        return
      }

      // Check if there are any records for the current month that are not paid/locked
      const currentMonthRecords = records.filter(r =>
        r.billingMonth === currentMonth &&
        r.billingYear === currentYear &&
        r.paymentStatus !== 'paid' &&
        !r.isLocked
      )

      if (currentMonthRecords.length === 0) {
        toast.error(t("billing.noRecordsToUpdate") || "No records available to update for the current month. All records are either paid or locked.")
        return
      }

      const result = await api.billing.bulkUpdate({
        schoolYearId,
        billingMonth: currentMonth,
        billingYear: currentYear,
      })

      toast.success(t("billing.recordsUpdated", { updated: result.updated, skipped: result.skipped }) || `Updated ${result.updated} record(s). ${result.skipped} skipped.`)
      await loadData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("billing.failedToUpdateRecords") || "Failed to update records"
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

  // Filter records
  const filteredRecords = React.useMemo(() => {
    let filtered = records.filter((record) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesName = record.studentName?.toLowerCase().includes(searchLower)
        const matchesMonth = getMonthName(record.billingMonth, record.billingYear).toLowerCase().includes(searchLower)
        if (!matchesName && !matchesMonth) return false
      }

      // Other filters
      if (filters.month !== "all" && `${record.billingMonth}/${record.billingYear}` !== filters.month) return false
      if (filters.name !== "all" && record.studentId !== filters.name) return false
      if (filters.paymentStatus !== "all" && record.paymentStatus !== filters.paymentStatus) return false
      return true
    })

    // Sort records
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number | Date
        let bValue: string | number | Date

        switch (sortField) {
          case 'studentName':
            aValue = (a.studentName || '').toLowerCase()
            bValue = (b.studentName || '').toLowerCase()
            break
          case 'month':
            {
              // Sort by year first, then month
              if (a.billingYear !== b.billingYear) {
                return sortDirection === 'asc'
                  ? a.billingYear - b.billingYear
                  : b.billingYear - a.billingYear
              }
              return sortDirection === 'asc'
                ? a.billingMonth - b.billingMonth
                : b.billingMonth - a.billingMonth
            }
          case 'tuition':
            aValue = Number(a.effectiveTuitionAmount) - Number(a.scholarshipAmount)
            bValue = Number(b.effectiveTuitionAmount) - Number(b.scholarshipAmount)
            break
          case 'lateFee':
            aValue = Number(a.lateFeeAmount)
            bValue = Number(b.lateFeeAmount)
            break
          case 'total':
            {
              const aDiscountAmount = a.discountAdjustments.reduce((sum, adj) => {
                if (adj.type === 'percentage') {
                  return sum + (Number(a.effectiveTuitionAmount) - Number(a.scholarshipAmount)) * (adj.value / 100)
                }
                return sum + adj.value
              }, 0)
              const aExtraAmount = a.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
              aValue = Number(a.effectiveTuitionAmount) - Number(a.scholarshipAmount) - aDiscountAmount + aExtraAmount + Number(a.lateFeeAmount)

              const bDiscountAmount = b.discountAdjustments.reduce((sum, adj) => {
                if (adj.type === 'percentage') {
                  return sum + (Number(b.effectiveTuitionAmount) - Number(b.scholarshipAmount)) * (adj.value / 100)
                }
                return sum + adj.value
              }, 0)
              const bExtraAmount = b.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
              bValue = Number(b.effectiveTuitionAmount) - Number(b.scholarshipAmount) - bDiscountAmount + bExtraAmount + Number(b.lateFeeAmount)
            }
            break
          case 'paymentStatus':
            aValue = a.paymentStatus.toLowerCase()
            bValue = b.paymentStatus.toLowerCase()
            break
          case 'dueDate':
            aValue = new Date(a.dueDate)
            bValue = new Date(b.dueDate)
            break
          case 'paidDate':
            aValue = a.paidAt ? new Date(a.paidAt) : new Date(0)
            bValue = b.paidAt ? new Date(b.paidAt) : new Date(0)
            break
          case 'billStatus':
            aValue = a.billStatus.toLowerCase()
            bValue = b.billStatus.toLowerCase()
            break
          default:
            return 0
        }


        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime()
        }

        const comparison = String(aValue).localeCompare(String(bValue))
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [records, searchTerm, filters, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRecords, currentPage, itemsPerPage])

  // Reset to page 1 when filters/sort change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters.month, filters.name, filters.paymentStatus, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

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
            label: getMonthName(m, y),
          }
        }),
      ],
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

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.month && currentFilters.month !== "all") {
      const [m, y] = currentFilters.month.split('/').map(Number)
      labels.push(`${t("billing.month") || "Mes"}: ${getMonthName(m, y)}`)
    }
    if (currentFilters.name && currentFilters.name !== "all") {
      const student = students.find((s) => s.id === currentFilters.name)
      if (student) {
        labels.push(`${t("billing.studentName") || "Nombre"}: ${student.firstName} ${student.lastName}`)
      }
    }
    if (currentFilters.paymentStatus && currentFilters.paymentStatus !== "all") {
      const statusLabel = currentFilters.paymentStatus === 'pending'
        ? t("billing.paymentStatus.pending") || "Pendiente"
        : currentFilters.paymentStatus === 'delayed'
          ? t("billing.paymentStatus.delayed") || "Atrasado"
          : currentFilters.paymentStatus === 'partial_payment'
            ? t("billing.paymentStatus.partialPayment") || "Pago Parcial"
            : t("billing.paymentStatus.paid") || "Pagado"
      labels.push(`${t("billing.paymentStatusLabel") || "Estado de Pago"}: ${statusLabel}`)
    }
    return labels
  }

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

        {/* Search and Filters */}
        <AlennaSkeleton height={40} width="100%" className="rounded-md" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <AlennaSkeleton key={i} height={32} width={120} className="rounded-full" />
          ))}
        </div>

        {/* Table */}
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
          filters={filters}
          onFiltersChange={setFilters}
          totalItems={records.length}
          filteredCount={filteredRecords.length}
          fields={filterFields}
          getActiveFilterLabels={getActiveFilterLabels}
        />

        {/* Billing Records Table */}
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
            totalItems: filteredRecords.length,
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
        />

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
                await loadData()
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
            await loadData()
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
