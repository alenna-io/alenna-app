import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
import { Users, ChevronLeft, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
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
  onDelete?: (user: User) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  canEdit?: boolean
  canDelete?: boolean
}

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
}

const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Usuario', sortable: false },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'school', label: 'Escuela', sortable: false },
  { key: 'roles', label: 'Roles', sortable: false },
  { key: 'actions', label: '', sortable: false },
]

export function UsersTable({
  users,
  schools,
  onUserSelect,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  canEdit = false,
  canDelete = false
}: UsersTableProps) {

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Usuarios
        </CardTitle>
      </CardHeader>
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
                          {school ? school.name : 'Sin asignar'}
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
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detalles
                              </DropdownMenuItem>
                            )}
                            {canEdit && onEdit && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(user)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && onDelete && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(user)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
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
            <p className="text-muted-foreground">No hay usuarios para mostrar</p>
          </div>
        )}
      </CardContent>

      {/* Pagination */}
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
    </Card>
  )
}

