import { Badge } from "@/components/ui/badge"
import { FileText, Edit, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

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
  currentPage?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
}

export function MonthlyAssignmentsTable({
  assignments,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: MonthlyAssignmentsTableProps) {
  const { t } = useTranslation()

  const QUARTER_LABELS: Record<string, string> = {
    Q1: t("monthlyAssignments.quarterLabelQ1"),
    Q2: t("monthlyAssignments.quarterLabelQ2"),
    Q3: t("monthlyAssignments.quarterLabelQ3"),
    Q4: t("monthlyAssignments.quarterLabelQ4"),
  }

  const columns: AlennaTableColumn<MonthlyAssignmentTemplate>[] = [
    {
      key: 'name',
      label: t("monthlyAssignments.assignmentName"),
      render: (assignment) => (
        <div className="font-medium text-foreground">{assignment.name}</div>
      )
    },
    {
      key: 'quarter',
      label: t("monthlyAssignments.quarter"),
      render: (assignment) => (
        <Badge variant="primary-soft" className="text-xs">
          {QUARTER_LABELS[assignment.quarter] || assignment.quarter}
        </Badge>
      )
    },
    {
      key: 'status',
      label: t("monthlyAssignments.status"),
      render: (assignment) => (
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
    }
  ]

  const actions: AlennaTableAction<MonthlyAssignmentTemplate>[] = []

  if (canEdit && onEdit) {
    actions.push({
      label: t("monthlyAssignments.edit"),
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit
    })
  }

  if (canDelete && onDelete) {
    actions.push({
      label: t("monthlyAssignments.delete"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive',
      disabled: (assignment) => assignment.hasGrades
    })
  }

  return (
    <AlennaTable
      columns={columns}
      data={assignments}
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
        icon: <FileText className="h-14 w-14 text-muted-foreground opacity-50" />,
        title: t("monthlyAssignments.noAssignments"),
        message: t("monthlyAssignments.createFirst")
      }}
      getRowId={(assignment) => assignment.id}
    />
  )
}

