import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { getInitials } from "@/lib/string-utils"
import { Users, Eye, Edit, Trash2, Power, PowerOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  schoolId: string
  isActive: boolean
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  primaryRole?: {
    id: string
    name: string
    displayName: string
  }
}

interface UsersTableProps {
  users: User[]
  schools: Array<{ id: string; name: string }>
  onUserSelect?: (user: User) => void
  onEdit?: (user: User) => void
  onDeactivate?: (user: User) => void
  onReactivate?: (user: User) => void
  onDelete?: (user: User) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  canEdit?: boolean
  canDelete?: boolean
  currentUserId?: string
  currentUserEmail?: string
  updatingUsers?: Set<string>
}

export function UsersTable({
  users,
  schools,
  onUserSelect,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  canEdit = false,
  canDelete = false,
  currentUserId,
  currentUserEmail,
  updatingUsers = new Set()
}: UsersTableProps) {
  const { t } = useTranslation()

  const columns: AlennaTableColumn<User>[] = [
    {
      key: 'name',
      label: t("users.firstName"),
      render: (user) => {
        const userName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email
        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                {userName}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'email',
      label: t("users.email"),
      render: (user) => (
        <div className="text-sm text-foreground">
          {user.email}
        </div>
      )
    },
    {
      key: 'school',
      label: t("users.school"),
      render: (user) => {
        const school = schools.find(s => s.id === user.schoolId)
        return (
          <div className="text-sm text-foreground">
            {school ? school.name : t("common.noSelection")}
          </div>
        )
      }
    },
    {
      key: 'status',
      label: t("common.status"),
      render: (user) => {
        const isUpdating = updatingUsers.has(user.id)
        return (
          <div className="text-sm flex items-center gap-2">
            {isUpdating && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <StatusBadge
              isActive={user.isActive}
              activeText={t("users.active")}
              inactiveText={t("users.inactive")}
            />
          </div>
        )
      }
    },
    {
      key: 'roles',
      label: t("users.roles"),
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.id} variant="secondary" className="font-medium text-xs">
              {role.displayName}
            </Badge>
          ))}
        </div>
      )
    }
  ]

  const actions: AlennaTableAction<User>[] = []
  
  if (onUserSelect) {
    actions.push({
      label: t("users.viewDetails") || "Detalles",
      icon: <Eye className="h-4 w-4" />,
      onClick: onUserSelect
    })
  }

  if (canEdit && onEdit) {
    actions.push({
      label: t("users.editUser"),
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit
    })
  }

  if (canDelete && onDeactivate) {
    actions.push({
      label: t("users.deactivateUser"),
      icon: <PowerOff className="h-4 w-4" />,
      onClick: onDeactivate,
      disabled: (user) => 
        !user.isActive || 
        currentUserId === user.id || 
        currentUserEmail === user.email || 
        updatingUsers.has(user.id)
    })
  }

  if (canDelete && onReactivate) {
    actions.push({
      label: t("users.reactivateUser"),
      icon: <Power className="h-4 w-4" />,
      onClick: onReactivate,
      disabled: (user) => user.isActive || updatingUsers.has(user.id)
    })
  }

  if (canDelete && onDelete) {
    actions.push({
      label: t("users.deleteUser"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive',
      disabled: (user) => 
        user.isActive || 
        currentUserId === user.id || 
        currentUserEmail === user.email
    })
  }

  return (
    <AlennaTable
      columns={columns}
      data={users}
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
        message: t("users.noUsers")
      }}
      onRowClick={onUserSelect}
      getRowId={(user) => user.id}
    />
  )
}

