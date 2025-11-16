import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
import { Users, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft } from "lucide-react"
import type { Student } from "@/types/student"

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
}

interface ColumnConfig {
  key: string
  label: string | React.ReactNode
  sortable?: boolean
}

const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'age', label: 'Edad' },
  { key: 'certification', label: 'Certificación' },
  { key: 'graduation', label: 'Graduación' },
  { key: 'level', label: 'Nivel' },
  { key: 'actions', label: 'Acciones' },
]

export function StudentsTable({
  students,
  onStudentSelect,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: StudentsTableProps) {

  const getSortIcon = (field: "firstName" | "lastName") => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    return sortDirection === "asc" ?
      <ArrowUp className="h-4 w-4 ml-1" /> :
      <ArrowDown className="h-4 w-4 ml-1" />
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

  const thClass = "h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm"
  const tdClass = "p-4 align-middle first:px-6 first:py-3"

  const renderColumnHeader = (column: ColumnConfig) => {
    if (column.key === 'name') {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort("firstName")}
            className={thClass}
          >
            Nombre
            {getSortIcon("firstName")}
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort("lastName")}
            className={thClass}
          >
            Apellido
            {getSortIcon("lastName")}
          </Button>
        </div>
      )
    }
    return column.label
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Estudiantes
        </CardTitle>
      </CardHeader>
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
                    case 'name':
                      return (
                        <div className="flex items-center gap-4">
                          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                            <AvatarFallback className="text-sm font-semibold">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      )
                    case 'age':
                      return <div className="text-sm font-medium">{student.age} años</div>
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
                    case 'level':
                      return (
                        <div className="flex items-center gap-2">
                          {student.isLeveled && student.expectedLevel && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {student.expectedLevel}
                            </span>
                          )}
                        </div>
                      )
                    case 'actions':
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onStudentSelect(student)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          style={{ cursor: 'pointer' }}
                        >
                          Ver Perfil
                        </Button>
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
