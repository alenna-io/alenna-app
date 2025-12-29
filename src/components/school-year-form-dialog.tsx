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
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Calendar } from "lucide-react"
import type { SchoolYear } from "@/services/api"
import { useTranslation } from "react-i18next"

interface SchoolYearFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolYear?: SchoolYear | null
  existingSchoolYears?: SchoolYear[]
  onSave: (data: {
    name: string
    startDate: string
    endDate: string
    quarters: Array<{
      id?: string
      name: string
      displayName: string
      startDate: string
      endDate: string
      order: number
      weeksCount: number
    }>
  }) => Promise<void>
}

export function SchoolYearFormDialog({
  open,
  onOpenChange,
  schoolYear,
  existingSchoolYears = [],
  onSave,
}: SchoolYearFormDialogProps) {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    quarters?: Array<{ startDate?: string; endDate?: string }>
    schoolYear?: string
  }>({})
  const [formData, setFormData] = React.useState<{
    name: string
    startDate: string
    endDate: string
    quarters: Array<{
      id?: string
      name: string
      displayName: string
      startDate: string
      endDate: string
      order: number
      weeksCount: number
    }>
  }>({
    name: "",
    startDate: "",
    endDate: "",
    quarters: [
      { name: "Q1", displayName: t("monthlyAssignments.quarterLabelQ1"), startDate: "", endDate: "", order: 1, weeksCount: 9 },
      { name: "Q2", displayName: t("monthlyAssignments.quarterLabelQ2"), startDate: "", endDate: "", order: 2, weeksCount: 9 },
      { name: "Q3", displayName: t("monthlyAssignments.quarterLabelQ3"), startDate: "", endDate: "", order: 3, weeksCount: 9 },
      { name: "Q4", displayName: t("monthlyAssignments.quarterLabelQ4"), startDate: "", endDate: "", order: 4, weeksCount: 9 },
    ],
  })

  // Auto-calculate school year dates from quarters
  React.useEffect(() => {
    const sortedQuarters = [...formData.quarters].sort((a, b) => a.order - b.order)
    const firstQuarter = sortedQuarters.find(q => q.startDate && q.startDate.trim() !== "")
    const lastQuarter = sortedQuarters.slice().reverse().find(q => q.endDate && q.endDate.trim() !== "")

    if (firstQuarter?.startDate && lastQuarter?.endDate) {
      setFormData(prev => ({
        ...prev,
        startDate: firstQuarter.startDate,
        endDate: lastQuarter.endDate,
      }))
    } else {
      // Clear dates if quarters are incomplete
      setFormData(prev => ({
        ...prev,
        startDate: "",
        endDate: "",
      }))
    }
  }, [formData.quarters])

  // Initialize form data when dialog opens or schoolYear changes
  React.useEffect(() => {
    if (open) {
      if (schoolYear) {
        // Editing existing school year
        setFormData({
          name: schoolYear.name,
          startDate: schoolYear.startDate.split("T")[0],
          endDate: schoolYear.endDate.split("T")[0],
          quarters: schoolYear.quarters?.map((q, idx) => {
            const quarterLabels = [
              t("monthlyAssignments.quarterLabelQ1"),
              t("monthlyAssignments.quarterLabelQ2"),
              t("monthlyAssignments.quarterLabelQ3"),
              t("monthlyAssignments.quarterLabelQ4"),
            ]
            return {
              id: q.id,
              name: q.name,
              displayName: quarterLabels[idx] || q.displayName,
              startDate: q.startDate.split("T")[0],
              endDate: q.endDate.split("T")[0],
              order: q.order,
              weeksCount: q.weeksCount,
            }
          }) || [],
        })
      } else {
        // Creating new school year - suggest next year
        const latestYear = existingSchoolYears.length > 0
          ? existingSchoolYears.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
          : null

        let suggestedName = ""
        let suggestedStartDate = ""
        let suggestedEndDate = ""
        const quarterLabels = [
          t("monthlyAssignments.quarterLabelQ1"),
          t("monthlyAssignments.quarterLabelQ2"),
          t("monthlyAssignments.quarterLabelQ3"),
          t("monthlyAssignments.quarterLabelQ4"),
        ]
        let suggestedQuarters = [
          { name: "Q1", displayName: quarterLabels[0], startDate: "", endDate: "", order: 1, weeksCount: 9 },
          { name: "Q2", displayName: quarterLabels[1], startDate: "", endDate: "", order: 2, weeksCount: 9 },
          { name: "Q3", displayName: quarterLabels[2], startDate: "", endDate: "", order: 3, weeksCount: 9 },
          { name: "Q4", displayName: quarterLabels[3], startDate: "", endDate: "", order: 4, weeksCount: 9 },
        ]

        if (latestYear) {
          const [startYear] = latestYear.name.split("-").map(Number)
          suggestedName = `${startYear + 1}-${startYear + 2}`

          const prevStartDate = new Date(latestYear.startDate)
          const prevEndDate = new Date(latestYear.endDate)
          suggestedStartDate = new Date(prevStartDate.setFullYear(prevStartDate.getFullYear() + 1)).toISOString().split('T')[0]
          suggestedEndDate = new Date(prevEndDate.setFullYear(prevEndDate.getFullYear() + 1)).toISOString().split('T')[0]

          if (latestYear.quarters) {
            suggestedQuarters = latestYear.quarters.map((q, idx) => {
              const qStart = new Date(q.startDate)
              const qEnd = new Date(q.endDate)
              return {
                name: q.name,
                displayName: quarterLabels[idx] || q.displayName,
                startDate: new Date(qStart.setFullYear(qStart.getFullYear() + 1)).toISOString().split('T')[0],
                endDate: new Date(qEnd.setFullYear(qEnd.getFullYear() + 1)).toISOString().split('T')[0],
                order: q.order,
                weeksCount: q.weeksCount,
              }
            })
          }
        }

        setFormData({
          name: suggestedName,
          startDate: suggestedStartDate,
          endDate: suggestedEndDate,
          quarters: suggestedQuarters,
        })
      }
    }
  }, [open, schoolYear, existingSchoolYears, t])

  const validateForm = (): boolean => {
    const newErrors: {
      quarters?: Array<{ startDate?: string; endDate?: string }>
      schoolYear?: string
    } = {}

    // Validate quarters
    const quarterErrors: Array<{ startDate?: string; endDate?: string }> = []
    let hasQuarterErrors = false

    formData.quarters.forEach((quarter) => {
      const quarterError: { startDate?: string; endDate?: string } = {}

      if (quarter.startDate && quarter.endDate) {
        const startDate = new Date(quarter.startDate)
        const endDate = new Date(quarter.endDate)

        if (startDate >= endDate) {
          quarterError.endDate = "La fecha de fin debe ser posterior a la fecha de inicio"
          hasQuarterErrors = true
        }
      }

      quarterErrors.push(quarterError)
    })

    if (hasQuarterErrors) {
      newErrors.quarters = quarterErrors
    }

    // Validate school year dates (should be auto-calculated from quarters)
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)

      if (startDate >= endDate) {
        newErrors.schoolYear = "La fecha de fin del año escolar debe ser posterior a la fecha de inicio"
      }
    }

    setErrors(newErrors)
    return !hasQuarterErrors && !newErrors.schoolYear
  }

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      // Auto-generate displayName based on current language
      const quartersWithDisplayName = formData.quarters.map((quarter, index) => {
        const quarterLabels = [
          t("monthlyAssignments.quarterLabelQ1"),
          t("monthlyAssignments.quarterLabelQ2"),
          t("monthlyAssignments.quarterLabelQ3"),
          t("monthlyAssignments.quarterLabelQ4"),
        ]
        return {
          ...quarter,
          displayName: quarterLabels[index] || quarter.displayName
        }
      })

      await onSave({
        ...formData,
        quarters: quartersWithDisplayName
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving school year:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {schoolYear ? "Editar Año Escolar" : "Crear Nuevo Año Escolar"}
          </DialogTitle>
          <DialogDescription>
            {schoolYear
              ? "Modifica la configuración del año académico"
              : t("forms.configureNewSchoolYear")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* School Year Basic Info */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full"></div>
              {t("forms.basicInfo")}
            </h3>
            <FieldGroup>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="school-year-name">Nombre del Año Escolar</FieldLabel>
                  <Input
                    id="school-year-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: 2024-2025"
                    className="text-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="school-year-start">
                    Fecha de Inicio
                    <span className="text-xs text-muted-foreground ml-2">(calculada automáticamente)</span>
                  </FieldLabel>
                  <div className="bg-muted rounded-md">
                    <DatePicker
                      value={formData.startDate}
                      onChange={(date) => setFormData({ ...formData, startDate: date })}
                      placeholder="Se calculará del primer trimestre"
                      min="2020-01-01"
                      max="2050-12-31"
                      disabled
                    />
                  </div>
                  {errors.schoolYear && (
                    <p className="text-sm text-red-600 mt-1">{errors.schoolYear}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="school-year-end">
                    Fecha de Fin
                    <span className="text-xs text-muted-foreground ml-2">(calculada automáticamente)</span>
                  </FieldLabel>
                  <div className="bg-muted rounded-md">
                    <DatePicker
                      value={formData.endDate}
                      onChange={(date) => setFormData({ ...formData, endDate: date })}
                      placeholder="Se calculará del último trimestre"
                      min="2020-01-01"
                      max="2050-12-31"
                      disabled
                    />
                  </div>
                </Field>
              </div>
            </FieldGroup>
          </div>

          {/* Quarters */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {t("forms.quartersConfig")}
            </h3>
            <div className="space-y-4">
              {formData.quarters.map((quarter, index) => (
                <div key={quarter.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-green-700">{quarter.order}</span>
                    </div>
                    <h4 className="font-medium text-gray-900">
                      {[
                        t("monthlyAssignments.quarterLabelQ1"),
                        t("monthlyAssignments.quarterLabelQ2"),
                        t("monthlyAssignments.quarterLabelQ3"),
                        t("monthlyAssignments.quarterLabelQ4"),
                      ][index]}
                    </h4>
                  </div>
                  <FieldGroup>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-start`}>Fecha de Inicio</FieldLabel>
                        <DatePicker
                          value={quarter.startDate}
                          onChange={(date) => {
                            const newQuarters = [...formData.quarters]
                            newQuarters[index].startDate = date
                            // Clear end date error when start date changes
                            if (errors.quarters?.[index]) {
                              const newErrors = { ...errors }
                              if (newErrors.quarters) {
                                newErrors.quarters[index] = { ...newErrors.quarters[index], endDate: undefined }
                              }
                              setErrors(newErrors)
                            }
                            setFormData({ ...formData, quarters: newQuarters })
                          }}
                          placeholder="Fecha inicio"
                          min="2020-01-01"
                          max="2050-12-31"
                        />
                        {errors.quarters?.[index]?.startDate && (
                          <p className="text-sm text-red-600 mt-1">{errors.quarters[index].startDate}</p>
                        )}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-end`}>Fecha de Fin</FieldLabel>
                        <DatePicker
                          value={quarter.endDate}
                          onChange={(date) => {
                            const newQuarters = [...formData.quarters]
                            newQuarters[index].endDate = date
                            // Clear error when end date changes
                            if (errors.quarters?.[index]) {
                              const newErrors = { ...errors }
                              if (newErrors.quarters) {
                                newErrors.quarters[index] = { ...newErrors.quarters[index], endDate: undefined }
                              }
                              setErrors(newErrors)
                            }
                            setFormData({ ...formData, quarters: newQuarters })
                          }}
                          placeholder="Fecha fin"
                          min={quarter.startDate || "2020-01-01"}
                          max="2050-12-31"
                        />
                        {errors.quarters?.[index]?.endDate && (
                          <p className="text-sm text-red-600 mt-1">{errors.quarters[index].endDate}</p>
                        )}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`quarter-${index}-weeks`}>Semanas</FieldLabel>
                        <Input
                          id={`quarter-${index}-weeks`}
                          type="number"
                          value={quarter.weeksCount}
                          onChange={(e) => {
                            const newQuarters = [...formData.quarters]
                            newQuarters[index].weeksCount = parseInt(e.target.value) || 9
                            setFormData({ ...formData, quarters: newQuarters })
                          }}
                          placeholder="9"
                          className="text-center"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            {isSaving ? t("common.saving") : schoolYear ? t("common.save") : t("schoolYears.createSchoolYear")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

