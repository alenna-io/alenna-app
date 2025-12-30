import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { getCategoryOrder } from "@/utils/category-order"

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

  // Sort subjects by category order
  const sortedSubjects = React.useMemo(() => {
    return [...quarter.subjects].sort((a, b) => {
      return getCategoryOrder(a.subject) - getCategoryOrder(b.subject)
    })
  }, [quarter.subjects])

  // Get all unique PACE positions (to determine column count)
  // Use at least 1 column for the table structure even if there are no PACEs
  const maxPacesPerSubject = Math.max(
    ...quarter.subjects.map(s => s.paces.length),
    1
  )

  return (
    <Card className="print:shadow-none print:border-2 overflow-hidden rounded-lg border-border/50">
      <CardContent className="p-5 md:p-6 space-y-6">
        {/* PACEs Section */}
        <div className="overflow-x-auto">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              {t("reportCards.lessons")}{" "}
              <span className="font-normal text-muted-foreground">
                ({formatPercentage(quarter.pacePercentage)})
              </span>
            </h3>
          </div>
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-primary/90 text-primary-foreground">
                  <th className="p-3 text-left font-semibold border-b border-r border-border">{t("reportCards.subject")}</th>
                  {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                    <th key={i} className="p-3 text-center font-semibold border-b border-l border-r border-border min-w-[60px]">
                      {t("reportCards.lesson")}
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold border-b border-l border-border">{t("reportCards.average")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedSubjects.length > 0 ? (
                  sortedSubjects.map((subject) => (
                    <React.Fragment key={subject.subject}>
                      {/* Subject name row */}
                      <tr className="bg-primary/10">
                        <td colSpan={maxPacesPerSubject + 2} className="p-3 text-left font-semibold border-b border-r border-l border-border">
                          {subject.subject}
                        </td>
                      </tr>
                      {/* Percentage row */}
                      <tr className="bg-white">
                        <td className="p-3 text-right text-xs text-muted-foreground border-b border-r border-border w-12">
                          %
                        </td>
                        {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                          <td key={i} className="p-3 text-center border-b border-l border-r border-border">
                            {i < subject.paces.length ? (
                              <span className="text-xs text-foreground font-medium">
                                {subject.paces[i].grade !== null ? formatGrade(subject.paces[i].grade!) : "-"}
                              </span>
                            ) : (
                              ""
                            )}
                          </td>
                        ))}
                        <td className="p-3 text-center font-semibold border-b border-l border-border text-foreground">
                          {subject.average !== null ? formatGrade(subject.average) : "-"}
                        </td>
                      </tr>
                      {/* PACE row */}
                      <tr className="bg-white">
                        <td className="p-3 text-right text-xs text-muted-foreground border-b border-r border-border w-12">
                          {t("reportCards.lesson")}
                        </td>
                        {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                          <td key={i} className="p-3 text-center border-b border-l border-r border-border">
                            {i < subject.paces.length ? (
                              <span className="text-xs font-mono">
                                {subject.paces[i].code}
                              </span>
                            ) : (
                              ""
                            )}
                          </td>
                        ))}
                        <td className="p-3 text-center border-b border-l border-border">
                          {subject.passedCount}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                ) : (
                  <tr className="bg-white">
                    <td colSpan={maxPacesPerSubject + 2} className="p-4 text-center text-muted-foreground border-b border-r border-l border-border">
                      {t("reportCards.noLessonsAssigned")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Projection Status */}
        <div className="overflow-x-auto">
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="p-3 text-left font-semibold border-b border-r border-border">
                    {t("reportCards.academicProjectionCompleted")}
                  </td>
                  <td className={`p-3 text-center font-semibold border-b border-l border-border w-24 ${quarter.academicProjectionCompleted ? "bg-[#059669] text-white" : "bg-[#E11D48] text-white"}`}>
                    {quarter.academicProjectionCompleted ? t("reportCards.yes") : t("reportCards.no")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Assignments Section */}
        <div className="overflow-x-auto">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">
              {t("reportCards.monthlyAssignments")}{" "}
              <span className="font-normal text-muted-foreground">
                ({formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
              </span>
            </h3>
          </div>
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-primary/90 text-primary-foreground">
                  <th className="p-3 text-left font-semibold border-b border-r border-border">{t("reportCards.assignment")}</th>
                  <th className="p-3 text-center font-semibold border-b border-l border-border">{t("reportCards.grade")}</th>
                </tr>
              </thead>
              <tbody>
                {quarter.monthlyAssignments.length > 0 ? (
                  <>
                    {quarter.monthlyAssignments.map((assignment) => (
                      <tr key={assignment.id} className="bg-white border-b border-border">
                        <td className="p-3 border-r border-border">{assignment.name}</td>
                        <td className="p-3 text-center border-l border-border">
                          {assignment.grade !== null ? formatGrade(assignment.grade) : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Average row for Monthly Assignments */}
                    <tr className="bg-primary/90 text-primary-foreground">
                      <td className="p-3 text-left font-semibold border-b border-r border-border">{t("reportCards.averageLabel")}</td>
                      <td className="p-3 text-center font-semibold border-b border-l border-border">
                        {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "0.00"}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr className="bg-white">
                    <td colSpan={2} className="p-4 text-center text-muted-foreground border-b border-r border-l border-border">
                      {t("reportCards.noMonthlyAssignments")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="overflow-x-auto">
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="bg-muted/30 font-semibold border-b border-border">
                  <td className="p-3 border-r border-border">
                    {t("reportCards.lessonsAverage")} ({formatPercentage(quarter.pacePercentage)})
                  </td>
                  <td className="p-3 text-center border-l border-border tabular-nums">
                    {quarter.overallAverage !== null ? formatGrade(quarter.overallAverage) : "-"}
                  </td>
                </tr>
                <tr className="bg-muted/30 font-semibold border-b border-border">
                  <td className="p-3 border-r border-border">
                    {t("reportCards.monthlyAssignmentsAverage")} ({formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
                  </td>
                  <td className="p-3 text-center border-l border-border tabular-nums">
                    {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "-"}
                  </td>
                </tr>
                <tr className="bg-muted/30 font-semibold border-b border-border">
                  <td className="p-3 border-r border-border">
                    {t("reportCards.passedLessons")}
                  </td>
                  <td className="p-3 text-center border-l border-border tabular-nums">
                    {quarter.totalPassedPaces}
                  </td>
                </tr>
                <tr className="bg-primary text-primary-foreground font-semibold">
                  <td className="p-4 border-r border-border">{t("reportCards.finalGrade")}</td>
                  <td className="p-4 text-center border-l border-border text-lg tabular-nums">
                    {quarter.finalGrade !== null ? formatGrade(quarter.finalGrade) : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

