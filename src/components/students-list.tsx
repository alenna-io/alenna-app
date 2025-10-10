import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Parent {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  age: number
  birthDate: string
  certificationType: "INEA" | "Grace Christian" | "Home Life" | "Lighthouse" | "Otro"
  graduationDate: string
  parents: Parent[]
  contactPhone: string
  isLeveled: boolean
  expectedLevel?: string
  address: string
}

interface StudentsListProps {
  students: Student[]
  onStudentSelect: (student: Student) => void
}

export function StudentsList({ students, onStudentSelect }: StudentsListProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

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
  )
}
