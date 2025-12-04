import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { Loading } from "@/components/ui/loading"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, BookOpen, Users } from "lucide-react"
import { LinkButton } from "@/components/ui/link-button"
import { getInitials } from "@/lib/string-utils"
import type { Student } from "@/types/student"

export default function MyProfilePage() {
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const navigate = useNavigate()
  const [student, setStudent] = React.useState<Student | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>("loading")

  const calculateAge = (birthDateIso: string): number => {
    const birthDate = new Date(birthDateIso)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!userInfo) return

      try {
        setStatus('loading')
        console.info('[MyProfile] User info loaded:', {
          id: userInfo.id,
          studentId: userInfo.studentId,
          studentProfile: userInfo.studentProfile,
          roles: userInfo.roles.map((role) => role.name),
        })

        if (userInfo.studentProfile) {
          const profile = userInfo.studentProfile
          const derivedStudent: Student = {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            name: profile.name,
            birthDate: profile.birthDate,
            graduationDate: profile.graduationDate,
            certificationType: profile.certificationType ?? 'Sin certificación',
            phone: (profile as { phone?: string }).phone ?? '',
            isLeveled: profile.isLeveled,
            expectedLevel: profile.expectedLevel,
            currentLevel: (profile as { currentLevel?: string }).currentLevel,
            streetAddress: (profile as { streetAddress?: string }).streetAddress,
            city: (profile as { city?: string }).city,
            state: (profile as { state?: string }).state,
            country: (profile as { country?: string }).country,
            zipCode: (profile as { zipCode?: string }).zipCode,
            parents: profile.parents ?? [],
            age: calculateAge(profile.birthDate),
            isActive: ((profile as { isActive?: boolean }).isActive ?? true),
          }

          setStudent(derivedStudent)
          setStatus('ready')
        } else {
          console.warn('[MyProfile] No student profile found in userInfo')
          setStatus('error')
          setError('Aún no se ha registrado tu perfil como estudiante. Contacta al administrador de la escuela.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar el perfil'
        console.error('Error loading my profile (outer catch):', err)
        setError(message)
        setStatus('error')
      }
    }

    loadProfile()
  }, [userInfo])

  if (isLoadingUser || status === 'loading') {
    return <Loading variant="profile" />
  }

  if (status === 'error') {
    return (
      <div className="space-y-6">
        <ErrorAlert title="Error al cargar" message={error ?? 'No se pudo cargar el perfil'} />
      </div>
    )
  }

  if (student) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <LinkButton
              variant="default"
              className="cursor-pointer"
              onClick={() => navigate(`/students/${student.id}/projections`)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Ver Proyecciones
            </LinkButton>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                <p className="text-sm">{student.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Edad</label>
                <p className="text-sm">{student.age} años</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</label>
                <p className="text-sm">{new Date(student.birthDate).toLocaleDateString("es-MX")}</p>
              </div>
              {(student.streetAddress || student.city) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-sm">{[student.streetAddress, student.city, student.state].filter(Boolean).join(', ')}</p>
                </div>
              )}
              {student.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm">{student.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información Académica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Certificación</label>
                <p className="text-sm">{student.certificationType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Graduación</label>
                <p className="text-sm">{new Date(student.graduationDate).toLocaleDateString("es-MX")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nivelado</label>
                <p className="text-sm">{student.isLeveled ? "Sí" : "No"}</p>
              </div>
              {student.expectedLevel && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nivel Esperado</label>
                  <p className="text-sm">{student.expectedLevel}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Padres / Tutores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.parents && student.parents.length > 0 ? (
                <div className="space-y-3">
                  {student.parents.map((parent) => (
                    <div key={parent.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(parent.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{parent.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No se han registrado padres o tutores.</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Proyecciones Académicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Revisa tus proyecciones para conocer los PACEs planificados en cada periodo.
              </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
