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
import { FileText, AlertTriangle } from "lucide-react"
import type { MonthlyAssignmentTemplate } from "./monthly-assignments-table"
import { useTranslation } from "react-i18next"

interface MonthlyAssignmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: MonthlyAssignmentTemplate | null
  schoolYearName?: string
  onSave: (data: {
    name: string
    quarter: string
  }) => Promise<void>
}

export function MonthlyAssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  schoolYearName,
  onSave,
}: MonthlyAssignmentFormDialogProps) {
  const { t } = useTranslation()

  const getQuarterLabel = React.useCallback((quarter: string) => {
    switch (quarter) {
      case 'Q1':
        return t("monthlyAssignments.quarterQ1")
      case 'Q2':
        return t("monthlyAssignments.quarterQ2")
      case 'Q3':
        return t("monthlyAssignments.quarterQ3")
      case 'Q4':
        return t("monthlyAssignments.quarterQ4")
      default:
        return quarter
    }
  }, [t])

  const QUARTERS = React.useMemo(() => [
    { value: 'Q1', label: getQuarterLabel('Q1') },
    { value: 'Q2', label: getQuarterLabel('Q2') },
    { value: 'Q3', label: getQuarterLabel('Q3') },
    { value: 'Q4', label: getQuarterLabel('Q4') },
  ], [getQuarterLabel])
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState<{
    name: string
    quarter: string
  }>({
    name: "",
    quarter: "",
  })

  // Initialize form data when dialog opens or assignment changes
  React.useEffect(() => {
    if (open) {
      if (assignment) {
        // Editing existing assignment
        setFormData({
          name: assignment.name,
          quarter: assignment.quarter,
        })
      } else {
        // Creating new assignment
        setFormData({
          name: "",
          quarter: "",
        })
      }
    }
  }, [open, assignment])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return
    }

    if (!assignment && !formData.quarter) {
      return
    }

    try {
      setIsSaving(true)
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving assignment:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assignment ? t("monthlyAssignments.editAssignment") : t("monthlyAssignments.createAssignment")}
          </DialogTitle>
          <DialogDescription>
            {assignment
              ? t("forms.editAssignment")
              : t("forms.createAssignment", { schoolYear: schoolYearName || '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!assignment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    {t("common.important")}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {t("forms.assignmentAutoCreate")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <FieldGroup>
            {!assignment && (
              <Field>
                <FieldLabel htmlFor="quarter">{t("monthlyAssignments.quarter")}</FieldLabel>
                <Select value={formData.quarter} onValueChange={(value) => setFormData({ ...formData, quarter: value })}>
                  <SelectTrigger id="quarter">
                    <SelectValue placeholder={t("monthlyAssignments.selectQuarter")} />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map(q => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {assignment && (
              <Field>
                <FieldLabel>{t("monthlyAssignments.quarter")}</FieldLabel>
                <div className="text-sm text-muted-foreground">
                  {getQuarterLabel(formData.quarter)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("forms.quarterCannotBeModified")}
                </p>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="assignment-name">{t("monthlyAssignments.assignmentName")}</FieldLabel>
              <Input
                id="assignment-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("monthlyAssignments.namePlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) {
                    handleSave()
                  }
                }}
              />
            </Field>
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
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim() || (!assignment && !formData.quarter)}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            {isSaving ? t("common.saving") : assignment ? t("common.save") : t("monthlyAssignments.newAssignment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

