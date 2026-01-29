import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface DailyGoalNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentNote?: string
  onSave: (notes: string) => void
}

export function DailyGoalNoteModal({
  open,
  onOpenChange,
  currentNote,
  onSave,
}: DailyGoalNoteModalProps) {
  const { t } = useTranslation()
  const [notesInput, setNotesInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const maxLength = 50

  React.useEffect(() => {
    if (open) {
      setNotesInput(currentNote || "")
      setError(null)
    }
  }, [open, currentNote])

  const handleSave = () => {
    const trimmed = notesInput.trim()
    if (trimmed === '') {
      setError(t("dailyGoals.noteRequired") || "Note is required")
      return
    }
    if (trimmed.length > maxLength) {
      setError(t("dailyGoals.noteTooLong") || `Note must be ${maxLength} characters or less`)
      return
    }
    setError(null)
    onSave(trimmed)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  const remainingChars = maxLength - notesInput.length
  const isValid = notesInput.trim() !== '' && notesInput.trim().length <= maxLength

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentNote ? (t("dailyGoals.editNote") || "Edit Note") : (t("dailyGoals.addNote") || "Add Note")}
          </DialogTitle>
          <DialogDescription>
            {t("dailyGoals.noteDescription") || "Add a note (max 50 characters)"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("dailyGoals.note") || "Note"}
            </label>
            <Textarea
              value={notesInput}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= maxLength) {
                  setNotesInput(value)
                  setError(null)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSave()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancel()
                }
              }}
              placeholder={t("dailyGoals.notePlaceholder") || "e.g., Missing page 10"}
              className={`resize-none ${error ? 'border-red-500 focus-visible:border-red-500' : ''}`}
              rows={3}
              autoFocus
            />
            <div className="flex justify-between items-center">
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <p className={`text-xs ${remainingChars < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars} {t("common.charactersRemaining") || "characters remaining"}
              </p>
            </div>
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
