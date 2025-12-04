import * as React from "react"
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom"
import { UserProfile } from "@/components/user-profile"
import { Loading } from "@/components/ui/loading"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const api = useApi()
  const { userInfo } = useUser()
  const { t } = useTranslation()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [targetUser, setTargetUser] = React.useState<any>(null)
  const [deactivateConfirmation, setDeactivateConfirmation] = React.useState<{
    open: boolean
    userId: string
    userName: string
    userEmail: string
  }>({ open: false, userId: '', userName: '', userEmail: '' })
  const [deactivateEmailInput, setDeactivateEmailInput] = React.useState('')
  const [reactivateConfirmation, setReactivateConfirmation] = React.useState<{
    open: boolean
    userId: string
    userName: string
  }>({ open: false, userId: '', userName: '' })
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    open: boolean
    userId: string
    userName: string
    userEmail: string
  }>({ open: false, userId: '', userName: '', userEmail: '' })
  const [deleteEmailInput, setDeleteEmailInput] = React.useState('')
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  // Fetch user info to check permissions and get target user
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userInfo) return

        const isSuperAdmin = userInfo.roles.some((role: { name: string }) => role.name === 'SUPERADMIN')
        const isSchoolAdmin = userInfo.roles.some((role: { name: string }) => role.name === 'SCHOOL_ADMIN') &&
          !isSuperAdmin
        const hasUserReadPermission = userInfo.permissions?.includes('users.read') ?? false

        // SUPERADMIN can view any user
        if (isSuperAdmin && hasUserReadPermission) {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // SCHOOL_ADMIN can view teachers from their school
        if (isSchoolAdmin && userId) {
          try {
            // Use /me/teachers endpoint for school admins to avoid permission issues
            const teachers = await api.schools.getMyTeachers()
            const teacher = teachers.find((t: { id: string }) => t.id === userId)

            if (teacher) {
              setTargetUser({
                ...teacher,
                isActive: teacher.isActive !== undefined ? teacher.isActive : true
              })
              setHasPermission(true)
              setLoading(false)
              return
            }
          } catch (err) {
            console.error('Error fetching teachers:', err)
          }
        }

        setHasPermission(false)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching user info:', err)
        setError('Error al cargar información del usuario')
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userInfo])

  const handleBackToList = () => {
    // If coming from teachers page, go back to teachers
    if (location.state?.fromTeachers || location.pathname.includes('/teachers')) {
      const schoolId = userInfo?.schoolId
      if (schoolId) {
        navigate(`/schools/${schoolId}/teachers`)
      } else {
        navigate('/school-settings/school-info')
      }
    } else {
      navigate('/users')
    }
  }

  // Show loading state
  if (loading) {
    return <Loading variant="profile" />
  }

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Error al cargar"
          message={error}
        />
      </div>
    )
  }

  const handleDeactivateUser = (user: any) => {
    setDeactivateConfirmation({
      open: true,
      userId: user.id,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userEmail: user.email
    })
    setDeactivateEmailInput('')
  }

  const confirmDeactivateUser = async () => {
    if (deactivateEmailInput !== deactivateConfirmation.userEmail) {
      setError(t("users.emailMismatchError"))
      return
    }

    try {
      await api.deactivateUser(deactivateConfirmation.userId)
      toast.success(t("users.deactivateSuccess", { userName: deactivateConfirmation.userName }))
      setDeactivateConfirmation({ open: false, userId: '', userName: '', userEmail: '' })
      setDeactivateEmailInput('')
      // Refresh user data
      setRefreshTrigger(prev => prev + 1)
      // Reload target user
      if (userId) {
        try {
          const users = await api.getUsers()
          const updatedUser = users.find((u: any) => u.id === userId)
          if (updatedUser) {
            setTargetUser(updatedUser)
          }
        } catch (err) {
          console.error('Error refreshing user:', err)
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.deactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleReactivateUser = (user: any) => {
    setReactivateConfirmation({
      open: true,
      userId: user.id,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    })
  }

  const confirmReactivateUser = async () => {
    try {
      await api.reactivateUser(reactivateConfirmation.userId)
      toast.success(t("users.reactivateSuccess", { userName: reactivateConfirmation.userName }))
      setReactivateConfirmation({ open: false, userId: '', userName: '' })
      // Refresh user data
      setRefreshTrigger(prev => prev + 1)
      // Reload target user - try both endpoints for school admins
      if (userId) {
        try {
          const isSchoolAdmin = userInfo?.roles.some((role: { name: string }) => role.name === 'SCHOOL_ADMIN') &&
            !userInfo?.roles.some((role: { name: string }) => role.name === 'SUPERADMIN')

          let updatedUser: { id: string;[key: string]: unknown } | undefined = undefined
          if (isSchoolAdmin) {
            try {
              const teachers = await api.schools.getMyTeachers()
              updatedUser = teachers.find((t: { id: string }) => t.id === userId)
            } catch {
              // Fall back to getUsers if /me/teachers fails
              try {
                const users = await api.getUsers()
                updatedUser = users.find((u: { id: string }) => u.id === userId)
              } catch (usersErr) {
                console.error('Error refreshing user:', usersErr)
              }
            }
          } else {
            const users = await api.getUsers()
            updatedUser = users.find((u: { id: string }) => u.id === userId)
          }

          if (updatedUser) {
            setTargetUser({
              ...updatedUser,
              isActive: updatedUser.isActive !== undefined ? updatedUser.isActive : true
            })
          }
        } catch (err) {
          console.error('Error refreshing user:', err)
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.reactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleDeleteUser = (user: any) => {
    setDeleteConfirmation({
      open: true,
      userId: user.id,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      userEmail: user.email
    })
    setDeleteEmailInput('')
  }

  const confirmDeleteUser = async () => {
    if (deleteEmailInput !== deleteConfirmation.userEmail) {
      setError(t("users.emailMismatchError"))
      return
    }

    try {
      await api.deleteUser(deleteConfirmation.userId)
      toast.success(t("users.deleteSuccess", { userName: deleteConfirmation.userName }))
      setDeleteConfirmation({ open: false, userId: '', userName: '', userEmail: '' })
      setDeleteEmailInput('')
      // Navigate back to users list after deletion
      navigate('/users')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.deleteError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Show user profile if we have a userId
  if (userId) {
    const isSuperAdmin = userInfo?.roles.some((role: { name: string }) => role.name === 'SUPERADMIN')
    const isSchoolAdmin = userInfo?.roles.some((role: { name: string }) => role.name === 'SCHOOL_ADMIN') && !isSuperAdmin
    // School admins can manage teachers from their school
    const canManage = (isSuperAdmin && (userInfo?.permissions?.includes('users.delete') ?? false)) || isSchoolAdmin
    // Prevent users from deactivating/deleting themselves
    const isCurrentUser = userInfo?.id === userId || userInfo?.email === targetUser?.email
    const canDeactivate = canManage && !isCurrentUser
    const canReactivate = canManage && !isCurrentUser
    const canDelete = canManage && !isCurrentUser

    return (
      <>
        <UserProfile
          key={refreshTrigger}
          userId={userId}
          onBack={handleBackToList}
          user={targetUser}
          onDeactivate={canDeactivate ? handleDeactivateUser : undefined}
          onReactivate={canReactivate ? handleReactivateUser : undefined}
          onDelete={canDelete ? handleDeleteUser : undefined}
          canManage={canDeactivate || canReactivate || canDelete}
          currentUserId={userInfo?.id}
          currentUserEmail={userInfo?.email}
        />

        {/* Deactivate Confirmation Dialog */}
        <Dialog open={deactivateConfirmation.open} onOpenChange={(open) => setDeactivateConfirmation({ ...deactivateConfirmation, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("users.deactivateConfirm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm font-semibold text-orange-800 mb-2">{t("common.important")}</p>
                <p className="text-sm text-orange-700">{t("users.deactivateWarning")}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t("users.deactivateConfirmMessage", { userName: deactivateConfirmation.userName })}
              </p>
              <p className="text-sm text-gray-600">
                {t("users.typeEmailToConfirmDeactivate", { userEmail: deactivateConfirmation.userEmail })}
              </p>
              <div>
                <Label htmlFor="deactivate-email">{t("users.email")}</Label>
                <Input
                  id="deactivate-email"
                  type="email"
                  value={deactivateEmailInput}
                  onChange={(e) => setDeactivateEmailInput(e.target.value)}
                  placeholder={t("users.deactivateEmailPlaceholder")}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setDeactivateConfirmation({ ...deactivateConfirmation, open: false })}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeactivateUser}
                  disabled={deactivateEmailInput !== deactivateConfirmation.userEmail}
                >
                  {t("users.deactivateUser")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reactivate Confirmation Dialog */}
        <Dialog open={reactivateConfirmation.open} onOpenChange={(open) => setReactivateConfirmation({ ...reactivateConfirmation, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-600">{t("users.reactivateConfirm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-semibold text-green-800 mb-2">{t("common.important")}</p>
                <p className="text-sm text-green-700">{t("users.reactivateWarning")}</p>
                <p className="text-sm text-green-600 mt-2">{t("users.reactivateNote")}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t("users.reactivateConfirmMessage", { userName: reactivateConfirmation.userName })}
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setReactivateConfirmation({ ...reactivateConfirmation, open: false })}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={confirmReactivateUser}
                >
                  {t("users.reactivateUser")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmation.open} onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("users.deleteConfirm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-semibold text-red-800 mb-2">{t("common.important")}</p>
                <p className="text-sm text-red-700">{t("users.deleteWarning")}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t("users.deleteConfirmMessage", { userName: deleteConfirmation.userName })}
              </p>
              <p className="text-sm text-gray-600">
                {t("users.typeEmailToConfirm", { userEmail: deleteConfirmation.userEmail })}
              </p>
              <div>
                <Label htmlFor="delete-email">{t("users.email")}</Label>
                <Input
                  id="delete-email"
                  type="email"
                  value={deleteEmailInput}
                  onChange={(e) => setDeleteEmailInput(e.target.value)}
                  placeholder={t("users.deleteEmailPlaceholder")}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ ...deleteConfirmation, open: false })}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteUser}
                  disabled={deleteEmailInput !== deleteConfirmation.userEmail}
                >
                  {t("users.deleteUser")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Fallback if no userId
  return (
    <div className="space-y-6">
      <ErrorAlert
        title="Error"
        message="ID de usuario no encontrado"
      />
    </div>
  )
}