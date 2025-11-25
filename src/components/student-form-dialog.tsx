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
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, AlertTriangle } from "lucide-react"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"

interface CertificationType {
  id: string
  name: string
  description?: string
}

interface ParentData {
  firstName: string
  lastName: string
  email: string
  relationship: string
}

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
  onSave: (data: {
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    contactPhone?: string
    isLeveled?: boolean
    expectedLevel?: string
    currentLevel?: string
    address?: string
    parents: ParentData[]
  }) => Promise<void>
}

export function StudentFormDialog({
  open,
  onOpenChange,
  schoolId,
  onSave,
}: StudentFormDialogProps) {
  const { t } = useTranslation()
  const api = useApi()
  const [isSaving, setIsSaving] = React.useState(false)
  const [certificationTypes, setCertificationTypes] = React.useState<CertificationType[]>([])
  const [loadingCertTypes, setLoadingCertTypes] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    firstName?: string
    lastName?: string
    email?: string
    birthDate?: string
    certificationTypeId?: string
    graduationDate?: string
    parents?: string
    parent1FirstName?: string
    parent1LastName?: string
    parent1Email?: string
    parent1Relationship?: string
    parent2FirstName?: string
    parent2LastName?: string
    parent2Email?: string
    parent2Relationship?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    contactPhone: string
    isLeveled: boolean
    expectedLevel: string
    currentLevel: string
    address: string
    parent1FirstName: string
    parent1LastName: string
    parent1Email: string
    parent1Relationship: string
    parent2FirstName: string
    parent2LastName: string
    parent2Email: string
    parent2Relationship: string
    hasSecondParent: boolean
  }>({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    certificationTypeId: "",
    graduationDate: "",
    contactPhone: "",
    isLeveled: false,
    expectedLevel: "",
    currentLevel: "",
    address: "",
    parent1FirstName: "",
    parent1LastName: "",
    parent1Email: "",
    parent1Relationship: "",
    parent2FirstName: "",
    parent2LastName: "",
    parent2Email: "",
    parent2Relationship: "",
    hasSecondParent: false,
  })

  // Fetch certification types when dialog opens
  React.useEffect(() => {
    if (open && schoolId) {
      const fetchCertificationTypes = async () => {
        try {
          setLoadingCertTypes(true)
          const types = await api.schools.getCertificationTypes(schoolId)
          setCertificationTypes(types as CertificationType[])
        } catch (error) {
          console.error('Error fetching certification types:', error)
          setCertificationTypes([])
        } finally {
          setLoadingCertTypes(false)
        }
      }
      fetchCertificationTypes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schoolId])

  // Initialize form data when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        birthDate: "",
        certificationTypeId: "",
        graduationDate: "",
        contactPhone: "",
        isLeveled: false,
        expectedLevel: "",
        currentLevel: "",
        address: "",
        parent1FirstName: "",
        parent1LastName: "",
        parent1Email: "",
        parent1Relationship: "",
        parent2FirstName: "",
        parent2LastName: "",
        parent2Email: "",
        parent2Relationship: "",
        hasSecondParent: false,
      })
      setErrors({})
    }
  }, [open])

  const validateForm = (): boolean => {
    const newErrors: {
      firstName?: string
      lastName?: string
      email?: string
      birthDate?: string
      certificationTypeId?: string
      graduationDate?: string
      parents?: string
      parent1FirstName?: string
      parent1LastName?: string
      parent1Email?: string
      parent1Relationship?: string
      parent2FirstName?: string
      parent2LastName?: string
      parent2Email?: string
      parent2Relationship?: string
    } = {}

    // Validate firstName
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("students.validation.firstNameRequired")
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("students.validation.lastNameRequired")
    }

    if (!formData.email.trim()) {
      newErrors.email = t("students.validation.studentEmailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("students.validation.emailInvalid")
    }

    // Validate birthDate
    if (!formData.birthDate) {
      newErrors.birthDate = t("students.validation.birthDateRequired")
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      if (birthDate >= today) {
        newErrors.birthDate = t("students.validation.birthDateFuture")
      }
    }

    // Validate certificationTypeId
    if (!formData.certificationTypeId) {
      newErrors.certificationTypeId = t("students.validation.certificationTypeRequired")
    }

    // Validate graduationDate
    if (!formData.graduationDate) {
      newErrors.graduationDate = t("students.validation.graduationDateRequired")
    } else if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const graduationDate = new Date(formData.graduationDate)
      if (graduationDate <= birthDate) {
        newErrors.graduationDate = t("students.validation.graduationDateBeforeBirth")
      }
    }

    // Validate parent 1 (required)
    if (!formData.parent1FirstName.trim()) {
      newErrors.parent1FirstName = t("students.validation.parentNameRequired")
    }
    if (!formData.parent1LastName.trim()) {
      newErrors.parent1LastName = t("students.validation.parentLastNameRequired")
    }
    if (!formData.parent1Email.trim()) {
      newErrors.parent1Email = t("students.validation.parentEmailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent1Email)) {
      newErrors.parent1Email = t("students.validation.emailInvalid")
    }
    if (!formData.parent1Relationship.trim()) {
      newErrors.parent1Relationship = t("students.validation.relationshipRequired")
    }

    // Validate parent 2 (optional, but if filled, all fields required)
    if (formData.hasSecondParent) {
      if (!formData.parent2FirstName.trim()) {
        newErrors.parent2FirstName = t("students.validation.parentNameRequired")
      }
      if (!formData.parent2LastName.trim()) {
        newErrors.parent2LastName = t("students.validation.parentLastNameRequired")
      }
      if (!formData.parent2Email.trim()) {
        newErrors.parent2Email = t("students.validation.parentEmailRequired")
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent2Email)) {
        newErrors.parent2Email = t("students.validation.emailInvalid")
      }
      if (!formData.parent2Relationship.trim()) {
        newErrors.parent2Relationship = t("students.validation.relationshipRequired")
      }

      // Ensure parent emails are different
      if (formData.parent1Email === formData.parent2Email) {
        newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
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

      // Build parents array (at least 1 required)
      const parents: ParentData[] = [
        {
          firstName: formData.parent1FirstName.trim(),
          lastName: formData.parent1LastName.trim(),
          email: formData.parent1Email.trim(),
          relationship: formData.parent1Relationship.trim(),
        }
      ]

      // Add second parent if provided
      if (formData.hasSecondParent) {
        parents.push({
          firstName: formData.parent2FirstName.trim(),
          lastName: formData.parent2LastName.trim(),
          email: formData.parent2Email.trim(),
          relationship: formData.parent2Relationship.trim(),
        })
      }

      await onSave({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        birthDate: new Date(formData.birthDate).toISOString(),
        certificationTypeId: formData.certificationTypeId,
        graduationDate: new Date(formData.graduationDate).toISOString(),
        contactPhone: formData.contactPhone.trim() || undefined,
        isLeveled: formData.isLeveled || undefined,
        expectedLevel: formData.expectedLevel.trim() || undefined,
        currentLevel: formData.currentLevel.trim() || undefined,
        address: formData.address.trim() || undefined,
        parents,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving student:', error)
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
            <GraduationCap className="h-5 w-5" />
            {t("students.createStudent")}
          </DialogTitle>
          <DialogDescription>
            {t("students.createStudentDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">
                  {t("common.name")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={t("students.namePlaceholder")}
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
                  placeholder={t("students.lastNamePlaceholder")}
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
              <FieldLabel htmlFor="studentEmail">
                {t("students.email")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="studentEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("students.emailPlaceholder") || "student@email.com"}
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
                <FieldLabel htmlFor="birthDate">
                  {t("students.birthDate")} <span className="text-destructive">*</span>
                </FieldLabel>
                <DatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date || "" })}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthDate && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.birthDate}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="graduationDate">
                  {t("students.graduationDate")} <span className="text-destructive">*</span>
                </FieldLabel>
                <DatePicker
                  value={formData.graduationDate}
                  onChange={(date) => setFormData({ ...formData, graduationDate: date || "" })}
                  min={formData.birthDate || undefined}
                />
                {errors.graduationDate && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.graduationDate}</span>
                  </div>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="certificationTypeId">
                {t("students.certificationType")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={formData.certificationTypeId}
                onValueChange={(value) => setFormData({ ...formData, certificationTypeId: value })}
                disabled={loadingCertTypes}
              >
                <SelectTrigger className={errors.certificationTypeId ? "border-destructive" : ""}>
                  <SelectValue placeholder={loadingCertTypes ? t("common.loading") : t("students.selectCertificationType")} />
                </SelectTrigger>
                <SelectContent>
                  {certificationTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.certificationTypeId && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.certificationTypeId}</span>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="contactPhone">{t("students.contactPhone")}</FieldLabel>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="address">{t("common.address")}</FieldLabel>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t("students.fullAddress")}
                />
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLeveled"
                checked={formData.isLeveled}
                onChange={(e) => setFormData({ ...formData, isLeveled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <FieldLabel htmlFor="isLeveled" className="cursor-pointer">
                {t("students.notLeveledStudent")}
              </FieldLabel>
            </div>

            {formData.isLeveled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="expectedLevel">{t("students.expectedLevel")}</FieldLabel>
                  <Input
                    id="expectedLevel"
                    value={formData.expectedLevel}
                    onChange={(e) => setFormData({ ...formData, expectedLevel: e.target.value })}
                    placeholder={t("students.expectedLevelPlaceholder")}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="currentLevel">{t("students.currentLevel")}</FieldLabel>
                  <Input
                    id="currentLevel"
                    value={formData.currentLevel}
                    onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                    placeholder={t("students.currentLevelPlaceholder")}
                  />
                </Field>
              </div>
            )}

            {/* Parents Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">{t("forms.parentsInfo")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("forms.parentsRequired")}
              </p>

              {/* Parent 1 (Required) */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium">{t("students.parent1")} <span className="text-destructive">*</span></h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="parent1FirstName">
                      {t("common.name")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parent1FirstName"
                      value={formData.parent1FirstName}
                      onChange={(e) => setFormData({ ...formData, parent1FirstName: e.target.value })}
                      placeholder={t("students.parentNamePlaceholder")}
                      className={errors.parent1FirstName ? "border-destructive" : ""}
                    />
                    {errors.parent1FirstName && (
                      <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{errors.parent1FirstName}</span>
                      </div>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="parent1LastName">
                      {t("common.lastName")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parent1LastName"
                      value={formData.parent1LastName}
                      onChange={(e) => setFormData({ ...formData, parent1LastName: e.target.value })}
                      placeholder={t("students.parentLastNamePlaceholder")}
                      className={errors.parent1LastName ? "border-destructive" : ""}
                    />
                    {errors.parent1LastName && (
                      <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{errors.parent1LastName}</span>
                      </div>
                    )}
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="parent1Email">
                      Email <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parent1Email"
                      type="email"
                      value={formData.parent1Email}
                      onChange={(e) => setFormData({ ...formData, parent1Email: e.target.value })}
                      placeholder={t("students.parentEmailPlaceholder")}
                      className={errors.parent1Email ? "border-destructive" : ""}
                    />
                    {errors.parent1Email && (
                      <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{errors.parent1Email}</span>
                      </div>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="parent1Relationship">
                      {t("students.relationship")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={formData.parent1Relationship}
                      onValueChange={(value) => setFormData({ ...formData, parent1Relationship: value })}
                    >
                      <SelectTrigger className={errors.parent1Relationship ? "border-destructive" : ""}>
                        <SelectValue placeholder={t("students.selectRelationship")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Father">{t("students.father")}</SelectItem>
                        <SelectItem value="Mother">{t("students.mother")}</SelectItem>
                        <SelectItem value="Guardian">{t("students.guardian")}</SelectItem>
                        <SelectItem value="Parent">{t("students.parent")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.parent1Relationship && (
                      <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{errors.parent1Relationship}</span>
                      </div>
                    )}
                  </Field>
                </div>
              </div>

              {/* Parent 2 (Optional) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="hasSecondParent"
                    checked={formData.hasSecondParent}
                    onChange={(e) => setFormData({ ...formData, hasSecondParent: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <FieldLabel htmlFor="hasSecondParent" className="cursor-pointer">
                    {t("forms.addSecondParent")}
                  </FieldLabel>
                </div>

                {formData.hasSecondParent && (
                  <>
                    <h4 className="text-sm font-medium">{t("students.parent2")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="parent2FirstName">
                          {t("common.name")} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="parent2FirstName"
                          value={formData.parent2FirstName}
                          onChange={(e) => setFormData({ ...formData, parent2FirstName: e.target.value })}
                          placeholder={t("students.secondParentNamePlaceholder")}
                          className={errors.parent2FirstName ? "border-destructive" : ""}
                        />
                        {errors.parent2FirstName && (
                          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.parent2FirstName}</span>
                          </div>
                        )}
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="parent2LastName">
                          {t("common.lastName")} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="parent2LastName"
                          value={formData.parent2LastName}
                          onChange={(e) => setFormData({ ...formData, parent2LastName: e.target.value })}
                          placeholder={t("students.secondParentLastNamePlaceholder")}
                          className={errors.parent2LastName ? "border-destructive" : ""}
                        />
                        {errors.parent2LastName && (
                          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.parent2LastName}</span>
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="parent2Email">
                          {t("common.email")} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="parent2Email"
                          type="email"
                          value={formData.parent2Email}
                          onChange={(e) => setFormData({ ...formData, parent2Email: e.target.value })}
                          placeholder={t("students.secondParentEmailPlaceholder")}
                          className={errors.parent2Email ? "border-destructive" : ""}
                        />
                        {errors.parent2Email && (
                          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.parent2Email}</span>
                          </div>
                        )}
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="parent2Relationship">
                          {t("students.relationship")} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={formData.parent2Relationship}
                          onValueChange={(value) => setFormData({ ...formData, parent2Relationship: value })}
                        >
                          <SelectTrigger className={errors.parent2Relationship ? "border-destructive" : ""}>
                            <SelectValue placeholder={t("students.selectRelationship")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">{t("students.father")}</SelectItem>
                            <SelectItem value="Mother">{t("students.mother")}</SelectItem>
                            <SelectItem value="Guardian">{t("students.guardian")}</SelectItem>
                            <SelectItem value="Parent">{t("students.parent")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.parent2Relationship && (
                          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.parent2Relationship}</span>
                          </div>
                        )}
                      </Field>
                    </div>
                  </>
                )}
              </div>
            </div>
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
            {isSaving ? t("common.saving") : t("students.createButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

