import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

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

export function ReportCardTable({ quarter }: ReportCardTableProps) {
  const { t } = useTranslation()

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return "-"
    return grade.toFixed(2)
  }

  const formatPercentage = (percentage: number): string => {
    return `${percentage}%`
  }

  // Get all unique PACE positions (to determine column count)
  // Use at least 1 column for the table structure even if there are no PACEs
  const maxPacesPerSubject = Math.max(
    ...quarter.subjects.map(s => s.paces.length),
    1
  )

  return (
    <Card className="print:shadow-none print:border-2 overflow-hidden rounded-lg">
      <CardContent className="p-4 space-y-6">
        {/* PACEs Section */}
        <div className="overflow-x-auto">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-foreground">
              {t("reportCards.lessons")}{" "}
              <span className="font-normal text-muted-foreground">
                ({formatPercentage(quarter.pacePercentage)})
              </span>
            </h3>
          </div>
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-primary/90 text-primary-foreground">
                <th className="p-2 text-left font-semibold border border-primary/20">{t("reportCards.subject")}</th>
                {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                  <th key={i} className="p-2 text-center font-semibold border border-primary/20 min-w-[60px]">
                    {t("reportCards.lesson")}
                  </th>
                ))}
                <th className="p-2 text-center font-semibold border border-primary/20">{t("reportCards.average")}</th>
              </tr>
            </thead>
            <tbody>
              {quarter.subjects.length > 0 ? (
                quarter.subjects.map((subject) => (
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
                            <span className="text-xs text-foreground font-medium">
                              {subject.paces[i].grade !== null ? formatGrade(subject.paces[i].grade!) : "-"}
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                      ))}
                      <td className="p-2 text-center font-semibold border border-gray-300 text-foreground">
                        {subject.average !== null ? formatGrade(subject.average) : "-"}
                      </td>
                    </tr>
                    {/* PACE row */}
                    <tr className="bg-white">
                      <td className="p-2 text-right text-xs text-muted-foreground border border-gray-300 w-12">
                        {t("reportCards.lesson")}
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
                ))
              ) : (
                <tr className="bg-white">
                  <td colSpan={maxPacesPerSubject + 2} className="p-4 text-center text-muted-foreground border border-gray-300">
                    {t("reportCards.noLessonsAssigned")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Academic Projection Status */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            <tbody>
              <tr >
                <td className="p-3 text-left font-semibold border border-primary/20">
                  {t("reportCards.academicProjectionCompleted")}
                </td>
                <td className={`p-3 text-center font-semibold border border-primary/20 w-24 ${quarter.academicProjectionCompleted ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                  {quarter.academicProjectionCompleted ? t("reportCards.yes") : t("reportCards.no")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Assignments Section */}
        <div className="overflow-x-auto">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-foreground">
              {t("reportCards.monthlyAssignments")}{" "}
              <span className="font-normal text-muted-foreground">
                ({formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
              </span>
            </h3>
          </div>
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-primary/90 text-primary-foreground">
                <th className="p-2 text-left font-semibold border border-primary/20">{t("reportCards.assignment")}</th>
                <th className="p-2 text-center font-semibold border border-primary/20">{t("reportCards.grade")}</th>
              </tr>
            </thead>
            <tbody>
              {quarter.monthlyAssignments.length > 0 ? (
                <>
                  {quarter.monthlyAssignments.map((assignment) => (
                    <tr key={assignment.id} className="bg-white">
                      <td className="p-2 border border-gray-300">{assignment.name}</td>
                      <td className="p-2 text-center border border-gray-300">
                        {assignment.grade !== null ? formatGrade(assignment.grade) : "-"}
                      </td>
                    </tr>
                  ))}
                  {/* Average row for Monthly Assignments */}
                  <tr className="bg-primary/90 text-primary-foreground">
                    <td className="p-2 text-left font-semibold border border-primary/20">{t("reportCards.averageLabel")}</td>
                    <td className="p-2 text-center font-semibold border border-primary/20">
                      {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "0.00"}
                    </td>
                  </tr>
                </>
              ) : (
                <tr className="bg-white">
                  <td colSpan={2} className="p-4 text-center text-muted-foreground border border-gray-300">
                    {t("reportCards.noMonthlyAssignments")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            <tbody>
              <tr className="bg-gray-100 font-semibold">
                <td className="p-2 border border-gray-300">
                  {t("reportCards.lessonsAverage")} ({formatPercentage(quarter.pacePercentage)})
                </td>
                <td className="p-2 text-center border border-gray-300">
                  {quarter.overallAverage !== null ? formatGrade(quarter.overallAverage) : "-"}
                </td>
              </tr>
              <tr className="bg-gray-100 font-semibold">
                <td className="p-2 border border-gray-300">
                  {t("reportCards.monthlyAssignmentsAverage")} ({formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
                </td>
                <td className="p-2 text-center border border-gray-300">
                  {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "-"}
                </td>
              </tr>
              <tr className="bg-gray-100 font-semibold">
                <td className="p-2 border border-gray-300">
                  {t("reportCards.passedLessons")}
                </td>
                <td className="p-2 text-center border border-gray-300">
                  {quarter.totalPassedPaces}
                </td>
              </tr>
              <tr className="bg-primary text-primary-foreground font-bold">
                <td className="p-3 border border-primary/20">{t("reportCards.finalGrade")}</td>
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

