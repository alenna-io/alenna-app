import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { getCategoryOrder } from "@/utils/category-order"
import { CheckCircle2, XCircle } from "lucide-react"

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

  // Sort subjects by category order and sort paces within each subject by code (numeric)
  const sortedSubjects = React.useMemo(() => {
    return [...quarter.subjects]
      .sort((a, b) => {
        return getCategoryOrder(a.subject) - getCategoryOrder(b.subject)
      })
      .map(subject => ({
        ...subject,
        paces: [...subject.paces].sort((a, b) => {
          // Sort by code (numeric value)
          const codeA = parseInt(a.code) || 0
          const codeB = parseInt(b.code) || 0
          return codeA - codeB
        })
      }))
  }, [quarter.subjects])

  // Get all unique PACE positions (to determine column count)
  // Use at least 1 column for the table structure even if there are no PACEs
  const maxPacesPerSubject = Math.max(
    ...quarter.subjects.map(s => s.paces.length),
    1
  )

  // Calculate total lessons count
  const totalLessons = React.useMemo(() => {
    return sortedSubjects.reduce((sum, subject) => sum + subject.paces.length, 0)
  }, [sortedSubjects])

  // Calculate total passed lessons
  const totalPassedLessons = quarter.totalPassedPaces

  // Get grade status (pass/fail) helper
  const getGradeStatus = (grade: number | null) => {
    if (grade === null) return null
    return grade >= 70 ? "passed" : "failed"
  }

  return (
    <Card className="print:shadow-none print:border-2 overflow-hidden rounded-lg border-border/50 animate-fade-in-soft">
      <CardContent className="p-5 md:p-6 space-y-6">
        {/* Stats Summary Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-staggered">
          <div className="bg-card rounded-lg border border-border/50 p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">{t("reportCards.finalGrade")}</div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {quarter.finalGrade !== null ? formatGrade(quarter.finalGrade) : "-"}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">{t("reportCards.totalLessons")}</div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{totalLessons}</div>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">{t("reportCards.passedLessons")}</div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{totalPassedLessons}</div>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium mb-2">{t("reportCards.academicProjectionCompleted")}</div>
            <Badge variant={quarter.academicProjectionCompleted ? "status-completed" : "status-failed"} className="text-xs">
              {quarter.academicProjectionCompleted ? t("reportCards.yes") : t("reportCards.no")}
            </Badge>
          </div>
        </div>

        {/* PACEs Section */}
        <div className="overflow-x-auto animate-fade-in-soft">
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
                <tr className="bg-muted/30">
                  <th className="p-3 text-left font-semibold border-b-2 border-b-primary/50 border-r border-border">{t("reportCards.subject")}</th>
                  {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                    <th key={i} className="p-3 text-center font-semibold border-b-2 border-b-primary/50 border-l border-r border-border min-w-[80px]">
                      {t("reportCards.lesson")}
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold border-b-2 border-b-primary/50 border-l border-border">{t("reportCards.average")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedSubjects.length > 0 ? (
                  sortedSubjects.map((subject) => (
                    <React.Fragment key={subject.subject}>
                      {/* Subject row with lessons */}
                      <tr className="bg-card border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold border-r border-border bg-primary/10">
                          {subject.subject}
                        </td>
                        {Array.from({ length: maxPacesPerSubject }).map((_, i) => {
                          const pace = i < subject.paces.length ? subject.paces[i] : null
                          const status = pace ? getGradeStatus(pace.grade) : null

                          return (
                            <td key={i} className="p-3 text-center border-l border-r border-border">
                              {pace ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs font-mono text-foreground font-medium">
                                    {pace.code}
                                  </span>
                                  {pace.grade !== null && (
                                    <div className="flex items-center gap-1">
                                      <span className={`text-sm font-semibold tabular-nums ${status === "passed" ? "text-[#059669]" : status === "failed" ? "text-[#E11D48]" : "text-foreground"
                                        }`}>
                                        {formatGrade(pace.grade)}
                                      </span>
                                      {status === "passed" && (
                                        <CheckCircle2 className="h-3 w-3 text-[#059669]" />
                                      )}
                                      {status === "failed" && (
                                        <XCircle className="h-3 w-3 text-[#E11D48]" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="p-3 text-center font-semibold border-l border-border bg-primary/10 tabular-nums">
                          {subject.average !== null ? formatGrade(subject.average) : "-"}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                ) : (
                  <tr className="bg-card">
                    <td colSpan={maxPacesPerSubject + 2} className="p-4 text-center text-muted-foreground border-b border-r border-l border-border">
                      {t("reportCards.noLessonsAssigned")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Assignments Section */}
        <div className="overflow-x-auto animate-fade-in-soft">
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
                <tr className="bg-muted/30">
                  <th className="p-3 text-left font-semibold border-b-2 border-b-primary/50 border-r border-border">{t("reportCards.assignment")}</th>
                  <th className="p-3 text-center font-semibold border-b-2 border-b-primary/50 border-l border-border">{t("reportCards.grade")}</th>
                </tr>
              </thead>
              <tbody>
                {quarter.monthlyAssignments.length > 0 ? (
                  <>
                    {quarter.monthlyAssignments.map((assignment) => (
                      <tr key={assignment.id} className="bg-card border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-3 border-r border-border">{assignment.name}</td>
                        <td className="p-3 text-center border-l border-border tabular-nums font-medium">
                          {assignment.grade !== null ? formatGrade(assignment.grade) : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Average row for Monthly Assignments */}
                    <tr className="bg-primary/10 border-t-2 border-t-primary/50">
                      <td className="p-3 text-left font-semibold border-r border-border">{t("reportCards.averageLabel")}</td>
                      <td className="p-3 text-center font-semibold border-l border-border tabular-nums">
                        {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "0.00"}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr className="bg-card">
                    <td colSpan={2} className="p-4 text-center text-muted-foreground border-b border-r border-l border-border">
                      {t("reportCards.noMonthlyAssignments")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section - Grid Layout */}
        <div className="animate-fade-in-soft">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg border border-border/50 p-4 space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                {t("reportCards.lessonsAverage")}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {formatPercentage(quarter.pacePercentage)}
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {quarter.overallAverage !== null ? formatGrade(quarter.overallAverage) : "-"}
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border/50 p-4 space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                {t("reportCards.monthlyAssignmentsAverage")}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {formatPercentage(quarter.monthlyAssignmentPercentage || 0)}
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "-"}
              </div>
            </div>
            <div className="bg-primary rounded-lg border border-primary p-4 space-y-2 md:col-span-1">
              <div className="text-sm text-primary-foreground/80 font-medium">
                {t("reportCards.finalGrade")}
              </div>
              <div className="text-3xl font-bold text-primary-foreground tabular-nums">
                {quarter.finalGrade !== null ? formatGrade(quarter.finalGrade) : "-"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

