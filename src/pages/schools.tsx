import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Building } from "lucide-react"
import { useApi } from "@/services/api"
import type { UserInfo } from "@/services/api"
import { SchoolsTable } from "@/components/schools-table"
import { SchoolFormDialog } from "@/components/school-form-dialog"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"
import { ErrorDialog } from "@/components/ui/error-dialog"
import { useTranslation } from "react-i18next"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  teacherLimit?: number
  userLimit?: number
}

export default function SchoolsPage() {
  const api = useApi()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [schools, setSchools] = React.useState<School[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingSchool, setEditingSchool] = React.useState<School | null>(null)
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean
    title?: string
    message: string
  }>({ open: false, message: "" })
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    open: boolean
    schoolId: string
    schoolName: string
  }>({ open: false, schoolId: '', schoolName: '' })
  const [deleteNameInput, setDeleteNameInput] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

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
      const errorMessage = err instanceof Error ? err.message : t("common.error")
      setError(errorMessage)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchools = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const schoolsData = await api.schools.getAll()
      setSchools(schoolsData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("common.error")
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

  const handleCreate = () => {
    setEditingSchool(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (school: School) => {
    setEditingSchool(school)
    setIsDialogOpen(true)
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

  const handleSave = async (data: {
    name: string
    address: string
    phone?: string
    email?: string
    teacherLimit?: number
    userLimit?: number
  }) => {
    try {
      if (editingSchool) {
        await api.schools.updateById(editingSchool.id, data)
      } else {
        await api.schools.create(data)
      }
      setIsDialogOpen(false)
      setEditingSchool(null)
      setError(null)
      loadSchools()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message :
        editingSchool ? "Error al actualizar escuela" : "Error al crear escuela"
      setErrorDialog({
        open: true,
        title: "Error",
        message: errorMessage,
      })
      throw err // Re-throw so dialog stays open
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
    return <Loading variant="list" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("schools.title")}
        description={t("schools.description")}
      />

      {error && (
        <ErrorAlert
          title="Error"
          message={error}
        />
      )}

      {/* Search */}
      <SearchBar
        placeholder={t("schools.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Create Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          {t("common.create")} {t("schools.title")}
        </Button>
      </div>

      {/* Schools Table */}
      {filteredSchools.length > 0 ? (
        <SchoolsTable
          schools={paginatedSchools}
          onSchoolSelect={(school) => navigate(`/schools/${school.id}`)}
          onEdit={userInfo?.permissions.includes('schools.update') ? handleEdit : undefined}
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
            <p className="text-muted-foreground">{t("schools.noSchools")}</p>
          </CardContent>
        </Card>
      )}

      {/* School Form Dialog */}
      <SchoolFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingSchool(null)
          }
        }}
        school={editingSchool}
        onSave={handleSave}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        confirmText="Aceptar"
      />

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
