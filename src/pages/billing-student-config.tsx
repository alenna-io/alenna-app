import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { EditScholarshipDialog } from "@/components/billing/edit-scholarship-dialog"
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
  type FilterField
} from "@/components/ui/generic-filters"
import { SubtleLoadingIndicator } from "@/components/ui/subtle-loading-indicator"
import { useDebounce } from "@/hooks/use-debounce"

/* ============================
   Types aligned with backend
============================ */

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

  taxableBillRequired: boolean
}

export default function BillingStudentConfigPage() {
  const api = useApi()
  const { t } = useTranslation()

  const tableId = "billing-student-config"

  const [rows, setRows] = React.useState<StudentBillingRow[]>([])
  const [totalItems, setTotalItems] = React.useState(0)

  const [isInitialLoading, setIsInitialLoading] = React.useState(true)
  const [isRefetching, setIsRefetching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedRow, setSelectedRow] = React.useState<StudentBillingRow | null>(null)

  const itemsPerPage = 10

  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
  const [searchTerm, setSearchTerm] = usePersistedState("searchTerm", "", tableId)
  const [filters, setFilters] = usePersistedState<Record<string, string>>("filters", {}, tableId)
  const [sortField, setSortField] = usePersistedState<string | null>("sortField", null, tableId)
  const [sortDirection, setSortDirection] = usePersistedState<"asc" | "desc">("sortDirection", "asc", tableId)

  const debouncedSearch = useDebounce(searchTerm, 400)
  const loadingRef = React.useRef(false)

  /* ============================
     Data loading
  ============================ */

  const loadData = React.useCallback(
    async (initial = false) => {
      if (loadingRef.current) return
      loadingRef.current = true

      try {
        initial ? setIsInitialLoading(true) : setIsRefetching(true)
        setError(null)

        const offset = (currentPage - 1) * itemsPerPage

        const result = await api.billing.getStudentsWithBillingConfig({
          search: debouncedSearch || undefined,
          tuitionTypeId: filters.tuitionType,
          hasScholarship: filters.hasScholarship,
          sortField: sortField || undefined,
          sortDirection,
          offset,
          limit: itemsPerPage
        })

        setRows(result.students)
        setTotalItems(result.total)

        const pages = Math.ceil(result.total / itemsPerPage)
        if (currentPage > pages && pages > 0) {
          setCurrentPage(pages)
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load billing configuration"

        setError(message)
        toast.error(message)
      } finally {
        setIsInitialLoading(false)
        setIsRefetching(false)
        loadingRef.current = false
      }
    },
    [debouncedSearch, filters, sortField, sortDirection, currentPage]
  )

  React.useEffect(() => {
    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!isInitialLoading) {
      loadData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, sortField, sortDirection, currentPage])

  /* ============================
     Helpers
  ============================ */

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(amount)

  /* ============================
     Actions
  ============================ */

  const handleEditScholarship = (row: StudentBillingRow) => {
    setSelectedRow(row)
    setEditDialogOpen(true)
  }

  /* ============================
     Filters
  ============================ */

  const filterFields: FilterField[] = [
    {
      key: "hasScholarship",
      label: t("billing.scholarshipColumn"),
      type: "select",
      options: [
        { value: "all", label: t("common.all") },
        { value: "yes", label: t("common.yes") },
        { value: "no", label: t("common.no") }
      ]
    }
  ]

  /* ============================
     Table definition
  ============================ */

  const columns: AlennaTableColumn<StudentBillingRow>[] = [
    {
      key: "name",
      label: t("billing.studentName"),
      sortable: true,
      render: row => <div className="font-medium">{row.fullName}</div>
    },
    {
      key: "tuitionType",
      label: t("billing.tuitionType"),
      render: row => row.tuitionTypeName || "—"
    },
    {
      key: "tuition",
      label: t("billing.tuition"),
      sortable: true,
      render: row => formatCurrency(row.tuitionAmount)
    },
    {
      key: "scholarship",
      label: t("billing.scholarshipColumn"),
      render: row => row.scholarshipDisplay
    },
    {
      key: "recurringCharges",
      label: t("billing.recurringCharges"),
      render: row => formatCurrency(row.recurringChargesTotal)
    },
    {
      key: "total",
      label: t("billing.total"),
      sortable: true,
      render: row => (
        <span className="font-semibold">
          {formatCurrency(row.totalAmount)}
        </span>
      )
    },
    {
      key: "taxable",
      label: t("billing.taxableBillRequired"),
      render: row => (row.taxableBillRequired ? t("common.yes") : t("common.no"))
    }
  ]

  const actions: AlennaTableAction<StudentBillingRow>[] = [
    {
      label: t("billing.edit"),
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditScholarship
    }
  ]

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  /* ============================
     Render
  ============================ */

  if (isInitialLoading) {
    return (
      <Loading
        variant="list-page"
        view="table"
        showCreateButton={false}
        showFilters={false}
      />
    )
  }

  if (error && rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-red-600">
          {error}
        </CardContent>
      </Card>
    )
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  return (
    <div className="space-y-6">
      <SubtleLoadingIndicator loading={isRefetching} />

      <PageHeader
        moduleKey="billing"
        title={t("billing.studentBillingConfiguration")}
        description={t("billing.studentBillingConfigurationDescription")}
      />

      <SearchBar
        placeholder={t("billing.searchPlaceholder")}
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value)
          setCurrentPage(1)
        }}
      />

      <GenericFilters
        fields={filterFields}
        filters={filters}
        onFiltersChange={newFilters => {
          setFilters(newFilters)
          setCurrentPage(1)
        }}
        totalItems={totalItems}
        filteredCount={rows.length}
      />

      <AlennaTable
        tableId={tableId}
        columns={columns}
        data={rows}
        actions={actions}
        getRowId={row => row.studentId}
        sortField={sortField || undefined}
        sortDirection={sortDirection}
        onSort={handleSort}
        refetching={isRefetching}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          pageSize: itemsPerPage,
          onPageChange: setCurrentPage
        }}
        emptyState={{ message: t("billing.noStudentsFound") }}
      />

      <EditScholarshipDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        student={
          selectedRow
            ? {
              id: selectedRow.studentId,
              fullName: selectedRow.fullName,
              email: selectedRow.email
            }
            : null
        }
        onSuccess={() => loadData(false)}
      />
    </div>
  )
}
