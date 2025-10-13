import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, BookOpen, Check, X, Edit2, History } from "lucide-react"
import type { DailyGoalData } from "@/types/pace"

interface DailyGoalsTableProps {
  quarter: string
  quarterName: string
  week: number
  data: DailyGoalData
  subjects: string[]
  onGoalUpdate?: (subject: string, dayIndex: number, value: string) => void
  onGoalToggle?: (subject: string, dayIndex: number) => void
  onNotesUpdate?: (subject: string, dayIndex: number, notes: string) => void
  onNotesToggle?: (subject: string, dayIndex: number) => void
  dayTotals?: number[]
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Color system for subjects (matching projections)
const getSubjectColor = (index: number) => {
  return index % 2 === 0
    ? { bg: "bg-blue-100 border-blue-200", text: "text-blue-700" }
    : { bg: "bg-gray-100 border-gray-200", text: "text-gray-700" }
}

export function DailyGoalsTable({
  quarterName,
  week,
  data,
  subjects,
  onGoalUpdate,
  onGoalToggle,
  onNotesUpdate,
  onNotesToggle,
  dayTotals
}: DailyGoalsTableProps) {
  const [editingCell, setEditingCell] = React.useState<{ subject: string, dayIndex: number } | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const [editingNotes, setEditingNotes] = React.useState<{ subject: string, dayIndex: number } | null>(null)
  const [notesValue, setNotesValue] = React.useState("")
  const [notesHistory, setNotesHistory] = React.useState<{ subject: string, dayIndex: number, history: Array<{ text: string, completedDate: string }> } | null>(null)

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (notesHistory) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [notesHistory])

  const handleGoalClick = (subject: string, dayIndex: number) => {
    const currentGoal = data[subject]?.[dayIndex]
    const currentValue = currentGoal?.text || ""
    setEditingCell({ subject, dayIndex })
    setEditValue(currentValue)
  }

  const handleGoalSubmit = () => {
    if (editingCell) {
      // Only submit if the value is valid (1-1000 or Self Test)
      const trimmedValue = editValue.trim()
      const isValid =
        trimmedValue === "" ||
        /^self\s*test$/i.test(trimmedValue) ||
        /^[1-9]\d{0,3}-[1-9]\d{0,3}$/.test(trimmedValue) ||
        /^[1-9]\d{0,3}$/.test(trimmedValue)

      if (isValid) {
        onGoalUpdate?.(editingCell.subject, editingCell.dayIndex, editValue)
        setEditingCell(null)
        setEditValue("")
      }
      // If invalid, don't submit (user can cancel or fix the input)
    }
  }

  const handleGoalCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoalSubmit()
    } else if (e.key === 'Escape') {
      handleGoalCancel()
    }
  }

  const handleNotesClick = (subject: string, dayIndex: number) => {
    const currentNotes = data[subject]?.[dayIndex]?.notes || ""
    setEditingNotes({ subject, dayIndex })
    setNotesValue(currentNotes)
  }

  const handleNotesSubmit = () => {
    if (editingNotes) {
      onNotesUpdate?.(editingNotes.subject, editingNotes.dayIndex, notesValue)
      setEditingNotes(null)
      setNotesValue("")
    }
  }

  const handleNotesCancel = () => {
    setEditingNotes(null)
    setNotesValue("")
  }

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNotesSubmit()
    } else if (e.key === 'Escape') {
      handleNotesCancel()
    }
  }



  // Calculate completed goals
  const completedGoals = React.useMemo(() => {
    return subjects.reduce((total, subject) => {
      return total + (data[subject]?.filter(goal => goal.isCompleted).length || 0)
    }, 0)
  }, [data, subjects])

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
              <span className="truncate">Daily Goals</span>
              <Badge variant="secondary" className="text-xs md:text-sm">
                {quarterName} - Week {week}
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              <span className="font-medium">
                {subjects.length} subjects
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 md:p-6">
        <div className="overflow-x-auto -mx-3 md:mx-0 border border-gray-300 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 font-semibold bg-background sticky left-0 z-10 min-w-[120px] border border-gray-300">
                  Day
                </th>
                {subjects.map((subject) => (
                  <th
                    key={subject}
                    className="text-center p-2 font-semibold min-w-[100px] border border-gray-300"
                  >
                    {subject}
                  </th>
                ))}
                <th className="text-center p-2 font-semibold w-20 border border-gray-300 bg-blue-100">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr
                  key={day}
                  className={`transition-colors hover:bg-muted/30 ${dayIndex % 2 === 0 ? "bg-muted/10" : ""}`}
                >
                  <td
                    className={`p-2 font-semibold sticky left-0 z-10 border border-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${getSubjectColor(dayIndex).bg} ${getSubjectColor(dayIndex).text}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold">{days[dayIndex]}</span>
                    </div>
                  </td>
                  {subjects.map((subject) => (
                    <td
                      key={subject}
                      className="p-1 text-center align-middle border border-gray-300"
                    >
                      {editingCell?.subject === subject && editingCell?.dayIndex === dayIndex ? (
                        <div className="flex flex-col items-center gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                          <div className="w-full">
                            {(() => {
                              const trimmedValue = editValue.trim()
                              const isValid =
                                trimmedValue === "" ||
                                /^self\s*test$/i.test(trimmedValue) ||
                                /^[1-9]\d{0,3}-[1-9]\d{0,3}$/.test(trimmedValue) ||
                                /^[1-9]\d{0,3}$/.test(trimmedValue)

                              return (
                                <>
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., 1-10 or Self Test"
                                    className={`w-full px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 ${editValue && !isValid
                                      ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                      : 'focus:ring-primary'
                                      }`}
                                    autoFocus
                                  />
                                  <div className={`text-xs mt-1 text-center ${editValue && !isValid ? 'text-red-500' : 'text-gray-500'
                                    }`}>
                                    {editValue && !isValid
                                      ? 'Invalid format. Use: start-end (1-1000) or "Self Test"'
                                      : 'Format: start-end (1-1000) or "Self Test"'
                                    }
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleGoalSubmit}
                              className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                              title="Guardar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleGoalCancel}
                              className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : editingNotes?.subject === subject && editingNotes?.dayIndex === dayIndex ? (
                        <div className="flex flex-col items-center gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            onKeyDown={handleNotesKeyDown}
                            placeholder="Nota pendiente..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleNotesSubmit}
                              className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
                              title="Guardar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleNotesCancel}
                              className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex flex-col items-center justify-center w-full gap-1 p-1">
                          <div className="flex items-center justify-center w-full gap-2">
                            {data[subject]?.[dayIndex]?.text && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onGoalToggle?.(subject, dayIndex)
                                }}
                                className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${data[subject]?.[dayIndex]?.isCompleted
                                  ? "bg-green-500 border-green-500"
                                  : "bg-white border-gray-300 hover:border-green-400"
                                  }`}
                                title={data[subject]?.[dayIndex]?.isCompleted ? "Marcar incompleto" : "Marcar completo"}
                              >
                                {data[subject]?.[dayIndex]?.isCompleted && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </button>
                            )}
                            <div
                              onClick={() => handleGoalClick(subject, dayIndex)}
                              className="flex-1 min-h-[32px] flex items-center justify-center transition-all cursor-pointer hover:bg-muted/50 rounded"
                            >
                              <span className={`text-sm font-mono text-center ${data[subject]?.[dayIndex]?.isCompleted ? "line-through text-muted-foreground" : ""
                                }`}>
                                {data[subject]?.[dayIndex]?.text || (
                                  <span className="text-muted-foreground/50 text-xs">Agregar</span>
                                )}
                              </span>
                            </div>
                            {data[subject]?.[dayIndex]?.text && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const goal = data[subject]?.[dayIndex]
                                  if (goal?.notesHistory && goal.notesHistory.length > 0 && !goal.notes) {
                                    // Show history if there's history and no active note
                                    setNotesHistory({
                                      subject,
                                      dayIndex,
                                      history: goal.notesHistory
                                    })
                                  } else {
                                    // Otherwise edit/add note
                                    handleNotesClick(subject, dayIndex)
                                  }
                                }}
                                className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shadow-sm ${data[subject]?.[dayIndex]?.notes && !data[subject]?.[dayIndex]?.notesCompleted
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : (data[subject]?.[dayIndex]?.notesHistory && data[subject]?.[dayIndex]?.notesHistory.length > 0)
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                                  }`}
                                title={
                                  data[subject]?.[dayIndex]?.notes && !data[subject]?.[dayIndex]?.notesCompleted
                                    ? "Editar nota"
                                    : (data[subject]?.[dayIndex]?.notesHistory && data[subject]?.[dayIndex]?.notesHistory.length > 0)
                                      ? "Ver historial de notas"
                                      : "Agregar nota"
                                }
                              >
                                {data[subject]?.[dayIndex]?.notesHistory && data[subject]?.[dayIndex]?.notesHistory.length > 0 && !data[subject]?.[dayIndex]?.notes ? (
                                  <History className="h-4 w-4" />
                                ) : (
                                  <Edit2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                          {data[subject]?.[dayIndex]?.notes && !data[subject]?.[dayIndex]?.notesCompleted && (
                            <div className="w-full flex items-start gap-2 text-xs text-left px-3 py-2 bg-red-100 border-2 border-red-400 rounded-md text-red-900 shadow-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onNotesToggle?.(subject, dayIndex)
                                }}
                                className="shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer bg-white border-red-500 hover:bg-red-50 hover:border-red-600"
                                title="Marcar completo"
                              >
                              </button>
                              <div className="flex-1">
                                <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-0.5">Pendiente</p>
                                <p className="text-sm font-medium leading-tight">
                                  {data[subject]?.[dayIndex]?.notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-1 text-center align-middle border border-gray-300 bg-blue-50">
                    <span className="w-full h-8 flex items-center justify-center text-sm font-medium text-gray-700">
                      {dayTotals?.[dayIndex] || "0"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            <div className="text-center p-2 md:p-3 rounded-lg bg-green-50">
              <p className="text-lg md:text-2xl font-bold text-green-600">
                {completedGoals}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Completed Goals</p>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-blue-50">
              <p className="text-lg md:text-2xl font-bold text-blue-600">
                {subjects.length * 5}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Total Goals</p>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-purple-50">
              <p className="text-lg md:text-2xl font-bold text-purple-600">
                {subjects.length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Subjects</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Notes History Dialog */}
      {notesHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setNotesHistory(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Notas
                </h3>
                <button onClick={() => setNotesHistory(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Día: <span className="font-semibold">{days[notesHistory.dayIndex]}</span></p>
                <p className="text-sm text-gray-600">Materia: <span className="font-semibold">{notesHistory.subject}</span></p>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notesHistory.history.map((entry, index) => (
                  <div key={index} className="p-3 rounded-lg border-2 bg-green-50 border-green-200">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800 flex-1">{entry.text}</p>
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{new Date(entry.completedDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setNotesHistory(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
