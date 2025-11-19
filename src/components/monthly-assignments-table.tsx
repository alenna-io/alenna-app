import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, MoreVertical, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MonthlyAssignmentTemplate {
  id: string
  name: string
  quarter: string
  schoolYearId: string
  hasGrades: boolean
  createdAt: string
  updatedAt: string
}

interface MonthlyAssignmentsTableProps {
  assignments: MonthlyAssignmentTemplate[]
  onEdit?: (assignment: MonthlyAssignmentTemplate) => void
  onDelete?: (assignment: MonthlyAssignmentTemplate) => void
  canEdit?: boolean
  canDelete?: boolean
}

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
}

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Bloque 1",
  Q2: "Bloque 2",
  Q3: "Bloque 3",
  Q4: "Bloque 4",
}

const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Nombre de la Asignación' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]

export function MonthlyAssignmentsTable({
  assignments,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: MonthlyAssignmentsTableProps) {
  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Asignaciones Mensuales
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
              {assignments.map((assignment) => {
                const renderCell = (columnKey: string) => {
                  switch (columnKey) {
                    case 'name':
                      return (
                        <div className="font-medium">{assignment.name}</div>
                      )
                    case 'quarter':
                      return (
                        <Badge variant="outline" className="text-xs">
                          {QUARTER_LABELS[assignment.quarter] || assignment.quarter}
                        </Badge>
                      )
                    case 'status':
                      return (
                        assignment.hasGrades ? (
                          <Badge variant="secondary" className="text-xs">
                            Con calificaciones
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Sin calificaciones
                          </Badge>
                        )
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
                            {canEdit && onEdit && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(assignment)
                                }}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && onDelete && !assignment.hasGrades && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(assignment)
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
                    key={assignment.id}
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
      {assignments.length === 0 && (
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay asignaciones mensuales</h3>
          <p className="text-muted-foreground">Crea la primera asignación mensual para comenzar</p>
        </CardContent>
      )}
    </Card>
  )
}

