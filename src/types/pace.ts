export interface PaceData {
  number: string
  grade: number | null // Grade score 0-100, null if not graded yet
  isCompleted: boolean
}

export type WeekPaces = (PaceData | null)[] // Array of 9 weeks, null if no PACE

export interface QuarterData {
  [subject: string]: WeekPaces
}

