import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { DailyGoalsTable } from "@/components/daily-goals-table"
import { Calendar, Target, GraduationCap, BookOpen } from "lucide-react"
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
    { text: "Test", isCompleted: false },
    { text: "", isCompleted: false }
  ],
  English: [
    { text: "1-10", isCompleted: true },
    { text: "11-20", isCompleted: false },
    { text: "21-30", isCompleted: false },
    { text: "31-39", isCompleted: false },
    { text: "Test", isCompleted: false }
  ],
  "Word Building": [
    { text: "7-13", isCompleted: false },
    { text: "14-21", isCompleted: false },
    { text: "22-28", isCompleted: false },
    { text: "29-35", isCompleted: false },
    { text: "36-ST", isCompleted: false }
  ],
  Science: [
    { text: "45-48", isCompleted: false },
    { text: "49-52", isCompleted: false },
    { text: "53-56", isCompleted: false },
    { text: "57-59", isCompleted: false },
    { text: "Test", isCompleted: false }
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
    { text: "Test", isCompleted: false }
  ]
}

const subjects = Object.keys(mockDailyGoals)

export default function DailyGoalsPage() {
  const navigate = useNavigate()
  const { studentId, projectionId, quarter, week } = useParams()
  const [goalsData, setGoalsData] = React.useState(mockDailyGoals)

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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
        <BackButton onClick={() => navigate(`/students/${studentId}/projections/${projectionId}`)}>
          <span className="hidden sm:inline">Volver a Proyección</span>
          <span className="sm:hidden">Volver</span>
        </BackButton>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0">
              <AvatarFallback className="text-xl md:text-2xl font-semibold">
                {getInitials(mockStudent.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold mb-2 truncate flex items-center gap-3">
                <Target className="h-6 w-6 md:h-8 md:w-8" />
                {mockStudent.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>{mockStudent.currentGrade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="truncate">Año Escolar: {mockStudent.schoolYear}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 self-end sm:self-auto">
              <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                {quarter && getQuarterName(quarter)} - Semana {week}
              </Badge>
              <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Metas Diarias
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
      />
    </div>
  )
}

