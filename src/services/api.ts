// API Service - Handles all API calls with Clerk authentication
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Generic API fetch function with authentication
async function apiFetch(url: string, token: string | null, options: RequestInit = {}) {
  if (!token) {
    throw new Error('Authentication token required');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Merge any additional headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

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
  getDetail: (studentId: string, id: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${id}/detail`, token),
  create: (studentId: string, data: Record<string, unknown>, token: string | null) => 
    apiFetch(`/students/${studentId}/projections`, token, { method: 'POST', body: JSON.stringify(data) }),
  update: (studentId: string, id: string, data: Record<string, unknown>, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (studentId: string, id: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${id}`, token, { method: 'DELETE' }),
  addPace: (studentId: string, projectionId: string, data: { paceCatalogId: string, quarter: string, week: number }, token: string | null) =>
    apiFetch(`/students/${studentId}/projections/${projectionId}/paces`, token, { method: 'POST', body: JSON.stringify(data) }),
  updatePaceGrade: (studentId: string, projectionId: string, paceId: string, data: { grade: number, isCompleted?: boolean, isFailed?: boolean, comments?: string, note?: string }, token: string | null) =>
    apiFetch(`/students/${studentId}/projections/${projectionId}/paces/${paceId}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  movePace: (studentId: string, projectionId: string, paceId: string, data: { quarter: string, week: number }, token: string | null) =>
    apiFetch(`/students/${studentId}/projections/${projectionId}/paces/${paceId}/move`, token, { method: 'PATCH', body: JSON.stringify(data) }),
  removePace: (studentId: string, projectionId: string, paceId: string, token: string | null) =>
    apiFetch(`/students/${studentId}/projections/${projectionId}/paces/${paceId}`, token, { method: 'DELETE' }),
};

// PACE Catalog API
export const paceCatalogApi = {
  get: (filters: { category?: string, level?: string }, token: string | null) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    const query = params.toString();
    return apiFetch(`/pace-catalog${query ? '?' + query : ''}`, token);
  },
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
      getDetail: async (studentId: string, id: string) => {
        const token = await getToken();
        return projectionsApi.getDetail(studentId, id, token);
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
      addPace: async (studentId: string, projectionId: string, data: { paceCatalogId: string, quarter: string, week: number }) => {
        const token = await getToken();
        return projectionsApi.addPace(studentId, projectionId, data, token);
      },
      updatePaceGrade: async (studentId: string, projectionId: string, paceId: string, data: { grade: number, isCompleted?: boolean, isFailed?: boolean, comments?: string, note?: string }) => {
        const token = await getToken();
        return projectionsApi.updatePaceGrade(studentId, projectionId, paceId, data, token);
      },
      movePace: async (studentId: string, projectionId: string, paceId: string, data: { quarter: string, week: number }) => {
        const token = await getToken();
        return projectionsApi.movePace(studentId, projectionId, paceId, data, token);
      },
      removePace: async (studentId: string, projectionId: string, paceId: string) => {
        const token = await getToken();
        return projectionsApi.removePace(studentId, projectionId, paceId, token);
      },
    },
    paceCatalog: {
      get: async (filters: { category?: string, level?: string } = {}) => {
        const token = await getToken();
        return paceCatalogApi.get(filters, token);
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

