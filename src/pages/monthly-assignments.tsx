import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { PageHeader } from "@/components/ui/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit } from "lucide-react"
import { useApi } from "@/services/api"
import type { SchoolYear } from "@/services/api"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"

interface MonthlyAssignmentTemplate {
  id: string
  name: string
  quarter: string
  schoolYearId: string
  hasGrades: boolean
  createdAt: string
  updatedAt: string
}

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
  const [saving, setSaving] = React.useState(false)

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [selectedQuarter, setSelectedQuarter] = React.useState<string>("")
  const [newAssignmentName, setNewAssignmentName] = React.useState("")
  const [editDialog, setEditDialog] = React.useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = React.useState("")
  const [deleteDialog, setDeleteDialog] = React.useState<{ id: string; name: string } | null>(null)

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

  const handleAddAssignment = async () => {
    if (!newAssignmentName.trim() || !selectedQuarter || !selectedSchoolYearId) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const assignmentName = newAssignmentName.trim()
    const quarter = selectedQuarter

    // OPTIMISTIC UPDATE: Immediately add the new assignment to the UI
    const optimisticTemplate: MonthlyAssignmentTemplate = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: assignmentName,
      quarter: quarter,
      schoolYearId: selectedSchoolYearId,
      hasGrades: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTemplates(prev => [...prev, optimisticTemplate])

    // Close dialog and reset form immediately
    setAddDialogOpen(false)
    setNewAssignmentName("")
    setSelectedQuarter("")

    try {
      setSaving(true)
      const result = await api.schoolMonthlyAssignments.createTemplate({
        name: assignmentName,
        quarter: quarter,
        schoolYearId: selectedSchoolYearId,
      })

      toast.success(`Asignación creada exitosamente. Aplicada a ${result.studentsAffected} estudiantes.`)

      // Reload templates to get the real data from server
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear asignación')
      // ROLLBACK: Remove the optimistic template on error
      setTemplates(prev => prev.filter(t => t.id !== optimisticTemplate.id))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAssignment = async () => {
    if (!editDialog || !editName.trim()) {
      toast.error('El nombre de la asignación es requerido')
      return
    }

    try {
      setSaving(true)
      await api.schoolMonthlyAssignments.updateTemplate(editDialog.id, { name: editName.trim() })
      toast.success('Asignación actualizada exitosamente')

      // Reload templates
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)

      setEditDialog(null)
      setEditName("")
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar asignación')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deleteDialog) return

    try {
      setSaving(true)
      await api.schoolMonthlyAssignments.deleteTemplate(deleteDialog.id)
      toast.success('Asignación eliminada exitosamente')

      // Reload templates
      const updatedTemplates = await api.schoolMonthlyAssignments.getTemplates(selectedSchoolYearId)
      setTemplates(updatedTemplates)

      setDeleteDialog(null)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar asignación')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePercentage = async (quarter: string, percentage: number) => {
    if (!selectedSchoolYearId) return

    try {
      setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  const getTemplatesByQuarter = (quarter: string) => {
    return templates.filter(t => t.quarter === quarter)
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
              <CardTitle>Porcentaje de Calificación por Trimestre</CardTitle>
              <CardDescription>
                Define qué porcentaje de la calificación total representa las asignaciones mensuales en cada trimestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUARTERS.map(quarter => (
                  <div key={quarter.value} className="space-y-2">
                    <label className="text-sm font-medium">{quarter.label}</label>
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assignments by Quarter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {QUARTERS.map(quarter => {
              const quarterTemplates = getTemplatesByQuarter(quarter.value)

              return (
                <Card key={quarter.value}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{quarter.label}</CardTitle>
                        <CardDescription>
                          {quarterTemplates.length} asignación{quarterTemplates.length !== 1 ? 'es' : ''}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedQuarter(quarter.value)
                          setAddDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quarterTemplates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay asignaciones para este trimestre
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {quarterTemplates.map(template => (
                          <div
                            key={template.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{template.name}</span>
                              {template.hasGrades && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Tiene calificaciones
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {template.hasGrades ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditDialog({ id: template.id, name: template.name })
                                    setEditName(template.name)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditDialog({ id: template.id, name: template.name })
                                      setEditName(template.name)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteDialog({ id: template.id, name: template.name })}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Add Assignment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Asignación Mensual</DialogTitle>
            <DialogDescription>
              Esta asignación se aplicará a todos los estudiantes del año escolar "{selectedSchoolYear?.name}" para el trimestre seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong> Esta asignación se creará automáticamente para todos los estudiantes activos del año escolar.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Trimestre</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un trimestre" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map(q => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nombre de la Asignación</label>
              <Input
                value={newAssignmentName}
                onChange={(e) => setNewAssignmentName(e.target.value)}
                placeholder="Ej: Reporte Oral, Verso Bíblico..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddAssignment()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false)
                  setNewAssignmentName("")
                  setSelectedQuarter("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddAssignment} disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                {saving ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asignación Mensual</DialogTitle>
            <DialogDescription>
              Actualiza el nombre de la asignación. Esto actualizará el nombre para todos los estudiantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre de la Asignación</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ej: Reporte Oral, Verso Bíblico..."
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateAssignment()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialog(null)
                  setEditName("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateAssignment} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

