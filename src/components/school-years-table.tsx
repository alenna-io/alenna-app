import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, MoreVertical, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SchoolYear } from "@/services/api"

interface SchoolYearsTableProps {
  schoolYears: SchoolYear[]
  onEdit?: (year: SchoolYear) => void
  onDelete?: (year: SchoolYear) => void
  onSetActive?: (id: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
}

const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Año Escolar', sortable: false },
  { key: 'dates', label: 'Fechas', sortable: false },
  { key: 'quarters', label: 'Trimestres', sortable: false },
  { key: 'status', label: 'Estado', sortable: false },
  { key: 'actions', label: '', sortable: false },
]

// Helper function to format date strings
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
  canDelete = false
}: SchoolYearsTableProps) {
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
              {schoolYears.map((year) => {
                const renderCell = (columnKey: string) => {
                  switch (columnKey) {
                    case 'name':
                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{year.name}</span>
                        </div>
                      )
                    case 'dates':
                      return (
                        <div className="text-sm text-muted-foreground">
                          {formatDateString(year.startDate)} - {formatDateString(year.endDate)}
                        </div>
                      )
                    case 'quarters':
                      return (
                        <div className="text-sm">
                          {year.quarters?.length || 0} {year.quarters?.length === 1 ? 'trimestre' : 'trimestres'}
                        </div>
                      )
                    case 'status':
                      return (
                        <div>
                          {year.isActive ? (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
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
                              className="h-8 w-8 p-0 cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {!year.isActive && onSetActive && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSetActive(year.id)
                                }}
                                className="cursor-pointer"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            {canEdit && onEdit && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(year)
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && onDelete && !year.isActive && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(year)
                                }}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
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
                    key={year.id}
                    className="border-b transition-all duration-200 hover:bg-muted/30 group"
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
      </CardContent>
      {schoolYears.length === 0 && (
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay años escolares configurados</h3>
          <p className="text-muted-foreground">Crea el primer año escolar para comenzar</p>
        </CardContent>
      )}
    </Card>
  )
}

