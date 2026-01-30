import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/ui/error-alert"
import { DailyGoalsTable } from "@/components/daily-goals-table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { useDailyGoals, useCreateDailyGoal, useAddNoteToDailyGoal, useMarkDailyGoalComplete } from "@/hooks/queries/use-daily-goals"
import { toast } from "sonner"
import { calculatePagesFromGoalText } from "@/utils/daily-goal-pages"

export default function DailyGoalsPage() {
  const { studentId, projectionId, quarter, week } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const { t } = useTranslation()

  const [subjectToCategory, setSubjectToCategory] = React.useState<Map<string, string>>(new Map())
  const [subjects, setSubjects] = React.useState<string[]>([])
  const [loadingActions, setLoadingActions] = React.useState<Map<string, boolean>>(new Map())

  const currentQuarter = quarter || 'Q1'
  const currentWeek = week ? parseInt(week, 10) : 1

  const { data: goalsData, isLoading: loading, error: queryError } = useDailyGoals(
    studentId,
    projectionId,
    currentQuarter,
    currentWeek
  )

  const createDailyGoalMutation = useCreateDailyGoal()
  const addNoteMutation = useAddNoteToDailyGoal()
  const markCompleteMutation = useMarkDailyGoalComplete()

  const dayTotals = React.useMemo(() => {
    if (!goalsData) return [0, 0, 0, 0, 0];

    const totals = [0, 0, 0, 0, 0];

    if (!subjectToCategory || subjectToCategory.size === 0) {
      Object.values(goalsData).forEach((subjectGoals) => {
        subjectGoals.forEach((goal, dayIndex) => {
          if (goal?.text && dayIndex >= 0 && dayIndex < 5) {
            totals[dayIndex] += calculatePagesFromGoalText(goal.text);
          }
        });
      });
    } else {
      const categoryGroups = new Map<string, string[]>();
      subjects.forEach(subject => {
        if (subjectToCategory.has(subject)) {
          const category = subjectToCategory.get(subject)!;
          if (!categoryGroups.has(category)) {
            categoryGroups.set(category, []);
          }
          categoryGroups.get(category)!.push(subject);
        } else {
          if (!categoryGroups.has(subject)) {
            categoryGroups.set(subject, []);
          }
          categoryGroups.get(subject)!.push(subject);
        }
      });

      categoryGroups.forEach((subjectsInCategory) => {
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          const goalsForDay: Array<{ text: string }> = [];

          subjectsInCategory.forEach(subject => {
            const goal = goalsData[subject]?.[dayIndex];
            if (goal?.text) {
              goalsForDay.push(goal);
            }
          });

          if (goalsForDay.length > 0) {
            if (goalsForDay.length === 1) {
              totals[dayIndex] += calculatePagesFromGoalText(goalsForDay[0].text);
            } else {
              const uniqueTexts = new Set(goalsForDay.map(g => g.text));
              uniqueTexts.forEach(text => {
                totals[dayIndex] += calculatePagesFromGoalText(text);
              });
            }
          }
        }
      });
    }

    return totals;
  }, [goalsData, subjects, subjectToCategory]);

  React.useEffect(() => {
    const loadProjection = async () => {
      if (!projectionId) return

      try {
        const projection = await api.projections.getById(projectionId)

        const subjectCategoryMap = new Map<string, string>()
        const subjectDisplayOrderMap = new Map<string, number>()

        projection.projectionPaces.forEach((pace) => {
          const subjectName = pace.paceCatalog.subject.name
          const categoryName = pace.paceCatalog.subject.category.name
          const categoryDisplayOrder = pace.paceCatalog.subject.category.displayOrder

          if (!subjectCategoryMap.has(subjectName)) {
            subjectCategoryMap.set(subjectName, categoryName)
            subjectDisplayOrderMap.set(subjectName, categoryDisplayOrder)
          }
        })

        setSubjectToCategory(subjectCategoryMap)

        const uniqueSubjects = Array.from(subjectCategoryMap.keys())
        const sortedSubjects = uniqueSubjects.sort((a, b) => {
          const orderA = subjectDisplayOrderMap.get(a) || 0
          const orderB = subjectDisplayOrderMap.get(b) || 0
          if (orderA !== orderB) {
            return orderA - orderB
          }
          return a.localeCompare(b)
        })

        setSubjects(sortedSubjects)
      } catch (err) {
        console.error('Error loading projection:', err)
      }
    }

    loadProjection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectionId])

  const getPrevWeek = () => {
    if (currentWeek > 1) {
      return { quarter: currentQuarter, week: currentWeek - 1 }
    } else {
      const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4']
      const currentIndex = quarterOrder.indexOf(currentQuarter)
      if (currentIndex > 0) {
        return { quarter: quarterOrder[currentIndex - 1], week: 9 }
      }
    }
    return null
  }

  const getNextWeek = () => {
    if (currentWeek < 9) {
      return { quarter: currentQuarter, week: currentWeek + 1 }
    } else {
      const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4']
      const currentIndex = quarterOrder.indexOf(currentQuarter)
      if (currentIndex < 3) {
        return { quarter: quarterOrder[currentIndex + 1], week: 1 }
      }
    }
    return null
  }

  const handleNavigateWeek = (targetQuarter: string, targetWeek: number) => {
    if (!studentId || !projectionId) return
    navigate(`/students/${studentId}/projections/${projectionId}/${targetQuarter}/week/${targetWeek}`)
  }

  const getQuarterName = (q: string) => {
    const quarterLabels: { [key: string]: string } = {
      'Q1': t("common.quarterLabelQ1") || "First Quarter",
      'Q2': t("common.quarterLabelQ2") || "Second Quarter",
      'Q3': t("common.quarterLabelQ3") || "Third Quarter",
      'Q4': t("common.quarterLabelQ4") || "Fourth Quarter",
    }
    return quarterLabels[q] || q
  }

  const getSubjectFromCategory = (categoryOrSubject: string): string => {
    if (subjects.includes(categoryOrSubject)) {
      return categoryOrSubject
    }
    const subjectInCategory = subjects.find(subject => {
      const category = subjectToCategory.get(subject)
      return category === categoryOrSubject
    })
    return subjectInCategory || categoryOrSubject
  }

  const handleGoalUpdate = async (categoryOrSubject: string, dayIndex: number, text: string) => {
    if (!projectionId || !studentId) return

    const subject = getSubjectFromCategory(categoryOrSubject)
    const loadingKey = `goal-add-${categoryOrSubject}-${dayIndex}`

    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await createDailyGoalMutation.mutateAsync({
        projectionId,
        subject,
        quarter: currentQuarter,
        week: currentWeek,
        dayOfWeek: dayIndex + 1,
        text,
        studentId,
      })
      toast.success(t("dailyGoals.goalCreated") || "Daily goal created successfully")
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("dailyGoals.errorCreatingGoal") || "Failed to create daily goal")
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }

  const findGoalInData = (categoryOrSubject: string, dayIndex: number) => {
    if (!goalsData) return null

    const subject = getSubjectFromCategory(categoryOrSubject)
    let goal = goalsData[subject]?.[dayIndex]

    if (goal?.id) {
      return goal
    }

    if (subjectToCategory.has(subject)) {
      const category = subjectToCategory.get(subject)!
      if (category === categoryOrSubject) {
        return goal
      }
    }

    const subjectsInCategory = Array.from(subjectToCategory.entries())
      .filter(([, cat]) => cat === categoryOrSubject)
      .map(([subj]) => subj)

    for (const subj of subjectsInCategory) {
      goal = goalsData[subj]?.[dayIndex]
      if (goal?.id) {
        return goal
      }
    }

    return goal
  }

  const handleNotesUpdate = async (categoryOrSubject: string, dayIndex: number, notes: string) => {
    if (!goalsData || !studentId) return

    const goal = findGoalInData(categoryOrSubject, dayIndex)
    if (!goal?.id) return

    const loadingKey = `note-${goal.id}`

    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await addNoteMutation.mutateAsync({
        dailyGoalId: goal.id,
        notes,
        studentId,
        projectionId,
        quarter: currentQuarter,
        week: currentWeek,
      })
      toast.success(t("dailyGoals.noteAdded") || "Note added successfully")
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("dailyGoals.errorAddingNote") || "Failed to add note")
      console.error('Error adding note:', err)
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }

  const isSelfTest = (text: string): boolean => {
    const normalized = text.trim().toUpperCase()
    return normalized === 'ST' || normalized === 'SELF TEST'
  }

  const getNextDay = (dayIndex: number, quarter: string, week: number): { quarter: string; week: number; dayIndex: number } | null => {
    // If it's Monday-Thursday (0-3), next day is dayIndex + 1
    if (dayIndex < 4) {
      return { quarter, week, dayIndex: dayIndex + 1 }
    }

    // If it's Friday (4), next day is Monday (0) of next week
    if (week < 9) {
      return { quarter, week: week + 1, dayIndex: 0 }
    }

    // If it's Friday of week 9, next day is Monday of week 1 of next quarter
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4']
    const currentIndex = quarterOrder.indexOf(quarter)
    if (currentIndex < 3) {
      return { quarter: quarterOrder[currentIndex + 1], week: 1, dayIndex: 0 }
    }

    // Last quarter, week 9, Friday - no next day
    return null
  }

  const handleGoalToggle = async (categoryOrSubject: string, dayIndex: number) => {
    if (!goalsData || !studentId || !projectionId) return

    const goal = findGoalInData(categoryOrSubject, dayIndex)
    if (!goal?.id) return

    const loadingKey = `goal-toggle-${goal.id}`
    const wasCompleted = goal.isCompleted
    const willBeCompleted = !wasCompleted

    setLoadingActions(prev => new Map(prev).set(loadingKey, true))

    try {
      await markCompleteMutation.mutateAsync({
        dailyGoalId: goal.id,
        isCompleted: willBeCompleted,
        studentId,
        projectionId,
        quarter: currentQuarter,
        week: currentWeek,
      })

      // If marking an ST/Self Test as completed, automatically create a Test for the next day
      if (willBeCompleted && goal.text && isSelfTest(goal.text)) {
        const nextDay = getNextDay(dayIndex, currentQuarter, currentWeek)

        if (nextDay) {
          const subject = getSubjectFromCategory(categoryOrSubject)

          // Check if a goal already exists for the next day (only if in same week/quarter)
          const isNextDayInSameWeek = nextDay.quarter === currentQuarter && nextDay.week === currentWeek
          const nextDayGoal = isNextDayInSameWeek ? findGoalInData(categoryOrSubject, nextDay.dayIndex) : null

          // Only create if no goal exists (or if next day is in different week/quarter, try anyway - backend handles duplicates)
          if (!nextDayGoal?.text) {
            try {
              await createDailyGoalMutation.mutateAsync({
                projectionId,
                subject,
                quarter: nextDay.quarter,
                week: nextDay.week,
                dayOfWeek: nextDay.dayIndex + 1,
                text: 'Test',
                studentId,
              })
              toast.success(t("dailyGoals.testAutoCreated") || "Test automatically created for next day")
            } catch (testErr) {
              // Silently fail if test already exists or other error
              console.log('Could not auto-create test:', testErr)
            }
          }
        }
      }

      toast.success(
        wasCompleted
          ? (t("dailyGoals.goalMarkedIncomplete") || "Goal marked as incomplete")
          : (t("dailyGoals.goalMarkedComplete") || "Goal marked as complete")
      )
    } catch (err) {
      const error = err as Error
      toast.error(error.message || t("dailyGoals.errorMarkingComplete") || "Failed to update goal")
      console.error('Error marking goal complete:', err)
    } finally {
      setLoadingActions(prev => {
        const next = new Map(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t("dailyGoals.title") || "Daily Goals"}
            </h1>
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="soft"
              disabled
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              disabled
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="bg-transparent border-none">
          <CardContent className="p-0">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const error = queryError ? (queryError as Error).message : null
  if (error) {
    const isNetworkError = error.toLowerCase().includes('failed to fetch') ||
      error.toLowerCase().includes('network error') ||
      error.toLowerCase().includes('networkerror')

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <ErrorAlert
          title={t("errors.loadDailyGoalsFailed") || "Failed to load daily goals"}
          message={error}
          isNetworkError={isNetworkError}
        />
      </div>
    )
  }

  const prevWeek = getPrevWeek()
  const nextWeek = getNextWeek()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dailyGoals.title") || "Daily Goals"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {getQuarterName(currentQuarter)} - {t("projections.week")} {currentWeek}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="soft"
            onClick={() => {
              if (prevWeek) {
                handleNavigateWeek(prevWeek.quarter, prevWeek.week)
              }
            }}
            disabled={!prevWeek}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            onClick={() => {
              if (nextWeek) {
                handleNavigateWeek(nextWeek.quarter, nextWeek.week)
              }
            }}
            disabled={!nextWeek}
            className="flex items-center gap-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-transparent border-none">
        <CardContent className="p-0">
          <DailyGoalsTable
            quarter={currentQuarter}
            quarterName={getQuarterName(currentQuarter)}
            week={currentWeek}
            data={goalsData || {}}
            subjects={subjects}
            subjectToCategory={subjectToCategory}
            loadingActions={loadingActions}
            onGoalUpdate={handleGoalUpdate}
            onNotesUpdate={handleNotesUpdate}
            onGoalToggle={handleGoalToggle}
            dayTotals={dayTotals}
          />
        </CardContent>
      </Card>
    </div>
  )
}
