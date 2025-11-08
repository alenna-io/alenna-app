import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "@/services/api"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, BookOpen, Users } from "lucide-react"
import { LinkButton } from "@/components/ui/link-button"
import { getInitials } from "@/lib/string-utils"
import type { Student } from "@/types/student"

export default function MyProfilePage() {
  const api = useApi()
  const navigate = useNavigate()
  const [student, setStudent] = React.useState<Student | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error' | 'forbidden'>("loading")

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
      try {
        setStatus('loading')
        const userInfo = await api.auth.getUserInfo()
        console.info('[MyProfile] User info loaded:', {
          id: userInfo.id,
          studentId: userInfo.studentId,
          studentProfile: userInfo.studentProfile,
          roles: userInfo.roles.map((role: typeof userInfo.roles[number]) => role.name),
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
            contactPhone: profile.contactPhone ?? '',
            isLeveled: profile.isLeveled,
            expectedLevel: profile.expectedLevel,
            address: profile.address ?? '',
            parents: profile.parents ?? [],
            age: calculateAge(profile.birthDate),
          }

          setStudent(derivedStudent)
          setStatus('ready')
          return
        }

        let studentRecord: Record<string, unknown> | null = null

        if (userInfo.studentId) {
          try {
            const data = await api.students.getById(userInfo.studentId)
            studentRecord = data as Record<string, unknown>
            console.info('[MyProfile] Student retrieved by id:', studentRecord)
          } catch (error) {
            console.error('Error loading student by id:', error)
          }
        }

        if (!studentRecord) {
          try {
            const list = await api.students.getAll()
            if (Array.isArray(list)) {
              const asRecords = list as Array<Record<string, unknown>>
              if (userInfo.id) {
                studentRecord = asRecords.find((student) => {
                  const parents = (student.parents as Array<{ id: string }> | undefined) ?? []
                  return parents.some((parent) => parent.id === userInfo.id)
                }) ?? null
                if (studentRecord) {
                  console.info('[MyProfile] Student matched via parent link:', studentRecord)
                }
              }

              if (!studentRecord && asRecords.length > 0) {
                studentRecord = asRecords[0]
                console.info('[MyProfile] Using fallback first student in list:', studentRecord)
              }
            }
          } catch (error) {
            console.error('Error loading student list for profile:', error)
          }
        }

        if (!studentRecord) {
          console.warn('[MyProfile] No student record found after all checks')
          setStatus('error')
          setError('Aún no se ha registrado tu perfil como estudiante. Contacta al administrador de la escuela.')
          return
        }

        const transformedStudent: Student = {
          id: studentRecord.id as string,
          firstName: studentRecord.firstName as string,
          lastName: studentRecord.lastName as string,
          name: studentRecord.name as string,
          age: calculateAge(studentRecord.birthDate as string),
          birthDate: studentRecord.birthDate as string,
          certificationType: studentRecord.certificationType as string,
          graduationDate: studentRecord.graduationDate as string,
          parents: (studentRecord.parents || []) as Student['parents'],
          contactPhone: (studentRecord.contactPhone || '') as string,
          isLeveled: studentRecord.isLeveled as boolean,
          expectedLevel: studentRecord.expectedLevel as string | undefined,
          address: (studentRecord.address || '') as string,
        }

        setStudent(transformedStudent)
        setStatus('ready')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cargar el perfil'
        console.error('Error loading my profile (outer catch):', err)
        setError(message)
        setStatus('error')
      }
    }

    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') {
    return <LoadingState variant="profile" />
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
              {student.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-sm">{student.address}</p>
                </div>
              )}
              {student.contactPhone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm">{student.contactPhone}</p>
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
