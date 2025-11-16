import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Plus, Edit, Trash2, History, Check } from "lucide-react"
import type { MonthlyAssignment } from "@/types/monthly-assignment"
import { toast } from "sonner"

interface MonthlyAssignmentsSectionProps {
  quarter: string
  assignments: MonthlyAssignment[]
  isReadOnly?: boolean
  onRefresh?: () => Promise<void>
  onCreateAssignment: (name: string, quarter: string) => Promise<void>
  onUpdateAssignment: (assignmentId: string, name: string) => Promise<void>
  onGradeAssignment: (assignmentId: string, grade: number, note?: string) => Promise<void>
  onDeleteAssignment: (assignmentId: string) => Promise<void>
}

export function MonthlyAssignmentsSection({
  quarter,
  assignments,
  isReadOnly = false,
  onCreateAssignment,
  onUpdateAssignment,
  onGradeAssignment,
  onDeleteAssignment,
}: MonthlyAssignmentsSectionProps) {
  const [addingAssignment, setAddingAssignment] = React.useState(false)
  const [newAssignmentName, setNewAssignmentName] = React.useState("")
  const [editingAssignment, setEditingAssignment] = React.useState<{ id: string, name: string } | null>(null)
  const [editName, setEditName] = React.useState("")
  const [gradingAssignment, setGradingAssignment] = React.useState<string | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [noteInput, setNoteInput] = React.useState("")
  const [deleteDialog, setDeleteDialog] = React.useState<{ id: string, name: string } | null>(null)
  const [historyDialog, setHistoryDialog] = React.useState<MonthlyAssignment | null>(null)

  const quarterAssignments = assignments.filter(a => a.quarter === quarter)

  const handleAddAssignment = async () => {
    if (!newAssignmentName.trim()) {
      toast.error("El nombre de la asignación es requerido")
      return
    }

    try {
      await onCreateAssignment(newAssignmentName.trim(), quarter)
      setNewAssignmentName("")
      setAddingAssignment(false)
      toast.success("Asignación creada exitosamente")
    } catch (err) {
      console.error('Error creating assignment:', err)
      toast.error(err instanceof Error ? err.message : "Error al crear asignación")
    }
  }

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !editName.trim()) {
      toast.error("El nombre de la asignación es requerido")
      return
    }

    try {
      await onUpdateAssignment(editingAssignment.id, editName.trim())
      setEditingAssignment(null)
      setEditName("")
      toast.success("Asignación actualizada exitosamente")
    } catch (err) {
      console.error('Error updating assignment:', err)
      toast.error(err instanceof Error ? err.message : "Error al actualizar asignación")
    }
  }

  const handleGradeAssignment = async () => {
    if (!gradingAssignment) return

    const grade = parseInt(gradeInput)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error("La calificación debe estar entre 0 y 100")
      return
    }

    try {
      await onGradeAssignment(gradingAssignment, grade, noteInput || undefined)
      setGradingAssignment(null)
      setGradeInput("")
      setNoteInput("")
      toast.success("Calificación guardada exitosamente")
    } catch (err) {
      console.error('Error grading assignment:', err)
      toast.error(err instanceof Error ? err.message : "Error al calificar asignación")
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deleteDialog) return

    try {
      await onDeleteAssignment(deleteDialog.id)
      setDeleteDialog(null)
      toast.success("Asignación eliminada exitosamente")
    } catch (err) {
      console.error('Error deleting assignment:', err)
      toast.error(err instanceof Error ? err.message : "Error al eliminar asignación")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">Asignaciones Mensuales - {quarter}</CardTitle>
            {!isReadOnly && (
              <Button
                size="sm"
                onClick={() => setAddingAssignment(true)}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {quarterAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay asignaciones mensuales para este trimestre
            </p>
          ) : (
            <div className="space-y-2">
              {quarterAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{assignment.name}</p>
                    {assignment.grade !== null && (
                      <Badge
                        variant={assignment.grade >= 80 ? "default" : "destructive"}
                        className="mt-1"
                      >
                        {assignment.grade}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAssignment({ id: assignment.id, name: assignment.name })
                            setEditName(assignment.name)
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGradingAssignment(assignment.id)
                            setGradeInput(assignment.grade?.toString() || "")
                          }}
                          className="cursor-pointer"
                        >
                          Calificar
                        </Button>
                      </>
                    )}
                    {assignment.gradeHistory.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryDialog(assignment)}
                        className="cursor-pointer"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                    {!isReadOnly && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ id: assignment.id, name: assignment.name })}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Assignment Dialog */}
      <Dialog open={addingAssignment} onOpenChange={setAddingAssignment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Asignación Mensual</DialogTitle>
            <DialogDescription>
              Crea una nueva asignación para {quarter}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  setAddingAssignment(false)
                  setNewAssignmentName("")
                }}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button onClick={handleAddAssignment} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asignación</DialogTitle>
            <DialogDescription>
              Actualiza el nombre de la asignación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre de la Asignación</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateAssignment()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingAssignment(null)
                  setEditName("")
                }}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateAssignment} className="cursor-pointer">
                <Check className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Assignment Dialog */}
      <Dialog open={!!gradingAssignment} onOpenChange={(open) => !open && setGradingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calificar Asignación</DialogTitle>
            <DialogDescription>
              Ingresa la calificación (0-100) y una nota opcional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Calificación</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nota (Opcional)</label>
              <Input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Comentarios adicionales..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGradingAssignment(null)
                  setGradeInput("")
                  setNoteInput("")
                }}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button onClick={handleGradeAssignment} className="cursor-pointer">
                <Check className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade History Dialog */}
      <Dialog open={!!historyDialog} onOpenChange={(open) => !open && setHistoryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Calificaciones
            </DialogTitle>
            <DialogDescription>
              {historyDialog && (
                <>
                  Asignación: <span className="font-semibold">{historyDialog.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historyDialog?.gradeHistory.map((entry, index) => (
              <div key={index} className={`p-3 rounded-lg border-2 ${entry.grade >= 80 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${entry.grade >= 90 ? 'text-green-600' : entry.grade >= 80 ? 'text-blue-600' : 'text-red-600'
                    }`}>{entry.grade}%</span>
                  <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
                {entry.note && (
                  <p className="text-sm mt-2 text-gray-700">{entry.note}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setHistoryDialog(null)}
              className="cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title="Eliminar Asignación"
        message={deleteDialog ? `¿Estás seguro de que deseas eliminar "${deleteDialog.name}"?\n\nEsta acción no se puede deshacer.` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteAssignment}
      />
    </>
  )
}

