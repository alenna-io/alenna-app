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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"

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
  taxableBillRequired?: boolean
}

interface RecurringCharge {
  id?: string
  description: string
  amount: string
  expiresAt: string
}

interface EditScholarshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  scholarship: Scholarship | null
  onSuccess: (updatedScholarship: Scholarship) => void
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
  const [taxableBillRequired, setTaxableBillRequired] = React.useState(false)
  const [tuitionTypes, setTuitionTypes] = React.useState<Array<{ id: string; name: string; baseAmount: number }>>([])
  const [recurringCharges, setRecurringCharges] = React.useState<RecurringCharge[]>([])
  const [existingChargeIds, setExistingChargeIds] = React.useState<Set<string>>(new Set())
  const api = useApi()
  const { t } = useTranslation()

  React.useEffect(() => {
    if (open) {
      loadTuitionTypes()
      if (student) {
        loadRecurringCharges()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student])

  React.useEffect(() => {
    if (scholarship) {
      setTuitionTypeId(scholarship.tuitionTypeId || "")
      setScholarshipType(scholarship.scholarshipType || null)
      setScholarshipValue(scholarship.scholarshipValue?.toString() || "")
      setTaxableBillRequired(scholarship.taxableBillRequired ?? false)
    } else {
      setTuitionTypeId("")
      setScholarshipType(null)
      setScholarshipValue("")
      setTaxableBillRequired(false)
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

  const loadRecurringCharges = async () => {
    if (!student) return
    try {
      const charges = await api.billing.getRecurringCharges(student.id)
      const formattedCharges = charges.map((charge: any) => ({
        id: charge.id,
        description: charge.description,
        amount: charge.amount.toString(),
        expiresAt: new Date(charge.expiresAt).toISOString().split('T')[0],
      }))
      setRecurringCharges(formattedCharges)
      setExistingChargeIds(new Set(charges.map((c: any) => c.id)))
    } catch (error) {
      console.error("Error loading recurring charges:", error)
    }
  }

  const addNewCharge = () => {
    const today = new Date()
    const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1))
    setRecurringCharges([
      ...recurringCharges,
      {
        description: "",
        amount: "",
        expiresAt: oneYearFromNow.toISOString().split('T')[0],
      },
    ])
  }

  const updateCharge = (index: number, field: keyof RecurringCharge, value: string) => {
    const updated = [...recurringCharges]
    updated[index] = { ...updated[index], [field]: value }
    setRecurringCharges(updated)
  }

  const removeCharge = (index: number) => {
    const updated = [...recurringCharges]
    updated.splice(index, 1)
    setRecurringCharges(updated)
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

      const apiData: {
        tuitionTypeId?: string
        scholarshipType?: 'percentage' | 'fixed'
        scholarshipValue?: number
        taxableBillRequired?: boolean
      } = {}

      if (tuitionTypeId) {
        apiData.tuitionTypeId = tuitionTypeId
      }
      if (scholarshipType && value !== null) {
        apiData.scholarshipType = scholarshipType
        apiData.scholarshipValue = value
      }
      apiData.taxableBillRequired = taxableBillRequired

      if (scholarship?.id) {
        await api.billing.updateStudentScholarship(student.id, apiData)
        toast.success("Scholarship updated successfully")
      } else {
        await api.billing.createStudentScholarship(student.id, apiData)
        toast.success("Scholarship created successfully")
      }

      // Save recurring charges
      for (const charge of recurringCharges) {
        // Validate charge
        if (!charge.description || !charge.amount || !charge.expiresAt) {
          continue // Skip invalid charges
        }

        const amount = parseFloat(charge.amount)
        if (isNaN(amount) || amount <= 0) {
          continue // Skip invalid amounts
        }

        const chargeData = {
          description: charge.description,
          amount,
          expiresAt: new Date(charge.expiresAt).toISOString(),
        }

        if (charge.id && existingChargeIds.has(charge.id)) {
          // Update existing charge
          await api.billing.updateRecurringCharge(student.id, charge.id, chargeData)
        } else if (!charge.id) {
          // Create new charge
          await api.billing.createRecurringCharge(student.id, chargeData)
        }
      }

      // Delete charges that were removed
      const currentChargeIds = new Set(recurringCharges.filter(c => c.id).map(c => c.id!))
      for (const existingId of existingChargeIds) {
        if (!currentChargeIds.has(existingId)) {
          await api.billing.deleteRecurringCharge(student.id, existingId)
        }
      }

      // Call onSuccess with the updated scholarship data
      const updatedScholarship: Scholarship = {
        id: scholarship?.id,
        tuitionTypeId: apiData.tuitionTypeId || null,
        scholarshipType: apiData.scholarshipType || null,
        scholarshipValue: apiData.scholarshipValue || null,
        taxableBillRequired: apiData.taxableBillRequired
      }
      onSuccess(updatedScholarship)
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save scholarship"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {scholarship?.id ? t("billing.editScholarship") : t("billing.updateStudenBillingConfig")}
          </DialogTitle>
          <DialogDescription>
            {student && t("billing.updateStudentBillingConfigFor", { studentName: `${student.firstName} ${student.lastName}` })}
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

          <Field>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="taxableBillRequired"
                checked={taxableBillRequired}
                onCheckedChange={(checked) => setTaxableBillRequired(checked === true)}
              />
              <FieldLabel htmlFor="taxableBillRequired" className="!mb-0 cursor-pointer">
                {t("billing.taxableBillRequired")}
              </FieldLabel>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("billing.taxableBillRequiredDescription")}
            </p>
          </Field>

          <div className="space-y-4 border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t("billing.recurringCharges")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("billing.recurringChargesDescription")}
                </p>
              </div>
            </div>

            {recurringCharges.map((charge, index) => (
              <div key={index} className="flex gap-2 items-end">
                <Field className="flex-1">
                  <FieldLabel>{t("billing.extraChargeDescription")}</FieldLabel>
                  <Input
                    value={charge.description}
                    onChange={(e) => updateCharge(index, "description", e.target.value)}
                    placeholder={t("billing.exampleExtraClasses")}
                    maxLength={100}
                  />
                </Field>
                <Field className="w-32">
                  <FieldLabel>{t("billing.amount")}</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charge.amount}
                    onChange={(e) => updateCharge(index, "amount", e.target.value)}
                    placeholder="50.00"
                  />
                </Field>
                <Field className="w-40">
                  <FieldLabel>{t("billing.expiresAt")}</FieldLabel>
                  <Input
                    type="date"
                    value={charge.expiresAt}
                    onChange={(e) => updateCharge(index, "expiresAt", e.target.value)}
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCharge(index)}
                  className="mb-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addNewCharge}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("billing.addRecurringCharge")}
            </Button>
          </div>
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
