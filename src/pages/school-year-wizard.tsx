import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { Loading } from "@/components/ui/loading"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { useApi } from "@/services/api"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface HolidayFormRange {
  id: string
  startDate: string
  endDate: string
  label: string
}

interface PreviewWeek {
  weekNumber: number
  startDate: string
  endDate: string
}

interface QuarterForm {
  name: string
  displayName: string
  startDate: string
  endDate: string
  order: number
  weeksCount: number
  holidays: HolidayFormRange[]
  previewWeeks: PreviewWeek[]
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

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

export default function SchoolYearWizardPage() {
  const navigate = useNavigate()
  const { schoolYearId } = useParams()
  const api = useApi()
  const { t, i18n } = useTranslation()

  const [loading, setLoading] = React.useState(!!schoolYearId)
  const [saving, setSaving] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [error, setError] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState<{
    name: string
    quarters: QuarterForm[]
  }>(() => {
    const defaultDisplayNames = [
      t("monthlyAssignments.quarterLabelQ1"),
      t("monthlyAssignments.quarterLabelQ2"),
      t("monthlyAssignments.quarterLabelQ3"),
      t("monthlyAssignments.quarterLabelQ4"),
    ]
    return {
      name: "",
      quarters: [1, 2, 3, 4].map((order) => ({
        name: `Q${order}`,
        displayName: defaultDisplayNames[order - 1] || `Q${order}`,
        startDate: "",
        endDate: "",
        order,
        weeksCount: 9,
        holidays: [],
        previewWeeks: [],
      })),
    }
  })

  const [holidayDraft, setHolidayDraft] = React.useState<{
    startDate: string
    endDate: string
    label: string
  }>({ startDate: "", endDate: "", label: "" })

  const [holidayRange, setHolidayRange] = React.useState<DateRange | undefined>(undefined)

  // Helper to reset holiday draft
  const resetHolidayDraft = () => {
    setHolidayDraft({ startDate: "", endDate: "", label: "" })
    setHolidayRange(undefined)
  }

  React.useEffect(() => {
    async function fetchSchoolYear() {
      if (!schoolYearId) {
        setLoading(false)
        return
      }
      try {
        // Try to get by ID directly, or find in list if getById not exposed
        // Assuming getById exists or we fall back to list
        let yearData: any = null
        try {
          yearData = await api.schoolYears.getById(schoolYearId)
        } catch {
          // Fallback if getById fails or doesn't exist
          const all = await api.schoolYears.getAll()
          yearData = all.find((y: any) => y.id === schoolYearId)
        }

        if (!yearData) {
          toast.error("School year not found")
          navigate("/school-settings/school-years")
          return
        }

        // Map to form data
        setFormData({
          name: yearData.name,
          quarters: (yearData.quarters || []).map((q: any) => ({
            name: q.name,
            displayName: q.displayName,
            startDate: q.startDate.split("T")[0],
            endDate: q.endDate.split("T")[0],
            order: q.order,
            weeksCount: q.weeksCount,
            holidays: (q.holidays || []).map((h: any) => ({
              id: h.id,
              startDate: h.startDate.split("T")[0],
              endDate: h.endDate.split("T")[0],
              label: h.label || "",
            })),
            previewWeeks: (q.weeks || []).map((w: any) => ({
              weekNumber: w.weekNumber,
              startDate: w.startDate.split("T")[0],
              endDate: w.endDate.split("T")[0],
            })).sort((a: any, b: any) => a.weekNumber - b.weekNumber),
          })),
        })
      } catch (err) {
        console.error("Error fetching school year", err)
        toast.error("Error loading school year")
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolYear()
  }, [schoolYearId, api, navigate])

  const steps = [
    { number: 1, title: t("schoolYears.wizardStepYearTitle", "Año escolar"), description: t("schoolYears.wizardStepYearDesc", "Nombre e información general") },
    { number: 2, title: t("schoolYears.wizardStepQ1Title", "Trimestre 1"), description: t("schoolYears.wizardStepQuarterDesc", "Configura semanas y vacaciones") },
    { number: 3, title: t("schoolYears.wizardStepQ2Title", "Trimestre 2"), description: t("schoolYears.wizardStepQuarterDesc", "Configura semanas y vacaciones") },
    { number: 4, title: t("schoolYears.wizardStepQ3Title", "Trimestre 3"), description: t("schoolYears.wizardStepQuarterDesc", "Configura semanas y vacaciones") },
    { number: 5, title: t("schoolYears.wizardStepQ4Title", "Trimestre 4"), description: t("schoolYears.wizardStepQuarterDesc", "Configura semanas y vacaciones") },
    { number: 6, title: t("schoolYears.wizardStepSummaryTitle", "Resumen"), description: t("schoolYears.wizardStepSummaryDesc", "Revisa y crea el año escolar") },
  ]

  function updateQuarter(index: number, updater: (q: QuarterForm) => QuarterForm) {
    setFormData((prev) => ({
      ...prev,
      quarters: prev.quarters.map((q, i) => (i === index ? updater(q) : q)),
    }))
  }

  // Helper function to add days to a date string
  function addDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  // Helper function to get day of week from YYYY-MM-DD string (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  function getDayOfWeek(dateString: string): number {
    const date = new Date(dateString + 'T00:00:00')
    return date.getDay()
  }

  // Helper function to adjust subsequent weeks after a date change
  function adjustSubsequentWeeks(weeks: PreviewWeek[], changedWeekIndex: number, isStartDate: boolean, holidays: HolidayFormRange[], quarterEndDate?: string): PreviewWeek[] {
    const newWeeks = [...weeks]
    const changedWeek = newWeeks[changedWeekIndex]
    const quarterEnd = quarterEndDate ? new Date(`${quarterEndDate}T00:00:00`) : null

    if (isStartDate) {
      // If start date changed, update previous week's end date to be one day before
      // Note: This reverse adjustment doesn't currently account for holidays between weeks in reverse
      if (changedWeekIndex > 0) {
        let prevEndDate = addDays(changedWeek.startDate, -1)

        // Check if prevEndDate falls in a holiday
        if (holidays && holidays.length > 0) {
          let overlapFound = true
          while (overlapFound) {
            overlapFound = false
            const checkDate = new Date(`${prevEndDate}T00:00:00`)
            for (const h of holidays) {
              const hStart = new Date(`${h.startDate}T00:00:00`)
              const hEnd = new Date(`${h.endDate}T00:00:00`)
              if (checkDate >= hStart && checkDate <= hEnd) {
                // If it lands in a holiday, move before the holiday starts
                prevEndDate = addDays(h.startDate, -1)
                overlapFound = true
                break
              }
            }
          }
        }

        newWeeks[changedWeekIndex - 1] = {
          ...newWeeks[changedWeekIndex - 1],
          endDate: prevEndDate,
        }
      }
    } else {
      // If end date changed, cascade the change through all subsequent weeks
      for (let i = changedWeekIndex; i < newWeeks.length - 1; i++) {
        const currentWeek = newWeeks[i]
        const nextWeek = newWeeks[i + 1]

        // Calculate the next week's start date (one day after current week ends)
        let nextStartDate = addDays(currentWeek.endDate, 1)

        // Find first valid Monday (skipping holidays and weekends)
        let findingStart = true
        while (findingStart) {
          findingStart = false

          // First, skip holidays
          if (holidays && holidays.length > 0) {
            const checkDate = new Date(`${nextStartDate}T00:00:00`)
            for (const h of holidays) {
              const hStart = new Date(`${h.startDate}T00:00:00`)
              const hEnd = new Date(`${h.endDate}T00:00:00`)
              if (checkDate >= hStart && checkDate <= hEnd) {
                // Skip to the day after the holiday ends
                nextStartDate = addDays(h.endDate, 1)
                findingStart = true
                break
              }
            }
          }

          // If we just skipped a holiday, check again from the new position
          if (findingStart) continue

          // Now ensure we're on a Monday (always start weeks on Monday)
          const dayOfWeek = getDayOfWeek(nextStartDate) // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

          if (dayOfWeek !== 1) {
            // Not Monday - move to the next Monday
            if (dayOfWeek === 0) {
              // Sunday - move to next day (Monday)
              nextStartDate = addDays(nextStartDate, 1)
            } else {
              // Any other weekday - move to next Monday
              const daysUntilMonday = (8 - dayOfWeek) % 7
              nextStartDate = addDays(nextStartDate, daysUntilMonday)
            }
            findingStart = true
          }

          // After adjusting to Monday, we might have landed in a holiday
          // So we need to check again (the loop will continue)
        }

        // Ensure the start date doesn't exceed quarter end
        if (quarterEnd) {
          const nextStartDateObj = new Date(`${nextStartDate}T00:00:00`)
          if (nextStartDateObj > quarterEnd) {
            // Don't create weeks beyond the quarter end
            newWeeks.splice(i + 1)
            break
          }
        }

        // Calculate end date: always end on the Sunday of the week containing the start date
        // If start is Monday, end is Sunday (6 days later)
        // If start is Tuesday, end is Sunday (5 days later), etc.
        const startDayOfWeek = getDayOfWeek(nextStartDate)
        const daysToSunday = startDayOfWeek === 0 ? 0 : (7 - startDayOfWeek) // 0=Sun, 1=Mon, 6=Sat
        let nextEndDate = addDays(nextStartDate, daysToSunday)

        // Trim end date if it falls in a holiday
        if (holidays && holidays.length > 0) {
          let overlapFound = true
          while (overlapFound) {
            overlapFound = false
            // We check if the computed end date falls inside a holiday
            // If so, we snap to the day before that holiday starts.
            const checkDate = new Date(`${nextEndDate}T00:00:00`)
            for (const h of holidays) {
              const hStart = new Date(`${h.startDate}T00:00:00`)
              const hEnd = new Date(`${h.endDate}T00:00:00`)
              if (checkDate >= hStart && checkDate <= hEnd) {
                // If it lands in a holiday, move before the holiday starts
                nextEndDate = addDays(h.startDate, -1)
                overlapFound = true
                break
              }
            }

            // Also ensure we didn't move start > end (e.g. week completely inside holiday)
            // If so, nextStartDate needs to move? 
            // But nextStartDate was already adjusted to NOT start in a holiday.
            // So if nextEndDate moves back before nextStartDate, it means the duration fits entirely in a holiday gap?
            // Or we just have a 1-day week or invalid week.
            if (new Date(nextEndDate) < new Date(nextStartDate)) {
              // If trimming makes it invalid, we effectively have to skip this holiday entirely?
              // But nextStartDate logic should have handled "starting" after holiday.
              // If nextStartDate is valid (not holiday), and nextEndDate (by duration) hits a holiday, 
              // trimming back is correct. It just becomes a shorter week.
              // Unless nextStartDate was effectively "just before" a holiday?
              // E.g. Start Mon. Holiday starts Tue. End date was Fri.
              // Trim end to Mon. Week is Mon-Mon (1 day). Correct.
            }
          }
        }

        // Ensure the end date doesn't exceed quarter end
        if (quarterEnd) {
          const nextEndDateObj = new Date(`${nextEndDate}T00:00:00`)
          if (nextEndDateObj > quarterEnd) {
            // Cap the end date at the quarter end
            nextEndDate = quarterEndDate!
          }
        }

        // Update the next week
        newWeeks[i + 1] = {
          ...nextWeek,
          startDate: nextStartDate,
          endDate: nextEndDate,
        }

        // If this week's end date is at the quarter end, stop adjusting further weeks
        if (quarterEnd && nextEndDate === quarterEndDate) {
          // Remove any weeks that would come after this one (they would be beyond quarter end)
          newWeeks.splice(i + 2)
          break
        }
      }

      // Ensure the last week doesn't exceed quarter end
      if (quarterEnd && newWeeks.length > 0) {
        const lastWeek = newWeeks[newWeeks.length - 1]
        const lastWeekEnd = new Date(`${lastWeek.endDate}T00:00:00`)
        if (lastWeekEnd > quarterEnd) {
          lastWeek.endDate = quarterEndDate!
        }
      }
    }

    return newWeeks
  }

  async function handlePreviewWeeks(index: number, quarterOverride?: QuarterForm) {
    const q = quarterOverride ?? formData.quarters[index]
    if (!q || !q.startDate || !q.endDate || !q.weeksCount) {
      return
    }
    try {
      const weeks = (await api.schoolYears.previewWeeks({
        startDate: q.startDate,
        endDate: q.endDate,
        weeksCount: q.weeksCount,
        holidays: q.holidays.map((h) => ({ startDate: h.startDate, endDate: h.endDate, label: h.label || undefined })),
      })) as PreviewWeek[]
      updateQuarter(index, (old) => ({ ...old, previewWeeks: weeks }))
    } catch (err) {
      console.error("Error previewing weeks", err)
      toast.error(t("schoolYears.errorPreviewWeeks", "Error al previsualizar semanas"))
    }
  }

  function validateStep(step: WizardStep): boolean {
    const newErrors: Record<string, string> = {}
    setError(null)

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = t("schoolYears.errorNameRequired", "El nombre del año escolar es obligatorio")
      }
    } else if (step >= 2 && step <= 5) {
      const idx = step - 2
      if (idx >= 0 && idx < formData.quarters.length) {
        const q = formData.quarters[idx]
        const prefix = `q${idx}`

        if (!q.startDate || !q.endDate) {
          newErrors[`${prefix}.startDate`] = t(
            "schoolYears.errorQuarterDates",
            "Debes definir las fechas de inicio y fin del trimestre"
          )
          newErrors[`${prefix}.endDate`] = newErrors[`${prefix}.startDate`]
        } else {
          const start = new Date(`${q.startDate}T00:00:00`)
          const end = new Date(`${q.endDate}T00:00:00`)
          if (start >= end) {
            newErrors[`${prefix}.endDate`] = t(
              "schoolYears.errorQuarterRange",
              "La fecha de fin debe ser posterior a la de inicio"
            )
          }

          // Check for overlaps with other quarters
          const otherQuarters = formData.quarters.filter((_, i) => i !== idx)
          for (const other of otherQuarters) {
            if (other.startDate && other.endDate) {
              const otherStart = new Date(`${other.startDate}T00:00:00`)
              const otherEnd = new Date(`${other.endDate}T00:00:00`)

              // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
              if (start <= otherEnd && end >= otherStart) {
                const overlapMsg = t(
                  "schoolYears.errorOverlap",
                  "Las fechas se superponen con otro trimestre ({{q}})",
                  { q: other.displayName }
                )
                newErrors[`${prefix}.startDate`] = overlapMsg
                newErrors[`${prefix}.endDate`] = overlapMsg
                break // Stop checking others if one overlap found
              }
            }
          }
        }

        if (!q.weeksCount || q.weeksCount < 1) {
          newErrors[`${prefix}.weeksCount`] = t(
            "schoolYears.errorWeeksCount",
            "Debes definir al menos 1 semana"
          )
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleNext() {
    if (!validateStep(currentStep)) return

    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      setError(null)
      setErrors({})
      window.scrollTo(0, 0)
    }
  }

  function computeYearDates() {
    const withDates = formData.quarters.filter((q) => q.startDate && q.endDate)
    if (withDates.length === 0) return { startDate: "", endDate: "" }
    const startDate = withDates.reduce((min, q) => (q.startDate < min ? q.startDate : min), withDates[0].startDate)
    const endDate = withDates.reduce((max, q) => (q.endDate > max ? q.endDate : max), withDates[0].endDate)
    return { startDate, endDate }
  }

  async function handleCreate() {
    // Validate all steps: 1 (year) + 2-5 (quarters)
    const stepsToValidate: WizardStep[] = [1, 2, 3, 4, 5]
    let firstInvalid: WizardStep | null = null
    for (const s of stepsToValidate) {
      if (!validateStep(s) && firstInvalid === null) {
        firstInvalid = s
      }
    }
    if (firstInvalid !== null) {
      setCurrentStep(firstInvalid)
      return
    }

    const { startDate, endDate } = computeYearDates()
    if (!startDate || !endDate) {
      setError(t("schoolYears.errorYearDates", "Debes definir las fechas de todos los trimestres"))
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        startDate,
        endDate,
        isActive: false, // Keep existing status? Assuming inactive for new/edit via wizard usually
        quarters: formData.quarters.map((q) => ({
          name: q.name,
          displayName: q.displayName,
          startDate: q.startDate,
          endDate: q.endDate,
          order: q.order,
          weeksCount: q.weeksCount,
          holidays: q.holidays.map((h) => ({ startDate: h.startDate, endDate: h.endDate, label: h.label || undefined })),
          weeks: q.previewWeeks.map((w) => {
            // Ensure dates are in ISO format (YYYY-MM-DD or ISO string)
            const startDate = w.startDate.includes('T') ? w.startDate : `${w.startDate}T00:00:00.000Z`
            const endDate = w.endDate.includes('T') ? w.endDate : `${w.endDate}T00:00:00.000Z`
            return {
              weekNumber: w.weekNumber,
              startDate,
              endDate,
            }
          }),
        })),
      }

      if (schoolYearId) {
        await api.schoolYears.update(schoolYearId, payload)
        toast.success(t("schoolYears.updatedSuccess", "Año escolar actualizado correctamente"))
      } else {
        await api.schoolYears.create(payload)
        toast.success(t("schoolYears.createdSuccess", "Año escolar creado correctamente"))
      }
      navigate("/school-settings/school-years")
    } catch (err: any) {
      console.error("Error creating school year", err)
      const message = err instanceof Error ? err.message : t("schoolYears.errorSaving", "Error al guardar el año escolar")
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function renderYearStep() {
    return (
      <Card className="mb-6 bg-white rounded-lg shadow-sm border">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {t("schoolYears.basicInfo")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("schoolYears.basicInfoDesc", "Ingresa el nombre del año escolar")}
                </p>
              </div>
            </div>
            <div className="max-w-md">
              <Label htmlFor="year-name" className="text-sm font-medium mb-2 block">
                {t("schoolYears.nameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="year-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t("schoolYears.namePlaceholder")}
                className={cn(
                  "h-11",
                  errors.name && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderQuarterStep(index: number) {
    const q = formData.quarters[index]
    const isLastQuarter = index === 3
    const prefix = `q${index}`

    const handleAddHoliday = () => {
      if (!holidayDraft.startDate || !holidayDraft.endDate) {
        toast.error(t("schoolYears.errorHolidayDates", "Debes seleccionar un rango de fechas"))
        return
      }
      if (!holidayDraft.label || !holidayDraft.label.trim()) {
        toast.error(t("schoolYears.errorHolidayLabel", "El nombre de la vacación es obligatorio"))
        return
      }
      const nextQuarter: QuarterForm = {
        ...q,
        holidays: [
          ...q.holidays,
          {
            id: `${Date.now()}-${q.holidays.length}`,
            startDate: holidayDraft.startDate,
            endDate: holidayDraft.endDate,
            label: holidayDraft.label.trim(),
          },
        ],
      }
      updateQuarter(index, () => nextQuarter)
      resetHolidayDraft()
      handlePreviewWeeks(index, nextQuarter)
    }

    const handleRemoveHoliday = (id: string) => {
      const nextQuarter: QuarterForm = {
        ...q,
        holidays: q.holidays.filter((h) => h.id !== id),
      }
      updateQuarter(index, () => nextQuarter)
      handlePreviewWeeks(index, nextQuarter)
    }

    return (
      <Card className="mb-6 bg-white rounded-lg shadow-sm border">
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{q.order}</span>
            </div>
            <div>
              <div className="font-semibold">{q.displayName}</div>
              <div className="text-xs text-muted-foreground font-normal mt-0.5">
                {t("schoolYears.wizardStepQuarterDesc")}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("schoolYears.quarterStart")}
              </Label>
              <SingleDatePicker
                value={q.startDate}
                onChange={(date) => {
                  const nextQuarter: QuarterForm = { ...q, startDate: date }
                  updateQuarter(index, () => nextQuarter)
                  handlePreviewWeeks(index, nextQuarter)
                }}
                placeholder={t("schoolYears.selectDate")}
                min="2020-01-01"
                max="2100-12-31"
                hasError={!!errors[`${prefix}.startDate`]}
              />
              {errors[`${prefix}.startDate`] && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors[`${prefix}.startDate`]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("schoolYears.quarterEnd")}
              </Label>
              <SingleDatePicker
                value={q.endDate}
                onChange={(date) => {
                  const nextQuarter: QuarterForm = { ...q, endDate: date }
                  updateQuarter(index, () => nextQuarter)
                  handlePreviewWeeks(index, nextQuarter)
                }}
                placeholder={t("schoolYears.selectDate")}
                min={q.startDate || "2020-01-01"}
                max="2100-12-31"
                hasError={!!errors[`${prefix}.endDate`]}
              />
              {errors[`${prefix}.endDate`] && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors[`${prefix}.endDate`]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("schoolYears.weeksCount")}
              </Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={q.weeksCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  const nextQuarter: QuarterForm = {
                    ...q,
                    weeksCount: Number.isNaN(value) ? 9 : value,
                  }
                  updateQuarter(index, () => nextQuarter)
                  handlePreviewWeeks(index, nextQuarter)
                }}
                className={cn(
                  "h-11",
                  errors[`${prefix}.weeksCount`] && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors[`${prefix}.weeksCount`] && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors[`${prefix}.weeksCount`]}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                {t("schoolYears.weeksHint")}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Label className="font-semibold text-lg">
                {t("schoolYears.holidays")}
              </Label>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("schoolYears.holidayLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={holidayDraft.label}
                  onChange={(e) => setHolidayDraft((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder={t("schoolYears.holidayPlaceholder")}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("schoolYears.holidayRange")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !holidayRange && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {holidayRange?.from && holidayRange?.to
                        ? `${format(holidayRange.from, "yyyy-MM-dd")} - ${format(holidayRange.to, "yyyy-MM-dd")}`
                        : t("schoolYears.holidayRangePlaceholder")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <ShadcnCalendar
                      mode="range"
                      captionLayout="dropdown"
                      selected={holidayRange}
                      locale={i18n.language === 'es' ? es : enUS}
                      onSelect={(range) => {
                        setHolidayRange(range || undefined)
                        if (!range) {
                          setHolidayDraft((prev) => ({ ...prev, startDate: "", endDate: "" }))
                          return
                        }
                        const from = range.from ? format(range.from, "yyyy-MM-dd") : ""
                        const to = range.to ? format(range.to, "yyyy-MM-dd") : from
                        setHolidayDraft((prev) => ({ ...prev, startDate: from, endDate: to }))
                      }}
                      defaultMonth={q.startDate ? new Date(`${q.startDate}T00:00:00`) : undefined}
                      disabled={(date) => {
                        if (!q.startDate || !q.endDate) return false
                        const minDate = new Date(`${q.startDate}T00:00:00`)
                        const maxDate = new Date(`${q.endDate}T00:00:00`)
                        return date < minDate || date > maxDate
                      }}
                      fromYear={1900}
                      toYear={2100}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                type="button"
                onClick={handleAddHoliday}
                className="w-full"
                disabled={!holidayDraft.startDate || !holidayDraft.endDate}
              >
                {t("common.add")}
              </Button>
            </div>

            {q.holidays.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("schoolYears.holidaysList", "Vacaciones agregadas")} ({q.holidays.length})
                </Label>
                <div className="border rounded-md divide-y bg-background">
                  {q.holidays.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{h.label || t("schoolYears.holiday")}</span>
                        <span className="ml-3 text-xs text-muted-foreground">
                          {h.startDate} - {h.endDate}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHoliday(h.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {t("common.remove")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Label className="font-semibold text-lg">
                {t("schoolYears.weeksPreview")}
              </Label>
            </div>
            {q.previewWeeks.length === 0 ? (
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {t("schoolYears.previewHint")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t("schoolYears.customizeWeekDates")}
                </p>
                <div className="border rounded-lg divide-y bg-background shadow-sm">
                  {q.previewWeeks.map((w, wIndex) => {
                    const weekStartDate = w.startDate.includes('T') ? w.startDate.split("T")[0] : w.startDate
                    const weekEndDate = w.endDate.includes('T') ? w.endDate.split("T")[0] : w.endDate
                    return (
                      <div key={w.weekNumber} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors gap-4">
                        <span className="font-semibold w-28 shrink-0 text-sm text-foreground">
                          {t("schoolYears.weekLabel", { n: w.weekNumber })}
                        </span>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <SingleDatePicker
                              value={weekStartDate}
                              onChange={(date) => {
                                if (!date) return
                                const newWeeks = [...q.previewWeeks]
                                newWeeks[wIndex] = {
                                  ...newWeeks[wIndex],
                                  startDate: date
                                }
                                // Ensure start date is before end date
                                if (new Date(date) > new Date(newWeeks[wIndex].endDate)) {
                                  newWeeks[wIndex].endDate = addDays(date, 6) // Default to 7-day week
                                }
                                // Adjust subsequent weeks
                                const adjustedWeeks = adjustSubsequentWeeks(newWeeks, wIndex, true, q.holidays, q.endDate)
                                updateQuarter(index, (old) => ({ ...old, previewWeeks: adjustedWeeks }))
                              }}
                              placeholder={t("schoolYears.startDate")}
                              min={q.startDate}
                              max={q.endDate}
                            />
                          </div>
                          <span className="text-muted-foreground shrink-0">-</span>
                          <div className="flex-1">
                            <SingleDatePicker
                              value={weekEndDate}
                              onChange={(date) => {
                                if (!date) return
                                const newWeeks = [...q.previewWeeks]
                                newWeeks[wIndex] = {
                                  ...newWeeks[wIndex],
                                  endDate: date
                                }
                                // Ensure end date is after start date
                                if (new Date(date) < new Date(newWeeks[wIndex].startDate)) {
                                  newWeeks[wIndex].startDate = addDays(date, -6) // Default to 7-day week
                                }
                                // Adjust subsequent weeks
                                const adjustedWeeks = adjustSubsequentWeeks(newWeeks, wIndex, false, q.holidays, q.endDate)
                                updateQuarter(index, (old) => ({ ...old, previewWeeks: adjustedWeeks }))
                              }}
                              placeholder={t("schoolYears.endDate")}
                              min={weekStartDate || q.startDate}
                              max={q.endDate}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-blue-900 bg-blue-50 p-3 rounded-md border border-blue-200">
                  {t("schoolYears.previewDescription")}
                </p>
              </div>
            )}
          </div>

          {isLastQuarter && (
            <div className="pt-6 border-t mt-6">
              <div className="bg-blue-50 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {t("schoolYears.summaryHint")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card >
    )
  }

  function renderSummaryStep() {
    const { startDate, endDate } = computeYearDates()
    return (
      <Card className="mb-6 bg-white rounded-lg shadow-sm border">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3 text-center pb-6 border-b">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold">
              {t("schoolYears.summaryTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("schoolYears.summarySubtitle", "Revisa toda la información antes de confirmar")}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("schoolYears.nameLabel")}
                </Label>
                <p className="text-lg font-semibold text-foreground">{formData.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("schoolYears.startDate")}
                </Label>
                <p className="text-lg font-semibold text-foreground">{startDate}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("schoolYears.endDate")}
                </Label>
                <p className="text-lg font-semibold text-foreground">{endDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">
              {t("schoolYears.quartersSummary", "Resumen de trimestres")}
            </Label>
            <div className="space-y-3">
              {formData.quarters.map((q) => (
                <div key={q.order} className="border rounded-lg p-5 bg-background hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{q.order}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-base">
                          {q.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {q.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {q.startDate} - {q.endDate}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        {t("schoolYears.weeksLabel", { n: q.weeksCount })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        {t("schoolYears.holidaysCount", { n: q.holidays.length })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-muted-foreground">
                        {t("schoolYears.previewWeeksCount", { n: q.previewWeeks.length })}
                      </span>
                    </div>
                  </div>

                  {q.holidays.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("schoolYears.holidays")}
                      </Label>
                      <div className="space-y-1.5">
                        {q.holidays.map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                            <span className="font-medium">{h.label || t("schoolYears.holiday")}</span>
                            <span className="text-muted-foreground text-xs">
                              {h.startDate} - {h.endDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.previewWeeks.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("schoolYears.weeksPreview")}
                      </Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md divide-y bg-muted/20">
                        {q.previewWeeks.map((w) => {
                          const weekStartDate = w.startDate.includes('T') ? w.startDate.split("T")[0] : w.startDate
                          const weekEndDate = w.endDate.includes('T') ? w.endDate.split("T")[0] : w.endDate
                          return (
                            <div key={w.weekNumber} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors">
                              <span className="font-medium text-sm w-24 shrink-0">
                                {t("schoolYears.weekLabel", { n: w.weekNumber })}
                              </span>
                              <div className="text-muted-foreground text-xs">
                                {weekStartDate} - {weekEndDate}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen">
      <div className="w-full p-3 space-y-6">
        <BackButton to="/school-settings/school-years" className="md:hidden">
          {t("schoolYears.backToList", "Volver a años escolares")}
        </BackButton>

        <PageHeader
          title={schoolYearId ? t("schoolYears.editTitle", "Editar año escolar") : t("schoolYears.wizardTitle", "Configurar nuevo año escolar")}
          description={t(
            "schoolYears.wizardDescription",
            "Define las fechas de cada trimestre, las semanas académicas y las vacaciones."
          )}
        />

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm",
                      currentStep > step.number
                        ? "bg-green-500 text-white scale-110"
                        : currentStep === step.number
                          ? "bg-blue-600 text-white scale-110 ring-4 ring-blue-200"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {currentStep > step.number ? <CheckCircle2 className="h-5 w-5" /> : step.number}
                  </div>
                  <div className="mt-2 text-center max-w-[120px]">
                    <div
                      className={cn(
                        "text-xs font-semibold transition-colors",
                        currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-2 transition-all duration-300 rounded-full",
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && renderYearStep()}
        {currentStep === 2 && renderQuarterStep(0)}
        {currentStep === 3 && renderQuarterStep(1)}
        {currentStep === 4 && renderQuarterStep(2)}
        {currentStep === 5 && renderQuarterStep(3)}
        {currentStep === 6 && renderSummaryStep()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => navigate("/school-settings/school-years") : handleBack}
            disabled={saving}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? t("common.cancel", "Cancelar") : t("wizard.back", "Atrás")}
          </Button>

          <div className="flex gap-2">
            {currentStep < 6 ? (
              <Button
                onClick={handleNext}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {t("wizard.next", "Siguiente")} <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={saving || !formData.name}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving
                  ? t("common.saving", "Guardando...")
                  : schoolYearId
                    ? t("schoolYears.updateSchoolYear", "Actualizar año escolar")
                    : t("schoolYears.createSchoolYear", "Crear año escolar")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
