import { useAuth } from '@clerk/clerk-react';
import { projectionsApi } from './projections';
import { categoriesApi } from './categories';
import { schoolsApi } from './schools';
import { studentsApi } from './students';
import { subjectsApi } from './subjects';
import { paceCatalogApi } from './pace-catalog';
import { dailyGoalsApi } from './daily-goals';
import { monthlyAssignmentsApi } from './monthly-assignment';
import { authApi } from './auth';

export function useApi() {
  const { getToken } = useAuth();

  return {
    projections: {
      create: async (data: Parameters<typeof projectionsApi.create>[0]) => {
        const token = await getToken();
        return projectionsApi.create(data, token);
      },
      generate: async (data: Parameters<typeof projectionsApi.generate>[0]) => {
        const token = await getToken();
        return projectionsApi.generate(data, token);
      },
      getList: async (schoolYear?: string) => {
        const token = await getToken();
        return projectionsApi.getList(schoolYear, token);
      },
      getById: async (projectionId: string) => {
        const token = await getToken();
        return projectionsApi.getById(projectionId, token);
      },
      movePace: async (projectionId: string, paceId: string, data: { quarter: string; week: number }) => {
        const token = await getToken();
        return projectionsApi.movePace(projectionId, paceId, data, token);
      },
      addPace: async (projectionId: string, data: { paceCatalogId: string; quarter: string; week: number }) => {
        const token = await getToken();
        return projectionsApi.addPace(projectionId, data, token);
      },
      deletePace: async (projectionId: string, paceId: string) => {
        const token = await getToken();
        return projectionsApi.deletePace(projectionId, paceId, token);
      },
      updateGrade: async (projectionId: string, paceId: string, data: { grade: number }) => {
        const token = await getToken();
        return projectionsApi.updateGrade(projectionId, paceId, data, token);
      },
      markUngraded: async (projectionId: string, paceId: string) => {
        const token = await getToken();
        return projectionsApi.markUngraded(projectionId, paceId, token);
      },
    },
    categories: {
      getAllWithSubjects: async () => {
        const token = await getToken();
        return categoriesApi.getAllWithSubjects(token);
      },
    },
    schools: {
      getWithCurrentYear: async () => {
        const token = await getToken();
        return schoolsApi.getWithCurrentYear(token);
      },
    },
    students: {
      getEnrolledWithoutOpenProjection: async () => {
        const token = await getToken();
        return studentsApi.getEnrolledWithoutOpenProjection(token);
      },
    },
    subjects: {
      getSubjectAndNextLevelsWithPaces: async (subjectId: string) => {
        const token = await getToken();
        return subjectsApi.getSubjectAndNextLevelsWithPaces(subjectId, token);
      },
    },
    paceCatalog: {
      get: async (filters: { category?: string; subSubjectId?: string }) => {
        const token = await getToken();
        return paceCatalogApi.get(filters, token);
      },
    },
    dailyGoals: {
      get: async (projectionId: string, quarter: string, week: number) => {
        const token = await getToken();
        return dailyGoalsApi.get(projectionId, quarter, week, token);
      },
      create: async (projectionId: string, subject: string, quarter: string, week: number, dayOfWeek: number, text: string) => {
        const token = await getToken();
        return dailyGoalsApi.create(projectionId, subject, quarter, week, dayOfWeek, text, token);
      },
      addNote: async (dailyGoalId: string, notes: string) => {
        const token = await getToken();
        return dailyGoalsApi.addNote(dailyGoalId, notes, token);
      },
      markComplete: async (dailyGoalId: string, isCompleted: boolean) => {
        const token = await getToken();
        return dailyGoalsApi.markComplete(dailyGoalId, isCompleted, token);
      },
    },
    monthlyAssignments: {
      getBySchoolYear: async (schoolYearId: string) => {
        const token = await getToken();
        return monthlyAssignmentsApi.getBySchoolYear(schoolYearId, token);
      },
      createTemplate: async (schoolYearId: string, data: Parameters<typeof monthlyAssignmentsApi.createTemplate>[1]) => {
        const token = await getToken();
        return monthlyAssignmentsApi.createTemplate(schoolYearId, data, token);
      },
      updateTemplate: async (templateId: string, data: Parameters<typeof monthlyAssignmentsApi.updateTemplate>[1]) => {
        const token = await getToken();
        return monthlyAssignmentsApi.updateTemplate(templateId, data, token);
      },
      deleteTemplate: async (templateId: string) => {
        const token = await getToken();
        return monthlyAssignmentsApi.deleteTemplate(templateId, token);
      },
      createPercentage: async (schoolYearId: string, data: Parameters<typeof monthlyAssignmentsApi.createPercentage>[1]) => {
        const token = await getToken();
        return monthlyAssignmentsApi.createPercentage(schoolYearId, data, token);
      },
      getByProjection: async (projectionId: string) => {
        const token = await getToken();
        return monthlyAssignmentsApi.getByProjection(projectionId, token);
      },
      updateGrade: async (projectionId: string, monthlyAssignmentId: string, data: Parameters<typeof monthlyAssignmentsApi.updateGrade>[2]) => {
        const token = await getToken();
        return monthlyAssignmentsApi.updateGrade(projectionId, monthlyAssignmentId, data, token);
      },
      markUngraded: async (projectionId: string, monthlyAssignmentId: string) => {
        const token = await getToken();
        return monthlyAssignmentsApi.markUngraded(projectionId, monthlyAssignmentId, token);
      },
    },
    auth: {
      updatePassword: async (password: string) => {
        const token = await getToken();
        return authApi.updatePassword(password, token);
      },
    },
  };
}

export type { CreateProjectionInput, GenerateProjectionInput, GenerateProjectionSubject, ProjectionListItem, ProjectionDetails } from './projections';
export type { CategoryWithSubjects } from './categories';
export type { SchoolWithCurrentYear } from './schools';
export type { Student } from './students';
export type { SubjectWithPaces } from './subjects';
export type { UserInfo } from './types';