import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
import { Users, ChevronsUpDown, ChevronLeft, MoreVertical, Eye, Trash2 } from "lucide-react"
import type { Student } from "@/types/student"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"

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

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
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

  const COLUMNS: ColumnConfig[] = [
    { key: 'firstName', label: t("common.name"), sortable: true },
    { key: 'lastName', label: t("common.lastName"), sortable: true },
    { key: 'age', label: t("students.age"), sortable: true },
    { key: 'certification', label: t("students.certification"), sortable: true },
    { key: 'graduation', label: t("students.graduation"), sortable: true },
    { key: 'nivel', label: t("students.level"), sortable: false },
    { key: 'gradoEscolar', label: t("students.schoolGrade"), sortable: false },
    { key: 'actions', label: '', sortable: false },
  ]

  const getSortIcon = (field: "firstName" | "lastName") => {
    const isActive = sortField === field

    return (
      <ChevronsUpDown
        className={`h-3 w-3 ml-1 transition-all ${isActive
          ? sortDirection === "asc"
            ? "text-primary -translate-y-[1px]"
            : "text-primary translate-y-[1px]"
          : "text-muted-foreground/70"
          }`}
      />
    )
  }

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  const getCertificationBadgeVariant = (type: string) => {
    switch (type) {
      case "INEA": return "default"
      case "Grace Christian": return "secondary"
      case "Home Life": return "outline"
      case "Lighthouse": return "secondary"
      default: return "outline"
    }
  }

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm [&:last-child]:w-16"
  const tdClass = "p-4 align-middle first:px-6 first:py-3 [&:last-child]:w-16"

  const renderColumnHeader = (column: ColumnConfig) => {
    if (column.key === 'firstName' || column.key === 'lastName') {
      const field = column.key === 'firstName' ? "firstName" : "lastName"
      return (
        <button
          type="button"
          onClick={() => onSort(field)}
          className="inline-flex items-center text-sm font-semibold text-foreground hover:text-primary"
        >
          {column.label}
          {getSortIcon(field)}
        </button>
      )
    }

    if (column.sortable) {
      // Non-name sortable columns (age, certification, graduation)
      return (
        <button
          type="button"
          onClick={() => onSort("firstName")}
          className="inline-flex items-center text-sm font-semibold text-foreground hover:text-primary"
        >
          {column.label}
        </button>
      )
    }

    return column.label
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {COLUMNS.map((column) => (
                  <th key={column.key} className={thClass}>
                    {renderColumnHeader(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const renderCell = (columnKey: string) => {
                  switch (columnKey) {
                    case 'firstName':
                      return (
                        <div className="flex items-center gap-4">
                          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                            <AvatarFallback className="text-sm font-semibold">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                              {student.firstName}
                            </div>
                          </div>
                        </div>
                      )
                    case 'lastName':
                      return (
                        <div className="text-sm text-foreground">
                          {student.lastName}
                        </div>
                      )
                    case 'age':
                      return <div className="text-sm font-medium">{t("students.ageYears", { age: student.age })}</div>
                    case 'certification':
                      return (
                        <Badge
                          variant={getCertificationBadgeVariant(student.certificationType)}
                          className="font-medium"
                        >
                          {student.certificationType}
                        </Badge>
                      )
                    case 'graduation':
                      return (
                        <div className="text-sm font-medium">
                          {new Date(student.graduationDate).getFullYear()}
                        </div>
                      )
                    case 'nivel':
                      return (
                        <div className="flex items-center gap-2">
                          {student.currentLevel && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {student.currentLevel}
                            </span>
                          )}
                          {!student.currentLevel && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      )
                    case 'gradoEscolar':
                      return (
                        <div className="flex items-center gap-2">
                          {student.expectedLevel ? (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {student.expectedLevel}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
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
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onStudentSelect(student)
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("common.view")}
                            </DropdownMenuItem>
                            {showRemoveFromGroup && onRemoveFromGroup && groupAssignmentMap?.has(student.id) && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const assignmentId = groupAssignmentMap.get(student.id)
                                  if (assignmentId) {
                                    onRemoveFromGroup(student, assignmentId)
                                  }
                                }}
                                className="cursor-pointer text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("groups.removeFromGroup")}
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
                    key={student.id}
                    className="border-b transition-all duration-200 hover:bg-muted/30 cursor-pointer group"
                    onClick={() => onStudentSelect(student)}
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

        {students.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay estudiantes para mostrar</p>
          </div>
        )}
      </CardContent>

      {/* Pagination - Always show */}
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
              // Show first page, last page, current page, and pages around current
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
