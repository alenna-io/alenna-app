import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { GraduationCap, Calendar, MapPin, Phone, ChevronRight } from "lucide-react"
import type { Student } from "@/types/student"

interface ParentChildrenViewProps {
  students: Student[]
}

export function ParentChildrenView({ students }: ParentChildrenViewProps) {
  const navigate = useNavigate()


  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay estudiantes vinculados</h3>
        <p className="text-muted-foreground">
          No tienes estudiantes asignados. Contacta al administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mis Hijos</h2>
        <p className="text-muted-foreground">
          {students.length} {students.length === 1 ? 'estudiante' : 'estudiantes'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl font-semibold">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl mb-2 truncate">{student.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {student.certificationType}
                    </Badge>
                    {student.isLeveled && (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                        Nivelado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>{student.age} años</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Graduación: {new Date(student.graduationDate).toLocaleDateString('es-MX')}</span>
              </div>

              {student.contactPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{student.contactPhone}</span>
                </div>
              )}

              {student.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{student.address}</span>
                </div>
              )}

              <div className="pt-3 border-t">
                <Button
                  className="w-full"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  Ver Perfil
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

