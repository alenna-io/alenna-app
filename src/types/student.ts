export interface Parent {
  id: string
  name: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  name: string // Full name for display
  age: number
  birthDate: string
  certificationType: "INEA" | "Grace Christian" | "Home Life" | "Lighthouse" | "Otro"
  graduationDate: string
  parents: Parent[]
  contactPhone: string
  isLeveled: boolean
  expectedLevel?: string
  address: string
}

