import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'

export function useProjections(studentId?: string) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.projections.list(studentId),
    queryFn: async () => {
      if (studentId) {
        return api.projections.getByStudentId(studentId)
      }
      return api.projections.getAll()
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
      return api.projections.getDetail(studentId, projectionId)
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
    mutationFn: async ({ studentId, data }: {
      studentId: string
      data: Record<string, unknown>
    }) => {
      return api.projections.create(studentId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.list(variables.studentId) })
    },
  })
}

export function useDeleteProjection() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, projectionId }: {
      studentId: string
      projectionId: string
    }) => {
      return api.projections.delete(studentId, projectionId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projections.list(variables.studentId) })
    },
  })
}

