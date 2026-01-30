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
import { useApi, type GenerateProjectionSubject } from "@/services/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

interface StudentDisplay {
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [students, setStudents] = React.useState<StudentDisplay[]>([])
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
          // TODO: Re-implement when API methods are available
          const [studentsData, templatesData] = await Promise.all([
            api.students.getEnrolledWithoutOpenProjection(),
            Promise.resolve([] as Template[]), // api.projectionTemplates.getAll() - not implemented
          ])
          // Map API Student type to component's expected format
          const mappedStudents: StudentDisplay[] = studentsData.map(s => ({
            id: s.id,
            firstName: s.user?.firstName || '',
            lastName: s.user?.lastName || '',
            name: s.user?.firstName && s.user?.lastName
              ? `${s.user.firstName} ${s.user.lastName}`
              : s.user?.email || '',
            expectedLevel: undefined, // TODO: Add when available in API
            currentLevel: undefined, // TODO: Add when available in API
          }))
          setStudents(mappedStudents)
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
      // TODO: Re-implement when API methods are available
      // For now, use the generate method with a placeholder payload
      // This will need to be fixed when projection templates are implemented
      const userInfo = await api.schools.getWithCurrentYear()
      if (!userInfo?.schoolYears?.[0]) {
        throw new Error("No hay un año escolar activo")
      }

      const payload = {
        studentId: formData.studentId,
        schoolYear: activeSchoolYear.name,
        schoolId: userInfo.id,
        subjects: [] as GenerateProjectionSubject[], // TODO: Get from template when available
      }

      const projection = await api.projections.generate(payload) as { id: string; studentId: string }

      toast.success(t("projections.createdFromTemplateSuccess"))
      onSuccess()
      onOpenChange(false)
      navigate(`/students/${projection.studentId}/projections/${projection.id}`)
    } catch (err) {
      console.error("Error creating projection from template:", err)
      let errorMessage = err instanceof Error ? err.message : "Error al crear la proyección desde la plantilla."

      // Translate error message if it's a known backend error
      if (errorMessage.includes("Projection must contain at least 72 total paces")) {
        errorMessage = t("projections.minimumPacesRequired")
      } else if (errorMessage.includes("At least one subject is required")) {
        errorMessage = t("projections.atLeastOneSubjectRequired")
      } else if (errorMessage.includes("Student not found")) {
        errorMessage = t("projections.studentNotFound")
      } else if (errorMessage.includes("School not found")) {
        errorMessage = t("projections.schoolNotFound")
      } else if (errorMessage.includes("School year not found")) {
        errorMessage = t("projections.schoolYearNotFound")
      } else if (errorMessage.includes("School year is not active")) {
        errorMessage = t("projections.schoolYearNotActive")
      }

      setError(errorMessage)
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
          <DialogTitle>{t("projections.createFromTemplateTitle")}</DialogTitle>
          <DialogDescription>
            {t("projections.createFromTemplateDescription")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">{t("projections.loading")}</p>
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
                  {t("projections.levelMismatchWarning", { templateLevel: selectedTemplate?.level, studentLevel })}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t("projections.student")} *</Label>
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
                      : t("projections.selectStudentPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={t("projections.searchStudent")}
                      value={studentSearchTerm}
                      onValueChange={setStudentSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>{t("projections.noStudentsFound")}</CommandEmpty>
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
              <Label>{t("projections.template")} *</Label>
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
                      : t("projections.selectTemplatePlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={t("projections.searchTemplate")}
                      value={templateSearchTerm}
                      onValueChange={setTemplateSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>{t("projections.noTemplatesFound")}</CommandEmpty>
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
                            <CommandGroup key={level} heading={t("projections.levelHeading", { level })}>
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
                                        {t("projections.default")}
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
                <p>{t("projections.student")}: <span className="font-medium">{selectedStudent.name}</span></p>
                {studentLevel && (
                  <p>{t("projections.level")}: <span className="font-medium">{studentLevel}</span></p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !formData.studentId || !formData.templateId || !activeSchoolYear}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("projections.creating")}
              </>
            ) : (
              t("projections.createProjection")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

