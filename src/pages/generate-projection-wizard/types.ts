export interface SubjectConfig {
  categoryId: string
  subjectId: string
  startPace: number
  endPace: number
  skipPaces: number[]
  notPairWith: string[]
  extendToNextLevel?: boolean // Whether to show paces from next levels
}

export type WizardStep = 1 | 2 | 3

export interface FormData {
  studentId: string
  schoolId: string
  schoolYear: string
  subjects: SubjectConfig[]
}
