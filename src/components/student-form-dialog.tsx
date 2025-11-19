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
  const api = useApi()
  const [isSaving, setIsSaving] = React.useState(false)
  const [certificationTypes, setCertificationTypes] = React.useState<CertificationType[]>([])
  const [loadingCertTypes, setLoadingCertTypes] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    firstName?: string
    lastName?: string
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
      newErrors.firstName = "El nombre es requerido"
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido"
    }

    // Validate birthDate
    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida"
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      if (birthDate >= today) {
        newErrors.birthDate = "La fecha de nacimiento debe ser anterior a hoy"
      }
    }

    // Validate certificationTypeId
    if (!formData.certificationTypeId) {
      newErrors.certificationTypeId = "El tipo de certificación es requerido"
    }

    // Validate graduationDate
    if (!formData.graduationDate) {
      newErrors.graduationDate = "La fecha de graduación es requerida"
    } else if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const graduationDate = new Date(formData.graduationDate)
      if (graduationDate <= birthDate) {
        newErrors.graduationDate = "La fecha de graduación debe ser posterior a la fecha de nacimiento"
      }
    }

    // Validate parent 1 (required)
    if (!formData.parent1FirstName.trim()) {
      newErrors.parent1FirstName = "El nombre del padre/madre es requerido"
    }
    if (!formData.parent1LastName.trim()) {
      newErrors.parent1LastName = "El apellido del padre/madre es requerido"
    }
    if (!formData.parent1Email.trim()) {
      newErrors.parent1Email = "El email del padre/madre es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent1Email)) {
      newErrors.parent1Email = "Email inválido"
    }
    if (!formData.parent1Relationship.trim()) {
      newErrors.parent1Relationship = "La relación es requerida"
    }

    // Validate parent 2 (optional, but if filled, all fields required)
    if (formData.hasSecondParent) {
      if (!formData.parent2FirstName.trim()) {
        newErrors.parent2FirstName = "El nombre del segundo padre/madre es requerido"
      }
      if (!formData.parent2LastName.trim()) {
        newErrors.parent2LastName = "El apellido del segundo padre/madre es requerido"
      }
      if (!formData.parent2Email.trim()) {
        newErrors.parent2Email = "El email del segundo padre/madre es requerido"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent2Email)) {
        newErrors.parent2Email = "Email inválido"
      }
      if (!formData.parent2Relationship.trim()) {
        newErrors.parent2Relationship = "La relación es requerida"
      }

      // Ensure parent emails are different
      if (formData.parent1Email === formData.parent2Email) {
        newErrors.parent2Email = "El email del segundo padre/madre debe ser diferente al del primero"
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
            Crear Nuevo Estudiante
          </DialogTitle>
          <DialogDescription>
            Agrega un nuevo estudiante a la escuela
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">
                  Nombre <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Nombre del estudiante"
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
                  Apellido <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Apellido del estudiante"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="birthDate">
                  Fecha de Nacimiento <span className="text-destructive">*</span>
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
                  Fecha de Graduación <span className="text-destructive">*</span>
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
                Tipo de Certificación <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={formData.certificationTypeId}
                onValueChange={(value) => setFormData({ ...formData, certificationTypeId: value })}
                disabled={loadingCertTypes}
              >
                <SelectTrigger className={errors.certificationTypeId ? "border-destructive" : ""}>
                  <SelectValue placeholder={loadingCertTypes ? "Cargando..." : "Seleccionar tipo de certificación"} />
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
                <FieldLabel htmlFor="contactPhone">Teléfono de Contacto</FieldLabel>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="address">Dirección</FieldLabel>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
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
                Estudiante Nivelado
              </FieldLabel>
            </div>

            {formData.isLeveled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="expectedLevel">Nivel Esperado</FieldLabel>
                  <Input
                    id="expectedLevel"
                    value={formData.expectedLevel}
                    onChange={(e) => setFormData({ ...formData, expectedLevel: e.target.value })}
                    placeholder="Ej: 6to grado"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="currentLevel">Nivel Actual</FieldLabel>
                  <Input
                    id="currentLevel"
                    value={formData.currentLevel}
                    onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                    placeholder="Ej: 5to grado"
                  />
                </Field>
              </div>
            )}

            {/* Parents Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Información de Padres/Tutores</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Se requiere al menos un padre/madre/tutor. Máximo dos.
              </p>

              {/* Parent 1 (Required) */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium">Padre/Madre/Tutor 1 <span className="text-destructive">*</span></h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="parent1FirstName">
                      Nombre <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parent1FirstName"
                      value={formData.parent1FirstName}
                      onChange={(e) => setFormData({ ...formData, parent1FirstName: e.target.value })}
                      placeholder="Nombre del padre/madre"
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
                      Apellido <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="parent1LastName"
                      value={formData.parent1LastName}
                      onChange={(e) => setFormData({ ...formData, parent1LastName: e.target.value })}
                      placeholder="Apellido del padre/madre"
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
                      placeholder="padre@email.com"
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
                      Relación <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={formData.parent1Relationship}
                      onValueChange={(value) => setFormData({ ...formData, parent1Relationship: value })}
                    >
                      <SelectTrigger className={errors.parent1Relationship ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar relación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Father">Padre</SelectItem>
                        <SelectItem value="Mother">Madre</SelectItem>
                        <SelectItem value="Guardian">Tutor</SelectItem>
                        <SelectItem value="Parent">Padre/Madre</SelectItem>
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
                    Agregar segundo padre/madre/tutor
                  </FieldLabel>
                </div>

                {formData.hasSecondParent && (
                  <>
                    <h4 className="text-sm font-medium">Padre/Madre/Tutor 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="parent2FirstName">
                          Nombre <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="parent2FirstName"
                          value={formData.parent2FirstName}
                          onChange={(e) => setFormData({ ...formData, parent2FirstName: e.target.value })}
                          placeholder="Nombre del segundo padre/madre"
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
                          Apellido <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="parent2LastName"
                          value={formData.parent2LastName}
                          onChange={(e) => setFormData({ ...formData, parent2LastName: e.target.value })}
                          placeholder="Apellido del segundo padre/madre"
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
                          Email <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="parent2Email"
                          type="email"
                          value={formData.parent2Email}
                          onChange={(e) => setFormData({ ...formData, parent2Email: e.target.value })}
                          placeholder="padre2@email.com"
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
                          Relación <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={formData.parent2Relationship}
                          onValueChange={(value) => setFormData({ ...formData, parent2Relationship: value })}
                        >
                          <SelectTrigger className={errors.parent2Relationship ? "border-destructive" : ""}>
                            <SelectValue placeholder="Seleccionar relación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Padre</SelectItem>
                            <SelectItem value="Mother">Madre</SelectItem>
                            <SelectItem value="Guardian">Tutor</SelectItem>
                            <SelectItem value="Parent">Padre/Madre</SelectItem>
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
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Crear Estudiante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

