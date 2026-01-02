import * as React from "react"
import { useApi } from "@/services/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface CharacterTrait {
  id: string
  schoolId: string
  schoolYearId: string
  month: number
  characterTrait: string
  verseText: string
  verseReference: string
}

interface SchoolYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface MonthlyContentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trait: CharacterTrait | null
  schoolYears: SchoolYear[]
  defaultSchoolYearId: string
  onSuccess: () => void
}

export function MonthlyContentFormDialog({
  open,
  onOpenChange,
  trait,
  schoolYears,
  defaultSchoolYearId,
  onSuccess,
}: MonthlyContentFormDialogProps) {
  const { t } = useTranslation()
  const api = useApi()
  const [saving, setSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    schoolYearId: "",
    month: "",
    characterTrait: "",
    verseText: "",
    verseReference: "",
  })

  React.useEffect(() => {
    if (open) {
      if (trait) {
        setFormData({
          schoolYearId: trait.schoolYearId,
          month: trait.month.toString(),
          characterTrait: trait.characterTrait,
          verseText: trait.verseText,
          verseReference: trait.verseReference,
        })
      } else {
        setFormData({
          schoolYearId: defaultSchoolYearId,
          month: "",
          characterTrait: "",
          verseText: "",
          verseReference: "",
        })
      }
    }
  }, [open, trait, defaultSchoolYearId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.schoolYearId || !formData.month || !formData.characterTrait || !formData.verseText || !formData.verseReference) {
      toast.error(t("common.error.requiredFields"))
      return
    }

    const monthNum = parseInt(formData.month)
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      toast.error(t("monthlyContent.error.invalidMonth"))
      return
    }

    try {
      setSaving(true)

      if (trait) {
        await api.characterTraits.update(trait.id, {
          schoolYearId: formData.schoolYearId,
          month: monthNum,
          characterTrait: formData.characterTrait,
          verseText: formData.verseText,
          verseReference: formData.verseReference,
        })
        toast.success(t("monthlyContent.updateSuccess"))
      } else {
        await api.characterTraits.create({
          schoolYearId: formData.schoolYearId,
          month: monthNum,
          characterTrait: formData.characterTrait,
          verseText: formData.verseText,
          verseReference: formData.verseReference,
        })
        toast.success(t("monthlyContent.createSuccess"))
      }

      onSuccess()
    } catch (error: unknown) {
      console.error("Error saving character trait:", error)
      toast.error(trait ? t("monthlyContent.updateError") : t("monthlyContent.createError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {trait ? t("monthlyContent.edit") : t("monthlyContent.create")}
          </DialogTitle>
          <DialogDescription>
            {trait ? t("monthlyContent.editDescription") : t("monthlyContent.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Field>
              <FieldLabel>{t("monthlyContent.schoolYear")}</FieldLabel>
              <Select
                value={formData.schoolYearId}
                onValueChange={(value) => setFormData({ ...formData, schoolYearId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{t("monthlyContent.month")}</FieldLabel>
              <Select
                value={formData.month}
                onValueChange={(value) => setFormData({ ...formData, month: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("monthlyContent.selectMonth")} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {t(`common.months.${month}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{t("monthlyContent.characterTrait")}</FieldLabel>
              <Input
                value={formData.characterTrait}
                onChange={(e) => setFormData({ ...formData, characterTrait: e.target.value })}
                placeholder={t("monthlyContent.characterTraitPlaceholder")}
                maxLength={30}
              />
            </Field>

            <Field>
              <FieldLabel>{t("monthlyContent.verseText")}</FieldLabel>
              <Textarea
                value={formData.verseText}
                onChange={(e) => setFormData({ ...formData, verseText: e.target.value })}
                placeholder={t("monthlyContent.verseTextPlaceholder")}
                rows={4}
                maxLength={250}
              />
            </Field>

            <Field>
              <FieldLabel>{t("monthlyContent.verseReference")}</FieldLabel>
              <Input
                value={formData.verseReference}
                onChange={(e) => setFormData({ ...formData, verseReference: e.target.value })}
                placeholder={t("monthlyContent.verseReferencePlaceholder")}
                maxLength={50}
              />
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

