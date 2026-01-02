import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'
import type { Teacher } from '@/types/teacher'

export function useTeachers(schoolId?: string, isSchoolAdmin?: boolean) {
  const api = useApi()

  return useQuery<Teacher[], Error>({
    queryKey: queryKeys.teachers.list(schoolId),
    queryFn: async () => {
      if (!schoolId && !isSchoolAdmin) return []
      
      const data = isSchoolAdmin
        ? await api.schools.getMyTeachers()
        : await api.schools.getTeachers(schoolId || '')
      
      return data.map((teacher: unknown) => {
        const t = teacher as Record<string, unknown>
        return {
          id: t.id as string,
          clerkId: t.clerkId as string,
          email: t.email as string,
          firstName: t.firstName as string,
          lastName: t.lastName as string,
          fullName: t.fullName as string,
          schoolId: t.schoolId as string,
          roles: (t.roles || []) as Teacher['roles'],
          primaryRole: t.primaryRole as Teacher['primaryRole'],
          isActive: t.isActive !== undefined ? (t.isActive as boolean) : true,
        }
      })
    },
    enabled: !!schoolId || !!isSchoolAdmin,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useTeachersCount(schoolId?: string, isSchoolAdmin?: boolean) {
  const api = useApi()

  return useQuery<{ count: number }, Error>({
    queryKey: [...queryKeys.teachers.list(schoolId), 'count'],
    queryFn: async () => {
      if (!schoolId && !isSchoolAdmin) return { count: 0 }
      
      return isSchoolAdmin
        ? await api.schools.getMyTeachersCount()
        : await api.schools.getTeachersCount(schoolId || '')
    },
    enabled: !!schoolId || !!isSchoolAdmin,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useCreateTeacher() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      clerkId: string
      email: string
      firstName: string
      lastName: string
      roleIds: string[]
      schoolId: string
    }) => {
      return api.createUser(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.list(variables.schoolId) })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.teachers.list(variables.schoolId), 'count'] })
    },
  })
}

