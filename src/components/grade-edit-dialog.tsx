import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface GradeEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentGrade: number | null
  onSave: (grade: number) => void
}

export function GradeEditDialog({
  open,
  onOpenChange,
  currentGrade,
  onSave,
}: GradeEditDialogProps) {
  const { t } = useTranslation()
  const [gradeInput, setGradeInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setGradeInput(currentGrade !== null ? currentGrade.toString() : "")
      setError(null)
    }
  }, [open, currentGrade])

  const handleSave = () => {
    const grade = parseFloat(gradeInput)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      setError(t("projections.invalidGrade") || "Grade must be between 0 and 100")
      return
    }
    setError(null)
    onSave(grade)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  const previewGrade = parseFloat(gradeInput)
  const isValidGrade = !isNaN(previewGrade) && previewGrade >= 0 && previewGrade <= 100
  const previewBorderColor = isValidGrade
    ? previewGrade >= 80
      ? "border-green-300 focus-visible:border-green-400"
      : "border-red-300 focus-visible:border-red-400"
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentGrade !== null
              ? t("projections.editGrade") || "Edit Grade"
              : t("projections.addGrade") || "Add Grade"}
          </DialogTitle>
          <DialogDescription>
            {t("projections.gradeDescription") || "Enter a grade between 0 and 100"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("projections.grade") || "Grade"}
            </label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              value={gradeInput}
              onChange={(e) => {
                const value = e.target.value
                // Allow empty, digits, and decimal numbers with max 1 decimal place
                // Regex: allows digits, optional single decimal point, and up to 1 digit after decimal
                // Also allows trailing decimal point for partial input (e.g., "85.")
                if (value === '' || /^\d+(\.\d{0,1})?$|^\d*\.$/.test(value)) {
                  // Clamp to 0-100 range
                  if (value === '') {
                    setGradeInput('')
                  } else {
                    const numValue = parseFloat(value)
                    if (!isNaN(numValue)) {
                      if (numValue > 100) {
                        setGradeInput('100')
                      } else if (numValue < 0) {
                        setGradeInput('0')
                      } else {
                        // Ensure only 1 decimal place
                        const parts = value.split('.')
                        if (parts.length === 2 && parts[1].length > 1) {
                          setGradeInput(parts[0] + '.' + parts[1].charAt(0))
                        } else {
                          setGradeInput(value)
                        }
                      }
                    } else if (value.endsWith('.')) {
                      // Allow trailing decimal point for partial input
                      setGradeInput(value)
                    } else {
                      setGradeInput(value)
                    }
                  }
                  setError(null)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancel()
                }
                // Allow decimal point, backspace, delete, arrow keys, tab, and digits
                // Also allow Ctrl/Cmd combinations (for copy/paste)
                if (e.key === '.' || /[\d\bDeleteArrowLeftArrowRightArrowUpArrowDownTab]/.test(e.key) || e.ctrlKey || e.metaKey) {
                  // Allow these keys
                  return
                }
                // Prevent other keys
                e.preventDefault()
              }}
              placeholder="0-100"
              className={`text-lg font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] ${previewBorderColor}`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {isValidGrade && (
              <p className={`text-sm font-medium ${previewGrade >= 80 ? 'text-green-700' : 'text-red-700'}`}>
                {previewGrade >= 80
                  ? t("projections.approved") || "Approved"
                  : t("projections.failed") || "Failed"}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={!isValidGrade}>
            {t("common.save") || "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
