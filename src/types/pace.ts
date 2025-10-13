export interface PaceData {
  number: string
  grade: number | null // Grade score 0-100, null if not graded yet
  isCompleted: boolean
  isFailed?: boolean // True if the PACE was failed (grade < 80 typically)
}

export type WeekPaces = (PaceData | null)[] // Array of 9 weeks, null if no PACE

export interface QuarterData {
  [subject: string]: WeekPaces
}

export interface DailyGoal {
  text: string
  isCompleted: boolean
}

export interface DailyGoalData {
  [subject: string]: DailyGoal[] // Array of 5 DailyGoal objects for Mon-Fri
}

export interface WeekGoalsData {
  [quarter: string]: {
    [week: number]: DailyGoalData
  }
}

