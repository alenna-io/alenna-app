import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, Trash2, XCircle, MoreVertical, Edit, Check, X } from "lucide-react"
import type { QuarterData } from "@/types/pace"

interface QuarterlyTableProps {
  quarter: string
  quarterName: string
  data: QuarterData
  currentWeek?: number // 1-9 for the current week in this quarter, undefined if not current
  isActive?: boolean // Whether this quarter contains the current week
  onPaceDrop?: (quarter: string, subject: string, fromWeek: number, toWeek: number) => void
  onPaceToggle?: (quarter: string, subject: string, weekIndex: number, grade?: number) => void
  onWeekClick?: (quarter: string, week: number) => void
  onAddPace?: (quarter: string, subject: string, weekIndex: number, paceNumber: string) => void
  onDeletePace?: (quarter: string, subject: string, weekIndex: number) => void
}

// Simplified 2-color system: alternating between blue and gray
const getSubjectColor = (index: number) => {
  return index % 2 === 0
    ? { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" }
    : { bg: "bg-gray-50 border-gray-200", text: "text-gray-700" }
}

export function ACEQuarterlyTable({
  quarter,
  quarterName,
  data,
  currentWeek,
  isActive = false,
  onPaceDrop,
  onPaceToggle,
  onWeekClick,
  onAddPace,
  onDeletePace
}: QuarterlyTableProps) {
  const [isExpanded, setIsExpanded] = React.useState(isActive)
  const [draggedPace, setDraggedPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [editingPace, setEditingPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [addingPace, setAddingPace] = React.useState<{ subject: string, weekIndex: number } | null>(null)
  const [paceNumberInput, setPaceNumberInput] = React.useState("")
  const [deleteDialog, setDeleteDialog] = React.useState<{ subject: string, weekIndex: number, paceNumber: string } | null>(null)
  const [alertDialog, setAlertDialog] = React.useState<{ title: string, message: string } | null>(null)
  const [confirmAddDialog, setConfirmAddDialog] = React.useState<{ subject: string, weekIndex: number, weekCount: number } | null>(null)
  const [overloadRememberUntil, setOverloadRememberUntil] = React.useState<number | null>(null)
  const [optionsMenu, setOptionsMenu] = React.useState<{ subject: string, weekIndex: number, x: number, y: number } | null>(null)
  const subjects = Object.keys(data)
  const weeks = Array.from({ length: 9 }, (_, i) => i + 1)
  const MAX_PACES_PER_QUARTER = 18 // Max 18 PACEs per quarter for nivelated students

  // Close options menu on click outside
  React.useEffect(() => {
    const handleClickOutside = () => setOptionsMenu(null)
    if (optionsMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [optionsMenu])

  const handlePaceClick = (subject: string, weekIndex: number, pace: { number: string; grade: number | null; isCompleted: boolean }) => {
    if (!pace.isCompleted) {
      // If not completed, show grade input
      setEditingPace({ subject, weekIndex })
      setGradeInput("")
    } else {
      // If already completed, toggle off (uncomplete)
      onPaceToggle?.(quarter, subject, weekIndex)
    }
  }

  const handleGradeSubmit = (subject: string, weekIndex: number) => {
    const grade = parseInt(gradeInput)
    if (grade >= 0 && grade <= 100) {
      onPaceToggle?.(quarter, subject, weekIndex, grade)
      setEditingPace(null)
      setGradeInput("")
    }
  }

  const handleGradeCancel = () => {
    setEditingPace(null)
    setGradeInput("")
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "text-muted-foreground"
    if (grade >= 90) return "text-green-600 font-bold"
    if (grade >= 80) return "text-blue-600 font-semibold"
    return "text-red-600 font-semibold" // Below 80 is failing
  }

  const isPaceFailing = (grade: number | null) => {
    return grade !== null && grade < 80
  }

  const handleAddPaceClick = (subject: string, weekIndex: number) => {
    setAddingPace({ subject, weekIndex })
    setPaceNumberInput("")
  }

  const handleAddPaceSubmit = (subject: string, weekIndex: number) => {
    const newPaceNumber = paceNumberInput.trim()

    if (!newPaceNumber) {
      setAlertDialog({
        title: "Campo Requerido",
        message: "Por favor ingresa un número de PACE"
      })
      return
    }

    // Validate format: must start with 1 and be 4 digits
    if (!/^1\d{3}$/.test(newPaceNumber)) {
      setAlertDialog({
        title: "Formato Inválido",
        message: "El número de PACE debe tener 4 dígitos y comenzar con 1 (ej: 1001, 1234)"
      })
      return
    }

    // Check if pace already exists in this subject
    const paceExists = data[subject].some(pace => pace && pace.number === newPaceNumber)
    if (paceExists) {
      setAlertDialog({
        title: "PACE Duplicado",
        message: `El PACE ${newPaceNumber} ya existe en ${subject}.\n\nNo se pueden duplicar PACEs en la misma materia.`
      })
      return
    }

    // Check overload warning for QUARTER (max 18 per quarter)
    const currentQuarterPaces = quarterStats.expected
    const now = Date.now()
    const shouldShowWarning = !overloadRememberUntil || now > overloadRememberUntil

    if (currentQuarterPaces >= MAX_PACES_PER_QUARTER && shouldShowWarning) {
      setConfirmAddDialog({ subject, weekIndex, weekCount: currentQuarterPaces })
      return
    }

    onAddPace?.(quarter, subject, weekIndex, newPaceNumber)
    setAddingPace(null)
    setPaceNumberInput("")
  }

  const confirmOverloadAdd = (rememberFor10Min: boolean = false) => {
    if (confirmAddDialog && addingPace) {
      if (rememberFor10Min) {
        // Remember choice for 10 minutes
        const tenMinutesFromNow = Date.now() + (10 * 60 * 1000)
        setOverloadRememberUntil(tenMinutesFromNow)
      }
      onAddPace?.(quarter, addingPace.subject, addingPace.weekIndex, paceNumberInput.trim())
      setAddingPace(null)
      setPaceNumberInput("")
      setConfirmAddDialog(null)
    }
  }

  const handleDeletePace = (subject: string, weekIndex: number, paceNumber: string) => {
    setDeleteDialog({ subject, weekIndex, paceNumber })
  }

  const confirmDelete = () => {
    if (deleteDialog) {
      onDeletePace?.(quarter, deleteDialog.subject, deleteDialog.weekIndex)
      setDeleteDialog(null)
    }
  }

  const handleAddPaceCancel = () => {
    setAddingPace(null)
    setPaceNumberInput("")
  }

  // Calculate paces per week for display
  const weekPaceCounts = React.useMemo(() => {
    const counts: number[] = Array(9).fill(0)
    subjects.forEach(subject => {
      data[subject].forEach((pace, weekIndex) => {
        if (pace) {
          counts[weekIndex]++
        }
      })
    })
    return counts
  }, [data, subjects])

  // Calculate completed and expected paces for this quarter
  const quarterStats = React.useMemo(() => {
    let completed = 0
    let expected = 0

    subjects.forEach(subject => {
      data[subject].forEach(pace => {
        if (pace) {
          expected++
          if (pace.isCompleted) {
            completed++
          }
        }
      })
    })

    return { completed, expected }
  }, [data, subjects])

  const completionPercentage = quarterStats.expected > 0
    ? Math.round((quarterStats.completed / quarterStats.expected) * 100)
    : 0

  const isQuarterComplete = quarterStats.expected > 0 && quarterStats.completed === quarterStats.expected
  const isQuarterOverloaded = quarterStats.expected > MAX_PACES_PER_QUARTER

  return (
    <>
      <Card className={isActive ? "border-primary shadow-md" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-6 w-6" />
                <span>{quarterName}</span>
                <Badge variant="secondary" className="ml-2">
                  {quarter}
                </Badge>
                {isActive && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Actual
                  </Badge>
                )}
                {isQuarterOverloaded && (
                  <Badge className="bg-red-100 text-red-800 border-red-500">
                    Sobrecarga ({quarterStats.expected}/{MAX_PACES_PER_QUARTER})
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {currentWeek && (
                <Badge variant="outline" className="text-sm">
                  Semana {currentWeek}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-sm">
                {isQuarterComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-orange-500" />
                )}
                <span className="font-medium">
                  {quarterStats.completed} / {quarterStats.expected}
                </span>
                <span className="text-muted-foreground">
                  ({completionPercentage}%)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mostrar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-2 font-semibold bg-muted/50 sticky left-0 z-10 min-w-[160px] border border-gray-300">
                      Materia
                    </th>
                    {weeks.map((week, weekIdx) => {
                      const weekPaceCount = weekPaceCounts[weekIdx]

                      return (
                        <th
                          key={week}
                          className={`text-center p-2 font-semibold min-w-[100px] cursor-pointer hover:bg-muted transition-colors border border-gray-300 ${currentWeek === week
                            ? "bg-green-100 border-2 border-green-500"
                            : "bg-muted/50"
                            }`}
                          onClick={() => onWeekClick?.(quarter, week)}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">Semana</span>
                            <span className={`text-lg ${currentWeek === week ? "font-bold text-green-700" : ""}`}>
                              {week}
                            </span>
                            {currentWeek === week && (
                              <Badge className="bg-green-600 text-white text-xs px-2 py-0">
                                Actual
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {weekPaceCount} PACEs
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, subjectIndex) => (
                    <tr
                      key={subject}
                      className={`border-b transition-colors hover:bg-muted/30 ${subjectIndex % 2 === 0 ? "bg-muted/10" : ""
                        }`}
                    >
                      <td
                        className={`p-2 font-semibold sticky left-0 z-10 border-l-4 border border-gray-300 ${getSubjectColor(subjectIndex).bg
                          } ${getSubjectColor(subjectIndex).text}`}
                      >
                        {subject}
                      </td>
                      {data[subject].map((pace, weekIndex) => (
                        <td
                          key={weekIndex}
                          className="p-2 text-center align-middle border border-gray-300"
                          draggable={!!pace}
                          onDragStart={() => setDraggedPace({ subject, weekIndex })}
                          onDragOver={(e) => {
                            if (draggedPace && draggedPace.subject === subject) {
                              e.preventDefault()
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedPace && draggedPace.subject === subject && draggedPace.weekIndex !== weekIndex) {
                              onPaceDrop?.(quarter, subject, draggedPace.weekIndex, weekIndex)
                            }
                            setDraggedPace(null)
                          }}
                          onDragEnd={() => setDraggedPace(null)}
                        >
                          {pace ? (
                            editingPace?.subject === subject && editingPace?.weekIndex === weekIndex ? (
                              <div className="inline-flex flex-col items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={gradeInput}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value)
                                    if (e.target.value === '' || (val >= 0 && val <= 100)) {
                                      setGradeInput(e.target.value)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleGradeSubmit(subject, weekIndex)
                                    if (e.key === 'Escape') handleGradeCancel()
                                  }}
                                  placeholder="0-100"
                                  className="w-16 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleGradeSubmit(subject, weekIndex)}
                                    className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                                    title="Guardar"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleGradeCancel}
                                    className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                                    title="Cancelar"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative flex items-center justify-center w-full group/pace">
                                <div
                                  className="inline-flex flex-col items-center cursor-move"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePaceClick(subject, weekIndex, pace)
                                  }}
                                >
                                  <Badge
                                    variant="outline"
                                    className={`font-mono text-sm px-3 py-1 relative cursor-pointer transition-all ${pace.isCompleted && isPaceFailing(pace.grade)
                                      ? "bg-red-100 text-red-800 border-red-500 border-2"
                                      : pace.isCompleted
                                        ? "bg-green-100 text-green-800 border-green-500 border-2"
                                        : `${getSubjectColor(subjectIndex).bg} ${getSubjectColor(subjectIndex).text} border-2`
                                      }`}
                                  >
                                    {pace.isCompleted && (
                                      <CheckCircle2 className={`h-3 w-3 absolute -top-1 -right-1 ${isPaceFailing(pace.grade) ? "text-red-600 fill-red-100" : "text-green-600 fill-green-100"
                                        }`} />
                                    )}
                                    {pace.number}
                                  </Badge>
                                  <span className={`text-xs mt-1 ${getGradeColor(pace.grade)}`}>
                                    {pace.grade !== null ? `${pace.grade}%` : "—"}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setOptionsMenu({ subject, weekIndex, x: rect.right, y: rect.top })
                                  }}
                                  className="absolute right-1 opacity-0 group-hover/pace:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-gray-100 rounded"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
                            )
                          ) : addingPace?.subject === subject && addingPace?.weekIndex === weekIndex ? (
                            <div className="inline-flex flex-col items-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={paceNumberInput}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Only allow numbers and max 4 digits
                                  if (/^\d{0,4}$/.test(value)) {
                                    setPaceNumberInput(value)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddPaceSubmit(subject, weekIndex)
                                  if (e.key === 'Escape') handleAddPaceCancel()
                                }}
                                placeholder="1XXX"
                                className="w-20 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAddPaceSubmit(subject, weekIndex)}
                                  className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
                                  title="Agregar"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleAddPaceCancel}
                                  className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddPaceClick(subject, weekIndex)
                              }}
                              className="h-full w-full min-h-[40px] flex items-center justify-center transition-all cursor-pointer group"
                            >
                              <span className="text-xl text-primary/0 group-hover:text-primary/80 transition-all group-hover:scale-125">
                                +
                              </span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{quarterStats.expected}</p>
                  <p className="text-xs text-muted-foreground">PACEs Programados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{quarterStats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50">
                  <p className="text-2xl font-bold text-orange-600">{quarterStats.expected - quarterStats.completed}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{completionPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Progreso</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Options Menu Popup */}
      {optionsMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          style={{ left: `${optionsMenu.x}px`, top: `${optionsMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const pace = data[optionsMenu.subject][optionsMenu.weekIndex]
              if (pace) {
                handlePaceClick(optionsMenu.subject, optionsMenu.weekIndex, pace)
                setOptionsMenu(null)
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            Editar Nota
          </button>
          <button
            onClick={() => {
              const pace = data[optionsMenu.subject][optionsMenu.weekIndex]
              if (pace) {
                handleDeletePace(optionsMenu.subject, optionsMenu.weekIndex, pace.number)
                setOptionsMenu(null)
              }
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialog}
        title="Eliminar PACE"
        message={deleteDialog ? `¿Estás seguro de que deseas eliminar el PACE ${deleteDialog.paceNumber} de ${deleteDialog.subject}?\n\nEsta acción no se puede deshacer.` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog(null)}
      />

      {/* Alert Dialog */}
      <ConfirmDialog
        isOpen={!!alertDialog}
        title={alertDialog?.title || "Alerta"}
        message={alertDialog?.message || ""}
        confirmText="Entendido"
        cancelText=""
        variant="warning"
        onConfirm={() => setAlertDialog(null)}
        onCancel={() => setAlertDialog(null)}
      />

      {/* Overload Confirmation Dialog */}
      {confirmAddDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Sobrecarga de Bloque"
          message={`Este bloque ya tiene ${confirmAddDialog.weekCount} PACEs programados.\n\nEl máximo recomendado es ${MAX_PACES_PER_QUARTER} PACEs por trimestre.\n\n¿Deseas agregar este PACE de todas formas?`}
          confirmText="Agregar de Todas Formas"
          cancelText="Cancelar"
          variant="warning"
          showRememberOption={true}
          onConfirm={(remember) => confirmOverloadAdd(remember || false)}
          onCancel={() => {
            setConfirmAddDialog(null)
            setAddingPace(null)
            setPaceNumberInput("")
          }}
        />
      )}
    </>
  )
}

