import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/string-utils"
import { Users, Eye, Trash2 } from "lucide-react"
import type { Student } from "@/types/student"
import { StatusBadge } from "@/components/ui/status-badge"
import { useTranslation } from "react-i18next"
import { getSchoolGradeFromLevel } from "@/lib/level-to-grade"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"

interface StudentsTableProps {
  students: Student[]
  onStudentSelect: (student: Student) => void
  sortField: "firstName" | "lastName" | null
  sortDirection: "asc" | "desc"
  onSort: (field: "firstName" | "lastName") => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  onRemoveFromGroup?: (student: Student, groupAssignmentId: string) => void
  groupAssignmentMap?: Map<string, string> // Maps student ID to group assignment ID
  showRemoveFromGroup?: boolean
}

export function StudentsTable({
  students,
  onStudentSelect,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onRemoveFromGroup,
  groupAssignmentMap,
  showRemoveFromGroup = false
}: StudentsTableProps) {
  const { t } = useTranslation()

  const getCertificationBadgeVariant = (type: string) => {
    switch (type) {
      case "INEA": return "default"
      case "Grace Christian": return "secondary"
      case "Home Life": return "outline"
      case "Lighthouse": return "secondary"
      default: return "outline"
    }
  }

  const columns: AlennaTableColumn<Student>[] = [
    {
      key: 'firstName',
      label: t("common.name"),
      sortable: true,
      render: (student) => (
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarFallback className="text-sm font-semibold bg-primary-soft text-primary">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                {student.firstName}
              </div>
              {!student.isActive && (
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
      render: (student) => (
        <div className="text-sm text-foreground">
          {student.lastName}
        </div>
      )
    },
    {
      key: 'age',
      label: t("students.age"),
      sortable: false,
      render: (student) => (
        <div className="text-sm font-medium">{t("students.ageYears", { age: student.age })}</div>
      )
    },
    {
      key: 'certification',
      label: t("students.certification"),
      sortable: false,
      render: (student) => (
        <Badge
          variant={getCertificationBadgeVariant(student.certificationType)}
          className="font-medium"
        >
          {student.certificationType}
        </Badge>
      )
    },
    {
      key: 'graduation',
      label: t("students.graduation"),
      sortable: false,
      render: (student) => (
        <div className="text-sm font-medium">
          {new Date(student.graduationDate).getFullYear()}
        </div>
      )
    },
    {
      key: 'nivel',
      label: t("students.level"),
      render: (student) => (
        <div className="flex items-center gap-2">
          {student.currentLevel ? (
            <span className="text-sm text-foreground">
              {student.currentLevel}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      )
    },
    {
      key: 'gradoEscolar',
      label: t("students.schoolGrade"),
      render: (student) => (
        <div className="flex items-center gap-2">
          {student.currentLevel ? (
            <span className="text-sm text-foreground">
              {getSchoolGradeFromLevel(student.currentLevel, t)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      )
    }
  ]

  const actions: AlennaTableAction<Student>[] = [
    {
      label: t("common.view"),
      icon: <Eye className="h-4 w-4" />,
      onClick: onStudentSelect
    }
  ]

  if (showRemoveFromGroup && onRemoveFromGroup) {
    actions.push({
      label: t("groups.removeFromGroup"),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (student) => {
        const assignmentId = groupAssignmentMap?.get(student.id)
        if (assignmentId) {
          onRemoveFromGroup(student, assignmentId)
        }
      },
      variant: 'destructive',
      disabled: (student) => !groupAssignmentMap?.has(student.id)
    })
  }

  return (
    <AlennaTable
      columns={columns}
      data={students}
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
        message: t("students.noResults")
      }}
      onRowClick={onStudentSelect}
      sortField={sortField || undefined}
      sortDirection={sortDirection}
      onSort={(field) => {
        if (field === 'firstName' || field === 'lastName') {
          onSort(field)
        }
      }}
      getRowId={(student) => student.id}
    />
  )
}
