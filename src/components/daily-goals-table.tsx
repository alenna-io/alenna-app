import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, BookOpen, Check, X } from "lucide-react"
import type { DailyGoalData } from "@/types/pace"

interface DailyGoalsTableProps {
  quarter: string
  quarterName: string
  week: number
  data: DailyGoalData
  subjects: string[]
  onGoalUpdate?: (subject: string, dayIndex: number, value: string) => void
  onGoalToggle?: (subject: string, dayIndex: number) => void
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
  onGoalToggle
}: DailyGoalsTableProps) {
  const [editingCell, setEditingCell] = React.useState<{ subject: string, dayIndex: number } | null>(null)
  const [editValue, setEditValue] = React.useState("")

  const handleGoalClick = (subject: string, dayIndex: number) => {
    const currentGoal = data[subject]?.[dayIndex]
    const currentValue = currentGoal?.text || ""
    setEditingCell({ subject, dayIndex })
    setEditValue(currentValue)
  }

  const handleGoalSubmit = () => {
    if (editingCell) {
      onGoalUpdate?.(editingCell.subject, editingCell.dayIndex, editValue)
      setEditingCell(null)
      setEditValue("")
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

  // Total pages data per day (editable)
  const [totalPages, setTotalPages] = React.useState<string[]>(["", "", "", "", ""])

  const handleTotalPageChange = (dayIndex: number, value: string) => {
    const newTotals = [...totalPages]
    newTotals[dayIndex] = value
    setTotalPages(newTotals)
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
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., 1-10"
                            className="w-full px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                          />
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
                      ) : (
                        <div className="relative flex items-center justify-center w-full gap-2 p-1">
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
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-1 text-center align-middle border border-gray-300 bg-blue-50">
                    <input
                      type="text"
                      value={totalPages[dayIndex]}
                      onChange={(e) => handleTotalPageChange(dayIndex, e.target.value)}
                      className="w-full h-8 text-center text-sm font-medium border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="0"
                    />
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
    </Card>
  )
}
