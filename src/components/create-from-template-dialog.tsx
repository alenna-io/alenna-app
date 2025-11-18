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
import { useApi } from "@/services/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { toast } from "sonner"

interface Student {
  id: string
  firstName: string
  lastName: string
  name: string
  expectedLevel?: string
  currentLevel?: string
}

interface Template {
  id: string
  name: string
  level: string
  isDefault?: boolean
}

interface CreateFromTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSchoolYear: { id: string; name: string } | null
  onSuccess: () => void
}

export function CreateFromTemplateDialog({
  open,
  onOpenChange,
  activeSchoolYear,
  onSuccess,
}: CreateFromTemplateDialogProps) {
  const api = useApi()
  const [students, setStudents] = React.useState<Student[]>([])
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [studentSearchTerm, setStudentSearchTerm] = React.useState("")
  const [openStudentPopover, setOpenStudentPopover] = React.useState(false)
  const [templateSearchTerm, setTemplateSearchTerm] = React.useState("")
  const [openTemplatePopover, setOpenTemplatePopover] = React.useState(false)

  const [formData, setFormData] = React.useState({
    studentId: "",
    templateId: "",
  })

  // Fetch students and templates
  React.useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
          const [studentsData, templatesData] = await Promise.all([
            api.students.getAll(),
            api.projectionTemplates.getAll(), // Get all templates, not filtered by level
          ])
          setStudents(studentsData as Student[])
          setTemplates(templatesData as Template[])
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("Error al cargar los datos. Por favor, recarga la página.")
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    } else {
      // Reset form when dialog closes
      setFormData({ studentId: "", templateId: "" })
      setError(null)
      setStudentSearchTerm("")
      setTemplateSearchTerm("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedStudent = students.find(s => s.id === formData.studentId)
  const selectedTemplate = templates.find(t => t.id === formData.templateId)
  const studentLevel = selectedStudent?.expectedLevel || selectedStudent?.currentLevel
  const levelMismatch = selectedTemplate && studentLevel && selectedTemplate.level !== studentLevel

  const handleCreate = async () => {
    setError(null)

    if (!formData.studentId) {
      setError("Por favor selecciona un estudiante")
      return
    }

    if (!formData.templateId) {
      setError("Por favor selecciona una plantilla")
      return
    }

    if (!activeSchoolYear) {
      setError("No hay un año escolar activo")
      return
    }

    setIsCreating(true)
    try {
      // Check if this is a default template (L1-L8)
      if (selectedTemplate?.isDefault) {
        // Use the special endpoint for default templates (fixed pairing)
        await api.projections.generateFromDefaultTemplate({
          studentId: formData.studentId,
          schoolYear: activeSchoolYear.name,
          templateId: formData.templateId,
        })
      } else {
        // Use the dynamic algorithm for custom templates
        const template = await api.projectionTemplates.getById(formData.templateId)

        if (!template || !template.subjects) {
          throw new Error("La plantilla no contiene materias")
        }

        const payload = {
          studentId: formData.studentId,
          schoolYear: activeSchoolYear.name,
          subjects: template.subjects.map((s: { subSubjectId: string; subSubjectName: string; startPace: number; endPace: number; skipPaces?: number[]; notPairWith?: string[] }) => ({
            subSubjectId: s.subSubjectId,
            subSubjectName: s.subSubjectName,
            startPace: s.startPace,
            endPace: s.endPace,
            skipPaces: s.skipPaces || [],
            notPairWith: s.notPairWith || [],
          })),
        }

        await api.projections.generate(payload)
      }

      toast.success("Proyección creada exitosamente desde la plantilla")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("Error creating projection from template:", err)
      setError(err instanceof Error ? err.message : "Error al crear la proyección desde la plantilla.")
    } finally {
      setIsCreating(false)
    }
  }

  // Group templates by level
  const templatesByLevel = React.useMemo(() => {
    const grouped: Record<string, Template[]> = {}
    templates.forEach(template => {
      if (!grouped[template.level]) {
        grouped[template.level] = []
      }
      grouped[template.level].push(template)
    })
    return grouped
  }, [templates])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Proyección desde Plantilla</DialogTitle>
          <DialogDescription>
            Selecciona un estudiante y una plantilla para crear la proyección rápidamente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {levelMismatch && (
              <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ Advertencia: La plantilla seleccionada ({selectedTemplate?.level}) no corresponde al nivel del estudiante ({studentLevel}). Puedes continuar, pero verifica que sea correcto.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Estudiante *</Label>
              <Popover open={openStudentPopover} onOpenChange={setOpenStudentPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStudentPopover}
                    className="w-full justify-between"
                  >
                    {formData.studentId
                      ? students.find((student) => student.id === formData.studentId)?.name
                      : "Selecciona un estudiante..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar estudiante..."
                      value={studentSearchTerm}
                      onValueChange={setStudentSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron estudiantes.</CommandEmpty>
                      <CommandGroup>
                        {students
                          .filter(student =>
                            includesIgnoreAccents(student.name, studentSearchTerm) ||
                            includesIgnoreAccents(student.firstName, studentSearchTerm) ||
                            includesIgnoreAccents(student.lastName, studentSearchTerm)
                          )
                          .map((student) => (
                            <CommandItem
                              key={student.id}
                              value={student.name}
                              onSelect={() => {
                                setFormData((prev) => ({ ...prev, studentId: student.id }))
                                setOpenStudentPopover(false)
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.studentId === student.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {student.name}
                              {(student.expectedLevel || student.currentLevel) && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {student.expectedLevel || student.currentLevel}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Plantilla *</Label>
              <Popover open={openTemplatePopover} onOpenChange={setOpenTemplatePopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTemplatePopover}
                    className="w-full justify-between"
                  >
                    {formData.templateId
                      ? templates.find((template) => template.id === formData.templateId)?.name
                      : "Selecciona una plantilla..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar plantilla..."
                      value={templateSearchTerm}
                      onValueChange={setTemplateSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron plantillas.</CommandEmpty>
                      {Object.entries(templatesByLevel)
                        .sort(([levelA], [levelB]) => levelA.localeCompare(levelB))
                        .map(([level, levelTemplates]) => {
                          const filtered = levelTemplates.filter(t =>
                            !templateSearchTerm ||
                            t.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                            t.level.toLowerCase().includes(templateSearchTerm.toLowerCase())
                          )
                          if (filtered.length === 0) return null
                          return (
                            <CommandGroup key={level} heading={`Nivel ${level}`}>
                              {filtered.map((template) => (
                                <CommandItem
                                  key={template.id}
                                  value={`${level}-${template.id}`}
                                  onSelect={() => {
                                    setFormData((prev) => ({ ...prev, templateId: template.id }))
                                    setOpenTemplatePopover(false)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.templateId === template.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <span>{template.name}</span>
                                    {template.isDefault && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                        Predeterminada
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedStudent && (
              <div className="text-sm text-muted-foreground">
                <p>Estudiante: <span className="font-medium">{selectedStudent.name}</span></p>
                {studentLevel && (
                  <p>Nivel: <span className="font-medium">{studentLevel}</span></p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !formData.studentId || !formData.templateId || !activeSchoolYear}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Proyección"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

