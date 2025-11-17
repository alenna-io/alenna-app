import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface ReportCardSubjectData {
  subject: string
  paces: Array<{
    id: string
    code: string
    grade: number | null
    isCompleted: boolean
    isFailed: boolean
  }>
  average: number | null
  passedCount: number
}

interface ReportCardMonthlyAssignment {
  id: string
  name: string
  grade: number | null
  percentage: number
}

interface ReportCardQuarterData {
  quarter: string
  subjects: ReportCardSubjectData[]
  monthlyAssignments: ReportCardMonthlyAssignment[]
  monthlyAssignmentAverage: number | null
  monthlyAssignmentPercentage: number
  pacePercentage: number
  overallAverage: number | null
  finalGrade: number | null
  totalPassedPaces: number
  academicProjectionCompleted: boolean
}

interface ReportCardTableProps {
  studentName: string
  schoolYear: string
  quarter: ReportCardQuarterData
}

const QUARTER_NAMES: Record<string, string> = {
  Q1: "Bloque 1",
  Q2: "Bloque 2",
  Q3: "Bloque 3",
  Q4: "Bloque 4",
}

export function ReportCardTable({ quarter }: ReportCardTableProps) {
  const formatGrade = (grade: number | null): string => {
    if (grade === null) return "-"
    return grade.toFixed(2)
  }

  const formatPercentage = (percentage: number): string => {
    return `${percentage}%`
  }

  // Get all unique PACE positions (to determine column count)
  const maxPacesPerSubject = Math.max(
    ...quarter.subjects.map(s => s.paces.length),
    0
  )

  return (
    <Card className="print:shadow-none print:border-2 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            {/* Header */}
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th colSpan={maxPacesPerSubject + 3} className="p-3 text-center font-bold text-lg">
                  {QUARTER_NAMES[quarter.quarter] || quarter.quarter}
                </th>
              </tr>
              <tr className="bg-primary/90 text-primary-foreground">
                <th className="p-2 text-left font-semibold border border-primary/20">Subject</th>
                {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                  <th key={i} className="p-2 text-center font-semibold border border-primary/20 min-w-[60px]">
                    PACE
                  </th>
                ))}
                <th className="p-2 text-center font-semibold border border-primary/20">AVG.</th>
              </tr>
            </thead>
            <tbody>
              {/* Subjects */}
              {quarter.subjects.map((subject) => (
                <React.Fragment key={subject.subject}>
                  {/* Subject name row */}
                  <tr className="bg-primary/10">
                    <td colSpan={maxPacesPerSubject + 2} className="p-2 text-left font-semibold border border-gray-300">
                      {subject.subject}
                    </td>
                  </tr>
                  {/* Percentage row */}
                  <tr className="bg-white">
                    <td className="p-2 text-right text-xs text-muted-foreground border border-gray-300 w-12">
                      %
                    </td>
                    {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                      <td key={i} className="p-2 text-center border border-gray-300">
                        {i < subject.paces.length ? (
                          <span className="text-xs text-muted-foreground">
                            {subject.paces[i].grade !== null ? formatGrade(subject.paces[i].grade!) : "-"}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                    ))}
                    <td className="p-2 text-center font-semibold border border-gray-300">
                      {subject.average !== null ? formatGrade(subject.average) : "-"}
                    </td>
                  </tr>
                  {/* PACE row */}
                  <tr className="bg-white">
                    <td className="p-2 text-right text-xs text-muted-foreground border border-gray-300 w-12">
                      PACE
                    </td>
                    {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                      <td key={i} className="p-2 text-center border border-gray-300">
                        {i < subject.paces.length ? (
                          <span className="text-xs font-mono">
                            {subject.paces[i].code}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                    ))}
                    <td className="p-2 text-center border border-gray-300">
                      {subject.passedCount}
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Academic Projection Completed row */}
              <tr className={quarter.academicProjectionCompleted ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                <td colSpan={maxPacesPerSubject + 1} className="p-2 text-left font-semibold border border-primary/20">
                  Academic Projection Completed
                </td>
                <td className="p-2 text-center font-semibold border border-primary/20">
                  {quarter.academicProjectionCompleted ? "YES" : "NO"}
                </td>
              </tr>

              {/* Monthly Assignments Section */}
              <tr className="bg-primary/90 text-primary-foreground">
                <th className="p-2 text-left font-semibold border border-primary/20">Monthly Assigments</th>
                <th className="p-2 text-center font-semibold border border-primary/20">%</th>
                {Array.from({ length: Math.max(quarter.monthlyAssignments.length, 1) }).map((_, i) => (
                  <th key={i} className="p-2 text-center font-semibold border border-primary/20 min-w-[60px]">
                    {i + 1}
                  </th>
                ))}
                <th className="p-2 text-center font-semibold border border-primary/20">AVG.</th>
              </tr>

              {quarter.monthlyAssignments.map((assignment) => (
                <tr key={assignment.id} className="bg-white">
                  <td className="p-2 border border-gray-300">{assignment.name}</td>
                  <td className="p-2 text-center border border-gray-300">
                    {formatPercentage(assignment.percentage)}
                  </td>
                  {Array.from({ length: Math.max(quarter.monthlyAssignments.length, 1) }).map((_, i) => (
                    <td key={i} className="p-2 text-center border border-gray-300">
                      {i === 0 ? (assignment.grade !== null ? formatGrade(assignment.grade) : "-") : ""}
                    </td>
                  ))}
                  <td className="p-2 text-center border border-gray-300">
                    {assignment.grade !== null ? formatGrade(assignment.grade) : "-"}
                  </td>
                </tr>
              ))}

              {/* Total row for Monthly Assignments */}
              <tr className="bg-primary/90 text-primary-foreground">
                <td colSpan={maxPacesPerSubject + 1} className="p-2 text-left font-semibold border border-primary/20">
                  Total
                </td>
                <td className="p-2 text-center font-semibold border border-primary/20">
                  {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "0.00"}
                </td>
              </tr>

              {/* Summary row */}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={maxPacesPerSubject + 1} className="p-2 border border-gray-300">
                  Overall Average (PACEs): {quarter.overallAverage !== null ? formatGrade(quarter.overallAverage) : "-"}
                </td>
                <td className="p-2 text-center border border-gray-300">
                  Total Passed: {quarter.totalPassedPaces}
                </td>
              </tr>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={maxPacesPerSubject + 1} className="p-2 border border-gray-300">
                  Monthly Assignments Average: {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "-"} ({formatPercentage(quarter.monthlyAssignmentPercentage)})
                </td>
                <td className="p-2 text-center border border-gray-300">
                  PACE Average: {quarter.overallAverage !== null ? formatGrade(quarter.overallAverage) : "-"} ({formatPercentage(quarter.pacePercentage)})
                </td>
              </tr>
              <tr className="bg-primary text-primary-foreground font-bold">
                <td colSpan={maxPacesPerSubject + 1} className="p-3 text-left border border-primary/20">
                  Final Grade
                </td>
                <td className="p-3 text-center border border-primary/20 text-lg">
                  {quarter.finalGrade !== null ? formatGrade(quarter.finalGrade) : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

