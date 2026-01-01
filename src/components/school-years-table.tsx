import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, Edit, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { SchoolYear } from "@/services/api"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface SchoolYearsTableProps {
  schoolYears: SchoolYear[]
  onEdit?: (year: SchoolYear) => void
  onDelete?: (year: SchoolYear) => void
  onSetActive?: (id: string) => void
  canEdit?: boolean
  canDelete?: boolean
  currentPage?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
}

function formatDateString(dateString: string): string {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })
}

export function SchoolYearsTable({
  schoolYears,
  onEdit,
  onDelete,
  onSetActive,
  canEdit = false,
  canDelete = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: SchoolYearsTableProps) {
  const { t } = useTranslation()

  const columns: AlennaTableColumn<SchoolYear>[] = [
    {
      key: 'name',
      label: 'Año Escolar',
      render: (year) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{year.name}</span>
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Fechas',
      render: (year) => (
        <div className="text-sm text-muted-foreground">
          {formatDateString(year.startDate)} - {formatDateString(year.endDate)}
        </div>
      )
    },
    {
      key: 'quarters',
      label: 'Trimestres',
      render: (year) => (
        <div className="text-sm">
          {year.quarters?.length || 0} {year.quarters?.length === 1 ? 'trimestre' : 'trimestres'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (year) => (
        <div>
          {year.isActive ? (
            <Badge variant="status-active">
              {t("schools.active")}
            </Badge>
          ) : (
            <Badge variant="status-inactive">{t("schools.inactive")}</Badge>
          )}
        </div>
      )
    }
  ]

  const actions: AlennaTableAction<SchoolYear>[] = []
  
  if (onSetActive) {
    actions.push({
      label: 'Activar',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (year) => onSetActive(year.id),
      disabled: (year) => year.isActive
    })
  }

  if (canEdit && onEdit) {
    actions.push({
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit
    })
  }

  if (canDelete && onDelete) {
    actions.push({
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive',
      disabled: (year) => year.isActive
    })
  }

  return (
    <AlennaTable
      columns={columns}
      data={schoolYears}
      actions={actions}
      pagination={
        currentPage && totalPages !== undefined && totalItems !== undefined && onPageChange
          ? {
              currentPage,
              totalPages,
              totalItems,
              pageSize: 10,
              onPageChange
            }
          : undefined
      }
      emptyState={{
        icon: <Calendar className="h-12 w-12 text-muted-foreground" />,
        title: "No hay años escolares configurados",
        message: "Crea el primer año escolar para comenzar"
      }}
      getRowId={(year) => year.id}
    />
  )
}

