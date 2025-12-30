import * as React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, User as UserIcon, ChevronsUpDown, Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useApi } from "@/services/api"
import type { UserInfo } from "@/services/api"
import { UsersTable } from "@/components/users-table"
import { UsersFilters } from "@/components/users-filters"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { SearchBar } from "@/components/ui/search-bar"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  schoolId: string
  isActive: boolean
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
  const { t } = useTranslation()
  const [users, setUsers] = React.useState<User[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [schools, setSchools] = React.useState<Array<{ id: string, name: string }>>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<{ role: string; schoolId: string; isActive: string }>({
    role: "",
    schoolId: "",
    isActive: ""
  })
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
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const [openSchoolPopover, setOpenSchoolPopover] = React.useState(false)
  const [schoolSearchTerm, setSchoolSearchTerm] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [updatingUsers, setUpdatingUsers] = React.useState<Set<string>>(new Set())

  // Form state for create/edit
  const [formData, setFormData] = React.useState({
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

      // SUPERADMIN can manage all users across all schools
      // SCHOOL_ADMIN can manage users for their school
      const isSuperAdmin = info.roles.some((role: { name: string }) => role.name === 'SUPERADMIN')
      const canManageUsers = isSuperAdmin || info.permissions.includes('users.read')
      setHasPermission(canManageUsers)

      if (!canManageUsers) {
        setError(t("common.error"))
        return
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.loadError")
      setError(errorMessage)
      setHasPermission(false)
    }
  }, [api, t])

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
      const errorMessage = err instanceof Error ? err.message : t("users.loadUsersError")
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

  // Check if user is super admin
  const isSuperAdmin = React.useMemo(() => {
    return userInfo?.roles.some((role: { name: string }) => role.name === 'SUPERADMIN') ?? false
  }, [userInfo])

  React.useEffect(() => {
    if (userInfo) {
      loadUsers()
      loadRoles()
      // Load schools for super admins or if we need to filter by school
      if (isSuperAdmin) {
        loadSchools()
      } else if (userInfo.schoolId) {
        // For non-super admins, add their school to the schools list for filtering
        setSchools([{ id: userInfo.schoolId, name: userInfo.schoolName || 'Current School' }])
      }
    }
  }, [userInfo, isSuperAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateUser = async () => {
    setIsCreating(true)
    setError(null)
    try {
      // SUPERADMIN can create users for any school (must provide schoolId)
      // SCHOOL_ADMIN can only create users for their own school (schoolId is set automatically)
      const createData = {
        ...formData,
        // For super admins, include schoolId if provided; for school admins, omit it (set by backend)
        schoolId: isSuperAdmin && formData.schoolId ? formData.schoolId : undefined,
      }
      await api.createUser(createData)
      toast.success(t("users.createSuccess"))
      setIsCreateDialogOpen(false)
      resetForm()
      loadUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.createError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      // SCHOOL_ADMIN can only update users in their own school
      // Cannot change email or school
      const updateData: {
        firstName: string
        lastName: string
        roleIds: string[]
      } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleIds: formData.roleIds
      }

      await api.updateUser(selectedUser.id, updateData)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.updateError")
      setError(errorMessage)
    }
  }

  const handleDeactivateUser = (user: User) => {
    // Prevent users from deactivating themselves
    if (userInfo?.id === user.id || userInfo?.email === user.email) {
      toast.error(t("users.cannotDeactivateSelf"))
      return
    }
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

    const userId = deactivateConfirmation.userId

    // Optimistic update
    setUsers(prevUsers => prevUsers.map(user =>
      user.id === userId ? { ...user, isActive: false } : user
    ))
    setUpdatingUsers(prev => new Set(prev).add(userId))
    setDeactivateConfirmation({ open: false, userId: '', userName: '', userEmail: '' })
    setDeactivateEmailInput('')

    try {
      await api.deactivateUser(userId)
      toast.success(t("users.deactivateSuccess", { userName: deactivateConfirmation.userName }))
      // Refresh to get actual state from server
      loadUsers()
    } catch (err: unknown) {
      // Revert optimistic update on error
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId ? { ...user, isActive: true } : user
      ))
      const errorMessage = err instanceof Error ? err.message : t("users.deactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdatingUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleReactivateUser = (user: User) => {
    setReactivateConfirmation({
      open: true,
      userId: user.id,
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    })
  }

  const confirmReactivateUser = async () => {
    const userId = reactivateConfirmation.userId

    // Optimistic update
    setUsers(prevUsers => prevUsers.map(user =>
      user.id === userId ? { ...user, isActive: true } : user
    ))
    setUpdatingUsers(prev => new Set(prev).add(userId))
    setReactivateConfirmation({ open: false, userId: '', userName: '' })

    try {
      await api.reactivateUser(userId)
      toast.success(t("users.reactivateSuccess", { userName: reactivateConfirmation.userName }))
      // Refresh to get actual state from server
      loadUsers()
    } catch (err: unknown) {
      // Revert optimistic update on error
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId ? { ...user, isActive: false } : user
      ))
      const errorMessage = err instanceof Error ? err.message : t("users.reactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdatingUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleDeleteUser = (userId: string, userName: string, userEmail: string) => {
    // Prevent users from deleting themselves
    if (userInfo?.id === userId || userInfo?.email === userEmail) {
      toast.error(t("users.cannotDeleteSelf"))
      return
    }
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
      setError(t("users.emailMismatchError"))
      return
    }

    try {
      await api.deleteUser(deleteConfirmation.userId)
      toast.success(t("users.deleteSuccess", { userName: deleteConfirmation.userName }))
      loadUsers()
      setDeleteConfirmation({ open: false, userId: '', userName: '', userEmail: '' })
      setDeleteEmailInput('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("users.deleteError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      schoolId: isSuperAdmin ? "" : (userInfo?.schoolId || ""),
      roleIds: []
    })
    setSchoolSearchTerm("")
    setOpenSchoolPopover(false)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      schoolId: "", // Removed - SCHOOL_ADMIN can only edit users in their own school
      roleIds: user.roles.map(r => r.id)
    })
    setIsEditDialogOpen(true)
  }

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      // Search filter (accent-insensitive)
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`
      const matchesSearch = !searchTerm ||
        includesIgnoreAccents(fullName, searchTerm) ||
        includesIgnoreAccents(user.email, searchTerm)

      // Filter by school
      const matchesSchool = !filters.schoolId || user.schoolId === filters.schoolId

      // Filter by role
      const matchesRole = !filters.role || user.roles.some(role => role.id === filters.role)

      // Filter by active/inactive status
      const matchesStatus = !filters.isActive ||
        (filters.isActive === "true" && user.isActive) ||
        (filters.isActive === "false" && !user.isActive)

      return matchesSearch && matchesSchool && matchesRole && matchesStatus
    })
  }, [users, searchTerm, filters])

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
    return <Loading variant="section" />
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
          {t("users.backToSchoolInfo")}
        </BackButton>
      )}

      {error && (
        <ErrorAlert
          title={t("common.error")}
          message={error}
        />
      )}

      <div className="flex items-center justify-between">
        <PageHeader
          title={schoolId ? t("users.titleForSchool") : t("users.title")}
          description={schoolId ? t("users.descriptionForSchool") : t("users.description")}
        />
        {userInfo && (userInfo.roles.some(role => role.name === 'SUPERADMIN') || userInfo?.permissions.includes('users.create')) && (
          <Button onClick={openCreateDialog} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            {t("users.createUser")}
          </Button>
        )}
      </div>

      {/* Search */}
      <SearchBar
        placeholder={t("users.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filters */}
      {(schools.length > 0 || roles.length > 0) && (
        <UsersFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters)
            setCurrentPage(1)
          }}
          totalUsers={users.length}
          filteredCount={filteredUsers.length}
          schools={schools}
          roles={roles}
        />
      )}

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <UsersTable
          users={paginatedUsers}
          schools={schools}
          onUserSelect={(user) => navigate(`/users/${user.id}`)}
          onEdit={userInfo?.permissions.includes('users.update') ? openEditDialog : undefined}
          onDeactivate={userInfo?.permissions.includes('users.delete') ? (user) => {
            // Prevent users from deactivating themselves
            if (userInfo?.id === user.id || userInfo?.email === user.email) {
              toast.error(t("users.cannotDeactivateSelf"))
              return
            }
            handleDeactivateUser(user)
          } : undefined}
          onReactivate={userInfo?.permissions.includes('users.delete') ? (user) => handleReactivateUser(user) : undefined}
          onDelete={userInfo?.permissions.includes('users.delete') ? (user) => {
            // Prevent users from deleting themselves
            if (userInfo?.id === user.id || userInfo?.email === user.email) {
              toast.error(t("users.cannotDeleteSelf"))
              return
            }
            handleDeleteUser(
              user.id,
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email,
              user.email
            )
          } : undefined}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          onPageChange={setCurrentPage}
          canEdit={userInfo?.permissions.includes('users.update') ?? false}
          canDelete={userInfo?.permissions.includes('users.delete') ?? false}
          currentUserId={userInfo?.id}
          currentUserEmail={userInfo?.email}
          updatingUsers={updatingUsers}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t("users.noUsers")}</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.createUser")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">{t("users.firstName")}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t("users.firstNamePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t("users.lastName")}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t("users.lastNamePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="email">{t("users.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("users.emailPlaceholder")}
              />
            </div>
            {/* School selection - Only for SUPERADMIN */}
            {isSuperAdmin && schools.length > 0 && (
              <div>
                <Label htmlFor="create-schoolId">{t("users.school")}</Label>
                <Popover open={openSchoolPopover} onOpenChange={setOpenSchoolPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !formData.schoolId && "text-muted-foreground"
                      )}
                      id="create-schoolId"
                    >
                      {formData.schoolId
                        ? schools.find((school) => school.id === formData.schoolId)?.name
                        : t("users.selectSchool")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={t("common.search")}
                        value={schoolSearchTerm}
                        onValueChange={setSchoolSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
                        <CommandGroup>
                          {schools
                            .filter((school) =>
                              !schoolSearchTerm ||
                              includesIgnoreAccents(school.name, schoolSearchTerm)
                            )
                            .map((school) => {
                              const isSelected = formData.schoolId === school.id;
                              return (
                                <CommandItem
                                  key={school.id}
                                  value={school.id}
                                  onSelect={() => {
                                    setFormData({ ...formData, schoolId: school.id });
                                    setOpenSchoolPopover(false);
                                    setSchoolSearchTerm("");
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {school.name}
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div>
              <Label>{t("users.role")}</Label>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(value: string) => setFormData({ ...formData, roleIds: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("users.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.name !== "SUPERADMIN")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? t("common.creating") : t("users.createUser")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editUser")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">{t("users.email")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-firstName">{t("users.firstName")}</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">{t("users.lastName")}</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            {/* School selection removed - SCHOOL_ADMIN can only update users in their own school */}
            <div>
              <Label>{t("users.roles")}</Label>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(value: string) => setFormData({ ...formData, roleIds: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("users.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.name !== "SUPERADMIN")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateUser}>
                {t("users.updateUser")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="text-red-600">{t("users.deleteUser")}</DialogTitle>
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
    </div >
  )
}
