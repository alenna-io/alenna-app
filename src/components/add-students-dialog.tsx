import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface AddStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId: string
  schoolYearId: string
  groupName: string | null
  students: Array<{ id: string; name: string }>
  // existingAssignments: Set of student IDs that are already assigned to ANY group in this school year
  existingAssignments: Array<{ studentId: string; groupId: string }>
  onSave: (studentIds: string[]) => Promise<void>
}

export function AddStudentsDialog({
  open,
  onOpenChange,
  teacherId: _teacherId,
  schoolYearId: _schoolYearId,
  groupName: _groupName,
  students,
  existingAssignments,
  onSave,
}: AddStudentsDialogProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = React.useState(false)
  const [openStudentsPopover, setOpenStudentsPopover] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [errors, setErrors] = React.useState<{
    studentIds?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    studentIds: string[]
  }>({
    studentIds: [],
  })

  // Filter out students that are already assigned to ANY group for this school year
  const availableStudents = React.useMemo(() => {
    const assignedStudentIds = new Set(existingAssignments.map(a => a.studentId))
    return students.filter(s => !assignedStudentIds.has(s.id))
  }, [students, existingAssignments])

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

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setFormData({ studentIds: [] })
      setErrors({})
      setSearchTerm("")
      setOpenStudentsPopover(false)
    }
  }, [open])

  const validateForm = (): boolean => {
    const newErrors: { studentIds?: string } = {}

    if (formData.studentIds.length === 0) {
      newErrors.studentIds = t("groups.studentRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData.studentIds)
      toast.success(t("groups.assignmentSuccess"))
      onOpenChange(false)
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("groups.assignmentError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("groups.addStudents")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                  {t("groups.allStudentsAssignedToTeacher")}
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

          <DialogFooter className='mt-4'>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || availableStudents.length === 0}>
              {isSaving ? t("common.creating") : t("common.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

