import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      <DialogContent className="max-w-lg animate-page-entrance">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            {assignment ? t("monthlyAssignments.editAssignment") : t("monthlyAssignments.createAssignment")}
          </DialogTitle>
          {schoolYearName && (
            <DialogDescription className="text-sm text-muted-foreground">
              {t("monthlyAssignments.manageForYear", { year: schoolYearName })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-5 py-4">
          {!assignment && (
            <div className="bg-amber-soft border border-amber-200 rounded-lg p-4 animate-fade-in-soft">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    {t("common.important")}
                  </p>
                  <p className="text-sm text-amber-700">
                    {t("forms.assignmentAutoCreate")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <FieldGroup className="space-y-5">
            {!assignment && (
              <Field>
                <FieldLabel htmlFor="quarter" className="text-sm font-medium text-foreground mb-2">
                  {t("monthlyAssignments.quarter")}
                </FieldLabel>
                <Select value={formData.quarter} onValueChange={(value) => setFormData({ ...formData, quarter: value })}>
                  <SelectTrigger 
                    id="quarter" 
                    className="h-10 bg-card border border-input focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  >
                    <SelectValue placeholder={t("monthlyAssignments.selectQuarter")} />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map(q => (
                      <SelectItem key={q.value} value={q.value} className="cursor-pointer">
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {assignment && (
              <Field>
                <FieldLabel className="text-sm font-medium text-foreground mb-2">
                  {t("monthlyAssignments.quarter")}
                </FieldLabel>
                <div className="px-3 py-2 rounded-md bg-muted/30 border border-border">
                  <Badge variant="primary-soft" className="text-sm">
                    {getQuarterLabel(formData.quarter)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("forms.quarterCannotBeModified")}
                </p>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="assignment-name" className="text-sm font-medium text-foreground mb-2">
                {t("monthlyAssignments.assignmentName")}
              </FieldLabel>
              <Input
                id="assignment-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("monthlyAssignments.namePlaceholder")}
                className="h-10 bg-card border border-input focus:border-primary focus:ring-2 focus:ring-primary-soft"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) {
                    handleSave()
                  }
                }}
                autoFocus
              />
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="transition-colors hover:opacity-90"
            style={{
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-soft)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = ''
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name.trim() || (!assignment && !formData.quarter)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            {isSaving ? t("common.saving") : assignment ? t("common.save") : t("monthlyAssignments.newAssignment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

