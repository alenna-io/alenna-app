import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, X, Eye, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Check, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react"
import { useApi } from "@/services/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { Loading } from "@/components/ui/loading"
import { useUser } from "@/contexts/UserContext"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface Subject {
  id: string
  name: string
  code?: string
  categoryId: string
  categoryName: string
  levelId: string
  levelName: string
  levelNumber?: number
  difficulty: number
}

interface Student {
  id: string
  firstName: string
  lastName: string
  name: string
  expectedLevel?: string
  currentLevel?: string
}

interface PaceCatalogItem {
  id: string
  code: string
  name: string
  subSubjectName: string
  subSubjectId?: string
  categoryName: string
  levelId: string
  difficulty: number
}

interface SubjectConfig {
  subSubjectId: string
  subSubjectName: string
  startPace: number
  endPace: number
  skipPaces: number[]
  notPairWith: string[] // Array of other subject IDs
  extendToNextLevel?: boolean // Allow extending to next contiguous subjects
}

type WizardStep = 1 | 2 | 3 | 4

export default function GenerateProjectionWizardPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { isLoading: isLoadingUser } = useUser()
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [students, setStudents] = React.useState<Student[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [subjectSearchTerms, setSubjectSearchTerms] = React.useState<Record<number, string>>({})
  const [openSubjectPopovers, setOpenSubjectPopovers] = React.useState<Record<number, boolean>>({})
  const [studentSearchTerm, setStudentSearchTerm] = React.useState("")
  const [openStudentPopover, setOpenStudentPopover] = React.useState(false)
  const [paceCatalogs, setPaceCatalogs] = React.useState<Record<string, PaceCatalogItem[]>>({})
  const [loadingPaces, setLoadingPaces] = React.useState<Record<string, boolean>>({})
  const [activeSchoolYear, setActiveSchoolYear] = React.useState<{ id: string; name: string } | null>(null)
  const [expandedSubjectIndex, setExpandedSubjectIndex] = React.useState<number | null>(0) // Start with first subject expanded
  const [templates, setTemplates] = React.useState<Array<{ id: string; name: string; level: string }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("none")

  const [formData, setFormData] = React.useState({
    studentId: "",
    schoolYear: "",
    subjects: [
      {
        subSubjectId: "",
        subSubjectName: "",
        startPace: 0,
        endPace: 0,
        skipPaces: [],
        notPairWith: [],
        extendToNextLevel: false,
      },
    ] as SubjectConfig[],
  })

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [studentsData, subjectsData, schoolYearsData] = await Promise.all([
          api.students.getAll(),
          api.subjects.getAll(),
          api.schoolYears.getAll(),
        ])
        setStudents(studentsData as Student[])
        setSubjects(subjectsData as Subject[])

        // Find active school year
        const schoolYears = schoolYearsData as Array<{ id: string; name: string; isActive?: boolean }>
        const active = schoolYears.find(sy => sy.isActive)
        if (active) {
          setActiveSchoolYear({ id: active.id, name: active.name })
          setFormData(prev => ({ ...prev, schoolYear: active.name }))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Error al cargar los datos. Por favor, recarga la página.")
      } finally {
        setLoading(false)
      }
    }

    if (!isLoadingUser) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser])

  // Fetch all templates (not filtered by student level)
  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await api.projectionTemplates.getAll() // Get all templates
        setTemplates(templatesData as Array<{ id: string; name: string; level: string }>)
      } catch (error) {
        console.error("Error fetching templates:", error)
        // Don't show error, just leave templates empty
        setTemplates([])
      }
    }

    if (!isLoadingUser) {
      fetchTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser])

  // Group subjects by category
  const subjectsByCategory = React.useMemo(() => {
    const grouped: Record<string, Subject[]> = {}
    subjects.forEach((subject) => {
      if (!grouped[subject.categoryName]) {
        grouped[subject.categoryName] = []
      }
      grouped[subject.categoryName].push(subject)
    })
    // Sort sub-subjects within each category by level number, then by name
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => {
        // First sort by level number if available
        if (a.levelNumber !== undefined && b.levelNumber !== undefined) {
          if (a.levelNumber !== b.levelNumber) {
            return a.levelNumber - b.levelNumber
          }
        } else if (a.levelNumber !== undefined) {
          return -1
        } else if (b.levelNumber !== undefined) {
          return 1
        }
        // Then by name
        return a.name.localeCompare(b.name)
      })
    })
    return grouped
  }, [subjects])

  // Fetch paces when a subject is selected
  const fetchPacesForSubject = React.useCallback(async (subSubjectId: string, extendToNext: boolean = false) => {
    if (!subSubjectId) return
    const cacheKey = `${subSubjectId}-${extendToNext}`
    if (paceCatalogs[cacheKey]) return

    setLoadingPaces((prev) => ({ ...prev, [subSubjectId]: true }))
    try {
      const selectedSubject = subjects.find(s => s.id === subSubjectId)
      if (!selectedSubject) return

      let allPaces: PaceCatalogItem[] = []

      // Get paces from selected subject
      const mainPaces = await api.paceCatalog.get({ subSubjectId })
      allPaces = [...(mainPaces as PaceCatalogItem[])]

      // If extending, get paces from next 2 contiguous subjects in same category
      if (extendToNext) {
        const categorySubjects = subjectsByCategory[selectedSubject.categoryName] || []
        const currentIndex = categorySubjects.findIndex(s => s.id === subSubjectId)

        // Get next 2 subjects (max 2 levels ahead)
        for (let i = 1; i <= 2 && currentIndex + i < categorySubjects.length; i++) {
          const nextSubject = categorySubjects[currentIndex + i]
          try {
            const nextPaces = await api.paceCatalog.get({ subSubjectId: nextSubject.id })
            allPaces = [...allPaces, ...(nextPaces as PaceCatalogItem[])]
          } catch (error) {
            console.error(`Error fetching lectures for ${nextSubject.name}:`, error)
          }
        }
      }

      // Sort by pace code
      allPaces.sort((a, b) => {
        const aCode = parseInt(a.code) || 0
        const bCode = parseInt(b.code) || 0
        return aCode - bCode
      })

      setPaceCatalogs((prev) => ({ ...prev, [cacheKey]: allPaces }))
    } catch (error) {
      console.error("Error fetching lectures:", error)
    } finally {
      setLoadingPaces((prev) => ({ ...prev, [subSubjectId]: false }))
    }
  }, [api, paceCatalogs, subjects, subjectsByCategory])

  const addSubject = () => {
    if (formData.subjects.length >= 6) return
    const newIndex = formData.subjects.length
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          subSubjectId: "",
          subSubjectName: "",
          startPace: 0,
          endPace: 0,
          skipPaces: [],
          notPairWith: [],
          extendToNextLevel: false,
        },
      ],
    }))
    // Expand the newly added subject and close others
    setExpandedSubjectIndex(newIndex)
  }

  const removeSubject = (index: number) => {
    setFormData((prev) => {
      const removedSubject = prev.subjects[index]
      // Remove paces for this subject
      if (removedSubject?.subSubjectId) {
        setPaceCatalogs((prev) => {
          const newPaces = { ...prev }
          delete newPaces[removedSubject.subSubjectId]
          return newPaces
        })
      }
      return {
        ...prev,
        subjects: prev.subjects.filter((_, i) => i !== index),
      }
    })
    // If the removed subject was expanded, expand the first subject or close if none
    if (expandedSubjectIndex === index) {
      setExpandedSubjectIndex(formData.subjects.length > 1 ? 0 : null)
    } else if (expandedSubjectIndex !== null && expandedSubjectIndex > index) {
      // Adjust expanded index if a subject before it was removed
      setExpandedSubjectIndex(expandedSubjectIndex - 1)
    }
  }

  const updateSubject = (index: number, updates: Partial<SubjectConfig>) => {
    setFormData((prev) => {
      const currentSubject = prev.subjects[index]
      const updatedSubjects = prev.subjects.map((subject, i) =>
        i === index ? { ...subject, ...updates } : subject
      )

      // If subSubjectId changed, fetch paces (default to not extending)
      if (updates.subSubjectId && updates.subSubjectId !== currentSubject?.subSubjectId) {
        fetchPacesForSubject(updates.subSubjectId, false)
        // Reset pace values when subject changes
        return {
          ...prev,
          subjects: updatedSubjects.map((s, i) =>
            i === index ? { ...s, startPace: 0, endPace: 0, extendToNextLevel: false } : s
          ),
        }
      }

      // If extendToNextLevel changed, refetch paces
      if (updates.extendToNextLevel !== undefined && updates.extendToNextLevel !== currentSubject?.extendToNextLevel) {
        if (currentSubject?.subSubjectId) {
          fetchPacesForSubject(currentSubject.subSubjectId, updates.extendToNextLevel)
        }
      }

      return {
        ...prev,
        subjects: updatedSubjects,
      }
    })
  }


  const handleNotPairWithChange = (index: number, subjectId: string, checked: boolean) => {
    setFormData((prev) => {
      const currentSubjectId = prev.subjects[index].subSubjectId
      return {
        ...prev,
        subjects: prev.subjects.map((subject, i) => {
          if (i === index) {
            // Update this subject's notPairWith list
            if (checked) {
              return {
                ...subject,
                notPairWith: [...subject.notPairWith, subjectId],
              }
            } else {
              return {
                ...subject,
                notPairWith: subject.notPairWith.filter((id) => id !== subjectId),
              }
            }
          } else if (subject.subSubjectId === subjectId) {
            // Also update the other subject's notPairWith list (bidirectional)
            if (checked) {
              return {
                ...subject,
                notPairWith: [...subject.notPairWith, currentSubjectId],
              }
            } else {
              return {
                ...subject,
                notPairWith: subject.notPairWith.filter((id) => id !== currentSubjectId),
              }
            }
          }
          return subject
        }),
      }
    })
  }

  const validateStep = (step: WizardStep): boolean => {
    setError(null)

    switch (step) {
      case 1:
        if (!formData.studentId) {
          const errorMsg = "Por favor selecciona un estudiante"
          setError(errorMsg)
          toast.error(errorMsg)
          return false
        }
        if (!formData.schoolYear || !activeSchoolYear) {
          const errorMsg = "No hay un año escolar activo"
          setError(errorMsg)
          toast.error(errorMsg)
          return false
        }
        return true
      case 2: {
        if (formData.subjects.length === 0) {
          const errorMsg = "Debes agregar al menos una materia"
          setError(errorMsg)
          toast.error(errorMsg)
          return false
        }
        const invalidSubjects = formData.subjects.some(
          (s) => !s.subSubjectId || !s.startPace || !s.endPace || s.startPace > s.endPace || s.startPace === 0 || s.endPace === 0
        )
        if (invalidSubjects) {
          const errorMsg = "Por favor completa todos los campos requeridos para cada materia (materia, inicial y final)"
          setError(errorMsg)
          toast.error(errorMsg)
          return false
        }
        return true
      }
      case 3:
        return true // Preview step, always valid
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as WizardStep)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      setError(null)
    }
  }

  const handleGenerate = async () => {
    setError(null)

    if (!validateStep(2)) {
      setCurrentStep(2)
      return
    }

    setIsGenerating(true)
    try {
      // Include difficulty for each subject
      const subjectsWithDifficulty = formData.subjects.map(subject => {
        const subjectData = subjects.find(s => s.id === subject.subSubjectId)
        return {
          ...subject,
          difficulty: subjectData?.difficulty || 3, // Default to 3 if not found
        }
      })

      await api.projections.generate({
        studentId: formData.studentId,
        schoolYear: formData.schoolYear,
        subjects: subjectsWithDifficulty,
      })
      navigate("/projections")
    } catch (error) {
      console.error("Error generating projection:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al generar la proyección. Por favor, inténtalo de nuevo."
      setError(errorMessage)
      setCurrentStep(2) // Go back to subjects step on error
    } finally {
      setIsGenerating(false)
    }
  }

  // Get selected subjects for a specific category and index
  const getSelectedSubjectsInCategory = React.useCallback((categoryName: string, excludeIndex: number) => {
    return formData.subjects
      .map((fs, i) => {
        if (i === excludeIndex) return null
        const subject = subjects.find((s) => s.id === fs.subSubjectId)
        return subject?.categoryName === categoryName ? subject : null
      })
      .filter((s): s is Subject => s !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [formData.subjects, subjects])

  // Check if a subject can be selected (must be contiguous with other selected subjects in same category)
  const canSelectSubject = React.useCallback((subject: Subject, index: number) => {
    const selectedInCategory = getSelectedSubjectsInCategory(subject.categoryName, index)

    // If no other subjects selected in this category, allow selection
    if (selectedInCategory.length === 0) {
      return true
    }

    // Get all subjects in this category sorted by name
    const allInCategory = subjectsByCategory[subject.categoryName] || []

    // Find the position of the subject to select
    const subjectIndex = allInCategory.findIndex((s) => s.id === subject.id)
    if (subjectIndex === -1) return false

    // Get indices of selected subjects
    const selectedIndices = selectedInCategory
      .map((s) => allInCategory.findIndex((sub) => sub.id === s.id))
      .filter((idx) => idx !== -1)
      .sort((a, b) => a - b)

    // Check if the new subject would be contiguous
    // It should be either:
    // 1. Right before the first selected (subjectIndex === selectedIndices[0] - 1)
    // 2. Right after the last selected (subjectIndex === selectedIndices[selectedIndices.length - 1] + 1)
    // 3. Between two selected subjects (already contiguous)
    const minSelected = Math.min(...selectedIndices)
    const maxSelected = Math.max(...selectedIndices)

    return subjectIndex === minSelected - 1 || subjectIndex === maxSelected + 1
  }, [getSelectedSubjectsInCategory, subjectsByCategory])

  const getFilteredSubjectsForIndex = React.useCallback((index: number) => {
    const searchTerm = subjectSearchTerms[index] || ""
    const filtered: Record<string, Subject[]> = {}

    Object.keys(subjectsByCategory).forEach((categoryName) => {
      const categorySubjects = subjectsByCategory[categoryName].filter((s) => {
        // Exclude already selected subjects (except current index)
        const isAvailable = !formData.subjects.some((fs, i) => i !== index && fs.subSubjectId === s.id)
        if (!isAvailable) return false

        // Filter by search term if provided
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const matchesName = s.name.toLowerCase().includes(searchLower)
          const matchesCategory = categoryName.toLowerCase().includes(searchLower)
          const matchesCode = s.code?.toLowerCase().includes(searchLower)
          return matchesName || matchesCategory || matchesCode
        }
        return true
      })

      if (categorySubjects.length > 0) {
        filtered[categoryName] = categorySubjects
      }
    })

    return filtered
  }, [subjectsByCategory, subjectSearchTerms, formData.subjects])

  // Preview data
  const selectedStudent = students.find((s) => s.id === formData.studentId)
  const totalPaces = formData.subjects.reduce((sum, s) => {
    const paces = s.endPace - s.startPace + 1 - s.skipPaces.length
    return sum + Math.max(0, paces)
  }, 0)

  if (isLoadingUser || loading) {
    return <Loading />
  }

  const steps = [
    { number: 1, title: "Estudiante", description: "Selecciona el estudiante" },
    { number: 2, title: "Materias", description: "Configura las materias" },
    { number: 3, title: "Vista Previa", description: "Revisa la configuración" },
    { number: 4, title: "Confirmar", description: "Genera la proyección" },
  ]

  return (
    <div className="min-h-screen">
      <div className="w-full p-3 space-y-6">
        <BackButton to="/projections">Volver a Proyecciones</BackButton>

        <PageHeader
          title="Generar Proyección"
          description="Crea una proyección académica automática paso a paso"
        />

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep > step.number
                      ? "bg-green-500 text-white"
                      : currentStep === step.number
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                      }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="mb-6 bg-white rounded-lg shadow-sm">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Información del Estudiante</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student">Estudiante *</Label>
                      <Popover open={openStudentPopover} onOpenChange={setOpenStudentPopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !formData.studentId && "text-muted-foreground"
                            )}
                          >
                            {formData.studentId
                              ? students.find((s) => s.id === formData.studentId)?.name
                              : "Selecciona un estudiante..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar estudiante..."
                              value={studentSearchTerm}
                              onValueChange={(value) => {
                                setStudentSearchTerm(value)
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontraron estudiantes.</CommandEmpty>
                              <CommandGroup>
                                {students
                                  .filter((s) => {
                                    if (!studentSearchTerm) return true
                                    const searchLower = studentSearchTerm.toLowerCase()
                                    return (
                                      s.name.toLowerCase().includes(searchLower) ||
                                      s.firstName.toLowerCase().includes(searchLower) ||
                                      s.lastName.toLowerCase().includes(searchLower)
                                    )
                                  })
                                  .map((s) => (
                                    <CommandItem
                                      key={s.id}
                                      value={s.id}
                                      onSelect={() => {
                                        setFormData((prev) => ({ ...prev, studentId: s.id }))
                                        setOpenStudentPopover(false)
                                        setStudentSearchTerm("")
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.studentId === s.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {s.name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Configuración de Materias</h3>

                  {/* Template Selector */}
                  {templates.length > 0 && (
                    <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                      <Label className="text-sm font-medium mb-2 block">Usar Plantilla para Prellenar (Opcional)</Label>
                      <div className="space-y-3">
                        <Select
                          value={selectedTemplateId}
                          onValueChange={async (value) => {
                            setSelectedTemplateId(value)
                            if (value) {
                              try {
                                const template = await api.projectionTemplates.getById(value)
                                if (template && template.subjects) {
                                  // Check for level mismatch
                                  const selectedStudent = students.find(s => s.id === formData.studentId)
                                  const studentLevel = selectedStudent?.expectedLevel || selectedStudent?.currentLevel
                                  if (studentLevel && template.level !== studentLevel) {
                                    toast.warning(`⚠️ Advertencia: La plantilla seleccionada (${template.level}) no corresponde al nivel del estudiante (${studentLevel}). Puedes continuar y personalizar.`)
                                  }

                                  // Load template subjects into form
                                  const templateSubjects = template.subjects.map((s: { subSubjectId: string; subSubjectName: string; startPace: number; endPace: number; skipPaces?: number[]; notPairWith?: string[]; extendToNext?: boolean }) => ({
                                    subSubjectId: s.subSubjectId,
                                    subSubjectName: s.subSubjectName,
                                    startPace: s.startPace,
                                    endPace: s.endPace,
                                    skipPaces: s.skipPaces || [],
                                    notPairWith: s.notPairWith || [],
                                    extendToNextLevel: s.extendToNext || false,
                                  }))

                                  // Fetch paces for each subject
                                  for (const subject of templateSubjects) {
                                    if (subject.subSubjectId) {
                                      await fetchPacesForSubject(subject.subSubjectId, subject.extendToNextLevel)
                                    }
                                  }

                                  setFormData(prev => ({
                                    ...prev,
                                    subjects: templateSubjects,
                                  }))
                                  // Expand first subject
                                  setExpandedSubjectIndex(0)
                                }
                              } catch (error) {
                                console.error("Error loading template:", error)
                                toast.error("Error al cargar la plantilla")
                              }
                            } else {
                              // Reset to default empty subject
                              setFormData(prev => ({
                                ...prev,
                                subjects: [{
                                  subSubjectId: "",
                                  subSubjectName: "",
                                  startPace: 0,
                                  endPace: 0,
                                  skipPaces: [],
                                  notPairWith: [],
                                  extendToNextLevel: false,
                                }],
                              }))
                              setExpandedSubjectIndex(0)
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona una plantilla para prellenar materias..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin plantilla (configuración manual)</SelectItem>
                            {Object.entries(
                              templates.reduce((acc, template) => {
                                if (!acc[template.level]) acc[template.level] = []
                                acc[template.level].push(template)
                                return acc
                              }, {} as Record<string, typeof templates>)
                            )
                              .sort(([levelA], [levelB]) => levelA.localeCompare(levelB))
                              .map(([level, levelTemplates]) => (
                                <React.Fragment key={level}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Nivel {level}
                                  </div>
                                  {levelTemplates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                      {template.name}
                                    </SelectItem>
                                  ))}
                                </React.Fragment>
                              ))}
                          </SelectContent>
                        </Select>
                        {selectedStudent && (() => {
                          const studentLevel = selectedStudent.expectedLevel || selectedStudent.currentLevel
                          const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
                          const levelMismatch = selectedTemplate && studentLevel && selectedTemplate.level !== studentLevel
                          return levelMismatch ? (
                            <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-yellow-800 text-xs">
                                ⚠️ La plantilla seleccionada ({selectedTemplate?.level}) no corresponde al nivel del estudiante ({studentLevel}). Puedes continuar y personalizar.
                              </AlertDescription>
                            </Alert>
                          ) : null
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Selecciona una plantilla para prellenar automáticamente las materias y paces. Puedes modificar todo después.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <Label>Materias (máximo 6)</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addSubject}
                      disabled={formData.subjects.length >= 6}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Materia
                    </Button>
                  </div>

                  {formData.subjects.map((subject, index) => {
                    const isExpanded = expandedSubjectIndex === index
                    return (
                      <Card key={index} className="mb-4">
                        <CardHeader
                          className="pb-2 pt-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedSubjectIndex(isExpanded ? null : index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                              <CardTitle className="text-base">
                                {subject.subSubjectName || `Materia ${index + 1}`}
                              </CardTitle>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeSubject(index)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Materia *</Label>
                              <Popover
                                open={openSubjectPopovers[index] || false}
                                onOpenChange={(open) => {
                                  setOpenSubjectPopovers((prev) => ({ ...prev, [index]: open }))
                                  if (open) {
                                    // When opening, pre-fill search with category name if subject is selected
                                    if (subject.subSubjectId) {
                                      const selectedSubject = subjects.find((s) => s.id === subject.subSubjectId)
                                      if (selectedSubject) {
                                        setSubjectSearchTerms((prev) => ({ ...prev, [index]: selectedSubject.categoryName }))
                                      }
                                    }
                                  } else {
                                    // Only clear search when closing if no subject is selected
                                    if (!subject.subSubjectId) {
                                      setSubjectSearchTerms((prev) => ({ ...prev, [index]: "" }))
                                    }
                                  }
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !subject.subSubjectId && "text-muted-foreground"
                                    )}
                                  >
                                    {subject.subSubjectId
                                      ? subjects.find((s) => s.id === subject.subSubjectId)?.name
                                      : "Selecciona una materia..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Buscar materia..."
                                      value={subjectSearchTerms[index] || ""}
                                      onValueChange={(value) => {
                                        setSubjectSearchTerms((prev) => ({ ...prev, [index]: value }))
                                      }}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No se encontraron materias.</CommandEmpty>
                                      {Object.entries(getFilteredSubjectsForIndex(index)).map(([categoryName, categorySubjects]) => (
                                        <CommandGroup key={categoryName} heading={categoryName}>
                                          {categorySubjects.map((s) => {
                                            const isSelected = subject.subSubjectId === s.id
                                            const canSelect = canSelectSubject(s, index)
                                            const selectedInCategory = getSelectedSubjectsInCategory(categoryName, index)

                                            return (
                                              <CommandItem
                                                key={s.id}
                                                value={`${categoryName}-${s.id}`}
                                                onSelect={() => {
                                                  if (!canSelect) {
                                                    setError(`Solo puedes seleccionar materias contiguas. Ya tienes seleccionadas: ${selectedInCategory.map(sub => sub.name).join(", ")}`)
                                                    return
                                                  }
                                                  updateSubject(index, {
                                                    subSubjectId: s.id,
                                                    subSubjectName: s.name,
                                                  })
                                                  setOpenSubjectPopovers((prev) => ({ ...prev, [index]: false }))
                                                  // Keep the search term so user can easily change selection
                                                  setError(null)
                                                }}
                                                disabled={!canSelect}
                                                className={cn(
                                                  !canSelect ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                                )}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                <span className={cn(isSelected && "font-medium")}>
                                                  {s.name}
                                                </span>
                                                {selectedInCategory.length > 0 && !isSelected && (
                                                  <span className="ml-auto text-xs text-muted-foreground">
                                                    {selectedInCategory.map(sub => sub.name).join(", ")}
                                                  </span>
                                                )}
                                              </CommandItem>
                                            )
                                          })}
                                        </CommandGroup>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>

                            {subject.subSubjectId && (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`extend-${index}`}
                                      checked={subject.extendToNextLevel || false}
                                      onChange={(e) => {
                                        updateSubject(index, { extendToNextLevel: e.target.checked })
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <Label htmlFor={`extend-${index}`} className="text-sm font-normal cursor-pointer">
                                      Extender a niveles siguientes (máx. 2 niveles)
                                    </Label>
                                  </div>
                                  {subject.extendToNextLevel && (
                                    <p className="text-xs text-muted-foreground">
                                      Permite seleccionar paces de los siguientes 2 niveles contiguos en la misma categoría
                                    </p>
                                  )}
                                </div>
                                {loadingPaces[subject.subSubjectId] ? (
                                  <div className="text-sm text-muted-foreground">Cargando paces...</div>
                                ) : (() => {
                                  const cacheKey = `${subject.subSubjectId}-${subject.extendToNextLevel || false}`
                                  const availablePaces = paceCatalogs[cacheKey] || []
                                  const paceOptions = availablePaces.map((p) => parseInt(p.code)).filter((n) => !isNaN(n)).sort((a, b) => a - b)

                                  return paceOptions.length > 0 ? (
                                    <div className="space-y-4">
                                      {!subject.extendToNextLevel && (
                                        <div className="flex justify-end">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const firstPace = paceOptions[0]
                                              const lastPace = paceOptions[paceOptions.length - 1]
                                              updateSubject(index, {
                                                startPace: firstPace,
                                                endPace: lastPace,
                                              })
                                            }}
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 font-medium"
                                          >
                                            Llenar nivel completo
                                          </Button>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Inicio *</Label>
                                          <Select
                                            value={subject.startPace ? String(subject.startPace) : ""}
                                            onValueChange={(value) => {
                                              const paceNum = parseInt(value)
                                              updateSubject(index, {
                                                startPace: paceNum,
                                                endPace: subject.endPace < paceNum ? paceNum : subject.endPace,
                                              })
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecciona inicio" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {paceOptions.map((paceNum) => (
                                                <SelectItem key={paceNum} value={String(paceNum)}>
                                                  {paceNum}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Fin *</Label>
                                          <Select
                                            value={subject.endPace ? String(subject.endPace) : ""}
                                            onValueChange={(value) => {
                                              updateSubject(index, {
                                                endPace: parseInt(value),
                                              })
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecciona fin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {paceOptions
                                                .filter((paceNum) => paceNum >= subject.startPace)
                                                .map((paceNum) => (
                                                  <SelectItem key={paceNum} value={String(paceNum)}>
                                                    {paceNum}
                                                  </SelectItem>
                                                ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-yellow-600">No se encontraron paces para esta materia</div>
                                  )
                                })()}
                              </>
                            )}

                            {subject.startPace > 0 && subject.endPace > 0 && (() => {
                              const cacheKey = `${subject.subSubjectId}-${subject.extendToNextLevel || false}`
                              const availablePaces = paceCatalogs[cacheKey] || []
                              const paceOptions = availablePaces.map((p) => parseInt(p.code)).filter((n) => !isNaN(n)).sort((a, b) => a - b)
                              const selectedPaceRange = Array.from(
                                { length: subject.endPace - subject.startPace + 1 },
                                (_, i) => subject.startPace + i
                              ).filter(p => paceOptions.includes(p))

                              return selectedPaceRange.length > 0 ? (
                                <div className="space-y-2">
                                  <Label>Seleccionar Lecciones a omitir:</Label>
                                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                                    <div className="grid grid-cols-4 gap-2">
                                      {selectedPaceRange.map((paceNum) => {
                                        const isSkipped = subject.skipPaces.includes(paceNum)
                                        return (
                                          <div key={paceNum} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`skip-${index}-${paceNum}`}
                                              checked={isSkipped}
                                              onCheckedChange={(checked) => {
                                                const newSkipPaces = checked
                                                  ? [...subject.skipPaces, paceNum]
                                                  : subject.skipPaces.filter(p => p !== paceNum)
                                                updateSubject(index, { skipPaces: newSkipPaces })
                                              }}
                                            />
                                            <Label
                                              htmlFor={`skip-${index}-${paceNum}`}
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              {paceNum}
                                            </Label>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            })()}

                            {formData.subjects.length > 1 && (
                              <div className="space-y-2">
                                <Label>No Emparejar Con</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {formData.subjects.map((otherSubject, otherIndex) => {
                                    if (otherIndex === index || !otherSubject.subSubjectId) return null
                                    const isChecked = subject.notPairWith.includes(
                                      otherSubject.subSubjectId
                                    )
                                    return (
                                      <Button
                                        key={otherIndex}
                                        type="button"
                                        variant={isChecked ? "default" : "outline"}
                                        size="sm"
                                        onClick={() =>
                                          handleNotPairWithChange(
                                            index,
                                            otherSubject.subSubjectId,
                                            !isChecked
                                          )
                                        }
                                        className={isChecked
                                          ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-900 border-yellow-400"
                                          : "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-400"
                                        }
                                      >
                                        {otherSubject.subSubjectName || `Materia ${otherIndex + 1}`}
                                        {isChecked && <X className="h-3 w-3 ml-1" />}
                                      </Button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}

                  {formData.subjects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Haz clic en "Agregar Materia" para comenzar
                    </div>
                  )}

                  {formData.subjects.length > 0 && formData.subjects.length < 6 && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        size="sm"
                        onClick={addSubject}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Materia
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa de la Proyección
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="text-muted-foreground">Estudiante</Label>
                    <p className="font-medium">{selectedStudent?.name || "No seleccionado"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Año Escolar</Label>
                    <p className="font-medium">{formData.schoolYear || "No seleccionado"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Materias Configuradas</Label>
                  <div className="space-y-2">
                    {formData.subjects.map((subject, index) => {
                      const paces = subject.endPace - subject.startPace + 1 - subject.skipPaces.length

                      // Determine which subjects this pace range spans
                      const cacheKey = `${subject.subSubjectId}-${subject.extendToNextLevel || false}`
                      const availablePaces = paceCatalogs[cacheKey] || []

                      // Get all pace codes in the selected range (excluding skipped)
                      const selectedPaceCodes = Array.from(
                        { length: subject.endPace - subject.startPace + 1 },
                        (_, i) => subject.startPace + i
                      ).filter(p => !subject.skipPaces.includes(p))

                      // Find which sub-subjects these paces belong to by looking up each pace
                      const subjectIds = new Set<string>()
                      selectedPaceCodes.forEach(paceCode => {
                        const pace = availablePaces.find(p => {
                          const paceCodeNum = parseInt(p.code)
                          return !isNaN(paceCodeNum) && paceCodeNum === paceCode
                        })
                        if (pace && pace.subSubjectId) {
                          subjectIds.add(pace.subSubjectId)
                        }
                      })

                      // Always include the main subject to ensure it shows up
                      if (subject.subSubjectId) {
                        subjectIds.add(subject.subSubjectId)
                      }

                      // Get subject names
                      const subjectNames = Array.from(subjectIds)
                        .map(id => {
                          const subj = subjects.find(s => s.id === id)
                          return subj?.name
                        })
                        .filter(Boolean)
                        .sort()

                      const displayName = subjectNames.length > 1
                        ? `${subjectNames.join(" - ")}`
                        : (subjectNames[0] || subject.subSubjectName || `Materia ${index + 1}`)

                      return (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="font-medium">{displayName}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Paces: {subject.startPace} - {subject.endPace}
                            {subject.skipPaces.length > 0 && (
                              <span className="ml-2">(Omitir: {subject.skipPaces.join(", ")})</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total de paces: {Math.max(0, paces)}
                          </div>
                          {subject.notPairWith.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-1">
                              No emparejar con: {subject.notPairWith.map(id => {
                                const other = formData.subjects.find(s => s.subSubjectId === id)
                                return other?.subSubjectName || id
                              }).join(", ")}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-muted-foreground">Total de Materias</Label>
                    <p className="font-semibold">{formData.subjects.length}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Total de Paces Estimados</Label>
                    <p className="font-semibold">{totalPaces}</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">¿Estás listo para generar la proyección?</h3>
                <p className="text-muted-foreground">
                  Se creará una proyección para <strong>{selectedStudent?.name}</strong> con {formData.subjects.length} materia(s) y aproximadamente {totalPaces} paces.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => navigate("/projections") : handleBack}
            disabled={isGenerating}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Cancelar" : "Atrás"}
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={isGenerating}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.studentId || formData.subjects.length === 0 || !activeSchoolYear}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isGenerating ? "Generando..." : "Generar Proyección"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

