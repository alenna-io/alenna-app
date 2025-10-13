import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, GraduationCap, ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    Math: ["1097", "1098", "1099", "1100", "1101", "1102", "1103", "1104", "1105"],
    English: ["1085", "1086", "1087", "1088", "", "1089", "1090", "1091", "1092"],
    Science: ["1073", "", "1074", "1075", "1076", "", "1077", "1078", "1079"],
    "Social Studies": ["1061", "1062", "", "1063", "1064", "1065", "", "1066", "1067"],
    "Word Building": ["1049", "1050", "1051", "", "1052", "1053", "1054", "", "1055"],
    Spanish: ["1037", "", "1038", "1039", "", "1040", "1041", "1042", ""]
  },
  Q2: {
    Math: ["1106", "1107", "1108", "", "1109", "1110", "1111", "1112", ""],
    English: ["1093", "1094", "", "1095", "1096", "1097", "", "1098", "1099"],
    Science: ["1080", "1081", "1082", "1083", "", "1084", "1085", "", "1086"],
    "Social Studies": ["1068", "", "1069", "1070", "1071", "", "1072", "1073", "1074"],
    "Word Building": ["1056", "1057", "", "1058", "1059", "1060", "", "1061", "1062"],
    Spanish: ["1043", "1044", "1045", "", "1046", "1047", "1048", "", "1049"]
  },
  Q3: {
    Math: ["1113", "1114", "", "1115", "1116", "1117", "1118", "", "1119"],
    English: ["1100", "", "1101", "1102", "1103", "", "1104", "1105", "1106"],
    Science: ["1087", "1088", "1089", "", "1090", "1091", "", "1092", "1093"],
    "Social Studies": ["1075", "1076", "", "1077", "1078", "1079", "1080", "", "1081"],
    "Word Building": ["1063", "", "1064", "1065", "", "1066", "1067", "1068", ""],
    Spanish: ["1050", "1051", "1052", "1053", "", "1054", "", "1055", "1056"]
  },
  Q4: {
    Math: ["1120", "", "1121", "1122", "1123", "", "1124", "1125", "1126"],
    English: ["1107", "1108", "1109", "", "1110", "1111", "1112", "", ""],
    Science: ["1094", "1095", "", "1096", "1097", "1098", "", "1099", "1100"],
    "Social Studies": ["1082", "", "1083", "1084", "", "1085", "1086", "1087", ""],
    "Word Building": ["1069", "1070", "1071", "", "1072", "1073", "", "1074", "1075"],
    Spanish: ["1057", "", "1058", "1059", "1060", "", "1061", "1062", ""]
  }
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/students/${studentId}/projections`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Proyecciones
        </Button>
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

