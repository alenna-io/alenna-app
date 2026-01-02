import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'
import type { Student } from '@/types/student'

export function useStudents(schoolId?: string) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.students.list({ schoolId }),
    queryFn: async () => {
      const data = schoolId
        ? await api.schools.getStudents(schoolId)
        : await api.students.getAll()
      
      return (data as unknown[]).map((student) => {
        const s = student as Record<string, unknown>
        return {
          id: s.id as string,
          firstName: s.firstName as string,
          lastName: s.lastName as string,
          name: s.name as string,
          age: s.age as number,
          birthDate: s.birthDate as string,
          certificationType: s.certificationType as string,
          certificationTypeId: (s.certificationTypeId as string | undefined) || undefined,
          graduationDate: s.graduationDate as string,
          parents: (s.parents || []) as Student['parents'],
          email: (s.email || undefined) as string | undefined,
          phone: (s.phone || undefined) as string | undefined,
          isLeveled: s.isLeveled as boolean,
          expectedLevel: (s.expectedLevel || undefined) as string | undefined,
          currentLevel: (s.currentLevel || undefined) as string | undefined,
          streetAddress: (s.streetAddress || undefined) as string | undefined,
          city: (s.city || undefined) as string | undefined,
          state: (s.state || undefined) as string | undefined,
          country: (s.country || undefined) as string | undefined,
          zipCode: (s.zipCode || undefined) as string | undefined,
          isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
        } as Student
      })
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useStudent(studentId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.students.detail(studentId || ''),
    queryFn: async () => {
      if (!studentId) return null
      const data = await api.students.getById(studentId)
      
      const s = data as Record<string, unknown>
      return {
        id: s.id as string,
        firstName: s.firstName as string,
        lastName: s.lastName as string,
        name: s.name as string,
        age: s.age as number,
        birthDate: s.birthDate as string,
        certificationType: s.certificationType as string,
        certificationTypeId: (s.certificationTypeId as string | undefined) || undefined,
        graduationDate: s.graduationDate as string,
        parents: (s.parents || []) as Student['parents'],
        email: (s.email || undefined) as string | undefined,
        phone: (s.phone || undefined) as string | undefined,
        isLeveled: s.isLeveled as boolean,
        expectedLevel: (s.expectedLevel || undefined) as string | undefined,
        currentLevel: (s.currentLevel || undefined) as string | undefined,
        streetAddress: (s.streetAddress || undefined) as string | undefined,
        city: (s.city || undefined) as string | undefined,
        state: (s.state || undefined) as string | undefined,
        country: (s.country || undefined) as string | undefined,
        zipCode: (s.zipCode || undefined) as string | undefined,
        isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
      } as Student
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useCreateStudent() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      firstName: string
      lastName: string
      email: string
      birthDate: string
      certificationTypeId: string
      graduationDate: string
      phone?: string
      isLeveled?: boolean
      expectedLevel?: string
      currentLevel?: string
      streetAddress?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
      parents?: Array<{
        firstName: string
        lastName: string
        email: string
        relationship: string
      }>
      schoolId: string
    }) => {
      return api.students.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
    },
  })
}

export function useUpdateStudent() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: {
        firstName: string
        lastName: string
        email: string
        birthDate: string
        certificationTypeId: string
        graduationDate: string
        phone?: string
        isLeveled?: boolean
        expectedLevel?: string
        currentLevel?: string
        streetAddress?: string
        city?: string
        state?: string
        country?: string
        zipCode?: string
        parents?: Array<{
          firstName: string
          lastName: string
          email: string
          relationship: string
        }>
      }
    }) => {
      return api.students.update(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.id) })
    },
  })
}

export function useDeleteStudent() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return api.students.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
    },
  })
}

export function useDeactivateStudent() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return api.students.deactivate(id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) })
    },
  })
}

export function useReactivateStudent() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return api.students.reactivate(id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) })
    },
  })
}

