export interface GradeHistory {
  grade: number
  date: string
  note?: string
}

export interface PaceData {
  id?: string // ProjectionPace ID for API operations
  number: string
  grade: number | null // Grade score 0-100, null if not graded yet
  isCompleted: boolean
  isFailed?: boolean // True if the PACE was failed (grade < 80 typically)
  isUnfinished?: boolean // True if the PACE was unfinished when quarter closed
  originalQuarter?: string // Original quarter where unfinished pace was located
  originalWeek?: number // Original week where unfinished pace was located
  gradeHistory?: GradeHistory[] // History of all grades for this PACE
}

export type WeekPaces = (PaceData | null | PaceData[])[] // Array of 9 weeks, can have single pace, array of paces, or null

export interface QuarterData {
  [subject: string]: WeekPaces
}

export interface NoteHistory {
  text: string
  completedDate: string
}

export interface DailyGoal {
  id?: string // Daily goal ID for API operations
  text: string
  isCompleted: boolean
  notes?: string // Single note for partial completion or pending items
  notesCompleted?: boolean // Whether the notes/pending items are completed
  notesHistory?: NoteHistory[] // History of completed notes
}

export interface DailyGoalData {
  [subject: string]: DailyGoal[] // Array of 5 DailyGoal objects for Mon-Fri
}

export interface WeekGoalsData {
  [quarter: string]: {
    [week: number]: DailyGoalData
  }
}

