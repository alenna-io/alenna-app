import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Eye, Edit, Trash2, Power, PowerOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/ui/status-badge"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  teacherLimit?: number
  userLimit?: number
  isActive?: boolean
}

interface SchoolsTableProps {
  schools: School[]
  onSchoolSelect?: (school: School) => void
  onEdit?: (school: School) => void
  onDelete?: (school: School) => void
  onActivate?: (school: School) => void
  onDeactivate?: (school: School) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  canEdit?: boolean
  canDelete?: boolean
  updatingSchools?: Set<string>
}

export function SchoolsTable({
  schools,
  onSchoolSelect,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  canEdit = false,
  canDelete = false,
  updatingSchools = new Set()
}: SchoolsTableProps) {
  const { t } = useTranslation()

  const columns: AlennaTableColumn<School>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (school) => (
        <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
          {school.name}
        </div>
      )
    },
    {
      key: 'address',
      label: 'Dirección',
      render: (school) => (
        <div className="text-sm text-foreground">
          {school.address}
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (school) => (
        <div className="text-sm text-foreground">
          {school.email || '-'}
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (school) => (
        <div className="text-sm text-foreground">
          {school.phone || '-'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (school) => {
        const isUpdating = updatingSchools.has(school.id)
        return (
          <div className="flex items-center gap-2">
            {isUpdating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <StatusBadge
              isActive={school.isActive !== false}
              activeText={t("schools.active")}
              inactiveText={t("schools.inactive")}
            />
          </div>
        )
      }
    },
    {
      key: 'limits',
      label: 'Límites',
      render: (school) => (
        <div className="text-sm text-foreground space-y-1">
          {school.teacherLimit !== undefined && (
            <div className="text-xs text-muted-foreground">
              {t("schools.teachers")}: <span className="font-semibold">{school.teacherLimit}</span>
            </div>
          )}
          {school.userLimit !== undefined && (
            <div className="text-xs text-muted-foreground">
              {t("schools.users")}: <span className="font-semibold">{school.userLimit}</span>
            </div>
          )}
          {school.teacherLimit === undefined && school.userLimit === undefined && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      )
    }
  ]

  const actions: AlennaTableAction<School>[] = []

  if (onSchoolSelect) {
    actions.push({
      label: 'Detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: onSchoolSelect
    })
  }

  if (canEdit && onEdit) {
    actions.push({
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit
    })
  }

  if (canEdit && onDeactivate) {
    actions.push({
      label: t("schools.deactivateSchool"),
      icon: <PowerOff className="h-4 w-4" />,
      onClick: onDeactivate,
      disabled: (school) =>
        school.isActive === false ||
        school.name.toLowerCase() === "alenna" ||
        updatingSchools.has(school.id)
    })
  }

  if (canEdit && onActivate) {
    actions.push({
      label: t("schools.activateSchool"),
      icon: <Power className="h-4 w-4" />,
      onClick: onActivate,
      disabled: (school) => school.isActive !== false || updatingSchools.has(school.id)
    })
  }

  if (canDelete && onDelete) {
    actions.push({
      label: t("schools.deleteSchool"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive'
    })
  }

  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {t("schools.title")}
          </CardTitle>
        </CardHeader>
      </Card>
      <AlennaTable
        columns={columns}
        data={schools}
        actions={actions}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          pageSize: 10,
          onPageChange
        }}
        emptyState={{
          icon: <Building className="h-12 w-12 text-muted-foreground" />,
          message: t("schools.noSchoolsToShow")
        }}
        onRowClick={onSchoolSelect}
        getRowId={(school) => school.id}
      />
    </div>
  )
}

