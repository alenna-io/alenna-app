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
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import { Plus, X, Calculator } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BillingRecord {
  id: string
  studentName?: string
  billingMonth: number
  billingYear: number
  effectiveTuitionAmount: number
  scholarshipAmount: number
  discountAdjustments: Array<{ type: 'percentage' | 'fixed'; value: number; description?: string }>
  extraCharges: Array<{ amount: number; description?: string }>
  lateFeeAmount: number
  finalAmount: number
  paidAmount?: number | null
  paymentStatus: 'pending' | 'delayed' | 'partial_payment' | 'paid'
  tuitionTypeSnapshot: {
    lateFeeType: 'fixed' | 'percentage'
    lateFeeValue: number
  }
  dueDate: string
  isLocked: boolean
}

interface EditBillingRecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: BillingRecord | null
  onSuccess: () => void
}

export function EditBillingRecordDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: EditBillingRecordDialogProps) {
  const { t } = useTranslation()
  const api = useApi()
  const [loading, setLoading] = React.useState(false)

  const [effectiveTuitionAmount, setEffectiveTuitionAmount] = React.useState("")
  const [discountAdjustments, setDiscountAdjustments] = React.useState<Array<{ type: 'percentage' | 'fixed'; value: string; description: string }>>([])
  const [extraCharges, setExtraCharges] = React.useState<Array<{ amount: string; description: string }>>([])

  React.useEffect(() => {
    if (record && open) {
      setEffectiveTuitionAmount(record.effectiveTuitionAmount.toString())
      setDiscountAdjustments(
        record.discountAdjustments.map(adj => ({
          type: adj.type,
          value: adj.value.toString(),
          description: adj.description || "",
        }))
      )
      setExtraCharges(
        record.extraCharges.map(charge => ({
          amount: charge.amount.toString(),
          description: charge.description || "",
        }))
      )
    }
  }, [record, open])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const calculateFinalAmount = () => {
    if (!record) return 0

    const tuition = parseFloat(effectiveTuitionAmount) || 0
    const scholarship = record.scholarshipAmount || 0

    // Calculate discount amount
    const discountAmount = discountAdjustments.reduce((sum, adj) => {
      const value = parseFloat(adj.value) || 0
      if (adj.type === 'percentage') {
        return sum + (tuition - scholarship) * (value / 100)
      }
      return sum + value
    }, 0)

    // Calculate extra charges
    const extraAmount = extraCharges.reduce((sum, charge) => {
      return sum + (parseFloat(charge.amount) || 0)
    }, 0)

    const amountAfterDiscounts = tuition - scholarship - discountAmount
    const finalAmount = amountAfterDiscounts + extraAmount + record.lateFeeAmount

    return finalAmount
  }

  const addDiscount = () => {
    setDiscountAdjustments([...discountAdjustments, { type: 'fixed', value: "", description: "" }])
  }

  const removeDiscount = (index: number) => {
    setDiscountAdjustments(discountAdjustments.filter((_, i) => i !== index))
  }

  const updateDiscount = (index: number, field: 'type' | 'value' | 'description', value: string) => {
    const updated = [...discountAdjustments]
    updated[index] = { ...updated[index], [field]: value }
    setDiscountAdjustments(updated)
  }

  const addExtraCharge = () => {
    setExtraCharges([...extraCharges, { amount: "", description: "" }])
  }

  const removeExtraCharge = (index: number) => {
    setExtraCharges(extraCharges.filter((_, i) => i !== index))
  }

  const updateExtraCharge = (index: number, field: 'amount' | 'description', value: string) => {
    const updated = [...extraCharges]
    updated[index] = { ...updated[index], [field]: value }
    setExtraCharges(updated)
  }

  const handleSave = async () => {
    if (!record) return

    if (record.isLocked) {
      toast.error(t("billing.cannotEditLockedRecord") || "Cannot edit a locked billing record")
      return
    }

    if (record.paymentStatus === 'paid') {
      toast.error(t("billing.cannotEditPaidRecord") || "Cannot edit a paid billing record")
      return
    }

    const tuition = parseFloat(effectiveTuitionAmount)
    if (isNaN(tuition) || tuition < 0) {
      toast.error(t("billing.invalidTuitionAmount") || "Invalid tuition amount")
      return
    }

    // Validate discounts
    for (const adj of discountAdjustments) {
      const value = parseFloat(adj.value)
      if (isNaN(value) || value < 0) {
        toast.error(t("billing.invalidDiscountValue") || "Invalid discount value")
        return
      }
      if (adj.type === 'percentage' && value > 100) {
        toast.error(t("billing.discountPercentageExceeds100") || "Discount percentage cannot exceed 100%")
        return
      }
    }

    // Validate extra charges
    for (const charge of extraCharges) {
      const amount = parseFloat(charge.amount)
      if (isNaN(amount) || amount < 0) {
        toast.error(t("billing.invalidExtraChargeAmount") || "Invalid extra charge amount")
        return
      }
    }

    try {
      setLoading(true)
      console.log('[EditBillingRecordDialog] Updating record:', record.id)
      console.log('[EditBillingRecordDialog] Record student name:', record.studentName)
      console.log('[EditBillingRecordDialog] Discount adjustments:', discountAdjustments)
      console.log('[EditBillingRecordDialog] Extra charges:', extraCharges)
      
      await api.billing.update(record.id, {
        effectiveTuitionAmount: tuition,
        discountAdjustments: discountAdjustments.map(adj => ({
          type: adj.type,
          value: parseFloat(adj.value) || 0,
          description: adj.description || undefined,
        })),
        extraCharges: extraCharges.map(charge => ({
          amount: parseFloat(charge.amount) || 0,
          description: charge.description || undefined,
        })),
      })
      console.log('[EditBillingRecordDialog] Update successful')
      toast.success(t("billing.recordUpdated") || "Billing record updated successfully")
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      console.error('[EditBillingRecordDialog] Update failed:', error)
      const errorMessage = error instanceof Error ? error.message : t("billing.failedToUpdateRecord") || "Failed to update billing record"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!record) return null

  const finalAmount = calculateFinalAmount()
  const paidAmount = record.paidAmount ?? 0
  const remainingAmount = finalAmount - paidAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("billing.editBillingRecord") || "Edit Billing Record"}</DialogTitle>
          <DialogDescription>
            {t("billing.editBillingRecordDescription", {
              studentName: record.studentName,
              month: `${record.billingMonth}/${record.billingYear}`,
            }) || `Edit billing record for ${record.studentName} (${record.billingMonth}/${record.billingYear})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Card */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{t("billing.summary") || "Summary"}</h3>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">{t("billing.tuitionAmount") || "Tuition Amount"}</div>
                <div className="font-semibold">{formatCurrency(parseFloat(effectiveTuitionAmount) || 0)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("billing.scholarshipAmount") || "Scholarship"}</div>
                <div className="font-semibold text-green-600">-{formatCurrency(record.scholarshipAmount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("billing.totalDiscounts") || "Total Discounts"}</div>
                <div className="font-semibold text-green-600">
                  -{formatCurrency(
                    discountAdjustments.reduce((sum, adj) => {
                      const value = parseFloat(adj.value) || 0
                      if (adj.type === 'percentage') {
                        return sum + (parseFloat(effectiveTuitionAmount) || 0 - record.scholarshipAmount) * (value / 100)
                      }
                      return sum + value
                    }, 0)
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("billing.totalExtraCharges") || "Extra Charges"}</div>
                <div className="font-semibold text-orange-600">
                  +{formatCurrency(
                    extraCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0)
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("billing.lateFee") || "Late Fee"}</div>
                <div className="font-semibold text-red-600">+{formatCurrency(record.lateFeeAmount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("billing.finalAmount") || "Final Amount"}</div>
                <div className="font-semibold text-lg">{formatCurrency(finalAmount)}</div>
              </div>
              {paidAmount > 0 && (
                <>
                  <div>
                    <div className="text-muted-foreground">{t("billing.paidAmount") || "Paid Amount"}</div>
                    <div className="font-semibold text-blue-600">{formatCurrency(paidAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("billing.remainingAmount") || "Remaining"}</div>
                    <div className="font-semibold">{formatCurrency(remainingAmount)}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>{t("billing.effectiveTuitionAmount") || "Effective Tuition Amount"} *</FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={effectiveTuitionAmount}
                onChange={(e) => setEffectiveTuitionAmount(e.target.value)}
                disabled={loading || record.paymentStatus === 'paid'}
              />
            </Field>

            {/* Discounts Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>{t("billing.discounts") || "Discounts"}</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDiscount}
                  disabled={loading || record.paymentStatus === 'paid'}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("billing.addDiscount") || "Add Discount"}
                </Button>
              </div>
              {discountAdjustments.map((adj, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-background">
                  <Select
                    value={adj.type}
                    onValueChange={(value) => updateDiscount(index, 'type', value)}
                    disabled={loading || record.paymentStatus === 'paid'}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{t("billing.fixed") || "Fixed"}</SelectItem>
                      <SelectItem value="percentage">{t("billing.percentage") || "Percentage"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={adj.type === 'percentage' ? "5.00" : "100.00"}
                    value={adj.value}
                    onChange={(e) => updateDiscount(index, 'value', e.target.value)}
                    disabled={loading || record.paymentStatus === 'paid'}
                    className="flex-1"
                  />
                  {adj.type === 'percentage' && (
                    <Badge variant="secondary" className="self-center">%</Badge>
                  )}
                  <Input
                    type="text"
                    placeholder={t("billing.description") || "Description (optional)"}
                    value={adj.description}
                    onChange={(e) => updateDiscount(index, 'description', e.target.value)}
                    disabled={loading || record.paymentStatus === 'paid'}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiscount(index)}
                    disabled={loading || record.paymentStatus === 'paid'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Extra Charges Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>{t("billing.extraCharges") || "Extra Charges"}</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExtraCharge}
                  disabled={loading || record.paymentStatus === 'paid'}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("billing.addExtraCharge") || "Add Extra Charge"}
                </Button>
              </div>
              {extraCharges.map((charge, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-background">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    value={charge.amount}
                    onChange={(e) => updateExtraCharge(index, 'amount', e.target.value)}
                    disabled={loading || record.paymentStatus === 'paid'}
                    className="w-32"
                  />
                  <Input
                    type="text"
                    placeholder={t("billing.description") || "Description (optional)"}
                    value={charge.description}
                    onChange={(e) => updateExtraCharge(index, 'description', e.target.value)}
                    disabled={loading || record.paymentStatus === 'paid'}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExtraCharge(index)}
                    disabled={loading || record.paymentStatus === 'paid'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={loading || record.isLocked || record.paymentStatus === 'paid'}>
            {loading ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

