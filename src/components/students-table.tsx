import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Phone, MapPin } from "lucide-react"

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
                  Estudiante
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
    </Card>
  )
}
