import * as React from "react"
import { useApi } from "@/services/api"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { BackButton } from "@/components/ui/back-button"
import { Plus, Trash2, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlennaTable, type AlennaTableColumn, type AlennaTableAction } from "@/components/ui/alenna-table"
import { usePersistedState } from "@/hooks/use-table-state"

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
  const tableId = "billing-config"
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
  const itemsPerPage = 10
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save configuration"
      toast.error(errorMessage)
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save tuition type"
      toast.error(errorMessage)
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete tuition type"
      toast.error(errorMessage)
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

  // Pagination
  const sortedTuitionTypes = React.useMemo(() => {
    return [...tuitionTypes].sort((a, b) => a.displayOrder - b.displayOrder)
  }, [tuitionTypes])

  const totalPages = Math.ceil(sortedTuitionTypes.length / itemsPerPage)
  const paginatedTuitionTypes = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedTuitionTypes.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedTuitionTypes, currentPage, itemsPerPage])

  const columns: AlennaTableColumn<TuitionType>[] = [
    {
      key: 'name',
      label: t("billing.name"),
      render: (type) => <div className="font-medium">{type.name}</div>
    },
    {
      key: 'baseAmount',
      label: t("billing.baseAmount"),
      render: (type) => formatCurrency(type.baseAmount)
    },
    {
      key: 'lateFee',
      label: t("billing.lateFee"),
      render: (type) => (
        type.lateFeeType === 'fixed'
          ? formatCurrency(type.lateFeeValue)
          : `${type.lateFeeValue}%`
      )
    },
    {
      key: 'displayOrder',
      label: t("billing.displayOrder"),
      render: (type) => type.displayOrder
    }
  ]

  const actions: AlennaTableAction<TuitionType>[] = [
    {
      label: t("billing.edit"),
      icon: <Edit className="h-4 w-4" />,
      onClick: (type) => handleOpenEditDialog(type)
    },
    {
      label: t("billing.delete"),
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: (type) => {
        setSelectedType(type)
        setDeleteDialogOpen(true)
      }
    }
  ]

  if (loading) {
    return <Loading variant="simple-page" />
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
        moduleKey="billing"
        title={t("billing.configuration")}
        description={t("billing.configurationDescription")}
      />

      {/* Tuition Config */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <form onSubmit={handleSaveConfig}>
            <div className="flex items-end gap-4">
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {t("billing.dueDay")} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={config.dueDay}
                  onChange={(e) => setConfig({ ...config, dueDay: e.target.value })}
                  placeholder="5"
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {t("billing.dueDayDescription")}
                </p>
              </div>
              <Button type="submit" disabled={saving} size="sm" className="shrink-0">
                {saving ? t("billing.saving") : t("billing.saveConfiguration")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tuition Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("billing.tuitionTypes")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("billing.tuitionTypesDescription")}
            </p>
          </div>
          <Button onClick={() => handleOpenEditDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t("billing.addTuitionType")}
          </Button>
        </div>
        <AlennaTable
          columns={columns}
          data={paginatedTuitionTypes}
          actions={actions}
          pagination={{
            currentPage,
            totalPages,
            totalItems: sortedTuitionTypes.length,
            pageSize: itemsPerPage,
            onPageChange: setCurrentPage
          }}
          tableId={tableId}
          emptyState={{
            message: t("billing.noTuitionTypes")
          }}
          getRowId={(type) => type.id}
        />
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl">
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
                {t("billing.name")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("billing.namePlaceholder")}
                required
              />
            </Field>
            <Field>
              <FieldLabel>
                {t("billing.baseAmount")} <span className="text-destructive">*</span>
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
                  <SelectItem value="percentage">{t("billing.percentage")}</SelectItem>
                  <SelectItem value="fixed">{t("billing.fixedAmount")}</SelectItem>
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
                {t("billing.displayOrder")}
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveType} disabled={saving}>
              {saving ? t("common.saving") : selectedType ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("billing.deleteTuitionType")}</DialogTitle>
            <DialogDescription>
              {t("billing.deleteTuitionTypeConfirm", { name: selectedType?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteType} disabled={saving}>
              {saving ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
