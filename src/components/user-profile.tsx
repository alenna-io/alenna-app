import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { getInitials } from "@/lib/string-utils"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import * as React from "react"
import { Loading } from "@/components/ui/loading"
import { useTranslation } from "react-i18next"
import { Power, PowerOff, Trash2 } from "lucide-react"

interface UserProfileProps {
  userId: string
  onBack: () => void
  user?: any // Optional pre-loaded user data
  context?: 'users' | 'teachers'
  onDeactivate?: (user: UserDetail) => void
  onReactivate?: (user: UserDetail) => void
  onDelete?: (user: UserDetail) => void
  canManage?: boolean
  currentUserId?: string
  currentUserEmail?: string
}

interface UserDetail {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  schoolId?: string
  schoolName?: string
  isActive?: boolean
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  createdAt: string
  updatedAt: string
}

export function UserProfile({ userId, onBack, user: preloadedUser, onDeactivate, onReactivate, onDelete, canManage = false, currentUserId, currentUserEmail, context = 'users' }: UserProfileProps) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const { userInfo } = useUser()
  const [user, setUser] = React.useState<UserDetail | null>(preloadedUser ? {
    id: preloadedUser.id,
    clerkId: preloadedUser.clerkId,
    email: preloadedUser.email,
    firstName: preloadedUser.firstName,
    lastName: preloadedUser.lastName,
    schoolId: preloadedUser.schoolId,
    schoolName: undefined,
    isActive: preloadedUser.isActive !== undefined ? preloadedUser.isActive : true,
    roles: preloadedUser.roles || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } : null)
  const [loading, setLoading] = React.useState(!preloadedUser)
  const [error, setError] = React.useState<string | null>(null)

  const loadUser = React.useCallback(async () => {
    try {
      // If user was preloaded, use it
      if (preloadedUser) {
        // Get school name if schoolId exists
        let schoolName = undefined
        if (preloadedUser.schoolId) {
          try {
            const schools = await api.schools.getAll()
            const school = schools.find((s: any) => s.id === preloadedUser.schoolId)
            schoolName = school?.name
          } catch (err) {
            console.error('Error loading school:', err)
          }
        }

        setUser({
          id: preloadedUser.id,
          clerkId: preloadedUser.clerkId,
          email: preloadedUser.email,
          firstName: preloadedUser.firstName,
          lastName: preloadedUser.lastName,
          schoolId: preloadedUser.schoolId,
          schoolName,
          roles: preloadedUser.roles || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setLoading(false)
        return
      }

      // Otherwise, fetch from API
      // Check if user is school admin - if so, try /me/teachers endpoint first
      const isSchoolAdmin = userInfo?.roles.some((role: { name: string }) => role.name === 'SCHOOL_ADMIN') && 
                           !userInfo?.roles.some((role: { name: string }) => role.name === 'SUPERADMIN')
      
      let userDetail: any = null

      if (isSchoolAdmin) {
        try {
          // Try /me/teachers endpoint for school admins
          const teachers = await api.schools.getMyTeachers()
          userDetail = teachers.find((t: { id: string }) => t.id === userId)
        } catch (err) {
          // If that fails, try getUsers (might work for super admins)
          try {
            const users = await api.getUsers()
            userDetail = users.find((u: { id: string }) => u.id === userId)
          } catch (usersErr) {
            // Both failed - will show error
          }
        }
      } else {
        // Try getUsers (for super admins)
        const users = await api.getUsers()
        userDetail = users.find((u: { id: string }) => u.id === userId)
      }

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
          isActive: userDetail.isActive !== undefined ? userDetail.isActive : true,
          createdAt: new Date().toISOString(), // Placeholder - would come from API
          updatedAt: new Date().toISOString() // Placeholder - would come from API
        })
      } else {
        setError(t("users.userNotFound"))
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.loadError")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId, preloadedUser, userInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!preloadedUser) {
      loadUser()
    }
  }, [loadUser, preloadedUser])

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4 md:hidden">
          {context === 'teachers' ? t("teachers.backToSchoolInfo") : t("users.backToUsers")}
        </Button>
        <Loading variant="spinner" message={t("common.loading")} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4 md:hidden">
          {context === 'teachers' ? t("teachers.backToSchoolInfo") : t("users.backToUsers")}
        </Button>
        <div className="text-center py-8">
          <p className="text-red-600">{error || t("users.loadError")}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4 md:hidden">
          {context === 'teachers' ? t("teachers.backToSchoolInfo") : t("users.backToUsers")}
        </Button>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("users.userNotFound")}</p>
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
          className="mb-4 md:hidden"
        >
          {context === 'teachers' ? t("teachers.backToSchoolInfo") : t("users.backToUsers")}
        </Button>
      </div>

      <h1 className="text-3xl font-bold">
        {context === 'teachers' ? t("teachers.title") : t("users.userProfile")}
      </h1>

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
            <CardTitle>{t("users.personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.firstName")}
              </label>
              <p className="text-sm">{user.firstName || t("common.notSpecified")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.lastName")}
              </label>
              <p className="text-sm">{user.lastName || t("common.notSpecified")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.email")}
              </label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.userId")}
              </label>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                {user.id}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.clerkId")}
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
            <div className="flex items-center justify-between">
              <CardTitle>{t("users.accessInfo")}</CardTitle>
              {canManage && user && (
                <div className="flex gap-2">
                  {user.isActive !== false && onDeactivate && (currentUserId !== user.id && currentUserEmail !== user.email) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivate(user)}
                      className="cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      {t("users.deactivateUser")}
                    </Button>
                  )}
                  {user.isActive === false && onReactivate && (currentUserId !== user.id && currentUserEmail !== user.email) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReactivate(user)}
                      className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {t("users.reactivateUser")}
                    </Button>
                  )}
                  {user.isActive === false && onDelete && (currentUserId !== user.id && currentUserEmail !== user.email) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(user)}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("users.deleteUser")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("common.status")}
              </label>
              <div className="mt-1">
                <StatusBadge
                  isActive={user.isActive !== false}
                  activeText={t("users.active")}
                  inactiveText={t("users.inactive")}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.school")}
              </label>
              <p className="text-sm">{user.schoolName || t("users.notAssigned")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.roles")}
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
                {t("users.creationDate")}
              </label>
              <p className="text-sm">
                {new Date(user.createdAt).toLocaleDateString(i18n.language === "es" ? "es-MX" : "en-US")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("users.lastUpdate")}
              </label>
              <p className="text-sm">
                {new Date(user.updatedAt).toLocaleDateString(i18n.language === "es" ? "es-MX" : "en-US")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
