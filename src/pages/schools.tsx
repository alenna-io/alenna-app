import * as React from "react"
import { Navigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, Edit, Trash2, Building, MoreVertical } from "lucide-react"
import { useApi } from "@/services/api"
import type { UserInfo } from "@/services/api"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
}

export default function SchoolsPage() {
  const api = useApi()
  const [schools, setSchools] = React.useState<School[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedSchool, setSelectedSchool] = React.useState<School | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    open: boolean
    schoolId: string
    schoolName: string
  }>({ open: false, schoolId: '', schoolName: '' })
  const [deleteNameInput, setDeleteNameInput] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Form state for create/edit
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  })

  const loadUserInfo = React.useCallback(async () => {
    try {
      const info = await api.auth.getUserInfo()
      setUserInfo(info)

      // Check if user has permission to manage schools (superadmin only)
      const canManageSchools = info.permissions.includes('schools.read') &&
        info.roles.some((role: any) => role.name === 'SUPERADMIN')
      setHasPermission(canManageSchools)

      if (!canManageSchools) {
        setError("No tienes permisos para acceder a esta página.")
        return
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar información del usuario"
      setError(errorMessage)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchools = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const schoolsData = await api.schools.getAll()
      setSchools(schoolsData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar escuelas"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    loadUserInfo()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (userInfo && hasPermission) {
      loadSchools()
    }
  }, [userInfo, hasPermission]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (school: School) => {
    setSelectedSchool(school)
    setFormData({
      name: school.name,
      address: school.address,
      phone: school.phone || "",
      email: school.email || "",
    })
    setIsEditDialogOpen(true)
  }

  const filteredSchools = schools.filter(school => {
    const name = school.name.toLowerCase()
    const address = school.address.toLowerCase()
    const email = school.email?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()

    return name.includes(search) || address.includes(search) || email.includes(search)
  })

  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSchools = filteredSchools.slice(startIndex, startIndex + itemsPerPage)

  const handleCreateSchool = async () => {
    try {
      await api.schools.create(formData)
      setIsCreateDialogOpen(false)
      resetForm()
      loadSchools()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear escuela"
      setError(errorMessage)
    }
  }

  const handleUpdateSchool = async () => {
    if (!selectedSchool) return

    try {
      await api.schools.updateById(selectedSchool.id, formData)
      setIsEditDialogOpen(false)
      setSelectedSchool(null)
      resetForm()
      loadSchools()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar escuela"
      setError(errorMessage)
    }
  }

  const handleDeleteSchool = (school: School) => {
    setDeleteConfirmation({
      open: true,
      schoolId: school.id,
      schoolName: school.name,
    })
    setDeleteNameInput('')
  }

  const confirmDeleteSchool = async () => {
    if (deleteNameInput !== deleteConfirmation.schoolName) {
      setError("El nombre de la escuela no coincide")
      return
    }

    try {
      await api.schools.delete(deleteConfirmation.schoolId)
      setDeleteConfirmation({ open: false, schoolId: '', schoolName: '' })
      setDeleteNameInput('')
      loadSchools()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar escuela"
      setError(errorMessage)
    }
  }

  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Escuelas"
        description="Administra las escuelas del sistema"
      />

      {error && (
        <ErrorAlert
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Escuelas</CardTitle>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Escuela
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar escuelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredSchools.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No se encontraron escuelas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nombre</th>
                    <th className="text-left py-3 px-4">Dirección</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Teléfono</th>
                    <th className="text-left py-3 px-4 w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchools.map((school) => (
                    <tr key={school.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{school.name}</div>
                      </td>
                      <td className="py-3 px-4">{school.address}</td>
                      <td className="py-3 px-4">{school.email || '-'}</td>
                      <td className="py-3 px-4">{school.phone || '-'}</td>
                      <td className="py-3 px-4 w-16">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {userInfo?.permissions.includes('schools.update') && (
                              <DropdownMenuItem onClick={() => openEditDialog(school)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {userInfo?.permissions.includes('schools.delete') && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteSchool(school)}
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

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredSchools.length)} de {filteredSchools.length} escuelas
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Escuela</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nombre de la Escuela</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la escuela"
              />
            </div>
            <div>
              <Label htmlFor="create-address">Dirección</Label>
              <Input
                id="create-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@escuela.edu"
              />
            </div>
            <div>
              <Label htmlFor="create-phone">Teléfono</Label>
              <Input
                id="create-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSchool}>
                Crear Escuela
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Escuela</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre de la Escuela</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Dirección</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
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
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateSchool}>
                Actualizar Escuela
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.open} onOpenChange={(open) =>
        setDeleteConfirmation({ ...deleteConfirmation, open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer. Esto eliminará permanentemente la escuela:
            </p>
            <p className="font-medium">{deleteConfirmation.schoolName}</p>
            <p className="text-sm text-gray-600">
              Para confirmar, escribe el nombre de la escuela:
            </p>
            <Input
              value={deleteNameInput}
              onChange={(e) => setDeleteNameInput(e.target.value)}
              placeholder="Nombre de la escuela"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation({ open: false, schoolId: '', schoolName: '' })}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSchool}
                disabled={deleteNameInput !== deleteConfirmation.schoolName}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
