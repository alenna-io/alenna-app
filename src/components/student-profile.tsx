import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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

interface StudentProfileProps {
  student: Student
  onBack: () => void
}

export function StudentProfile({ student, onBack }: StudentProfileProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Header */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{student.name}</CardTitle>
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

        {/* Parents Information */}
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
                    <Button variant="outline" size="sm" className="ml-auto">
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
      </div>
    </div>
  )
}
