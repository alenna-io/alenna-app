import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { Users, Calendar, Phone, MapPin, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft } from "lucide-react"
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
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lista de Estudiantes ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-14 px-6 text-left align-middle font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSort("firstName")}
                      className="h-auto p-0 hover:bg-transparent cursor-pointer font-semibold"
                    >
                      Nombre
                      {getSortIcon("firstName")}
                    </Button>
                    <span className="text-muted-foreground">/</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSort("lastName")}
                      className="h-auto p-0 hover:bg-transparent cursor-pointer font-semibold"
                    >
                      Apellido
                      {getSortIcon("lastName")}
                    </Button>
                  </div>
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  Edad
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  Certificación
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Graduación
                  </div>
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  Nivelado
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contacto
                  </div>
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  Padres
                </th>
                <th className="h-14 px-4 text-left align-middle font-semibold text-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b transition-all duration-200 hover:bg-muted/30 cursor-pointer group"
                  onClick={() => onStudentSelect(student)}
                >
                  <td className="p-6 align-middle">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarFallback className="text-sm font-semibold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {student.name}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {student.address}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm font-medium">{student.age} años</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(student.birthDate).toLocaleDateString("es-MX")}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge
                      variant={getCertificationBadgeVariant(student.certificationType)}
                      className="font-medium"
                    >
                      {student.certificationType}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm font-medium">
                      {new Date(student.graduationDate).toLocaleDateString("es-MX")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(student.graduationDate).getFullYear()}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={student.isLeveled ? "default" : "secondary"}
                        className={`font-medium ${student.isLeveled
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-orange-100 text-orange-800 border-orange-200"
                          }`}
                      >
                        {student.isLeveled ? "Sí" : "No"}
                      </Badge>
                      {student.isLeveled && student.expectedLevel && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {student.expectedLevel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm font-medium">{student.contactPhone}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col gap-2">
                      {student.parents.slice(0, 2).map((parent) => (
                        <div key={parent.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(parent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{parent.name}</span>
                        </div>
                      ))}
                      {student.parents.length > 2 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          +{student.parents.length - 2} más
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStudentSelect(student)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Ver Perfil
                    </Button>
                  </td>
                </tr>
              ))}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Mostrando {startItem} - {endItem} de {totalItems} estudiantes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
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
              disabled={currentPage === totalPages}
            >
              Siguiente
            </LinkButton>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
