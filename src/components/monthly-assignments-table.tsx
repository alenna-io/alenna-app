import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, MoreVertical, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"

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

export function MonthlyAssignmentsTable({
  assignments,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: MonthlyAssignmentsTableProps) {
  const { t } = useTranslation()
  const thClass = "h-12 px-4 text-left align-middle font-semibold text-foreground first:pl-6 text-sm border-b-2 border-b-primary/50 border-r border-border last:border-r-0"
  const tdClass = "p-4 align-middle first:pl-6 border-b border-border border-r border-border last:border-r-0"

  const QUARTER_LABELS: Record<string, string> = {
    Q1: t("monthlyAssignments.quarterLabelQ1"),
    Q2: t("monthlyAssignments.quarterLabelQ2"),
    Q3: t("monthlyAssignments.quarterLabelQ3"),
    Q4: t("monthlyAssignments.quarterLabelQ4"),
  }

  const COLUMNS: ColumnConfig[] = [
    { key: 'name', label: t("monthlyAssignments.assignmentName") },
    { key: 'quarter', label: t("monthlyAssignments.quarter") },
    { key: 'status', label: t("monthlyAssignments.status") },
    { key: 'actions', label: '' },
  ]

  return (
    <Card className="card-soft overflow-hidden">
      <CardContent className="p-0">
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30">
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
                          <div className="font-medium text-foreground">{assignment.name}</div>
                        )
                      case 'quarter':
                        return (
                          <Badge variant="primary-soft" className="text-xs">
                            {QUARTER_LABELS[assignment.quarter] || assignment.quarter}
                          </Badge>
                        )
                      case 'status':
                        return (
                          assignment.hasGrades ? (
                            <Badge variant="status-completed" className="text-xs">
                              {t("monthlyAssignments.withGrades")}
                            </Badge>
                          ) : (
                            <Badge variant="status-inactive" className="text-xs">
                              {t("monthlyAssignments.withoutGrades")}
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
                                className="h-8 w-8 p-0 cursor-pointer hover:bg-muted/50"
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
                                  {t("monthlyAssignments.edit")}
                                </DropdownMenuItem>
                              )}
                              {canDelete && onDelete && !assignment.hasGrades && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(assignment)
                                  }}
                                  className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("monthlyAssignments.delete")}
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
                      className="bg-card transition-colors duration-200 hover:bg-muted/20 group"
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
        ) : (
          <div className="py-16 text-center animate-fade-in-soft">
            <FileText className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">{t("monthlyAssignments.noAssignments")}</h3>
            <p className="text-sm text-muted-foreground">{t("monthlyAssignments.createFirst")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

