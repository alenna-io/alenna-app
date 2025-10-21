import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { Calendar, GraduationCap, Clock } from "lucide-react"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"
import type { PaceData, QuarterData } from "@/types/pace"
import { useApi } from "@/services/api"
import type { ProjectionDetail, PaceDetail } from "@/types/projection-detail"

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
const createPace = (
  number: string,
  grade: number | null = null,
  isCompleted: boolean = false,
  gradeHistory?: Array<{ grade: number, date: string, note?: string }>
): PaceData => ({
  number,
  grade,
  isCompleted,
  gradeHistory
})

// Mock PACE projection data with completion status and grades (0-100)
// Note: Each array position = one week. Position 0 = Week 1, Position 1 = Week 2, etc.
// Week 1 (index 0) has 24 PACEs total (4 per subject) - OVERLOADED to show warning!
const initialProjectionData: { Q1: QuarterData, Q2: QuarterData, Q3: QuarterData, Q4: QuarterData } = {
  Q1: {
    Math: [
      createPace("1001", 95, true, [
        { grade: 75, date: "2024-09-15", note: "Primera vez - necesita repasar multiplicación" },
        { grade: 82, date: "2024-09-20", note: "Mejor, pero aún tiene errores" },
        { grade: 95, date: "2024-09-25" }
      ]),
      createPace("1002", 88, true),
      createPace("1003", 92),
      createPace("1004", 85, true),
      null, null, null, null,
      createPace("1005")
    ],
    English: [
      createPace("1011", 92, true),
      createPace("1012", 85),
      createPace("1013", 90),
      createPace("1014"),
      null, null, null, null,
      createPace("1015")
    ],
    Science: [
      createPace("1021", 85, true),
      createPace("1022", 88),
      createPace("1023", 84),
      createPace("1024"),
      null, null, null, null,
      createPace("1025")
    ],
    "Social Studies": [
      createPace("1031", 90, true),
      createPace("1032", 87),
      createPace("1033", 92),
      createPace("1034"),
      null, null, null, null,
      createPace("1035")
    ],
    "Word Building": [
      createPace("1041", 78, true, [
        { grade: 65, date: "2024-09-10", note: "Dificultad con vocabulario nuevo" },
        { grade: 72, date: "2024-09-17", note: "Mejorando pero necesita más práctica" },
        { grade: 78, date: "2024-09-22", note: "Aún no alcanza el 80% requerido" }
      ]),
      createPace("1042", 80),
      createPace("1043", 83),
      createPace("1044"),
      null, null, null, null,
      createPace("1045")
    ],
    Spanish: [
      createPace("1051", 88, true, [
        { grade: 88, date: "2024-09-12" }
      ]),
      createPace("1052", 85),
      createPace("1053", 90),
      createPace("1054"),
      null, null, null, null,
      createPace("1055")
    ]
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
  const api = useApi()
  const [projectionData, setProjectionData] = React.useState(initialProjectionData)
  const [projectionDetail, setProjectionDetail] = React.useState<ProjectionDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch projection detail from API
  React.useEffect(() => {
    const fetchProjectionDetail = async () => {
      if (!studentId || !projectionId) return

      try {
        setLoading(true)
        setError(null)
        const detail: ProjectionDetail = await api.projections.getDetail(studentId, projectionId)
        setProjectionDetail(detail)

        // Convert API data to the format expected by ACEQuarterlyTable
        const convertedData = {
          Q1: convertQuarterData(detail.quarters.Q1),
          Q2: convertQuarterData(detail.quarters.Q2),
          Q3: convertQuarterData(detail.quarters.Q3),
          Q4: convertQuarterData(detail.quarters.Q4),
        }
        setProjectionData(convertedData)
      } catch (err) {
        console.error('Error fetching projection detail:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projection')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectionDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, projectionId])

  // Helper function to convert API pace detail to PaceData
  const convertQuarterData = (quarterPaces: { [subject: string]: (PaceDetail | null)[] }): QuarterData => {
    const result: QuarterData = {}

    Object.keys(quarterPaces).forEach(subject => {
      result[subject] = quarterPaces[subject].map(pace => {
        if (!pace) return null

        return {
          number: pace.number,
          grade: pace.grade,
          isCompleted: pace.isCompleted,
          isFailed: pace.isFailed,
          gradeHistory: pace.gradeHistory.map(gh => ({
            grade: gh.grade,
            date: gh.date,
            note: gh.note,
          })),
        }
      })
    })

    return result
  }

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
  const handlePaceToggle = (quarter: string, subject: string, weekIndex: number, grade?: number, comment?: string) => {
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
          const newHistory = comment ? [
            ...(pace.gradeHistory || []),
            {
              grade,
              date: new Date().toISOString(),
              note: comment
            }
          ] : pace.gradeHistory
          subjectPaces[weekIndex] = { ...pace, isCompleted: true, grade, gradeHistory: newHistory }
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

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
            <span className="hidden sm:inline">Volver a Proyecciones</span>
            <span className="sm:hidden">Volver</span>
          </BackButton>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Cargando proyección...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
            <span className="hidden sm:inline">Volver a Proyecciones</span>
            <span className="sm:hidden">Volver</span>
          </BackButton>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use projection detail for student data if available
  const student = projectionDetail ? {
    id: projectionDetail.studentId,
    name: projectionDetail.student.fullName,
    currentGrade: projectionDetail.student.currentLevel || 'N/A',
    schoolYear: projectionDetail.schoolYear,
  } : mockStudent

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton onClick={() => navigate(`/students/${studentId}/projections`)}>
          <span className="hidden sm:inline">Volver a Proyecciones</span>
          <span className="sm:hidden">Volver</span>
        </BackButton>
      </div>

      {/* Current Week Indicator */}
      <Card className="border-green-500 bg-green-50/50">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-green-900">Semana Actual</h3>
                <p className="text-xs md:text-sm text-green-700">
                  {currentQuarter} - Semana {currentWeekInQuarter}
                  <span className="hidden sm:inline"> (Semana {currentSchoolWeek} del año escolar)</span>
                </p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <Badge className="bg-green-600 text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                Semana {currentSchoolWeek}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Info Card */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0">
              <AvatarFallback className="text-xl md:text-2xl font-semibold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold mb-2 truncate">{student.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>{student.currentGrade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="truncate">Año Escolar: {student.schoolYear}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 md:py-2 self-end sm:self-auto">
              A.C.E. System
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Proyección de PACEs</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Planificación semanal por bloque para el año escolar {student.schoolYear}
        </p>
      </div>

      {/* Quarterly Tables */}
      <div className="space-y-4 md:space-y-8">
        <ACEQuarterlyTable
          quarter="Q1"
          quarterName="Bloque 1"
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
          quarterName="Bloque 2"
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
          quarterName="Bloque 3"
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
          quarterName="Bloque 4"
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

