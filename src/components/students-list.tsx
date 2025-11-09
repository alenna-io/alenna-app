import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
import { ChevronLeft } from "lucide-react"
import type { Student } from "@/types/student"

interface StudentsListProps {
  students: Student[]
  onStudentSelect: (student: Student) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function StudentsList({
  students,
  onStudentSelect,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: StudentsListProps) {

  const getCertificationBadgeVariant = (type: string) => {
    switch (type) {
      case "INEA": return "default"
      case "Grace Christian": return "secondary"
      case "Home Life": return "outline"
      case "Lighthouse": return "secondary"
      default: return "outline"
    }
  }

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <Card
            key={student.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onStudentSelect(student)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {student.age} años
                  </p>
                  <Badge
                    variant={getCertificationBadgeVariant(student.certificationType)}
                    className="mt-1 text-xs"
                  >
                    {student.certificationType}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Graduación:</span>
                  <span>
                    {new Date(student.graduationDate).toLocaleDateString("es-MX")}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Nivelado:</span>
                  <Badge
                    variant={student.isLeveled ? "default" : "secondary"}
                    className={student.isLeveled ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                  >
                    {student.isLeveled ? "Sí" : "No"}
                  </Badge>
                </div>
                {student.isLeveled && student.expectedLevel && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Nivel:</span>
                    <span>{student.expectedLevel}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Teléfono:</span>
                  <span>{student.contactPhone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardFooter className="flex items-center justify-between px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startItem} - {endItem} de {totalItems} resultados
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
        </Card>
      )}
    </div>
  )
}
