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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Group {
  id: string
  teacherId: string
  studentId: string
  schoolYearId: string
  deletedAt: string | null
}

interface CreateGroupWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teachers: Array<{ id: string; fullName: string }>
  students: Array<{ id: string; name: string }>
  existingGroups: Group[]
  schoolYearName: string
  onSave: (data: { teacherId: string; studentIds: string[] }) => Promise<void>
}

type WizardStep = 1 | 2 | 3

export function CreateGroupWizard({
  open,
  onOpenChange,
  teachers,
  students,
  existingGroups,
  schoolYearName,
  onSave,
}: CreateGroupWizardProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [isSaving, setIsSaving] = React.useState(false)
  const [openStudentsPopover, setOpenStudentsPopover] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [errors, setErrors] = React.useState<{
    teacherId?: string
    studentIds?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    teacherId: string
    studentIds: string[]
  }>({
    teacherId: "",
    studentIds: [],
  })

  // Filter out students that are already assigned to a teacher for the selected school year
  const availableStudents = React.useMemo(() => {
    const assignedStudentIds = new Set(
      existingGroups
        .filter(g => !g.deletedAt)
        .map(g => g.studentId)
    )
    return students.filter(s => !assignedStudentIds.has(s.id))
  }, [students, existingGroups])

  // Filter students by search term
  const filteredStudents = React.useMemo(() => {
    if (!searchTerm) return availableStudents
    const search = searchTerm.toLowerCase()
    return availableStudents.filter(s =>
      s.name.toLowerCase().includes(search)
    )
  }, [availableStudents, searchTerm])

  // Get selected students names
  const selectedStudentsNames = React.useMemo(() => {
    return formData.studentIds
      .map(id => students.find(s => s.id === id)?.name)
      .filter(Boolean) as string[]
  }, [formData.studentIds, students])

  // Get selected teacher name
  const selectedTeacherName = React.useMemo(() => {
    return teachers.find(t => t.id === formData.teacherId)?.fullName || ""
  }, [formData.teacherId, teachers])

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setFormData({ teacherId: "", studentIds: [] })
      setErrors({})
      setSearchTerm("")
      setOpenStudentsPopover(false)
      setCurrentStep(1)
    }
  }, [open])

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: { teacherId?: string; studentIds?: string } = {}

    if (step === 1) {
      if (!formData.teacherId) {
        newErrors.teacherId = t("groups.teacherRequired")
      }
    } else if (step === 2) {
      if (formData.studentIds.length === 0) {
        newErrors.studentIds = t("groups.studentRequired")
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep(1)) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (validateStep(2)) {
        setCurrentStep(3)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep)
      setErrors({})
    }
  }

  const handleToggleStudent = (studentId: string) => {
    setFormData(prev => {
      const isSelected = prev.studentIds.includes(studentId)
      return {
        ...prev,
        studentIds: isSelected
          ? prev.studentIds.filter(id => id !== studentId)
          : [...prev.studentIds, studentId]
      }
    })
  }

  const handleRemoveStudent = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.filter(id => id !== studentId)
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setCurrentStep(2)
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch {
      // Error is handled by parent component via toast
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = React.useMemo(() => {
    if (currentStep === 1) {
      return formData.teacherId
    }
    if (currentStep === 2) {
      return formData.studentIds.length > 0
    }
    return true
  }, [currentStep, formData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("groups.createGroup")}</DialogTitle>
          <DialogDescription>
            {currentStep === 1 && t("groups.selectTeacher")}
            {currentStep === 2 && t("groups.selectStudents")}
            {currentStep === 3 && t("groups.preview")}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={cn("flex items-center gap-2", currentStep >= 1 && "text-primary")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2",
              currentStep >= 1 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
            )}>
              1
            </div>
            <span className={cn("text-sm", currentStep >= 1 && "font-medium")}>
              {t("groups.teacher")}
            </span>
          </div>
          <Separator className="w-12" />
          <div className={cn("flex items-center gap-2", currentStep >= 2 && "text-primary")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2",
              currentStep >= 2 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
            )}>
              2
            </div>
            <span className={cn("text-sm", currentStep >= 2 && "font-medium")}>
              {t("groups.students")}
            </span>
          </div>
          <Separator className="w-12" />
          <div className={cn("flex items-center gap-2", currentStep >= 3 && "text-primary")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2",
              currentStep >= 3 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
            )}>
              3
            </div>
            <span className={cn("text-sm", currentStep >= 3 && "font-medium")}>
              {t("groups.preview")}
            </span>
          </div>
        </div>

        {/* Step 1: Teacher */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>
                  {t("groups.teacher")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                >
                  <SelectTrigger className={errors.teacherId ? "border-destructive" : ""}>
                    <SelectValue placeholder={t("groups.selectTeacher")} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teacherId && (
                  <p className="text-sm text-destructive mt-1">{errors.teacherId}</p>
                )}
              </Field>
            </FieldGroup>
          </div>
        )}

        {/* Step 2: Select Students */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>
                  {t("groups.students")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Popover open={openStudentsPopover} onOpenChange={setOpenStudentsPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openStudentsPopover}
                      className={cn(
                        "w-full justify-between",
                        errors.studentIds ? "border-destructive" : "",
                        formData.studentIds.length === 0 && "text-muted-foreground"
                      )}
                    >
                      {formData.studentIds.length === 0
                        ? t("groups.selectStudents")
                        : t("groups.selectedStudents", { count: formData.studentIds.length })}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={t("groups.searchStudents")}
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>{t("groups.noStudentsFound")}</CommandEmpty>
                        <CommandGroup>
                          {filteredStudents.map((student) => {
                            const isSelected = formData.studentIds.includes(student.id)
                            return (
                              <CommandItem
                                key={student.id}
                                value={student.id}
                                onSelect={() => handleToggleStudent(student.id)}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {student.name}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.studentIds && (
                  <p className="text-sm text-destructive mt-1">{errors.studentIds}</p>
                )}
                {availableStudents.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("groups.allStudentsAssigned")}
                  </p>
                )}

                {/* Selected students badges */}
                {formData.studentIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudentsNames.map((name, index) => {
                      const studentId = formData.studentIds[index]
                      return (
                        <Badge
                          key={studentId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(studentId)}
                            className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </Field>
            </FieldGroup>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("groups.preview")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("groups.schoolYear")}</p>
                  <p className="text-base">{schoolYearName}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("groups.teacher")}</p>
                  <p className="text-base">{selectedTeacherName}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("groups.students")} ({formData.studentIds.length})
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudentsNames.map((name) => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSaving}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed || isSaving}
                  >
                    {t("common.next")}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSaving}
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving}
                  >
                    {isSaving ? t("common.creating") : t("common.create")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

