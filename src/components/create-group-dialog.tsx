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
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

interface Group {
  id: string
  teacherId: string
  studentId: string
  schoolYearId: string
  deletedAt: string | null
}

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teachers: Array<{ id: string; fullName: string }>
  students: Array<{ id: string; name: string }>
  existingGroups: Group[]
  onSave: (data: { teacherId: string; studentIds: string[] }) => Promise<void>
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  teachers,
  students,
  existingGroups,
  onSave,
}: CreateGroupDialogProps) {
  const { t } = useTranslation()
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

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setFormData({ teacherId: "", studentIds: [] })
      setErrors({})
      setSearchTerm("")
      setOpenStudentsPopover(false)
    }
  }, [open])

  const validateForm = (): boolean => {
    const newErrors: { teacherId?: string; studentIds?: string } = {}

    if (!formData.teacherId) {
      newErrors.teacherId = t("groups.teacherRequired")
    }

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
      await onSave(formData)
      onOpenChange(false)
    } catch {
      // Error is handled by parent component via toast
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("groups.createGroup")}</DialogTitle>
          <DialogDescription>{t("groups.createGroupDescriptionMulti")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || availableStudents.length === 0}>
              {isSaving ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}