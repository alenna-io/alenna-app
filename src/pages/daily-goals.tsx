import * as React from "react"
import { useParams } from "react-router-dom"
import { BackButton } from "@/components/ui/back-button"
import { StudentInfoCard } from "@/components/ui/student-info-card"
import { DailyGoalsTable } from "@/components/daily-goals-table"
import type { DailyGoalData } from "@/types/pace"

interface Student {
  id: string
  name: string
  currentGrade: string
  schoolYear: string
}

// Mock student data
const mockStudent: Student = {
  id: "1",
  name: "Ximena García López",
  currentGrade: "8th Grade",
  schoolYear: "2024-2025"
}

// Mock daily goals data
const mockDailyGoals: DailyGoalData = {
  Math: [
    { text: "45-46", isCompleted: false },
    { text: "47-48", isCompleted: false },
    { text: "49-51", isCompleted: false },
    { text: "Self Test", isCompleted: false },
    { text: "", isCompleted: false }
  ],
  English: [
    { text: "1-10", isCompleted: true },
    { text: "11-20", isCompleted: false },
    { text: "21-30", isCompleted: false },
    { text: "31-39", isCompleted: false },
    { text: "Self Test", isCompleted: false }
  ],
  "Word Building": [
    { text: "7-13", isCompleted: false },
    { text: "14-21", isCompleted: false },
    { text: "22-28", isCompleted: false },
    { text: "29-35", isCompleted: false },
    { text: "Self Test", isCompleted: false }
  ],
  Science: [
    { text: "45-48", isCompleted: false },
    { text: "49-52", isCompleted: false },
    { text: "53-56", isCompleted: false },
    { text: "57-59", isCompleted: false },
    { text: "Self Test", isCompleted: false }
  ],
  "Social Studies": [
    { text: "11-19", isCompleted: false },
    { text: "20-28", isCompleted: false },
    { text: "29-37", isCompleted: false },
    { text: "38-46", isCompleted: false },
    { text: "47-55", isCompleted: false }
  ],
  Spanish: [
    { text: "19-22", isCompleted: false },
    { text: "23-26", isCompleted: false },
    { text: "27-30", isCompleted: false },
    { text: "31-35", isCompleted: false },
    { text: "Self Test", isCompleted: false }
  ]
}

const subjects = Object.keys(mockDailyGoals)

// Helper function to calculate pages from input value
const calculatePagesFromValue = (value: string): number => {
  if (!value.trim()) return 0

  const trimmedValue = value.trim()

  // Check for "Self Test" (case insensitive)
  if (/^self\s*test$/i.test(trimmedValue)) {
    return 3
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
  const [goalsData, setGoalsData] = React.useState(mockDailyGoals)

  // Calculate total pages for a specific day
  const calculateDayTotal = React.useMemo(() => {
    const dayTotals = [0, 0, 0, 0, 0] // 5 days

    subjects.forEach(subject => {
      goalsData[subject]?.forEach((goal, dayIndex) => {
        const pages = calculatePagesFromValue(goal.text)
        dayTotals[dayIndex] += pages
      })
    })
    return dayTotals
  }, [goalsData])

  const handleGoalUpdate = (subject: string, dayIndex: number, value: string) => {
    setGoalsData(prev => ({
      ...prev,
      [subject]: prev[subject].map((goal, index) =>
        index === dayIndex ? { ...goal, text: value } : goal
      )
    }))
  }

  const handleGoalToggle = (subject: string, dayIndex: number) => {
    setGoalsData(prev => ({
      ...prev,
      [subject]: prev[subject].map((goal, index) => {
        if (index === dayIndex) {
          const newCompleted = !goal.isCompleted

          // If goal is being marked as completed and has pending notes, auto-complete them
          if (newCompleted && goal.notes && !goal.notesCompleted) {
            const newHistory = [
              ...(goal.notesHistory || []),
              {
                text: goal.notes,
                completedDate: new Date().toISOString()
              }
            ]
            return {
              ...goal,
              isCompleted: newCompleted,
              notes: undefined,
              notesCompleted: undefined,
              notesHistory: newHistory
            }
          }

          return { ...goal, isCompleted: newCompleted }
        }
        return goal
      })
    }))
  }

  const handleNotesUpdate = (subject: string, dayIndex: number, notes: string) => {
    setGoalsData(prev => ({
      ...prev,
      [subject]: prev[subject].map((goal, index) =>
        index === dayIndex ? { ...goal, notes } : goal
      )
    }))
  }

  const handleNotesToggle = (subject: string, dayIndex: number) => {
    setGoalsData(prev => ({
      ...prev,
      [subject]: prev[subject].map((goal, index) => {
        if (index === dayIndex && goal.notes && !goal.notesCompleted) {
          // Move note to history when marking as complete
          const newHistory = [
            ...(goal.notesHistory || []),
            {
              text: goal.notes,
              completedDate: new Date().toISOString()
            }
          ]
          return {
            ...goal,
            notes: undefined,
            notesCompleted: undefined,
            notesHistory: newHistory
          }
        }
        return goal
      })
    }))
  }



  const getQuarterName = (quarter: string) => {
    const quarterNames: { [key: string]: string } = {
      'Q1': 'Primer Bloque',
      'Q2': 'Segundo Bloque',
      'Q3': 'Tercer Bloque',
      'Q4': 'Cuarto Bloque'
    }
    return quarterNames[quarter] || quarter
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to={`/students/${studentId}/projections/${projectionId}`}>
          <span className="hidden sm:inline">Volver a Proyección</span>
          <span className="sm:hidden">Volver</span>
        </BackButton>
      </div>

      {/* Student Info Card */}
      <StudentInfoCard
        student={mockStudent}
        showBadge={false}
      />

      {/* Daily Goals Table */}
      <DailyGoalsTable
        quarter={quarter || "Q1"}
        quarterName={quarter ? getQuarterName(quarter) : "Primer Bloque"}
        week={parseInt(week || "1")}
        data={goalsData}
        subjects={subjects}
        onGoalUpdate={handleGoalUpdate}
        onGoalToggle={handleGoalToggle}
        onNotesUpdate={handleNotesUpdate}
        onNotesToggle={handleNotesToggle}
        dayTotals={calculateDayTotal}
      />
    </div>
  )
}

