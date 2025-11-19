import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
// BackButton replaced with shadcn Button
import { Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { Student } from "@/types/student"
import { ParentProfileDialog } from "@/components/parent-profile-dialog"

interface StudentProfileProps {
  student: Student
  onBack: () => void
  isParentView?: boolean
  isStudentView?: boolean
}

export function StudentProfile({ student, onBack, isParentView = false, isStudentView = false }: StudentProfileProps) {
  const navigate = useNavigate()
  const [selectedParent, setSelectedParent] = React.useState<Student['parents'][0] | null>(null)
  const [isParentDialogOpen, setIsParentDialogOpen] = React.useState(false)


  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      {!isStudentView && (
        <div className="md:hidden">
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4"
          >
            ← Volver a Estudiantes
          </Button>
        </div>
      )}

      <h1 className="text-xl font-bold">Perfil del Estudiante</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Header */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-lg">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{student.name}</CardTitle>
                <p className="text-muted-foreground">
                  {student.certificationType} • {student.age} años
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nombre Completo
              </label>
              <p className="text-sm">{student.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Edad
              </label>
              <p className="text-sm">{student.age} años</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Nacimiento
              </label>
              <p className="text-sm">
                {new Date(student.birthDate).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Dirección
              </label>
              <p className="text-sm">{student.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Teléfono de Contacto
              </label>
              <p className="text-sm">{student.contactPhone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Académica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Certificación
              </label>
              <p className="text-sm">{student.certificationType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Graduación
              </label>
              <p className="text-sm">
                {new Date(student.graduationDate).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Va Nivelado
              </label>
              <p className="text-sm">
                {student.isLeveled ? "Sí" : "No"}
              </p>
            </div>
            {student.isLeveled && student.expectedLevel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nivel Esperado
                </label>
                <p className="text-sm">{student.expectedLevel}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* A.C.E. Projections */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Proyecciones Académicas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Planificación semanal de PACEs por año escolar
            </p>
            {(isParentView || isStudentView) ? (
              <LinkButton
                variant="outline"
                size="default"
                showChevron={false}
                className="w-full cursor-pointer"
                onClick={() => navigate(`/students/${student.id}/projections`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver Proyecciones
              </LinkButton>
            ) : (
              <LinkButton
                variant="default"
                size="lg"
                showChevron={false}
                className="w-full max-w-xs cursor-pointer"
                onClick={() => navigate(`/students/${student.id}/projections`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Administrar Proyecciones
              </LinkButton>
            )}
          </CardContent>
        </Card>

        {/* Parents Information - Hidden for parent users */}
        {!isParentView && !isStudentView && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información de Padres</CardTitle>
            </CardHeader>
            <CardContent>
              {student.parents.length > 0 ? (
                <div className="space-y-2">
                  {student.parents.map((parent) => (
                    <div
                      key={parent.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(parent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{parent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Padre/Madre
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto cursor-pointer"
                        onClick={() => {
                          setSelectedParent(parent)
                          setIsParentDialogOpen(true)
                        }}
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No se ha registrado información de padres
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Parent Profile Dialog */}
        {selectedParent && (
          <ParentProfileDialog
            open={isParentDialogOpen}
            onOpenChange={(open) => {
              setIsParentDialogOpen(open)
              if (!open) {
                setSelectedParent(null)
              }
            }}
            parent={selectedParent}
          />
        )}
      </div>
    </div>
  )
}
