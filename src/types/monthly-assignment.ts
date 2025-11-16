// Monthly Assignment Types

export interface MonthlyAssignmentGradeHistory {
  grade: number
  date: string // ISO date string
  note?: string
}

export interface MonthlyAssignment {
  id: string
  name: string
  quarter: string // Q1, Q2, Q3, Q4
  grade: number | null
  gradeHistory: MonthlyAssignmentGradeHistory[]
  createdAt: string
  updatedAt: string
}

export interface CreateMonthlyAssignmentInput {
  name: string
  quarter: string
}

export interface UpdateMonthlyAssignmentInput {
  name: string
}

export interface GradeMonthlyAssignmentInput {
  grade: number // 0-100
  note?: string
}

