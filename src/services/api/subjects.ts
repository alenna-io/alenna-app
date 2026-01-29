import { apiFetch } from './fetch';

export interface SubjectWithPaces {
  id: string;
  name: string;
  level: {
    id: string;
    number: number | null;
    name: string;
  };
  paces: Array<{
    id: string;
    code: string;
    name: string;
    orderIndex: number;
  }>;
}

export const subjectsApi = {
  getSubjectAndNextLevelsWithPaces: async (
    subjectId: string,
    token: string | null
  ): Promise<SubjectWithPaces[]> =>
    apiFetch(`/subjects/${subjectId}/paces`, token),
};
