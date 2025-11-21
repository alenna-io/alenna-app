import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Building } from "lucide-react"
import { useApi } from "@/services/api"
import type { UserInfo } from "@/services/api"
import { SchoolsTable } from "@/components/schools-table"
import { SchoolFormDialog } from "@/components/school-form-dialog"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"
import { ErrorDialog } from "@/components/ui/error-dialog"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  teacherLimit?: number
  userLimit?: number
  isActive?: boolean
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
  const [deactivateConfirmation, setDeactivateConfirmation] = React.useState<{
    open: boolean
    schoolId: string
    schoolName: string
    schoolEmail: string
  }>({ open: false, schoolId: '', schoolName: '', schoolEmail: '' })
  const [deactivateEmailInput, setDeactivateEmailInput] = React.useState('')
  const [updatingSchools, setUpdatingSchools] = React.useState<Set<string>>(new Set())
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
        setError(t("common.accessDeniedMessage"))
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
    navigate("/schools/create")
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
    adminEmail?: string
    adminFirstName?: string
    adminLastName?: string
  }) => {
    try {
      if (editingSchool) {
        await api.schools.updateById(editingSchool.id, data)
      } else {
        // Create school first
        const createdSchool = await api.schools.create(data)

        // If admin user info is provided, create a school admin user
        if (data.adminEmail && data.adminFirstName && data.adminLastName && createdSchool?.id) {
          try {
            // Get available roles to find SCHOOL_ADMIN role
            const roles = await api.getAvailableRoles()
            const schoolAdminRole = roles.find((role: { name: string }) => role.name === 'SCHOOL_ADMIN')

            if (schoolAdminRole) {
              await api.createUser({
                email: data.adminEmail,
                firstName: data.adminFirstName,
                lastName: data.adminLastName,
                schoolId: createdSchool.id,
                roleIds: [schoolAdminRole.id],
                // Clerk ID will be created automatically by the backend
              })
            }
          } catch (userError) {
            console.error('Error creating school admin user:', userError)
            // Don't fail the whole operation if user creation fails
            // The school was created successfully
          }
        }
      }
      setIsDialogOpen(false)
      setEditingSchool(null)
      setError(null)
      loadSchools()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message :
        editingSchool ? t("schools.updateError") : t("schools.createError")
      setErrorDialog({
        open: true,
        title: "Error",
        message: errorMessage,
      })
      throw err // Re-throw so dialog stays open
    }
  }

  const handleActivateSchool = async (school: School) => {
    const schoolId = school.id

    // Optimistic update
    setSchools(prevSchools => prevSchools.map(s =>
      s.id === schoolId ? { ...s, isActive: true } : s
    ))
    setUpdatingSchools(prev => new Set(prev).add(schoolId))

    try {
      await api.schools.activate(schoolId)
      toast.success(t("schools.activateSchoolSuccess", { schoolName: school.name }))
      setError(null)
      // Refresh to get actual state from server
      loadSchools()
    } catch (err: unknown) {
      // Revert optimistic update on error
      setSchools(prevSchools => prevSchools.map(s =>
        s.id === schoolId ? { ...s, isActive: false } : s
      ))
      const errorMessage = err instanceof Error ? err.message : t("schools.activateSchoolError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdatingSchools(prev => {
        const next = new Set(prev)
        next.delete(schoolId)
        return next
      })
    }
  }

  const handleDeactivateSchool = (school: School) => {
    // Prevent deactivation of Alenna school
    if (school.name.toLowerCase() === "alenna") {
      toast.error(t("schools.cannotDeactivateAlenna"))
      return
    }

    setDeactivateConfirmation({
      open: true,
      schoolId: school.id,
      schoolName: school.name,
      schoolEmail: school.email || ''
    })
    setDeactivateEmailInput('')
  }

  const confirmDeactivateSchool = async () => {
    if (deactivateEmailInput !== deactivateConfirmation.schoolEmail) {
      setError(t("schools.emailMismatchError"))
      return
    }

    const schoolId = deactivateConfirmation.schoolId
    const schoolName = deactivateConfirmation.schoolName

    // Optimistic update
    setSchools(prevSchools => prevSchools.map(s =>
      s.id === schoolId ? { ...s, isActive: false } : s
    ))
    setUpdatingSchools(prev => new Set(prev).add(schoolId))
    setDeactivateConfirmation({ open: false, schoolId: '', schoolName: '', schoolEmail: '' })
    setDeactivateEmailInput('')

    try {
      await api.schools.deactivate(schoolId)
      toast.success(t("schools.deactivateSchoolSuccess", { schoolName }))
      setError(null)
      // Refresh to get actual state from server
      loadSchools()
    } catch (err: unknown) {
      // Revert optimistic update on error
      setSchools(prevSchools => prevSchools.map(s =>
        s.id === schoolId ? { ...s, isActive: true } : s
      ))
      const errorMessage = err instanceof Error ? err.message : t("schools.deactivateSchoolError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdatingSchools(prev => {
        const next = new Set(prev)
        next.delete(schoolId)
        return next
      })
    }
  }

  const handleDeleteSchool = (school: School) => {
    // Prevent deletion of Alenna school
    if (school.name.toLowerCase() === "alenna") {
      toast.error(t("schools.cannotDeleteAlenna"))
      return
    }

    setDeleteConfirmation({
      open: true,
      schoolId: school.id,
      schoolName: school.name,
    })
    setDeleteNameInput('')
  }

  const confirmDeleteSchool = async () => {
    if (deleteNameInput !== deleteConfirmation.schoolName) {
      setError(t("schools.nameMismatchError"))
      return
    }

    try {
      await api.schools.delete(deleteConfirmation.schoolId)
      toast.success(t("schools.deleteSuccess", { schoolName: deleteConfirmation.schoolName }))
      setDeleteConfirmation({ open: false, schoolId: '', schoolName: '' })
      setDeleteNameInput('')
      loadSchools()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("schools.deleteError")
      setError(errorMessage)
      toast.error(errorMessage)
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
      {error && (
        <ErrorAlert
          title={t("common.error")}
          message={error}
        />
      )}

      <div className="flex items-center justify-between">
        <PageHeader
          title={t("schools.title")}
          description={t("schools.description")}
        />
        <Button onClick={handleCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          {t("common.create")} {t("schools.school")}
        </Button>
      </div>

      {/* Search */}
      <SearchBar
        placeholder={t("schools.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Schools Table */}
      {filteredSchools.length > 0 ? (
        <SchoolsTable
          schools={paginatedSchools}
          onSchoolSelect={(school) => navigate(`/schools/${school.id}`)}
          onEdit={userInfo?.permissions.includes('schools.update') ? handleEdit : undefined}
          onDelete={userInfo?.permissions.includes('schools.delete') ? handleDeleteSchool : undefined}
          onActivate={userInfo?.permissions.includes('schools.update') ? handleActivateSchool : undefined}
          onDeactivate={userInfo?.permissions.includes('schools.update') ? handleDeactivateSchool : undefined}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSchools.length}
          onPageChange={setCurrentPage}
          canEdit={userInfo?.permissions.includes('schools.update') ?? false}
          canDelete={userInfo?.permissions.includes('schools.delete') ?? false}
          updatingSchools={updatingSchools}
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
        title={errorDialog.title || t("common.error")}
        message={errorDialog.message}
        confirmText={t("common.accept")}
      />

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateConfirmation.open} onOpenChange={(open) => setDeactivateConfirmation({ ...deactivateConfirmation, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600">{t("schools.deactivateConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm font-semibold text-orange-800 mb-2">{t("common.important")}</p>
              <p className="text-sm text-orange-700">{t("schools.deactivateWarning")}</p>
            </div>
            <p className="text-sm text-gray-700">
              {t("schools.deactivateConfirmMessage", { schoolName: deactivateConfirmation.schoolName })}
            </p>
            <p className="text-sm text-gray-600">
              {t("schools.typeEmailToConfirmDeactivate", { schoolEmail: deactivateConfirmation.schoolEmail })}
            </p>
            <div>
              <Label htmlFor="deactivate-email">{t("schools.email")}</Label>
              <Input
                id="deactivate-email"
                type="email"
                value={deactivateEmailInput}
                onChange={(e) => setDeactivateEmailInput(e.target.value)}
                placeholder={t("schools.deactivateEmailPlaceholder")}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setDeactivateConfirmation({ ...deactivateConfirmation, open: false })}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeactivateSchool}
                disabled={deactivateEmailInput !== deactivateConfirmation.schoolEmail}
              >
                {t("schools.deactivateSchool")}
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
            <DialogTitle>{t("schools.deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("schools.deleteConfirmMessage")}
            </p>
            <p className="font-medium">{deleteConfirmation.schoolName}</p>
            <p className="text-sm text-gray-600">
              {t("schools.typeNameToConfirm")}
            </p>
            <Input
              value={deleteNameInput}
              onChange={(e) => setDeleteNameInput(e.target.value)}
              placeholder={t("schools.deleteNamePlaceholder")}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation({ open: false, schoolId: '', schoolName: '' })}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSchool}
                disabled={deleteNameInput !== deleteConfirmation.schoolName}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
