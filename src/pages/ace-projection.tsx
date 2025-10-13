import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { Calendar, GraduationCap, Clock } from "lucide-react"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import type { PaceData, QuarterData } from "@/types/pace"

interface Student {
  id: string
  name: string
  currentGrade: string
  schoolYear: string
}

// Mock student data
const mockStudent: Student = {
  id: "1",
  name: "María González López",
  currentGrade: "8th Grade",
  schoolYear: "2024-2025"
}

// Helper to create pace data
const createPace = (number: string, grade: number | null = null, isCompleted: boolean = false): PaceData => ({
  number,
  grade,
  isCompleted
})

// Mock PACE projection data with completion status and grades (0-100)
// Note: Each array position = one week. Position 0 = Week 1, Position 1 = Week 2, etc.
// Week 1 (index 0) has 24 PACEs total (4 per subject) - OVERLOADED to show warning!
const initialProjectionData: { Q1: QuarterData, Q2: QuarterData, Q3: QuarterData, Q4: QuarterData } = {
  Q1: {
    Math: [createPace("1001", 95, true), createPace("1002", 88, true), createPace("1003", 92), createPace("1004", 85, true), null, null, null, null, createPace("1005")],
    English: [createPace("1011", 92, true), createPace("1012", 85), createPace("1013", 90), createPace("1014"), null, null, null, null, createPace("1015")],
    Science: [createPace("1021", 85, true), createPace("1022", 88), createPace("1023", 84), createPace("1024"), null, null, null, null, createPace("1025")],
    "Social Studies": [createPace("1031", 90, true), createPace("1032", 87), createPace("1033", 92), createPace("1034"), null, null, null, null, createPace("1035")],
    "Word Building": [createPace("1041", 78, true), createPace("1042", 80), createPace("1043", 83), createPace("1044"), null, null, null, null, createPace("1045")],
    Spanish: [createPace("1051", 88, true), createPace("1052", 85), createPace("1053", 90), createPace("1054"), null, null, null, null, createPace("1055")]
  },
  Q2: {
    Math: [createPace("1004"), null, null, createPace("1005"), null, null, createPace("1006"), null, null],
    English: [createPace("1004"), null, null, createPace("1005"), null, null, createPace("1006"), null, null],
    Science: [null, null, createPace("1004"), null, null, createPace("1005"), null, null, createPace("1006")],
    "Social Studies": [null, null, createPace("1004"), null, null, createPace("1005"), null, null, createPace("1006")],
    "Word Building": [null, createPace("1004"), null, null, createPace("1005"), null, null, createPace("1006"), null],
    Spanish: [null, createPace("1004"), null, null, createPace("1005"), null, null, createPace("1006"), null]
  },
  Q3: {
    Math: [createPace("1007"), null, null, createPace("1008"), null, null, createPace("1009"), null, null],
    English: [createPace("1007"), null, null, createPace("1008"), null, null, createPace("1009"), null, null],
    Science: [null, null, createPace("1007"), null, null, createPace("1008"), null, null, createPace("1009")],
    "Social Studies": [null, null, createPace("1007"), null, null, createPace("1008"), null, null, createPace("1009")],
    "Word Building": [null, createPace("1007"), null, null, createPace("1008"), null, null, createPace("1009"), null],
    Spanish: [null, createPace("1007"), null, null, createPace("1008"), null, null, createPace("1009"), null]
  },
  Q4: {
    Math: [createPace("1010"), null, null, createPace("1011"), null, null, createPace("1012"), null, null],
    English: [createPace("1010"), null, null, createPace("1011"), null, null, createPace("1012"), null, null],
    Science: [null, null, createPace("1010"), null, null, createPace("1011"), null, null, createPace("1012")],
    "Social Studies": [null, null, createPace("1010"), null, null, createPace("1011"), null, null, createPace("1012")],
    "Word Building": [null, createPace("1010"), null, null, createPace("1011"), null, null, createPace("1012"), null],
    Spanish: [null, createPace("1010"), null, null, createPace("1011"), null, null, createPace("1012"), null]
  },
}

export default function ACEProjectionPage() {
  const navigate = useNavigate()
  const { studentId, projectionId } = useParams()
  const [projectionData, setProjectionData] = React.useState(initialProjectionData)

  // Calculate current week (mock - in real app this would come from backend)
  // For demo: Q2, Week 5
  const currentQuarter: string = "Q2"
  const currentWeekInQuarter = 5
  const currentSchoolWeek = 14 // Overall week 14 = Q2 Week 5

  // Handle drag and drop
  const handlePaceDrop = (quarter: string, subject: string, fromWeek: number, toWeek: number) => {
    setProjectionData(prev => {
      const quarterData = prev[quarter as keyof typeof prev]
      const subjectPaces = [...quarterData[subject]]
      const pace = subjectPaces[fromWeek]
      subjectPaces[fromWeek] = subjectPaces[toWeek]
      subjectPaces[toWeek] = pace

      return {
        ...prev,
        [quarter]: {
          ...quarterData,
          [subject]: subjectPaces
        }
      }
    })
  }

  // Handle pace completion and grade
  const handlePaceToggle = (quarter: string, subject: string, weekIndex: number, grade?: number) => {
    setProjectionData(prev => {
      const quarterData = prev[quarter as keyof typeof prev]
      const subjectPaces = [...quarterData[subject]]
      const pace = subjectPaces[weekIndex]

      if (pace) {
        if (pace.isCompleted && grade === undefined) {
          // If already completed and no grade provided, uncomplete it
          subjectPaces[weekIndex] = { ...pace, isCompleted: false, grade: null }
        } else if (grade !== undefined) {
          // If grade provided, complete and set grade
          subjectPaces[weekIndex] = { ...pace, isCompleted: true, grade }
        } else {
          // If not completed and no grade, just toggle (prompt for grade in component)
          // Component will handle prompting for grade
          subjectPaces[weekIndex] = { ...pace, isCompleted: !pace.isCompleted }
        }
      }

      return {
        ...prev,
        [quarter]: {
          ...quarterData,
          [subject]: subjectPaces
        }
      }
    })
  }

  // Handle week click to navigate to daily goals
  const handleWeekClick = (quarter: string, week: number) => {
    navigate(`/students/${studentId}/projections/${projectionId}/${quarter}/week/${week}`)
  }

  // Handle adding new pace
  const handleAddPace = (quarter: string, subject: string, weekIndex: number, paceNumber: string) => {
    setProjectionData(prev => {
      const quarterData = prev[quarter as keyof typeof prev]
      const subjectPaces = [...quarterData[subject]]

      // Add new pace at this position
      subjectPaces[weekIndex] = {
        number: paceNumber,
        grade: null,
        isCompleted: false
      }

      return {
        ...prev,
        [quarter]: {
          ...quarterData,
          [subject]: subjectPaces
        }
      }
    })
  }

  // Handle deleting a pace
  const handleDeletePace = (quarter: string, subject: string, weekIndex: number) => {
    setProjectionData(prev => {
      const quarterData = prev[quarter as keyof typeof prev]
      const subjectPaces = [...quarterData[subject]]

      // Remove pace by setting to null
      subjectPaces[weekIndex] = null

      return {
        ...prev,
        [quarter]: {
          ...quarterData,
          [subject]: subjectPaces
        }
      }
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
          Volver a Proyecciones
        </BackButton>
      </div>

      {/* Current Week Indicator */}
      <Card className="border-green-500 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900">Semana Actual</h3>
                <p className="text-sm text-green-700">
                  {currentQuarter} - Semana {currentWeekInQuarter} (Semana {currentSchoolWeek} del año escolar)
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                Semana {currentSchoolWeek}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl font-semibold">
                {getInitials(mockStudent.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{mockStudent.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{mockStudent.currentGrade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Año Escolar: {mockStudent.schoolYear}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              A.C.E. System
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold">Proyección de PACEs</h2>
        <p className="text-muted-foreground">
          Planificación semanal por bloque para el año escolar {mockStudent.schoolYear}
        </p>
      </div>

      {/* Quarterly Tables */}
      <div className="space-y-8">
        <ACEQuarterlyTable
          quarter="Q1"
          quarterName="Primer Bloque"
          data={projectionData.Q1}
          isActive={currentQuarter === "Q1"}
          currentWeek={currentQuarter === "Q1" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
        <ACEQuarterlyTable
          quarter="Q2"
          quarterName="Segundo Bloque"
          data={projectionData.Q2}
          isActive={currentQuarter === "Q2"}
          currentWeek={currentQuarter === "Q2" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
        <ACEQuarterlyTable
          quarter="Q3"
          quarterName="Tercer Bloque"
          data={projectionData.Q3}
          isActive={currentQuarter === "Q3"}
          currentWeek={currentQuarter === "Q3" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
        <ACEQuarterlyTable
          quarter="Q4"
          quarterName="Cuarto Bloque"
          data={projectionData.Q4}
          isActive={currentQuarter === "Q4"}
          currentWeek={currentQuarter === "Q4" ? currentWeekInQuarter : undefined}
          onPaceDrop={handlePaceDrop}
          onPaceToggle={handlePaceToggle}
          onWeekClick={handleWeekClick}
          onAddPace={handleAddPace}
          onDeletePace={handleDeletePace}
        />
      </div>
    </div>
  )
}

