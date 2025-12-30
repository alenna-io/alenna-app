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
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <Card
            key={student.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onStudentSelect(student)}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                  <AvatarFallback className="text-sm md:text-base bg-primary-soft text-primary">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base truncate">{student.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {student.age} años
                  </p>
                  <Badge
                    variant={getCertificationBadgeVariant(student.certificationType)}
                    className="mt-1 text-[10px] md:text-xs"
                  >
                    {student.certificationType}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
                <div className="flex justify-between items-center text-[10px] md:text-xs text-muted-foreground">
                  <span className="truncate mr-2">Graduación:</span>
                  <span className="truncate text-left">
                    {new Date(student.graduationDate).toLocaleDateString("es-MX")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs text-muted-foreground">
                  <span>Nivelado:</span>
                  <Badge
                    variant={student.isLeveled ? "default" : "secondary"}
                    className={`text-[10px] md:text-xs ${student.isLeveled ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}
                  >
                    {student.isLeveled ? "Sí" : "No"}
                  </Badge>
                </div>
                {student.isLeveled && student.expectedLevel && (
                  <div className="flex justify-between items-center text-[10px] md:text-xs text-muted-foreground">
                    <span>Nivel:</span>
                    <span className="truncate text-left">{student.expectedLevel}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px-4 md:px-6 py-3 md:py-4">
            <div className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
              Mostrando {startItem} - {endItem} de {totalItems} resultados
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
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
                        className="min-w-10 cursor-pointer"
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
