import { useAuth } from '@clerk/clerk-react';
import { projectionsApi } from './projections';
import { categoriesApi } from './categories';
import { schoolsApi } from './schools';
import { studentsApi } from './students';
import { subjectsApi } from './subjects';

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
  };
}

export type { CreateProjectionInput, GenerateProjectionInput, GenerateProjectionSubject, ProjectionListItem, ProjectionDetails } from './projections';
export type { CategoryWithSubjects } from './categories';
export type { SchoolWithCurrentYear } from './schools';
export type { Student } from './students';
export type { SubjectWithPaces } from './subjects';
export type { UserInfo } from './types';