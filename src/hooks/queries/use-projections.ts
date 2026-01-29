import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi, type CreateProjectionInput } from '@/services/api'
import { queryKeys } from './query-keys'

export function useProjections(studentId?: string) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.projections.list(studentId),
    queryFn: async () => {
      if (studentId) {
        // TODO: Re-implement when getByStudentId is available
        return api.projections.getList()
      }
      return api.projections.getList()
    },
    enabled: !studentId || !!studentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useProjection(studentId: string | undefined, projectionId: string | undefined) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.projections.detail(projectionId || ''),
    queryFn: async () => {
      if (!studentId || !projectionId) return null
      return api.projections.getById(projectionId)
    },
    enabled: !!studentId && !!projectionId,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  })
}

export function useCreateProjection() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data }: {
      studentId: string
      data: Record<string, unknown>
    }) => {
      return api.projections.create(data as unknown as CreateProjectionInput)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.list(variables.studentId) })
    },
  })
}

export function useDeleteProjection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId: _studentId,
      projectionId: _projectionId,
    }: {
      studentId: string
      projectionId: string
    }) => {
      // TODO: Re-implement when delete method is available
      // Parameters are used in onSuccess callback
      void _studentId
      void _projectionId
      throw new Error("Delete projection not implemented")
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.list(variables.studentId) })
    },
  })
}

