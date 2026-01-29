import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'

export function useDailyGoals(
  studentId: string | undefined,
  projectionId: string | undefined,
  quarter: string | undefined,
  week: number | undefined
) {
  const api = useApi()

  return useQuery({
    queryKey: queryKeys.dailyGoals.detail(
      studentId || '',
      projectionId || '',
      quarter || '',
      week || 0
    ),
    queryFn: async () => {
      if (!projectionId || !quarter || week === undefined) {
        return null
      }
      return api.dailyGoals.get(projectionId, quarter, week);
    },
    enabled: !!projectionId && !!quarter && week !== undefined,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  })
}

export function useCreateDailyGoal() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectionId,
      subject,
      quarter,
      week,
      dayOfWeek,
      text,
    }: {
      projectionId: string
      subject: string
      quarter: string
      week: number
      dayOfWeek: number
      text: string
      studentId?: string
    }) => {
      return api.dailyGoals.create(projectionId, subject, quarter, week, dayOfWeek, text)
    },
    onSuccess: (_, variables) => {
      if (variables.studentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyGoals.detail(
            variables.studentId,
            variables.projectionId,
            variables.quarter,
            variables.week
          ),
        })
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyGoals.all,
        })
      }
    },
  })
}

export function useAddNoteToDailyGoal() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      dailyGoalId,
      notes,
    }: {
      dailyGoalId: string
      notes: string
      studentId?: string
      projectionId?: string
      quarter?: string
      week?: number
    }) => {
      return api.dailyGoals.addNote(dailyGoalId, notes)
    },
    onSuccess: (_, variables) => {
      if (variables.studentId && variables.projectionId && variables.quarter && variables.week !== undefined) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyGoals.detail(
            variables.studentId,
            variables.projectionId,
            variables.quarter,
            variables.week
          ),
        })
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyGoals.all,
        })
      }
    },
  })
}

export function useMarkDailyGoalComplete() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      dailyGoalId,
      isCompleted,
    }: {
      dailyGoalId: string
      isCompleted: boolean
      studentId?: string
      projectionId?: string
      quarter?: string
      week?: number
    }) => {
      return api.dailyGoals.markComplete(dailyGoalId, isCompleted)
    },
    onSuccess: (_, variables) => {
      if (variables.studentId && variables.projectionId && variables.quarter && variables.week !== undefined) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyGoals.detail(
            variables.studentId,
            variables.projectionId,
            variables.quarter,
            variables.week
          ),
        })
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyGoals.all,
        })
      }
    },
  })
}

