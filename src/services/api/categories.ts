import { apiFetch } from './fetch';

export interface CategoryWithSubjects {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  subjects: Array<{
    id: string;
    name: string;
    difficulty: number;
    categoryId: string;
    levelId: string;
    level?: {
      id: string;
      number: number | null;
      name: string;
    };
  }>;
}

export const categoriesApi = {
  getAllWithSubjects: async (token: string | null): Promise<CategoryWithSubjects[]> =>
    apiFetch('/categories', token),
};
