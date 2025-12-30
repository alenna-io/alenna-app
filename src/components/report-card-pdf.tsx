import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 3,
    color: "#6b7280",
  },
  quarterTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "23%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
  },
  statLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "medium",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  statValueLarge: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  statBadge: {
    fontSize: 8,
    padding: 4,
    borderRadius: 12,
    marginTop: 4,
    textAlign: "center",
  },
  badgeSuccess: {
    backgroundColor: "#d1fae5",
    color: "#059669",
  },
  badgeFailed: {
    backgroundColor: "#fee2e2",
    color: "#e11d48",
  },
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#8b5cf6",
    opacity: 0.5,
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    borderRightStyle: "solid",
  },
  tableCellLast: {
    padding: 8,
    fontSize: 9,
  },
  subjectCell: {
    backgroundColor: "#f5f3ff",
    fontWeight: "bold",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  averageCell: {
    backgroundColor: "#f5f3ff",
    fontWeight: "bold",
  },
  lessonCell: {
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  lessonCode: {
    fontFamily: "Courier",
    fontSize: 7,
    color: "#111827",
  },
  lessonGrade: {
    fontSize: 8,
    fontWeight: "bold",
  },
  gradePassed: {
    color: "#059669",
  },
  gradeFailed: {
    color: "#e11d48",
  },
  emptyRow: {
    padding: 12,
    textAlign: "center",
    color: "#6b7280",
  },
  monthlyHeader: {
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#8b5cf6",
    opacity: 0.5,
  },
  monthlyAverageRow: {
    backgroundColor: "#f5f3ff",
    fontWeight: "bold",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: "31%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
  },
  finalGradeCard: {
    flex: 1,
    minWidth: "31%",
    backgroundColor: "#8b5cf6",
    borderRadius: 4,
    padding: 12,
  },
  finalGradeLabel: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  finalGradeValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  textLeft: {
    textAlign: "left",
  },
  mono: {
    fontFamily: "Courier",
    fontSize: 8,
  },
  bold: {
    fontWeight: "bold",
  },
})

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

interface ReportCardPDFProps {
  studentName: string
  schoolYear: string
  quarters: {
    Q1: ReportCardQuarterData
    Q2: ReportCardQuarterData
    Q3: ReportCardQuarterData
    Q4: ReportCardQuarterData
  }
  translations: {
    detailTitle: string
    schoolYearLabel: string
    quarterQ1: string
    quarterQ2: string
    quarterQ3: string
    quarterQ4: string
    lessons: string
    subject: string
    lesson: string
    average: string
    academicProjectionCompleted: string
    yes: string
    no: string
    monthlyAssignments: string
    assignment: string
    grade: string
    averageLabel: string
    lessonsAverage: string
    monthlyAssignmentsAverage: string
    passedLessons: string
    totalLessons: string
    finalGrade: string
    noLessonsAssigned: string
    noMonthlyAssignments: string
  }
}

const formatGrade = (grade: number | null): string => {
  if (grade === null) return "-"
  return grade.toFixed(2)
}

const formatPercentage = (percentage: number): string => {
  return `${percentage}%`
}

const getCategoryOrder = (category: string): number => {
  const categoryOrder = ['Math', 'English', 'Word Building', 'Science', 'Social Studies', 'Spanish', 'Electives']
  const index = categoryOrder.indexOf(category)
  return index === -1 ? 999 : index
}

export const ReportCardPDF: React.FC<ReportCardPDFProps> = ({
  studentName,
  schoolYear,
  quarters,
  translations,
}) => {
  const quarterNames: Record<string, string> = {
    Q1: translations.quarterQ1,
    Q2: translations.quarterQ2,
    Q3: translations.quarterQ3,
    Q4: translations.quarterQ4,
  }

  return (
    <Document>
      {(["Q1", "Q2", "Q3", "Q4"] as const).map((quarterKey) => {
        const quarter = quarters[quarterKey]

        // Sort subjects by category order and sort paces within each subject by code (numeric)
        const sortedSubjects = [...quarter.subjects]
          .sort((a, b) => getCategoryOrder(a.subject) - getCategoryOrder(b.subject))
          .map(subject => ({
            ...subject,
            paces: [...subject.paces].sort((a, b) => {
              const codeA = parseInt(a.code) || 0
              const codeB = parseInt(b.code) || 0
              return codeA - codeB
            })
          }))

        const maxPacesPerSubject = Math.max(
          ...sortedSubjects.map((s) => s.paces.length),
          1
        )

        // Calculate total lessons
        const totalLessons = sortedSubjects.reduce((sum, subject) => sum + subject.paces.length, 0)

        // Get grade status helper
        const getGradeStatus = (grade: number | null) => {
          if (grade === null) return null
          return grade >= 70 ? "passed" : "failed"
        }

        return (
          <Page key={quarterKey} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{translations.detailTitle}</Text>
              <Text style={styles.subtitle}>
                {studentName} • {translations.schoolYearLabel} {schoolYear}
              </Text>
              <Text style={styles.quarterTitle}>
                {quarterNames[quarterKey]}
              </Text>
            </View>

            {/* Stats Summary Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{translations.finalGrade}</Text>
                <Text style={styles.statValueLarge}>
                  {quarter.finalGrade !== null ? formatGrade(quarter.finalGrade) : "-"}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{translations.totalLessons}</Text>
                <Text style={styles.statValue}>{totalLessons}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{translations.passedLessons}</Text>
                <Text style={styles.statValue}>{quarter.totalPassedPaces}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{translations.academicProjectionCompleted}</Text>
                <View style={[
                  styles.statBadge,
                  quarter.academicProjectionCompleted ? styles.badgeSuccess : styles.badgeFailed
                ]}>
                  <Text>
                    {quarter.academicProjectionCompleted ? translations.yes : translations.no}
                  </Text>
                </View>
              </View>
            </View>

            {/* PACEs Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {translations.lessons} ({formatPercentage(quarter.pacePercentage)})
              </Text>
              <View style={styles.table}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, { width: "20%" }]}>
                    <Text style={styles.bold}>{translations.subject}</Text>
                  </View>
                  {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tableCell,
                        { width: `${60 / maxPacesPerSubject}%` },
                      ]}
                    >
                      <Text style={[styles.textCenter, styles.bold]}>{translations.lesson}</Text>
                    </View>
                  ))}
                  <View style={[styles.tableCellLast, { width: "20%" }]}>
                    <Text style={[styles.textCenter, styles.bold]}>{translations.average}</Text>
                  </View>
                </View>

                {/* Subjects - Single row format */}
                {sortedSubjects.length > 0 ? (
                  sortedSubjects.map((subject) => (
                    <View key={subject.subject} style={styles.tableRow}>
                      <View style={[styles.tableCell, styles.subjectCell, { width: "20%" }]}>
                        <Text>{subject.subject}</Text>
                      </View>
                      {Array.from({ length: maxPacesPerSubject }).map((_, i) => {
                        const pace = i < subject.paces.length ? subject.paces[i] : null
                        const status = pace ? getGradeStatus(pace.grade) : null

                        return (
                          <View
                            key={i}
                            style={[
                              styles.tableCell,
                              styles.lessonCell,
                              { width: `${60 / maxPacesPerSubject}%` },
                            ]}
                          >
                            {pace ? (
                              <>
                                <Text style={styles.lessonCode}>{pace.code}</Text>
                                {pace.grade !== null && (
                                  <Text style={[
                                    styles.lessonGrade,
                                    status === "passed" ? styles.gradePassed : status === "failed" ? styles.gradeFailed : {}
                                  ]}>
                                    {formatGrade(pace.grade)}
                                  </Text>
                                )}
                              </>
                            ) : (
                              <Text style={{ fontSize: 8, color: "#9ca3af" }}>-</Text>
                            )}
                          </View>
                        )
                      })}
                      <View style={[styles.tableCellLast, styles.averageCell, { width: "20%" }]}>
                        <Text style={[styles.textCenter, styles.bold]}>
                          {subject.average !== null ? formatGrade(subject.average) : "-"}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <View
                      style={[
                        styles.tableCellLast,
                        styles.emptyRow,
                        { width: "100%" },
                      ]}
                    >
                      <Text>{translations.noLessonsAssigned}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Monthly Assignments Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {translations.monthlyAssignments} ({formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
              </Text>
              <View style={styles.table}>
                {/* Header */}
                <View style={[styles.tableRow, styles.monthlyHeader]}>
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text style={styles.bold}>{translations.assignment}</Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                    ]}
                  >
                    <Text style={[styles.textCenter, styles.bold]}>{translations.grade}</Text>
                  </View>
                </View>

                {/* Assignments */}
                {quarter.monthlyAssignments.length > 0 ? (
                  <>
                    {quarter.monthlyAssignments.map((assignment) => (
                      <View key={assignment.id} style={styles.tableRow}>
                        <View style={[styles.tableCell, { width: "75%" }]}>
                          <Text>{assignment.name}</Text>
                        </View>
                        <View
                          style={[
                            styles.tableCellLast,
                            { width: "25%" },
                          ]}
                        >
                          <Text style={[styles.textCenter, styles.bold]}>
                            {assignment.grade !== null ? formatGrade(assignment.grade) : "-"}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {/* Average row */}
                    <View style={[styles.tableRow, styles.monthlyAverageRow]}>
                      <View style={[styles.tableCell, { width: "75%" }]}>
                        <Text style={styles.bold}>{translations.averageLabel}</Text>
                      </View>
                      <View
                        style={[
                          styles.tableCellLast,
                          { width: "25%" },
                        ]}
                      >
                        <Text style={[styles.textCenter, styles.bold]}>
                          {quarter.monthlyAssignmentAverage !== null
                            ? formatGrade(quarter.monthlyAssignmentAverage)
                            : "0.00"}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.tableRow}>
                    <View
                      style={[
                        styles.tableCellLast,
                        styles.emptyRow,
                        { width: "100%" },
                      ]}
                    >
                      <Text>{translations.noMonthlyAssignments}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Summary Section - Grid Layout */}
            <View style={styles.section}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.statLabel}>{translations.lessonsAverage}</Text>
                  <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 4 }}>
                    {formatPercentage(quarter.pacePercentage)}
                  </Text>
                  <Text style={styles.statValue}>
                    {quarter.overallAverage !== null ? formatGrade(quarter.overallAverage) : "-"}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.statLabel}>{translations.monthlyAssignmentsAverage}</Text>
                  <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 4 }}>
                    {formatPercentage(quarter.monthlyAssignmentPercentage || 0)}
                  </Text>
                  <Text style={styles.statValue}>
                    {quarter.monthlyAssignmentAverage !== null ? formatGrade(quarter.monthlyAssignmentAverage) : "-"}
                  </Text>
                </View>
                <View style={styles.finalGradeCard}>
                  <Text style={styles.finalGradeLabel}>{translations.finalGrade}</Text>
                  <Text style={styles.finalGradeValue}>
                    {quarter.finalGrade !== null ? formatGrade(quarter.finalGrade) : "-"}
                  </Text>
                </View>
              </View>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}
