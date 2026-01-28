import { apiFetch } from './fetch';

export interface PaceCatalogItem {
  id: string;
  code: string;
  name: string;
  subSubjectName: string;
  categoryName: string;
  levelId: string;
  difficulty: number;
}

export const paceCatalogApi = {
  get: async (filters: { category?: string; subSubjectId?: string }, token: string | null = null): Promise<PaceCatalogItem[]> => {
    const params = new URLSearchParams();
    if (filters.category) {
      params.append('category', filters.category);
    }
    const url = `/pace-catalog${params.toString() ? `?${params.toString()}` : ''}`;
    return apiFetch(url, token);
  },
};
