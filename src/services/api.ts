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
    'Cache-Control': 'no-cache',
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
    cache: 'no-store',
    ...options,
    headers,
  });

  // Handle 204 No Content (for DELETE operations)
  if (response.status === 204) {
    return null;
  }

  if (response.status === 304) {
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
  getAll: (token: string | null, year?: string) => 
    apiFetch(`/projections${year ? `?year=${year}` : ''}`, token),
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
  markIncomplete: (studentId: string, projectionId: string, paceId: string, token: string | null) =>
    apiFetch(`/students/${studentId}/projections/${projectionId}/paces/${paceId}/incomplete`, token, { method: 'PATCH' }),
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

// SubSubjects API
export const subSubjectsApi = {
  getAll: (token: string | null) => apiFetch('/sub-subjects', token),
};

// Projection Templates API
export const projectionTemplatesApi = {
  getAll: (token: string | null, level?: string) => {
    const query = level ? `?level=${level}` : '';
    return apiFetch(`/projection-templates${query}`, token);
  },
  getByLevel: (level: string, token: string | null) =>
    apiFetch(`/projection-templates/level/${level}`, token),
  getById: (id: string, token: string | null) =>
    apiFetch(`/projection-templates/${id}`, token),
};

// Modules API
export interface ModuleData {
  id: string;
  key: string;
  name: string;
  description?: string;
  displayOrder: number;
  actions: string[];
}

export const modulesApi = {
  getUserModules: (token: string | null) => apiFetch('/modules/me', token),
};

// School Year API
export interface Quarter {
  id: string;
  schoolYearId: string;
  name: string;
  displayName: string;
  startDate: string;
  endDate: string;
  order: number;
  weeksCount: number;
}

export interface SchoolYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  quarters?: Quarter[];
}

export interface CurrentWeekInfo {
  schoolYear: SchoolYear;
  currentQuarter: Quarter | null;
  currentWeek: number | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
}

export const schoolYearsApi = {
  getCurrentWeek: (token: string | null) => apiFetch('/school-years/current-week', token),
  getAll: (token: string | null) => apiFetch('/school-years', token),
  getById: (id: string, token: string | null) => apiFetch(`/school-years/${id}`, token),
  create: (data: Record<string, unknown>, token: string | null) => apiFetch('/school-years', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>, token: string | null) => apiFetch(`/school-years/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, token: string | null) => apiFetch(`/school-years/${id}`, token, { method: 'DELETE' }),
  setActive: (id: string, token: string | null) => apiFetch(`/school-years/${id}/activate`, token, { method: 'POST' }),
};

// Auth API
export interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  language?: string;
  schoolId: string;
  schoolName: string;
  studentId?: string | null;
  createdPassword: boolean;
  studentProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    graduationDate: string;
    certificationType?: string;
    contactPhone?: string;
    isLeveled: boolean;
    expectedLevel?: string;
    address?: string;
    parents: Array<{ id: string; name: string }>;
  } | null;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  permissions: string[];
  modules: ModuleData[];
}

export const authApi = {
  syncUser: (token: string | null) => apiFetch('/auth/sync', token, { method: 'POST' }),
  getCurrentUser: (token: string | null) => apiFetch('/auth/me', token),
  getUserInfo: (token: string | null) => apiFetch('/auth/info', token),
  updatePassword: (password: string, token: string | null) => apiFetch('/auth/password', token, {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
};

// Users API
export const usersApi = {
  getUsers: (token: string | null) => apiFetch('/users', token),
  getAvailableRoles: (token: string | null) => apiFetch('/users/roles', token),
  createUser: (data: Record<string, unknown>, token: string | null) => 
    apiFetch('/users', token, { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Record<string, unknown>, token: string | null) => 
    apiFetch(`/users/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  updateMyProfile: (data: Record<string, unknown>, token: string | null) =>
    apiFetch('/users/me', token, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateUser: (id: string, token: string | null) => 
    apiFetch(`/users/${id}/deactivate`, token, { method: 'POST' }),
  reactivateUser: (id: string, token: string | null) => 
    apiFetch(`/users/${id}/reactivate`, token, { method: 'POST' }),
  deleteUser: (id: string, token: string | null) => 
    apiFetch(`/users/${id}`, token, { method: 'DELETE' }),
};

// Daily Goals API
export interface DailyGoalData {
  [subject: string]: Array<{
    id?: string;
    text: string;
    isCompleted: boolean;
    notes?: string;
    notesCompleted?: boolean;
    notesHistory?: Array<{
      text: string;
      completedDate: string;
    }>;
  }>;
}

export interface DailyGoal {
  id: string;
  projectionId: string;
  subject: string;
  quarter: string;
  week: number;
  dayOfWeek: number;
  text: string;
  isCompleted: boolean;
  notes?: string;
  notesCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteHistory {
  id: string;
  dailyGoalId: string;
  text: string;
  completedDate: string;
  createdAt?: string;
}

export const dailyGoalsApi = {
  get: (studentId: string, projectionId: string, quarter: string, week: number, token: string | null) => {
    const params = new URLSearchParams({ quarter, week: week.toString() });
    return apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals?${params}`, token);
  },
  create: (studentId: string, projectionId: string, data: {
    subject: string;
    quarter: string;
    week: number;
    dayOfWeek: number;
    text: string;
    isCompleted?: boolean;
    notes?: string;
    notesCompleted?: boolean;
  }, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals`, token, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (studentId: string, projectionId: string, goalId: string, data: {
    subject?: string;
    quarter?: string;
    week?: number;
    dayOfWeek?: number;
    text?: string;
    isCompleted?: boolean;
    notes?: string;
    notesCompleted?: boolean;
  }, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals/${goalId}`, token, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  updateCompletion: (studentId: string, projectionId: string, goalId: string, isCompleted: boolean, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals/${goalId}/completion`, token, { 
      method: 'PATCH', 
      body: JSON.stringify({ isCompleted }) 
    }),
  updateNotes: (studentId: string, projectionId: string, goalId: string, data: {
    notes?: string;
    notesCompleted?: boolean;
  }, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals/${goalId}/notes`, token, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  addNoteToHistory: (studentId: string, projectionId: string, goalId: string, text: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals/${goalId}/notes`, token, { 
      method: 'POST', 
      body: JSON.stringify({ text }) 
    }),
  getNoteHistory: (studentId: string, projectionId: string, goalId: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals/${goalId}/notes`, token),
  delete: (studentId: string, projectionId: string, goalId: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/daily-goals/${goalId}`, token, { 
      method: 'DELETE' 
    }),
};

// Monthly Assignments API
export const monthlyAssignmentsApi = {
  get: (studentId: string, projectionId: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/monthly-assignments`, token),
  create: (studentId: string, projectionId: string, data: {
    name: string;
    quarter: string;
  }, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/monthly-assignments`, token, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (studentId: string, projectionId: string, assignmentId: string, data: {
    name: string;
  }, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/monthly-assignments/${assignmentId}`, token, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  grade: (studentId: string, projectionId: string, assignmentId: string, data: {
    grade: number;
    note?: string;
  }, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/monthly-assignments/${assignmentId}/grade`, token, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  delete: (studentId: string, projectionId: string, assignmentId: string, token: string | null) => 
    apiFetch(`/students/${studentId}/projections/${projectionId}/monthly-assignments/${assignmentId}`, token, { 
      method: 'DELETE' 
    }),
};

// Report Cards API
export const reportCardsApi = {
  get: (studentId: string, projectionId: string, token: string | null) =>
    apiFetch(`/students/${studentId}/projections/${projectionId}/report-card`, token),
};

// School Monthly Assignments API
export const schoolMonthlyAssignmentsApi = {
  getTemplates: (schoolYearId: string, token: string | null) =>
    apiFetch(`/school-monthly-assignments/${schoolYearId}/templates`, token),
  createTemplate: (data: { name: string; quarter: string; schoolYearId: string }, token: string | null) =>
    apiFetch('/school-monthly-assignments/templates', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (templateId: string, data: { name: string }, token: string | null) =>
    apiFetch(`/school-monthly-assignments/templates/${templateId}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTemplate: (templateId: string, token: string | null) =>
    apiFetch(`/school-monthly-assignments/templates/${templateId}`, token, {
      method: 'DELETE',
    }),
  getGradePercentages: (schoolYearId: string, token: string | null) =>
    apiFetch(`/school-monthly-assignments/${schoolYearId}/grade-percentages`, token),
  updateGradePercentage: (data: { schoolYearId: string; quarter: string; percentage: number }, token: string | null) =>
    apiFetch('/school-monthly-assignments/grade-percentages', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Schools API
export const schoolsApi = {
  getMy: (token: string | null) => apiFetch('/schools/me', token),
  getAll: (token: string | null) => apiFetch('/schools', token),
  getById: (id: string, token: string | null) => apiFetch(`/schools/${id}`, token),
  create: (data: Record<string, unknown>, token: string | null) => apiFetch('/schools/admin/create', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>, token: string | null) =>
    apiFetch('/schools/me', token, { method: 'PUT', body: JSON.stringify(data) }),
  updateById: (id: string, data: Record<string, unknown>, token: string | null) =>
    apiFetch(`/schools/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, token: string | null) =>
    apiFetch(`/schools/${id}`, token, { method: 'DELETE' }),
  activate: (id: string, token: string | null) =>
    apiFetch(`/schools/${id}/activate`, token, { method: 'POST' }),
  deactivate: (id: string, token: string | null) =>
    apiFetch(`/schools/${id}/deactivate`, token, { method: 'POST' }),
  getStudentsCount: (id: string, token: string | null) => apiFetch(`/schools/${id}/students/count`, token),
  getStudents: (id: string, token: string | null) => apiFetch(`/schools/${id}/students`, token),
  getTeachersCount: (id: string, token: string | null) => apiFetch(`/schools/${id}/teachers/count`, token),
  getTeachers: (id: string, token: string | null) => apiFetch(`/schools/${id}/teachers`, token),
  getMyTeachers: (token: string | null) => apiFetch('/schools/me/teachers', token),
  getMyTeachersCount: (token: string | null) => apiFetch('/schools/me/teachers/count', token),
  getCertificationTypes: (id: string, token: string | null) => apiFetch(`/schools/${id}/certification-types`, token),
  getAllModules: (token: string | null) => apiFetch('/schools/modules/all', token),
  getSchoolModules: (id: string, token: string | null) => apiFetch(`/schools/${id}/modules`, token),
  enableModule: (id: string, moduleId: string, token: string | null) =>
    apiFetch(`/schools/${id}/modules/enable`, token, { method: 'POST', body: JSON.stringify({ moduleId }) }),
  disableModule: (id: string, moduleId: string, token: string | null) =>
    apiFetch(`/schools/${id}/modules/disable`, token, { method: 'POST', body: JSON.stringify({ moduleId }) }),
};

// Groups API
export const groupsApi = {
  getBySchoolYear: (schoolYearId: string, token: string | null) => apiFetch(`/groups/school-year/${schoolYearId}`, token),
  getById: (id: string, token: string | null) => apiFetch(`/groups/${id}`, token),
  getGroupStudents: (groupId: string, token: string | null) => apiFetch(`/groups/${groupId}/students`, token),
  create: (data: { teacherId: string; schoolYearId: string; name?: string | null; studentIds?: string[] }, token: string | null) =>
    apiFetch('/groups', token, { method: 'POST', body: JSON.stringify(data) }),
  addStudentsToGroup: (groupId: string, studentIds: string[], token: string | null) =>
    apiFetch(`/groups/${groupId}/students`, token, { method: 'POST', body: JSON.stringify({ studentIds }) }),
  removeStudentFromGroup: (groupId: string, studentId: string, token: string | null) =>
    apiFetch(`/groups/${groupId}/students/${studentId}`, token, { method: 'DELETE' }),
  delete: (id: string, token: string | null) => apiFetch(`/groups/${id}`, token, { method: 'DELETE' }),
  getStudentsByTeacher: (teacherId: string, schoolYearId: string, token: string | null) =>
    apiFetch(`/groups/teacher/${teacherId}/school-year/${schoolYearId}`, token),
  getStudentAssignments: (schoolYearId: string, token: string | null) =>
    apiFetch(`/groups/school-year/${schoolYearId}/students`, token),
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
      getAll: async (year?: string) => {
        const token = await getToken();
        return projectionsApi.getAll(token, year);
      },
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
      markIncomplete: async (studentId: string, projectionId: string, paceId: string) => {
        const token = await getToken();
        return projectionsApi.markIncomplete(studentId, projectionId, paceId, token);
      },
      removePace: async (studentId: string, projectionId: string, paceId: string) => {
        const token = await getToken();
        return projectionsApi.removePace(studentId, projectionId, paceId, token);
      },
      generate: async (data: {
        studentId: string;
        schoolYear: string;
        subjects: Array<{
          subSubjectId: string;
          subSubjectName: string;
          startPace: number;
          endPace: number;
          skipPaces: number[];
          notPairWith: string[];
          groupedWith?: string[];
          difficulty?: number;
        }>;
      }) => {
        const token = await getToken();
        return apiFetch('/projections/generate', token, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      generateFromDefaultTemplate: async (data: {
        studentId: string;
        schoolYear: string;
        templateId: string;
      }) => {
        const token = await getToken();
        return apiFetch('/projections/generate-from-default-template', token, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
    },
    paceCatalog: {
      get: async (filters: { category?: string, level?: string, subSubjectId?: string } = {}) => {
        const token = await getToken();
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.level) params.append('level', filters.level);
        if (filters.subSubjectId) params.append('subSubjectId', filters.subSubjectId);
        const query = params.toString();
        return apiFetch(`/pace-catalog${query ? '?' + query : ''}`, token);
      },
    },
    subjects: {
      getAll: async () => {
        const token = await getToken();
        return subSubjectsApi.getAll(token);
      },
    },
    projectionTemplates: {
      getAll: async (level?: string) => {
        const token = await getToken();
        return projectionTemplatesApi.getAll(token, level);
      },
      getByLevel: async (level: string) => {
        const token = await getToken();
        return projectionTemplatesApi.getByLevel(level, token);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return projectionTemplatesApi.getById(id, token);
      },
    },
    modules: {
      getUserModules: async () => {
        const token = await getToken();
        return modulesApi.getUserModules(token);
      },
    },
    auth: {
      updatePassword: async (password: string) => {
        const token = await getToken();
        return authApi.updatePassword(password, token);
      },
      syncUser: async () => {
        const token = await getToken();
        return authApi.syncUser(token);
      },
      getCurrentUser: async () => {
        const token = await getToken();
        return authApi.getCurrentUser(token);
      },
      getUserInfo: async () => {
        const token = await getToken();
        return authApi.getUserInfo(token);
      },
    },
    schools: {
      getMy: async () => {
        const token = await getToken();
        return schoolsApi.getMy(token);
      },
      getAll: async () => {
        const token = await getToken();
        return schoolsApi.getAll(token);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getById(id, token);
      },
      create: async (data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolsApi.create(data, token);
      },
      update: async (data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolsApi.update(data, token);
      },
      updateById: async (id: string, data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolsApi.updateById(id, data, token);
      },
      delete: async (id: string) => {
        const token = await getToken();
        return schoolsApi.delete(id, token);
      },
      activate: async (id: string) => {
        const token = await getToken();
        return schoolsApi.activate(id, token);
      },
      deactivate: async (id: string) => {
        const token = await getToken();
        return schoolsApi.deactivate(id, token);
      },
      getStudentsCount: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getStudentsCount(id, token);
      },
      getStudents: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getStudents(id, token);
      },
      getTeachersCount: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getTeachersCount(id, token);
      },
      getTeachers: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getTeachers(id, token);
      },
      getMyTeachers: async () => {
        const token = await getToken();
        return schoolsApi.getMyTeachers(token);
      },
      getMyTeachersCount: async () => {
        const token = await getToken();
        return schoolsApi.getMyTeachersCount(token);
      },
      getCertificationTypes: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getCertificationTypes(id, token);
      },
      getAllModules: async () => {
        const token = await getToken();
        return schoolsApi.getAllModules(token);
      },
      getSchoolModules: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getSchoolModules(id, token);
      },
      enableModule: async (id: string, moduleId: string) => {
        const token = await getToken();
        return schoolsApi.enableModule(id, moduleId, token);
      },
      disableModule: async (id: string, moduleId: string) => {
        const token = await getToken();
        return schoolsApi.disableModule(id, moduleId, token);
      },
    },
    schoolYears: {
      getCurrentWeek: async () => {
        const token = await getToken();
        return schoolYearsApi.getCurrentWeek(token);
      },
      getAll: async () => {
        const token = await getToken();
        return schoolYearsApi.getAll(token);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return schoolYearsApi.getById(id, token);
      },
      create: async (data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolYearsApi.create(data, token);
      },
      update: async (id: string, data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolYearsApi.update(id, data, token);
      },
      delete: async (id: string) => {
        const token = await getToken();
        return schoolYearsApi.delete(id, token);
      },
      setActive: async (id: string) => {
        const token = await getToken();
        return schoolYearsApi.setActive(id, token);
      },
    },
    schoolMonthlyAssignments: {
      getTemplates: async (schoolYearId: string) => {
        const token = await getToken();
        return schoolMonthlyAssignmentsApi.getTemplates(schoolYearId, token);
      },
      createTemplate: async (data: { name: string; quarter: string; schoolYearId: string }) => {
        const token = await getToken();
        return schoolMonthlyAssignmentsApi.createTemplate(data, token);
      },
      updateTemplate: async (templateId: string, data: { name: string }) => {
        const token = await getToken();
        return schoolMonthlyAssignmentsApi.updateTemplate(templateId, data, token);
      },
      deleteTemplate: async (templateId: string) => {
        const token = await getToken();
        return schoolMonthlyAssignmentsApi.deleteTemplate(templateId, token);
      },
      getGradePercentages: async (schoolYearId: string) => {
        const token = await getToken();
        return schoolMonthlyAssignmentsApi.getGradePercentages(schoolYearId, token);
      },
      updateGradePercentage: async (data: { schoolYearId: string; quarter: string; percentage: number }) => {
        const token = await getToken();
        return schoolMonthlyAssignmentsApi.updateGradePercentage(data, token);
      },
    },
    dailyGoals: {
      get: async (studentId: string, projectionId: string, quarter: string, week: number) => {
        const token = await getToken();
        return dailyGoalsApi.get(studentId, projectionId, quarter, week, token);
      },
      create: async (studentId: string, projectionId: string, data: {
        subject: string;
        quarter: string;
        week: number;
        dayOfWeek: number;
        text: string;
        isCompleted?: boolean;
        notes?: string;
        notesCompleted?: boolean;
      }) => {
        const token = await getToken();
        return dailyGoalsApi.create(studentId, projectionId, data, token);
      },
      update: async (studentId: string, projectionId: string, goalId: string, data: {
        subject?: string;
        quarter?: string;
        week?: number;
        dayOfWeek?: number;
        text?: string;
        isCompleted?: boolean;
        notes?: string;
        notesCompleted?: boolean;
      }) => {
        const token = await getToken();
        return dailyGoalsApi.update(studentId, projectionId, goalId, data, token);
      },
      updateCompletion: async (studentId: string, projectionId: string, goalId: string, isCompleted: boolean) => {
        const token = await getToken();
        return dailyGoalsApi.updateCompletion(studentId, projectionId, goalId, isCompleted, token);
      },
      updateNotes: async (studentId: string, projectionId: string, goalId: string, data: {
        notes?: string;
        notesCompleted?: boolean;
      }) => {
        const token = await getToken();
        return dailyGoalsApi.updateNotes(studentId, projectionId, goalId, data, token);
      },
      addNoteToHistory: async (studentId: string, projectionId: string, goalId: string, text: string) => {
        const token = await getToken();
        return dailyGoalsApi.addNoteToHistory(studentId, projectionId, goalId, text, token);
      },
      getNoteHistory: async (studentId: string, projectionId: string, goalId: string) => {
        const token = await getToken();
        return dailyGoalsApi.getNoteHistory(studentId, projectionId, goalId, token);
      },
      delete: async (studentId: string, projectionId: string, goalId: string) => {
        const token = await getToken();
        return dailyGoalsApi.delete(studentId, projectionId, goalId, token);
      },
    },
    monthlyAssignments: {
      get: async (studentId: string, projectionId: string) => {
        const token = await getToken();
        return monthlyAssignmentsApi.get(studentId, projectionId, token);
      },
      create: async (studentId: string, projectionId: string, data: {
        name: string;
        quarter: string;
      }) => {
        const token = await getToken();
        return monthlyAssignmentsApi.create(studentId, projectionId, data, token);
      },
      update: async (studentId: string, projectionId: string, assignmentId: string, data: {
        name: string;
      }) => {
        const token = await getToken();
        return monthlyAssignmentsApi.update(studentId, projectionId, assignmentId, data, token);
      },
      grade: async (studentId: string, projectionId: string, assignmentId: string, data: {
        grade: number;
        note?: string;
      }) => {
        const token = await getToken();
        return monthlyAssignmentsApi.grade(studentId, projectionId, assignmentId, data, token);
      },
      delete: async (studentId: string, projectionId: string, assignmentId: string) => {
        const token = await getToken();
        return monthlyAssignmentsApi.delete(studentId, projectionId, assignmentId, token);
      },
    },
    reportCards: {
      get: async (studentId: string, projectionId: string) => {
        const token = await getToken();
        return reportCardsApi.get(studentId, projectionId, token);
      },
    },
    // Users API
    getUsers: async () => {
      const token = await getToken();
      return usersApi.getUsers(token);
    },
    getAvailableRoles: async () => {
      const token = await getToken();
      return usersApi.getAvailableRoles(token);
    },
    createUser: async (userData: any) => {
      const token = await getToken();
      return usersApi.createUser(userData, token);
    },
    updateUser: async (userId: string, userData: any) => {
      const token = await getToken();
      return usersApi.updateUser(userId, userData, token);
    },
    updateMyProfile: async (userData: any) => {
      const token = await getToken();
      return usersApi.updateMyProfile(userData, token);
    },
    deactivateUser: async (userId: string) => {
      const token = await getToken();
      return usersApi.deactivateUser(userId, token);
    },
    reactivateUser: async (userId: string) => {
      const token = await getToken();
      return usersApi.reactivateUser(userId, token);
    },
    deleteUser: async (userId: string) => {
      const token = await getToken();
      return usersApi.deleteUser(userId, token);
    },
    groups: {
      getBySchoolYear: async (schoolYearId: string) => {
        const token = await getToken();
        return groupsApi.getBySchoolYear(schoolYearId, token);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return groupsApi.getById(id, token);
      },
      getGroupStudents: async (groupId: string) => {
        const token = await getToken();
        return groupsApi.getGroupStudents(groupId, token);
      },
      create: async (data: { teacherId: string; schoolYearId: string; name?: string | null; studentIds?: string[] }) => {
        const token = await getToken();
        return groupsApi.create(data, token);
      },
      addStudentsToGroup: async (groupId: string, studentIds: string[]) => {
        const token = await getToken();
        return groupsApi.addStudentsToGroup(groupId, studentIds, token);
      },
      removeStudentFromGroup: async (groupId: string, studentId: string) => {
        const token = await getToken();
        return groupsApi.removeStudentFromGroup(groupId, studentId, token);
      },
      delete: async (id: string) => {
        const token = await getToken();
        return groupsApi.delete(id, token);
      },
      getStudentsByTeacher: async (teacherId: string, schoolYearId: string) => {
        const token = await getToken();
        return groupsApi.getStudentsByTeacher(teacherId, schoolYearId, token);
      },
      getStudentAssignments: async (schoolYearId: string) => {
        const token = await getToken();
        return groupsApi.getStudentAssignments(schoolYearId, token);
      },
    },
  };
}

