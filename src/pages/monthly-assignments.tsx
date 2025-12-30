import * as React from "react"
import { Navigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Percent } from "lucide-react"
import { useApi } from "@/services/api"
import type { SchoolYear } from "@/services/api"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { MonthlyAssignmentsTable, type MonthlyAssignmentTemplate } from "@/components/monthly-assignments-table"
import { MonthlyAssignmentFormDialog } from "@/components/monthly-assignment-form-dialog"
import { useTranslation } from "react-i18next"
import { useUser } from "@/contexts/UserContext"


const QUARTERS = [
  { value: 'Q1' },
  { value: 'Q2' },
  { value: 'Q3' },
  { value: 'Q4' },
]

export default function MonthlyAssignmentsPage() {
  const api = useApi()
  const { t } = useTranslation()
  const { userInfo, isLoading: isLoadingUser } = useUser()

  // Check user roles
  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])
  const isSuperAdmin = hasRole('SUPERADMIN')
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('SCHOOL_ADMIN')

  const getQuarterLabel = (quarter: string) => {
    switch (quarter) {
      case 'Q1':
        return t("monthlyAssignments.quarterQ1")
      case 'Q2':
        return t("monthlyAssignments.quarterQ2")
      case 'Q3':
        return t("monthlyAssignments.quarterQ3")
      case 'Q4':
        return t("monthlyAssignments.quarterQ4")
      default:
        return quarter
    }
  }
  const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = React.useState<string>("")
  const [templates, setTemplates] = React.useState<MonthlyAssignmentTemplate[]>([])
  const [gradePercentages, setGradePercentages] = React.useState<Record<string, number>>({
    Q1: 0,
    Q2: 0,
    Q3: 0,
    Q4: 0,
  })
  const [loading, setLoading] = React.useState(true)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingAssignment, setEditingAssignment] = React.useState<MonthlyAssignmentTemplate | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState<MonthlyAssignmentTemplate | null>(null)

  // Load school years
  React.useEffect(() => {
    const loadSchoolYears = async () => {
      try {
        const years = await api.schoolYears.getAll()
        setSchoolYears(years)
        // Select active school year by default
        const activeYear = years.find((y: SchoolYear) => y.isActive)
        if (activeYear) {
          setSelectedSchoolYearId(activeYear.id)
        } else if (years.length > 0) {
          setSelectedSchoolYearId(years[0].id)
        }
      } catch (error) {
        console.error('Error loading school years:', error)
        toast.error(t("schoolYears.errorLoading"))
      } finally {
        setLoading(false)
      }
    }
    loadSchoolYears()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load templates and percentages when school year changes
  React.useEffect(() => {
    if (!selectedSchoolYearId) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [templatesData, percentagesData] = await Promise.all([
          api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId),
          api.schoolMonthlyAssignments.getGradePercentages(selectedSchoolYearId),
        ])
        setTemplates(templatesData)
        setGradePercentages(percentagesData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error(t("monthlyAssignments.errorLoading"))
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolYearId])

  const handleCreate = () => {
    setEditingAssignment(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (assignment: MonthlyAssignmentTemplate) => {
    setEditingAssignment(assignment)
    setIsDialogOpen(true)
  }

  const handleSave = async (formData: { name: string; quarter: string }) => {
    if (!selectedSchoolYearId) {
      toast.error(t("monthlyAssignments.selectSchoolYearError"))
      return
    }

    try {
      if (editingAssignment) {
        // Update existing assignment
        await api.schoolMonthlyAssignments.updateTemplate(editingAssignment.id, { name: formData.name.trim() })
        toast.success(t("monthlyAssignments.updatedSuccess"))
      } else {
        // Create new assignment
        const result = await api.schoolMonthlyAssignments.createTemplate({
          name: formData.name.trim(),
          quarter: formData.quarter,
          schoolYearId: selectedSchoolYearId,
        })
        toast.success(t("monthlyAssignments.createdSuccess", { count: result.studentsAffected }))
      }

      // Reload templates
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)
    } catch (error) {
      console.error('Error saving assignment:', error)
      toast.error(error instanceof Error ? error.message : t("monthlyAssignments.errorSaving"))
      throw error
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deleteDialog) return

    try {
      await api.schoolMonthlyAssignments.deleteTemplate(deleteDialog.id)
      toast.success(t("monthlyAssignments.deletedSuccess"))

      // Reload templates
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)

      setDeleteDialog(null)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : t("monthlyAssignments.errorDeleting"))
    }
  }

  const handleUpdatePercentage = async (quarter: string, percentage: number) => {
    if (!selectedSchoolYearId) return

    try {
      await api.schoolMonthlyAssignments.updateGradePercentage({
        schoolYearId: selectedSchoolYearId,
        quarter,
        percentage,
      })

      setGradePercentages(prev => ({ ...prev, [quarter]: percentage }))
      toast.success(t("monthlyAssignments.percentageUpdated", { quarter, percentage }))
    } catch (error) {
      console.error('Error updating percentage:', error)
      toast.error(error instanceof Error ? error.message : t("monthlyAssignments.errorUpdatingPercentage"))
    }
  }

  const selectedSchoolYear = schoolYears.find(y => y.id === selectedSchoolYearId)

  // Redirect super admins - they should not access monthly assignments page
  if (isSuperAdmin) {
    return <Navigate to="/users" replace />
  }

  if (isLoadingUser || (loading && !selectedSchoolYearId)) {
    return <Loading variant='card' />
  }

  // Check if user has permission (teachers and school admins only)
  if (!isTeacherOrAdmin && !isLoadingUser) {
    return <Navigate to="/404" replace />
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-page-entrance">
      {/* Header Section */}
      <Card className="card-soft p-4 md:p-6 animate-fade-in-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-xl font-bold text-foreground">{t("monthlyAssignments.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("monthlyAssignments.description")}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm font-medium text-muted-foreground">{t("common.schoolYear")}:</span>
              <Select value={selectedSchoolYearId} onValueChange={setSelectedSchoolYearId}>
                <SelectTrigger className="w-full sm:w-[220px] cursor-pointer h-9 bg-card border border-input">
                  <SelectValue placeholder={t("projections.selectSchoolYear")}>
                    {selectedSchoolYear ? (
                      <span className="flex items-center gap-2 truncate">
                        <span className="truncate">{selectedSchoolYear.name}</span>
                        {selectedSchoolYear.isActive && (
                          <Badge variant="status-active" className="shrink-0 text-xs">{t("projections.active")}</Badge>
                        )}
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isActive && <Badge variant="status-active" className="ml-2">{t("projections.active")}</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {selectedSchoolYearId && (
        <>
          {/* Grade Percentages Card */}
          <Card className="card-soft p-5 md:p-6 animate-fade-in-soft">
            <div className="flex items-center gap-2 mb-6">
              <Percent className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("monthlyAssignments.gradePercentageTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("monthlyAssignments.gradePercentageDescription")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUARTERS.map(quarter => {
                const percentage = gradePercentages[quarter.value] || 0
                return (
                  <div
                    key={quarter.value}
                    className="relative bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors"
                  >
                    <label className="block text-sm font-semibold text-foreground">
                      {getQuarterLabel(quarter.value)}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          setGradePercentages(prev => ({ ...prev, [quarter.value]: value }))
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value) || 0
                          handleUpdatePercentage(quarter.value, value)
                        }}
                        className="h-14 w-full text-center px-4 text-lg font-bold bg-white border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary-soft focus:bg-white text-foreground tabular-nums"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                    {percentage > 0 && (
                      <div className="text-xs text-muted-foreground text-center">
                        {percentage}% of total grade
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Assignments Section */}
          <div className="space-y-4 animate-fade-in-soft">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                {t("monthlyAssignments.tableTitle")}
              </h2>
              <Button
                onClick={handleCreate}
                className="cursor-pointer w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("monthlyAssignments.newAssignment")}
              </Button>
            </div>
            <MonthlyAssignmentsTable
              assignments={templates}
              onEdit={handleEdit}
              onDelete={(assignment) => setDeleteDialog(assignment)}
              canEdit={true}
              canDelete={true}
            />
          </div>
        </>
      )}

      {/* Assignment Form Dialog */}
      {selectedSchoolYearId && (
        <MonthlyAssignmentFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingAssignment(null)
            }
          }}
          assignment={editingAssignment}
          schoolYearName={selectedSchoolYear?.name}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title={t("monthlyAssignments.deleteTitle")}
        message={deleteDialog ? t("monthlyAssignments.deleteConfirm", { name: deleteDialog.name }) : ""}
        confirmText={t("common.deleteAction")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteAssignment}
      />
    </div>
  )
}

