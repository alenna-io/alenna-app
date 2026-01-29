import { apiFetch } from './fetch';

export interface SchoolWithCurrentYear {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  teacherLimit?: number | null;
  userLimit?: number | null;
  status: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  schoolYears?: Array<{
    id: string;
    schoolId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface CurrentWeekInfo {
  schoolYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    quarters: Array<{
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      order: number;
      weeksCount: number;
    }>;
  };
  currentQuarter: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    order: number;
    weeksCount: number;
  } | null;
  currentWeek: number | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
}

export const schoolsApi = {
  getWithCurrentYear: async (token: string | null): Promise<SchoolWithCurrentYear | null> =>
    apiFetch('/schools', token),
  getCurrentWeek: async (token: string | null): Promise<CurrentWeekInfo | null> =>
    apiFetch('/schools/current-week', token),
};
