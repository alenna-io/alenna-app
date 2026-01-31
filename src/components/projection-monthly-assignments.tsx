import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { ProjectionMonthlyAssignment } from "@/services/api/monthly-assignment"
import { Spinner } from "@/components/ui/spinner"

interface ProjectionMonthlyAssignmentsProps {
  quarter: string
  monthlyAssignments: ProjectionMonthlyAssignment[]
  isEditing: boolean
  loadingActions?: Map<string, boolean>
  onGradeUpdate: (monthlyAssignmentId: string, grade: number) => Promise<void>
  onMarkUngraded: (monthlyAssignmentId: string) => Promise<void>
}

export function ProjectionMonthlyAssignments({
  quarter,
  monthlyAssignments,
  isEditing,
  loadingActions = new Map(),
  onGradeUpdate,
  onMarkUngraded,
}: ProjectionMonthlyAssignmentsProps) {
  const { t } = useTranslation()
  const [showGradeDialog, setShowGradeDialog] = React.useState(false)
  const [selectedAssignment, setSelectedAssignment] = React.useState<ProjectionMonthlyAssignment | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const assignmentsByMonth = React.useMemo(() => {
    const filtered = monthlyAssignments.filter((g) => g.monthlyAssignmentTemplate.quarter === quarter)
    const grouped = new Map<number, ProjectionMonthlyAssignment[]>()

    filtered.forEach((assignment) => {
      const month = assignment.monthlyAssignmentTemplate.month
      if (!grouped.has(month)) {
        grouped.set(month, [])
      }
      grouped.get(month)!.push(assignment)
    })

    const sorted = Array.from(grouped.entries()).sort(([a], [b]) => a - b)
    return sorted
  }, [monthlyAssignments, quarter])

  const handleOpenGradeDialog = (assignment: ProjectionMonthlyAssignment) => {
    setSelectedAssignment(assignment)
    setGradeInput(assignment.grade !== null ? String(assignment.grade) : "")
    setShowGradeDialog(true)
  }

  const handleGradeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setGradeInput("")
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setGradeInput(value)
    }
  }

  const handleSaveGrade = async () => {
    if (!selectedAssignment) return

    const grade = parseInt(gradeInput, 10)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      return
    }

    setIsSubmitting(true)
    try {
      await onGradeUpdate(selectedAssignment.id, grade)
      setShowGradeDialog(false)
      setSelectedAssignment(null)
      setGradeInput("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkUngraded = async (assignment: ProjectionMonthlyAssignment) => {
    await onMarkUngraded(assignment.id)
  }

  if (assignmentsByMonth.length === 0) {
    return null
  }

  return (
    <>
      <Card className="mt-10 border-dashed p-6">
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {t("monthlyAssignments.title") || "Monthly Assignments"} - {quarter}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <div className="space-y-6">
            {assignmentsByMonth.map(([month, assignments]) => (
              <div key={month} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  {t(`common.months.${month}`) || new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                </h4>
                <div className="grid gap-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xs border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{assignment.monthlyAssignmentTemplate.name}</span>
                        {assignment.grade !== null && (
                          <Badge
                            variant={assignment.status === "COMPLETED" ? "default" : "destructive"}
                            className="text-xs flex items-center gap-1"
                          >
                            {loadingActions.get(`monthly-grade-${assignment.id}`) && (
                              <Spinner className="size-2" />
                            )}
                            {assignment.grade}%
                          </Badge>
                        )}
                        {assignment.status === "PENDING" && (
                          <Badge variant="secondary" className="text-xs">
                            {t("monthlyAssignments.pending") || "Pending"}
                          </Badge>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          {assignment.grade !== null ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenGradeDialog(assignment)}
                                className="h-8 px-2"
                                disabled={loadingActions.get(`monthly-grade-${assignment.id}`) === true || loadingActions.get(`monthly-ungraded-${assignment.id}`) === true}
                              >
                                {loadingActions.get(`monthly-grade-${assignment.id}`) ? (
                                  <Spinner className="size-3" />
                                ) : (
                                  t("monthlyAssignments.editGrade") || "Edit"
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkUngraded(assignment)}
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                disabled={loadingActions.get(`monthly-grade-${assignment.id}`) === true || loadingActions.get(`monthly-ungraded-${assignment.id}`) === true}
                              >
                                {loadingActions.get(`monthly-ungraded-${assignment.id}`) ? (
                                  <Spinner className="size-3" />
                                ) : (
                                  <Undo2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenGradeDialog(assignment)}
                              className="h-8"
                              disabled={loadingActions.get(`monthly-grade-${assignment.id}`) === true}
                            >
                              {loadingActions.get(`monthly-grade-${assignment.id}`) ? (
                                <Spinner className="size-3" />
                              ) : (
                                t("monthlyAssignments.addGrade") || "Add Grade"
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment?.monthlyAssignmentTemplate.name} - {t("monthlyAssignments.enterGrade") || "Enter Grade"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={gradeInput}
                onChange={handleGradeInputChange}
                placeholder="0-100"
                className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {gradeInput && (
              <div className="mt-2 flex items-center gap-2">
                {parseInt(gradeInput, 10) >= 80 ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {t("monthlyAssignments.approved") || "Approved"}
                    </span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      {t("monthlyAssignments.failed") || "Failed"}
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
