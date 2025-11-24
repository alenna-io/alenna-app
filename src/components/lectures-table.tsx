import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

interface PaceCatalogItem {
  id: string
  code: string
  name: string
  subSubjectName: string
  subSubjectId: string
  categoryName: string
  levelId: string
  difficulty?: string
}

interface LecturesTableProps {
  lectures: PaceCatalogItem[]
  sortField: "code" | "name" | "category" | "subject" | "level" | null
  sortDirection: "asc" | "desc"
  onSort: (field: "code" | "name" | "category" | "subject" | "level") => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

interface ColumnConfig {
  key: string
  label: string
  sortable: boolean
}

export function LecturesTable({
  lectures,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: LecturesTableProps) {
  const { t } = useTranslation()

  const COLUMNS: ColumnConfig[] = [
    { key: 'name', label: t("lectures.name") || "Name", sortable: true },
    { key: 'code', label: t("lectures.code") || "Code", sortable: true },
    { key: 'category', label: t("lectures.category") || "Category", sortable: true },
    { key: 'subject', label: t("lectures.subject") || "Subject", sortable: true },
    { key: 'level', label: t("lectures.level") || "Level", sortable: true },
  ]

  const getSortIcon = (field: "code" | "name" | "category" | "subject" | "level") => {
    const isActive = sortField === field

    return (
      <ChevronsUpDown
        className={`h-3 w-3 ml-1 transition-all ${isActive
          ? sortDirection === "asc"
            ? "text-primary -translate-y-px"
            : "text-primary translate-y-px"
          : "text-muted-foreground/70"
          }`}
      />
    )
  }

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 text-sm"

  const renderColumnHeader = (column: ColumnConfig) => {
    if (column.sortable) {
      return (
        <button
          type="button"
          onClick={() => onSort(column.key as "code" | "name" | "category" | "subject" | "level")}
          className="inline-flex items-center text-sm font-semibold text-foreground hover:text-primary cursor-pointer"
        >
          {column.label}
          {getSortIcon(column.key as "code" | "name" | "category" | "subject" | "level")}
        </button>
      )
    }
    return column.label
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {t("lectures.title") || "Lectures"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {COLUMNS.map((column) => (
                  <th key={column.key} className={thClass}>
                    {renderColumnHeader(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lectures.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                    {t("lectures.noLecturesFound") || "No lectures found"}
                  </td>
                </tr>
              ) : (
                lectures.map((lecture) => (
                  <tr
                    key={lecture.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className={tdClass}>
                      {lecture.name}
                    </td>
                    <td className={tdClass}>
                      {lecture.code}
                    </td>
                    <td className={tdClass}>
                      {lecture.categoryName}
                    </td>
                    <td className={tdClass}>
                      {lecture.subSubjectName}
                    </td>
                    <td className={tdClass}>
                      <Badge variant="secondary">
                        {lecture.levelId}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? (
            t("common.showing", { start: startItem, end: endItem, total: totalItems })
          ) : (
            t("common.noResults") || "No results"
          )}
        </div>
        {totalPages > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalPages <= 1}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
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
                  return <span key={page} className="px-2">...</span>
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

