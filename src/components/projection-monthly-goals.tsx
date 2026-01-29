import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Check, X, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { ProjectionMonthlyGoal } from "@/services/api/monthly-goals"

interface ProjectionMonthlyGoalsProps {
  quarter: string
  monthlyGoals: ProjectionMonthlyGoal[]
  isEditing: boolean
  onGradeUpdate: (monthlyGoalId: string, grade: number) => Promise<void>
  onMarkUngraded: (monthlyGoalId: string) => Promise<void>
}

export function ProjectionMonthlyGoals({
  quarter,
  monthlyGoals,
  isEditing,
  onGradeUpdate,
  onMarkUngraded,
}: ProjectionMonthlyGoalsProps) {
  const { t } = useTranslation()
  const [showGradeDialog, setShowGradeDialog] = React.useState(false)
  const [selectedGoal, setSelectedGoal] = React.useState<ProjectionMonthlyGoal | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const goalsForQuarter = React.useMemo(() => {
    return monthlyGoals.filter((g) => g.monthlyGoalTemplate.quarter === quarter)
  }, [monthlyGoals, quarter])

  const handleOpenGradeDialog = (goal: ProjectionMonthlyGoal) => {
    setSelectedGoal(goal)
    setGradeInput(goal.grade !== null ? String(goal.grade) : "")
    setShowGradeDialog(true)
  }

  const handleSaveGrade = async () => {
    if (!selectedGoal) return

    const grade = parseInt(gradeInput, 10)
    if (isNaN(grade) || grade < 0 || grade > 100) return

    setIsSubmitting(true)
    try {
      await onGradeUpdate(selectedGoal.id, grade)
      setShowGradeDialog(false)
      setSelectedGoal(null)
      setGradeInput("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkUngraded = async (goal: ProjectionMonthlyGoal) => {
    await onMarkUngraded(goal.id)
  }

  if (goalsForQuarter.length === 0) {
    return null
  }

  return (
    <>
      <Card className="mt-4 border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t("monthlyGoals.title") || "Monthly Goals"} - {quarter}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid gap-2">
            {goalsForQuarter.map((goal) => (
              <div
                key={goal.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  goal.status === "COMPLETED" && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900",
                  goal.status === "FAILED" && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
                  goal.status === "PENDING" && "bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{goal.monthlyGoalTemplate.name}</span>
                  {goal.grade !== null && (
                    <Badge
                      variant={goal.status === "COMPLETED" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {goal.grade}%
                    </Badge>
                  )}
                  {goal.status === "PENDING" && (
                    <Badge variant="secondary" className="text-xs">
                      {t("monthlyGoals.pending") || "Pending"}
                    </Badge>
                  )}
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    {goal.grade !== null ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenGradeDialog(goal)}
                          className="h-8 px-2"
                        >
                          {t("monthlyGoals.editGrade") || "Edit"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkUngraded(goal)}
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenGradeDialog(goal)}
                        className="h-8"
                      >
                        {t("monthlyGoals.addGrade") || "Add Grade"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedGoal?.monthlyGoalTemplate.name} - {t("monthlyGoals.enterGrade") || "Enter Grade"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                placeholder="0-100"
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {gradeInput && (
              <div className="mt-2 flex items-center gap-2">
                {parseInt(gradeInput, 10) >= 80 ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {t("monthlyGoals.approved") || "Approved"}
                    </span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      {t("monthlyGoals.failed") || "Failed"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={!gradeInput || isSubmitting}
            >
              {isSubmitting ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
