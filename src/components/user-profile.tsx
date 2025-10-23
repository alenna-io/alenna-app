import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/string-utils"
import { useApi } from "@/services/api"
import * as React from "react"

interface UserProfileProps {
  userId: string
  onBack: () => void
}

interface UserDetail {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  schoolId?: string
  schoolName?: string
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  createdAt: string
  updatedAt: string
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const api = useApi()
  const [user, setUser] = React.useState<UserDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadUser = React.useCallback(async () => {
    try {
      // For now, we'll need to get user details from the users list
      // In the future, we can create a specific API endpoint for user details
      const users = await api.getUsers()
      const userDetail = users.find((u: any) => u.id === userId)

      if (userDetail) {
        // Get school name if schoolId exists
        let schoolName = undefined
        if (userDetail.schoolId) {
          try {
            const schools = await api.schools.getAll()
            const school = schools.find((s: any) => s.id === userDetail.schoolId)
            schoolName = school?.name
          } catch (err) {
            console.error('Error loading school:', err)
          }
        }

        setUser({
          ...userDetail,
          schoolName,
          createdAt: new Date().toISOString(), // Placeholder - would come from API
          updatedAt: new Date().toISOString() // Placeholder - would come from API
        })
      } else {
        setError('Usuario no encontrado')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar usuario"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    loadUser()
  }, [loadUser])

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Volver a Usuarios
        </Button>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Volver a Usuarios
        </Button>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Volver a Usuarios
        </Button>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Usuario no encontrado</p>
        </div>
      </div>
    )
  }

  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-4"
        >
          ← Volver a Usuarios
        </Button>
      </div>

      <h1 className="text-3xl font-bold">Perfil del Usuario</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Header */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{fullName}</CardTitle>
                <p className="text-muted-foreground">
                  {user.email}
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
                Nombre
              </label>
              <p className="text-sm">{user.firstName || 'No especificado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Apellido
              </label>
              <p className="text-sm">{user.lastName || 'No especificado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                ID de Usuario
              </label>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                {user.id}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Clerk ID
              </label>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                {user.clerkId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* School and Role Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Acceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Escuela
              </label>
              <p className="text-sm">{user.schoolName || 'No asignada'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Roles
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.roles.map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.displayName}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Creación
              </label>
              <p className="text-sm">
                {new Date(user.createdAt).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Última Actualización
              </label>
              <p className="text-sm">
                {new Date(user.updatedAt).toLocaleDateString("es-MX")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
