// API Service - Handles all API calls with Clerk authentication
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Generic API fetch function with authentication
async function apiFetch(url: string, token: string | null, options: RequestInit = {}) {
  if (!token) {
    throw new Error('Authentication token required');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content (for DELETE operations)
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Students API
export const studentsApi = {
  getAll: (token: string | null) => apiFetch('/students', token),
  getById: (id: string, token: string | null) => apiFetch(`/students/${id}`, token),
  create: (data: Record<string, unknown>, token: string | null) => 
    apiFetch('/students', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>, token: string | null) => 
    apiFetch(`/students/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, token: string | null) => 
    apiFetch(`/students/${id}`, token, { method: 'DELETE' }),
};

// Projections API
export const projectionsApi = {
  getByStudentId: (studentId: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections`, token),
  getById: (studentId: string, id: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${id}`, token),
  create: (studentId: string, data: Record<string, unknown>, token: string | null) => 
    apiFetch(`/students/${studentId}/projections`, token, { method: 'POST', body: JSON.stringify(data) }),
  update: (studentId: string, id: string, data: Record<string, unknown>, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (studentId: string, id: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${id}`, token, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  syncUser: (token: string | null) => apiFetch('/auth/sync', token, { method: 'POST' }),
  getCurrentUser: (token: string | null) => apiFetch('/auth/me', token),
};

// Schools API
export const schoolsApi = {
  getMy: (token: string | null) => apiFetch('/schools/me', token),
  create: (data: Record<string, unknown>) => apiFetch('/schools', null, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>, token: string | null) => 
    apiFetch('/schools/me', token, { method: 'PUT', body: JSON.stringify(data) }),
};

// Custom hook for authenticated API calls
export function useApi() {
  const { getToken } = useAuth();

  return {
    students: {
      getAll: async () => {
        const token = await getToken();
        return studentsApi.getAll(token);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return studentsApi.getById(id, token);
      },
      create: async (data: Record<string, unknown>) => {
        const token = await getToken();
        return studentsApi.create(data, token);
      },
      update: async (id: string, data: Record<string, unknown>) => {
        const token = await getToken();
        return studentsApi.update(id, data, token);
      },
      delete: async (id: string) => {
        const token = await getToken();
        return studentsApi.delete(id, token);
      },
    },
    projections: {
      getByStudentId: async (studentId: string) => {
        const token = await getToken();
        return projectionsApi.getByStudentId(studentId, token);
      },
      getById: async (studentId: string, id: string) => {
        const token = await getToken();
        return projectionsApi.getById(studentId, id, token);
      },
      create: async (studentId: string, data: Record<string, unknown>) => {
        const token = await getToken();
        return projectionsApi.create(studentId, data, token);
      },
      update: async (studentId: string, id: string, data: Record<string, unknown>) => {
        const token = await getToken();
        return projectionsApi.update(studentId, id, data, token);
      },
      delete: async (studentId: string, id: string) => {
        const token = await getToken();
        return projectionsApi.delete(studentId, id, token);
      },
    },
    auth: {
      syncUser: async () => {
        const token = await getToken();
        return authApi.syncUser(token);
      },
      getCurrentUser: async () => {
        const token = await getToken();
        return authApi.getCurrentUser(token);
      },
    },
    schools: {
      getMy: async () => {
        const token = await getToken();
        return schoolsApi.getMy(token);
      },
      create: schoolsApi.create,
      update: async (data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolsApi.update(data, token);
      },
    },
  };
}

