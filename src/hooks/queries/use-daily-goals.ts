import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/services/api'
import { queryKeys } from './query-keys'
import type { DailyGoalData } from '@/services/api'

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
      if (!studentId || !projectionId || !quarter || week === undefined) {
        return null
      }
      return api.dailyGoals.get(studentId, projectionId, quarter, week) as Promise<DailyGoalData>
    },
    enabled: !!studentId && !!projectionId && !!quarter && week !== undefined,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  })
}

export function useUpdateDailyGoal() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      projectionId,
      goalId,
      data,
    }: {
      studentId: string
      projectionId: string
      goalId: string
      data: {
        subject?: string
        quarter?: string
        week?: number
        dayOfWeek?: number
        text?: string
        isCompleted?: boolean
        notes?: string
        notesCompleted?: boolean
      }
    }) => {
      return api.dailyGoals.update(studentId, projectionId, goalId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dailyGoals.detail(
          variables.studentId,
          variables.projectionId,
          variables.data.quarter || '',
          variables.data.week || 0
        ),
      })
    },
  })
}

