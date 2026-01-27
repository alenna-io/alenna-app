import { apiFetch } from './fetch';

export interface Student {
  id: string;
  userId: string;
  schoolId: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zipCode?: string | null;
    schoolId: string;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    language: string;
    status: string;
    createdPassword: boolean;
  };
}

export const studentsApi = {
  getEnrolledWithoutOpenProjection: async (token: string | null): Promise<Student[]> =>
    apiFetch('/students/projections/enrolled-without-open', token),
};
