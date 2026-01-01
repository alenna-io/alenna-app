import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

interface PaymentHistoryEntry {
  date: string
  amount: number
  paymentMethod: 'manual' | 'online' | 'other'
  paymentNote?: string | null
  paidBy?: string
}

interface BillingRecord {
  id: string
  studentName?: string
  paidAmount?: number | null
  paymentStatus: 'pending' | 'delayed' | 'partial_payment' | 'paid'
  paidAt?: string | null
  paymentMethod?: 'manual' | 'online' | 'other' | null
  paymentNote?: string | null
  auditMetadata?: {
    paidBy?: string
    paidByName?: string
  }
  paymentTransactions?: Array<{
    id: string
    amount: number
    paymentMethod: 'manual' | 'online' | 'other'
    paymentNote?: string | null
    paidBy: string
    paidByName?: string
    paidAt: string
    createdAt: string
  }>
}

interface PaymentHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: BillingRecord | null
}

export function PaymentHistoryDialog({
  open,
  onOpenChange,
  record,
}: PaymentHistoryDialogProps) {
  const { t } = useTranslation()

  if (!record) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getPaymentMethodLabel = (method: string | null | undefined) => {
    switch (method) {
      case 'manual':
        return t("billing.manual")
      case 'online':
        return t("billing.online")
      case 'other':
        return t("billing.other")
      default:
        return t("billing.unknown")
    }
  }

  // Build payment history from payment transactions
  const paymentHistory: PaymentHistoryEntry[] = []

  if (record.paymentTransactions && record.paymentTransactions.length > 0) {
    // Use payment transactions from the database
    paymentHistory.push(...record.paymentTransactions.map(tx => ({
      date: tx.paidAt,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      paymentNote: tx.paymentNote,
      paidBy: tx.paidByName || tx.paidBy,
    })))
  } else {
    // Fallback to legacy data if no transactions exist yet
    if (record.paymentStatus === 'paid' && record.paidAt) {
      paymentHistory.push({
        date: record.paidAt,
        amount: record.paidAmount ?? 0,
        paymentMethod: record.paymentMethod ?? 'manual',
        paymentNote: record.paymentNote,
        paidBy: record.auditMetadata?.paidByName || record.auditMetadata?.paidBy,
      })
    } else if (record.paymentStatus === 'partial_payment' && record.paidAmount && record.paidAmount > 0) {
      paymentHistory.push({
        date: record.paidAt || new Date().toISOString(),
        amount: record.paidAmount,
        paymentMethod: record.paymentMethod ?? 'manual',
        paymentNote: record.paymentNote,
        paidBy: record.auditMetadata?.paidByName || record.auditMetadata?.paidBy,
      })
    }
  }

  // Sort by date (newest first)
  paymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("billing.paymentHistory")}</DialogTitle>
          <DialogDescription>
            {t("billing.paymentHistoryDescription", { studentName: record.studentName || t("billing.unknownStudent") })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("billing.noPaymentHistory")}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-lg">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(payment.date)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {t("billing.paymentMethod")}: {getPaymentMethodLabel(payment.paymentMethod)}
                      </span>
                      {payment.paidBy && (
                        <span>
                          {t("billing.paidBy")}: {payment.paidBy}
                        </span>
                      )}
                    </div>
                    {payment.paymentNote && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {t("billing.paymentNote")}: {payment.paymentNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {record.paymentStatus === 'partial_payment' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium">
                    {t("billing.totalPaid")}: {formatCurrency(record.paidAmount ?? 0)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

