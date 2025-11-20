import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
import { BookOpen, ChevronsUpDown, ChevronLeft, MoreVertical, Eye, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useTranslation } from "react-i18next"

interface ProjectionWithStudent {
  id: string
  studentId: string
  schoolYear: string
  startDate: string
  endDate: string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    name: string
  }
}

interface ProjectionsTableProps {
  projections: ProjectionWithStudent[]
  onProjectionSelect: (projection: ProjectionWithStudent) => void
  onProjectionDelete?: (projection: ProjectionWithStudent) => Promise<void>
  sortField: "firstName" | "lastName" | null
  sortDirection: "asc" | "desc"
  onSort: (field: "firstName" | "lastName") => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
}

export function ProjectionsTable({
  projections,
  onProjectionSelect,
  onProjectionDelete,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: ProjectionsTableProps) {
  const { t } = useTranslation()

  const COLUMNS: ColumnConfig[] = [
    { key: 'firstName', label: t("common.name"), sortable: true },
    { key: 'lastName', label: t("common.lastName"), sortable: true },
    { key: 'status', label: t("projections.status"), sortable: false },
    { key: 'actions', label: '', sortable: false },
  ]
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [projectionToDelete, setProjectionToDelete] = React.useState<ProjectionWithStudent | null>(null)

  const getSortIcon = (field: "firstName" | "lastName") => {
    const isActive = sortField === field

    return (
      <ChevronsUpDown
        className={`h-3 w-3 ml-1 transition-all ${isActive
          ? sortDirection === "asc"
            ? "text-primary -translate-y-[1px]"
            : "text-primary translate-y-[1px]"
          : "text-muted-foreground/70"
          }`}
      />
    )
  }

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  const renderColumnHeader = (column: ColumnConfig) => {
    if (column.key === 'firstName' || column.key === 'lastName') {
      const field = column.key === 'firstName' ? "firstName" : "lastName"
      return (
        <button
          type="button"
          onClick={() => onSort(field)}
          className="inline-flex items-center text-sm font-semibold text-foreground hover:text-primary"
        >
          {column.label}
          {getSortIcon(field)}
        </button>
      )
    }

    return column.label
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {t("projections.title")}
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
              {projections.map((projection) => {
                const renderCell = (columnKey: string) => {
                  switch (columnKey) {
                    case 'firstName':
                      return (
                        <div className="flex items-center gap-4">
                          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                            <AvatarFallback className="text-sm font-semibold">
                              {getInitials(projection.student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                              {projection.student.firstName}
                            </div>
                          </div>
                        </div>
                      )
                    case 'lastName':
                      return (
                        <div className="text-sm text-foreground">
                          {projection.student.lastName}
                        </div>
                      )
                    case 'status':
                      return (
                        <Badge
                          variant={projection.isActive ? "default" : "secondary"}
                          className="font-medium"
                        >
                          {projection.isActive ? t("projections.active") : t("projections.inactive")}
                        </Badge>
                      )
                    case 'actions':
                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              className="h-8 w-8 p-0 cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onProjectionSelect(projection)
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("common.view")}
                            </DropdownMenuItem>
                            {onProjectionDelete && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProjectionToDelete(projection)
                                  setDeleteConfirmOpen(true)
                                }}
                                className="text-red-600 focus:text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    default:
                      return null
                  }
                }

                return (
                  <tr
                    key={projection.id}
                    className="border-b transition-all duration-200 hover:bg-muted/30 cursor-pointer group"
                    onClick={() => onProjectionSelect(projection)}
                  >
                    {COLUMNS.map((column) => (
                      <td key={column.key} className={tdClass}>
                        {renderCell(column.key)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {projections.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("projections.noProjectionsFound")}</p>
          </div>
        )}
      </CardContent>

      {/* Pagination - Always show */}
      <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          Mostrando {startItem} - {endItem} de {totalItems} resultados
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
                    className="min-w-[2.5rem] cursor-pointer"
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
          <LinkButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages <= 1}
          >
            {<></>}
          </LinkButton>
        </div>
      </CardFooter>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("projections.deleteProjection")}
        message={projectionToDelete ? t("projections.deleteConfirm", { name: projectionToDelete.student.name }) : ""}
        confirmText={t("common.deleteAction")}
        cancelText={t("common.cancel")}
        onConfirm={async () => {
          if (projectionToDelete && onProjectionDelete) {
            await onProjectionDelete(projectionToDelete)
            setDeleteConfirmOpen(false)
            setProjectionToDelete(null)
          }
        }}
        variant="destructive"
      />
    </Card>
  )
}

