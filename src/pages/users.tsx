import * as React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, Edit, Trash2, User, MoreVertical } from "lucide-react"
import { useApi } from "@/services/api"
import type { UserInfo } from "@/services/api"

interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  schoolId: string
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  primaryRole?: {
    id: string
    name: string
    displayName: string
  }
}

interface Role {
  id: string
  name: string
  displayName: string
  description?: string
}

export default function UsersPage() {
  const { schoolId } = useParams()
  const api = useApi()
  const navigate = useNavigate()
  const [users, setUsers] = React.useState<User[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [schools, setSchools] = React.useState<Array<{ id: string, name: string }>>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    open: boolean
    userId: string
    userName: string
    userEmail: string
  }>({ open: false, userId: '', userName: '', userEmail: '' })
  const [deleteEmailInput, setDeleteEmailInput] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Form state for create/edit
  const [formData, setFormData] = React.useState({
    clerkId: "",
    email: "",
    firstName: "",
    lastName: "",
    schoolId: "",
    roleIds: [] as string[]
  })

  const loadUserInfo = React.useCallback(async () => {
    try {
      const info = await api.auth.getUserInfo()
      setUserInfo(info)

      // Check if user has permission to manage users
      const canManageUsers = info.permissions.includes('users.read')
      setHasPermission(canManageUsers)

      if (!canManageUsers) {
        setError("No tienes permisos para acceder a esta página.")
        return
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar información del usuario"
      setError(errorMessage)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoading(true)

      // If we have a schoolId from the route, fetch teachers for that specific school
      // Otherwise, fetch all users (filtered by permissions)
      const usersData = schoolId
        ? await api.schools.getTeachers(schoolId)
        : await api.getUsers()

      setUsers(usersData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar usuarios"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [schoolId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRoles = React.useCallback(async () => {
    try {
      const rolesData = await api.getAvailableRoles()
      setRoles(rolesData)
    } catch (err: unknown) {
      console.error("Error loading roles:", err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchools = React.useCallback(async () => {
    try {
      const schoolsData = await api.schools.getAll()
      setSchools(schoolsData)
    } catch (err: unknown) {
      console.error("Error loading schools:", err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    loadUserInfo()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (userInfo) {
      loadUsers()
      loadRoles()
      loadSchools()
    }
  }, [userInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateUser = async () => {
    try {
      await api.createUser(formData)
      setIsCreateDialogOpen(false)
      resetForm()
      loadUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear usuario"
      setError(errorMessage)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const updateData: {
        firstName: string
        lastName: string
        roleIds: string[]
        email?: string
        schoolId?: string
      } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleIds: formData.roleIds
      }

      // Only superadmins can update email and school
      if (userInfo?.roles.some(role => role.name === 'SUPERADMIN')) {
        updateData.email = formData.email
        updateData.schoolId = formData.schoolId
      }

      await api.updateUser(selectedUser.id, updateData)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar usuario"
      setError(errorMessage)
    }
  }

  const handleDeleteUser = (userId: string, userName: string, userEmail: string) => {
    setDeleteConfirmation({
      open: true,
      userId,
      userName,
      userEmail
    })
    setDeleteEmailInput('')
  }

  const confirmDeleteUser = async () => {
    if (deleteEmailInput !== deleteConfirmation.userEmail) {
      setError('El email ingresado no coincide con el email del usuario')
      return
    }

    try {
      await api.deleteUser(deleteConfirmation.userId)
      loadUsers()
      setDeleteConfirmation({ open: false, userId: '', userName: '', userEmail: '' })
      setDeleteEmailInput('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar usuario"
      setError(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      clerkId: "",
      email: "",
      firstName: "",
      lastName: "",
      schoolId: userInfo?.schoolId || "",
      roleIds: []
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      schoolId: user.schoolId || "",
      roleIds: user.roles.map(r => r.id)
    })
    setIsEditDialogOpen(true)
  }

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
    const email = user.email.toLowerCase()
    const search = searchTerm.toLowerCase()

    return fullName.includes(search) || email.includes(search)
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button for school context */}
      {schoolId && (
        <BackButton onClick={() => navigate(`/schools/${schoolId}`)}>
          Volver a Información de la Escuela
        </BackButton>
      )}

      <PageHeader
        title={schoolId ? "Maestros de la Escuela" : "Gestión de Usuarios"}
        description={schoolId ? "Administra los maestros de esta escuela específica" : "Administra los usuarios del sistema"}
      />

      {error && (
        <ErrorAlert
          title="Error"
          message={error}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usuarios</CardTitle>
            {userInfo?.permissions.includes('users.create') && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Usuario</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Escuela</th>
                    <th className="text-left py-3 px-4">Roles</th>
                    <th className="text-left py-3 px-4 w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email
                          }
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        {(() => {
                          const school = schools.find(s => s.id === user.schoolId);
                          return school ? school.name : 'Sin asignar';
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary">
                              {role.displayName}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 w-16">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                              <User className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {userInfo?.permissions.includes('users.update') && (
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {userInfo?.permissions.includes('users.delete') && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(
                                  user.id,
                                  user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.email,
                                  user.email
                                )}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-500">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>
                  }
                  return null
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clerkId">Clerk ID</Label>
              <Input
                id="clerkId"
                value={formData.clerkId}
                onChange={(e) => setFormData({ ...formData, clerkId: e.target.value })}
                placeholder="user_xxxxx"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
              />
            </div>
            {userInfo?.roles.some(role => role.name === 'SUPERADMIN') && (
              <div>
                <Label>Escuela</Label>
                <Select
                  value={formData.schoolId}
                  onValueChange={(value: string) => setFormData({ ...formData, schoolId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar escuela" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Roles</Label>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(value: string) => setFormData({ ...formData, roleIds: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                Crear Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-firstName">Nombre</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Apellido</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            {userInfo?.roles.some(role => role.name === 'SUPERADMIN') && (
              <div>
                <Label>Escuela</Label>
                <Select
                  value={formData.schoolId}
                  onValueChange={(value: string) => setFormData({ ...formData, schoolId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar escuela" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Roles</Label>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(value: string) => setFormData({ ...formData, roleIds: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser}>
                Actualizar Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.open} onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres eliminar al usuario <strong>"{deleteConfirmation.userName}"</strong>?
              Esta acción no se puede deshacer.
            </p>
            <p className="text-sm text-gray-600">
              Para confirmar, escribe el email del usuario: <strong>{deleteConfirmation.userEmail}</strong>
            </p>
            <div>
              <Label htmlFor="delete-email">Email del usuario</Label>
              <Input
                id="delete-email"
                type="email"
                value={deleteEmailInput}
                onChange={(e) => setDeleteEmailInput(e.target.value)}
                placeholder="Escribe el email aquí"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation({ ...deleteConfirmation, open: false })}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={deleteEmailInput !== deleteConfirmation.userEmail}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}
