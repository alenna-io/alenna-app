import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { History, Check } from "lucide-react"
import type { MonthlyAssignment } from "@/types/monthly-assignment"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface MonthlyAssignmentsSectionProps {
  quarter: string
  assignments: MonthlyAssignment[]
  isReadOnly?: boolean
  isQuarterClosed?: boolean
  onRefresh?: () => Promise<void>
  onGradeAssignment: (assignmentId: string, grade: number, note?: string) => Promise<void>
}

export function MonthlyAssignmentsSection({
  quarter,
  assignments,
  isReadOnly = false,
  isQuarterClosed = false,
  onGradeAssignment,
}: MonthlyAssignmentsSectionProps) {
  const { t } = useTranslation()
  const [gradingAssignment, setGradingAssignment] = React.useState<string | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [noteInput, setNoteInput] = React.useState("")
  const [historyDialog, setHistoryDialog] = React.useState<MonthlyAssignment | null>(null)
  const [assignmentsState, setAssignmentsState] = React.useState(assignments)

  const quarterAssignments = assignmentsState.filter(a => a.quarter === quarter)

  // Update local state when assignments prop changes
  React.useEffect(() => {
    setAssignmentsState(assignments)
  }, [assignments])

  const handleGradeAssignment = async () => {
    if (!gradingAssignment) return

    const grade = parseInt(gradeInput)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error(t("monthlyAssignments.gradeRangeError"))
      return
    }

    // OPTIMISTIC UPDATE: Immediately update the UI
    const assignmentIndex = assignmentsState.findIndex(a => a.id === gradingAssignment)
    if (assignmentIndex !== -1) {
      const updatedAssignments = [...assignmentsState]
      const updatedAssignment = {
        ...updatedAssignments[assignmentIndex],
        grade,
        gradeHistory: [
          ...(updatedAssignments[assignmentIndex].gradeHistory || []),
          {
            grade,
            date: new Date().toISOString(),
            note: noteInput || undefined
          }
        ]
      }
      updatedAssignments[assignmentIndex] = updatedAssignment
      setAssignmentsState(updatedAssignments)
    }

    // Close dialog immediately
    setGradingAssignment(null)
    const savedNoteInput = noteInput
    setGradeInput("")
    setNoteInput("")

    try {
      await onGradeAssignment(gradingAssignment, grade, savedNoteInput || undefined)
      toast.success(t("monthlyAssignments.saveSuccess"))
    } catch (err) {
      console.error('Error grading assignment:', err)
      toast.error(err instanceof Error ? err.message : t("monthlyAssignments.gradeError"))
      // ROLLBACK: Revert to original state on error
      setAssignmentsState(assignments)
    }
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="p-5 md:p-6 border-b border-border/30">
          <CardTitle className="text-lg md:text-xl font-semibold">{t("monthlyAssignments.sectionTitle", { quarter })}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 md:p-6">
          {quarterAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("monthlyAssignments.noAssignmentsForQuarter")}
            </p>
          ) : (
            <div className="space-y-3">
              {quarterAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary-soft/10 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground mb-1.5">{assignment.name}</p>
                    {assignment.grade !== null && (
                      <Badge
                        variant={assignment.grade >= 80 ? "status-completed" : "status-failed"}
                        className="mt-1"
                      >
                        {assignment.grade}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {!isReadOnly && !isQuarterClosed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setGradingAssignment(assignment.id)
                          setGradeInput(assignment.grade?.toString() || "")
                        }}
                        className="cursor-pointer transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                      >
                        {t("monthlyAssignments.gradeAssignment")}
                      </Button>
                    )}
                    {assignment.gradeHistory.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryDialog(assignment)}
                        className="cursor-pointer transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Assignment Dialog */}
      <Dialog open={!!gradingAssignment} onOpenChange={(open) => !open && setGradingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("monthlyAssignments.gradeAssignment")}</DialogTitle>
            <DialogDescription>
              {t("monthlyAssignments.gradeAssignmentDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("monthlyAssignments.grade")}</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("monthlyAssignments.note")}</label>
              <Input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t("monthlyAssignments.notePlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGradingAssignment(null)
                  setGradeInput("")
                  setNoteInput("")
                }}
                className="cursor-pointer"
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleGradeAssignment} className="cursor-pointer">
                <Check className="h-4 w-4 mr-2" />
                {t("monthlyAssignments.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade History Dialog */}
      <Dialog open={!!historyDialog} onOpenChange={(open) => !open && setHistoryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("monthlyAssignments.gradeHistory")}
            </DialogTitle>
            <DialogDescription>
              {historyDialog && (
                <>
                  {t("monthlyAssignments.assignmentLabel")} <span className="font-semibold">{historyDialog.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historyDialog?.gradeHistory.map((entry, index) => (
              <div key={index} className={`p-4 rounded-xl border transition-all duration-200 ${entry.grade >= 80 ? 'bg-mint-soft/30 border-mint/30' : 'bg-coral-soft/30 border-coral/30'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={entry.grade >= 80 ? "status-completed" : "status-failed"} className="text-lg font-bold">
                    {entry.grade}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
                {entry.note && (
                  <p className="text-sm mt-2 text-foreground">{entry.note}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setHistoryDialog(null)}
              className="cursor-pointer"
            >
              {t("monthlyAssignments.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

