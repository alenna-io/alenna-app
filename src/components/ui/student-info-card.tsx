import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, Calendar } from "lucide-react"
import { getInitials } from "@/lib/string-utils"

interface Student {
  id: string
  name: string
  currentGrade: string
  schoolYear: string
}

interface StudentInfoCardProps {
  student: Student
  showBadge?: boolean
  badgeText?: string
  className?: string
}

export function StudentInfoCard({
  student,
  showBadge = true,
  badgeText = "A.C.E. System",
  className
}: StudentInfoCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="text-sm font-semibold">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-2 truncate">{student.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base text-muted-foreground">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>{student.currentGrade}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="truncate">Año Escolar: {student.schoolYear}</span>
              </div>
            </div>
          </div>
          {showBadge && (
            <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 md:py-2 self-end sm:self-auto">
              {badgeText}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
