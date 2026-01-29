import { useAuth } from '@clerk/clerk-react';
import { projectionsApi } from './projections';
import { categoriesApi } from './categories';
import { schoolsApi } from './schools';
import { studentsApi } from './students';
import { subjectsApi } from './subjects';
import { paceCatalogApi } from './pace-catalog';
import { dailyGoalsApi } from './daily-goals';
import { monthlyGoalsApi } from './monthly-goals';

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
    monthlyGoals: {
      getBySchoolYear: async (schoolYearId: string) => {
        const token = await getToken();
        return monthlyGoalsApi.getBySchoolYear(schoolYearId, token);
      },
      createTemplate: async (schoolYearId: string, data: Parameters<typeof monthlyGoalsApi.createTemplate>[1]) => {
        const token = await getToken();
        return monthlyGoalsApi.createTemplate(schoolYearId, data, token);
      },
      updateTemplate: async (templateId: string, data: Parameters<typeof monthlyGoalsApi.updateTemplate>[1]) => {
        const token = await getToken();
        return monthlyGoalsApi.updateTemplate(templateId, data, token);
      },
      deleteTemplate: async (templateId: string) => {
        const token = await getToken();
        return monthlyGoalsApi.deleteTemplate(templateId, token);
      },
      createPercentage: async (schoolYearId: string, data: Parameters<typeof monthlyGoalsApi.createPercentage>[1]) => {
        const token = await getToken();
        return monthlyGoalsApi.createPercentage(schoolYearId, data, token);
      },
      getByProjection: async (projectionId: string) => {
        const token = await getToken();
        return monthlyGoalsApi.getByProjection(projectionId, token);
      },
      updateGrade: async (projectionId: string, monthlyGoalId: string, data: Parameters<typeof monthlyGoalsApi.updateGrade>[2]) => {
        const token = await getToken();
        return monthlyGoalsApi.updateGrade(projectionId, monthlyGoalId, data, token);
      },
      markUngraded: async (projectionId: string, monthlyGoalId: string) => {
        const token = await getToken();
        return monthlyGoalsApi.markUngraded(projectionId, monthlyGoalId, token);
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