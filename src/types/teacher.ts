export interface Teacher {
  id: string
  clerkId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  schoolId: string
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  primaryRole?: {
    id: string
    name: string
    displayName: string
  }
}

