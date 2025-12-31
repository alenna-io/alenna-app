import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { BackButton } from "@/components/ui/back-button"
import { Settings, Plus, Trash2, Edit } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TuitionType {
  id: string
  name: string
  baseAmount: number
  currency: string
  lateFeeType: 'fixed' | 'percentage'
  lateFeeValue: number
  displayOrder: number
}

export default function BillingConfigPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [config, setConfig] = React.useState<{
    id?: string
    dueDay: string
  }>({
    dueDay: "5",
  })
  const [tuitionTypes, setTuitionTypes] = React.useState<TuitionType[]>([])
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<TuitionType | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    baseAmount: "",
    currency: "USD",
    lateFeeType: "percentage" as 'fixed' | 'percentage',
    lateFeeValue: "",
    displayOrder: "0",
  })

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [configData, typesData] = await Promise.all([
        api.billing.getTuitionConfig().catch(() => null),
        api.billing.getTuitionTypes().catch(() => []),
      ])

      if (configData) {
        setConfig({
          id: configData.id,
          dueDay: configData.dueDay?.toString() || "5",
        })
      }

      setTuitionTypes(typesData || [])
    } catch (error: any) {
      console.log("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()

    const dueDay = parseInt(config.dueDay)

    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      toast.error("Due day must be between 1 and 31")
      return
    }

    try {
      setSaving(true)
      if (config.id) {
        await api.billing.updateTuitionConfig(config.id, {
          dueDay: dueDay,
        })
      } else {
        await api.billing.createTuitionConfig({
          dueDay: dueDay,
        })
      }
      toast.success("Configuration saved successfully")
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEditDialog = (type?: TuitionType) => {
    if (type) {
      setSelectedType(type)
      setFormData({
        name: type.name,
        baseAmount: type.baseAmount.toString(),
        currency: type.currency,
        lateFeeType: type.lateFeeType,
        lateFeeValue: type.lateFeeValue.toString(),
        displayOrder: type.displayOrder.toString(),
      })
    } else {
      setSelectedType(null)
      setFormData({
        name: "",
        baseAmount: "",
        currency: "USD",
        lateFeeType: "percentage",
        lateFeeValue: "",
        displayOrder: "0",
      })
    }
    setEditDialogOpen(true)
  }

  const handleSaveType = async () => {
    const baseAmount = parseFloat(formData.baseAmount)
    const lateFeeValue = parseFloat(formData.lateFeeValue)
    const displayOrder = parseInt(formData.displayOrder)

    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    if (isNaN(baseAmount) || baseAmount < 0) {
      toast.error("Base amount must be a non-negative number")
      return
    }

    if (isNaN(lateFeeValue) || lateFeeValue < 0) {
      toast.error("Late fee value must be a non-negative number")
      return
    }

    if (formData.lateFeeType === 'percentage' && lateFeeValue > 100) {
      toast.error("Late fee percentage cannot exceed 100%")
      return
    }

    try {
      setSaving(true)
      if (selectedType) {
        await api.billing.updateTuitionType(selectedType.id, {
          name: formData.name,
          baseAmount: baseAmount,
          currency: formData.currency,
          lateFeeType: formData.lateFeeType,
          lateFeeValue: lateFeeValue,
          displayOrder: displayOrder,
        })
        toast.success("Tuition type updated successfully")
      } else {
        await api.billing.createTuitionType({
          name: formData.name,
          baseAmount: baseAmount,
          currency: formData.currency,
          lateFeeType: formData.lateFeeType,
          lateFeeValue: lateFeeValue,
          displayOrder: displayOrder,
        })
        toast.success("Tuition type created successfully")
      }
      setEditDialogOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to save tuition type")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteType = async () => {
    if (!selectedType) return

    try {
      setSaving(true)
      await api.billing.deleteTuitionType(selectedType.id)
      toast.success("Tuition type deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedType(null)
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tuition type")
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return <Loading variant="page" />
  }

  return (
    <div className="space-y-6">
      {/* Mobile-only back button */}
      <div className="md:hidden">
        <BackButton to="/billing">
          Back to Billing
        </BackButton>
      </div>

      <PageHeader
        icon={Settings}
        title={t("billing.configuration")}
        description={t("billing.configurationDescription")}
      />

      {/* Tuition Config */}
      <Card>
        <CardHeader>
          <CardTitle>{t("billing.paymentSettings")}</CardTitle>
          <CardDescription>
            {t("billing.paymentSettingsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig}>
            <FieldGroup>
              <Field>
                <FieldLabel>
                  {t("billing.dueDay")} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={config.dueDay}
                  onChange={(e) => setConfig({ ...config, dueDay: e.target.value })}
                  placeholder="5"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("billing.dueDayDescription")}
                </p>
              </Field>
            </FieldGroup>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={saving}>
                {saving ? t("billing.saving") : t("billing.saveConfiguration")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tuition Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("billing.tuitionTypes")}</CardTitle>
              <CardDescription>
                {t("billing.tuitionTypesDescription")}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t("billing.addTuitionType")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tuitionTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("billing.noTuitionTypes")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground first:px-6 text-sm">
                      {t("billing.name")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.baseAmount")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.lateFee")}
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-foreground text-sm">
                      {t("billing.displayOrder")}
                    </th>
                    <th className="h-14 px-4 text-right align-middle font-semibold text-foreground text-sm">
                      {t("billing.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tuitionTypes
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((type) => (
                      <tr key={type.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle first:px-6 font-medium">{type.name}</td>
                        <td className="p-4 align-middle">{formatCurrency(type.baseAmount)}</td>
                        <td className="p-4 align-middle">
                          {type.lateFeeType === 'fixed'
                            ? formatCurrency(type.lateFeeValue)
                            : `${type.lateFeeValue}%`}
                        </td>
                        <td className="p-4 align-middle">{type.displayOrder}</td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDialog(type)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedType(type)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? t("billing.editTuitionType") : t("billing.createTuitionType")}
            </DialogTitle>
            <DialogDescription>
              {selectedType
                ? t("billing.editTuitionTypeDescription")
                : t("billing.createTuitionTypeDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel>
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Elementary, High School"
                required
              />
            </Field>
            <Field>
              <FieldLabel>
                Base Amount <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.baseAmount}
                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                placeholder="1000.00"
                required
              />
            </Field>
            <Field>
              <FieldLabel>
                {t("billing.currency")}
              </FieldLabel>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                {t("billing.lateFeeType")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={formData.lateFeeType}
                onValueChange={(value: 'fixed' | 'percentage') => setFormData({ ...formData, lateFeeType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                {t("billing.lateFeeValue")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.lateFeeValue}
                onChange={(e) => setFormData({ ...formData, lateFeeValue: e.target.value })}
                placeholder={formData.lateFeeType === 'percentage' ? "5.00" : "50.00"}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.lateFeeType === 'percentage'
                  ? t("billing.percentageLateFeeExample")
                  : t("billing.fixedLateFeeExample")}
              </p>
            </Field>
            <Field>
              <FieldLabel>
                Display Order
              </FieldLabel>
              <Input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveType} disabled={saving}>
              {saving ? "Saving..." : selectedType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tuition Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedType?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteType} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
