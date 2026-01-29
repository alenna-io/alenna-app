import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, History } from "lucide-react"
import type { DailyGoalData } from "@/types/pace"
import { useTranslation } from "react-i18next"
import { sortCategoriesByOrder } from "@/utils/category-order"
import { DailyGoalAddModal } from "./daily-goal-add-modal"
import { DailyGoalNoteModal } from "./daily-goal-note-modal"
import { DailyGoalActionsMenu } from "./daily-goal-actions-menu"

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
    ? { bg: "bg-primary/10 border-primary/10", text: "text-primary", textAlign: "left" }
    : { bg: "bg-primary/10 border-primary/10", text: "text-primary", textAlign: "left" }
}

export function DailyGoalsTable({
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
  const [addGoalModalOpen, setAddGoalModalOpen] = React.useState(false)
  const [addGoalModalContext, setAddGoalModalContext] = React.useState<{ subject: string, dayIndex: number } | null>(null)
  const [noteModalOpen, setNoteModalOpen] = React.useState(false)
  const [noteModalContext, setNoteModalContext] = React.useState<{ subject: string, dayIndex: number } | null>(null)
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

    // Sort categories by default order
    const sortedCategoryOrder = sortCategoriesByOrder(categoryOrder)

    return { data: result, categories: sortedCategoryOrder }
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
    if (currentGoal?.text) {
      return
    }
    setAddGoalModalContext({ subject, dayIndex })
    setAddGoalModalOpen(true)
  }

  const handleGoalSave = (text: string) => {
    if (addGoalModalContext && onGoalUpdate) {
      onGoalUpdate(addGoalModalContext.subject, addGoalModalContext.dayIndex, text)
    }
    setAddGoalModalContext(null)
  }

  const handleExistingGoalClick = () => {
    if (!onGoalUpdate && !onNotesUpdate && !onGoalToggle) return
  }

  const handleAddNote = (subject: string, dayIndex: number) => {
    if (!onNotesUpdate) return
    setNoteModalContext({ subject, dayIndex })
    setNoteModalOpen(true)
  }

  const handleNoteSave = (notes: string) => {
    if (noteModalContext && onNotesUpdate) {
      onNotesUpdate(noteModalContext.subject, noteModalContext.dayIndex, notes)
    }
    setNoteModalContext(null)
  }

  const handleMarkComplete = (subject: string, dayIndex: number) => {
    if (onGoalToggle) {
      onGoalToggle(subject, dayIndex)
    }
  }



  // Calculate completed goals using grouped data
  const completedGoals = React.useMemo(() => {
    return groupedData.categories.reduce((total, category) => {
      return total + (groupedData.data[category]?.filter(goal => goal.isCompleted).length || 0)
    }, 0)
  }, [groupedData])

  return (
    <Card className="border-none bg-transparent">
      <CardContent className="p-0">
        <div className="overflow-x-auto -mx-3 md:mx-0 border border-border rounded-xl overflow-hidden bg-transparent">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-center p-3 font-semibold bg-primary/10 sticky left-0 z-10 min-w-[120px] border-b border-r border-border border-b-primary/50">
                  {t("dailyGoals.day")}
                </th>
                {groupedData.categories.map((category) => (
                  <th
                    key={category}
                    className="text-center p-3 font-semibold min-w-[100px] border-b border-l border-r border-border border-b-primary/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {category}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="text-center p-3 font-semibold w-20 border-b border-l border-border border-b-primary/50 bg-primary/10">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr
                  key={day}
                  className={`transition-colors hover:bg-primary-soft/20 border-b border-border`}
                >
                  <td
                    className={`p-3 font-semibold sticky left-0 z-10 border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] bg-primary/10 ${getSubjectColor(dayIndex).text}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">{days[dayIndex]}</span>
                    </div>
                  </td>
                  {groupedData.categories.map((category) => (
                    <td
                      key={category}
                      className="p-2 text-center align-middle border-l border-border"
                    >
                      {(() => {
                        const goal = groupedData.data[category]?.[dayIndex]
                        const hasGoal = goal?.text

                        return (
                          <div className="relative flex flex-col items-center justify-center w-full gap-1 p-1">
                            <div className="flex items-center justify-center w-full gap-2">
                              {hasGoal && canToggleGoal && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (canToggleGoal) {
                                      onGoalToggle?.(category, dayIndex)
                                    }
                                  }}
                                  className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${goal?.isCompleted
                                    ? "bg-green-500 border-green-500"
                                    : "bg-white border-border hover:border-green-400"
                                    }`}
                                  title={goal?.isCompleted ? t("dailyGoals.markIncomplete") : t("dailyGoals.markComplete")}
                                  disabled={!canToggleGoal}
                                >
                                  {goal?.isCompleted && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </button>
                              )}
                              {hasGoal && !canToggleGoal && goal?.isCompleted && (
                                <Badge variant="status-completed">
                                  <Check className="h-3 w-3" />
                                </Badge>
                              )}
                              <div
                                onClick={() => hasGoal ? handleExistingGoalClick() : handleGoalClick(category, dayIndex)}
                                className={`flex-1 min-h-[32px] flex items-center justify-center transition-all rounded ${isEditable ? "cursor-pointer hover:bg-muted/50" : "cursor-default"}`}
                              >
                                <span className={`text-sm font-mono text-center ${goal?.isCompleted ? "line-through text-muted-foreground" : ""
                                  }`}>
                                  {goal?.text || (
                                    <span className="text-muted-foreground/50 text-xs">
                                      {isEditable ? t("dailyGoals.add") : '—'}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {hasGoal && (isEditable || canEditNotes || (goal?.notesHistory?.length ?? 0) > 0) && (
                                <DailyGoalActionsMenu
                                  onAddNote={() => {
                                    const goalData = groupedData.data[category]?.[dayIndex]
                                    if (goalData?.notesHistory && goalData.notesHistory.length > 0 && !goalData.notes) {
                                      setNotesHistory({
                                        subject: category,
                                        dayIndex,
                                        history: goalData.notesHistory
                                      })
                                    } else {
                                      handleAddNote(category, dayIndex)
                                    }
                                  }}
                                  onMarkComplete={() => handleMarkComplete(category, dayIndex)}
                                  isCompleted={goal?.isCompleted || false}
                                />
                              )}
                            </div>
                            {goal?.notes && !goal?.notesCompleted && (
                              <div className="w-full flex items-start gap-2 text-xs text-left px-3 py-2 bg-red-100 border-2 border-red-400 rounded-md text-red-900 shadow-sm">
                                <div className="flex-1">
                                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-0.5">{t("dailyGoals.pending")}</p>
                                  <p className="text-sm font-medium leading-tight">
                                    {goal.notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                  ))}
                  <td className="p-2 text-center align-middle border-l border-border bg-primary/10">
                    <span className="w-full h-8 flex items-center justify-center text-sm font-medium text-foreground tabular-nums">
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
            <div className="text-center p-2 md:p-3 rounded-xl color-zone-progress relative overflow-hidden">
              <p className="text-lg md:text-2xl font-semibold text-mint relative z-10 tabular-nums">
                {completedGoals}
              </p>
              <p className="text-[10px] md:text-xs text-foreground relative z-10 font-medium">{t("dailyGoals.completedGoals")}</p>
            </div>
            <div className="text-center p-2 md:p-3 rounded-xl color-zone-status relative overflow-hidden">
              <p className="text-lg md:text-2xl font-semibold text-sky relative z-10 tabular-nums">
                {groupedData.categories.length * 5}
              </p>
              <p className="text-[10px] md:text-xs text-foreground relative z-10 font-medium">{t("dailyGoals.totalGoals")}</p>
            </div>
            <div className="text-center p-2 md:p-3 rounded-xl color-zone-highlight relative overflow-hidden">
              <p className="text-lg md:text-2xl font-semibold text-amber relative z-10 tabular-nums">
                {groupedData.categories.length}
              </p>
              <p className="text-[10px] md:text-xs text-foreground relative z-10 font-medium">{t("dailyGoals.subjects")}</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Add Goal Modal */}
      {addGoalModalContext && (
        <DailyGoalAddModal
          open={addGoalModalOpen}
          onOpenChange={setAddGoalModalOpen}
          onSave={handleGoalSave}
        />
      )}

      {/* Add Note Modal */}
      {noteModalContext && (
        <DailyGoalNoteModal
          open={noteModalOpen}
          onOpenChange={setNoteModalOpen}
          currentNote={groupedData.data[noteModalContext.subject]?.[noteModalContext.dayIndex]?.notes}
          onSave={handleNoteSave}
        />
      )}

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
