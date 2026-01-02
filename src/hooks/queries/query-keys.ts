export const queryKeys = {
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.students.lists(), filters || {}] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },
  projections: {
    all: ['projections'] as const,
    lists: () => [...queryKeys.projections.all, 'list'] as const,
    list: (studentId?: string) => [...queryKeys.projections.lists(), studentId || 'all'] as const,
    details: () => [...queryKeys.projections.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projections.details(), id] as const,
  },
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (schoolYearId?: string) => [...queryKeys.groups.lists(), schoolYearId || 'all'] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
  },
  lectures: {
    all: ['lectures'] as const,
    list: () => [...queryKeys.lectures.all, 'list'] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    list: () => [...queryKeys.subjects.all, 'list'] as const,
  },
  schoolYears: {
    all: ['schoolYears'] as const,
    list: () => [...queryKeys.schoolYears.all, 'list'] as const,
  },
  certificationTypes: {
    all: ['certificationTypes'] as const,
    list: () => [...queryKeys.certificationTypes.all, 'list'] as const,
  },
  schools: {
    all: ['schools'] as const,
    lists: () => [...queryKeys.schools.all, 'list'] as const,
    list: () => [...queryKeys.schools.lists()] as const,
    details: () => [...queryKeys.schools.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.schools.details(), id] as const,
  },
  teachers: {
    all: ['teachers'] as const,
    lists: () => [...queryKeys.teachers.all, 'list'] as const,
    list: (schoolId?: string) => [...queryKeys.teachers.lists(), schoolId || 'all'] as const,
  },
  dailyGoals: {
    all: ['dailyGoals'] as const,
    detail: (studentId: string, projectionId: string, quarter: string, week: number) =>
      [...queryKeys.dailyGoals.all, studentId, projectionId, quarter, week] as const,
  },
  reportCards: {
    all: ['reportCards'] as const,
    lists: () => [...queryKeys.reportCards.all, 'list'] as const,
    list: (studentId?: string) => [...queryKeys.reportCards.lists(), studentId || 'all'] as const,
    details: () => [...queryKeys.reportCards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reportCards.details(), id] as const,
  },
}

