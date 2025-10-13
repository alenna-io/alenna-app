import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"

interface QuarterlyTableProps {
  quarter: string
  quarterName: string
  data: {
    [subject: string]: string[] // Array of 9 PACE numbers (one per week)
  }
  currentWeek?: number // 1-9 for the current week in this quarter, undefined if not current
  isActive?: boolean // Whether this quarter contains the current week
}

const subjectColors: { [key: string]: string } = {
  Math: "bg-blue-50 border-blue-200",
  English: "bg-green-50 border-green-200",
  Science: "bg-purple-50 border-purple-200",
  "Social Studies": "bg-orange-50 border-orange-200",
  "Word Building": "bg-pink-50 border-pink-200",
  Spanish: "bg-amber-50 border-amber-200"
}

const subjectTextColors: { [key: string]: string } = {
  Math: "text-blue-700",
  English: "text-green-700",
  Science: "text-purple-700",
  "Social Studies": "text-orange-700",
  "Word Building": "text-pink-700",
  Spanish: "text-amber-700"
}

export function ACEQuarterlyTable({ quarter, quarterName, data, currentWeek, isActive = false }: QuarterlyTableProps) {
  const [isExpanded, setIsExpanded] = React.useState(isActive)
  const subjects = Object.keys(data)
  const weeks = Array.from({ length: 9 }, (_, i) => i + 1)

  return (
    <Card className={isActive ? "border-primary shadow-md" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
              <span>{quarterName}</span>
              <Badge variant="secondary" className="ml-2">
                {quarter}
              </Badge>
              {isActive && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Actual
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {currentWeek && (
              <Badge variant="outline" className="text-sm">
                Semana {currentWeek}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Mostrar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-4 font-semibold bg-muted/50 sticky left-0 z-10 min-w-[160px]">
                    Materia
                  </th>
                  {weeks.map((week) => (
                    <th
                      key={week}
                      className={`text-center p-4 font-semibold min-w-[100px] ${currentWeek === week
                        ? "bg-green-100 border-2 border-green-500"
                        : "bg-muted/50"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">Semana</span>
                        <span className={`text-lg ${currentWeek === week ? "font-bold text-green-700" : ""}`}>
                          {week}
                        </span>
                        {currentWeek === week && (
                          <Badge className="bg-green-600 text-white text-xs px-2 py-0">
                            Actual
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, subjectIndex) => (
                  <tr
                    key={subject}
                    className={`border-b transition-colors hover:bg-muted/30 ${subjectIndex % 2 === 0 ? "bg-muted/10" : ""
                      }`}
                  >
                    <td
                      className={`p-4 font-semibold sticky left-0 z-10 border-l-4 ${subjectColors[subject] || "bg-gray-50 border-gray-200"
                        } ${subjectTextColors[subject] || "text-gray-700"}`}
                    >
                      {subject}
                    </td>
                    {data[subject].map((pace, weekIndex) => (
                      <td
                        key={weekIndex}
                        className="p-2 text-center align-middle"
                      >
                        {pace ? (
                          <Badge
                            variant="outline"
                            className={`font-mono text-sm px-3 py-1 ${subjectColors[subject] || "bg-gray-50"
                              } ${subjectTextColors[subject] || "text-gray-700"} border-2`}
                          >
                            {pace}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total de materias: {subjects.length}</span>
              <span>
                Total de PACEs programados:{" "}
                {Object.values(data)
                  .flat()
                  .filter((pace) => pace !== "").length}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

