export interface Parent {
  id: string
  name: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  relationship?: string
}

export interface Student {
  id: string
  userId?: string
  firstName: string
  lastName: string
  name: string // Full name for display
  age: number
  birthDate: string
  certificationType: string // Dynamic from database - managed per school
  graduationDate: string
  parents: Parent[]
  email?: string
  phone?: string // Contact phone from User
  isLeveled: boolean
  expectedLevel?: string
  currentLevel?: string
  streetAddress?: string // Address from User
  city?: string
  state?: string
  country?: string
  zipCode?: string
  isActive: boolean
}

