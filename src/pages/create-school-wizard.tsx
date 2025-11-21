import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Eye } from "lucide-react"
import { useApi } from "@/services/api"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { useTranslation } from "react-i18next"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type WizardStep = 1 | 2 | 3 | 4

export default function CreateSchoolWizardPage() {
  const navigate = useNavigate()
  const api = useApi()
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<{
    name?: string
    address?: string
    phone?: string
    teacherLimit?: string
    userLimit?: string
    adminEmail?: string
  }>({})

  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    phone: "",
    teacherLimit: "",
    userLimit: "",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
  })

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: typeof errors = {}

    if (step === 1) {
      // Validate school information - all fields are required
      if (!formData.name.trim()) {
        newErrors.name = t("schools.nameRequiredError")
      }
      if (!formData.address.trim()) {
        newErrors.address = t("schools.addressRequiredError")
      }
      if (!formData.phone.trim()) {
        newErrors.phone = t("schools.phoneRequiredError")
      }
    }

    if (step === 2) {
      // Validate limits - both are required
      if (!formData.teacherLimit.trim()) {
        newErrors.teacherLimit = t("schools.teacherLimitRequiredError")
      } else {
        const limit = parseInt(formData.teacherLimit, 10)
        if (isNaN(limit) || limit <= 0) {
          newErrors.teacherLimit = t("forms.teacherLimitError")
        }
      }
      if (!formData.userLimit.trim()) {
        newErrors.userLimit = t("schools.userLimitRequiredError")
      } else {
        const limit = parseInt(formData.userLimit, 10)
        if (isNaN(limit) || limit <= 0) {
          newErrors.userLimit = t("forms.userLimitError")
        }
      }
    }

    if (step === 3) {
      // Validate admin user
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = t("schools.invalidEmailError")
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        newErrors.adminEmail = t("schools.invalidEmailError")
      }
      if (!formData.adminFirstName.trim()) {
        // First name is required but we'll use the email error as a general validation
      }
      if (!formData.adminLastName.trim()) {
        // Last name is required
      }
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
      setError(null)
      setErrors({}) // Clear errors when moving to next step
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      setError(null)
    }
  }

  const handleCreate = async () => {
    // Validate all steps before creating
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      // Go to the first step with errors
      if (!validateStep(1)) {
        setCurrentStep(1)
      } else if (!validateStep(2)) {
        setCurrentStep(2)
      } else {
        setCurrentStep(3)
      }
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Create school first - all fields are now required
      const schoolData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.adminEmail.trim(), // Use admin email as school email
        teacherLimit: parseInt(formData.teacherLimit, 10),
        userLimit: parseInt(formData.userLimit, 10),
        adminEmail: formData.adminEmail.trim(),
        adminFirstName: formData.adminFirstName.trim(),
        adminLastName: formData.adminLastName.trim(),
      }

      const createdSchool = await api.schools.create(schoolData)

      // Create admin user if school was created successfully
      if (createdSchool?.id && schoolData.adminEmail && schoolData.adminFirstName && schoolData.adminLastName) {
        try {
          const roles = await api.getAvailableRoles()
          const schoolAdminRole = roles.find((role: { name: string }) => role.name === 'SCHOOL_ADMIN')

          if (schoolAdminRole) {
            await api.createUser({
              email: schoolData.adminEmail,
              firstName: schoolData.adminFirstName,
              lastName: schoolData.adminLastName,
              schoolId: createdSchool.id,
              roleIds: [schoolAdminRole.id],
              // Clerk ID will be created automatically by the backend
            })
          }
        } catch (userError) {
          console.error('Error creating school admin user:', userError)
          toast.error(t("schools.createError"))
          // Don't fail the whole operation if user creation fails
        }
      }

      toast.success(t("schools.createSchoolSuccess", { schoolName: formData.name }))
      navigate("/schools")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("schools.createError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const steps = [
    { number: 1, title: t("schools.wizard.step1Title"), description: t("schools.wizard.step1Description") },
    { number: 2, title: t("schools.wizard.step2Title"), description: t("schools.wizard.step2Description") },
    { number: 3, title: t("schools.wizard.step3Title"), description: t("schools.wizard.step3Description") },
    { number: 4, title: t("schools.wizard.step4Title"), description: t("schools.wizard.step4Description") },
  ]

  return (
    <div className="min-h-screen">
      <div className="w-full p-3 space-y-6">
        <BackButton to="/schools">{t("schools.wizard.backToSchools")}</BackButton>

        <PageHeader
          title={t("schools.wizard.title")}
          description={t("schools.wizard.description")}
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
                    <div
                      className={`text-sm font-medium ${currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                        }`}
                    >
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
          <Alert variant="destructive" className="mb-6 bg-red-50 text-red-900 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="mb-6 bg-white rounded-lg shadow-sm">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("schools.wizard.schoolInfo")}</h3>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">
                        {t("schools.schoolName")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (errors.name) setErrors({ ...errors, name: undefined })
                        }}
                        placeholder={t("schools.schoolNamePlaceholder")}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.name}</span>
                        </div>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="address">
                        {t("schools.address")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({ ...formData, address: e.target.value })
                          if (errors.address) setErrors({ ...errors, address: undefined })
                        }}
                        placeholder={t("schools.addressPlaceholder")}
                        className={errors.address ? "border-destructive" : ""}
                      />
                      {errors.address && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.address}</span>
                        </div>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="phone">
                        {t("schools.phone")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value })
                          if (errors.phone) setErrors({ ...errors, phone: undefined })
                        }}
                        placeholder={t("schools.phonePlaceholder")}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("schools.wizard.limitsInfo")}</h3>
                  <FieldGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="teacherLimit">
                          {t("forms.teacherLimit")} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="teacherLimit"
                          type="number"
                          min="1"
                          value={formData.teacherLimit}
                          onChange={(e) => {
                            setFormData({ ...formData, teacherLimit: e.target.value })
                            if (errors.teacherLimit) setErrors({ ...errors, teacherLimit: undefined })
                          }}
                          placeholder={t("schools.teacherLimitPlaceholder")}
                          className={errors.teacherLimit ? "border-destructive" : ""}
                        />
                        {errors.teacherLimit && (
                          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.teacherLimit}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("forms.teacherLimitDescription")}
                        </p>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="userLimit">
                          {t("forms.userLimit")} <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="userLimit"
                          type="number"
                          min="1"
                          value={formData.userLimit}
                          onChange={(e) => {
                            setFormData({ ...formData, userLimit: e.target.value })
                            if (errors.userLimit) setErrors({ ...errors, userLimit: undefined })
                          }}
                          placeholder={t("schools.userLimitPlaceholder")}
                          className={errors.userLimit ? "border-destructive" : ""}
                        />
                        {errors.userLimit && (
                          <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.userLimit}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("forms.userLimitDescription")}
                        </p>
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t("schools.adminUser")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("schools.wizard.adminUserDescription")}
                  </p>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="adminFirstName">
                        {t("users.firstName")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="adminFirstName"
                        value={formData.adminFirstName}
                        onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                        placeholder={t("forms.adminFirstNamePlaceholder")}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="adminLastName">
                        {t("users.lastName")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="adminLastName"
                        value={formData.adminLastName}
                        onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                        placeholder={t("forms.adminLastNamePlaceholder")}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="adminEmail">
                        {t("users.email")} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => {
                          setFormData({ ...formData, adminEmail: e.target.value })
                          if (errors.adminEmail) setErrors({ ...errors, adminEmail: undefined })
                        }}
                        placeholder={t("forms.adminEmailPlaceholder")}
                        className={errors.adminEmail ? "border-destructive" : ""}
                      />
                      {errors.adminEmail && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.adminEmail}</span>
                        </div>
                      )}
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t("schools.wizard.previewTitle")}
                </h3>

                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">{t("schools.wizard.schoolInfo")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">{t("schools.schoolName")}</Label>
                        <p className="font-medium">{formData.name || t("common.noSelection")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("schools.address")}</Label>
                        <p className="font-medium">{formData.address || t("common.noSelection")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("schools.phone")}</Label>
                        <p className="font-medium">{formData.phone || t("common.noSelection")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">{t("schools.wizard.limitsInfo")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">{t("forms.teacherLimit")}</Label>
                        <p className="font-medium">{formData.teacherLimit || t("common.noSelection")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("forms.userLimit")}</Label>
                        <p className="font-medium">{formData.userLimit || t("common.noSelection")}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">{t("schools.adminUser")}</h4>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">{t("users.firstName")}</Label>
                        <p className="font-medium">{formData.adminFirstName || t("common.noSelection")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("users.lastName")}</Label>
                        <p className="font-medium">{formData.adminLastName || t("common.noSelection")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("users.email")}</Label>
                        <p className="font-medium">{formData.adminEmail || t("common.noSelection")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => navigate("/schools") : handleBack}
            disabled={isCreating}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? t("common.cancel") : t("common.previous")}
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={isCreating}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isCreating || !formData.name.trim() || !formData.address.trim() || !formData.phone.trim() || !formData.teacherLimit.trim() || !formData.userLimit.trim() || !formData.adminEmail.trim()}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isCreating ? t("common.saving") : t("schools.wizard.createSchool")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

