import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Building } from "lucide-react"
import { useApi } from "@/services/api"
import type { UserInfo } from "@/services/api"
import { SchoolsTable } from "@/components/schools-table"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
}

export default function SchoolsPage() {
  const api = useApi()
  const navigate = useNavigate()
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
        info.roles.some((role: { name: string }) => role.name === 'SUPERADMIN')
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
    // Search filter (accent-insensitive)
    return !searchTerm ||
      includesIgnoreAccents(school.name, searchTerm) ||
      includesIgnoreAccents(school.address, searchTerm) ||
      includesIgnoreAccents(school.email || "", searchTerm)
  })

  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage)
  const paginatedSchools = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSchools.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSchools, currentPage, itemsPerPage])

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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
        />
      )}

      {/* Search */}
      <SearchBar
        placeholder="Buscar escuelas por nombre, dirección o email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Create Button */}
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Escuela
        </Button>
      </div>

      {/* Schools Table */}
      {filteredSchools.length > 0 ? (
        <SchoolsTable
          schools={paginatedSchools}
          onSchoolSelect={(school) => navigate(`/schools/${school.id}`)}
          onEdit={userInfo?.permissions.includes('schools.update') ? openEditDialog : undefined}
          onDelete={userInfo?.permissions.includes('schools.delete') ? handleDeleteSchool : undefined}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSchools.length}
          onPageChange={setCurrentPage}
          canEdit={userInfo?.permissions.includes('schools.update') ?? false}
          canDelete={userInfo?.permissions.includes('schools.delete') ?? false}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron escuelas</p>
          </CardContent>
        </Card>
      )}

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
