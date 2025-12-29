// Type definitions for projection detail matching the backend DTOs

export interface GradeHistory {
  id: string
  grade: number
  date: string // ISO date string
  note?: string
}

export interface PaceDetail {
  id: string
  paceCatalogId: string // ID from pace catalog to identify which pace this is
  number: string
  subject: string // Sub-subject name
  category: string // Category name
  quarter: string
  week: number
  grade: number | null
  isCompleted: boolean
  isFailed: boolean
  isUnfinished?: boolean
  originalQuarter?: string
  originalWeek?: number
  comments?: string
  gradeHistory: GradeHistory[]
  createdAt: string
  updatedAt: string
}

// Organized pace data by quarter, subject, and week
export interface QuarterPaces {
  [subject: string]: (PaceDetail | null)[] // Array indexed by week (0-8 for weeks 1-9)
}

export interface StudentInfo {
  id: string
  firstName: string
  lastName: string
  fullName: string
  age: number
  currentLevel?: string
  certificationType: string
}

export interface ProjectionDetail {
  id: string
  studentId: string
  student: StudentInfo
  schoolYear: string
  startDate: string
  endDate: string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  categories?: string[] // Category names used in this projection
  quarters: {
    Q1: QuarterPaces
    Q2: QuarterPaces
    Q3: QuarterPaces
    Q4: QuarterPaces
  }
}

