import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'

export function useSchoolYears() {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.schoolYears.list(),
    queryFn: async () => {
      return api.schoolYears.getAll()
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useSchoolYear(schoolYearId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: [...queryKeys.schoolYears.list(), schoolYearId || ''],
    queryFn: async () => {
      if (!schoolYearId) return null
      return api.schoolYears.getById(schoolYearId)
    },
    enabled: !!schoolYearId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useCreateSchoolYear() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.schoolYears.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schoolYears.all })
    },
  })
}

export function useUpdateSchoolYear() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      return api.schoolYears.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schoolYears.all })
    },
  })
}

