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

export interface ProjectionListItem {
  id: string;
  studentId: string;
  schoolYear: string;
  status: 'OPEN' | 'CLOSED';
  totalPaces: number;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectionPaceDetails {
  id: string;
  projectionId: string;
  paceCatalogId: string;
  quarter: string;
  week: number;
  grade: number | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'UNFINISHED';
  originalQuarter: string | null;
  originalWeek: number | null;
  paceCatalog: {
    id: string;
    code: string;
    name: string;
    orderIndex: number;
    subject: {
      id: string;
      name: string;
      category: {
        id: string;
        name: string;
        displayOrder: number;
      };
    };
  };
  gradeHistory: Array<{
    id: string;
    grade: number;
    date: string;
    note: string | null;
  }>;
}

export interface DailyGoalDetails {
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

export interface ProjectionDetails {
  id: string;
  studentId: string;
  schoolId: string;
  schoolYear: string;
  status: 'OPEN' | 'CLOSED';
  student: {
    id: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  projectionPaces: ProjectionPaceDetails[];
  dailyGoals: DailyGoalDetails[];
  createdAt: string;
  updatedAt: string;
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

  getList: async (schoolYear?: string, token: string | null = null): Promise<ProjectionListItem[]> => {
    const url = schoolYear ? `/projections?schoolYear=${encodeURIComponent(schoolYear)}` : '/projections';
    return apiFetch(url, token);
  },

  getById: async (projectionId: string, token: string | null = null): Promise<ProjectionDetails> =>
    apiFetch(`/projections/${projectionId}`, token),
};
