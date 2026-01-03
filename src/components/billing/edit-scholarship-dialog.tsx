import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"

interface EditScholarshipDialogProps {
  open: boolean
  student: {
    studentId: string
    fullName: string
    email: string
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function EditScholarshipDialog({
  open,
  student,
  onClose,
  onSuccess,
}: EditScholarshipDialogProps) {
  const api = useApi()
  const { t } = useTranslation()

  const [loading, setLoading] = React.useState(false)

  const [tuitionTypeId, setTuitionTypeId] = React.useState("")
  const [scholarshipType, setScholarshipType] = React.useState<
    "percentage" | "fixed" | null
  >(null)
  const [scholarshipValue, setScholarshipValue] = React.useState("")
  const [tuitionTypes, setTuitionTypes] = React.useState<
    Array<{ id: string; name: string; baseAmount: number }>
  >([])

  /* =========================
     Load initial data
  ========================= */

  React.useEffect(() => {
    if (!open || !student) return

    loadTuitionTypes()
    loadStudentBillingConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student?.studentId])

  const loadTuitionTypes = async () => {
    const types = await api.billing.getTuitionTypes()
    setTuitionTypes(types ?? [])
  }

  const loadStudentBillingConfig = async () => {
    if (!student) return

    const config = await api.billing.getStudentScholarship(student.studentId)

    setTuitionTypeId(config.tuitionTypeId ?? "")
    setScholarshipType(config.scholarshipType)
    setScholarshipValue(
      config.scholarshipValue != null
        ? String(config.scholarshipValue)
        : ""
    )
  }

  /* =========================
     Handlers
  ========================= */

  const handleSave = async () => {
    if (!student) return

    const parsedValue =
      scholarshipValue !== "" ? Number(scholarshipValue) : null

    if (parsedValue != null && isNaN(parsedValue)) {
      toast.error(t("billing.invalidScholarshipValue"))
      return
    }

    if (
      scholarshipType === "percentage" &&
      parsedValue != null &&
      (parsedValue < 0 || parsedValue > 100)
    ) {
      toast.error(t("billing.invalidPercentage"))
      return
    }

    try {
      setLoading(true)

      await api.billing.updateStudentScholarship(student.studentId, {
        tuitionTypeId,
        scholarshipType: scholarshipType ?? undefined,
        scholarshipValue: parsedValue ?? undefined,
      })

      toast.success(t("billing.savedSuccessfully"))
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("billing.saveFailed")
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     Render
  ========================= */

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("billing.editScholarship")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Field>
            <FieldLabel>{t("billing.tuitionType")}</FieldLabel>
            <Select value={tuitionTypeId} onValueChange={setTuitionTypeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tuitionTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} (
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(type.baseAmount)}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("billing.scholarshipType")}</FieldLabel>
            <Select
              value={scholarshipType ?? "none"}
              onValueChange={v => {
                setScholarshipType(v === "none" ? null : (v as "percentage" | "fixed"))
                setScholarshipValue("0")
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("billing.noScholarship")}
                </SelectItem>
                <SelectItem value="percentage">
                  {t("billing.percentage")}
                </SelectItem>
                <SelectItem value="fixed">
                  {t("billing.fixedAmount")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {scholarshipType && (
            <Field>
              <FieldLabel>{t("billing.scholarshipValue")}</FieldLabel>
              <Input
                type="number"
                value={scholarshipValue}
                onChange={e => {
                  if (isNaN(Number(e.target.value))) return
                  if (Number(e.target.value) < 0) return
                  if (scholarshipType === "percentage" && Number(e.target.value) > 100) return
                  setScholarshipValue(e.target.value)
                }}
              />
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("billing.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading || !tuitionTypeId}>
            {loading ? t("billing.saving") : t("billing.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}
