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
import { Building, AlertTriangle } from "lucide-react"
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

interface SchoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  school?: School | null
  onSave: (data: {
    name: string
    address: string
    phone?: string
    email?: string
    teacherLimit?: number
    userLimit?: number
    adminEmail?: string
    adminFirstName?: string
    adminLastName?: string
  }) => Promise<void>
}

export function SchoolFormDialog({
  open,
  onOpenChange,
  school,
  onSave,
}: SchoolFormDialogProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    name?: string
    email?: string
    teacherLimit?: string
    userLimit?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    name: string
    address: string
    phone: string
    email: string
    teacherLimit: string
    userLimit: string
    adminEmail: string
    adminFirstName: string
    adminLastName: string
  }>({
    name: "",
    address: "",
    phone: "",
    email: "",
    teacherLimit: "",
    userLimit: "",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
  })

  // Initialize form data when dialog opens or school changes
  React.useEffect(() => {
    if (open) {
      if (school) {
        // Editing existing school
        setFormData({
          name: school.name,
          address: school.address || "",
          phone: school.phone || "",
          email: school.email || "",
          teacherLimit: school.teacherLimit?.toString() || "",
          userLimit: school.userLimit?.toString() || "",
          adminEmail: "",
          adminFirstName: "",
          adminLastName: "",
        })
      } else {
        // Creating new school
        setFormData({
          name: "",
          address: "",
          phone: "",
          email: "",
          teacherLimit: "",
          userLimit: "",
          adminEmail: "",
          adminFirstName: "",
          adminLastName: "",
        })
      }
      setErrors({})
    }
  }, [open, school])

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string
      email?: string
      teacherLimit?: string
      userLimit?: string
    } = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t("schools.nameRequiredError")
    }

    // Validate admin email if creating new school
    if (!school && formData.adminEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.email = t("schools.invalidEmailError")
    }

    // Validate teacherLimit if provided
    if (formData.teacherLimit.trim()) {
      const limit = parseInt(formData.teacherLimit, 10)
      if (isNaN(limit) || limit <= 0) {
        newErrors.teacherLimit = t("forms.teacherLimitError")
      }
    }

    // Validate userLimit if provided
    if (formData.userLimit.trim()) {
      const limit = parseInt(formData.userLimit, 10)
      if (isNaN(limit) || limit <= 0) {
        newErrors.userLimit = t("forms.userLimitError")
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      await onSave({
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        email: !school && formData.adminEmail.trim() ? formData.adminEmail.trim() : (school?.email || undefined), // Use admin email for new schools
        teacherLimit: formData.teacherLimit.trim() ? parseInt(formData.teacherLimit, 10) : undefined,
        userLimit: formData.userLimit.trim() ? parseInt(formData.userLimit, 10) : undefined,
        adminEmail: !school && formData.adminEmail.trim() ? formData.adminEmail.trim() : undefined,
        adminFirstName: !school && formData.adminFirstName.trim() ? formData.adminFirstName.trim() : undefined,
        adminLastName: !school && formData.adminLastName.trim() ? formData.adminLastName.trim() : undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving school:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {school ? t("schools.editSchool") : t("schools.createSchool")}
          </DialogTitle>
          <DialogDescription>
            {school
              ? t("forms.editSchool")
              : t("forms.createSchoolDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">
                {t("schools.schoolName")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("schools.schoolNamePlaceholder")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.name}</span>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="address">{t("schools.address")}</FieldLabel>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t("schools.addressPlaceholder")}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email field only shown when editing - for new schools, email comes from admin user */}
              {school && (
                <Field>
                  <FieldLabel htmlFor="email">{t("schools.email")}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t("users.emailPlaceholder")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="phone">{t("schools.phone")}</FieldLabel>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("schools.phonePlaceholder")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="teacherLimit">{t("forms.teacherLimit")}</FieldLabel>
                <Input
                  id="teacherLimit"
                  type="number"
                  min="1"
                  value={formData.teacherLimit}
                  onChange={(e) => setFormData({ ...formData, teacherLimit: e.target.value })}
                  placeholder={t("schools.teacherLimitPlaceholder")}
                  className={errors.teacherLimit ? "border-destructive" : ""}
                />
                {errors.teacherLimit && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.teacherLimit}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t("forms.teacherLimitDescription")}
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="userLimit">{t("forms.userLimit")}</FieldLabel>
                <Input
                  id="userLimit"
                  type="number"
                  min="1"
                  value={formData.userLimit}
                  onChange={(e) => setFormData({ ...formData, userLimit: e.target.value })}
                  placeholder={t("schools.userLimitPlaceholder")}
                  className={errors.userLimit ? "border-destructive" : ""}
                />
                {errors.userLimit && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.userLimit}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t("forms.userLimitDescription")}
                </p>
              </Field>
            </div>

            {/* Admin User Fields - Only when creating a new school */}
            {!school && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-4">{t("schools.adminUser")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="adminEmail">
                      {t("users.email")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder={t("forms.adminEmailPlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="adminFirstName">
                      {t("users.firstName")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="adminFirstName"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      placeholder={t("forms.adminFirstNamePlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="adminLastName">
                      {t("users.lastName")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="adminLastName"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      placeholder={t("forms.adminLastNamePlaceholder")}
                    />
                  </Field>
                </div>
              </>
            )}
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
            {isSaving ? t("common.saving") : school ? t("schools.updateSchool") : t("schools.createSchool")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

