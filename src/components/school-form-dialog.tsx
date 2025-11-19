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
  }) => Promise<void>
}

export function SchoolFormDialog({
  open,
  onOpenChange,
  school,
  onSave,
}: SchoolFormDialogProps) {
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
  }>({
    name: "",
    address: "",
    phone: "",
    email: "",
    teacherLimit: "",
    userLimit: "",
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
      newErrors.name = "El nombre de la escuela es requerido"
    }

    // Validate email if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    // Validate teacherLimit if provided
    if (formData.teacherLimit.trim()) {
      const limit = parseInt(formData.teacherLimit, 10)
      if (isNaN(limit) || limit <= 0) {
        newErrors.teacherLimit = "El límite de maestros debe ser un número positivo"
      }
    }

    // Validate userLimit if provided
    if (formData.userLimit.trim()) {
      const limit = parseInt(formData.userLimit, 10)
      if (isNaN(limit) || limit <= 0) {
        newErrors.userLimit = "El límite de usuarios debe ser un número positivo"
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
        email: formData.email.trim() || undefined,
        teacherLimit: formData.teacherLimit.trim() ? parseInt(formData.teacherLimit, 10) : undefined,
        userLimit: formData.userLimit.trim() ? parseInt(formData.userLimit, 10) : undefined,
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
            {school ? "Editar Escuela" : "Crear Nueva Escuela"}
          </DialogTitle>
          <DialogDescription>
            {school
              ? "Modifica la información de la escuela"
              : "Crea una nueva escuela en el sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">
                Nombre de la Escuela <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la escuela"
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
              <FieldLabel htmlFor="address">Dirección</FieldLabel>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@escuela.edu"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="teacherLimit">Límite de Maestros</FieldLabel>
                <Input
                  id="teacherLimit"
                  type="number"
                  min="1"
                  value={formData.teacherLimit}
                  onChange={(e) => setFormData({ ...formData, teacherLimit: e.target.value })}
                  placeholder="Ej: 50"
                  className={errors.teacherLimit ? "border-destructive" : ""}
                />
                {errors.teacherLimit && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.teacherLimit}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Número máximo de maestros permitidos en esta escuela
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="userLimit">Límite de Usuarios</FieldLabel>
                <Input
                  id="userLimit"
                  type="number"
                  min="1"
                  value={formData.userLimit}
                  onChange={(e) => setFormData({ ...formData, userLimit: e.target.value })}
                  placeholder="Ej: 200"
                  className={errors.userLimit ? "border-destructive" : ""}
                />
                {errors.userLimit && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.userLimit}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Número máximo de usuarios totales permitidos en esta escuela
                </p>
              </Field>
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
            {isSaving ? "Guardando..." : school ? "Actualizar Escuela" : "Crear Escuela"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

