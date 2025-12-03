import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { Users, ChevronLeft, ChevronRight, MoreVertical, Eye, Edit, Trash2, Power, PowerOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
}

// COLUMNS will be defined inside the component to use translations

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

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const COLUMNS: ColumnConfig[] = [
    { key: 'name', label: t("users.firstName"), sortable: false },
    { key: 'email', label: t("users.email"), sortable: false },
    { key: 'school', label: t("users.school"), sortable: false },
    { key: 'status', label: t("common.status"), sortable: false },
    { key: 'roles', label: t("users.roles"), sortable: false },
    { key: 'actions', label: '', sortable: false },
  ]

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {COLUMNS.map((column) => (
                  <th key={column.key} className={thClass}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const userName = user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email

                const school = schools.find(s => s.id === user.schoolId)

                const renderCell = (columnKey: string) => {
                  switch (columnKey) {
                    case 'name':
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
                    case 'email':
                      return (
                        <div className="text-sm text-foreground">
                          {user.email}
                        </div>
                      )
                    case 'school':
                      return (
                        <div className="text-sm text-foreground">
                          {school ? school.name : t("common.noSelection")}
                        </div>
                      )
                    case 'status':
                      const isUpdating = updatingUsers.has(user.id)
                      return (
                        <div className="text-sm flex items-center gap-2">
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : null}
                          <StatusBadge
                            isActive={user.isActive}
                            activeText={t("users.active")}
                            inactiveText={t("users.inactive")}
                          />
                        </div>
                      )
                    case 'roles':
                      return (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary" className="font-medium text-xs">
                              {role.displayName}
                            </Badge>
                          ))}
                        </div>
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
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {onUserSelect && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onUserSelect(user)
                                }}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t("users.viewDetails") || "Detalles"}
                              </DropdownMenuItem>
                            )}
                            {canEdit && onEdit && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(user)
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {t("users.editUser")}
                              </DropdownMenuItem>
                            )}
                            {canDelete && user.isActive && onDeactivate && (currentUserId !== user.id && currentUserEmail !== user.email) && !updatingUsers.has(user.id) && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeactivate(user)
                                }}
                                className="text-orange-600 cursor-pointer"
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                {t("users.deactivateUser")}
                              </DropdownMenuItem>
                            )}
                            {canDelete && !user.isActive && onReactivate && !updatingUsers.has(user.id) && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onReactivate(user)
                                }}
                                className="text-green-600 cursor-pointer"
                              >
                                <Power className="h-4 w-4 mr-2" />
                                {t("users.reactivateUser")}
                              </DropdownMenuItem>
                            )}
                            {updatingUsers.has(user.id) && (
                              <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.loading")}
                              </DropdownMenuItem>
                            )}
                            {canDelete && !user.isActive && onDelete && (currentUserId !== user.id && currentUserEmail !== user.email) && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(user)
                                }}
                                className="text-red-600 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("users.deleteUser")}
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
                    key={user.id}
                    className="border-b transition-all duration-200 hover:bg-muted/30 cursor-pointer group"
                    onClick={() => onUserSelect && onUserSelect(user)}
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

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("users.noUsers")}</p>
          </div>
        )}
      </CardContent>

      {/* Pagination */}
      <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("common.goTo")}:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value, 10)
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                  onPageChange(page)
                }
              }}
              className="w-16 h-8 text-center border rounded-md px-2"
            />
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
        </div>
      </CardFooter>
    </Card>
  )
}

