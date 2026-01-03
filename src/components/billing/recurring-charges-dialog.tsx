import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"

export interface RecurringCharge {
  id?: string
  description: string
  amount: string
  expiresAt: string
}

interface RecurringChargesDialogProps {
  open: boolean
  studentId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function RecurringChargesDialog({
  open,
  studentId,
  onClose,
  onSuccess,
}: RecurringChargesDialogProps) {
  const api = useApi()
  const { t } = useTranslation()
  const [loading, setLoading] = React.useState(false)
  const [charges, setCharges] = React.useState<RecurringCharge[]>([])
  const [existingIds, setExistingIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (open && studentId) {
      loadCharges()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId])

  const loadCharges = async () => {
    if (!studentId) return
    try {
      const data = await api.billing.getRecurringCharges(studentId)
      setCharges(
        data.map((c: RecurringCharge) => ({
          id: c.id,
          description: c.description,
          amount: c.amount.toString(),
          expiresAt: c.expiresAt.split("T")[0],
        }))
      )
      setExistingIds(new Set(data.map((c: RecurringCharge) => c.id)))
    } catch {
      toast.error(t("billing.failedToLoadRecurringCharges"))
      console.error("Failed to load recurring charges")
    }
  }

  const updateCharge = (
    index: number,
    field: keyof RecurringCharge,
    value: string
  ) => {
    if (field === "description") {
      if (value.length > 100) {
        toast.error(t("common.descriptionTooLong", { max: 100 }))
        return
      }
    }
    if (field === "amount") {
      if (Number(value) < 0) {
        toast.error(t("billing.invalidExtraChargeAmount"))
        return
      }
    }
    if (field === "expiresAt") {
      if (new Date(value) < new Date()) {
        toast.error(t("billing.invalidExpiresAt"))
        return
      }
    }
    setCharges(prev =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  const addCharge = () => {
    if (loading) return
    if (charges.length >= 3) {
      toast.error(t("billing.maxRecurringChargesExceeded"))
      return
    }
    setCharges(prev => [
      ...prev,
      {
        description: "",
        amount: "",
        expiresAt: "",
      },
    ])
  }

  const removeCharge = (index: number) => {
    setCharges(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!studentId) return

    try {
      setLoading(true)

      for (const charge of charges) {
        const amount = Number(charge.amount)
        if (isNaN(amount) || amount <= 0) {
          toast.error(t("billing.invalidExtraChargeAmount"))
          return
        }

        const description = charge.description.trim()
        if (description.length < 3) {
          toast.error(t("common.descriptionTooShort", { min: 3 }))
          return
        }

        const expiresAt = new Date(charge.expiresAt)
        if (expiresAt < new Date()) {
          toast.error(t("billing.invalidExpiresAt"))
          return
        }

        if (
          amount == undefined
          || description == ""
          || description == undefined
          || expiresAt == undefined
        ) {
          toast.error(t("billing.invalidRecurringCharge"))
          return
        }

        const payload = {
          description: charge.description,
          amount,
          expiresAt: new Date(charge.expiresAt).toISOString(),
        }

        if (charge.id && existingIds.has(charge.id)) {
          await api.billing.updateRecurringCharge(studentId, charge.id, payload)
        } else if (!charge.id) {
          await api.billing.createRecurringCharge(studentId, payload)
        }
      }

      const currentIds = new Set(charges.filter(c => c.id).map(c => c.id!))
      for (const id of existingIds) {
        if (!currentIds.has(id)) {
          await api.billing.deleteRecurringCharge(studentId, id)
        }
      }

      toast.success(t("billing.recurringChargesSaved"))
      onSuccess()
      onClose()
    } catch {
      toast.error(t("billing.failedToSaveRecurringCharges"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className='mb-4'>
          <DialogTitle>{t("billing.recurringCharges")}</DialogTitle>
          <DialogDescription>{t("billing.recurringChargesDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {charges.map((charge, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <Field className="col-span-5">
                <FieldLabel>{t("billing.extraChargeDescription")}</FieldLabel>
                <Input
                  value={charge.description}
                  onChange={e => {
                    updateCharge(index, "description", e.target.value)
                  }}
                />
              </Field>

              <Field className="col-span-3">
                <FieldLabel>Amount</FieldLabel>
                <Input
                  type="number"
                  value={charge.amount}
                  onChange={e =>
                    updateCharge(index, "amount", e.target.value)
                  }
                />
              </Field>

              <Field className="col-span-3">
                <FieldLabel>Expires at</FieldLabel>
                <Input
                  type="date"
                  value={charge.expiresAt}
                  onChange={e =>
                    updateCharge(index, "expiresAt", e.target.value)
                  }
                />
              </Field>

              <Button
                variant="ghost"
                size="icon"
                className='hover:bg-red-100! hover:border-red-500! rounded-full'
                onClick={() => removeCharge(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
              </Button>
            </div>
          ))}

          <Button
            variant="default"
            onClick={addCharge}
            disabled={loading || charges.length >= 3}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("billing.addRecurringCharge")}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading || charges.length === 0}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
