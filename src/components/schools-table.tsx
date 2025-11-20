import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Building, ChevronLeft, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  teacherLimit?: number
  userLimit?: number
}

interface SchoolsTableProps {
  schools: School[]
  onSchoolSelect?: (school: School) => void
  onEdit?: (school: School) => void
  onDelete?: (school: School) => void
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
  { key: 'name', label: 'Nombre', sortable: false },
  { key: 'address', label: 'Dirección', sortable: false },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'phone', label: 'Teléfono', sortable: false },
  { key: 'limits', label: 'Límites', sortable: false },
  { key: 'actions', label: '', sortable: false },
]

export function SchoolsTable({
  schools,
  onSchoolSelect,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  canEdit = false,
  canDelete = false
}: SchoolsTableProps) {
  const { t } = useTranslation()
  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {t("schools.title")}
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
              {schools.map((school) => {
                const renderCell = (columnKey: string) => {
                  switch (columnKey) {
                    case 'name':
                      return (
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                          {school.name}
                        </div>
                      )
                    case 'address':
                      return (
                        <div className="text-sm text-foreground">
                          {school.address}
                        </div>
                      )
                    case 'email':
                      return (
                        <div className="text-sm text-foreground">
                          {school.email || '-'}
                        </div>
                      )
                    case 'phone':
                      return (
                        <div className="text-sm text-foreground">
                          {school.phone || '-'}
                        </div>
                      )
                    case 'limits':
                      return (
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
                            {onSchoolSelect && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSchoolSelect(school)
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
                                  onEdit(school)
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
                                  onDelete(school)
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
                    key={school.id}
                    className="border-b transition-all duration-200 hover:bg-muted/30 cursor-pointer group"
                    onClick={() => onSchoolSelect && onSchoolSelect(school)}
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

        {schools.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("schools.noSchoolsToShow")}</p>
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

