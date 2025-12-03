import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, BookOpen, Check, X, Edit2, History } from "lucide-react"
import type { DailyGoalData } from "@/types/pace"
import { useTranslation } from "react-i18next"

interface DailyGoalsTableProps {
  quarter: string
  quarterName: string
  week: number
  data: DailyGoalData
  subjects: string[]
  subjectToCategory?: Map<string, string> // Mapping from sub-subject to category
  onGoalUpdate?: (subject: string, dayIndex: number, value: string) => void
  onGoalToggle?: (subject: string, dayIndex: number) => void
  onNotesUpdate?: (subject: string, dayIndex: number, notes: string) => void
  dayTotals?: number[]
}

// Days will be translated dynamically

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
  subjectToCategory,
  onGoalUpdate,
  onGoalToggle,
  onNotesUpdate,
  dayTotals
}: DailyGoalsTableProps) {
  const { t } = useTranslation()
  const days = [
    t("dailyGoals.monday"),
    t("dailyGoals.tuesday"),
    t("dailyGoals.wednesday"),
    t("dailyGoals.thursday"),
    t("dailyGoals.friday")
  ]
  const [editingCell, setEditingCell] = React.useState<{ subject: string, dayIndex: number } | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const [editingNotes, setEditingNotes] = React.useState<{ subject: string, dayIndex: number } | null>(null)
  const [notesValue, setNotesValue] = React.useState("")
  const [notesHistory, setNotesHistory] = React.useState<{ subject: string, dayIndex: number, history: Array<{ text: string, completedDate: string }> } | null>(null)

  const isEditable = Boolean(onGoalUpdate)
  const canToggleGoal = Boolean(onGoalToggle)
  const canEditNotes = Boolean(onNotesUpdate)

  // Group data by category if subjectToCategory mapping is available
  const groupedData = React.useMemo(() => {
    if (!subjectToCategory || subjectToCategory.size === 0) {
      return { data, categories: subjects }
    }

    // Check if ANY of the subjects are sub-subjects (keys in subjectToCategory)
    // If we have sub-subjects, we need to group them
    const hasSubSubjects = subjects.some(subject => subjectToCategory.has(subject))

    // If we don't have any sub-subjects, subjects are likely already categories
    // Check if all subjects are category values (not keys)
    const allCategoryValues = new Set(Array.from(subjectToCategory.values()))
    const allSubjectKeys = new Set(Array.from(subjectToCategory.keys()))
    const areAllCategories = !hasSubSubjects && subjects.length > 0 && subjects.every(subject =>
      allCategoryValues.has(subject) && !allSubjectKeys.has(subject) && data[subject] !== undefined
    )

    // If subjects are already categories, use data as-is
    if (areAllCategories) {
      return { data, categories: subjects }
    }

    // We have sub-subjects that need to be grouped

    // Get all unique categories
    const allCategories = new Set<string>()
    subjectToCategory.forEach((category) => {
      allCategories.add(category)
    })

    // Add any subjects that don't have a category mapping
    subjects.forEach(subject => {
      if (!subjectToCategory.has(subject)) {
        allCategories.add(subject)
      }
    })

    // Group subjects by category
    const categoryGroups = new Map<string, string[]>()
    allCategories.forEach(category => {
      categoryGroups.set(category, [])
    })

    subjects.forEach(subject => {
      // Check if this subject is in the subjectToCategory mapping (it's a sub-subject)
      if (subjectToCategory.has(subject)) {
        const category = subjectToCategory.get(subject)!
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, [])
        }
        categoryGroups.get(category)!.push(subject)
      } else {
        // Subject doesn't have a mapping - check if it's already a category
        // (i.e., it's a value in the mapping but not a key)
        if (allCategoryValues.has(subject)) {
          // It's a category, add it directly
          if (!categoryGroups.has(subject)) {
            categoryGroups.set(subject, [])
          }
        } else {
          // Unknown subject, add as-is
          if (!categoryGroups.has(subject)) {
            categoryGroups.set(subject, [])
          }
          categoryGroups.get(subject)!.push(subject)
        }
      }
    })

    // Build grouped data structure
    const result: DailyGoalData = {}
    const categoryOrder: string[] = []

    categoryGroups.forEach((subjectsInCategory, category) => {
      categoryOrder.push(category)

      // Combine goals from all sub-subjects in this category
      const combinedGoals = Array(5).fill(null).map((_, dayIndex) => {
        const goalsForDay: typeof data[string][number][] = []

        subjectsInCategory.forEach(subject => {
          const goal = data[subject]?.[dayIndex]
          if (goal) {
            goalsForDay.push(goal)
          }
        })

        if (goalsForDay.length === 0) {
          return {
            text: '',
            isCompleted: false,
            notes: undefined,
            notesCompleted: false,
            notesHistory: []
          }
        }

        if (goalsForDay.length === 1) {
          return goalsForDay[0]
        }

        // Multiple goals - combine them
        const combinedText = goalsForDay.map(g => g.text).filter(t => t).join(', ')
        const combinedIsCompleted = goalsForDay.every(g => g.isCompleted)
        const combinedNotes = goalsForDay.map(g => g.notes).filter(n => n).join('; ')

        // Combine notes history
        const combinedNotesHistory: Array<{ text: string, completedDate: string }> = []
        goalsForDay.forEach(g => {
          if (g.notesHistory) {
            combinedNotesHistory.push(...g.notesHistory)
          }
        })
        combinedNotesHistory.sort((a, b) =>
          new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
        )

        return {
          text: combinedText,
          isCompleted: combinedIsCompleted,
          notes: combinedNotes || undefined,
          notesCompleted: goalsForDay.some(g => g.notesCompleted),
          notesHistory: combinedNotesHistory
        }
      })

      result[category] = combinedGoals
    })

    return { data: result, categories: categoryOrder }
  }, [data, subjects, subjectToCategory])

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
    if (!onGoalUpdate) return
    const currentGoal = groupedData.data[subject]?.[dayIndex]
    const currentValue = currentGoal?.text || ""
    setEditingCell({ subject, dayIndex })
    setEditValue(currentValue)
  }

  const handleGoalSubmit = () => {
    if (editingCell) {
      if (!onGoalUpdate) {
        setEditingCell(null)
        setEditValue("")
        return
      }
      // Only submit if the value is valid (1-1000, ST, or T)
      const trimmedValue = editValue.trim()
      const isValid =
        trimmedValue === "" ||
        /^st$/i.test(trimmedValue) ||
        /^t$/i.test(trimmedValue) ||
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
    if (!onNotesUpdate) return
    const currentNotes = groupedData.data[subject]?.[dayIndex]?.notes || ""
    setEditingNotes({ subject, dayIndex })
    setNotesValue(currentNotes)
  }

  const handleNotesSubmit = () => {
    if (editingNotes) {
      if (!onNotesUpdate) {
        setEditingNotes(null)
        setNotesValue("")
        return
      }
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



  // Calculate completed goals using grouped data
  const completedGoals = React.useMemo(() => {
    return groupedData.categories.reduce((total, category) => {
      return total + (groupedData.data[category]?.filter(goal => goal.isCompleted).length || 0)
    }, 0)
  }, [groupedData])

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
              <span className="truncate">{t("dailyGoals.title")}</span>
              <Badge variant="secondary" className="text-xs md:text-sm">
                {quarterName} - {t("common.week")} {week}
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              <span className="font-medium">
                {groupedData.categories.length} {groupedData.categories.length === 1 ? t("dailyGoals.subjectSingular") : t("dailyGoals.subjectPlural")}
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
                  {t("dailyGoals.day")}
                </th>
                {groupedData.categories.map((category) => (
                  <th
                    key={category}
                    className="text-center p-2 font-semibold min-w-[100px] border border-gray-300"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">
                        {category}
                      </span>
                    </div>
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
                  {groupedData.categories.map((category) => (
                    <td
                      key={category}
                      className="p-1 text-center align-middle border border-gray-300"
                    >
                      {editingCell?.subject === category && editingCell?.dayIndex === dayIndex ? (
                        <div className="flex flex-col items-center gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                          <div className="w-full">
                            {(() => {
                              const trimmedValue = editValue.trim()
                              const isValid =
                                trimmedValue === "" ||
                                /^st$/i.test(trimmedValue) ||
                                /^t$/i.test(trimmedValue) ||
                                /^[1-9]\d{0,3}-[1-9]\d{0,3}$/.test(trimmedValue) ||
                                /^[1-9]\d{0,3}$/.test(trimmedValue)

                              return (
                                <>
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t("dailyGoals.inputPlaceholder")}
                                    className={`w-full px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 ${editValue && !isValid
                                      ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                      : 'focus:ring-primary'
                                      }`}
                                    autoFocus
                                  />
                                  <div className={`text-xs mt-1 text-center ${editValue && !isValid ? 'text-red-500' : 'text-gray-500'
                                    }`}>
                                    {editValue && !isValid
                                      ? t("dailyGoals.invalidFormat")
                                      : t("dailyGoals.formatHint")
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
                              title={t("common.save")}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleGoalCancel}
                              className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
                              title={t("common.cancel")}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : editingNotes?.subject === category && editingNotes?.dayIndex === dayIndex ? (
                        <div className="flex flex-col items-center gap-1 p-1" onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            onKeyDown={handleNotesKeyDown}
                            placeholder={t("dailyGoals.notePendingPlaceholder")}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleNotesSubmit}
                              className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
                              title={t("common.save")}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleNotesCancel}
                              className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors cursor-pointer"
                              title={t("common.cancel")}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex flex-col items-center justify-center w-full gap-1 p-1">
                          <div className="flex items-center justify-center w-full gap-2">
                            {groupedData.data[category]?.[dayIndex]?.text && canToggleGoal && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (canToggleGoal) {
                                    onGoalToggle?.(category, dayIndex)
                                  }
                                }}
                                className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${groupedData.data[category]?.[dayIndex]?.isCompleted
                                  ? "bg-green-500 border-green-500"
                                  : "bg-white border-gray-300 hover:border-green-400"
                                  }`}
                                title={groupedData.data[category]?.[dayIndex]?.isCompleted ? "Marcar incompleto" : "Marcar completo"}
                                disabled={!canToggleGoal}
                              >
                                {groupedData.data[category]?.[dayIndex]?.isCompleted && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </button>
                            )}
                            {groupedData.data[category]?.[dayIndex]?.text && !canToggleGoal && groupedData.data[category]?.[dayIndex]?.isCompleted && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                <Check className="h-3 w-3" />
                              </Badge>
                            )}
                            <div
                              onClick={() => handleGoalClick(category, dayIndex)}
                              className={`flex-1 min-h-[32px] flex items-center justify-center transition-all rounded ${isEditable ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
                            >
                              <span className={`text-sm font-mono text-center ${groupedData.data[category]?.[dayIndex]?.isCompleted ? "line-through text-muted-foreground" : ""
                                }`}>
                                {groupedData.data[category]?.[dayIndex]?.text || (
                                  <span className="text-muted-foreground/50 text-xs">
                                    {isEditable ? t("dailyGoals.add") : '—'}
                                  </span>
                                )}
                              </span>
                            </div>
                            {groupedData.data[category]?.[dayIndex]?.text && (canEditNotes || (groupedData.data[category]?.[dayIndex]?.notesHistory?.length ?? 0) > 0) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const goal = groupedData.data[category]?.[dayIndex]
                                  if (goal?.notesHistory && goal.notesHistory.length > 0 && !goal.notes) {
                                    // Show history if there's history and no active note
                                    setNotesHistory({
                                      subject: category,
                                      dayIndex,
                                      history: goal.notesHistory
                                    })
                                  } else if (canEditNotes) {
                                    // Otherwise edit/add note
                                    handleNotesClick(category, dayIndex)
                                  }
                                }}
                                className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shadow-sm ${groupedData.data[category]?.[dayIndex]?.notes && !groupedData.data[category]?.[dayIndex]?.notesCompleted
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : (groupedData.data[category]?.[dayIndex]?.notesHistory && groupedData.data[category]?.[dayIndex]?.notesHistory.length > 0)
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                                  }`}
                                title={
                                  groupedData.data[category]?.[dayIndex]?.notes && !groupedData.data[category]?.[dayIndex]?.notesCompleted
                                    ? t("dailyGoals.editNote")
                                    : (groupedData.data[category]?.[dayIndex]?.notesHistory && groupedData.data[category]?.[dayIndex]?.notesHistory.length > 0)
                                      ? t("dailyGoals.viewNotesHistory")
                                      : t("dailyGoals.addNote")
                                }
                              >
                                {groupedData.data[category]?.[dayIndex]?.notesHistory && groupedData.data[category]?.[dayIndex]?.notesHistory.length > 0 && !groupedData.data[category]?.[dayIndex]?.notes ? (
                                  <History className="h-4 w-4" />
                                ) : (
                                  <Edit2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                          {groupedData.data[category]?.[dayIndex]?.notes && !groupedData.data[category]?.[dayIndex]?.notesCompleted && (
                            <div className="w-full flex items-start gap-2 text-xs text-left px-3 py-2 bg-red-100 border-2 border-red-400 rounded-md text-red-900 shadow-sm">
                              <div className="flex-1">
                                <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-0.5">{t("dailyGoals.pending")}</p>
                                <p className="text-sm font-medium leading-tight">
                                  {groupedData.data[category]?.[dayIndex]?.notes}
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
              <p className="text-[10px] md:text-xs text-muted-foreground">{t("dailyGoals.completedGoals")}</p>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-blue-50">
              <p className="text-lg md:text-2xl font-bold text-blue-600">
                {groupedData.categories.length * 5}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{t("dailyGoals.totalGoals")}</p>
            </div>
            <div className="text-center p-2 md:p-3 rounded-lg bg-purple-50">
              <p className="text-lg md:text-2xl font-bold text-purple-600">
                {groupedData.categories.length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{t("dailyGoals.subjects")}</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Notes History Dialog */}
      <Dialog open={!!notesHistory} onOpenChange={(open) => !open && setNotesHistory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("dailyGoals.notesHistory")}
            </DialogTitle>
            <DialogDescription>
              {notesHistory && (
                <>
                  {t("dailyGoals.day")}: <span className="font-semibold">{days[notesHistory.dayIndex]}</span> • {t("dailyGoals.subject")}: <span className="font-semibold">{notesHistory.subject}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {notesHistory && (
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
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
