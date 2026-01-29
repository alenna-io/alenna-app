import { apiFetch } from './fetch';

export interface MonthlyGoalTemplate {
  id: string;
  name: string;
  quarter: string;
  schoolYearId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterGradePercentage {
  id: string;
  percentage: number;
  quarter: string;
  schoolYearId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyGoalsData {
  templates: MonthlyGoalTemplate[];
  percentages: QuarterGradePercentage[];
}

export interface MonthlyGoalGradeHistory {
  id: string;
  grade: number;
  date: string;
  note: string | null;
}

export interface ProjectionMonthlyGoal {
  id: string;
  projectionId: string;
  monthlyGoalTemplateId: string;
  grade: number | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  monthlyGoalTemplate: MonthlyGoalTemplate;
  gradeHistory: MonthlyGoalGradeHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonthlyGoalTemplateInput {
  name: string;
  quarter: string;
}

export interface UpdateMonthlyGoalTemplateInput {
  name: string;
}

export interface CreateQuarterPercentageInput {
  quarter: string;
  percentage: number;
}

export interface UpdateMonthlyGoalGradeInput {
  grade: number;
}

export const monthlyGoalsApi = {
  getBySchoolYear: async (schoolYearId: string, token: string | null): Promise<MonthlyGoalsData> =>
    apiFetch(`/monthly-goals/school-year/${schoolYearId}`, token),

  createTemplate: async (schoolYearId: string, data: CreateMonthlyGoalTemplateInput, token: string | null): Promise<MonthlyGoalTemplate> =>
    apiFetch(`/monthly-goals/school-year/${schoolYearId}/templates`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: async (templateId: string, data: UpdateMonthlyGoalTemplateInput, token: string | null): Promise<MonthlyGoalTemplate> =>
    apiFetch(`/monthly-goals/templates/${templateId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTemplate: async (templateId: string, token: string | null): Promise<void> =>
    apiFetch(`/monthly-goals/templates/${templateId}`, token, {
      method: 'DELETE',
    }),

  createPercentage: async (schoolYearId: string, data: CreateQuarterPercentageInput, token: string | null): Promise<QuarterGradePercentage> =>
    apiFetch(`/monthly-goals/school-year/${schoolYearId}/percentages`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByProjection: async (projectionId: string, token: string | null): Promise<ProjectionMonthlyGoal[]> =>
    apiFetch(`/monthly-goals/projection/${projectionId}`, token),

  updateGrade: async (projectionId: string, monthlyGoalId: string, data: UpdateMonthlyGoalGradeInput, token: string | null): Promise<ProjectionMonthlyGoal> =>
    apiFetch(`/monthly-goals/projection/${projectionId}/goals/${monthlyGoalId}/grade`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  markUngraded: async (projectionId: string, monthlyGoalId: string, token: string | null): Promise<ProjectionMonthlyGoal> =>
    apiFetch(`/monthly-goals/projection/${projectionId}/goals/${monthlyGoalId}/mark-ungraded`, token, {
      method: 'PATCH',
    }),
};
