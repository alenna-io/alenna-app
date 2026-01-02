import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface GroupDisplay {
  id: string
  name: string | null
  teacherId: string
  teacherName: string
  schoolYearId: string
  schoolYearName: string
  studentCount: number
  students: Array<{ id: string; studentId: string; studentName: string }>
}

interface GroupsTableProps {
  groups: GroupDisplay[]
  onViewDetails: (groupId: string) => void
  canManage?: boolean
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  tableId?: string
}

export function GroupsTable({
  groups,
  onViewDetails,
  canManage = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  tableId,
}: GroupsTableProps) {
  const { t } = useTranslation()

  const columns: AlennaTableColumn<GroupDisplay>[] = [
    {
      key: 'name',
      label: t("groups.groupName"),
      render: (group) => (
        <div className="text-sm text-foreground group-hover:text-primary transition-colors font-medium">
          {group.name || t("groups.defaultGroupName")}
        </div>
      )
    },
    {
      key: 'teacher',
      label: t("groups.teacher"),
      render: (group) => (
        <div className="text-sm text-foreground">
          {group.teacherName}
        </div>
      )
    },
    {
      key: 'schoolYear',
      label: t("groups.schoolYear"),
      render: (group) => (
        <div className="text-sm text-muted-foreground">
          {group.schoolYearName}
        </div>
      )
    },
    {
      key: 'students',
      label: t("groups.studentsAssigned"),
      render: (group) => (
        <Badge variant="secondary">{group.studentCount}</Badge>
      )
    }
  ]

  const actions: AlennaTableAction<GroupDisplay>[] = canManage ? [
    {
      label: t("groups.viewDetails"),
      icon: <Eye className="h-4 w-4" />,
      onClick: (group) => onViewDetails(group.id)
    }
  ] : []

  return (
    <AlennaTable
      columns={columns}
      data={groups}
      actions={actions}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        pageSize: 10,
        onPageChange
      }}
      emptyState={{
        message: t("groups.noGroups")
      }}
      onRowClick={(group) => onViewDetails(group.id)}
      getRowId={(group) => group.id}
      tableId={tableId}
    />
  )
}
