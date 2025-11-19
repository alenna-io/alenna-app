import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
import { ChevronLeft } from "lucide-react"
import type { Teacher } from "@/types/teacher"

interface TeachersListProps {
  teachers: Teacher[]
  onTeacherSelect: (teacher: Teacher) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function TeachersList({
  teachers,
  onTeacherSelect,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: TeachersListProps) {

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <Card
            key={teacher.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onTeacherSelect(teacher)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(teacher.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{teacher.fullName}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {teacher.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {teacher.roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant={role.name === 'SCHOOL_ADMIN' ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {role.displayName}
                      </Badge>
                    ))}
                  </div>
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

