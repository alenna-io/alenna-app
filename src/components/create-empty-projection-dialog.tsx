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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApi } from "@/services/api"

interface Student {
  id: string
  firstName: string
  lastName: string
  name: string
}

interface CreateEmptyProjectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: { studentId: string; schoolYear: string }) => Promise<void>
  activeSchoolYear: { id: string; name: string } | null
}

export function CreateEmptyProjectionDialog({
  open,
  onOpenChange,
  onCreate,
  activeSchoolYear,
}: CreateEmptyProjectionDialogProps) {
  const api = useApi()
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)

  const [formData, setFormData] = React.useState({
    studentId: "",
    schoolYear: "",
  })

  // Fetch students when dialog opens
  React.useEffect(() => {
    if (open) {
      const fetchStudents = async () => {
        setLoading(true)
        try {
          const studentsData = await api.students.getAll()
          setStudents(studentsData as Student[])
        } catch (error) {
          console.error("Error fetching students:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchStudents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Reset form when dialog closes or opens
  React.useEffect(() => {
    if (!open) {
      setFormData({
        studentId: "",
        schoolYear: "",
      })
    } else if (open && activeSchoolYear) {
      // Set active school year when dialog opens
      setFormData((prev) => ({
        ...prev,
        schoolYear: activeSchoolYear.name,
      }))
    }
  }, [open, activeSchoolYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.studentId || !formData.schoolYear) {
      return
    }

    setIsCreating(true)
    try {
      await onCreate(formData)
    } catch (error) {
      console.error("Error creating empty projection:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Proyección Vacía</DialogTitle>
          <DialogDescription>
            Crea una proyección sin lecciones. Podrás agregar lecciones manualmente después.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Cargando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">Estudiante *</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, studentId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolYear">Año Escolar *</Label>
              {activeSchoolYear ? (
                <div className="p-3 rounded-md border bg-blue-50 border-blue-200">
                  <div className="text-sm font-medium text-blue-900">{activeSchoolYear.name}</div>
                  <div className="text-xs text-blue-700 mt-1">Año escolar activo</div>
                </div>
              ) : (
                <div className="p-3 rounded-md border bg-yellow-50 border-yellow-200">
                  <div className="text-sm text-yellow-800">No hay un año escolar activo</div>
                </div>
              )}
              <input type="hidden" value={activeSchoolYear?.name || ""} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || !formData.studentId || !formData.schoolYear || !activeSchoolYear}>
                {isCreating ? "Creando..." : "Crear Proyección"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

