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
import { useTranslation } from "react-i18next"
import { Loading } from "@/components/ui/loading"

interface CreateBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateBillDialog({ open, onOpenChange, onSuccess }: CreateBillDialogProps) {
  const { t } = useTranslation()
  const api = useApi()
  const [loading, setLoading] = React.useState(false)
  const [students, setStudents] = React.useState<Array<{ id: string; name: string }>>([])
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string }>>([])
  const [loadingData, setLoadingData] = React.useState(true)

  const [formData, setFormData] = React.useState({
    studentId: '',
    schoolYearId: '',
    billingMonth: new Date().getMonth() + 1,
    billingYear: new Date().getFullYear(),
    baseAmount: '',
  })

  React.useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [studentsData, yearsData] = await Promise.all([
        api.students.getAll(),
        api.schoolYears.getAll(),
      ])

      setStudents(studentsData.map((s: any) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
      })))

      setSchoolYears(yearsData.map((y: any) => ({
        id: y.id,
        name: y.name,
      })))

      const activeYear = yearsData.find((y: any) => y.isActive)
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

    if (!formData.studentId || !formData.schoolYearId) {
      toast.error('Please select a student and school year')
      return
    }

    try {
      setLoading(true)
      await api.billing.create({
        studentId: formData.studentId,
        schoolYearId: formData.schoolYearId,
        billingMonth: formData.billingMonth,
        billingYear: formData.billingYear,
        baseAmount: formData.baseAmount ? parseFloat(formData.baseAmount) : undefined,
      })

      toast.success('Bill created successfully')
      onSuccess()
      onOpenChange(false)
      setFormData({
        studentId: '',
        schoolYearId: '',
        billingMonth: new Date().getMonth() + 1,
        billingYear: new Date().getFullYear(),
        baseAmount: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Bill</DialogTitle>
          <DialogDescription>
            Create a billing record for a student
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <Loading variant="section" />
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Student *</FieldLabel>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

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

              <Field>
                <FieldLabel>Base Amount (Optional)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave empty to use tuition config"
                  value={formData.baseAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseAmount: e.target.value }))}
                />
              </Field>
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
                {loading ? 'Creating...' : 'Create Bill'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

