import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { useApi, type CategoryWithSubjects, type GenerateProjectionSubject, type Student, type SubjectWithPaces } from "@/services/api"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/contexts/UserContext"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { isElectivesCategory } from "@/utils/elective-utils"
import { Step1SelectStudent } from "./generate-projection-wizard/Step1SelectStudent"
import { Step2SelectSubjects } from "./generate-projection-wizard/Step2SelectSubjects"
import { Step3Review } from "./generate-projection-wizard/Step3Review"
import type { SubjectConfig, WizardStep, FormData } from "./generate-projection-wizard/types"

export default function GenerateProjectionWizardPageV2() {
  const navigate = useNavigate()
  const api = useApi()
  const { t } = useTranslation()
  const { userInfo, isLoading: isLoadingUser } = useUser()

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])
  const isSuperAdmin = hasRole('SUPERADMIN')

  React.useEffect(() => {
    if (isSuperAdmin) {
      navigate('/users', { replace: true })
    }
  }, [isSuperAdmin, navigate])

  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [students, setStudents] = React.useState<Student[]>([])
  const [categories, setCategories] = React.useState<CategoryWithSubjects[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = React.useState("")
  const [openStudentPopover, setOpenStudentPopover] = React.useState(false)
  const [activeSchoolYear, setActiveSchoolYear] = React.useState<{ id: string; name: string } | null>(null)

  const [subjectSearchTerms, setSubjectSearchTerms] = React.useState<Record<number, string>>({})
  const [openSubjectPopoverIndex, setOpenSubjectPopoverIndex] = React.useState<number | null>(null)
  const [subjectPaces, setSubjectPaces] = React.useState<Record<string, SubjectWithPaces[]>>({})
  const [loadingPaces, setLoadingPaces] = React.useState<Record<string, boolean>>({})
  const [expandedSubjectIndex, setExpandedSubjectIndex] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState<FormData>({
    studentId: "",
    schoolId: "",
    schoolYear: "",
    subjects: [{
      categoryId: "",
      subjectId: "",
      startPace: 0,
      endPace: 0,
      skipPaces: [],
      notPairWith: [],
      extendToNextLevel: false,
    }],
  })

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [studentsData, categoriesData, schoolDataResponse] = await Promise.all([
          api.students.getEnrolledWithoutOpenProjection(),
          api.categories.getAllWithSubjects(),
          api.schools.getWithCurrentYear(),
        ])

        setStudents(studentsData as Student[])
        setCategories(categoriesData as CategoryWithSubjects[])

        if (schoolDataResponse) {
          const activeYear = schoolDataResponse.schoolYears?.find(sy => sy.status === 'CURRENT_YEAR')
          // Use schoolId from response, or fallback to userInfo.schoolId
          const schoolId = schoolDataResponse.id || userInfo?.schoolId

          if (activeYear && schoolId) {
            setActiveSchoolYear({ id: activeYear.id, name: activeYear.name })
            setFormData(prev => ({
              ...prev,
              schoolId: schoolId,
              schoolYear: activeYear.id,
            }))
          } else if (!schoolId) {
            console.error("School ID missing:", { schoolDataResponse, userInfo })
            toast.error("Error: No se pudo obtener el ID de la escuela")
          } else if (!activeYear) {
            toast.error("Error: No hay un año escolar activo")
          }
        } else {
          // Fallback to userInfo.schoolId if school data is not available
          if (userInfo?.schoolId) {
            console.warn("No school data response, using userInfo.schoolId:", userInfo.schoolId)
            setFormData(prev => ({
              ...prev,
              schoolId: userInfo.schoolId,
            }))
          } else {
            console.error("No school data received and no userInfo.schoolId")
            toast.error("Error: No se pudo obtener la información de la escuela")
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Error al cargar los datos. Por favor, recarga la página.")
      } finally {
        setLoading(false)
      }
    }

    if (!isLoadingUser) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, userInfo?.schoolId])

  // Expand first subject by default when entering step 2
  React.useEffect(() => {
    if (currentStep === 2 && expandedSubjectIndex === null && formData.subjects.length > 0) {
      setExpandedSubjectIndex(0)
    }
  }, [currentStep, expandedSubjectIndex, formData.subjects.length])

  const selectedStudent = React.useMemo(() => {
    return students.find(s => s.id === formData.studentId)
  }, [students, formData.studentId])

  const getAllSubjects = React.useMemo(() => {
    const all: Array<{ id: string; name: string; categoryId: string; categoryName: string }> = []
    categories.forEach(category => {
      category.subjects.forEach(subject => {
        all.push({
          id: subject.id,
          name: subject.name,
          categoryId: category.id,
          categoryName: category.name,
        })
      })
    })
    return all
  }, [categories])

  const getSubjectName = React.useCallback((subjectId: string): string => {
    const subject = getAllSubjects.find(s => s.id === subjectId)
    if (subject) return subject.name
    const subjectDataArray = Object.values(subjectPaces).flat()
    const subjectData = subjectDataArray.find(s => s.id === subjectId)
    return subjectData?.name || `${t("projections.subject")}`
  }, [getAllSubjects, subjectPaces, t])

  const getAvailableSubjectsForIndex = React.useCallback((index: number) => {
    const searchTerm = subjectSearchTerms[index] || ""

    const otherSelectedCategories = formData.subjects
      .map((s, i) => i !== index ? s.categoryId : null)
      .filter((id): id is string => id !== null)

    return getAllSubjects.filter(subject => {
      const category = categories.find(c => c.id === subject.categoryId)
      if (!category) return false

      const isElectives = isElectivesCategory(category.name)
      const isAlreadySelected = otherSelectedCategories.includes(subject.categoryId) && !isElectives

      if (isAlreadySelected) return false

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return subject.name.toLowerCase().includes(searchLower) ||
          category.name.toLowerCase().includes(searchLower)
      }

      return true
    })
  }, [getAllSubjects, categories, formData.subjects, subjectSearchTerms])

  const fetchPacesForSubject = React.useCallback(async (subjectId: string) => {
    if (!subjectId || subjectPaces[subjectId]) return

    setLoadingPaces(prev => ({ ...prev, [subjectId]: true }))
    try {
      const paces = await api.subjects.getSubjectAndNextLevelsWithPaces(subjectId)
      setSubjectPaces(prev => ({ ...prev, [subjectId]: paces }))
    } catch (error) {
      console.error("Error fetching paces:", error)
      toast.error("Error al cargar los paces. Por favor, intenta de nuevo.")
    } finally {
      setLoadingPaces(prev => ({ ...prev, [subjectId]: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectPaces])

  // Get how many levels ahead exist in the same category for a subject
  const getNextLevelsCount = React.useCallback((subjectIndex: number): number => {
    const subject = formData.subjects[subjectIndex]
    if (!subject?.subjectId) return 0

    const allPacesData = subjectPaces[subject.subjectId] || []
    if (allPacesData.length === 0) return 0

    let selectedSubjectData = allPacesData.find(s => s.id === subject.subjectId)
    if (!selectedSubjectData && allPacesData.length > 0) {
      selectedSubjectData = allPacesData[0]
    }

    if (!selectedSubjectData) return 0

    const currentLevelNumber = selectedSubjectData.level.number
    if (currentLevelNumber === null || currentLevelNumber === undefined) {
      // Electives don't have levels, so no next levels
      return 0
    }

    // Count how many subjects with higher level numbers exist in the fetched data
    // The backend already returns current + next 2 levels, so we can check what's available
    const subjectsWithLevels = allPacesData
      .filter(s => s.level.number !== null && s.level.number !== undefined)
      .sort((a, b) => (a.level.number || 0) - (b.level.number || 0))

    // Find the highest level number in the fetched data
    const maxLevel = Math.max(...subjectsWithLevels.map(s => s.level.number || 0))
    const nextLevels = maxLevel - currentLevelNumber

    // Return max 2 levels ahead (as per backend limit)
    return Math.min(nextLevels, 2)
  }, [formData.subjects, subjectPaces])

  // Memoize available paces per subject to avoid recalculating
  const availablePacesCache = React.useRef<Record<string, number[]>>({})

  // Get available paces for a subject (always 12 for current, optionally more if extended)
  const getAvailablePacesForSubject = React.useCallback((subjectIndex: number) => {
    const subject = formData.subjects[subjectIndex]
    if (!subject?.subjectId) return []

    const cacheKey = `${subject.subjectId}-${subject.extendToNextLevel || false}`
    if (availablePacesCache.current[cacheKey]) {
      return availablePacesCache.current[cacheKey]
    }

    const allPacesData = subjectPaces[subject.subjectId] || []
    if (allPacesData.length === 0) return []

    let selectedSubjectData = allPacesData.find(s => s.id === subject.subjectId)
    if (!selectedSubjectData && allPacesData.length > 0) {
      selectedSubjectData = allPacesData[0]
    }

    if (!selectedSubjectData) return []

    const currentLevelNumber = selectedSubjectData.level.number

    // For electives (no level number), return all paces
    if (currentLevelNumber === null || currentLevelNumber === undefined) {
      const allPaces = selectedSubjectData.paces || []
      const paceCodes = allPaces
        .map(p => parseInt(p.code, 10))
        .filter(n => !isNaN(n) && n >= 1 && Number.isInteger(n))
        .sort((a, b) => a - b)

      const result = [...new Set(paceCodes)]
      availablePacesCache.current[cacheKey] = result
      return result
    }

    // For regular subjects, always show current level's paces (12 paces)
    // If extendToNextLevel is true, also include next levels
    const targetLevelNumbers = [currentLevelNumber]

    if (subject.extendToNextLevel) {
      const nextLevelsCount = getNextLevelsCount(subjectIndex)
      for (let i = 1; i <= nextLevelsCount; i++) {
        targetLevelNumbers.push(currentLevelNumber + i)
      }
    }

    const filteredSubjects = allPacesData.filter(s => {
      const levelNum = s.level.number
      return levelNum !== null && targetLevelNumbers.includes(levelNum)
    })

    const allPaces = filteredSubjects.flatMap(s => s.paces)
    const paceCodes = allPaces
      .map(p => parseInt(p.code, 10))
      .filter(n => !isNaN(n) && n >= 1 && Number.isInteger(n))
      .sort((a, b) => a - b)

    const result = [...new Set(paceCodes)]
    availablePacesCache.current[cacheKey] = result
    return result
  }, [formData.subjects, subjectPaces, getNextLevelsCount])

  // Clear cache when subjects or paces change significantly
  const subjectPacesKeys = React.useMemo(() => Object.keys(subjectPaces).join(','), [subjectPaces])
  React.useEffect(() => {
    availablePacesCache.current = {}
  }, [formData.subjects.length, subjectPacesKeys])

  const handleAddSubject = () => {
    if (formData.subjects.length >= 6) return
    const newIndex = formData.subjects.length
    setFormData(prev => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          categoryId: "",
          subjectId: "",
          startPace: 0,
          endPace: 0,
          skipPaces: [],
          notPairWith: [],
        },
      ],
    }))
    setExpandedSubjectIndex(newIndex)
  }

  const handleRemoveSubject = (index: number) => {
    if (index === 0) return
    setFormData(prev => {
      const removed = prev.subjects[index]
      const newSubjects = prev.subjects.filter((_, i) => i !== index)

      const updatedSubjects = newSubjects.map(s => ({
        ...s,
        notPairWith: s.notPairWith.filter(id => id !== removed?.subjectId),
      }))

      return {
        ...prev,
        subjects: updatedSubjects,
      }
    })

    if (expandedSubjectIndex === index) {
      setExpandedSubjectIndex(null)
    } else if (expandedSubjectIndex !== null && expandedSubjectIndex > index) {
      setExpandedSubjectIndex(expandedSubjectIndex - 1)
    }
  }

  const handleSubjectSelect = React.useCallback((index: number, subjectId: string) => {
    const subject = getAllSubjects.find(s => s.id === subjectId)
    if (!subject) return

    const category = categories.find(c => c.id === subject.categoryId)
    if (!category) return

    const isElectives = isElectivesCategory(category.name)

    setFormData(prev => {
      const otherSelectedCategories = prev.subjects
        .map((s, i) => i !== index ? s.categoryId : null)
        .filter((id): id is string => id !== null)

      if (!isElectives && otherSelectedCategories.includes(subject.categoryId)) {
        toast.error(`Ya has seleccionado una materia de la categoría "${category.name}". Solo puedes seleccionar una materia por categoría (excepto Electivas).`)
        return prev
      }

      return {
        ...prev,
        subjects: prev.subjects.map((s, i) => {
          if (i === index) {
            return {
              ...s,
              categoryId: subject.categoryId,
              subjectId: subject.id,
              startPace: 0,
              endPace: 0,
              skipPaces: [],
              extendToNextLevel: false, // Reset extend when subject changes
            }
          }
          return s
        }),
      }
    })

    fetchPacesForSubject(subjectId)
    setOpenSubjectPopoverIndex(null)
    setExpandedSubjectIndex(index)
  }, [getAllSubjects, categories, fetchPacesForSubject])

  const handleSubjectChange = React.useCallback((index: number, field: keyof SubjectConfig, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => {
        if (i === index) {
          if (field === 'startPace') {
            const startPace = value as number
            return { ...subject, startPace, endPace: subject.endPace < startPace ? startPace : subject.endPace }
          }
          return { ...subject, [field]: value }
        }
        return subject
      }),
    }))
  }, [])

  const handleSkipPaceChange = React.useCallback((index: number, pace: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => {
        if (i === index) {
          const skipPaces = checked
            ? [...subject.skipPaces, pace]
            : subject.skipPaces.filter(p => p !== pace)
          return { ...subject, skipPaces }
        }
        return subject
      }),
    }))
  }, [])

  const handleNotPairWithChange = React.useCallback((index: number, otherSubjectId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) => {
        if (i === index) {
          const notPairWith = checked
            ? [...subject.notPairWith, otherSubjectId]
            : subject.notPairWith.filter(id => id !== otherSubjectId)
          return { ...subject, notPairWith }
        } else if (subject.subjectId === otherSubjectId) {
          const notPairWith = checked
            ? [...subject.notPairWith, prev.subjects[index].subjectId]
            : subject.notPairWith.filter(id => id !== prev.subjects[index].subjectId)
          return { ...subject, notPairWith }
        }
        return subject
      }),
    }))
  }, [])

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        if (!formData.studentId) {
          toast.error("Por favor selecciona un estudiante")
          return false
        }
        if (!formData.schoolYear || !activeSchoolYear) {
          toast.error("No hay un año escolar activo")
          return false
        }
        return true
      case 2: {
        const hasValidSubject = formData.subjects.some(s => s.subjectId && s.startPace > 0 && s.endPace > 0)
        if (!hasValidSubject) {
          toast.error("Por favor configura al menos una materia")
          return false
        }

        const invalidSubjects = formData.subjects.filter(s => {
          return !s.subjectId ||
            !s.startPace ||
            !s.endPace ||
            s.startPace < 1 ||
            s.endPace < 1 ||
            !Number.isInteger(s.startPace) ||
            !Number.isInteger(s.endPace) ||
            s.startPace >= s.endPace
        })

        if (invalidSubjects.length > 0) {
          toast.error("Por favor completa todos los campos de las materias correctamente. Los paces deben ser números enteros positivos y el inicial debe ser menor que el final.")
          return false
        }

        return true
      }
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as WizardStep)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
    }
  }

  const handleGenerate = async () => {
    if (!validateStep(2)) {
      setCurrentStep(2)
      return
    }

    setIsGenerating(true)
    try {
      // Validate required fields before sending
      if (!formData.studentId || !formData.studentId.trim()) {
        toast.error("Por favor selecciona un estudiante")
        setCurrentStep(1)
        setIsGenerating(false)
        return
      }

      if (!formData.schoolId || !formData.schoolId.trim()) {
        console.error("Missing schoolId:", { formData, activeSchoolYear })
        toast.error("Error: falta información de la escuela. Por favor, recarga la página.")
        setIsGenerating(false)
        return
      }

      if (!formData.schoolYear || !formData.schoolYear.trim()) {
        console.error("Missing schoolYear:", { formData, activeSchoolYear })
        toast.error("Error: falta información del año escolar. Por favor, recarga la página.")
        setIsGenerating(false)
        return
      }

      const trimmedSchoolId = formData.schoolId.trim()
      const trimmedSchoolYear = formData.schoolYear.trim()
      const trimmedStudentId = formData.studentId.trim()

      // Log the values being sent for debugging
      console.log("Generating projection with:", {
        studentId: trimmedStudentId,
        schoolId: trimmedSchoolId,
        schoolYear: trimmedSchoolYear,
        studentIdLength: trimmedStudentId.length,
        schoolIdLength: trimmedSchoolId.length,
        schoolYearLength: trimmedSchoolYear.length,
      })

      const generateInput = {
        studentId: trimmedStudentId,
        schoolId: trimmedSchoolId,
        schoolYear: trimmedSchoolYear,
        subjects: formData.subjects.map(s => ({
          categoryId: s.categoryId.trim(),
          subjectId: s.subjectId?.trim() || null,
          startPace: s.startPace,
          endPace: s.endPace,
          skipPaces: s.skipPaces,
          notPairWith: s.notPairWith,
          difficulty: null,
        })) as GenerateProjectionSubject[],
      }

      const result = await api.projections.generate(generateInput)
      toast.success(t("projections.generatedSuccessfully"))
      navigate(`/students/${formData.studentId}/projections/${result.id}`)
    } catch (error) {
      console.error("Error generating projection:", error)
      let errorMessage = t("projections.errorGenerating") || "Error al generar la proyección. Por favor, inténtalo de nuevo."

      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { error?: string; issues?: Array<{ message?: string }> } } }
        const issues = err.response?.data?.issues || []
        if (issues.length > 0 && issues[0]?.message) {
          errorMessage = issues[0].message
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      setCurrentStep(2)
    } finally {
      setIsGenerating(false)
    }
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || ""
  }

  const subjectsByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof getAllSubjects> = {}
    getAllSubjects.forEach(subject => {
      const category = categories.find(c => c.id === subject.categoryId)
      const categoryName = category?.name || ""
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(subject)
    })
    return grouped
  }, [getAllSubjects, categories])

  if (isSuperAdmin) {
    return <Navigate to="/users" replace />
  }

  if (loading || isLoadingUser) {
    return (
      <div className="space-y-6">
        <PageHeader
          moduleKey="projections"
          title={t("projections.generateProjection")}
          description={t("projections.generateDescription")}
        />
        <div className="w-full flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center flex-1">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
              {step < 3 && <div className="flex-1 mx-4"><Skeleton className="h-1 w-full" /></div>}
            </React.Fragment>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <PageHeader
          moduleKey="projections"
          title={t("projections.generateProjection")}
          description={t("projections.generateDescription")}
        />
      </div>

      {/* Progress Steps */}
      <div className="w-full flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => {
          const stepLabels = [
            t("projections.step1Title"),
            t("projections.step2Title"),
            t("projections.step3Title"),
          ]
          const isActive = currentStep === step
          const isCompleted = currentStep > step

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20"
                      : isCompleted
                        ? "bg-green-500 text-white shadow-md shadow-green-500/20 scale-100"
                        : "bg-muted text-muted-foreground scale-100"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="relative z-10">{step}</span>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-pulse opacity-20" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-xs font-medium transition-colors duration-300",
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-green-600"
                          : "text-muted-foreground"
                    )}
                  >
                    {stepLabels[step - 1]}
                  </div>
                </div>
              </div>
              {step < 3 && (
                <div className="flex-1 mx-4 relative">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        isCompleted
                          ? "bg-green-500 w-full"
                          : isActive
                            ? "bg-primary w-1/2"
                            : "bg-muted w-0"
                      )}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Components */}
      {currentStep === 1 && (
        <Step1SelectStudent
          students={students}
          selectedStudentId={formData.studentId}
          onStudentSelect={(studentId) => setFormData(prev => ({ ...prev, studentId }))}
          studentSearchTerm={studentSearchTerm}
          onSearchChange={setStudentSearchTerm}
          openStudentPopover={openStudentPopover}
          onOpenPopoverChange={setOpenStudentPopover}
          activeSchoolYear={activeSchoolYear}
          onNext={handleNext}
          onCancel={() => navigate("/projections")}
          canProceed={!!formData.studentId && !!formData.schoolYear}
        />
      )}

      {currentStep === 2 && (
        <Step2SelectSubjects
          subjects={formData.subjects}
          onAddSubject={handleAddSubject}
          onRemoveSubject={handleRemoveSubject}
          onSubjectSelect={handleSubjectSelect}
          onSubjectChange={handleSubjectChange}
          onSkipPaceChange={handleSkipPaceChange}
          onNotPairWithChange={handleNotPairWithChange}
          expandedSubjectIndex={expandedSubjectIndex}
          onToggleExpand={(index) => setExpandedSubjectIndex(expandedSubjectIndex === index ? null : index)}
          getAvailablePacesForSubject={getAvailablePacesForSubject}
          loadingPaces={loadingPaces}
          subjectsByCategory={subjectsByCategory}
          getAvailableSubjectsForIndex={getAvailableSubjectsForIndex}
          subjectSearchTerms={subjectSearchTerms}
          onSearchChange={(index, value) => setSubjectSearchTerms(prev => ({ ...prev, [index]: value }))}
          openSubjectPopoverIndex={openSubjectPopoverIndex}
          onOpenPopoverChange={setOpenSubjectPopoverIndex}
          getSubjectName={getSubjectName}
          getNextLevelsCount={getNextLevelsCount}
          getCategoryName={getCategoryName}
          onBack={handleBack}
          onNext={handleNext}
          canProceed={formData.subjects.length > 0 && !formData.subjects.some(s => !s.subjectId || !s.startPace || !s.endPace || s.startPace >= s.endPace)}
        />
      )}

      {currentStep === 3 && (
        <Step3Review
          selectedStudent={selectedStudent}
          activeSchoolYear={activeSchoolYear}
          subjects={formData.subjects}
          getSubjectName={getSubjectName}
          getCategoryName={getCategoryName}
          onBack={handleBack}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}
    </div>
  )
}
