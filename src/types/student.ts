export interface Parent {
  id: string
  name: string
  email?: string
  firstName?: string
  lastName?: string
  relationship?: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  name: string // Full name for display
  age: number
  birthDate: string
  certificationType: string // Dynamic from database - managed per school
  graduationDate: string
  parents: Parent[]
  contactPhone: string
  isLeveled: boolean
  expectedLevel?: string
  currentLevel?: string
  address: string
  isActive: boolean
}

