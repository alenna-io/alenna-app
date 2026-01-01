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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"

interface BillingRecord {
  id: string
  finalAmount: number
  paidAmount?: number | null
  effectiveTuitionAmount: number
  scholarshipAmount: number
  discountAdjustments: Array<{ type: 'percentage' | 'fixed'; value: number; description?: string }>
  extraCharges: Array<{ amount: number; description?: string }>
  lateFeeAmount: number
  dueDate: string
  isPaid: boolean
  billStatus: 'not_required' | 'required' | 'sent'
  paymentStatus: 'pending' | 'delayed' | 'partial_payment' | 'paid'
  tuitionTypeSnapshot: {
    lateFeeType: 'fixed' | 'percentage'
    lateFeeValue: number
  }
}

interface PartialPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: BillingRecord | null
  onSuccess: () => void
}

export function PartialPaymentDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: PartialPaymentDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState<'manual' | 'online' | 'other'>('manual')
  const [paymentNote, setPaymentNote] = React.useState("")
  const api = useApi()
  const { t } = useTranslation()

  React.useEffect(() => {
    if (open && record) {
      setAmount("")
      setPaymentMethod('manual')
      setPaymentNote("")
    }
  }, [open, record])

  if (!record) return null

  // Calculate the actual final amount including pending late fees
  const calculateFinalAmount = () => {
    const discountAmount = record.discountAdjustments.reduce((sum, adj) => {
      if (adj.type === 'percentage') {
        return sum + (record.effectiveTuitionAmount - record.scholarshipAmount) * (adj.value / 100)
      }
      return sum + adj.value
    }, 0)
    const extraAmount = record.extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
    const appliedLateFee = record.lateFeeAmount

    const dueDate = new Date(record.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    const isOverdue = today > dueDate
    const hasPendingLateFee = isOverdue && !record.isPaid && record.billStatus !== 'not_required' && appliedLateFee === 0

    let pendingLateFee = 0
    if (hasPendingLateFee) {
      const amountAfterDiscounts = record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount
      if (record.tuitionTypeSnapshot.lateFeeType === 'fixed') {
        pendingLateFee = record.tuitionTypeSnapshot.lateFeeValue
      } else {
        pendingLateFee = amountAfterDiscounts * (record.tuitionTypeSnapshot.lateFeeValue / 100)
      }
    }

    return record.effectiveTuitionAmount - record.scholarshipAmount - discountAmount + extraAmount + appliedLateFee + pendingLateFee
  }

  const actualFinalAmount = calculateFinalAmount()
  const paidAmt = record.paidAmount ?? 0
  const remainingAmount = actualFinalAmount - paidAmt
  const maxAmount = remainingAmount

  const handleSave = async () => {
    if (!record) return

    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error(t("billing.invalidAmount"))
      return
    }

    if (paymentAmount > maxAmount) {
      toast.error(t("billing.amountExceedsRemaining", { remaining: maxAmount.toFixed(2) }))
      return
    }

    try {
      setLoading(true)
      await api.billing.recordPartialPayment(record.id, {
        amount: paymentAmount,
        paymentMethod,
        paymentNote: paymentNote || undefined,
      })
      toast.success(t("billing.partialPaymentRecorded"))
      onOpenChange(false)
      // Call onSuccess to update parent state optimistically
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("billing.failedToRecordPartialPayment")
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("billing.addPartialPayment")}</DialogTitle>
          <DialogDescription>
            {t("billing.addPartialPaymentDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">{t("billing.finalAmount")}</div>
              <div className="text-lg font-semibold">{formatCurrency(actualFinalAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("billing.paidAmount")}</div>
              <div className="text-lg font-semibold">{formatCurrency(paidAmt)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("billing.remainingAmount")}</div>
              <div className="text-lg font-semibold text-primary">{formatCurrency(remainingAmount)}</div>
            </div>
          </div>

          <Field>
            <FieldLabel>
              {t("billing.partialPaymentAmount")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={formatCurrency(0)}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {t("billing.maxAmount", { amount: formatCurrency(maxAmount) })}
            </p>
          </Field>

          <Field>
            <FieldLabel>
              {t("billing.paymentMethod")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'manual' | 'online' | 'other')}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">{t("billing.manual")}</SelectItem>
                <SelectItem value="online">{t("billing.online")}</SelectItem>
                <SelectItem value="other">{t("billing.other")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("billing.paymentNote")}</FieldLabel>
            <Textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder={t("billing.paymentNotePlaceholder")}
              rows={3}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading || !amount || parseFloat(amount) <= 0}>
            {loading ? t("billing.recording") : t("billing.recordPayment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

