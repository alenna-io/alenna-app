import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Define styles for the PDF
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
  },
  quarterTitle: {
    fontSize: 11,
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
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "solid",
  },
  tableHeader: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontWeight: "bold",
    padding: 6,
    fontSize: 9,
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
  },
  tableCellLast: {
    padding: 6,
    fontSize: 9,
  },
  subjectRow: {
    backgroundColor: "#e0e7ff",
    fontWeight: "bold",
  },
  percentageRow: {
    backgroundColor: "#ffffff",
  },
  paceRow: {
    backgroundColor: "#ffffff",
  },
  emptyRow: {
    padding: 12,
    textAlign: "center",
    color: "#6b7280",
  },
  statusRow: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontWeight: "bold",
  },
  statusRowFailed: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: "bold",
  },
  summaryRow: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
  },
  finalRow: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontWeight: "bold",
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
        const maxPacesPerSubject = Math.max(
          ...quarter.subjects.map((s) => s.paces.length),
          1
        )

        return (
          <Page key={quarterKey} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{translations.detailTitle}</Text>
              <Text style={styles.subtitle}>
                {studentName} - {translations.schoolYearLabel} {schoolYear}
              </Text>
              <Text style={styles.quarterTitle}>
                {quarterNames[quarterKey]}
              </Text>
            </View>

            {/* PACEs Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {translations.lessons} ({formatPercentage(quarter.pacePercentage)})
              </Text>
              <View style={styles.table}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, { width: "25%" }]}>
                    <Text>{translations.subject}</Text>
                  </View>
                  {Array.from({ length: maxPacesPerSubject }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tableCell,
                        { width: `${60 / maxPacesPerSubject}%` },
                      ]}
                    >
                      <Text style={styles.textCenter}>{translations.lesson}</Text>
                    </View>
                  ))}
                  <View style={[styles.tableCellLast, { width: "15%" }]}>
                    <Text style={styles.textCenter}>{translations.average}</Text>
                  </View>
                </View>

                {/* Subjects */}
                {quarter.subjects.length > 0 ? (
                  quarter.subjects.map((subject) => (
                    <React.Fragment key={subject.subject}>
                      {/* Subject name row */}
                      <View style={[styles.tableRow, styles.subjectRow]}>
                        <View
                          style={[
                            styles.tableCellLast,
                            { width: "100%" },
                          ]}
                        >
                          <Text>{subject.subject}</Text>
                        </View>
                      </View>
                      {/* Percentage row */}
                      <View style={[styles.tableRow, styles.percentageRow]}>
                        <View
                          style={[
                            styles.tableCell,
                            { width: "25%" },
                            styles.textRight,
                          ]}
                        >
                          <Text style={{ fontSize: 8 }}>%</Text>
                        </View>
                        {Array.from({ length: maxPacesPerSubject }).map(
                          (_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.tableCell,
                                { width: `${60 / maxPacesPerSubject}%` },
                                styles.textCenter,
                              ]}
                            >
                              {i < subject.paces.length &&
                                subject.paces[i].grade !== null ? (
                                <Text style={{ fontSize: 8 }}>
                                  {formatGrade(subject.paces[i].grade!)}
                                </Text>
                              ) : (
                                <Text>-</Text>
                              )}
                            </View>
                          )
                        )}
                        <View
                          style={[
                            styles.tableCellLast,
                            { width: "15%" },
                            styles.textCenter,
                            styles.bold,
                          ]}
                        >
                          <Text>
                            {subject.average !== null
                              ? formatGrade(subject.average)
                              : "-"}
                          </Text>
                        </View>
                      </View>
                      {/* PACE row */}
                      <View style={[styles.tableRow, styles.paceRow]}>
                        <View
                          style={[
                            styles.tableCell,
                            { width: "25%" },
                            styles.textRight,
                          ]}
                        >
                          <Text style={{ fontSize: 8 }}>{translations.lesson}</Text>
                        </View>
                        {Array.from({ length: maxPacesPerSubject }).map(
                          (_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.tableCell,
                                { width: `${60 / maxPacesPerSubject}%` },
                                styles.textCenter,
                              ]}
                            >
                              {i < subject.paces.length ? (
                                <Text style={[styles.mono, { fontSize: 7 }]}>
                                  {subject.paces[i].code}
                                </Text>
                              ) : (
                                <Text>-</Text>
                              )}
                            </View>
                          )
                        )}
                        <View
                          style={[
                            styles.tableCellLast,
                            { width: "15%" },
                            styles.textCenter,
                          ]}
                        >
                          <Text>{subject.passedCount}</Text>
                        </View>
                      </View>
                    </React.Fragment>
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
                      <Text>
                        {translations.noLessonsAssigned}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Academic Projection Status */}
            <View style={styles.section}>
              <View style={styles.table}>
                <View
                  style={[
                    styles.tableRow,
                    quarter.academicProjectionCompleted
                      ? styles.statusRow
                      : styles.statusRowFailed,
                  ]}
                >
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text>{translations.academicProjectionCompleted}</Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                      styles.textCenter,
                    ]}
                  >
                    <Text>
                      {quarter.academicProjectionCompleted ? translations.yes : translations.no}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Monthly Assignments Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {translations.monthlyAssignments} (
                {formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
              </Text>
              <View style={styles.table}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text>{translations.assignment}</Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                      styles.textCenter,
                    ]}
                  >
                    <Text>{translations.grade}</Text>
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
                            styles.textCenter,
                          ]}
                        >
                          <Text>
                            {assignment.grade !== null
                              ? formatGrade(assignment.grade)
                              : "-"}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {/* Average row */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <View style={[styles.tableCell, { width: "75%" }]}>
                        <Text>{translations.averageLabel}</Text>
                      </View>
                      <View
                        style={[
                          styles.tableCellLast,
                          { width: "25%" },
                          styles.textCenter,
                        ]}
                      >
                        <Text>
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
                      <Text>
                        {translations.noMonthlyAssignments}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Summary Section */}
            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.summaryRow]}>
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text>
                      {translations.lessonsAverage} (
                      {formatPercentage(quarter.pacePercentage)})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                      styles.textCenter,
                    ]}
                  >
                    <Text>
                      {quarter.overallAverage !== null
                        ? formatGrade(quarter.overallAverage)
                        : "-"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.summaryRow]}>
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text>
                      {translations.monthlyAssignmentsAverage} (
                      {formatPercentage(quarter.monthlyAssignmentPercentage || 0)})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                      styles.textCenter,
                    ]}
                  >
                    <Text>
                      {quarter.monthlyAssignmentAverage !== null
                        ? formatGrade(quarter.monthlyAssignmentAverage)
                        : "-"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.summaryRow]}>
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text>{translations.passedLessons}</Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                      styles.textCenter,
                    ]}
                  >
                    <Text>{quarter.totalPassedPaces}</Text>
                  </View>
                </View>
                <View style={[styles.tableRow, styles.finalRow]}>
                  <View style={[styles.tableCell, { width: "75%" }]}>
                    <Text>{translations.finalGrade}</Text>
                  </View>
                  <View
                    style={[
                      styles.tableCellLast,
                      { width: "25%" },
                      styles.textCenter,
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>
                      {quarter.finalGrade !== null
                        ? formatGrade(quarter.finalGrade)
                        : "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

