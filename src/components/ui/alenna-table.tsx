import * as React from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlennaSkeleton } from "@/components/ui/alenna-skeleton"
import { PremiumActionMenu } from "@/components/ui/premium-action-menu"
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export interface AlennaTableColumn<T> {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface AlennaTableAction<T> {
  label: string
  icon?: React.ReactNode
  onClick: (item: T) => void
  variant?: 'default' | 'destructive'
  disabled?: (item: T) => boolean
}

export interface AlennaTableProps<T> {
  columns: AlennaTableColumn<T>[]
  data: T[]
  actions?: AlennaTableAction<T>[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize?: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (size: number) => void
  }
  loading?: boolean
  emptyState?: {
    icon?: React.ReactNode
    title?: string
    message?: string
    action?: React.ReactNode
  }
  onRowClick?: (item: T) => void
  sortField?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string) => void
  getRowId?: (item: T) => string
}

export function AlennaTable<T>({
  columns,
  data,
  actions,
  pagination,
  loading = false,
  emptyState,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  getRowId
}: AlennaTableProps<T>) {
  const { t } = useTranslation()

  const hasActions = actions && actions.length > 0
  const displayColumns = hasActions ? [...columns, { key: 'actions', label: '' }] : columns

  const getSortIcon = (columnKey: string) => {
    if (!onSort || sortField !== columnKey) {
      return null
    }

    return (
      <ChevronsUpDown
        className={cn(
          "h-3 w-3 ml-1 transition-all",
          sortDirection === "asc"
            ? "text-primary -translate-y-px"
            : "text-primary translate-y-px"
        )}
      />
    )
  }

  const renderCell = (column: AlennaTableColumn<T>, item: T) => {
    if (column.render) {
      return column.render(item)
    }
    return null
  }

  const renderHeader = (column: AlennaTableColumn<T> | { key: string; label: string | React.ReactNode }) => {
    if (column.key === 'actions') {
      return <th key={column.key} className="h-14 px-4 text-right align-middle w-16" />
    }

    const typedColumn = column as AlennaTableColumn<T>
    const isSortable = typedColumn.sortable && onSort

    if (isSortable) {
      return (
        <th
          key={typedColumn.key}
          className={cn(
            "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm",
            typedColumn.className
          )}
        >
          <button
            type="button"
            onClick={() => onSort(typedColumn.key)}
            className="inline-flex items-center text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {typedColumn.label}
            {getSortIcon(typedColumn.key)}
          </button>
        </th>
      )
    }

    return (
      <th
        key={typedColumn.key}
        className={cn(
          "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm",
          typedColumn.className
        )}
      >
        {typedColumn.label}
      </th>
    )
  }

  const renderRow = (item: T, index: number) => {
    const rowId = getRowId ? getRowId(item) : `row-${index}`
    const actionItems = actions?.map(action => ({
      label: action.label,
      icon: action.icon,
      onClick: () => action.onClick(item),
      variant: action.variant,
      disabled: action.disabled ? action.disabled(item) : false
    })) || []

    return (
      <tr
        key={rowId}
        className={cn(
          "border-b transition-colors duration-200",
          onRowClick && "cursor-pointer",
          "hover:bg-muted/30 group"
        )}
        onClick={() => onRowClick && onRowClick(item)}
      >
        {displayColumns.map((column) => {
          if (column.key === 'actions') {
            return (
              <td
                key="actions"
                className="p-4 align-middle w-16 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                {hasActions && (
                  <PremiumActionMenu items={actionItems} />
                )}
              </td>
            )
          }

          const typedColumn = column as AlennaTableColumn<T>
          return (
            <td
              key={typedColumn.key}
              className={cn(
                "p-4 align-middle first:px-6 first:py-3 text-sm",
                typedColumn.className
              )}
            >
              {renderCell(typedColumn, item)}
            </td>
          )
        })}
      </tr>
    )
  }

  const renderSkeletonRow = () => {
    return (
      <tr>
        {displayColumns.map((column) => (
          <td key={column.key} className="p-4 align-middle first:px-6 first:py-3">
            <AlennaSkeleton height="20px" width="80%" variant="text" />
          </td>
        ))}
      </tr>
    )
  }

  const renderEmptyState = () => {
    const defaultIcon = (
      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    )

    return (
      <tr>
        <td colSpan={displayColumns.length} className="p-12 text-center">
          {emptyState?.icon || defaultIcon}
          {emptyState?.title && (
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {emptyState.title}
            </h3>
          )}
          {emptyState?.message && (
            <p className="text-sm text-muted-foreground mb-4">
              {emptyState.message}
            </p>
          )}
          {emptyState?.action && <div>{emptyState.action}</div>}
        </td>
      </tr>
    )
  }

  const [goToPageValue, setGoToPageValue] = React.useState<string>("")

  const renderPagination = () => {
    if (!pagination) {
      return null
    }

    const { currentPage, totalPages, totalItems, onPageChange } = pagination
    const startItem = (currentPage - 1) * (pagination.pageSize || 10) + 1
    const endItem = Math.min(currentPage * (pagination.pageSize || 10), totalItems)

    const handleGoToPage = () => {
      const page = parseInt(goToPageValue)
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page)
        setGoToPageValue("")
      }
    }

    const handleGoToPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleGoToPage()
      }
    }

    return (
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          {t("common.showing", { start: startItem, end: endItem, total: totalItems })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalPages <= 1}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="min-w-10 cursor-pointer"
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-muted-foreground">...</span>
              }
              return null
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages <= 1}
            className="cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {totalPages > 5 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">Go to:</span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageValue}
                onChange={(e) => setGoToPageValue(e.target.value)}
                onKeyDown={handleGoToPageKeyDown}
                placeholder={currentPage.toString()}
                className="w-16 h-8 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToPage}
                disabled={!goToPageValue || parseInt(goToPageValue) < 1 || parseInt(goToPageValue) > totalPages}
                className="cursor-pointer"
              >
                Go
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    )
  }

  return (
    <Card className="rounded-md border border-border/50 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {displayColumns.map((column) => renderHeader(column))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <React.Fragment key={`skeleton-${index}`}>
                    {renderSkeletonRow()}
                  </React.Fragment>
                ))
              ) : data.length === 0 ? (
                renderEmptyState()
              ) : (
                data.map((item, index) => renderRow(item, index))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      {!loading && data.length > 0 && renderPagination()}
    </Card>
  )
}

