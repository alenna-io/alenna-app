import { apiFetch } from './fetch';

export interface CreateProjectionInput {
  studentId: string;
  schoolId: string;
  schoolYear: string;
}

export interface GenerateProjectionSubject {
  categoryId: string;
  subjectId?: string | null;
  startPace: number;
  endPace: number;
  skipPaces: number[];
  notPairWith: string[];
  difficulty?: number | null;
}

export interface GenerateProjectionInput {
  studentId: string;
  schoolId: string;
  schoolYear: string;
  subjects: GenerateProjectionSubject[];
}

export const projectionsApi = {
  create: async (data: CreateProjectionInput, token: string | null) =>
    apiFetch('/projections', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generate: async (data: GenerateProjectionInput, token: string | null) =>
    apiFetch('/projections/generate', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
