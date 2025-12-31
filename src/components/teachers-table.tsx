import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/string-utils"
import { Users, Eye } from "lucide-react"
import type { Teacher } from "@/types/teacher"
import { StatusBadge } from "@/components/ui/status-badge"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface TeachersTableProps {
  teachers: Teacher[]
  onTeacherSelect: (teacher: Teacher) => void
  sortField: "firstName" | "lastName" | null
  sortDirection: "asc" | "desc"
  onSort: (field: "firstName" | "lastName") => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function TeachersTable({
  teachers,
  onTeacherSelect,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: TeachersTableProps) {
  const { t } = useTranslation()

  const columns: AlennaTableColumn<Teacher>[] = [
    {
      key: 'firstName',
      label: t("common.name"),
      sortable: true,
      render: (teacher) => (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarFallback className="text-sm font-semibold">
              {getInitials(teacher.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                {teacher.firstName}
              </div>
              {!teacher.isActive && (
                <StatusBadge
                  isActive={false}
                  activeText={t("common.active")}
                  inactiveText={t("common.inactive")}
                />
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'lastName',
      label: t("common.lastName"),
      sortable: true,
      render: (teacher) => (
        <div className="text-sm text-foreground">
          {teacher.lastName}
        </div>
      )
    },
    {
      key: 'email',
      label: t("common.email"),
      render: (teacher) => (
        <div className="text-sm text-muted-foreground">
          {teacher.email}
        </div>
      )
    },
    {
      key: 'roles',
      label: t("teachers.roles"),
      render: (teacher) => (
        <div className="flex items-center gap-2 flex-wrap">
          {teacher.roles.map((role) => (
            <Badge
              key={role.id}
              variant={role.name === 'SCHOOL_ADMIN' ? "default" : "secondary"}
              className="font-medium"
            >
              {role.displayName}
            </Badge>
          ))}
        </div>
      )
    }
  ]

  const actions: AlennaTableAction<Teacher>[] = [
    {
      label: t("common.view"),
      icon: <Eye className="h-4 w-4" />,
      onClick: onTeacherSelect
    }
  ]

  return (
    <AlennaTable
      columns={columns}
      data={teachers}
      actions={actions}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        pageSize: 10,
        onPageChange
      }}
      emptyState={{
        icon: <Users className="h-12 w-12 text-muted-foreground" />,
        message: t("teachers.noTeachersToShow")
      }}
      onRowClick={onTeacherSelect}
      sortField={sortField || undefined}
      sortDirection={sortDirection}
      onSort={(field) => {
        if (field === 'firstName' || field === 'lastName') {
          onSort(field)
        }
      }}
      getRowId={(teacher) => teacher.id}
    />
  )
}

