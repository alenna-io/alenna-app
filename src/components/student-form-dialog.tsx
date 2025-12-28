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
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, AlertTriangle, Calendar } from "lucide-react"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
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
import { cn } from "@/lib/utils"
import countryStatesData from "@/data/country-states.json"

interface CertificationType {
  id: string
  name: string
  description?: string
}

interface ParentData {
  firstName: string
  lastName: string
  email: string
  phone: string
  relationship: string
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
          defaultMonth={parsedDate}
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

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
  student?: {
    id: string
    firstName: string
    lastName: string
    email?: string
    birthDate: string
    certificationType: string
    certificationTypeId?: string
    graduationDate: string
    phone?: string
    isLeveled?: boolean
    expectedLevel?: string
    currentLevel?: string
    streetAddress?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
    parents?: Array<{
      firstName: string
      lastName: string
      email: string
      phone: string
      relationship: string
    }>
  } | null
  onSave: (data: {
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    phone?: string
    isLeveled?: boolean
    expectedLevel?: string
    currentLevel?: string
    streetAddress?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
    parents?: ParentData[]
  }) => Promise<void>
}

export function StudentFormDialog({
  open,
  onOpenChange,
  schoolId,
  student,
  onSave,
}: StudentFormDialogProps) {
  const { t } = useTranslation()
  const api = useApi()
  const [isSaving, setIsSaving] = React.useState(false)
  const [certificationTypes, setCertificationTypes] = React.useState<CertificationType[]>([])
  const [loadingCertTypes, setLoadingCertTypes] = React.useState(false)
  const [countryOpen, setCountryOpen] = React.useState(false)
  const [stateOpen, setStateOpen] = React.useState(false)
  const [stateSearchTerm, setStateSearchTerm] = React.useState("")
  const [countrySearchTerm, setCountrySearchTerm] = React.useState("")
  const [errors, setErrors] = React.useState<{
    firstName?: string
    lastName?: string
    email?: string
    birthDate?: string
    certificationTypeId?: string
    graduationDate?: string
    phone?: string
    parents?: string
    parent1FirstName?: string
    parent1LastName?: string
    parent1Email?: string
    parent1Phone?: string
    parent1Relationship?: string
    parent2FirstName?: string
    parent2LastName?: string
    parent2Email?: string
    parent2Phone?: string
    parent2Relationship?: string
    streetAddress?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
    currentLevel?: string
    expectedLevel?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    phone: string
    isLeveled: boolean
    expectedLevel: string
    currentLevel: string
    streetAddress: string
    city: string
    state: string
    country: string
    zipCode: string
    parent1FirstName: string
    parent1LastName: string
    parent1Email: string
    parent1Phone: string
    parent1Relationship: string
    parent2FirstName: string
    parent2LastName: string
    parent2Email: string
    parent2Phone: string
    parent2Relationship: string
    hasSecondParent: boolean
  }>({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    certificationTypeId: "",
    graduationDate: "",
    phone: "",
    isLeveled: false,
    expectedLevel: "",
    currentLevel: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    parent1FirstName: "",
    parent1LastName: "",
    parent1Email: "",
    parent1Phone: "",
    parent1Relationship: "",
    parent2FirstName: "",
    parent2LastName: "",
    parent2Email: "",
    parent2Phone: "",
    parent2Relationship: "",
    hasSecondParent: false,
  })

  const availableCountries = Object.keys(countryStatesData)

  // Fetch certification types when dialog opens
  React.useEffect(() => {
    if (open && schoolId) {
      const fetchCertificationTypes = async () => {
        try {
          setLoadingCertTypes(true)
          const types = await api.schools.getCertificationTypes(schoolId)
          setCertificationTypes(types as CertificationType[])
        } catch (error) {
          console.error('Error fetching certification types:', error)
          setCertificationTypes([])
        } finally {
          setLoadingCertTypes(false)
        }
      }
      fetchCertificationTypes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schoolId])

  // Initialize form data when dialog opens
  React.useEffect(() => {
    if (open) {
      if (student) {
        // Edit mode: populate form with student data
        const parents = student.parents || []
        setFormData({
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          email: student.email || "",
          birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : "",
          certificationTypeId: student.certificationTypeId || "",
          graduationDate: student.graduationDate ? new Date(student.graduationDate).toISOString().split('T')[0] : "",
          phone: student.phone || "",
          isLeveled: student.isLeveled !== undefined ? !student.isLeveled : false, // Invert: DB isLeveled=true means student IS leveled, checkbox "Not Leveled" should be unchecked
          expectedLevel: student.expectedLevel || "",
          currentLevel: student.currentLevel || "",
          streetAddress: student.streetAddress || "",
          city: student.city || "",
          state: student.state || "",
          country: student.country || "",
          zipCode: student.zipCode || "",
          parent1FirstName: parents[0]?.firstName || "",
          parent1LastName: parents[0]?.lastName || "",
          parent1Email: parents[0]?.email || "",
          parent1Phone: parents[0]?.phone || "",
          parent1Relationship: parents[0]?.relationship || "",
          parent2FirstName: parents[1]?.firstName || "",
          parent2LastName: parents[1]?.lastName || "",
          parent2Email: parents[1]?.email || "",
          parent2Phone: parents[1]?.phone || "",
          parent2Relationship: parents[1]?.relationship || "",
          hasSecondParent: parents.length > 1,
        })
      } else {
        // Create mode: reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          birthDate: "",
          certificationTypeId: "",
          graduationDate: "",
          phone: "",
          isLeveled: false,
          expectedLevel: "",
          currentLevel: "",
          streetAddress: "",
          city: "",
          state: "",
          country: "Mexico",
          zipCode: "",
          parent1FirstName: "",
          parent1LastName: "",
          parent1Email: "",
          parent1Phone: "",
          parent1Relationship: "",
          parent2FirstName: "",
          parent2LastName: "",
          parent2Email: "",
          parent2Phone: "",
          parent2Relationship: "",
          hasSecondParent: false,
        })
      }
      setErrors({})
    }
  }, [open, student])

  const validateForm = (): boolean => {
    const newErrors: {
      firstName?: string
      lastName?: string
      email?: string
      birthDate?: string
      certificationTypeId?: string
      graduationDate?: string
      phone?: string
      parents?: string
      parent1FirstName?: string
      parent1LastName?: string
      parent1Email?: string
      parent1Phone?: string
      parent1Relationship?: string
      parent2FirstName?: string
      parent2LastName?: string
      parent2Email?: string
      parent2Phone?: string
      parent2Relationship?: string
      streetAddress?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    } = {}

    // Validate firstName
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("students.validation.firstNameRequired")
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("students.validation.lastNameRequired")
    }

    if (!formData.email.trim()) {
      newErrors.email = t("students.validation.studentEmailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("students.validation.emailInvalid")
    }

    // Validate birthDate
    if (!formData.birthDate) {
      newErrors.birthDate = t("students.validation.birthDateRequired")
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      if (birthDate >= today) {
        newErrors.birthDate = t("students.validation.birthDateFuture")
      }
    }

    // Validate certificationTypeId
    if (!formData.certificationTypeId) {
      newErrors.certificationTypeId = t("students.validation.certificationTypeRequired")
    }

    // Validate graduationDate
    if (!formData.graduationDate) {
      newErrors.graduationDate = t("students.validation.graduationDateRequired")
    } else if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const graduationDate = new Date(formData.graduationDate)
      if (graduationDate <= birthDate) {
        newErrors.graduationDate = t("students.validation.graduationDateBeforeBirth")
      }
    }

    // Only validate parents in create mode
    if (!student) {
      // Validate parent 1 (required)
      if (!formData.parent1FirstName.trim()) {
        newErrors.parent1FirstName = t("students.validation.parentNameRequired")
      }
      if (!formData.parent1LastName.trim()) {
        newErrors.parent1LastName = t("students.validation.parentLastNameRequired")
      }
      if (!formData.parent1Email.trim()) {
        newErrors.parent1Email = t("students.validation.parentEmailRequired")
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent1Email)) {
        newErrors.parent1Email = t("students.validation.emailInvalid")
      }
      if (!formData.parent1Phone.trim()) {
        newErrors.parent1Phone = t("students.validation.parentPhoneRequired") || "Parent phone number is required"
      }
      if (!formData.parent1Relationship.trim()) {
        newErrors.parent1Relationship = t("students.validation.relationshipRequired")
      }

      // Validate parent 2 (optional, but if filled, all fields required)
      if (formData.hasSecondParent) {
        if (!formData.parent2FirstName.trim()) {
          newErrors.parent2FirstName = t("students.validation.parentNameRequired")
        }
        if (!formData.parent2LastName.trim()) {
          newErrors.parent2LastName = t("students.validation.parentLastNameRequired")
        }
        if (!formData.parent2Email.trim()) {
          newErrors.parent2Email = t("students.validation.parentEmailRequired")
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent2Email)) {
          newErrors.parent2Email = t("students.validation.emailInvalid")
        }
        if (!formData.parent2Phone.trim()) {
          newErrors.parent2Phone = t("students.validation.parentPhoneRequired") || "Parent phone number is required"
        }
        if (!formData.parent2Relationship.trim()) {
          newErrors.parent2Relationship = t("students.validation.relationshipRequired")
        }

        // Ensure parent emails are different
        if (formData.parent1Email === formData.parent2Email) {
          newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)

      // Build parents array (only in create mode)
      const parents: ParentData[] | undefined = student ? undefined : [
        {
          firstName: formData.parent1FirstName.trim(),
          lastName: formData.parent1LastName.trim(),
          email: formData.parent1Email.trim(),
          phone: formData.parent1Phone.trim(),
          relationship: formData.parent1Relationship.trim(),
        }
      ]

      // Add second parent if provided (only in create mode)
      if (!student && formData.hasSecondParent && parents) {
        parents.push({
          firstName: formData.parent2FirstName.trim(),
          lastName: formData.parent2LastName.trim(),
          email: formData.parent2Email.trim(),
          phone: formData.parent2Phone.trim(),
          relationship: formData.parent2Relationship.trim(),
        })
      }

      await onSave({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        birthDate: new Date(formData.birthDate).toISOString(),
        certificationTypeId: formData.certificationTypeId,
        graduationDate: new Date(formData.graduationDate).toISOString(),
        phone: formData.phone.trim() || undefined,
        isLeveled: !formData.isLeveled, // Invert: checkbox "Not Leveled" checked = isLeveled false in DB
        expectedLevel: formData.isLeveled ? formData.expectedLevel.trim() : undefined, // Only send expectedLevel if checkbox is checked (student is NOT leveled)
        currentLevel: formData.currentLevel.trim() || undefined,
        streetAddress: formData.streetAddress.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
        parents, // Only included in create mode (undefined in edit mode)
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving student:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {student ? t("students.editStudent") : t("students.createStudent")}
          </DialogTitle>
          <DialogDescription>
            {student ? t("students.editStudentDescription") : t("students.createStudentDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">
                  {t("common.name")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={t("students.namePlaceholder")}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="lastName">
                  {t("common.lastName")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder={t("students.lastNamePlaceholder")}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="studentEmail">
                  {t("students.email")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="studentEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("students.emailPlaceholder") || "student@email.com"}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">{t("students.phone")}</FieldLabel>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="birthDate">
                {t("students.birthDate")} <span className="text-destructive">*</span>
              </FieldLabel>
              <SingleDatePicker
                value={formData.birthDate}
                onChange={(date) => setFormData({ ...formData, birthDate: date || "" })}
                placeholder={t("students.birthDatePlaceholder") || "dd/mm/yyyy"}
                max={new Date().toISOString().split('T')[0]}
                hasError={!!errors.birthDate}
              />
              {errors.birthDate && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.birthDate}</span>
                </div>
              )}
            </Field>




            <Field>
              <FieldLabel htmlFor="streetAddress">{t("students.streetAddress")} <span className="text-destructive">*</span></FieldLabel>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                placeholder={t("students.streetAddressPlaceholder")}
                className={errors.streetAddress ? "border-destructive" : ""}
              />
              {errors.streetAddress && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{errors.streetAddress}</span>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="city">{t("students.city")} <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t("students.cityPlaceholder")}
                  className={errors.city ? "border-destructive" : ""}
                />
                {errors.city && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.city}</span>
                  </div>
                )}
              </Field>

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
                {errors.state && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.state}</span>
                  </div>
                )}
              </Field>
            </div>

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
                          {availableCountries
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
                {errors.country && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.country}</span>
                  </div>
                )}
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
                {errors.zipCode && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.zipCode}</span>
                  </div>
                )}
              </Field>
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-10">{t("students.academicInfo")}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="certificationTypeId">
                  {t("students.certificationType")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={formData.certificationTypeId}
                  onValueChange={(value) => setFormData({ ...formData, certificationTypeId: value })}
                  disabled={loadingCertTypes}
                >
                  <SelectTrigger className={errors.certificationTypeId ? "border-destructive" : ""}>
                    <SelectValue placeholder={loadingCertTypes ? t("common.loading") : t("students.selectCertificationType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.certificationTypeId && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.certificationTypeId}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="graduationDate">
                  {t("students.graduationDate")} <span className="text-destructive">*</span>
                </FieldLabel>
                <SingleDatePicker
                  value={formData.graduationDate}
                  onChange={(date) => setFormData({ ...formData, graduationDate: date || "" })}
                  placeholder={t("students.graduationDatePlaceholder") || "dd/mm/yyyy"}
                  min={formData.birthDate || undefined}
                  hasError={!!errors.graduationDate}
                />
                {errors.graduationDate && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.graduationDate}</span>
                  </div>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Field>
                <FieldLabel htmlFor="currentLevel">{t("students.currentLevel")}</FieldLabel>
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
                {errors.currentLevel && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.currentLevel}</span>
                  </div>
                )}
              </Field>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLeveled"
                  checked={formData.isLeveled}
                  onChange={(e) => setFormData({ ...formData, isLeveled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <FieldLabel htmlFor="isLeveled" className="cursor-pointer">
                  {t("students.notLeveledStudent")}
                </FieldLabel>
              </div>

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
                  {errors.expectedLevel && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{errors.expectedLevel}</span>
                    </div>
                  )}
                </Field>
              )}
            </div>

            {/* Parents Section - Only show in create mode */}
            {!student && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">{t("forms.parentsInfo")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("forms.parentsRequired")}
                </p>

                {/* Parent 1 (Required) */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-medium">{t("students.parent1")} <span className="text-destructive">*</span></h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="parent1FirstName">
                        {t("common.name")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="parent1FirstName"
                        value={formData.parent1FirstName}
                        onChange={(e) => setFormData({ ...formData, parent1FirstName: e.target.value })}
                        placeholder={t("students.parentNamePlaceholder")}
                        className={errors.parent1FirstName ? "border-destructive" : ""}
                      />
                      {errors.parent1FirstName && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{errors.parent1FirstName}</span>
                        </div>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="parent1LastName">
                        {t("common.lastName")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="parent1LastName"
                        value={formData.parent1LastName}
                        onChange={(e) => setFormData({ ...formData, parent1LastName: e.target.value })}
                        placeholder={t("students.parentLastNamePlaceholder")}
                        className={errors.parent1LastName ? "border-destructive" : ""}
                      />
                      {errors.parent1LastName && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{errors.parent1LastName}</span>
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="parent1Email">
                        Email <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="parent1Email"
                        type="email"
                        value={formData.parent1Email}
                        onChange={(e) => setFormData({ ...formData, parent1Email: e.target.value })}
                        placeholder={t("students.parentEmailPlaceholder")}
                        className={errors.parent1Email ? "border-destructive" : ""}
                      />
                      {errors.parent1Email && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{errors.parent1Email}</span>
                        </div>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="parent1Phone">
                        {t("students.phone")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="parent1Phone"
                        type="tel"
                        value={formData.parent1Phone}
                        onChange={(e) => setFormData({ ...formData, parent1Phone: e.target.value })}
                        placeholder={t("students.phonePlaceholder") || "+1 (555) 123-4567"}
                        className={errors.parent1Phone ? "border-destructive" : ""}
                      />
                      {errors.parent1Phone && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{errors.parent1Phone}</span>
                        </div>
                      )}
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="parent1Relationship">
                        {t("students.relationship")} <span className="text-destructive">*</span>
                      </FieldLabel>
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
                      {errors.parent1Relationship && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{errors.parent1Relationship}</span>
                        </div>
                      )}
                    </Field>
                  </div>
                </div>

                {/* Parent 2 (Optional) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="hasSecondParent"
                      checked={formData.hasSecondParent}
                      onChange={(e) => setFormData({ ...formData, hasSecondParent: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <FieldLabel htmlFor="hasSecondParent" className="cursor-pointer">
                      {t("forms.addSecondParent")}
                    </FieldLabel>
                  </div>

                  {formData.hasSecondParent && (
                    <>
                      <h4 className="text-sm font-medium">{t("students.parent2")}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="parent2FirstName">
                            {t("common.name")} <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="parent2FirstName"
                            value={formData.parent2FirstName}
                            onChange={(e) => setFormData({ ...formData, parent2FirstName: e.target.value })}
                            placeholder={t("students.secondParentNamePlaceholder")}
                            className={errors.parent2FirstName ? "border-destructive" : ""}
                          />
                          {errors.parent2FirstName && (
                            <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.parent2FirstName}</span>
                            </div>
                          )}
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="parent2LastName">
                            {t("common.lastName")} <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="parent2LastName"
                            value={formData.parent2LastName}
                            onChange={(e) => setFormData({ ...formData, parent2LastName: e.target.value })}
                            placeholder={t("students.secondParentLastNamePlaceholder")}
                            className={errors.parent2LastName ? "border-destructive" : ""}
                          />
                          {errors.parent2LastName && (
                            <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.parent2LastName}</span>
                            </div>
                          )}
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="parent2Email">
                            {t("common.email")} <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="parent2Email"
                            type="email"
                            value={formData.parent2Email}
                            onChange={(e) => setFormData({ ...formData, parent2Email: e.target.value })}
                            placeholder={t("students.secondParentEmailPlaceholder")}
                            className={errors.parent2Email ? "border-destructive" : ""}
                          />
                          {errors.parent2Email && (
                            <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.parent2Email}</span>
                            </div>
                          )}
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="parent2Phone">
                            {t("students.phone")} <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="parent2Phone"
                            type="tel"
                            value={formData.parent2Phone}
                            onChange={(e) => setFormData({ ...formData, parent2Phone: e.target.value })}
                            placeholder={t("students.phonePlaceholder") || "+1 (555) 123-4567"}
                            className={errors.parent2Phone ? "border-destructive" : ""}
                          />
                          {errors.parent2Phone && (
                            <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.parent2Phone}</span>
                            </div>
                          )}
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="parent2Relationship">
                            {t("students.relationship")} <span className="text-destructive">*</span>
                          </FieldLabel>
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
                          {errors.parent2Relationship && (
                            <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.parent2Relationship}</span>
                            </div>
                          )}
                        </Field>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("common.saving") : (student ? t("students.updateButton") : t("students.createButton"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}

