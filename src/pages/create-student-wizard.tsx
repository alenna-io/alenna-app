import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import countryStatesData from "@/data/country-states.json"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type WizardStep = 1 | 2 | 3 | 4

interface CertificationType {
  id: string
  name: string
  description?: string
  isActive?: boolean
}

interface SingleDatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  hasError?: boolean
}

function SingleDatePicker({ value, onChange, placeholder, min, max, hasError }: SingleDatePickerProps) {
  const { i18n } = useTranslation()
  const parsedDate = value ? new Date(`${value}T00:00:00`) : undefined
  const locale = i18n.language === 'es' ? es : enUS

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            hasError && "border-destructive"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(new Date(`${value}T00:00:00`), "dd/MM/yyyy", { locale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <ShadcnCalendar
          mode="single"
          captionLayout="dropdown"
          selected={parsedDate}
          locale={locale}
          onSelect={(date) => {
            if (date && onChange) {
              onChange(format(date, "yyyy-MM-dd"))
            }
          }}
          disabled={(date) => {
            if (!min && !max) return false
            const minDate = min ? new Date(`${min}T00:00:00`) : null
            const maxDate = max ? new Date(`${max}T00:00:00`) : null
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          fromYear={1900}
          toYear={2100}
        />
      </PopoverContent>
    </Popover>
  )
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function CreateStudentWizardPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [certificationTypes, setCertificationTypes] = React.useState<CertificationType[]>([])
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isCreatingCertification, setIsCreatingCertification] = React.useState(false)
  const [newCertificationName, setNewCertificationName] = React.useState("")
  const [newCertificationDescription, setNewCertificationDescription] = React.useState("")
  const [isSavingCertification, setIsSavingCertification] = React.useState(false)
  const [certificationSearch, setCertificationSearch] = React.useState("")
  const [isSelectOpen, setIsSelectOpen] = React.useState(false)
  const [creatingCertificationName, setCreatingCertificationName] = React.useState<string | null>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const [limitWarningDialog, setLimitWarningDialog] = React.useState<{ open: boolean; title: string; message: string } | null>(null)
  const [countryOpen, setCountryOpen] = React.useState(false)
  const [stateOpen, setStateOpen] = React.useState(false)
  const [stateSearchTerm, setStateSearchTerm] = React.useState("")
  const [countrySearchTerm, setCountrySearchTerm] = React.useState("")
  const [parents, setParents] = React.useState<Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    fullName: string
  }>>([])
  const [parent1UseDropdown, setParent1UseDropdown] = React.useState(false)
  const [parent2UseDropdown, setParent2UseDropdown] = React.useState(false)
  const [parent1DropdownOpen, setParent1DropdownOpen] = React.useState(false)
  const [parent2DropdownOpen, setParent2DropdownOpen] = React.useState(false)
  const [parent1SearchTerm, setParent1SearchTerm] = React.useState("")
  const [parent2SearchTerm, setParent2SearchTerm] = React.useState("")

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "Mexico",
    zipCode: "",
    certificationTypeId: "",
    graduationDate: "",
    isLeveled: false,
    expectedLevel: "",
    currentLevel: "",
    parent1FirstName: "",
    parent1LastName: "",
    parent1Email: "",
    parent1Phone: "",
    parent1Relationship: "",
    hasSecondParent: false,
    parent2FirstName: "",
    parent2LastName: "",
    parent2Email: "",
    parent2Phone: "",
    parent2Relationship: "",
    billingBaseAmount: "",
  })

  React.useEffect(() => {
    const fetchData = async () => {
      if (!userInfo?.schoolId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Check student limit before allowing creation
        const schoolData = await api.schools.getMy()
        if (schoolData?.userLimit) {
          const countData = await api.schools.getStudentsCount(userInfo.schoolId)
          if (countData.count >= schoolData.userLimit) {
            setLimitWarningDialog({
              open: true,
              title: t("students.limitReached"),
              message: t("students.limitReachedMessage", { limit: schoolData.userLimit })
            })
            setIsLoading(false)
            return
          }
        }

        const types = await api.schools.getCertificationTypes(userInfo.schoolId)
        setCertificationTypes(types as CertificationType[])

        // Fetch parents from school
        try {
          const parentsData = await api.schools.getParents(userInfo.schoolId)
          const parentsArray = parentsData as Array<{
            id: string
            email: string
            firstName: string
            lastName: string
            phone?: string
            fullName: string
          }>
          setParents(parentsArray)
        } catch (error) {
          console.error('Error fetching parents:', error)
          // Continue without parents - user can still manually enter
        }
      } catch (error) {
        console.error('Error fetching wizard data:', error)
        toast.error(t("students.createError") || "Error loading data")
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser && userInfo) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, isLoadingUser])

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = t("students.validation.firstNameRequired")
      if (!formData.lastName.trim()) newErrors.lastName = t("students.validation.lastNameRequired")
      if (!formData.email.trim()) {
        newErrors.email = t("students.validation.studentEmailRequired") || "El correo del estudiante es requerido"
      } else if (!validateEmail(formData.email)) {
        newErrors.email = t("students.validation.emailInvalid") || "Email inválido"
      }
      if (!formData.birthDate) {
        newErrors.birthDate = t("students.validation.birthDateRequired")
      } else {
        const birthDate = new Date(formData.birthDate)
        const today = new Date()
        if (birthDate >= today) {
          newErrors.birthDate = t("students.validation.birthDateFuture")
        } else {
          // Calculate age
          const age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          const dayDiff = today.getDate() - birthDate.getDate()

          // Adjust age if birthday hasn't occurred this year yet
          const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age

          if (actualAge < 3) {
            newErrors.birthDate = t("students.validation.birthDateMinimumAge")
          }
        }
      }
      if (!formData.streetAddress.trim()) newErrors.streetAddress = t("students.validation.streetAddressRequired") || "Street address is required"
      if (!formData.city.trim()) newErrors.city = t("students.validation.cityRequired") || "City is required"
      if (!formData.state.trim()) newErrors.state = t("students.validation.stateRequired") || "State is required"
      if (!formData.country.trim()) newErrors.country = t("students.validation.countryRequired") || "Country is required"
      if (!formData.zipCode.trim()) newErrors.zipCode = t("students.validation.zipCodeRequired") || "Zip code is required"
      if (!formData.phone.trim()) newErrors.phone = t("students.validation.phoneRequired") || "Phone is required"
    } else if (step === 2) {
      if (!formData.certificationTypeId) newErrors.certificationTypeId = t("students.validation.certificationTypeRequired")
      if (!formData.graduationDate) {
        newErrors.graduationDate = t("students.validation.graduationDateRequired")
      } else {
        const grad = new Date(formData.graduationDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        // Graduation date must always be in the future
        if (grad <= today) {
          newErrors.graduationDate = t("students.validation.graduationDateFuture") || "Graduation date must be in the future"
        } else if (formData.birthDate) {
          const birth = new Date(formData.birthDate)
          if (grad <= birth) {
            newErrors.graduationDate = t("students.validation.graduationDateBeforeBirth")
          }
        }
      }
      // Current level is always required
      if (!formData.currentLevel.trim()) {
        newErrors.currentLevel = t("students.validation.currentLevelRequired") || "Current level is required"
      }
      // Expected level is only required if student is not leveled (isLeveled = true)
      if (formData.isLeveled) {
        if (!formData.expectedLevel.trim()) {
          newErrors.expectedLevel = t("students.validation.expectedLevelRequired") || "Expected level is required for not leveled students"
        } else if (formData.currentLevel.trim()) {
          // Current level must be smaller than expected level
          const currentLevelNum = parseInt(formData.currentLevel.replace('L', ''))
          const expectedLevelNum = parseInt(formData.expectedLevel.replace('L', ''))
          if (currentLevelNum >= expectedLevelNum) {
            newErrors.currentLevel = t("students.validation.currentLevelSmallerThanExpected") || "Current level must be smaller than expected level"
            newErrors.expectedLevel = t("students.validation.expectedLevelGreaterThanCurrent") || "Expected level must be greater than current level"
          }
        }
      }
    } else if (step === 3) {
      // Parent 1
      if (parent1UseDropdown) {
        // Using dropdown - validate that a parent was selected (email is required)
        if (!formData.parent1Email.trim()) {
          newErrors.parent1Email = t("students.validation.parentEmailRequired") || "Please select a parent"
        } else if (!validateEmail(formData.parent1Email)) {
          newErrors.parent1Email = t("students.validation.emailInvalid")
        }
        // Phone should come from the selected parent - if missing, it means the parent doesn't have one in DB
        // Backend requires phone, so we need to validate it exists
        if (!formData.parent1Phone || !formData.parent1Phone.trim()) {
          newErrors.parent1Email = t("students.validation.parentPhoneMissing") || "Selected parent does not have a phone number. Please use manual input to add one."
        }
        // Relationship is still required even when using dropdown
        if (!formData.parent1Relationship) {
          newErrors.parent1Relationship = t("students.validation.relationshipRequired")
        }
      } else {
        // Manual input - validate all fields
        if (!formData.parent1FirstName.trim()) newErrors.parent1FirstName = t("students.validation.parentNameRequired")
        if (!formData.parent1LastName.trim()) newErrors.parent1LastName = t("students.validation.parentLastNameRequired")
        if (!formData.parent1Email.trim()) {
          newErrors.parent1Email = t("students.validation.parentEmailRequired")
        } else if (!validateEmail(formData.parent1Email)) {
          newErrors.parent1Email = t("students.validation.emailInvalid")
        }
        if (!formData.parent1Phone.trim()) {
          newErrors.parent1Phone = t("students.validation.parentPhoneRequired") || "Parent phone number is required"
        }
        if (!formData.parent1Relationship) newErrors.parent1Relationship = t("students.validation.relationshipRequired")
      }

      // Parent 2
      if (formData.hasSecondParent) {
        if (parent2UseDropdown) {
          // Using dropdown - validate that a parent was selected (email is required)
          if (!formData.parent2Email.trim()) {
            newErrors.parent2Email = t("students.validation.parentEmailRequired") || "Please select a parent"
          } else if (!validateEmail(formData.parent2Email)) {
            newErrors.parent2Email = t("students.validation.emailInvalid")
          }
          // Phone should come from the selected parent - if missing, it means the parent doesn't have one in DB
          // Backend requires phone, so we need to validate it exists
          if (!formData.parent2Phone || !formData.parent2Phone.trim()) {
            newErrors.parent2Email = t("students.validation.parentPhoneMissing") || "Selected parent does not have a phone number. Please use manual input to add one."
          }
          // Relationship is still required even when using dropdown
          if (!formData.parent2Relationship) {
            newErrors.parent2Relationship = t("students.validation.relationshipRequired")
          }
        } else {
          // Manual input - validate all fields
          if (!formData.parent2FirstName.trim()) newErrors.parent2FirstName = t("students.validation.parentNameRequired")
          if (!formData.parent2LastName.trim()) newErrors.parent2LastName = t("students.validation.parentLastNameRequired")
          if (!formData.parent2Email.trim()) {
            newErrors.parent2Email = t("students.validation.parentEmailRequired")
          } else if (!validateEmail(formData.parent2Email)) {
            newErrors.parent2Email = t("students.validation.emailInvalid")
          }
          if (!formData.parent2Phone.trim()) {
            newErrors.parent2Phone = t("students.validation.parentPhoneRequired") || "Parent phone number is required"
          }
          if (!formData.parent2Relationship) newErrors.parent2Relationship = t("students.validation.relationshipRequired")
        }

        // Validate that parent emails are different (regardless of input method)
        if (formData.parent1Email === formData.parent2Email && formData.parent1Email) {
          newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Helper function to validate email format (no accented characters allowed)
  const validateEmail = (email: string): boolean => {
    // Only allow ASCII characters: letters, numbers, dots, underscores, hyphens, plus signs
    // No accented characters like ñ, á, é, í, ó, ú, etc.
    return /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  }

  // Validate email on blur
  const handleEmailBlur = (field: 'email' | 'parent1Email' | 'parent2Email', value: string) => {
    const newErrors = { ...errors }

    if (!value.trim()) {
      if (field === 'email') {
        newErrors.email = t("students.validation.studentEmailRequired")
      } else {
        newErrors[field] = t("students.validation.parentEmailRequired")
      }
    } else if (!validateEmail(value)) {
      newErrors[field] = t("students.validation.emailInvalid")
    } else {
      // Clear error if email is valid
      delete newErrors[field]

      // Also check if parent emails are different
      if (field === 'parent1Email' && formData.hasSecondParent && formData.parent2Email === value) {
        newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
      } else if (field === 'parent2Email' && formData.parent1Email === value) {
        newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
      } else if (field === 'parent2Email' && formData.parent1Email !== value) {
        // Clear the error if emails are now different
        delete newErrors.parent2Email
      }
    }

    setErrors(newErrors)
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Try to get all users and check if email exists
      // This is a workaround since there's no dedicated check-email endpoint
      const users = await api.getUsers()
      if (Array.isArray(users)) {
        return users.some((user: { email?: string }) => user.email?.toLowerCase() === email.toLowerCase())
      }
      return false
    } catch (error) {
      // If we can't check, assume it doesn't exist to allow proceeding
      // The actual validation will happen on submit
      console.error('Error checking email:', error)
      return false
    }
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    // Check email existence before proceeding
    if (currentStep === 1 && formData.email.trim()) {
      const emailExists = await checkEmailExists(formData.email)
      if (emailExists) {
        toast.error(t("students.validation.emailAlreadyExists") || "This email is already registered. Please use a different email.")
        setErrors({ ...errors, email: t("students.validation.emailAlreadyExists") || "This email is already registered" })
        return
      }
    }

    if (currentStep === 3) {
      // Check parent emails
      if (formData.parent1Email.trim()) {
        const parent1Exists = await checkEmailExists(formData.parent1Email)
        if (parent1Exists) {
          toast.error(t("students.validation.emailAlreadyExists") || "Parent 1 email is already registered. Please use a different email.")
          setErrors({ ...errors, parent1Email: t("students.validation.emailAlreadyExists") || "This email is already registered" })
          return
        }
      }

      if (formData.hasSecondParent && formData.parent2Email.trim()) {
        const parent2Exists = await checkEmailExists(formData.parent2Email)
        if (parent2Exists) {
          toast.error(t("students.validation.emailAlreadyExists") || "Parent 2 email is already registered. Please use a different email.")
          setErrors({ ...errors, parent2Email: t("students.validation.emailAlreadyExists") || "This email is already registered" })
          return
        }
      }
    }

    setCurrentStep((prev) => (prev + 1) as WizardStep)
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      setErrors({})
      window.scrollTo(0, 0)
    } else {
      navigate("/students")
    }
  }

  const handleCreateCertificationType = async (nameFromSearch?: string) => {
    if (!userInfo?.schoolId) return

    const baseName = nameFromSearch ?? newCertificationName
    const name = baseName.trim()
    const description = newCertificationDescription.trim()

    if (!name) {
      toast.error(t("certificationTypes.nameRequired") || "Certification name is required")
      return
    }

    // Check if certification already exists (case-insensitive)
    const existingCert = certificationTypes.find(
      (ct) => ct.name.toLowerCase() === name.toLowerCase()
    )
    if (existingCert) {
      setFormData((prev) => ({ ...prev, certificationTypeId: existingCert.id }))
      setCertificationSearch("")
      setIsSelectOpen(false)
      return
    }

    try {
      setIsSavingCertification(true)
      setCreatingCertificationName(name)
      const created = await api.schools.createCertificationType(userInfo.schoolId, {
        name,
        description: description || undefined,
        isActive: true,
      })

      const newType = created as CertificationType
      setCertificationTypes((prev) => [...prev, newType])
      setFormData((prev) => ({ ...prev, certificationTypeId: newType.id }))
      setIsCreatingCertification(false)
      setNewCertificationName("")
      setNewCertificationDescription("")
      setCertificationSearch("")
      setCreatingCertificationName(null)
      setIsSelectOpen(false)
      toast.success(t("certificationTypes.createSuccess") || "Certification type created successfully")
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("certificationTypes.createError") || "Error creating certification type")
      setCreatingCertificationName(null)
    } finally {
      setIsSavingCertification(false)
    }
  }

  const handleCertificationSelectChange = async (value: string) => {
    const createPrefix = "__create__:"
    if (value.startsWith(createPrefix)) {
      const name = value.slice(createPrefix.length)
      // Keep select open during creation
      setIsSelectOpen(true)
      // Fire async creation based on current search text
      await handleCreateCertificationType(name)
      // Select will be closed in handleCreateCertificationType on success
    } else {
      setFormData((prev) => ({ ...prev, certificationTypeId: value }))
      setIsSelectOpen(false)
      setCertificationSearch("")
    }
  }

  // Auto-focus search input when select opens
  React.useEffect(() => {
    if (isSelectOpen && searchInputRef.current) {
      // Small delay to ensure the SelectContent is rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isSelectOpen])

  const handleSubmit = async () => {
    if (!userInfo?.schoolId) return

    // Check student limit before creating
    try {
      const schoolData = await api.schools.getMy()
      if (schoolData?.userLimit) {
        const countData = await api.schools.getStudentsCount(userInfo.schoolId)
        if (countData.count >= schoolData.userLimit) {
          setLimitWarningDialog({
            open: true,
            title: t("students.limitReached"),
            message: t("students.limitReachedMessage", { limit: schoolData.userLimit })
          })
          setIsSaving(false)
          return
        }
      }
    } catch (err) {
      console.error('Error checking student limit:', err)
      // Continue anyway - backend will also validate
    }

    setIsSaving(true)
    try {
      const parents = [
        {
          firstName: formData.parent1FirstName.trim(),
          lastName: formData.parent1LastName.trim(),
          email: formData.parent1Email.trim(),
          phone: formData.parent1Phone.trim(),
          relationship: formData.parent1Relationship,
        }
      ]

      if (formData.hasSecondParent) {
        parents.push({
          firstName: formData.parent2FirstName.trim(),
          lastName: formData.parent2LastName.trim(),
          email: formData.parent2Email.trim(),
          phone: formData.parent2Phone.trim(),
          relationship: formData.parent2Relationship,
        })
      }

      const student = await api.students.create({
        schoolId: userInfo.schoolId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        birthDate: new Date(formData.birthDate).toISOString(),
        certificationTypeId: formData.certificationTypeId,
        graduationDate: new Date(formData.graduationDate).toISOString(),
        phone: formData.phone.trim(),
        isLeveled: !formData.isLeveled, // Invert: checkbox "Not Leveled" checked = isLeveled false
        expectedLevel: formData.isLeveled ? formData.expectedLevel.trim() : undefined,
        currentLevel: formData.currentLevel.trim(),
        streetAddress: formData.streetAddress.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
        parents,
      })

      // Create billing data if base amount is provided
      if (formData.billingBaseAmount && formData.billingBaseAmount.trim()) {
        try {
          const customAmount = parseFloat(formData.billingBaseAmount)
          if (!isNaN(customAmount) && customAmount > 0) {
            // Get tuition config to calculate scholarship
            const tuitionConfig = await api.billing.getTuitionConfig()
            if (tuitionConfig) {
              const schoolBaseAmount = parseFloat(tuitionConfig.baseTuitionAmount?.toString() || "0")
              if (schoolBaseAmount > 0 && customAmount < schoolBaseAmount) {
                // Calculate scholarship to make final amount = custom amount
                const scholarshipAmount = schoolBaseAmount - customAmount
                // Create student scholarship with fixed discount
                await api.billing.createStudentScholarship(student.id, {
                  scholarshipType: 'fixed',
                  scholarshipValue: scholarshipAmount,
                })
              } else if (customAmount !== schoolBaseAmount) {
                // If custom amount is different, we'd need to store it differently
                // For now, just log a warning
                console.warn('Custom amount provided but cannot be stored as scholarship (would need custom base amount field)')
              }
            }
          }
        } catch (billingError) {
          console.error('Error creating billing data:', billingError)
          // Don't fail student creation if billing fails
          toast.warning(t("students.billingDataWarning") || "Student created but billing data could not be set")
        }
      }

      toast.success(t("students.createSuccess"))
      navigate("/students")
    } catch (error: unknown) {
      // Try to extract better error message from API response
      let errorMessage = t("students.createError")

      if (error instanceof Error) {
        // Check if it's a ZodError or validation error
        try {
          const errorData = JSON.parse(error.message)
          // Handle validation errors - could be in issues array or error array
          const issuesArray = errorData.issues || (Array.isArray(errorData.error) ? errorData.error : null)

          if (issuesArray && Array.isArray(issuesArray)) {
            // Zod validation errors
            const validationErrors = issuesArray.map((issue: { path?: string[]; message?: string; code?: string }) => {
              const field = issue.path?.[0] || 'field'
              const message = issue.message || 'Invalid value'
              // Map common field names to user-friendly labels
              const fieldLabels: Record<string, string> = {
                'email': t("students.email"),
                'firstName': t("students.firstName"),
                'lastName': t("students.lastName"),
                'birthDate': t("students.birthDate"),
                'graduationDate': t("students.graduationDate"),
                'phone': t("students.phone"),
                'currentLevel': t("students.currentLevel"),
                'expectedLevel': t("students.expectedLevel"),
              }
              const fieldLabel = fieldLabels[field] || field
              return `${fieldLabel}: ${message}`
            })
            errorMessage = validationErrors.join(', ')
          } else if (errorData.error) {
            // If error is a string, use it directly
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error
            } else if (Array.isArray(errorData.error)) {
              // If error is an array, process it like issues
              const validationErrors = errorData.error.map((issue: { path?: string[]; message?: string; code?: string }) => {
                const field = issue.path?.[0] || 'field'
                const message = issue.message || 'Invalid value'
                const fieldLabels: Record<string, string> = {
                  'email': t("students.email"),
                  'firstName': t("students.firstName"),
                  'lastName': t("students.lastName"),
                  'birthDate': t("students.birthDate"),
                  'graduationDate': t("students.graduationDate"),
                  'phone': t("students.phone"),
                  'currentLevel': t("students.currentLevel"),
                  'expectedLevel': t("students.expectedLevel"),
                }
                const fieldLabel = fieldLabels[field] || field
                return `${fieldLabel}: ${message}`
              })
              errorMessage = validationErrors.join(', ')
            } else {
              // If error is an object, try to stringify it safely
              errorMessage = JSON.stringify(errorData.error)
            }
          } else if (error.message) {
            errorMessage = error.message
          }
        } catch {
          // If parsing fails, use the error message directly
          if (error.message) {
            // Check if error.message is already a JSON string that failed to parse
            // or if it's a plain string
            if (error.message.startsWith('{') || error.message.startsWith('[')) {
              // It might be a stringified object, try to extract a readable message
              try {
                const parsed = JSON.parse(error.message)
                if (parsed.error && typeof parsed.error === 'string') {
                  errorMessage = parsed.error
                } else {
                  errorMessage = error.message
                }
              } catch {
                errorMessage = error.message
              }
            } else {
              errorMessage = error.message
            }
          }
        }
      }

      // Ensure errorMessage is always a string (not an object)
      if (typeof errorMessage !== 'string') {
        errorMessage = String(errorMessage)
      }

      // Check if error is about limit - show dialog instead of toast
      if (errorMessage.includes('límite') || errorMessage.includes('limit')) {
        setLimitWarningDialog({
          open: true,
          title: t("students.limitReached"),
          message: errorMessage || t("students.limitReachedMessage", { limit: 0 })
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const steps = [
    { number: 1, title: t("students.personalInfo"), description: t("students.step1Description") },
    { number: 2, title: t("students.academicInfo"), description: t("students.step2Description") },
    { number: 3, title: t("students.parentsInfo"), description: t("students.step3Description") },
    { number: 4, title: t("groups.preview"), description: t("students.step4Description") },
  ]

  if (isLoadingUser || isLoading) return <Loading variant='button' />

  return (
    <div className="min-h-screen">
      <div className="w-full p-3 space-y-6">
        {/* Back button - only show on mobile */}
        <div className="md:hidden">
          <BackButton to="/students">
            {t("students.backToStudents")}
          </BackButton>
        </div>

        <PageHeader
          title={t("students.createStudent")}
          description={t("students.createStudentDescription")}
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
                          ? "bg-[#8B5CF6] text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
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

        <Card className="mb-6 bg-white rounded-lg shadow-sm">
          <CardContent className="p-8">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="firstName">{t("common.name")} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={t("students.namePlaceholder")}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">{t("common.lastName")} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={t("students.lastNamePlaceholder")}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="birthDate">{t("students.birthDate")} <span className="text-destructive">*</span></FieldLabel>
                  <SingleDatePicker
                    value={formData.birthDate}
                    onChange={(date) => setFormData({ ...formData, birthDate: date || "" })}
                    placeholder={t("students.birthDatePlaceholder") || "dd/mm/yyyy"}
                    max={new Date().toISOString().split('T')[0]}
                    hasError={!!errors.birthDate}
                  />
                  {errors.birthDate && <p className="text-sm text-destructive mt-1">{errors.birthDate}</p>}
                  {formData.birthDate && calculateAge(formData.birthDate) !== null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("students.age")}: {t("students.ageYears", { age: calculateAge(formData.birthDate) })}
                    </p>
                  )}
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="email">{t("students.email")} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, email: value })
                        // Validate immediately on change
                        const newErrors = { ...errors }
                        if (value.trim() && !validateEmail(value)) {
                          newErrors.email = t("students.validation.emailInvalid")
                        } else {
                          delete newErrors.email
                        }
                        setErrors(newErrors)
                      }}
                      onBlur={(e) => handleEmailBlur('email', e.target.value)}
                      placeholder={t("students.emailPlaceholder") || "student@email.com"}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">{t("students.phone")} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="streetAddress">{t("students.streetAddress")} <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id="streetAddress"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    placeholder={t("students.streetAddressPlaceholder")}
                    className={errors.streetAddress ? "border-destructive" : ""}
                  />
                  {errors.streetAddress && <p className="text-sm text-destructive mt-1">{errors.streetAddress}</p>}
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="country">{t("students.country")} <span className="text-destructive">*</span></FieldLabel>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className={cn(
                            "w-full justify-between",
                            !formData.country && "text-muted-foreground",
                            errors.country && "border-destructive"
                          )}
                        >
                          {formData.country || "Mexico"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t("common.search") || "Search..."}
                            value={countrySearchTerm}
                            onValueChange={setCountrySearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>{t("common.noResults") || "No results found."}</CommandEmpty>
                            <CommandGroup>
                              {Object.keys(countryStatesData)
                                .filter((country) =>
                                  countrySearchTerm
                                    ? country.toLowerCase().includes(countrySearchTerm.toLowerCase())
                                    : true
                                )
                                .map((country) => (
                                  <CommandItem
                                    key={country}
                                    value={country}
                                    onSelect={() => {
                                      setFormData({ ...formData, country, state: "" })
                                      setCountryOpen(false)
                                      setCountrySearchTerm("")
                                      setStateSearchTerm("")
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.country === country ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {country}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.country && <p className="text-sm text-destructive mt-1">{errors.country}</p>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="zipCode">{t("students.zipCode")} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder={t("students.zipCodePlaceholder")}
                      className={errors.zipCode ? "border-destructive" : ""}
                    />
                    {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode}</p>}
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="state">{t("students.state")} <span className="text-destructive">*</span></FieldLabel>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={stateOpen}
                          className={cn(
                            "w-full justify-between",
                            !formData.state && "text-muted-foreground",
                            errors.state && "border-destructive"
                          )}
                        >
                          {formData.state || t("students.statePlaceholder") || "Select state..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t("common.search") || "Search..."}
                            value={stateSearchTerm}
                            onValueChange={setStateSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>{t("common.noResults") || "No results found."}</CommandEmpty>
                            <CommandGroup>
                              {(formData.country ? (countryStatesData[formData.country as keyof typeof countryStatesData] || []) : [])
                                .filter((state: string) =>
                                  stateSearchTerm
                                    ? state.toLowerCase().includes(stateSearchTerm.toLowerCase())
                                    : true
                                )
                                .map((state: string) => (
                                  <CommandItem
                                    key={state}
                                    value={state}
                                    onSelect={() => {
                                      setFormData({ ...formData, state })
                                      setStateOpen(false)
                                      setStateSearchTerm("")
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.state === state ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {state}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="city">{t("students.city")} <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder={t("students.cityPlaceholder")}
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </Field>
                </div>

              </div>
            )}

            {/* Step 2: Academic Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="certificationTypeId">{t("students.certificationType")} <span className="text-destructive">*</span></FieldLabel>
                    <Select
                      value={formData.certificationTypeId}
                      onValueChange={handleCertificationSelectChange}
                      open={isSelectOpen}
                      onOpenChange={setIsSelectOpen}
                    >
                      <SelectTrigger className={errors.certificationTypeId ? "border-destructive" : ""}>
                        <SelectValue placeholder={t("students.selectCertificationType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-1">
                          <Input
                            ref={searchInputRef}
                            value={certificationSearch}
                            onChange={(e) => setCertificationSearch(e.target.value)}
                            placeholder={t("certificationTypes.searchPlaceholder") || "Search or create certification..."}
                            className="h-8"
                          />
                        </div>
                        {(certificationTypes.length > 0 || certificationSearch.trim()) && <SelectSeparator />}
                        {certificationTypes
                          .filter((type) =>
                            certificationSearch.trim()
                              ? type.name.toLowerCase().includes(certificationSearch.trim().toLowerCase())
                              : true
                          )
                          .map((type) => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        {certificationSearch.trim() &&
                          !certificationTypes.some(
                            (type) => type.name.toLowerCase() === certificationSearch.trim().toLowerCase()
                          ) && (
                            <>
                              {certificationTypes.length > 0 && <SelectSeparator />}
                              <SelectItem
                                value={`__create__:${certificationSearch.trim()}`}
                                disabled={isSavingCertification || creatingCertificationName === certificationSearch.trim()}
                              >
                                {creatingCertificationName === certificationSearch.trim() ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    {t("common.creating") || "Creating..."}
                                  </span>
                                ) : (
                                  t("certificationTypes.createOption", { name: certificationSearch.trim() }) ||
                                  `Create "${certificationSearch.trim()}"`
                                )}
                              </SelectItem>
                            </>
                          )}
                        {certificationTypes.length === 0 && !certificationSearch.trim() && (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            {t("certificationTypes.noCertificationTypes")}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.certificationTypeId && <p className="text-sm text-destructive mt-1">{errors.certificationTypeId}</p>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="graduationDate">{t("students.graduationDate")} <span className="text-destructive">*</span></FieldLabel>
                    <SingleDatePicker
                      value={formData.graduationDate}
                      onChange={(date) => setFormData({ ...formData, graduationDate: date || "" })}
                      placeholder={t("students.graduationDatePlaceholder") || "dd/mm/yyyy"}
                      min={(() => {
                        // Min should be tomorrow (future date)
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        return tomorrow.toISOString().split('T')[0]
                      })()}
                      hasError={!!errors.graduationDate}
                    />
                    {errors.graduationDate && <p className="text-sm text-destructive mt-1">{errors.graduationDate}</p>}
                  </Field>
                </div>

                {isCreatingCertification && (
                  <div className="mt-4 space-y-3 border rounded-md p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold">
                      {t("certificationTypes.addNew")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>{t("certificationTypes.nameLabel")}</FieldLabel>
                        <Input
                          value={newCertificationName}
                          onChange={(e) => setNewCertificationName(e.target.value)}
                          placeholder={t("certificationTypes.nameLabel") || "Certification name"}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>{t("certificationTypes.descriptionLabel")}</FieldLabel>
                        <Input
                          value={newCertificationDescription}
                          onChange={(e) => setNewCertificationDescription(e.target.value)}
                          placeholder={t("certificationTypes.descriptionLabel") || "Optional description"}
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => handleCreateCertificationType()}
                        disabled={isSavingCertification}
                      >
                        {isSavingCertification ? t("common.saving") : t("certificationTypes.addNew")}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="isLeveled"
                    checked={formData.isLeveled}
                    onChange={(e) => {
                      const newIsLeveled = e.target.checked
                      // When checked (not leveled = true), show both fields
                      // When unchecked (leveled = true), only show current level
                      setFormData({
                        ...formData,
                        isLeveled: newIsLeveled,
                        expectedLevel: newIsLeveled ? "" : formData.expectedLevel
                      })
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <FieldLabel htmlFor="isLeveled" className="cursor-pointer m-0">
                    {t("students.notLeveledStudent")}
                  </FieldLabel>
                </div>

                {/* Current Level - Always required */}
                <Field>
                  <FieldLabel htmlFor="currentLevel">{t("students.currentLevel")} <span className="text-destructive">*</span></FieldLabel>
                  <Select
                    value={formData.currentLevel}
                    onValueChange={(value) => {
                      const newCurrentLevel = value
                      const currentLevelNum = parseInt(newCurrentLevel.replace('L', ''))
                      const expectedLevelNum = formData.expectedLevel ? parseInt(formData.expectedLevel.replace('L', '')) : 0
                      // Clear expected level if it's not greater than new current level
                      const newExpectedLevel = (expectedLevelNum > currentLevelNum) ? formData.expectedLevel : ""
                      setFormData({ ...formData, currentLevel: newCurrentLevel, expectedLevel: newExpectedLevel })
                    }}
                  >
                    <SelectTrigger className={errors.currentLevel ? "border-destructive" : ""}>
                      <SelectValue placeholder={t("students.currentLevelPlaceholder") || "Select current level"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => `L${i + 1}`).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currentLevel && <p className="text-sm text-destructive mt-1">{errors.currentLevel}</p>}
                </Field>

                {/* Expected Level - Only show if checked (not leveled) */}
                {formData.isLeveled && (
                  <Field>
                    <FieldLabel htmlFor="expectedLevel">{t("students.expectedLevel")} <span className="text-destructive">*</span></FieldLabel>
                    <Select
                      value={formData.expectedLevel}
                      onValueChange={(value) => setFormData({ ...formData, expectedLevel: value })}
                    >
                      <SelectTrigger className={errors.expectedLevel ? "border-destructive" : ""}>
                        <SelectValue placeholder={t("students.expectedLevelPlaceholder") || "Select expected level"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const currentLevelNum = formData.currentLevel ? parseInt(formData.currentLevel.replace('L', '')) : 0
                          return Array.from({ length: 12 }, (_, i) => `L${i + 1}`)
                            .filter((level) => {
                              const levelNum = parseInt(level.replace('L', ''))
                              return levelNum > currentLevelNum
                            })
                            .map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))
                        })()}
                      </SelectContent>
                    </Select>
                    {errors.expectedLevel && <p className="text-sm text-destructive mt-1">{errors.expectedLevel}</p>}
                  </Field>
                )}

                {/* Billing Information (Optional) */}
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">{t("students.billingInfo") || "Billing Information (Optional)"}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("students.billingInfoDescription") || "Set a custom base amount for this student. If not provided, the school's default tuition amount will be used."}
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="billingBaseAmount">{t("students.billingBaseAmount") || "Base Tuition Amount (Optional)"}</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      id="billingBaseAmount"
                      value={formData.billingBaseAmount}
                      onChange={(e) => setFormData({ ...formData, billingBaseAmount: e.target.value })}
                      placeholder={t("students.billingBaseAmountPlaceholder") || "Leave empty to use school default"}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Step 3: Parents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{t("students.parent1")} <span className="text-destructive">*</span></h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="parent1UseDropdown"
                        checked={parent1UseDropdown}
                        onChange={(e) => {
                          setParent1UseDropdown(e.target.checked)
                          if (!e.target.checked) {
                            // Clear parent data when switching to manual
                            setFormData({
                              ...formData,
                              parent1FirstName: "",
                              parent1LastName: "",
                              parent1Email: "",
                              parent1Phone: "",
                              parent1Relationship: "",
                            })
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <FieldLabel htmlFor="parent1UseDropdown" className="cursor-pointer m-0 text-sm">
                        {t("students.selectExistingParent") || "Select existing parent"}
                      </FieldLabel>
                    </div>
                  </div>

                  {parent1UseDropdown ? (
                    <Field>
                      <FieldLabel>{t("students.selectParent") || "Select Parent"} <span className="text-destructive">*</span></FieldLabel>
                      <Popover open={parent1DropdownOpen} onOpenChange={setParent1DropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={parent1DropdownOpen}
                            className={cn(
                              "w-full justify-between",
                              !formData.parent1Email && "text-muted-foreground",
                              errors.parent1Email && "border-destructive"
                            )}
                          >
                            {formData.parent1Email
                              ? `${formData.parent1FirstName} ${formData.parent1LastName} (${formData.parent1Email})`
                              : t("students.selectParentPlaceholder") || "Select a parent..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder={t("common.search") || "Search..."}
                              value={parent1SearchTerm}
                              onValueChange={setParent1SearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>{t("common.noResults") || "No results found."}</CommandEmpty>
                              <CommandGroup>
                                {parents
                                  .filter((parent) =>
                                    parent1SearchTerm
                                      ? `${parent.firstName} ${parent.lastName} ${parent.email}`.toLowerCase().includes(parent1SearchTerm.toLowerCase())
                                      : true
                                  )
                                  .map((parent) => (
                                    <CommandItem
                                      key={parent.id}
                                      value={parent.id}
                                      onSelect={() => {
                                        setFormData({
                                          ...formData,
                                          parent1FirstName: parent.firstName,
                                          parent1LastName: parent.lastName,
                                          parent1Email: parent.email,
                                          parent1Phone: parent.phone || "",
                                          parent1Relationship: "Parent",
                                        })
                                        setParent1DropdownOpen(false)
                                        setParent1SearchTerm("")
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.parent1Email === parent.email ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {parent.firstName} {parent.lastName} ({parent.email})
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {errors.parent1Email && <p className="text-sm text-destructive mt-1">{errors.parent1Email}</p>}
                      {formData.parent1Email && (
                        <Field className="mt-2">
                          <FieldLabel>{t("students.relationship")} <span className="text-destructive">*</span></FieldLabel>
                          <Select
                            value={formData.parent1Relationship}
                            onValueChange={(value) => setFormData({ ...formData, parent1Relationship: value })}
                          >
                            <SelectTrigger className={errors.parent1Relationship ? "border-destructive" : ""}>
                              <SelectValue placeholder={t("students.selectRelationship")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Father">{t("students.father")}</SelectItem>
                              <SelectItem value="Mother">{t("students.mother")}</SelectItem>
                              <SelectItem value="Guardian">{t("students.guardian")}</SelectItem>
                              <SelectItem value="Parent">{t("students.parent")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.parent1Relationship && <p className="text-sm text-destructive mt-1">{errors.parent1Relationship}</p>}
                        </Field>
                      )}
                    </Field>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>{t("common.name")} <span className="text-destructive">*</span></FieldLabel>
                          <Input
                            value={formData.parent1FirstName}
                            onChange={(e) => setFormData({ ...formData, parent1FirstName: e.target.value })}
                            placeholder={t("students.parentNamePlaceholder")}
                            className={errors.parent1FirstName ? "border-destructive" : ""}
                          />
                          {errors.parent1FirstName && <p className="text-sm text-destructive mt-1">{errors.parent1FirstName}</p>}
                        </Field>
                        <Field>
                          <FieldLabel>{t("common.lastName")} <span className="text-destructive">*</span></FieldLabel>
                          <Input
                            value={formData.parent1LastName}
                            onChange={(e) => setFormData({ ...formData, parent1LastName: e.target.value })}
                            placeholder={t("students.parentLastNamePlaceholder")}
                            className={errors.parent1LastName ? "border-destructive" : ""}
                          />
                          {errors.parent1LastName && <p className="text-sm text-destructive mt-1">{errors.parent1LastName}</p>}
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Field>
                          <FieldLabel>{t("common.email")} <span className="text-destructive">*</span></FieldLabel>
                          <Input
                            type="email"
                            value={formData.parent1Email}
                            onChange={(e) => {
                              const value = e.target.value
                              setFormData({ ...formData, parent1Email: value })
                              // Validate immediately on change
                              const newErrors = { ...errors }
                              if (value.trim() && !validateEmail(value)) {
                                newErrors.parent1Email = t("students.validation.emailInvalid")
                              } else {
                                delete newErrors.parent1Email
                                // Also clear parent2Email error if emails are now different
                                if (value !== formData.parent2Email) {
                                  delete newErrors.parent2Email
                                }
                              }
                              setErrors(newErrors)
                            }}
                            onBlur={(e) => handleEmailBlur('parent1Email', e.target.value)}
                            placeholder={t("students.parentEmailPlaceholder")}
                            className={errors.parent1Email ? "border-destructive" : ""}
                          />
                          {errors.parent1Email && <p className="text-sm text-destructive mt-1">{errors.parent1Email}</p>}
                        </Field>
                        <Field>
                          <FieldLabel>{t("students.phone")} <span className="text-destructive">*</span></FieldLabel>
                          <Input
                            type="tel"
                            value={formData.parent1Phone}
                            onChange={(e) => setFormData({ ...formData, parent1Phone: e.target.value })}
                            placeholder={t("students.phonePlaceholder") || "+1 (555) 123-4567"}
                            className={errors.parent1Phone ? "border-destructive" : ""}
                          />
                          {errors.parent1Phone && <p className="text-sm text-destructive mt-1">{errors.parent1Phone}</p>}
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Field>
                          <FieldLabel>{t("students.relationship")} <span className="text-destructive">*</span></FieldLabel>
                          <Select
                            value={formData.parent1Relationship}
                            onValueChange={(value) => setFormData({ ...formData, parent1Relationship: value })}
                          >
                            <SelectTrigger className={errors.parent1Relationship ? "border-destructive" : ""}>
                              <SelectValue placeholder={t("students.selectRelationship")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Father">{t("students.father")}</SelectItem>
                              <SelectItem value="Mother">{t("students.mother")}</SelectItem>
                              <SelectItem value="Guardian">{t("students.guardian")}</SelectItem>
                              <SelectItem value="Parent">{t("students.parent")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.parent1Relationship && <p className="text-sm text-destructive mt-1">{errors.parent1Relationship}</p>}
                        </Field>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="hasSecondParent"
                    checked={formData.hasSecondParent}
                    onChange={(e) => setFormData({ ...formData, hasSecondParent: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <FieldLabel htmlFor="hasSecondParent" className="cursor-pointer m-0">
                    {t("forms.addSecondParent")}
                  </FieldLabel>
                </div>

                {formData.hasSecondParent && (
                  <div className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{t("students.parent2")}</h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="parent2UseDropdown"
                          checked={parent2UseDropdown}
                          onChange={(e) => {
                            setParent2UseDropdown(e.target.checked)
                            if (!e.target.checked) {
                              // Clear parent data when switching to manual
                              setFormData({
                                ...formData,
                                parent2FirstName: "",
                                parent2LastName: "",
                                parent2Email: "",
                                parent2Phone: "",
                                parent2Relationship: "",
                              })
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <FieldLabel htmlFor="parent2UseDropdown" className="cursor-pointer m-0 text-sm">
                          {t("students.selectExistingParent") || "Select existing parent"}
                        </FieldLabel>
                      </div>
                    </div>

                    {parent2UseDropdown ? (
                      <Field>
                        <FieldLabel>{t("students.selectParent") || "Select Parent"} <span className="text-destructive">*</span></FieldLabel>
                        <Popover open={parent2DropdownOpen} onOpenChange={setParent2DropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={parent2DropdownOpen}
                              className={cn(
                                "w-full justify-between",
                                !formData.parent2Email && "text-muted-foreground",
                                errors.parent2Email && "border-destructive"
                              )}
                            >
                              {formData.parent2Email
                                ? `${formData.parent2FirstName} ${formData.parent2LastName} (${formData.parent2Email})`
                                : t("students.selectParentPlaceholder") || "Select a parent..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder={t("common.search") || "Search..."}
                                value={parent2SearchTerm}
                                onValueChange={setParent2SearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>{t("common.noResults") || "No results found."}</CommandEmpty>
                                <CommandGroup>
                                  {parents
                                    .filter((parent) =>
                                      parent2SearchTerm
                                        ? `${parent.firstName} ${parent.lastName} ${parent.email}`.toLowerCase().includes(parent2SearchTerm.toLowerCase())
                                        : true
                                    )
                                    .filter((parent) => parent.email !== formData.parent1Email)
                                    .map((parent) => (
                                      <CommandItem
                                        key={parent.id}
                                        value={parent.id}
                                        onSelect={() => {
                                          setFormData({
                                            ...formData,
                                            parent2FirstName: parent.firstName,
                                            parent2LastName: parent.lastName,
                                            parent2Email: parent.email,
                                            parent2Phone: parent.phone || "",
                                            parent2Relationship: "Parent",
                                          })
                                          setParent2DropdownOpen(false)
                                          setParent2SearchTerm("")
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.parent2Email === parent.email ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {parent.firstName} {parent.lastName} ({parent.email})
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {errors.parent2Email && <p className="text-sm text-destructive mt-1">{errors.parent2Email}</p>}
                        {formData.parent2Email && (
                          <Field className="mt-2">
                            <FieldLabel>{t("students.relationship")} <span className="text-destructive">*</span></FieldLabel>
                            <Select
                              value={formData.parent2Relationship}
                              onValueChange={(value) => setFormData({ ...formData, parent2Relationship: value })}
                            >
                              <SelectTrigger className={errors.parent2Relationship ? "border-destructive" : ""}>
                                <SelectValue placeholder={t("students.selectRelationship")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Father">{t("students.father")}</SelectItem>
                                <SelectItem value="Mother">{t("students.mother")}</SelectItem>
                                <SelectItem value="Guardian">{t("students.guardian")}</SelectItem>
                                <SelectItem value="Parent">{t("students.parent")}</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.parent2Relationship && <p className="text-sm text-destructive mt-1">{errors.parent2Relationship}</p>}
                          </Field>
                        )}
                      </Field>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel>{t("common.name")} <span className="text-destructive">*</span></FieldLabel>
                            <Input
                              value={formData.parent2FirstName}
                              onChange={(e) => setFormData({ ...formData, parent2FirstName: e.target.value })}
                              placeholder={t("students.secondParentNamePlaceholder")}
                              className={errors.parent2FirstName ? "border-destructive" : ""}
                            />
                            {errors.parent2FirstName && <p className="text-sm text-destructive mt-1">{errors.parent2FirstName}</p>}
                          </Field>
                          <Field>
                            <FieldLabel>{t("common.lastName")} <span className="text-destructive">*</span></FieldLabel>
                            <Input
                              value={formData.parent2LastName}
                              onChange={(e) => setFormData({ ...formData, parent2LastName: e.target.value })}
                              placeholder={t("students.secondParentLastNamePlaceholder")}
                              className={errors.parent2LastName ? "border-destructive" : ""}
                            />
                            {errors.parent2LastName && <p className="text-sm text-destructive mt-1">{errors.parent2LastName}</p>}
                          </Field>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <Field>
                            <FieldLabel>{t("common.email")} <span className="text-destructive">*</span></FieldLabel>
                            <Input
                              type="email"
                              value={formData.parent2Email}
                              onChange={(e) => {
                                const value = e.target.value
                                setFormData({ ...formData, parent2Email: value })
                                // Validate immediately on change
                                const newErrors = { ...errors }
                                if (value.trim() && !validateEmail(value)) {
                                  newErrors.parent2Email = t("students.validation.emailInvalid")
                                } else {
                                  delete newErrors.parent2Email
                                  // Check if emails are different
                                  if (value === formData.parent1Email && value.trim()) {
                                    newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
                                  }
                                }
                                setErrors(newErrors)
                              }}
                              onBlur={(e) => handleEmailBlur('parent2Email', e.target.value)}
                              placeholder={t("students.secondParentEmailPlaceholder")}
                              className={errors.parent2Email ? "border-destructive" : ""}
                            />
                            {errors.parent2Email && <p className="text-sm text-destructive mt-1">{errors.parent2Email}</p>}
                          </Field>
                          <Field>
                            <FieldLabel>{t("students.phone")} <span className="text-destructive">*</span></FieldLabel>
                            <Input
                              type="tel"
                              value={formData.parent2Phone}
                              onChange={(e) => setFormData({ ...formData, parent2Phone: e.target.value })}
                              placeholder={t("students.phonePlaceholder") || "+1 (555) 123-4567"}
                              className={errors.parent2Phone ? "border-destructive" : ""}
                            />
                            {errors.parent2Phone && <p className="text-sm text-destructive mt-1">{errors.parent2Phone}</p>}
                          </Field>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <Field>
                            <FieldLabel>{t("students.relationship")} <span className="text-destructive">*</span></FieldLabel>
                            <Select
                              value={formData.parent2Relationship}
                              onValueChange={(value) => setFormData({ ...formData, parent2Relationship: value })}
                            >
                              <SelectTrigger className={errors.parent2Relationship ? "border-destructive" : ""}>
                                <SelectValue placeholder={t("students.selectRelationship")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Father">{t("students.father")}</SelectItem>
                                <SelectItem value="Mother">{t("students.mother")}</SelectItem>
                                <SelectItem value="Guardian">{t("students.guardian")}</SelectItem>
                                <SelectItem value="Parent">{t("students.parent")}</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.parent2Relationship && <p className="text-sm text-destructive mt-1">{errors.parent2Relationship}</p>}
                          </Field>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Preview */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("students.personalInfo")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">{t("common.name")}:</span> {formData.firstName} {formData.lastName}</div>
                    <div><span className="text-muted-foreground">{t("students.birthDate")}:</span> {formData.birthDate ? format(new Date(`${formData.birthDate}T00:00:00`), "dd/MM/yyyy") : "-"}</div>
                    <div><span className="text-muted-foreground">{t("students.email")}:</span> {formData.email}</div>
                    <div><span className="text-muted-foreground">{t("students.phone")}:</span> {formData.phone || "-"}</div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t("students.streetAddress")}:</span> {formData.streetAddress || "-"}
                    </div>
                    <div><span className="text-muted-foreground">{t("students.city")}:</span> {formData.city || "-"}</div>
                    <div><span className="text-muted-foreground">{t("students.state")}:</span> {formData.state || "-"}</div>
                    <div><span className="text-muted-foreground">{t("students.country")}:</span> {formData.country || "-"}</div>
                    <div><span className="text-muted-foreground">{t("students.zipCode")}:</span> {formData.zipCode || "-"}</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("students.academicInfo")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("students.certificationType")}:</span> {" "}
                      {certificationTypes.find(t => t.id === formData.certificationTypeId)?.name}
                    </div>
                    <div><span className="text-muted-foreground">{t("students.graduationDate")}:</span> {formData.graduationDate ? format(new Date(`${formData.graduationDate}T00:00:00`), "dd/MM/yyyy") : "-"}</div>
                    <div><span className="text-muted-foreground">{t("students.currentLevel")}:</span> {formData.currentLevel || "-"}</div>
                    {formData.isLeveled && (
                      <div><span className="text-muted-foreground">{t("students.expectedLevel")}:</span> {formData.expectedLevel || "-"}</div>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("students.parentsInfo")}</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <div className="font-medium">{t("students.parent1")} ({t(`students.${formData.parent1Relationship.toLowerCase()}`)})</div>
                    <div>{formData.parent1FirstName} {formData.parent1LastName}</div>
                    <div className="text-muted-foreground">{formData.parent1Email}</div>
                  </div>
                  {formData.hasSecondParent && (
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <div className="font-medium">{t("students.parent2")} ({t(`students.${formData.parent2Relationship.toLowerCase()}`)})</div>
                      <div>{formData.parent2FirstName} {formData.parent2LastName}</div>
                      <div className="text-muted-foreground">{formData.parent2Email}</div>
                    </div>
                  )}
                </div>
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
            className="transition-colors"
            style={{
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-soft)'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.filter = 'brightness(0.95)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = ''
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
                className="transition-colors"
                style={{
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-soft)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.filter = 'brightness(0.95)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = ''
                }}
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
                {isSaving ? t("common.saving") : t("students.createButton")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Limit Warning Dialog */}
      {limitWarningDialog && (
        <AlertDialog open={limitWarningDialog.open} onOpenChange={(open) => setLimitWarningDialog(open ? limitWarningDialog : null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{limitWarningDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {limitWarningDialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => {
                setLimitWarningDialog(null)
                navigate("/students")
              }}>
                {t("common.accept")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

