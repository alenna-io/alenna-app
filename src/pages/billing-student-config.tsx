import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Repeat, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
  AlennaTable,
  type AlennaTableColumn,
  type AlennaTableAction
} from "@/components/ui/alenna-table"
import { usePersistedState } from "@/hooks/use-table-state"
import { SearchBar } from "@/components/ui/search-bar"
import {
  GenericFilters,
  // type FilterField
} from "@/components/ui/generic-filters"
import { SubtleLoadingIndicator } from "@/components/ui/subtle-loading-indicator"
import { useDebounce } from "@/hooks/use-debounce"

import { EditScholarshipDialog } from "@/components/billing/edit-scholarship-dialog"
import { RecurringChargesDialog } from "@/components/billing/recurring-charges-dialog"

/* ============================ */

interface StudentBillingRow {
  studentId: string
  fullName: string
  email: string

  tuitionTypeId: string | null
  tuitionTypeName: string
  tuitionAmount: number

  scholarshipType: "percentage" | "fixed" | null
  scholarshipValue: number | null
  scholarshipDisplay: string

  recurringChargesTotal: number
  totalAmount: number

  requiresTaxableInvoice: boolean
}

// interface Filters {
//   name: string,
//   hasScholarship: boolean,
//   requiresTaxableInvoice: boolean,
// }

export default function BillingStudentConfigPage() {
  const api = useApi()
  const { t } = useTranslation()
  const tableId = "billing-student-config"

  const [rows, setRows] = React.useState<StudentBillingRow[]>([])
  const [totalItems, setTotalItems] = React.useState(0)
  const [isInitialLoading, setIsInitialLoading] = React.useState(true)
  const [isRefetching, setIsRefetching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [activeStudent, setActiveStudent] = React.useState<StudentBillingRow | null>(null)
  const [dialog, setDialog] = React.useState<"scholarship" | "charges" | "billing" | null>(null)

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
  const [searchTerm, setSearchTerm] = usePersistedState("searchTerm", "", tableId)
  const [filters, setFilters] = usePersistedState<Record<string, string>>("filters", {}, tableId)
  // const [sortField, setSortField] = usePersistedState<string | null>("sortField", null, tableId)
  // const [sortDirection, setSortDirection] = usePersistedState<"asc" | "desc">("sortDirection", "asc", tableId)

  const debouncedSearch = useDebounce(searchTerm, 400)

  // const buildFilterParams = React.useCallback((currentFilters: Filters) => {
  //   const params: {
  //     name?: string,
  //     hasScholarship?: boolean,
  //     requiresTaxableInvoice?: boolean,
  //   } = {}

  //   if (currentFilters.name) params.name = currentFilters.name
  //   if (currentFilters.hasScholarship) params.hasScholarship = currentFilters.hasScholarship
  //   if (currentFilters.requiresTaxableInvoice) params.requiresTaxableInvoice = currentFilters.requiresTaxableInvoice

  //   return params
  // }, [])

  const loadData = async (initial = false) => {
    try {
      if (initial) setIsInitialLoading(true); else setIsRefetching(true)

      // const filterParams = buildFilterParams(filters as Filters)
      const offset = (currentPage - 1) * itemsPerPage
      const result = await api.billing.getStudentsWithBillingConfig({
        search: debouncedSearch || undefined,
        tuitionTypeId: filters.tuitionType,
        hasScholarship: filters.hasScholarship,
        // sortField: sortField || undefined,
        // sortDirection,
        offset,
        limit: itemsPerPage
      })

      setRows(result.students)
      setTotalItems(result.total)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load data"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsInitialLoading(false)
      setIsRefetching(false)
    }
  }

  React.useEffect(() => {
    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!isInitialLoading) loadData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, currentPage])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  const columns: AlennaTableColumn<StudentBillingRow>[] = [
    { key: "name", label: t("billing.studentName"), render: r => <b>{r.fullName}</b> },
    { key: "tuitionType", label: t("billing.tuitionType"), render: r => r.tuitionTypeName || "—" },
    { key: "tuition", label: t("billing.tuition"), render: r => formatCurrency(r.tuitionAmount) },
    { key: "scholarship", label: t("billing.scholarshipColumn"), render: r => r.scholarshipDisplay },
    { key: "recurring", label: t("billing.recurringCharges"), render: r => formatCurrency(r.recurringChargesTotal) },
    { key: "total", label: t("billing.total"), render: r => <span className="font-semibold">{formatCurrency(r.totalAmount)}</span> },
    {
      key: "taxable", label: t("billing.requiresTaxableInvoice"), render: r => (
        <Badge variant={r.requiresTaxableInvoice ? "status-active" : "status-inactive"}>
          {r.requiresTaxableInvoice ? t("common.yes") : t("common.no")}
        </Badge>
      )
    }
  ]

  const actions: AlennaTableAction<StudentBillingRow>[] = [
    {
      label: t("billing.editScholarship"),
      icon: <Edit className="h-4 w-4" />,
      onClick: row => { setActiveStudent(row); setDialog("scholarship") }
    },
    {
      label: t("billing.recurringCharges"),
      icon: <Repeat className="h-4 w-4" />,
      onClick: row => { setActiveStudent(row); setDialog("charges") }
    },
    {
      label: row => row.requiresTaxableInvoice ? t("billing.noRequiresTaxableInvoice") : t("billing.requiresTaxableInvoice"),
      icon: <FileText className="h-4 w-4" />,
      onClick: async row => {
        try {
          await api.billing.updateStudentBillingConfig(row.studentId, {
            studentId: row.studentId,
            requiresTaxableInvoice: !row.requiresTaxableInvoice,
          })

          toast.success(t("billing.invoicePreferenceUpdated"))
          loadData(false)
        } catch {
          toast.error(t("billing.failedToUpdateInvoicePreference"))
        }
      },
    }

  ]

  if (isInitialLoading) return <Loading variant="list-page" view="table" />

  if (error && rows.length === 0) {
    return <Card><CardContent className="text-red-600">{error}</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <SubtleLoadingIndicator loading={isRefetching} />
      <PageHeader title={t("billing.studentBillingConfiguration")} />
      <SearchBar placeholder='' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <GenericFilters filters={filters} onFiltersChange={setFilters} totalItems={totalItems} filteredCount={rows.length} fields={[]} getActiveFilterLabels={() => []} />
      <AlennaTable
        tableId={tableId}
        columns={columns}
        data={rows}
        actions={actions}
        getRowId={r => r.studentId}
        pagination={{ currentPage, totalPages: Math.ceil(totalItems / itemsPerPage), totalItems, pageSize: itemsPerPage, onPageChange: setCurrentPage }}
      />

      <EditScholarshipDialog
        open={dialog === "scholarship"}
        student={activeStudent}
        onClose={() => setDialog(null)}
        onSuccess={() => loadData(false)}
      />

      <RecurringChargesDialog
        open={dialog === "charges"}
        studentId={activeStudent?.studentId ?? null}
        onClose={() => setDialog(null)}
        onSuccess={() => loadData(false)}
      />
    </div>
  )
}
