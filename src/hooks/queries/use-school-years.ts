import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'

export function useSchoolYears() {
  return useQuery({
    queryKey: queryKeys.schoolYears.list(),
    queryFn: async () => {
      // TODO: Re-implement when getAll is available
      throw new Error("Get all school years not implemented")
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useSchoolYear(schoolYearId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.schoolYears.list(), schoolYearId || ''],
    queryFn: async () => {
      if (!schoolYearId) return null
      // TODO: Re-implement when getById is available
      throw new Error("Get school year by ID not implemented")
    },
    enabled: !!schoolYearId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useCreateSchoolYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_data: Record<string, unknown>): Promise<unknown> => {
      // TODO: Re-implement when create is available
      void _data
      throw new Error("Create school year not implemented")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schoolYears.all })
    },
  })
}

export function useUpdateSchoolYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id: _id,
      data: _data,
    }: {
      id: string
      data: Record<string, unknown>
    }): Promise<unknown> => {
      // TODO: Re-implement when update is available
      void _id
      void _data
      throw new Error("Update school year not implemented")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schoolYears.all })
    },
  })
}

