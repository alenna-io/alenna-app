export interface Projection {
  id: string
  studentId: string
  schoolYear: string // e.g., "2024-2025"
  startDate: string // ISO date string
  endDate: string // ISO date string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectionInput {
  schoolYear: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  isActive?: boolean
  notes?: string
}

export interface UpdateProjectionInput {
  schoolYear?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  notes?: string
}

