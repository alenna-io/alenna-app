import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
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

type WizardStep = 1 | 2 | 3 | 4

interface CertificationType {
  id: string
  name: string
  description?: string
  isActive?: boolean
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

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    contactPhone: "",
    address: "",
    certificationTypeId: "",
    graduationDate: "",
    isLeveled: false,
    expectedLevel: "",
    currentLevel: "",
    parent1FirstName: "",
    parent1LastName: "",
    parent1Email: "",
    parent1Relationship: "",
    hasSecondParent: false,
    parent2FirstName: "",
    parent2LastName: "",
    parent2Email: "",
    parent2Relationship: "",
  })

  React.useEffect(() => {
    const fetchData = async () => {
      if (!userInfo?.schoolId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const types = await api.schools.getCertificationTypes(userInfo.schoolId)
        setCertificationTypes(types as CertificationType[])
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
      if (!formData.birthDate) {
        newErrors.birthDate = t("students.validation.birthDateRequired")
      } else {
        const birthDate = new Date(formData.birthDate)
        if (birthDate >= new Date()) newErrors.birthDate = t("students.validation.birthDateFuture")
      }
    } else if (step === 2) {
      if (!formData.certificationTypeId) newErrors.certificationTypeId = t("students.validation.certificationTypeRequired")
      if (!formData.graduationDate) {
        newErrors.graduationDate = t("students.validation.graduationDateRequired")
      } else if (formData.birthDate) {
        const birth = new Date(formData.birthDate)
        const grad = new Date(formData.graduationDate)
        if (grad <= birth) newErrors.graduationDate = t("students.validation.graduationDateBeforeBirth")
      }
    } else if (step === 3) {
      // Parent 1
      if (!formData.parent1FirstName.trim()) newErrors.parent1FirstName = t("students.validation.parentNameRequired")
      if (!formData.parent1LastName.trim()) newErrors.parent1LastName = t("students.validation.parentLastNameRequired")
      if (!formData.parent1Email.trim()) {
        newErrors.parent1Email = t("students.validation.parentEmailRequired")
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent1Email)) {
        newErrors.parent1Email = t("students.validation.emailInvalid")
      }
      if (!formData.parent1Relationship) newErrors.parent1Relationship = t("students.validation.relationshipRequired")

      // Parent 2
      if (formData.hasSecondParent) {
        if (!formData.parent2FirstName.trim()) newErrors.parent2FirstName = t("students.validation.parentNameRequired")
        if (!formData.parent2LastName.trim()) newErrors.parent2LastName = t("students.validation.parentLastNameRequired")
        if (!formData.parent2Email.trim()) {
          newErrors.parent2Email = t("students.validation.parentEmailRequired")
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent2Email)) {
          newErrors.parent2Email = t("students.validation.emailInvalid")
        }
        if (!formData.parent2Relationship) newErrors.parent2Relationship = t("students.validation.relationshipRequired")

        if (formData.parent1Email === formData.parent2Email && formData.parent1Email) {
          newErrors.parent2Email = t("students.validation.parentEmailsMustBeDifferent")
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
      window.scrollTo(0, 0)
    }
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

  const handleCreateCertificationType = async () => {
    if (!userInfo?.schoolId) return

    const name = newCertificationName.trim()
    const description = newCertificationDescription.trim()

    if (!name) {
      toast.error(t("certificationTypes.nameRequired") || "Certification name is required")
      return
    }

    try {
      setIsSavingCertification(true)
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
      toast.success(t("certificationTypes.createSuccess") || "Certification type created successfully")
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("certificationTypes.createError") || "Error creating certification type")
    } finally {
      setIsSavingCertification(false)
    }
  }

  const handleSubmit = async () => {
    if (!userInfo?.schoolId) return

    setIsSaving(true)
    try {
      const parents = [
        {
          firstName: formData.parent1FirstName.trim(),
          lastName: formData.parent1LastName.trim(),
          email: formData.parent1Email.trim(),
          relationship: formData.parent1Relationship,
        }
      ]

      if (formData.hasSecondParent) {
        parents.push({
          firstName: formData.parent2FirstName.trim(),
          lastName: formData.parent2LastName.trim(),
          email: formData.parent2Email.trim(),
          relationship: formData.parent2Relationship,
        })
      }

      await api.students.create({
        schoolId: userInfo.schoolId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: new Date(formData.birthDate).toISOString(),
        certificationTypeId: formData.certificationTypeId,
        graduationDate: new Date(formData.graduationDate).toISOString(),
        contactPhone: formData.contactPhone.trim() || undefined,
        isLeveled: formData.isLeveled,
        expectedLevel: formData.expectedLevel.trim() || undefined,
        currentLevel: formData.currentLevel.trim() || undefined,
        address: formData.address.trim() || undefined,
        parents,
      })

      toast.success(t("students.createSuccess"))
      navigate("/students")
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("students.createError"))
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

  if (isLoadingUser || isLoading) return <Loading />

  return (
    <div className="min-h-screen">
      <div className="w-full p-3 space-y-6 max-w-4xl mx-auto">
        <BackButton to="/students">
          {t("students.backToStudents")}
        </BackButton>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="birthDate">{t("students.birthDate")} <span className="text-destructive">*</span></FieldLabel>
                    <DatePicker
                      value={formData.birthDate}
                      onChange={(date) => setFormData({ ...formData, birthDate: date || "" })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.birthDate && <p className="text-sm text-destructive mt-1">{errors.birthDate}</p>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contactPhone">{t("students.contactPhone")}</FieldLabel>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="address">{t("common.address")}</FieldLabel>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t("students.fullAddress")}
                  />
                </Field>
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
                      onValueChange={(value) => setFormData({ ...formData, certificationTypeId: value })}
                    >
                      <SelectTrigger className={errors.certificationTypeId ? "border-destructive" : ""}>
                        <SelectValue placeholder={t("students.selectCertificationType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {certificationTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.certificationTypeId && <p className="text-sm text-destructive mt-1">{errors.certificationTypeId}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {t("certificationTypes.noCertificationTypes")}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setIsCreatingCertification((prev) => !prev)}
                      >
                        {isCreatingCertification
                          ? t("common.cancel")
                          : t("certificationTypes.addNew")}
                      </Button>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="graduationDate">{t("students.graduationDate")} <span className="text-destructive">*</span></FieldLabel>
                    <DatePicker
                      value={formData.graduationDate}
                      onChange={(date) => setFormData({ ...formData, graduationDate: date || "" })}
                      min={formData.birthDate || undefined}
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
                        onClick={handleCreateCertificationType}
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
                    onChange={(e) => setFormData({ ...formData, isLeveled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <FieldLabel htmlFor="isLeveled" className="cursor-pointer m-0">
                    {t("students.leveledStudent")}
                  </FieldLabel>
                </div>

                {formData.isLeveled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Field>
                      <FieldLabel htmlFor="expectedLevel">{t("students.expectedLevel")}</FieldLabel>
                      <Input
                        id="expectedLevel"
                        value={formData.expectedLevel}
                        onChange={(e) => setFormData({ ...formData, expectedLevel: e.target.value })}
                        placeholder={t("students.expectedLevelPlaceholder")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="currentLevel">{t("students.currentLevel")}</FieldLabel>
                      <Input
                        id="currentLevel"
                        value={formData.currentLevel}
                        onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                        placeholder={t("students.currentLevelPlaceholder")}
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Parents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <h3 className="font-medium mb-4">{t("students.parent1")} <span className="text-destructive">*</span></h3>
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
                        onChange={(e) => setFormData({ ...formData, parent1Email: e.target.value })}
                        placeholder={t("students.parentEmailPlaceholder")}
                        className={errors.parent1Email ? "border-destructive" : ""}
                      />
                      {errors.parent1Email && <p className="text-sm text-destructive mt-1">{errors.parent1Email}</p>}
                    </Field>
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
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-4">{t("students.parent2")}</h3>
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
                          onChange={(e) => setFormData({ ...formData, parent2Email: e.target.value })}
                          placeholder={t("students.secondParentEmailPlaceholder")}
                          className={errors.parent2Email ? "border-destructive" : ""}
                        />
                        {errors.parent2Email && <p className="text-sm text-destructive mt-1">{errors.parent2Email}</p>}
                      </Field>
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
                    <div><span className="text-muted-foreground">{t("students.birthDate")}:</span> {formData.birthDate}</div>
                    <div><span className="text-muted-foreground">{t("students.contactPhone")}:</span> {formData.contactPhone || "-"}</div>
                    <div><span className="text-muted-foreground">{t("common.address")}:</span> {formData.address || "-"}</div>
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
                    <div><span className="text-muted-foreground">{t("students.graduationDate")}:</span> {formData.graduationDate}</div>
                    {formData.isLeveled && (
                      <>
                        <div><span className="text-muted-foreground">{t("students.expectedLevel")}:</span> {formData.expectedLevel}</div>
                        <div><span className="text-muted-foreground">{t("students.currentLevel")}:</span> {formData.currentLevel}</div>
                      </>
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
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
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
    </div>
  )
}

