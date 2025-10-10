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

interface StudentsTableProps {
  students: Student[]
  onStudentSelect: (student: Student) => void
}

export function StudentsTable({ students, onStudentSelect }: StudentsTableProps) {
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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Estudiante
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Edad
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Certificación
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Graduación
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Nivelado
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Teléfono
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Padres
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => onStudentSelect(student)}
                >
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{student.age} años</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(student.birthDate).toLocaleDateString("es-MX")}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant={getCertificationBadgeVariant(student.certificationType)}>
                      {student.certificationType}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">
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
                        className={student.isLeveled ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {student.isLeveled ? "Sí" : "No"}
                      </Badge>
                      {student.isLeveled && student.expectedLevel && (
                        <span className="text-xs text-muted-foreground">
                          {student.expectedLevel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{student.contactPhone}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col gap-1">
                      {student.parents.slice(0, 2).map((parent) => (
                        <div key={parent.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(parent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{parent.name}</span>
                        </div>
                      ))}
                      {student.parents.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{student.parents.length - 2} más
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
