import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { PageHeader } from "@/components/ui/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Plus, Percent } from "lucide-react"
import { useApi } from "@/services/api"
import type { SchoolYear } from "@/services/api"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { MonthlyAssignmentsTable, type MonthlyAssignmentTemplate } from "@/components/monthly-assignments-table"
import { MonthlyAssignmentFormDialog } from "@/components/monthly-assignment-form-dialog"

const QUARTERS = [
  { value: 'Q1', label: 'Bloque 1 (Q1)' },
  { value: 'Q2', label: 'Bloque 2 (Q2)' },
  { value: 'Q3', label: 'Bloque 3 (Q3)' },
  { value: 'Q4', label: 'Bloque 4 (Q4)' },
]

export default function MonthlyAssignmentsPage() {
  const api = useApi()
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
        toast.error('Error al cargar años escolares')
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
        toast.error('Error al cargar asignaciones mensuales')
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
      toast.error('Por favor selecciona un año escolar')
      return
    }

    try {
      if (editingAssignment) {
        // Update existing assignment
        await api.schoolMonthlyAssignments.updateTemplate(editingAssignment.id, { name: formData.name.trim() })
        toast.success('Asignación actualizada exitosamente')
      } else {
        // Create new assignment
        const result = await api.schoolMonthlyAssignments.createTemplate({
          name: formData.name.trim(),
          quarter: formData.quarter,
          schoolYearId: selectedSchoolYearId,
        })
        toast.success(`Asignación creada exitosamente. Aplicada a ${result.studentsAffected} estudiantes.`)
      }

      // Reload templates
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)
    } catch (error) {
      console.error('Error saving assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar asignación')
      throw error
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deleteDialog) return

    try {
      await api.schoolMonthlyAssignments.deleteTemplate(deleteDialog.id)
      toast.success('Asignación eliminada exitosamente')

      // Reload templates
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)

      setDeleteDialog(null)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar asignación')
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
      toast.success(`Porcentaje de ${quarter} actualizado a ${percentage}%`)
    } catch (error) {
      console.error('Error updating percentage:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar porcentaje')
    }
  }

  const selectedSchoolYear = schoolYears.find(y => y.id === selectedSchoolYearId)

  if (loading && !selectedSchoolYearId) {
    return <Loading message="Cargando asignaciones mensuales..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asignaciones Mensuales"
        description="Gestiona las asignaciones mensuales que se aplican a todos los estudiantes por trimestre"
      />

      {/* School Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Año Escolar</CardTitle>
          <CardDescription>Selecciona el año escolar para gestionar asignaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSchoolYearId} onValueChange={setSelectedSchoolYearId}>
            <SelectTrigger className="w-full md:w-[300px] [&>span]:!line-clamp-none">
              <SelectValue placeholder="Selecciona un año escolar">
                {selectedSchoolYear ? (
                  <span className="flex items-center gap-2">
                    <span>{selectedSchoolYear.name}</span>
                    {selectedSchoolYear.isActive && <Badge className="shrink-0">Activo</Badge>}
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map(year => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.isActive && <Badge className="ml-2">Activo</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSchoolYearId && (
        <>
          {/* Grade Percentages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Porcentaje de Calificación por Trimestre
              </CardTitle>
              <CardDescription>
                Define qué porcentaje de la calificación total representa las asignaciones mensuales en cada trimestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {QUARTERS.map(quarter => (
                    <Field key={quarter.value}>
                      <FieldLabel>{quarter.label}</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={gradePercentages[quarter.value] || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            setGradePercentages(prev => ({ ...prev, [quarter.value]: value }))
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0
                            handleUpdatePercentage(quarter.value, value)
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground self-center">%</span>
                      </div>
                    </Field>
                  ))}
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Asignaciones Mensuales</h2>
              <p className="text-sm text-muted-foreground">
                Gestiona las asignaciones mensuales para el año escolar "{selectedSchoolYear?.name}"
              </p>
            </div>
            <Button onClick={handleCreate} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asignación
            </Button>
          </div>

          <MonthlyAssignmentsTable
            assignments={templates}
            onEdit={handleEdit}
            onDelete={(assignment) => setDeleteDialog(assignment)}
            canEdit={true}
            canDelete={true}
          />
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
        title="Eliminar Asignación"
        message={deleteDialog ? `¿Estás seguro de que deseas eliminar "${deleteDialog.name}"?\n\nEsta acción eliminará la asignación para todos los estudiantes y no se puede deshacer.` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteAssignment}
      />
    </div>
  )
}

