import * as React from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { BackButton } from "@/components/ui/back-button"
import { Loading } from "@/components/ui/loading"
import { DailyGoalsTable } from "@/components/daily-goals-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useApi } from "@/services/api"
import type { DailyGoalData, DailyGoal, NoteHistory } from "@/types/pace"
import type { ProjectionDetail } from "@/types/projection-detail"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { sortCategoriesByOrder } from "@/utils/category-order"

interface Student {
  id: string
  name: string
  currentGrade: string
  schoolYear: string
}

interface LocationState {
  student?: Student | null
}

// Helper function to calculate pages from input value
const calculatePagesFromValue = (value: string): number => {
  if (!value.trim()) return 0

  const trimmedValue = value.trim()

  // Check for "ST" (Self Test) - case insensitive
  if (/^st$/i.test(trimmedValue)) {
    return 3
  }

  // Check for "T" (Test) - case insensitive
  if (/^t$/i.test(trimmedValue)) {
    return 1
  }

  // Check for range format (e.g., "45-46", "1-10") - must be valid numbers 1-1000
  const rangeMatch = trimmedValue.match(/^([1-9]\d{0,3})-([1-9]\d{0,3})$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    // Validate range is within 1-1000 and start <= end
    if (start >= 1 && end <= 1000 && start <= end) {
      const pages = end - start + 1 // +1 because both start and end are included
      return pages
    }
  }

  // Check for single number (1-1000) - no leading zeros
  const singleMatch = trimmedValue.match(/^[1-9]\d{0,3}$/)
  if (singleMatch) {
    const num = parseInt(singleMatch[0])
    if (num >= 1 && num <= 1000) {
      return 1
    }
  }

  // If no valid format, return 0
  return 0
}

export default function DailyGoalsPage() {
  const { studentId, projectionId, quarter, week } = useParams()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const navigate = useNavigate()
  const api = useApi()
  const { t } = useTranslation()
  const [goalsData, setGoalsData] = React.useState<DailyGoalData>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [canEdit, setCanEdit] = React.useState(false)
  const [projectionDetail, setProjectionDetail] = React.useState<ProjectionDetail | null>(null)
  // Initialize student from location state if available (passed from ACE Projection)
  const [student, setStudent] = React.useState<Student | null>(locationState?.student || null)

  // Load daily goals from API
  React.useEffect(() => {
    const loadDailyGoals = async () => {
      if (!studentId || !projectionId || !quarter || !week) return

      try {
        setLoading(true)
        setError(null)
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (err) {
        console.error('Error loading daily goals:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar las metas diarias')
        // Fallback to empty data structure
        const subjects = ['Math', 'English', 'Science', 'Social Studies', 'Word Building', 'Spanish']
        const emptyData: DailyGoalData = {}
        subjects.forEach(subject => {
          emptyData[subject] = Array(5).fill(null).map(() => ({
            text: '',
            isCompleted: false,
            notes: undefined,
            notesCompleted: false,
            notesHistory: []
          }))
        })
        setGoalsData(emptyData)
      } finally {
        setLoading(false)
      }
    }

    loadDailyGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId, quarter, week])

  React.useEffect(() => {
    const loadPermissions = async () => {
      try {
        const userInfo = await api.auth.getUserInfo()
        setCanEdit(userInfo.permissions?.includes('projections.update') ?? false)
      } catch (err) {
        console.error('Error fetching permissions:', err)
        setCanEdit(false)
      }
    }

    loadPermissions()
  }, [api])

  // Load student info from projection detail only if not passed via state
  // This handles direct URL access or page refresh
  React.useEffect(() => {
    const loadStudent = async () => {
      // Skip fetch if we already have student data from location state
      if (student) return

      if (!studentId || !projectionId) return

      try {
        const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
        setProjectionDetail(detail)
        setStudent({
          id: detail.studentId,
          name: detail.student.fullName,
          currentGrade: detail.student.currentLevel || "N/A",
          schoolYear: detail.schoolYear,
        })
      } catch (err) {
        console.error("[DailyGoalsPage] Error loading student for daily goals:", err)
        // Fallback to a generic placeholder if needed
        setStudent({
          id: studentId,
          name: "Estudiante",
          currentGrade: "",
          schoolYear: "",
        })
      }
    }

    loadStudent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId])

  // Build subject to category mapping
  const subjectToCategory = React.useMemo(() => {
    const mapping = new Map<string, string>()
    if (projectionDetail) {
      Object.values(projectionDetail.quarters).forEach(quarter => {
        Object.entries(quarter).forEach(([subject, weekPaces]) => {
          const firstPace = weekPaces.find(p => p !== null)
          if (firstPace && firstPace.category) {
            mapping.set(subject, firstPace.category)
          }
        })
      })
    } else {
      // Fallback: Extract category from sub-subject names (e.g., "English L7" -> "English")
      // This pattern matches sub-subject names that follow "Category Level" format
      Object.keys(goalsData).forEach(subject => {
        // Match pattern like "English L7", "Math L8", "Español y Ortografía L8"
        // Extract the category part (everything before the last space and level indicator)
        const match = subject.match(/^(.+?)\s+L\d+$/)
        if (match && match[1]) {
          const extractedName = match[1].trim()
          // Map Spanish sub-subjects to "Spanish" category
          if (extractedName.toLowerCase().includes('español') ||
            extractedName.toLowerCase().includes('espanol') ||
            extractedName.toLowerCase().includes('ortografía') ||
            extractedName.toLowerCase().includes('ortografia')) {
            mapping.set(subject, 'Spanish')
          } else {
            mapping.set(subject, extractedName)
          }
        }
      })
    }
    return mapping
  }, [projectionDetail, goalsData])

  // Group daily goals by category
  const groupedGoalsData = React.useMemo(() => {
    // Get categories from projection if available, otherwise use categories from paces
    const projectionCategories = projectionDetail?.categories || []
    const categoriesFromPaces = new Set<string>()

    if (projectionDetail) {
      Object.values(projectionDetail.quarters).forEach(quarter => {
        Object.values(quarter).forEach(weekPaces => {
          const firstPace = weekPaces.find(p => p !== null)
          if (firstPace && firstPace.category) {
            categoriesFromPaces.add(firstPace.category)
          }
        })
      })
    }

    // Use projection categories if available, otherwise use categories from paces
    const allCategories = projectionCategories.length > 0
      ? new Set(projectionCategories)
      : new Set(categoriesFromPaces)

    // If no projection detail, return goalsData as-is
    if (!projectionDetail) {
      return goalsData
    }

    const categoryGroups = new Map<string, string[]>() // category -> [subjects]

    // Initialize all categories with empty arrays
    allCategories.forEach(category => {
      categoryGroups.set(category, [])
    })

    // Group subjects by category
    // Only use categories that are in allCategories (projection categories)
    Object.keys(goalsData).forEach(subject => {
      const category = subjectToCategory.get(subject)
      if (category && allCategories.has(category)) {
        // Only add if category is in allCategories (ensures we use projection category names)
        categoryGroups.get(category)!.push(subject)
      } else if (category) {
        // Category from mapping doesn't match projection categories
        // This shouldn't happen, but log it for debugging
        console.warn(`Category "${category}" from subject "${subject}" not in projection categories`)
      }
    })

    // Build grouped result
    const result: DailyGoalData = {}

    // Only process categories that are in allCategories (projection categories)
    // This ensures we never use sub-subject names as category keys
    allCategories.forEach(category => {
      const subjects = categoryGroups.get(category) || []

      // For each day (0-4), combine goals from all sub-subjects in this category
      const combinedGoals: DailyGoal[] = Array(5).fill(null).map(() => ({
        text: '',
        isCompleted: false,
        notes: undefined,
        notesCompleted: false,
        notesHistory: []
      }))

      for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
        const goalsForDay: DailyGoal[] = []

        subjects.forEach(subject => {
          const goal = goalsData[subject]?.[dayIndex]
          if (goal && goal.text) {
            goalsForDay.push(goal)
          }
        })

        if (goalsForDay.length > 0) {
          // Combine goals: if multiple, sum the pages or combine text
          if (goalsForDay.length === 1) {
            combinedGoals[dayIndex] = goalsForDay[0]
          } else {
            // Multiple goals for same day - combine them
            const combinedText = goalsForDay.map(g => g.text).filter(t => t).join(', ')
            const combinedIsCompleted = goalsForDay.every(g => g.isCompleted)
            const combinedNotes = goalsForDay.map(g => g.notes).filter(n => n).join('; ')

            // Combine notes history
            const combinedNotesHistory: NoteHistory[] = []
            goalsForDay.forEach(g => {
              if (g.notesHistory) {
                combinedNotesHistory.push(...g.notesHistory)
              }
            })
            // Sort by date (most recent first)
            combinedNotesHistory.sort((a, b) =>
              new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
            )

            combinedGoals[dayIndex] = {
              text: combinedText,
              isCompleted: combinedIsCompleted,
              notes: combinedNotes || undefined,
              notesCompleted: goalsForDay.some(g => g.notesCompleted),
              notesHistory: combinedNotesHistory
            }
          }
        } else {
          combinedGoals[dayIndex] = {
            text: '',
            isCompleted: false,
            notes: undefined,
            notesCompleted: false,
            notesHistory: []
          }
        }
      }

      // Only add categories that are in allCategories (projection categories)
      result[category] = combinedGoals
    })

    // Also add categories that don't have any goalsData yet (from projection but no goals)
    allCategories.forEach(category => {
      if (!result[category]) {
        // Create empty goals for this category
        result[category] = Array(5).fill(null).map(() => ({
          text: '',
          isCompleted: false,
          notes: undefined,
          notesCompleted: false,
          notesHistory: []
        }))
      }
    })

    // Don't add unmapped subjects - they should be mapped to categories
    // If a subject isn't mapped, it means there's a data inconsistency
    // We'll only show categories that are in the projection

    // Sort result keys by category order
    const sortedKeys = sortCategoriesByOrder(Object.keys(result))
    const sortedResult: DailyGoalData = {}
    sortedKeys.forEach(key => {
      sortedResult[key] = result[key]
    })

    return sortedResult
  }, [goalsData, projectionDetail, subjectToCategory])

  // Calculate total pages for a specific day (use grouped data)
  const calculateDayTotal = React.useMemo(() => {
    const dayTotals = [0, 0, 0, 0, 0] // 5 days

    // Use groupedGoalsData for calculation
    const dataToUse = Object.keys(groupedGoalsData).length > 0 ? groupedGoalsData : goalsData

    Object.keys(dataToUse).forEach(subject => {
      dataToUse[subject]?.forEach((goal, dayIndex) => {
        const pages = calculatePagesFromValue(goal.text)
        dayTotals[dayIndex] += pages
      })
    })
    return dayTotals
  }, [goalsData, groupedGoalsData])

  const handleGoalUpdate = async (subject: string, dayIndex: number, value: string) => {
    if (!studentId || !projectionId || !quarter || !week) return

    // Check if subject is a category (a category value) or a sub-subject (a key)
    // subjectToCategory is a Map, so we need to use Array.from to get values
    const categoryValues = Array.from(subjectToCategory.values())
    const isCategory = !subjectToCategory.has(subject) && categoryValues.includes(subject)

    // If it's a category, find all sub-subjects in that category
    const subjectsToUpdate: string[] = []
    if (isCategory) {
      // subject is a category, find all sub-subjects
      subjectToCategory.forEach((category, subSubject) => {
        if (category === subject) {
          subjectsToUpdate.push(subSubject)
        }
      })
    } else {
      // subject is a sub-subject (or doesn't have a category)
      subjectsToUpdate.push(subject)
    }

    // OPTIMISTIC UPDATE: Immediately update the goal in the UI for all relevant subjects

    // Create the updated data structure first
    const updatedGoalsData = { ...goalsData }

    subjectsToUpdate.forEach(subSubjectToUpdate => {
      if (!updatedGoalsData[subSubjectToUpdate]) {
        updatedGoalsData[subSubjectToUpdate] = Array(5).fill(null).map(() => ({
          text: '',
          isCompleted: false,
          notes: undefined,
          notesCompleted: false,
          notesHistory: []
        }))
      }

      const currentGoal = goalsData[subSubjectToUpdate]?.[dayIndex]
      updatedGoalsData[subSubjectToUpdate] = [...updatedGoalsData[subSubjectToUpdate]]
      updatedGoalsData[subSubjectToUpdate][dayIndex] = {
        ...currentGoal,
        text: value,
        isCompleted: currentGoal?.isCompleted || false,
        notes: currentGoal?.notes,
        notesCompleted: currentGoal?.notesCompleted || false,
        notesHistory: currentGoal?.notesHistory || []
      }
    })

    // Update UI immediately - this must happen synchronously before any async operations
    setGoalsData(updatedGoalsData)

    try {
      // For API calls, use the first sub-subject in the category (or the subject itself if not a category)
      const apiSubject = subjectsToUpdate[0] || subject
      const apiGoal = goalsData[apiSubject]?.[dayIndex]

      if (apiGoal?.id) {
        // Update existing goal - update all sub-subjects in category
        await Promise.all(subjectsToUpdate.map(async (subSubject) => {
          const subGoal = goalsData[subSubject]?.[dayIndex]
          if (subGoal?.id) {
            await api.dailyGoals.update(studentId, projectionId, subGoal.id, {
              text: value,
              subject: subSubject,
              quarter,
              week: parseInt(week),
              dayOfWeek: dayIndex
            })
          } else if (value.trim()) {
            await api.dailyGoals.create(studentId, projectionId, {
              subject: subSubject,
              quarter,
              week: parseInt(week),
              dayOfWeek: dayIndex,
              text: value,
              isCompleted: false
            })
          }
        }))
        toast.success(t("dailyGoals.goalUpdated"))
      } else if (value.trim()) {
        // Create new goal for all sub-subjects in category
        await Promise.all(subjectsToUpdate.map(async (subSubject) => {
          await api.dailyGoals.create(studentId, projectionId, {
            subject: subSubject,
            quarter,
            week: parseInt(week),
            dayOfWeek: dayIndex,
            text: value,
            isCompleted: false
          })
        }))
        toast.success(t("dailyGoals.goalCreated"))
      }

      // Refresh data to sync IDs and ensure consistency (but UI already shows the goal)
      const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
      setGoalsData(data)
    } catch (err) {
      console.error('Error updating goal:', err)
      const errorMessage = err instanceof Error ? err.message : t("dailyGoals.errorUpdatingGoal")

      toast.error(t("dailyGoals.errorPrefix") + ": " + errorMessage)
      setError(errorMessage)

      // ROLLBACK: Reload data to revert UI on error
      try {
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (reloadErr) {
        console.error('Error reloading after failed goal update:', reloadErr)
      }
    }
  }

  const handleGoalToggle = async (subject: string, dayIndex: number) => {
    if (!studentId || !projectionId || !quarter || !week) return

    // Check if subject is a category (a category value) or a sub-subject (a key)
    // subjectToCategory is a Map, so we need to use Array.from to get values
    const categoryValues = Array.from(subjectToCategory.values())
    const isCategory = !subjectToCategory.has(subject) && categoryValues.includes(subject)

    // If it's a category, find all sub-subjects in that category
    const subjectsToUpdate: string[] = []
    if (isCategory) {
      // subject is a category, find all sub-subjects
      subjectToCategory.forEach((category, subSubject) => {
        if (category === subject) {
          subjectsToUpdate.push(subSubject)
        }
      })
    } else {
      // subject is a sub-subject (or doesn't have a category)
      subjectsToUpdate.push(subject)
    }

    // Get the first sub-subject to check if goal exists
    const apiSubject = subjectsToUpdate[0] || subject
    const currentGoal = goalsData[apiSubject]?.[dayIndex]
    if (!currentGoal?.id) return

    const newCompleted = !currentGoal.isCompleted

    // OPTIMISTIC UPDATE: Immediately toggle completion in the UI for all relevant subjects
    const updatedGoalsData = { ...goalsData }

    subjectsToUpdate.forEach(subSubjectToUpdate => {
      const subGoal = goalsData[subSubjectToUpdate]?.[dayIndex]
      if (!subGoal?.id) return

      updatedGoalsData[subSubjectToUpdate] = [...updatedGoalsData[subSubjectToUpdate]]
      updatedGoalsData[subSubjectToUpdate][dayIndex] = {
        ...subGoal,
        isCompleted: newCompleted,
        // If completing and has pending notes, optimistically clear them
        notes: (newCompleted && subGoal.notes && !subGoal.notesCompleted) ? undefined : subGoal.notes,
        notesCompleted: (newCompleted && subGoal.notes && !subGoal.notesCompleted) ? true : subGoal.notesCompleted,
        notesHistory: (newCompleted && subGoal.notes && !subGoal.notesCompleted)
          ? [...(subGoal.notesHistory || []), { text: subGoal.notes, completedDate: new Date().toISOString() }]
          : subGoal.notesHistory
      }
    })

    // Update UI immediately - this must happen synchronously before any async operations
    setGoalsData(updatedGoalsData)

    try {
      // Update completion for all sub-subjects in category
      await Promise.all(subjectsToUpdate.map(async (subSubject) => {
        const subGoal = goalsData[subSubject]?.[dayIndex]
        if (subGoal?.id) {
          await api.dailyGoals.updateCompletion(studentId, projectionId, subGoal.id, newCompleted)

          // If goal is being marked as completed and has pending notes, auto-complete them
          if (newCompleted && subGoal.notes && !subGoal.notesCompleted) {
            try {
              // Add note to history and clear current note
              await api.dailyGoals.addNoteToHistory(studentId, projectionId, subGoal.id, subGoal.notes)
              await api.dailyGoals.updateNotes(studentId, projectionId, subGoal.id, {
                notes: undefined,
                notesCompleted: true
              })
            } catch (notesErr) {
              console.error('Error auto-completing notes:', notesErr)
              // Don't fail the whole operation if notes completion fails
            }
          }
        }
      }))

      toast.success(newCompleted ? t("dailyGoals.goalCompleted") : t("dailyGoals.goalMarkedIncomplete"))

      // Refresh data to ensure consistency
      const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
      setGoalsData(data)
    } catch (err) {
      console.error('Error toggling goal completion:', err)
      const errorMessage = err instanceof Error ? err.message : t("dailyGoals.errorUpdatingGoalStatus")

      toast.error(t("dailyGoals.errorPrefix") + ": " + errorMessage)
      setError(errorMessage)

      // ROLLBACK: Reload data to revert UI on error
      try {
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (reloadErr) {
        console.error('Error reloading after failed goal toggle:', reloadErr)
      }
    }
  }

  const handleNotesUpdate = async (subject: string, dayIndex: number, notes: string) => {
    if (!studentId || !projectionId || !quarter || !week) return

    // Check if subject is a category (a category value) or a sub-subject (a key)
    // subjectToCategory is a Map, so we need to use Array.from to get values
    const categoryValues = Array.from(subjectToCategory.values())
    const isCategory = !subjectToCategory.has(subject) && categoryValues.includes(subject)

    // If it's a category, find all sub-subjects in that category
    const subjectsToUpdate: string[] = []
    if (isCategory) {
      // subject is a category, find all sub-subjects
      subjectToCategory.forEach((category, subSubject) => {
        if (category === subject) {
          subjectsToUpdate.push(subSubject)
        }
      })
    } else {
      // subject is a sub-subject (or doesn't have a category)
      subjectsToUpdate.push(subject)
    }

    // OPTIMISTIC UPDATE: Immediately update notes in the UI for all relevant subjects
    const updatedGoalsData = { ...goalsData }

    subjectsToUpdate.forEach(subSubjectToUpdate => {
      const currentGoal = goalsData[subSubjectToUpdate]?.[dayIndex]
      if (!currentGoal?.id) return

      updatedGoalsData[subSubjectToUpdate] = [...updatedGoalsData[subSubjectToUpdate]]
      updatedGoalsData[subSubjectToUpdate][dayIndex] = {
        ...currentGoal,
        notes: notes || undefined,
        notesCompleted: false
      }
    })

    // Update UI immediately - this must happen synchronously before any async operations
    setGoalsData(updatedGoalsData)

    try {
      // Update notes for all sub-subjects in category
      await Promise.all(subjectsToUpdate.map(async (subSubject) => {
        const subGoal = goalsData[subSubject]?.[dayIndex]
        if (subGoal?.id) {
          await api.dailyGoals.updateNotes(studentId, projectionId, subGoal.id, {
            notes: notes || undefined,
            notesCompleted: false
          })
        }
      }))

      toast.success(notes ? t("dailyGoals.noteSaved") : t("dailyGoals.noteDeleted"))

      // Refresh data to ensure consistency
      const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
      setGoalsData(data)
    } catch (err) {
      console.error('Error updating notes:', err)
      const errorMessage = err instanceof Error ? err.message : t("dailyGoals.errorUpdatingNote")

      toast.error(t("dailyGoals.errorPrefix") + ": " + errorMessage)
      setError(errorMessage)

      // ROLLBACK: Reload data to revert UI on error
      try {
        const data = await api.dailyGoals.get(studentId, projectionId, quarter, parseInt(week))
        setGoalsData(data)
      } catch (reloadErr) {
        console.error('Error reloading after failed notes update:', reloadErr)
      }
    }
  }

  const getQuarterName = (quarter: string) => {
    const quarterNames: { [key: string]: string } = {
      'Q1': t("dailyGoals.firstQuarter"),
      'Q2': t("dailyGoals.secondQuarter"),
      'Q3': t("dailyGoals.thirdQuarter"),
      'Q4': t("dailyGoals.fourthQuarter")
    }
    return quarterNames[quarter] || quarter
  }

  const getPreviousWeek = (): { quarter: string; week: number } | null => {
    if (!quarter || !week) return null
    const currentWeekNum = parseInt(week)
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    const currentQuarterIndex = quarters.indexOf(quarter)

    if (currentWeekNum > 1) {
      return { quarter, week: currentWeekNum - 1 }
    } else if (currentQuarterIndex > 0) {
      return { quarter: quarters[currentQuarterIndex - 1], week: 9 }
    }
    return null
  }

  const getNextWeek = (): { quarter: string; week: number } | null => {
    if (!quarter || !week) return null
    const currentWeekNum = parseInt(week)
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    const currentQuarterIndex = quarters.indexOf(quarter)

    if (currentWeekNum < 9) {
      return { quarter, week: currentWeekNum + 1 }
    } else if (currentQuarterIndex < 3) {
      return { quarter: quarters[currentQuarterIndex + 1], week: 1 }
    }
    return null
  }

  const handleNavigateWeek = (targetQuarter: string, targetWeek: number) => {
    if (!studentId || !projectionId) return
    navigate(`/students/${studentId}/projections/${projectionId}/${targetQuarter}/week/${targetWeek}`, {
      state: {
        student: student || locationState?.student || null
      }
    })
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-page-entrance">
      {/* Mobile-only back button (desktop uses breadcrumb) */}
      <div className="flex items-center gap-4 md:hidden">
        <BackButton to={`/students/${studentId}/projections/${projectionId}`}>
          {t("common.back")}
        </BackButton>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{t("dailyGoals.title")}</h1>
          {student && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">{student.name}</span>
              {quarter && week && (
                <Badge variant="filter-active" className="text-xs">
                  {quarter ? getQuarterName(quarter) : ""} - {t("common.week")} {week}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Week Navigation Buttons */}
        {quarter && week && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const prev = getPreviousWeek()
                if (prev) handleNavigateWeek(prev.quarter, prev.week)
              }}
              disabled={!getPreviousWeek()}
              className="flex items-center gap-2 transition-colors"
              style={{
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-soft)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.filter = 'brightness(0.95)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = ''
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("dailyGoals.previousWeek")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const next = getNextWeek()
                if (next) handleNavigateWeek(next.quarter, next.week)
              }}
              disabled={!getNextWeek()}
              className="flex items-center gap-2 transition-colors"
              style={{
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-soft)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.filter = 'brightness(0.95)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = ''
              }}
            >
              {t("dailyGoals.nextWeek")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <Loading variant="section" />
      ) : (
        /* Daily Goals Table */
        <div className="animate-staggered" style={{ animationDelay: '100ms' }}>
          <DailyGoalsTable
            quarter={quarter || "Q1"}
            quarterName={quarter ? getQuarterName(quarter) : t("dailyGoals.firstQuarter")}
            week={parseInt(week || "1")}
            data={groupedGoalsData}
            subjects={Object.keys(groupedGoalsData)}
            subjectToCategory={subjectToCategory}
            onGoalUpdate={canEdit ? handleGoalUpdate : undefined}
            onGoalToggle={canEdit ? handleGoalToggle : undefined}
            onNotesUpdate={canEdit ? handleNotesUpdate : undefined}
            dayTotals={calculateDayTotal}
          />
        </div>
      )}
    </div>
  )
}

