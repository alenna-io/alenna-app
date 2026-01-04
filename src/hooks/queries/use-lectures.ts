import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'

export function useLectures(filters?: { category?: string; level?: string; subSubjectId?: string }) {
  const api = useApi()

  const normalizedFilters = filters ?? {}

  return useQuery({
    queryKey: [...queryKeys.lectures.list(), normalizedFilters],
    queryFn: async () => {
      return api.paceCatalog.get(normalizedFilters)
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useSubjects() {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.subjects.list(),
    queryFn: async () => {
      return api.subjects.getAll()
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

