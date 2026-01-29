import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Loading } from "@/components/ui/loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Target, Percent } from "lucide-react"
import { useApi } from "@/services/api"
import type { MonthlyGoalTemplate, QuarterGradePercentage } from "@/services/api/monthly-goals"
import { useUser } from "@/contexts/UserContext"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const QUARTERS = ["Q1", "Q2", "Q3", "Q4", "Q5"] as const

export default function MonthlyGoalsPage() {
  const api = useApi()
  const { isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()

  const [templates, setTemplates] = React.useState<MonthlyGoalTemplate[]>([])
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
    const loadMonthlyGoals = async () => {
      if (!schoolYearId) return

      setIsLoading(true)
      try {
        const data = await api.monthlyGoals.getBySchoolYear(schoolYearId)
        setTemplates(data.templates)
        setPercentages(data.percentages)

        const initialInputs: Record<string, string> = {}
        data.percentages.forEach((p) => {
          initialInputs[p.quarter] = String(p.percentage)
        })
        setPercentageInputs(initialInputs)
      } catch (err) {
        console.error("Error loading monthly goals:", err)
        setError("Failed to load monthly goals")
      } finally {
        setIsLoading(false)
      }
    }
    loadMonthlyGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYearId])

  const templatesForQuarter = React.useMemo(() => {
    return templates.filter((t) => t.quarter === activeQuarter)
  }, [templates, activeQuarter])


  const handleAddTemplate = async () => {
    if (!schoolYearId || !newTemplateName.trim()) return

    setIsSubmitting(true)
    try {
      const newTemplate = await api.monthlyGoals.createTemplate(schoolYearId, {
        name: newTemplateName.trim(),
        quarter: activeQuarter,
      })
      setTemplates((prev) => [...prev, newTemplate])
      setNewTemplateName("")
      setShowAddTemplateDialog(false)
      toast.success(t("monthlyGoals.templateCreated") || "Monthly goal created")
    } catch (err) {
      console.error("Error creating template:", err)
      toast.error(t("monthlyGoals.errorCreatingTemplate") || "Failed to create monthly goal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await api.monthlyGoals.deleteTemplate(templateId)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      toast.success(t("monthlyGoals.templateDeleted") || "Monthly goal deleted")
    } catch (err) {
      console.error("Error deleting template:", err)
      toast.error(t("monthlyGoals.errorDeletingTemplate") || "Failed to delete monthly goal")
    }
  }

  const handlePercentageBlur = async (quarter: string) => {
    if (!schoolYearId) return

    const value = parseInt(percentageInputs[quarter] || "0", 10)
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error(t("monthlyGoals.invalidPercentage") || "Percentage must be between 0 and 100")
      return
    }

    const existingPercentage = percentages.find((p) => p.quarter === quarter)
    if (existingPercentage && existingPercentage.percentage === value) return

    try {
      const updated = await api.monthlyGoals.createPercentage(schoolYearId, {
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
      toast.success(t("monthlyGoals.percentageSaved") || "Percentage saved")
    } catch (err) {
      console.error("Error saving percentage:", err)
      toast.error(t("monthlyGoals.errorSavingPercentage") || "Failed to save percentage")
    }
  }

  if (isLoadingUser || isLoading) {
    return <Loading variant="list-page" />
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <ErrorAlert
          title={t("errors.loadMonthlyGoalsFailed") || "Failed to load monthly goals"}
          message={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title={t("monthlyGoals.title") || "Monthly Goals"}
        description={t("monthlyGoals.description") || "Manage monthly assignments for each quarter"}
      />

      <div className="flex gap-2 border-b border-border pb-2">
        {QUARTERS.map((quarter) => (
          <button
            key={quarter}
            onClick={() => setActiveQuarter(quarter)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
              activeQuarter === quarter
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {quarter}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t("monthlyGoals.goalsForQuarter") || "Goals for"} {activeQuarter}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddTemplateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("monthlyGoals.addGoal") || "Add Goal"}
            </Button>
          </CardHeader>
          <CardContent>
            {templatesForQuarter.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("monthlyGoals.noGoals") || "No monthly goals for this quarter yet"}
              </div>
            ) : (
              <ul className="space-y-2">
                {templatesForQuarter.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium">{template.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Percent className="h-5 w-5" />
              {t("monthlyGoals.gradeWeight") || "Grade Weight for"} {activeQuarter}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor={`percentage-${activeQuarter}`}>
                  {t("monthlyGoals.percentageLabel") || "Monthly Goals Weight (%)"}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id={`percentage-${activeQuarter}`}
                    type="number"
                    min={0}
                    max={100}
                    value={percentageInputs[activeQuarter] || "0"}
                    onChange={(e) =>
                      setPercentageInputs((prev) => ({
                        ...prev,
                        [activeQuarter]: e.target.value,
                      }))
                    }
                    onBlur={() => handlePercentageBlur(activeQuarter)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("monthlyGoals.percentageDescription") ||
                    "This percentage will be deducted from the paces average for the final grade calculation."}
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">
                  {t("monthlyGoals.gradeCalculation") || "Grade Calculation"}
                </h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>
                    {t("monthlyGoals.pacesWeight") || "Paces Average"}: {100 - (parseInt(percentageInputs[activeQuarter] || "0", 10) || 0)}%
                  </p>
                  <p>
                    {t("monthlyGoals.monthlyGoalsWeight") || "Monthly Goals Average"}: {percentageInputs[activeQuarter] || 0}%
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
              {t("monthlyGoals.addGoalTitle") || "Add Monthly Goal"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">
              {t("monthlyGoals.goalName") || "Goal Name"}
            </Label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder={t("monthlyGoals.goalNamePlaceholder") || "e.g., Oral Report, Verse of the Month"}
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
