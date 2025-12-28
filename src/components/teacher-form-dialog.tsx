import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, AlertTriangle } from "lucide-react"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Role {
  id: string
  name: string
  displayName: string
}

interface TeacherFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string // Used implicitly - backend sets schoolId from authenticated user
  school?: { teacherLimit?: number }
  teachersCount?: number
  onSave: (data: {
    clerkId: string
    email: string
    firstName: string
    lastName: string
    roleIds: string[]
  }) => Promise<void>
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  schoolId, // Used implicitly - backend sets schoolId from authenticated user
  school,
  teachersCount,
  onSave,
}: TeacherFormDialogProps) {
  const { t } = useTranslation()
  // schoolId is passed to onSave callback implicitly through the API call context
  // The backend will automatically set the schoolId from the authenticated user's school
  React.useEffect(() => {
    if (open && schoolId) {
      // schoolId is available for any future validation or logging
      console.debug('Creating teacher for school:', schoolId)
    }
  }, [open, schoolId])
  const api = useApi()
  const [isSaving, setIsSaving] = React.useState(false)
  const [roles, setRoles] = React.useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = React.useState(false)
  const [teacherRoleId, setTeacherRoleId] = React.useState<string>("")
  const [errors, setErrors] = React.useState<{
    email?: string
    firstName?: string
    lastName?: string
    roleIds?: string
  }>({})
  const [limitWarningDialog, setLimitWarningDialog] = React.useState<{ open: boolean; title: string; message: string } | null>(null)
  const [formData, setFormData] = React.useState<{
    email: string
    firstName: string
    lastName: string
    roleIds: string[]
  }>({
    email: "",
    firstName: "",
    lastName: "",
    roleIds: [],
  })

  // Fetch roles when dialog opens
  React.useEffect(() => {
    if (open) {
      const fetchRoles = async () => {
        try {
          setLoadingRoles(true)
          const rolesData = await api.getAvailableRoles()
          console.log('Fetched roles:', rolesData)

          if (!rolesData || !Array.isArray(rolesData)) {
            console.error('Invalid roles data received:', rolesData)
            setRoles([])
            return
          }

          setRoles(rolesData as Role[])
          // Find TEACHER role ID
          const teacherRole = (rolesData as Role[]).find(r => r.name === 'TEACHER')
          if (teacherRole) {
            setTeacherRoleId(teacherRole.id)
            setFormData(prev => ({ ...prev, roleIds: [teacherRole.id] }))
          }
        } catch (error) {
          console.error('Error fetching roles:', error)
          // Log more details about the error
          if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
          }
          setRoles([])
        } finally {
          setLoadingRoles(false)
        }
      }
      fetchRoles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Initialize form data when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        roleIds: teacherRoleId ? [teacherRoleId] : [],
      })
      setErrors({})
    }
  }, [open, teacherRoleId])

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string
      firstName?: string
      lastName?: string
      roleIds?: string
    } = {}

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = t("users.emailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("users.invalidEmail")
    }

    // Validate firstName
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("users.firstNameRequired")
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("users.lastNameRequired")
    }

    // Validate roleIds
    if (formData.roleIds.length === 0) {
      newErrors.roleIds = t("users.roleRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    // Check teacher limit before creating
    if (school?.teacherLimit && teachersCount !== undefined && teachersCount >= school.teacherLimit) {
      setLimitWarningDialog({
        open: true,
        title: t("teachers.limitReached"),
        message: t("teachers.limitReachedMessage", { limit: school.teacherLimit })
      })
      return
    }

    try {
      setIsSaving(true)
      await onSave({
        clerkId: "", // Let backend generate it or handle it
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        roleIds: formData.roleIds,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving teacher:', error)
      const err = error as Error
      // Check if error is about limit - show dialog instead of form error
      if (err.message?.includes('límite') || err.message?.includes('limit')) {
        setLimitWarningDialog({
          open: true,
          title: t("teachers.limitReached"),
          message: err.message || t("teachers.limitReachedMessage", { limit: 0 })
        })
      } else {
        throw error
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t("teachers.addTeacher")}
          </DialogTitle>
          <DialogDescription>
            {t("teachers.addTeacherDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">
                {t("common.email")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("teachers.emailPlaceholder") || "maestro@escuela.edu"}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">
                  {t("common.name")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={t("teachers.firstNamePlaceholder") || t("users.firstNamePlaceholder")}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="lastName">
                  {t("common.lastName")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder={t("teachers.lastNamePlaceholder") || t("users.lastNamePlaceholder")}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="roleIds">
                Rol <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={formData.roleIds[0] || ""}
                onValueChange={(value) => setFormData({ ...formData, roleIds: [value] })}
                disabled={loadingRoles}
              >
                <SelectTrigger className={errors.roleIds ? "border-destructive" : ""}>
                  <SelectValue placeholder={loadingRoles ? t("common.loading") : t("users.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 && !loadingRoles ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {t("users.noRolesAvailable") || "No roles available"}
                    </div>
                  ) : (
                    roles
                      .filter(role => role.name === 'TEACHER' || role.name === 'SCHOOL_ADMIN')
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {errors.roleIds && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.roleIds}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t("forms.teacherRolesInfo")}
              </p>
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("common.saving") : t("teachers.addTeacher")}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Limit Warning Dialog */}
      {limitWarningDialog && (
        <AlertDialog open={limitWarningDialog.open} onOpenChange={(open) => setLimitWarningDialog(open ? limitWarningDialog : null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{limitWarningDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {limitWarningDialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setLimitWarningDialog(null)}>
                {t("common.accept")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Dialog>
  )
}

