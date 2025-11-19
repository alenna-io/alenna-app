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

interface Role {
  id: string
  name: string
  displayName: string
}

interface TeacherFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string // Used implicitly - backend sets schoolId from authenticated user
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
  onSave,
}: TeacherFormDialogProps) {
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
    clerkId?: string
    email?: string
    firstName?: string
    lastName?: string
    roleIds?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    clerkId: string
    email: string
    firstName: string
    lastName: string
    roleIds: string[]
  }>({
    clerkId: "",
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
          setRoles(rolesData as Role[])
          // Find TEACHER role ID
          const teacherRole = (rolesData as Role[]).find(r => r.name === 'TEACHER')
          if (teacherRole) {
            setTeacherRoleId(teacherRole.id)
            setFormData(prev => ({ ...prev, roleIds: [teacherRole.id] }))
          }
        } catch (error) {
          console.error('Error fetching roles:', error)
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
        clerkId: "",
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
      clerkId?: string
      email?: string
      firstName?: string
      lastName?: string
      roleIds?: string
    } = {}

    // Validate clerkId
    if (!formData.clerkId.trim()) {
      newErrors.clerkId = "El Clerk ID es requerido"
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    // Validate firstName
    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido"
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido"
    }

    // Validate roleIds
    if (formData.roleIds.length === 0) {
      newErrors.roleIds = "Debe seleccionar al menos un rol"
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
        clerkId: formData.clerkId.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        roleIds: formData.roleIds,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving teacher:', error)
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
            Crear Nuevo Maestro
          </DialogTitle>
          <DialogDescription>
            Agrega un nuevo maestro a la escuela
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="clerkId">
                Clerk ID <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="clerkId"
                value={formData.clerkId}
                onChange={(e) => setFormData({ ...formData, clerkId: e.target.value })}
                placeholder="user_xxxxx"
                className={errors.clerkId ? "border-destructive" : ""}
              />
              {errors.clerkId && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.clerkId}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                ID del usuario en Clerk
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="maestro@escuela.edu"
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
                  Nombre <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Nombre del maestro"
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
                  placeholder="Apellido del maestro"
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
                  <SelectValue placeholder={loadingRoles ? "Cargando..." : "Seleccionar rol"} />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter(role => role.name === 'TEACHER' || role.name === 'SCHOOL_ADMIN')
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.roleIds && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.roleIds}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Los maestros pueden tener el rol de Maestro o Administrador de Escuela
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
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Crear Maestro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

