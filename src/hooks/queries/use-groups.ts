import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'

export function useGroups(schoolYearId?: string) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.groups.list(schoolYearId),
    queryFn: async () => {
      if (!schoolYearId) return []
      return api.groups.getBySchoolYear(schoolYearId)
    },
    enabled: !!schoolYearId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useGroup(groupId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.groups.detail(groupId || ''),
    queryFn: async () => {
      if (!groupId) return null
      return api.groups.getById(groupId)
    },
    enabled: !!groupId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useGroupStudents(groupId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: [...queryKeys.groups.detail(groupId || ''), 'students'],
    queryFn: async () => {
      if (!groupId) return []
      return api.groups.getGroupStudents(groupId)
    },
    enabled: !!groupId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useCreateGroup() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      teacherId: string
      schoolYearId: string
      name?: string | null
      studentIds?: string[]
    }) => {
      return api.groups.create(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(variables.schoolYearId) })
    },
  })
}

export function useDeleteGroup() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return api.groups.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

