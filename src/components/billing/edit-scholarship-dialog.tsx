import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Scholarship {
  id?: string
  tuitionTypeId?: string | null
  scholarshipType?: 'percentage' | 'fixed' | null
  scholarshipValue?: number | null
}

interface EditScholarshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  scholarship: Scholarship | null
  onSuccess: () => void
}

export function EditScholarshipDialog({
  open,
  onOpenChange,
  student,
  scholarship,
  onSuccess,
}: EditScholarshipDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [tuitionTypeId, setTuitionTypeId] = React.useState<string>("")
  const [scholarshipType, setScholarshipType] = React.useState<'percentage' | 'fixed' | null>(null)
  const [scholarshipValue, setScholarshipValue] = React.useState("")
  const [tuitionTypes, setTuitionTypes] = React.useState<Array<{ id: string; name: string; baseAmount: number }>>([])
  const api = useApi()
  const { t } = useTranslation()

  React.useEffect(() => {
    if (open) {
      loadTuitionTypes()
    }
  }, [open])

  React.useEffect(() => {
    if (scholarship) {
      setTuitionTypeId(scholarship.tuitionTypeId || "")
      setScholarshipType(scholarship.scholarshipType || null)
      setScholarshipValue(scholarship.scholarshipValue?.toString() || "")
    } else {
      setTuitionTypeId("")
      setScholarshipType(null)
      setScholarshipValue("")
    }
  }, [scholarship, open])

  const loadTuitionTypes = async () => {
    try {
      const types = await api.billing.getTuitionTypes()
      setTuitionTypes(types || [])
      // If no tuition type selected and types exist, select the first one
      if (!scholarship?.tuitionTypeId && types.length > 0) {
        setTuitionTypeId(types[0].id)
      }
    } catch (error) {
      console.error("Error loading tuition types:", error)
    }
  }

  const handleSave = async () => {
    if (!student) return

    const value = scholarshipValue ? parseFloat(scholarshipValue) : null
    if (scholarshipValue && (isNaN(value!) || value! < 0)) {
      toast.error("Scholarship value must be a non-negative number")
      return
    }

    if (scholarshipType === 'percentage' && value !== null && (value < 0 || value > 100)) {
      toast.error("Percentage must be between 0 and 100")
      return
    }

    try {
      setLoading(true)
      const data: {
        tuitionTypeId?: string
        scholarshipType?: 'percentage' | 'fixed' | null
        scholarshipValue?: number | null
      } = {}

      if (tuitionTypeId) {
        data.tuitionTypeId = tuitionTypeId
      }

      if (scholarshipType && value !== null) {
        data.scholarshipType = scholarshipType
        data.scholarshipValue = value
      } else {
        data.scholarshipType = null
        data.scholarshipValue = null
      }

      if (scholarship?.id) {
        await api.billing.updateStudentScholarship(student.id, data)
        toast.success("Scholarship updated successfully")
      } else {
        await api.billing.createStudentScholarship(student.id, data)
        toast.success("Scholarship created successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save scholarship"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {scholarship?.id ? t("billing.editScholarship") : t("billing.createScholarship")}
          </DialogTitle>
          <DialogDescription>
            {student && t("billing.configureScholarshipFor", { studentName: `${student.firstName} ${student.lastName}` })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Field>
            <FieldLabel>
              {t("billing.tuitionType")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={tuitionTypeId}
              onValueChange={setTuitionTypeId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("billing.selectTuitionType")} />
              </SelectTrigger>
              <SelectContent>
                {tuitionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(type.baseAmount)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("billing.scholarshipType")}</FieldLabel>
            <Select
              value={scholarshipType || "none"}
              onValueChange={(value) => setScholarshipType(value === "none" ? null : (value as 'percentage' | 'fixed'))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("billing.noScholarship")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("billing.noScholarship")}</SelectItem>
                <SelectItem value="percentage">{t("billing.percentage")}</SelectItem>
                <SelectItem value="fixed">{t("billing.fixedAmount")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {scholarshipType && (
            <Field>
              <FieldLabel>
                {t("billing.scholarshipValue")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={scholarshipType === 'percentage' ? "100" : undefined}
                value={scholarshipValue}
                onChange={(e) => setScholarshipValue(e.target.value)}
                placeholder={scholarshipType === 'percentage' ? "10" : "100.00"}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {scholarshipType === 'percentage'
                  ? t("billing.percentageDiscountExample")
                  : t("billing.fixedAmountDiscountExample")}
              </p>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("billing.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading || !tuitionTypeId}>
            {loading ? t("billing.saving") : t("billing.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
