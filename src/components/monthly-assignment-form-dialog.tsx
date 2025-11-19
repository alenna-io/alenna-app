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
import { FileText, AlertTriangle } from "lucide-react"
import type { MonthlyAssignmentTemplate } from "./monthly-assignments-table"

interface MonthlyAssignmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: MonthlyAssignmentTemplate | null
  schoolYearName?: string
  onSave: (data: {
    name: string
    quarter: string
  }) => Promise<void>
}

const QUARTERS = [
  { value: 'Q1', label: 'Bloque 1 (Q1)' },
  { value: 'Q2', label: 'Bloque 2 (Q2)' },
  { value: 'Q3', label: 'Bloque 3 (Q3)' },
  { value: 'Q4', label: 'Bloque 4 (Q4)' },
]

export function MonthlyAssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  schoolYearName,
  onSave,
}: MonthlyAssignmentFormDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState<{
    name: string
    quarter: string
  }>({
    name: "",
    quarter: "",
  })

  // Initialize form data when dialog opens or assignment changes
  React.useEffect(() => {
    if (open) {
      if (assignment) {
        // Editing existing assignment
        setFormData({
          name: assignment.name,
          quarter: assignment.quarter,
        })
      } else {
        // Creating new assignment
        setFormData({
          name: "",
          quarter: "",
        })
      }
    }
  }, [open, assignment])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return
    }

    if (!assignment && !formData.quarter) {
      return
    }

    try {
      setIsSaving(true)
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving assignment:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assignment ? "Editar Asignación Mensual" : "Crear Nueva Asignación Mensual"}
          </DialogTitle>
          <DialogDescription>
            {assignment
              ? "Modifica el nombre de la asignación. Esto actualizará el nombre para todos los estudiantes."
              : `Esta asignación se aplicará a todos los estudiantes del año escolar "${schoolYearName || ''}" para el trimestre seleccionado.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!assignment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Importante
                  </p>
                  <p className="text-sm text-yellow-700">
                    Esta asignación se creará automáticamente para todos los estudiantes activos del año escolar.
                  </p>
                </div>
              </div>
            </div>
          )}

          <FieldGroup>
            {!assignment && (
              <Field>
                <FieldLabel htmlFor="quarter">Trimestre</FieldLabel>
                <Select value={formData.quarter} onValueChange={(value) => setFormData({ ...formData, quarter: value })}>
                  <SelectTrigger id="quarter">
                    <SelectValue placeholder="Selecciona un trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map(q => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {assignment && (
              <Field>
                <FieldLabel>Trimestre</FieldLabel>
                <div className="text-sm text-muted-foreground">
                  {QUARTERS.find(q => q.value === formData.quarter)?.label || formData.quarter}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  El trimestre no puede ser modificado después de crear la asignación.
                </p>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="assignment-name">Nombre de la Asignación</FieldLabel>
              <Input
                id="assignment-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Reporte Oral, Verso Bíblico..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) {
                    handleSave()
                  }
                }}
              />
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
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim() || (!assignment && !formData.quarter)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? "Guardando..." : assignment ? "Guardar Cambios" : "Crear Asignación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

