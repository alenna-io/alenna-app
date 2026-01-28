import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/string-utils"
import { BookOpen, Eye, Trash2 } from "lucide-react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface ProjectionWithStudent {
  id: string
  studentId: string
  schoolYear: string
  isActive: boolean
  totalPaces: number
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
  tableId?: string
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
  onPageChange,
  tableId
}: ProjectionsTableProps) {
  const { t } = useTranslation()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [projectionToDelete, setProjectionToDelete] = React.useState<ProjectionWithStudent | null>(null)

  const columns: AlennaTableColumn<ProjectionWithStudent>[] = [
    {
      key: 'firstName',
      label: t("common.name"),
      sortable: true,
      render: (projection) => (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarFallback className="text-sm font-semibold bg-primary-soft text-primary">
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
    },
    {
      key: 'lastName',
      label: t("common.lastName"),
      sortable: true,
      render: (projection) => (
        <div className="text-sm text-foreground">
          {projection.student.lastName}
        </div>
      )
    },
    {
      key: 'status',
      label: t("projections.status"),
      render: (projection) => (
        <Badge
          variant={projection.isActive ? "default" : "secondary"}
          className="font-medium"
        >
          {projection.isActive ? t("projections.active") : t("projections.inactive")}
        </Badge>
      )
    },
    {
      key: 'totalPaces',
      label: t("projections.totalPaces"),
      render: (projection) => (
        <div className="text-sm text-foreground">
          {projection.totalPaces}
        </div>
      )
    }
  ]

  const actions: AlennaTableAction<ProjectionWithStudent>[] = [
    {
      label: t("common.view"),
      icon: <Eye className="h-4 w-4" />,
      onClick: onProjectionSelect
    }
  ]

  if (onProjectionDelete) {
    actions.push({
      label: t("common.delete"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (projection) => {
        setProjectionToDelete(projection)
        setDeleteConfirmOpen(true)
      },
      variant: 'destructive'
    })
  }

  return (
    <>
      <AlennaTable
        columns={columns}
        data={projections}
        actions={actions}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          pageSize: 10,
          onPageChange
        }}
        emptyState={{
          icon: <BookOpen className="h-12 w-12 text-muted-foreground" />,
          message: t("projections.noProjectionsFound")
        }}
        onRowClick={onProjectionSelect}
        sortField={sortField || undefined}
        sortDirection={sortDirection}
        onSort={(field) => {
          if (field === 'firstName' || field === 'lastName') {
            onSort(field)
          }
        }}
        getRowId={(projection) => projection.id}
        tableId={tableId}
      />

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
    </>
  )
}

