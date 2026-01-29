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

interface DailyGoalAddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (text: string) => void
}

export function DailyGoalAddModal({
  open,
  onOpenChange,
  onSave,
}: DailyGoalAddModalProps) {
  const { t } = useTranslation()
  const [textInput, setTextInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setTextInput("")
      setError(null)
    }
  }, [open])

  const validateTextFormat = React.useCallback((text: string): { valid: boolean; error?: string } => {
    const trimmed = text.trim()

    if (trimmed === '') {
      return { valid: false, error: t("dailyGoals.textRequired") || "Text is required" }
    }

    const lowerText = trimmed.toLowerCase()
    const specialWords = ['st', 'self test', 'test', 't']

    if (specialWords.includes(lowerText)) {
      return { valid: true }
    }

    const singleNumberPattern = /^\d+$/
    if (singleNumberPattern.test(trimmed)) {
      return { valid: true }
    }

    const rangePattern = /^(\d+)-(\d+)$/
    const rangeMatch = trimmed.match(rangePattern)
    if (rangeMatch) {
      const first = parseInt(rangeMatch[1], 10)
      const second = parseInt(rangeMatch[2], 10)
      if (first < second) {
        return { valid: true }
      } else {
        return { valid: false, error: t("dailyGoals.invalidRange") || "First number must be smaller than second number" }
      }
    }

    return { valid: false, error: t("dailyGoals.invalidFormat") || "Must be a number range (e.g., 1-10), a single number, or one of: ST, Self Test, Test, T" }
  }, [t])

  const validationResult = React.useMemo(() => {
    if (textInput.trim() === '') {
      return { valid: false, error: null }
    }
    return validateTextFormat(textInput)
  }, [textInput, validateTextFormat])

  React.useEffect(() => {
    if (textInput.trim() !== '') {
      setError(validationResult.error || null)
    } else {
      setError(null)
    }
  }, [textInput, validationResult])

  const handleSave = () => {
    const result = validateTextFormat(textInput)
    if (result.valid) {
      onSave(textInput.trim())
      onOpenChange(false)
    } else {
      setError(result.error || null)
    }
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  const isValid = validationResult.valid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t("dailyGoals.addDailyGoal") || "Add Daily Goal"}
          </DialogTitle>
          <DialogDescription>
            {t("dailyGoals.addDailyGoalDescription") || "Enter a number range (e.g., 1-10), a single number, or one of: ST, Self Test, Test, T"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("dailyGoals.text") || "Text"}
            </label>
            <Input
              type="text"
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value)
                setError(null)
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
              }}
              placeholder="1-10, 5, ST, Test, etc."
              className={`text-lg font-semibold ${error ? 'border-red-500 focus-visible:border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {!error && textInput.trim() !== '' && (
              <p className="text-sm text-gray-500">
                {t("dailyGoals.formatHint") || "Format: number range (1-10), single number, or ST/Self Test/Test/T"}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {t("common.save") || "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
