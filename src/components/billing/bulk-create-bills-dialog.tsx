import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useApi } from "@/services/api"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import type { SchoolYear } from "@/services/api"

interface BulkCreateBillsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkCreateBillsDialog({ open, onOpenChange, onSuccess }: BulkCreateBillsDialogProps) {
  const api = useApi()
  const [loading, setLoading] = React.useState(false)
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string }>>([])
  const [loadingData, setLoadingData] = React.useState(true)

  const [formData, setFormData] = React.useState({
    schoolYearId: '',
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
  })

  React.useEffect(() => {
    if (open) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const yearsData = await api.schoolYears.getAll() as SchoolYear[]

      setSchoolYears(yearsData.map((y) => ({
        id: y.id,
        name: y.name,
      })))

      const activeYear = yearsData.find((y) => y.isActive)
      if (activeYear) {
        setFormData(prev => ({ ...prev, schoolYearId: activeYear.id }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.schoolYearId) {
      toast.error('Please select a school year')
      return
    }

    try {
      setLoading(true)
      const result = await api.billing.bulkCreate({
        schoolYearId: formData.schoolYearId,
        billingMonth: formData.billingMonth,
        billingYear: formData.billingYear,
      })

      toast.success(`Successfully created ${result.count} bills`)
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bills'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: 1, label: '01' },
    { value: 2, label: '02' },
    { value: 3, label: '03' },
    { value: 4, label: '04' },
    { value: 5, label: '05' },
    { value: 6, label: '06' },
    { value: 7, label: '07' },
    { value: 8, label: '08' },
    { value: 9, label: '09' },
    { value: 10, label: '10' },
    { value: 11, label: '11' },
    { value: 12, label: '12' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Generate Bills</DialogTitle>
          <DialogDescription>
            Generate bills for all students in the selected month and year
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <Loading variant="section" />
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>School Year *</FieldLabel>
                <Select
                  value={formData.schoolYearId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, schoolYearId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school year" />
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

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Month *</FieldLabel>
                  <Select
                    value={formData.billingMonth.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, billingMonth: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Year *</FieldLabel>
                  <Input
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.billingYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  />
                </Field>
              </div>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Bills'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

