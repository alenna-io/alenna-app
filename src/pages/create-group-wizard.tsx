import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"

type WizardStep = 1 | 2 | 3

export default function CreateGroupWizardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  // Get initial teacher ID from query params (when adding to existing group)
  const initialTeacherId = searchParams.get('teacherId')
  const initialSchoolYearId = searchParams.get('schoolYearId')

  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [openStudentsPopover, setOpenStudentsPopover] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [errors, setErrors] = React.useState<{
    groupName?: string
    teacherId?: string
    studentIds?: string
  }>({})

  const [teachers, setTeachers] = React.useState<Array<{ id: string; fullName: string }>>([])
  const [students, setStudents] = React.useState<Array<{ id: string; name: string }>>([])
  const [existingAssignments, setExistingAssignments] = React.useState<Array<{ studentId: string; groupId: string }>>([])
  const [schoolYear, setSchoolYear] = React.useState<{ id: string; name: string } | null>(null)

  const [formData, setFormData] = React.useState<{
    groupName: string
    teacherId: string
    studentIds: string[]
  }>({
    groupName: "",
    teacherId: initialTeacherId || "",
    studentIds: [],
  })

  React.useEffect(() => {
    const fetchData = async () => {
      if (!userInfo?.schoolId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Fetch school years
        const schoolYears = await api.schoolYears.getAll()
        const activeYear = schoolYears.find((sy: { isActive: boolean }) => sy.isActive)
        const selectedYear = initialSchoolYearId
          ? schoolYears.find((sy: { id: string }) => sy.id === initialSchoolYearId)
          : activeYear || schoolYears[0]

        if (!selectedYear) {
          toast.error(t("groups.noSchoolYear"))
          navigate("/groups")
          return
        }

        setSchoolYear(selectedYear)

        // Fetch teachers
        const teachersData = await api.schools.getMyTeachers()
        setTeachers(teachersData.map((t: { id: string; fullName: string }) => ({ id: t.id, fullName: t.fullName })))

        // Fetch students
        const studentsData = await api.students.getAll()
        setStudents(studentsData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))

        // Fetch existing assignments for the school year
        const assignmentsData = await api.groups.getStudentAssignments(selectedYear.id)
        setExistingAssignments(assignmentsData)

        // If initialTeacherId is provided, pre-fill the form and skip to step 2
        if (initialTeacherId) {
          setFormData(prev => ({ ...prev, teacherId: initialTeacherId }))
          // Auto-advance to step 2 if teacher is pre-filled
          setCurrentStep(2)
        }
      } catch (error) {
        console.error('Error fetching wizard data:', error)
        toast.error(t("groups.loadError"))
        navigate("/groups")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser && userInfo) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, isLoadingUser, initialTeacherId, initialSchoolYearId])

  // Filter out students that are already assigned to a teacher for the selected school year
  const availableStudents = React.useMemo(() => {
    if (!schoolYear) return []

    // If we're adding to an existing group, allow all students that are NOT already assigned to ANY group
    // (This assumes one student = one group per year constraint is strict)

    // BUT, if we are editing, we might want to see students assigned to THIS group?
    // No, this wizard creates NEW assignments.

    // Get set of all student IDs that have an assignment
    const assignedStudentIds = new Set(existingAssignments.map(a => a.studentId))

    return students.filter(s => !assignedStudentIds.has(s.id))
  }, [students, existingAssignments, schoolYear])

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

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: { groupName?: string; teacherId?: string; studentIds?: string } = {}

    if (step === 1) {
      if (!formData.groupName.trim()) {
        newErrors.groupName = t("groups.groupNameRequired")
      }
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
    } else {
      navigate("/groups")
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

    if (!schoolYear) {
      toast.error(t("groups.noSchoolYear"))
      return
    }

    setIsSaving(true)
    try {
      // Create one group with all students
      await api.groups.create({
        teacherId: formData.teacherId,
        schoolYearId: schoolYear.id,
        name: formData.groupName.trim() || null,
        studentIds: formData.studentIds
      })

      toast.success(
        t("groups.createSuccessMulti", {
          count: formData.studentIds.length,
          teacherName: selectedTeacherName || t("groups.teacher")
        })
      )

      // Navigate back
      if (initialTeacherId && schoolYear) {
        navigate(`/groups/${schoolYear.id}/${initialTeacherId}`)
      } else {
        navigate("/groups")
      }
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("groups.createError"))
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = React.useMemo(() => {
    if (currentStep === 1) {
      return formData.groupName.trim() && formData.teacherId
    }
    if (currentStep === 2) {
      return formData.studentIds.length > 0
    }
    return true
  }, [currentStep, formData])

  const steps = [
    { number: 1, title: t("groups.wizardStep1"), description: t("groups.wizardStep1Description") },
    { number: 2, title: t("groups.wizardStep2"), description: t("groups.wizardStep2Description") },
    { number: 3, title: t("groups.wizardStep3"), description: t("groups.wizardStep3Description") },
  ]

  if (isLoadingUser || isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen">
      <div className="w-full p-3 space-y-6">
        <BackButton to={initialTeacherId && schoolYear ? `/groups/${schoolYear.id}/${initialTeacherId}` : "/groups"}>
          {initialTeacherId ? t("common.back") : t("groups.backToGroups")}
        </BackButton>

        <PageHeader
          title={initialTeacherId ? t("groups.addStudents") : t("groups.createGroup")}
          description={initialTeacherId ? t("groups.addStudentsDescription") : t("groups.createGroupDescription")}
        />

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                      currentStep > step.number
                        ? "bg-green-500 text-white"
                        : currentStep === step.number
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={cn(
                      "text-sm font-medium",
                      currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                    )}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-2 transition-colors",
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6 bg-white rounded-lg shadow-sm">
          <CardContent className="p-8">
            {/* Step 1: Group Name and Teacher */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel>
                      {t("groups.groupName")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      value={formData.groupName}
                      onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                      placeholder={t("groups.groupNamePlaceholder")}
                      className={errors.groupName ? "border-destructive" : ""}
                    />
                    {errors.groupName && (
                      <p className="text-sm text-destructive mt-1">{errors.groupName}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t("groups.teacher")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={formData.teacherId}
                      onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                      disabled={!!initialTeacherId}
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
                    {initialTeacherId && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("groups.teacherLocked")}
                      </p>
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
                        {initialTeacherId ? t("groups.allStudentsAssignedToTeacher") : t("groups.allStudentsAssigned")}
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
                      <p className="text-sm font-medium text-muted-foreground">{t("groups.groupName")}</p>
                      <p className="text-base">{formData.groupName}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t("groups.schoolYear")}</p>
                      <p className="text-base">{schoolYear?.name || ""}</p>
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
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSaving}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || isSaving}
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? t("common.creating") : t("common.create")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

