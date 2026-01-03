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

  if (response.status === 304) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    // If it's a validation error with errors array (ZodError format from backend)
    if (error.error && Array.isArray(error.error)) {
      const errorMessage = JSON.stringify({ error: 'Validation error', issues: error.error });
      throw new Error(errorMessage);
    }
    // If it's a validation error with issues array (alternative format)
    if (error.issues && Array.isArray(error.issues)) {
      const errorMessage = JSON.stringify({ error: error.error || 'Validation error', issues: error.issues });
      throw new Error(errorMessage);
    }
    // If error.error is a string, use it directly
    if (typeof error.error === 'string') {
      throw new Error(error.error);
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
  deactivate: (id: string, token: string | null) =>
    apiFetch(`/students/${id}/deactivate`, token, { method: 'POST' }),
  reactivate: (id: string, token: string | null) =>
    apiFetch(`/students/${id}/reactivate`, token, { method: 'POST' }),
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
  create: (data: { name: string; categoryId: string; levelId: string; startPace: number; endPace: number }, token: string | null) =>
    apiFetch('/sub-subjects', token, { method: 'POST', body: JSON.stringify(data) }),
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
  isClosed?: boolean;
  closedAt?: string;
  closedBy?: string;
  status?: 'open' | 'gracePeriod' | 'closed';
  canClose?: boolean;
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
  previewWeeks: (data: Record<string, unknown>, token: string | null) => apiFetch('/school-years/preview-weeks', token, { method: 'POST', body: JSON.stringify(data) }),
};

export const quartersApi = {
  close: (id: string, token: string | null) => apiFetch(`/quarters/${id}/close`, token, { method: 'POST' }),
  getStatus: (schoolYearId: string, token: string | null) => apiFetch(`/quarters/status?schoolYearId=${schoolYearId}`, token),
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
  schoolLogoUrl?: string;
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
  getParents: (id: string, token: string | null) => apiFetch(`/schools/${id}/parents`, token),
  getCertificationTypes: (id: string, token: string | null) => apiFetch(`/schools/${id}/certification-types`, token),
  createCertificationType: (id: string, data: { name: string; description?: string; isActive?: boolean }, token: string | null) =>
    apiFetch(`/schools/${id}/certification-types`, token, { method: 'POST', body: JSON.stringify(data) }),
  getAllModules: (token: string | null) => apiFetch('/schools/modules/all', token),
  getSchoolModules: (id: string, token: string | null) => apiFetch(`/schools/${id}/modules`, token),
  enableModule: (id: string, moduleId: string, token: string | null) =>
    apiFetch(`/schools/${id}/modules/enable`, token, { method: 'POST', body: JSON.stringify({ moduleId }) }),
  disableModule: (id: string, moduleId: string, token: string | null) =>
    apiFetch(`/schools/${id}/modules/disable`, token, { method: 'POST', body: JSON.stringify({ moduleId }) }),
};

// Billing API
export const billingApi = {
  getAggregatedFinancials: (token: string | null, filters?: {
    startDate?: string;
    endDate?: string;
    billingMonth?: number;
    billingYear?: number;
    paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid';
    studentId?: string;
    schoolYearId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.billingMonth) params.append('billingMonth', filters.billingMonth.toString());
      if (filters.billingYear) params.append('billingYear', filters.billingYear.toString());
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.schoolYearId) params.append('schoolYearId', filters.schoolYearId);
    }
    const query = params.toString();
    return apiFetch(`/billing/aggregated-financials${query ? '?' + query : ''}`, token);
  },
  getRecords: (token: string | null, filters?: {
    startDate?: string;
    endDate?: string;
    billingMonth?: number;
    billingYear?: number;
    paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid';
    studentId?: string;
    studentName?: string;
    schoolYearId?: string;
    offset?: number;
    limit?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.billingMonth) params.append('billingMonth', filters.billingMonth.toString());
      if (filters.billingYear) params.append('billingYear', filters.billingYear.toString());
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.studentName) params.append('studentName', filters.studentName);
      if (filters.schoolYearId) params.append('schoolYearId', filters.schoolYearId);
      if (filters.offset !== undefined) params.append('offset', filters.offset.toString());
      if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
      if (filters.sortField) params.append('sortField', filters.sortField);
      if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    }
    const query = params.toString();
    return apiFetch(`/billing/records${query ? '?' + query : ''}`, token);
  },
  getAll: (token: string | null, filters?: {
    studentId?: string;
    schoolYearId?: string;
    billingMonth?: number;
    billingYear?: number;
    taxableBillStatus?: 'not_required' | 'required' | 'sent';
    paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid';
    billStatus?: 'required' | 'sent' | 'not_required' | 'cancelled'; // backward compatibility
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.schoolYearId) params.append('schoolYearId', filters.schoolYearId);
      if (filters.billingMonth) params.append('billingMonth', filters.billingMonth.toString());
      if (filters.billingYear) params.append('billingYear', filters.billingYear.toString());
      if (filters.taxableBillStatus) params.append('taxableBillStatus', filters.taxableBillStatus);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.billStatus) params.append('billStatus', filters.billStatus); // backward compatibility
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }
    const query = params.toString();
    return apiFetch(`/billing${query ? '?' + query : ''}`, token);
  },
  getById: (id: string, token: string | null) => apiFetch(`/billing/${id}`, token),
  create: (data: {
    studentId: string;
    schoolYearId: string;
    billingMonth: number;
    billingYear: number;
    baseAmount?: number;
  }, token: string | null) =>
    apiFetch('/billing', token, { method: 'POST', body: JSON.stringify(data) }),
  bulkCreate: (data: {
    schoolYearId: string;
    billingMonth: number;
    billingYear: number;
    studentIds?: string[];
  }, token: string | null) =>
    apiFetch('/billing/bulk', token, { method: 'POST', body: JSON.stringify(data) }),
  bulkUpdate: (data: {
    schoolYearId: string;
    billingMonth: number;
    billingYear: number;
  }, token: string | null) =>
    apiFetch('/billing/bulk-update', token, { method: 'PUT', body: JSON.stringify(data) }),
  update: (id: string, data: {
    taxableBillStatus?: 'not_required' | 'required' | 'sent';
    billStatus?: 'required' | 'sent' | 'not_required' | 'cancelled'; // backward compatibility
    effectiveTuitionAmount?: number;
    discountAdjustments?: Array<{ type: 'percentage' | 'fixed'; value: number; description?: string }>;
    extraCharges?: Array<{ amount: number; description?: string }>;
    paymentNote?: string;
  }, token: string | null) =>
    apiFetch(`/billing/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  recordPayment: (id: string, data: {
    paymentMethod: 'manual' | 'online' | 'other';
    paymentNote?: string;
  }, token: string | null) =>
    apiFetch(`/billing/${id}/record-payment`, token, { method: 'POST', body: JSON.stringify(data) }),
  recordPartialPayment: (id: string, data: {
    amount: number;
    paymentMethod: 'manual' | 'online' | 'other';
    paymentNote?: string;
  }, token: string | null) =>
    apiFetch(`/billing/${id}/record-partial-payment`, token, { method: 'POST', body: JSON.stringify(data) }),
  applyLateFee: (id: string, token: string | null, data?: {
    lateFeeAmount?: number;
  }) =>
    apiFetch(`/billing/${id}/apply-late-fee`, token, { method: 'POST', body: JSON.stringify(data || {}) }),
  bulkApplyLateFee: (token: string | null, data?: {
    billingRecordIds?: string[];
    dueDate?: string;
  }) =>
    apiFetch('/billing/bulk-apply-late-fee', token, { method: 'POST', body: JSON.stringify(data || {}) }),
  getTuitionConfig: (token: string | null) => apiFetch('/billing/tuition-config', token),
  createTuitionConfig: (data: {
    dueDay?: number;
  }, token: string | null) =>
    apiFetch('/billing/tuition-config', token, { method: 'POST', body: JSON.stringify(data) }),
  updateTuitionConfig: (id: string, data: {
    dueDay?: number;
  }, token: string | null) =>
    apiFetch(`/billing/tuition-config/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  getTuitionTypes: (token: string | null) => apiFetch('/billing/tuition-types', token),
  getTuitionTypeById: (id: string, token: string | null) => apiFetch(`/billing/tuition-types/${id}`, token),
  createTuitionType: (data: {
    name: string;
    baseAmount: number;
    currency?: string;
    lateFeeType: 'fixed' | 'percentage';
    lateFeeValue: number;
    displayOrder?: number;
  }, token: string | null) =>
    apiFetch('/billing/tuition-types', token, { method: 'POST', body: JSON.stringify(data) }),
  updateTuitionType: (id: string, data: {
    name?: string;
    baseAmount?: number;
    currency?: string;
    lateFeeType?: 'fixed' | 'percentage';
    lateFeeValue?: number;
    displayOrder?: number;
  }, token: string | null) =>
    apiFetch(`/billing/tuition-types/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTuitionType: (id: string, token: string | null) =>
    apiFetch(`/billing/tuition-types/${id}`, token, { method: 'DELETE' }),
  getStudentsWithBillingConfig: (params: {
    search?: string;
    tuitionTypeId?: string;
    hasScholarship?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }, token: string | null) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.tuitionTypeId && params.tuitionTypeId !== 'all') query.append('tuitionTypeId', params.tuitionTypeId);
    if (params.hasScholarship && params.hasScholarship !== 'all') query.append('hasScholarship', params.hasScholarship);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortDirection) query.append('sortDirection', params.sortDirection);
    if (params.offset !== undefined) query.append('offset', params.offset.toString());
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return apiFetch(`/billing/students/config${queryString ? '?' + queryString : ''}`, token);
  },
  getStudentScholarship: (studentId: string, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/scholarship`, token),
  createStudentScholarship: (studentId: string, data: {
    tuitionTypeId?: string;
    scholarshipType?: 'percentage' | 'fixed';
    scholarshipValue?: number;
    taxableBillRequired?: boolean;
  }, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/scholarship`, token, { method: 'POST', body: JSON.stringify(data) }),
  updateStudentScholarship: (studentId: string, data: {
    tuitionTypeId?: string;
    scholarshipType?: 'percentage' | 'fixed';
    scholarshipValue?: number;
    taxableBillRequired?: boolean;
  }, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/scholarship`, token, { method: 'PUT', body: JSON.stringify(data) }),
  getRecurringCharges: (studentId: string, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/recurring-charges`, token),
  createRecurringCharge: (studentId: string, data: {
    description: string;
    amount: number;
    expiresAt: string;
  }, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/recurring-charges`, token, { method: 'POST', body: JSON.stringify(data) }),
  updateRecurringCharge: (studentId: string, id: string, data: {
    description?: string;
    amount?: number;
    expiresAt?: string;
  }, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/recurring-charges/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecurringCharge: (studentId: string, id: string, token: string | null) =>
    apiFetch(`/billing/students/${studentId}/recurring-charges/${id}`, token, { method: 'DELETE' }),
  getMetrics: (token: string | null, filters?: {
    startDate?: string;
    endDate?: string;
    schoolYearId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.schoolYearId) params.append('schoolYearId', filters.schoolYearId);
    const query = params.toString();
    return apiFetch(`/billing/metrics${query ? '?' + query : ''}`, token);
  },
  getDashboard: (filters: {
    startDate: string;
    endDate: string;
    schoolYearId?: string;
    includeAll?: boolean;
  }, token: string | null) => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.schoolYearId) params.append('schoolYearId', filters.schoolYearId);
    if (filters.includeAll) params.append('includeAll', filters.includeAll.toString());
    return apiFetch(`/billing/dashboard?${params}`, token);
  },
};

// Character Traits API
export const characterTraitsApi = {
  getAll: (schoolYearId?: string, token?: string | null) => {
    const params = new URLSearchParams();
    if (schoolYearId) params.append('schoolYearId', schoolYearId);
    const query = params.toString();
    return apiFetch(`/schools/me/character-traits${query ? '?' + query : ''}`, token || null);
  },
  getById: (id: string, token: string | null) =>
    apiFetch(`/schools/me/character-traits/${id}`, token),
  getByMonth: (schoolYearId: string, month: number, token: string | null) => {
    const params = new URLSearchParams();
    params.append('schoolYearId', schoolYearId);
    params.append('month', month.toString());
    return apiFetch(`/schools/me/character-traits/by-month?${params}`, token);
  },
  create: (data: {
    schoolYearId: string;
    month: number;
    characterTrait: string;
    verseText: string;
    verseReference: string;
  }, token: string | null) =>
    apiFetch('/schools/me/character-traits', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: {
    schoolYearId?: string;
    month?: number;
    characterTrait?: string;
    verseText?: string;
    verseReference?: string;
  }, token: string | null) =>
    apiFetch(`/schools/me/character-traits/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, token: string | null) =>
    apiFetch(`/schools/me/character-traits/${id}`, token, { method: 'DELETE' }),
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
      deactivate: async (id: string) => {
        const token = await getToken();
        return studentsApi.deactivate(id, token);
      },
      reactivate: async (id: string) => {
        const token = await getToken();
        return studentsApi.reactivate(id, token);
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
      create: async (data: { name: string; categoryId: string; levelId: string; startPace: number; endPace: number }) => {
        const token = await getToken();
        return subSubjectsApi.create(data, token);
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
      getParents: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getParents(id, token);
      },
      getCertificationTypes: async (id: string) => {
        const token = await getToken();
        return schoolsApi.getCertificationTypes(id, token);
      },
      createCertificationType: async (id: string, data: { name: string; description?: string; isActive?: boolean }) => {
        const token = await getToken();
        return schoolsApi.createCertificationType(id, data, token);
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
      previewWeeks: async (data: Record<string, unknown>) => {
        const token = await getToken();
        return schoolYearsApi.previewWeeks(data, token);
      },
    },
    quarters: {
      close: async (id: string) => {
        const token = await getToken();
        return quartersApi.close(id, token);
      },
      getStatus: async (schoolYearId: string) => {
        const token = await getToken();
        return quartersApi.getStatus(schoolYearId, token);
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
    createUser: async (userData: Record<string, unknown>) => {
      const token = await getToken();
      return usersApi.createUser(userData, token);
    },
    updateUser: async (userId: string, userData: Record<string, unknown>) => {
      const token = await getToken();
      return usersApi.updateUser(userId, userData, token);
    },
    updateMyProfile: async (userData: Record<string, unknown>) => {
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
    billing: {
      getAll: async (filters?: {
        studentId?: string;
        schoolYearId?: string;
        billingMonth?: number;
        billingYear?: number;
        taxableBillStatus?: 'not_required' | 'required' | 'sent';
        paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid';
        billStatus?: 'required' | 'sent' | 'not_required' | 'cancelled'; // backward compatibility
        startDate?: string;
        endDate?: string;
      }) => {
        const token = await getToken();
        return billingApi.getAll(token, filters);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return billingApi.getById(id, token);
      },
      create: async (data: {
        studentId: string;
        schoolYearId: string;
        billingMonth: number;
        billingYear: number;
        baseAmount?: number;
      }) => {
        const token = await getToken();
        return billingApi.create(data, token);
      },
      bulkCreate: async (data: {
        schoolYearId: string;
        billingMonth: number;
        billingYear: number;
        studentIds?: string[];
      }) => {
        const token = await getToken();
        return billingApi.bulkCreate(data, token);
      },
      bulkUpdate: async (data: {
        schoolYearId: string;
        billingMonth: number;
        billingYear: number;
      }) => {
        const token = await getToken();
        return billingApi.bulkUpdate(data, token);
      },
      update: async (id: string, data: {
        taxableBillStatus?: 'not_required' | 'required' | 'sent';
        billStatus?: 'required' | 'sent' | 'not_required' | 'cancelled'; // backward compatibility
        effectiveTuitionAmount?: number;
        discountAdjustments?: Array<{ type: 'percentage' | 'fixed'; value: number; description?: string }>;
        extraCharges?: Array<{ amount: number; description?: string }>;
        paymentNote?: string;
      }) => {
        const token = await getToken();
        return billingApi.update(id, data, token);
      },
      recordPayment: async (id: string, data: {
        paymentMethod: 'manual' | 'online' | 'other';
        paymentNote?: string;
      }) => {
        const token = await getToken();
        return billingApi.recordPayment(id, data, token);
      },
      recordPartialPayment: async (id: string, data: {
        amount: number;
        paymentMethod: 'manual' | 'online' | 'other';
        paymentNote?: string;
      }) => {
        const token = await getToken();
        return billingApi.recordPartialPayment(id, data, token);
      },
      applyLateFee: async (id: string, data?: { lateFeeAmount?: number }) => {
        const token = await getToken();
        return billingApi.applyLateFee(id, token, data);
      },
      bulkApplyLateFee: async (data?: {
        billingRecordIds?: string[];
        dueDate?: string;
      }) => {
        const token = await getToken();
        return billingApi.bulkApplyLateFee(token, data);
      },
      getTuitionConfig: async () => {
        const token = await getToken();
        return billingApi.getTuitionConfig(token);
      },
      createTuitionConfig: async (data: {
        dueDay?: number;
      }) => {
        const token = await getToken();
        return billingApi.createTuitionConfig(data, token);
      },
      updateTuitionConfig: async (id: string, data: {
        dueDay?: number;
      }) => {
        const token = await getToken();
        return billingApi.updateTuitionConfig(id, data, token);
      },
      getTuitionTypes: async () => {
        const token = await getToken();
        return billingApi.getTuitionTypes(token);
      },
      getTuitionTypeById: async (id: string) => {
        const token = await getToken();
        return billingApi.getTuitionTypeById(id, token);
      },
      createTuitionType: async (data: {
        name: string;
        baseAmount: number;
        currency?: string;
        lateFeeType: 'fixed' | 'percentage';
        lateFeeValue: number;
        displayOrder?: number;
      }) => {
        const token = await getToken();
        return billingApi.createTuitionType(data, token);
      },
      updateTuitionType: async (id: string, data: {
        name?: string;
        baseAmount?: number;
        currency?: string;
        lateFeeType?: 'fixed' | 'percentage';
        lateFeeValue?: number;
        displayOrder?: number;
      }) => {
        const token = await getToken();
        return billingApi.updateTuitionType(id, data, token);
      },
      deleteTuitionType: async (id: string) => {
        const token = await getToken();
        return billingApi.deleteTuitionType(id, token);
      },
      getStudentsWithBillingConfig: async (params: {
        search?: string;
        tuitionTypeId?: string;
        hasScholarship?: string;
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
        offset?: number;
        limit?: number;
      }) => {
        const token = await getToken();
        return billingApi.getStudentsWithBillingConfig(params, token);
      },
      getStudentScholarship: async (studentId: string) => {
        const token = await getToken();
        try {
          return await billingApi.getStudentScholarship(studentId, token);
        } catch (error) {
          // 404 is expected when a student doesn't have a scholarship
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            return null;
          }
          throw error;
        }
      },
      createStudentScholarship: async (studentId: string, data: {
        tuitionTypeId?: string;
        scholarshipType?: 'percentage' | 'fixed';
        scholarshipValue?: number;
        taxableBillRequired?: boolean;
      }) => {
        const token = await getToken();
        return billingApi.createStudentScholarship(studentId, data, token);
      },
      updateStudentScholarship: async (studentId: string, data: {
        tuitionTypeId?: string;
        scholarshipType?: 'percentage' | 'fixed';
        scholarshipValue?: number;
        taxableBillRequired?: boolean;
      }) => {
        const token = await getToken();
        return billingApi.updateStudentScholarship(studentId, data, token);
      },
      getRecurringCharges: async (studentId: string) => {
        const token = await getToken();
        return billingApi.getRecurringCharges(studentId, token);
      },
      createRecurringCharge: async (studentId: string, data: {
        description: string;
        amount: number;
        expiresAt: string;
      }) => {
        const token = await getToken();
        return billingApi.createRecurringCharge(studentId, data, token);
      },
      updateRecurringCharge: async (studentId: string, id: string, data: {
        description?: string;
        amount?: number;
        expiresAt?: string;
      }) => {
        const token = await getToken();
        return billingApi.updateRecurringCharge(studentId, id, data, token);
      },
      deleteRecurringCharge: async (studentId: string, id: string) => {
        const token = await getToken();
        return billingApi.deleteRecurringCharge(studentId, id, token);
      },
      getAggregatedFinancials: async (filters?: {
        startDate?: string;
        endDate?: string;
        billingMonth?: number;
        billingYear?: number;
        paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid';
        studentId?: string;
        schoolYearId?: string;
      }) => {
        const token = await getToken();
        return billingApi.getAggregatedFinancials(token, filters);
      },
      getRecords: async (filters?: {
        startDate?: string;
        endDate?: string;
        billingMonth?: number;
        billingYear?: number;
        paymentStatus?: 'pending' | 'delayed' | 'partial_payment' | 'paid';
        studentId?: string;
        studentName?: string;
        schoolYearId?: string;
        offset?: number;
        limit?: number;
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
      }) => {
        const token = await getToken();
        return billingApi.getRecords(token, filters);
      },
      getMetrics: async (filters?: {
        startDate?: string;
        endDate?: string;
        schoolYearId?: string;
      }) => {
        const token = await getToken();
        return billingApi.getMetrics(token, filters);
      },
      getDashboard: async (filters: {
        startDate: string;
        endDate: string;
        schoolYearId?: string;
        includeAll?: boolean;
      }) => {
        const token = await getToken();
        return billingApi.getDashboard(filters, token);
      },
    },
    characterTraits: {
      getAll: async (schoolYearId?: string) => {
        const token = await getToken();
        return characterTraitsApi.getAll(schoolYearId, token);
      },
      getById: async (id: string) => {
        const token = await getToken();
        return characterTraitsApi.getById(id, token);
      },
      getByMonth: async (schoolYearId: string, month: number) => {
        const token = await getToken();
        return characterTraitsApi.getByMonth(schoolYearId, month, token);
      },
      create: async (data: {
        schoolYearId: string;
        month: number;
        characterTrait: string;
        verseText: string;
        verseReference: string;
      }) => {
        const token = await getToken();
        return characterTraitsApi.create(data, token);
      },
      update: async (id: string, data: {
        schoolYearId?: string;
        month?: number;
        characterTrait?: string;
        verseText?: string;
        verseReference?: string;
      }) => {
        const token = await getToken();
        return characterTraitsApi.update(id, data, token);
      },
      delete: async (id: string) => {
        const token = await getToken();
        return characterTraitsApi.delete(id, token);
      },
    },
  };
}

