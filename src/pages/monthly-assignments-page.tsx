import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Loading } from "@/components/ui/loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Percent } from "lucide-react"
import { useApi } from "@/services/api"
import type { MonthlyAssignmentTemplate, QuarterGradePercentage } from "@/services/api/monthly-assignment"
import { useUser } from "@/contexts/UserContext"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const

export default function MonthlyAssignmentsPage() {
  const api = useApi()
  const { isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const [templates, setTemplates] = React.useState<MonthlyAssignmentTemplate[]>([])
  const [percentages, setPercentages] = React.useState<QuarterGradePercentage[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeQuarter, setActiveQuarter] = React.useState<string>("Q1")
  const [schoolYearId, setSchoolYearId] = React.useState<string | null>(null)

  const [showAddTemplateDialog, setShowAddTemplateDialog] = React.useState(false)
  const [newTemplateName, setNewTemplateName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [percentageInputs, setPercentageInputs] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const loadSchoolData = async () => {
      try {
        const schoolData = await api.schools.getWithCurrentYear()
        const currentYear = schoolData?.schoolYears?.find(sy => sy.status === 'CURRENT_YEAR')
        if (currentYear?.id) {
          setSchoolYearId(currentYear.id)
        }
      } catch (err) {
        console.error("Error loading school data:", err)
        setError("Failed to load school data")
      }
    }
    loadSchoolData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const loadMonthlyAssignments = async () => {
      if (!schoolYearId) return

      setIsLoading(true)
      try {
        const data = await api.monthlyAssignments.getBySchoolYear(schoolYearId)
        setTemplates(data.templates)
        setPercentages(data.percentages)

        const initialInputs: Record<string, string> = {}
        data.percentages.forEach((p) => {
          initialInputs[p.quarter] = String(p.percentage)
        })
        setPercentageInputs(initialInputs)
      } catch (err) {
        console.error("Error loading monthly assignments:", err)
        setError("Failed to load monthly assignments")
      } finally {
        setIsLoading(false)
      }
    }
    loadMonthlyAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYearId])

  const templatesForQuarter = React.useMemo(() => {
    return templates.filter((t) => t.quarter === activeQuarter)
  }, [templates, activeQuarter])


  const handleAddTemplate = async () => {
    if (!schoolYearId || !newTemplateName.trim()) return

    setIsSubmitting(true)
    try {
      const newTemplate = await api.monthlyAssignments.createTemplate(schoolYearId, {
        name: newTemplateName.trim(),
        quarter: activeQuarter,
      })
      setTemplates((prev) => [...prev, newTemplate])
      setNewTemplateName("")
      setShowAddTemplateDialog(false)
      toast.success(t("monthlyAssignments.templateCreated") || "Monthly assignment created")
    } catch (err) {
      console.error("Error creating template:", err)
      toast.error(t("monthlyAssignments.errorCreatingTemplate") || "Failed to create monthly assignment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await api.monthlyAssignments.deleteTemplate(templateId)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      toast.success(t("monthlyAssignments.templateDeleted") || "Monthly assignment deleted")
    } catch (err) {
      console.error("Error deleting template:", err)
      toast.error(t("monthlyAssignments.errorDeletingTemplate") || "Failed to delete monthly assignment")
    }
  }

  const handlePercentageChange = (quarter: string, value: string) => {
    if (value === "") {
      setPercentageInputs((prev) => ({
        ...prev,
        [quarter]: "",
      }))
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
      setPercentageInputs((prev) => ({
        ...prev,
        [quarter]: value,
      }))
    }
  }

  const handlePercentageBlur = async (quarter: string) => {
    if (!schoolYearId) return

    const value = parseInt(percentageInputs[quarter] || "0", 10)
    if (isNaN(value) || value < 0 || value > 99) {
      toast.error(t("monthlyAssignments.invalidPercentage") || "Percentage must be between 0 and 99")
      return
    }

    const existingPercentage = percentages.find((p) => p.quarter === quarter)
    if (existingPercentage && existingPercentage.percentage === value) return

    try {
      const updated = await api.monthlyAssignments.createPercentage(schoolYearId, {
        quarter,
        percentage: value,
      })
      setPercentages((prev) => {
        const existing = prev.find((p) => p.quarter === quarter)
        if (existing) {
          return prev.map((p) => (p.quarter === quarter ? updated : p))
        }
        return [...prev, updated]
      })
      toast.success(t("monthlyAssignments.percentageSaved") || "Percentage saved")
    } catch (err) {
      console.error("Error saving percentage:", err)
      toast.error(t("monthlyAssignments.errorSavingPercentage") || "Failed to save percentage")
    }
  }

  if (isLoadingUser || isLoading) {
    return <Loading variant="list-page" />
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <ErrorAlert
          title={t("errors.loadMonthlyAssignmentsFailed") || "Failed to load monthly assignments"}
          message={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader
        moduleKey="monthlyAssignments"
        title={t("monthlyAssignments.title") || "Monthly Assignments"}
        description={t("monthlyAssignments.description") || "Manage monthly assignments for each quarter"}
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-black">
          {t("monthlyAssignments.quarter") || "Quarter"}
        </span>
        <Tabs value={activeQuarter} onValueChange={setActiveQuarter} className="w-auto">
          <TabsList className="h-8 p-0.5 bg-[#8B5CF6]/10">
            {QUARTERS.map((quarter) => (
              <TabsTrigger
                key={quarter}
                value={quarter}
                className="h-7 px-2.5 text-sm transition-all duration-200"
              >
                {quarter}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <span className="break-words">
                {t("monthlyAssignments.assignmentsForQuarter") || "Assignments for"} {activeQuarter}
              </span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddTemplateDialog(true)}
              className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">
                {t("monthlyAssignments.addAssignment") || "Add Assignment"}
              </span>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {templatesForQuarter.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
                {t("monthlyAssignments.noAssignments") || "No monthly assignments for this quarter yet"}
              </div>
            ) : (
              <ul className="space-y-2">
                {templatesForQuarter.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2"
                  >
                    <span className="font-medium text-sm sm:text-base break-words flex-1 min-w-0">{template.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="break-words">
                {t("monthlyAssignments.gradeWeight") || "Grade Weight for"} {activeQuarter}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <Label htmlFor={`percentage-${activeQuarter}`} className="text-sm sm:text-base">
                  {t("monthlyAssignments.percentageLabel") || "Monthly Assignments Weight (%)"}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id={`percentage-${activeQuarter}`}
                    type="number"
                    min={0}
                    max={99}
                    value={percentageInputs[activeQuarter] || "0"}
                    onChange={(e) => handlePercentageChange(activeQuarter, e.target.value)}
                    onBlur={() => handlePercentageBlur(activeQuarter)}
                    className="w-20 sm:w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-muted-foreground text-sm sm:text-base">%</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  {t("monthlyAssignments.percentageDescription") ||
                    "This percentage will be deducted from the paces average for the final grade calculation."}
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm sm:text-base">
                  {t("monthlyAssignments.gradeCalculation") || "Grade Calculation"}
                </h4>
                <div className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                  <p>
                    {t("monthlyAssignments.pacesWeight") || "Paces Average"}: {100 - (parseInt(percentageInputs[activeQuarter] || "0", 10) || 0)}%
                  </p>
                  <p>
                    {t("monthlyAssignments.monthlyAssignmentsWeight") || "Monthly Assignments Average"}: {percentageInputs[activeQuarter] || 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddTemplateDialog} onOpenChange={setShowAddTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("monthlyAssignments.addAssignmentTitle") || "Add Monthly Assignment"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">
              {t("monthlyAssignments.assignmentName") || "Assignment Name"}
            </Label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder={t("monthlyAssignments.assignmentNamePlaceholder") || "e.g., Oral Report, Verse of the Month"}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddTemplateDialog(false)
                setNewTemplateName("")
              }}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleAddTemplate}
              disabled={!newTemplateName.trim() || isSubmitting}
            >
              {isSubmitting ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
