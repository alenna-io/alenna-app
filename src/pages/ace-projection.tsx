import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
import { Calendar, GraduationCap, Clock } from "lucide-react"
import { ACEQuarterlyTable } from "@/components/ace-quarterly-table"

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

// Mock PACE projection data
// Structure: { quarter, subject, week, paceNumber }
const mockProjectionData = {
  Q1: {
    Math: ["1001", "", "", "1002", "", "", "1003", "", ""],
    English: ["1001", "", "", "1002", "", "", "1003", "", ""],
    Science: ["", "", "1001", "", "", "1002", "", "", "1003"],
    "Social Studies": ["", "", "1001", "", "", "1002", "", "", "1003"],
    "Word Building": ["", "1001", "", "", "1002", "", "", "1003", ""],
    Spanish: ["", "1001", "", "", "1002", "", "", "1003", ""]
  },
  Q2: {
    Math: ["1004", "", "", "1005", "", "", "1006", "", ""],
    English: ["1004", "", "", "1005", "", "", "1006", "", ""],
    Science: ["", "", "1004", "", "", "1005", "", "", "1006"],
    "Social Studies": ["", "", "1004", "", "", "1005", "", "", "1006"],
    "Word Building": ["", "1004", "", "", "1005", "", "", "1006", ""],
    Spanish: ["", "1004", "", "", "1005", "", "", "1006", ""]
  },
  Q3: {
    Math: ["1007", "", "", "1008", "", "", "1009", "", ""],
    English: ["1007", "", "", "1008", "", "", "1009", "", ""],
    Science: ["", "", "1007", "", "", "1008", "", "", "1009"],
    "Social Studies": ["", "", "1007", "", "", "1008", "", "", "1009"],
    "Word Building": ["", "1007", "", "", "1008", "", "", "1009", ""],
    Spanish: ["", "1007", "", "", "1008", "", "", "1009", ""]
  },
  Q4: {
    Math: ["1010", "", "", "1011", "", "", "1012", "", ""],
    English: ["1010", "", "", "1011", "", "", "1012", "", ""],
    Science: ["", "", "1010", "", "", "1011", "", "", "1012"],
    "Social Studies": ["", "", "1010", "", "", "1011", "", "", "1012"],
    "Word Building": ["", "1010", "", "", "1011", "", "", "1012", ""],
    Spanish: ["", "1010", "", "", "1011", "", "", "1012", ""]
  },
}

export default function ACEProjectionPage() {
  const navigate = useNavigate()
  const { studentId } = useParams()

  // Calculate current week (mock - in real app this would come from backend)
  // For demo: Q2, Week 5
  const currentQuarter: string = "Q2"
  const currentWeekInQuarter = 5
  const currentSchoolWeek = 14 // Overall week 14 = Q2 Week 5

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
          Planificación semanal por trimestre para el año escolar {mockStudent.schoolYear}
        </p>
      </div>

      {/* Quarterly Tables */}
      <div className="space-y-8">
        <ACEQuarterlyTable
          quarter="Q1"
          quarterName="Primer Trimestre"
          data={mockProjectionData.Q1}
          isActive={currentQuarter === "Q1"}
          currentWeek={currentQuarter === "Q1" ? currentWeekInQuarter : undefined}
        />
        <ACEQuarterlyTable
          quarter="Q2"
          quarterName="Segundo Trimestre"
          data={mockProjectionData.Q2}
          isActive={currentQuarter === "Q2"}
          currentWeek={currentQuarter === "Q2" ? currentWeekInQuarter : undefined}
        />
        <ACEQuarterlyTable
          quarter="Q3"
          quarterName="Tercer Trimestre"
          data={mockProjectionData.Q3}
          isActive={currentQuarter === "Q3"}
          currentWeek={currentQuarter === "Q3" ? currentWeekInQuarter : undefined}
        />
        <ACEQuarterlyTable
          quarter="Q4"
          quarterName="Cuarto Trimestre"
          data={mockProjectionData.Q4}
          isActive={currentQuarter === "Q4"}
          currentWeek={currentQuarter === "Q4" ? currentWeekInQuarter : undefined}
        />
      </div>
    </div>
  )
}

