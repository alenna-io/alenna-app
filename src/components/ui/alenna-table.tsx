import * as React from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlennaSkeleton } from "@/components/ui/alenna-skeleton"
import { PremiumActionMenu } from "@/components/ui/premium-action-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, ChevronsUpDown, Columns } from "lucide-react"
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
  section?: string
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
    icon?: React.ReactNode | null
    title?: string | null
    message?: string | null
    action?: React.ReactNode
  }
  onRowClick?: (item: T) => void
  sortField?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string) => void
  getRowId?: (item: T) => string
  tableId?: string
  enableColumnSelector?: boolean
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
  getRowId,
  tableId,
  enableColumnSelector = true
}: AlennaTableProps<T>) {
  const { t } = useTranslation()

  const getStorageKey = () => {
    return tableId ? `alenna-table-columns-${tableId}` : null
  }

  const getInitialVisibility = (): Record<string, boolean> => {
    if (!enableColumnSelector) {
      return {}
    }

    const storageKey = getStorageKey()
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          return JSON.parse(stored)
        }
      } catch (error) {
        console.error("Error loading column visibility from storage:", error)
      }
    }

    const initial: Record<string, boolean> = {}
    columns.forEach((col) => {
      initial[col.key] = true
    })
    return initial
  }

  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(getInitialVisibility)
  const [columnSelectorOpen, setColumnSelectorOpen] = React.useState(false)

  React.useEffect(() => {
    if (!enableColumnSelector) return

    setColumnVisibility((prev) => {
      const updated = { ...prev }
      let hasChanges = false

      columns.forEach((col) => {
        if (!(col.key in updated)) {
          updated[col.key] = true
          hasChanges = true
        }
      })

      return hasChanges ? updated : prev
    })
  }, [columns, enableColumnSelector])

  React.useEffect(() => {
    if (!enableColumnSelector) return

    const storageKey = tableId ? `alenna-table-columns-${tableId}` : null
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(columnVisibility))
      } catch (error) {
        console.error("Error saving column visibility to storage:", error)
      }
    }
  }, [columnVisibility, tableId, enableColumnSelector])

  const handleToggleColumn = (columnKey: string, checked: boolean) => {
    setColumnVisibility((prev) => {
      const newVisibility = { ...prev, [columnKey]: checked }
      const visibleCount = Object.values(newVisibility).filter(Boolean).length

      if (visibleCount === 0) {
        return prev
      }

      return newVisibility
    })
  }

  const visibleColumns = React.useMemo(() => {
    if (!enableColumnSelector) {
      return columns
    }

    return columns.filter((col) => {
      return columnVisibility[col.key] !== false
    })
  }, [columns, columnVisibility, enableColumnSelector])

  const hasActions = actions && actions.length > 0
  const displayColumns = hasActions ? [...visibleColumns, { key: 'actions', label: '' }] : visibleColumns

  const getSortIcon = (columnKey: string) => {
    if (!onSort) {
      return null
    }

    if (sortField === columnKey) {
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

    return (
      <ChevronsUpDown
        className="h-3 w-3 ml-1 text-muted-foreground opacity-40"
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
    const isSortable = (typedColumn.sortable !== false) && onSort

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
            onClick={() => onSort && onSort(typedColumn.key)}
            className="inline-flex items-center text-[0.8rem] font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-left"
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
      disabled: action.disabled ? action.disabled(item) : false,
      section: action.section
    })) || []

    return (
      <tr
        key={rowId}
        className={cn(
          "border-b transition-colors duration-200 text-[0.8rem]",
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

  const renderColumnSelector = () => {
    if (!enableColumnSelector) {
      return null
    }

    const visibleCount = Object.values(columnVisibility).filter(Boolean).length
    const allVisible = visibleCount === columns.length

    const handleSelectAll = () => {
      const newVisibility: Record<string, boolean> = {}
      columns.forEach((col) => {
        newVisibility[col.key] = true
      })
      setColumnVisibility(newVisibility)
    }

    const handleDeselectAll = () => {
      if (columns.length <= 1) return

      const newVisibility: Record<string, boolean> = {}
      columns.forEach((col, index) => {
        newVisibility[col.key] = index === 0
      })
      setColumnVisibility(newVisibility)
    }

    return (
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/30">
        <DropdownMenu open={columnSelectorOpen} onOpenChange={setColumnSelectorOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Columns className="h-4 w-4 mr-2" />
              {t("common.columns") || "Columns"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {t("common.toggleColumns") || "Toggle Columns"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                if (allVisible) {
                  handleDeselectAll()
                } else {
                  handleSelectAll()
                }
              }}
              className="cursor-pointer"
            >
              {allVisible
                ? (t("common.deselectAll") || "Deselect All")
                : (t("common.selectAll") || "Select All")
              }
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {columns.map((column) => {
              const isVisible = columnVisibility[column.key] !== false
              const label = typeof column.label === 'string' ? column.label : column.key

              return (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={isVisible}
                  onCheckedChange={(checked) => handleToggleColumn(column.key, checked)}
                  onSelect={(e) => {
                    e.preventDefault()
                  }}
                  disabled={isVisible && visibleCount === 1}
                  className="cursor-pointer"
                >
                  {label}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  if (!loading && data.length === 0) {
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

    const defaultTitle = t("common.noResultsFound")
    const defaultMessage = t("common.noResultsMessage")

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
        {emptyState?.icon !== undefined ? emptyState.icon : defaultIcon}
        {(emptyState?.title !== undefined ? emptyState.title : defaultTitle) && (
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {emptyState?.title !== undefined ? emptyState.title : defaultTitle}
          </h3>
        )}
        {(emptyState?.message !== undefined ? emptyState.message : defaultMessage) && (
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            {emptyState?.message !== undefined ? emptyState.message : defaultMessage}
          </p>
        )}
        {emptyState?.action && <div>{emptyState.action}</div>}
      </div>
    )
  }

  return (
    <Card className="rounded-md border border-border/50 shadow-sm">
      {enableColumnSelector && renderColumnSelector()}
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

