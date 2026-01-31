import { apiFetch } from './fetch';

export interface MonthlyAssignmentTemplate {
  id: string;
  name: string;
  quarter: string;
  month: number;
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

export interface MonthlyAssignmentsData {
  templates: MonthlyAssignmentTemplate[];
  percentages: QuarterGradePercentage[];
}

export interface MonthlyAssignmentGradeHistory {
  id: string;
  grade: number;
  date: string;
  note: string | null;
}

export interface ProjectionMonthlyAssignment {
  id: string;
  projectionId: string;
  monthlyAssignmentTemplateId: string;
  grade: number | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  monthlyAssignmentTemplate: MonthlyAssignmentTemplate;
  gradeHistory: MonthlyAssignmentGradeHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonthlyAssignmentTemplateInput {
  name: string;
  quarter: string;
  month: number;
}

export interface UpdateMonthlyAssignmentTemplateInput {
  name: string;
  month: number;
}

export interface CreateQuarterPercentageInput {
  quarter: string;
  percentage: number;
}

export interface UpdateMonthlyAssignmentGradeInput {
  grade: number;
}

export const monthlyAssignmentsApi = {
  getBySchoolYear: async (schoolYearId: string, token: string | null): Promise<MonthlyAssignmentsData> =>
    apiFetch(`/monthly-assignments/school-year/${schoolYearId}`, token),

  createTemplate: async (schoolYearId: string, data: CreateMonthlyAssignmentTemplateInput, token: string | null): Promise<MonthlyAssignmentTemplate> =>
    apiFetch(`/monthly-assignments/school-year/${schoolYearId}/templates`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: async (templateId: string, data: UpdateMonthlyAssignmentTemplateInput, token: string | null): Promise<MonthlyAssignmentTemplate> =>
    apiFetch(`/monthly-assignments/templates/${templateId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTemplate: async (templateId: string, token: string | null): Promise<void> =>
    apiFetch(`/monthly-assignments/templates/${templateId}`, token, {
      method: 'DELETE',
    }),

  createPercentage: async (schoolYearId: string, data: CreateQuarterPercentageInput, token: string | null): Promise<QuarterGradePercentage> =>
    apiFetch(`/monthly-assignments/school-year/${schoolYearId}/percentages`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByProjection: async (projectionId: string, token: string | null): Promise<ProjectionMonthlyAssignment[]> =>
    apiFetch(`/monthly-assignments/projection/${projectionId}`, token),

  updateGrade: async (projectionId: string, monthlyAssignmentId: string, data: UpdateMonthlyAssignmentGradeInput, token: string | null): Promise<ProjectionMonthlyAssignment> =>
    apiFetch(`/monthly-assignments/projection/${projectionId}/assignments/${monthlyAssignmentId}/grade`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  markUngraded: async (projectionId: string, monthlyAssignmentId: string, token: string | null): Promise<ProjectionMonthlyAssignment> =>
    apiFetch(`/monthly-assignments/projection/${projectionId}/assignments/${monthlyAssignmentId}/mark-ungraded`, token, {
      method: 'PATCH',
    }),
};
