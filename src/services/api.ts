// API Service - Handles all API calls with Clerk authentication
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Generic API fetch function with authentication
async function apiFetch(url: string, token: string | null, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Students API
export const studentsApi = {
  getAll: (token: string | null) => apiFetch('/students', token),
  getById: (id: string, token: string | null) => apiFetch(`/students/${id}`, token),
  create: (data: any, token: string | null) => 
    apiFetch('/students', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any, token: string | null) => 
    apiFetch(`/students/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, token: string | null) => 
    apiFetch(`/students/${id}`, token, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  syncUser: (token: string | null) => apiFetch('/auth/sync', token, { method: 'POST' }),
  getCurrentUser: (token: string | null) => apiFetch('/auth/me', token),
};

// Schools API
export const schoolsApi = {
  getMy: (token: string | null) => apiFetch('/schools/me', token),
  create: (data: any) => apiFetch('/schools', null, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any, token: string | null) => 
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
      create: async (data: any) => {
        const token = await getToken();
        return studentsApi.create(data, token);
      },
      update: async (id: string, data: any) => {
        const token = await getToken();
        return studentsApi.update(id, data, token);
      },
      delete: async (id: string) => {
        const token = await getToken();
        return studentsApi.delete(id, token);
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
      update: async (data: any) => {
        const token = await getToken();
        return schoolsApi.update(data, token);
      },
    },
  };
}

