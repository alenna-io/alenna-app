import { apiFetch } from './fetch';
import type { DailyGoalData } from '@/types/pace';

export interface DailyGoalResponse {
  id: string;
  subject: string;
  quarter: string;
  week: number;
  dayOfWeek: number;
  text: string;
  isCompleted: boolean;
  notes: string | null;
  notesCompleted: boolean;
}

export const dailyGoalsApi = {
  get: async (
    projectionId: string,
    quarter: string,
    week: number,
    token: string | null
  ): Promise<DailyGoalData> => {
    const params = new URLSearchParams({ quarter, week: week.toString() });
    const response = await apiFetch(`/daily-goals?projectionId=${projectionId}&${params}`, token) as Array<DailyGoalResponse>;

    // Transform API response to DailyGoalData format
    // Group by subject, create array of 5 goals (Mon-Fri, dayOfWeek 1-5)
    const dailyGoalData: DailyGoalData = {};

    response.forEach(goal => {
      if (!dailyGoalData[goal.subject]) {
        dailyGoalData[goal.subject] = Array(5).fill(null).map(() => ({
          text: '',
          isCompleted: false,
          notes: undefined,
          notesCompleted: false,
          notesHistory: [],
        }));
      }

      // dayOfWeek is 1-5 (Mon-Fri), convert to 0-based index
      const dayIndex = goal.dayOfWeek - 1;

      if (dayIndex >= 0 && dayIndex < 5) {
        dailyGoalData[goal.subject][dayIndex] = {
          id: goal.id,
          text: goal.text,
          isCompleted: goal.isCompleted,
          notes: goal.notes || undefined,
          notesCompleted: goal.notesCompleted,
          notesHistory: [],
        };
      }
    });

    return dailyGoalData;
  },

  create: async (
    projectionId: string,
    subject: string,
    quarter: string,
    week: number,
    dayOfWeek: number,
    text: string,
    token: string | null
  ): Promise<DailyGoalResponse> => {
    const params = new URLSearchParams({ projectionId, quarter, week: week.toString() });
    return await apiFetch(`/daily-goals?${params}`, token, {
      method: 'POST',
      body: JSON.stringify({
        subject,
        quarter,
        week,
        dayOfWeek,
        text,
      }),
    }) as DailyGoalResponse;
  },

  addNote: async (
    dailyGoalId: string,
    notes: string,
    token: string | null
  ): Promise<DailyGoalResponse> => {
    return await apiFetch(`/daily-goals/${dailyGoalId}/note`, token, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }) as DailyGoalResponse;
  },

  markComplete: async (
    dailyGoalId: string,
    isCompleted: boolean,
    token: string | null
  ): Promise<DailyGoalResponse> => {
    return await apiFetch(`/daily-goals/${dailyGoalId}/complete`, token, {
      method: 'PUT',
      body: JSON.stringify({ isCompleted }),
    }) as DailyGoalResponse;
  },
};
