import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StudentsList } from "@/components/students-list"
import { StudentsTable } from "@/components/students-table"
import { StudentProfile } from "@/components/student-profile"
import { StudentsFilters } from "@/components/students-filters"
import { ViewToggle } from "@/components/view-toggle"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Navigate } from "react-router-dom"
import { ParentChildrenView } from "@/components/parent-children-view"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { useApi } from "@/services/api"
import type { Student } from "@/types/student"
import { useUser } from "@/contexts/UserContext"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StudentFormDialog } from "@/components/student-form-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

interface Filters extends Record<string, string> {
  certificationType: string
  graduationYear: string
  isLeveled: string
  groupId: string
}

type SortField = "firstName" | "lastName" | null
type SortDirection = "asc" | "desc"

export default function StudentsPage() {
  const { studentId, schoolId } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo } = useUser()
  const { hasModule } = useModuleAccess()
  const { t } = useTranslation()

  // Check if teachers module is enabled
  const hasTeachersModule = hasModule('teachers')
  const [students, setStudents] = React.useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingStudent, setIsLoadingStudent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [studentError, setStudentError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>({
    certificationType: "",
    graduationYear: "",
    isLeveled: "",
    groupId: ""
  })
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string | null; teacherName: string }>>([])
  const [view, setView] = React.useState<"cards" | "table">("table")
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isStudentDialogOpen, setIsStudentDialogOpen] = React.useState(false)
  const [school, setSchool] = React.useState<{ userLimit?: number; teacherLimit?: number } | null>(null)
  const [studentsCount, setStudentsCount] = React.useState<number>(0)
  const itemsPerPage = 10

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  const isSuperAdmin = hasRole('SUPERADMIN')
  const isParentOnly = hasRole('PARENT') && !hasRole('TEACHER') && !hasRole('ADMIN') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')
  const isStudentOnly = hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('ADMIN') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')

  // Redirect super admins - they should not access the students page
  React.useEffect(() => {
    if (isSuperAdmin && !studentId) {
      navigate('/users', { replace: true })
    }
  }, [isSuperAdmin, studentId, navigate])

  // Fetch school info and students count for school admins
  React.useEffect(() => {
    if (!isSchoolAdmin || studentId) return

    const fetchSchoolInfo = async () => {
      try {
        const targetSchoolId = schoolId || userInfo?.schoolId
        if (!targetSchoolId) return

        // Use /me endpoint for school admins to avoid permission issues
        let schoolData
        if (isSchoolAdmin && targetSchoolId === userInfo?.schoolId) {
          // School admins should use /me endpoint when accessing their own school
          schoolData = await api.schools.getMy()
        } else {
          schoolData = await api.schools.getById(targetSchoolId)
        }
        setSchool(schoolData)

        // Use the same schoolId logic for students count - school admins can access their own school
        const countData = await api.schools.getStudentsCount(targetSchoolId)
        setStudentsCount(countData.count)
      } catch (err) {
        console.error('Error fetching school info:', err)
      }
    }

    fetchSchoolInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSchoolAdmin, studentId, schoolId, userInfo?.schoolId])

  React.useEffect(() => {
    if (!userInfo || !isStudentOnly) return

    const ownId = userInfo.studentId
    if (!ownId) {
      setHasPermission(false)
      return
    }

    if (!studentId) {
      return
    }

    if (studentId !== ownId) {
      navigate('/my-profile', { replace: true })
    }
  }, [userInfo, isStudentOnly, studentId, navigate])

  // Fetch students list from API (scoped to user's school or specific school) - only when not viewing a specific student
  React.useEffect(() => {
    if (studentId) return
    if (isStudentOnly) {
      setStudents([])
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // If we have a schoolId from the route, fetch students for that specific school
        // Otherwise, fetch students for the current user's school
        const data = schoolId
          ? await api.schools.getStudents(schoolId)
          : await api.students.getAll()

        // Fetch groups for filtering (only for school admins)
        if (isSchoolAdmin && userInfo?.schoolId) {
          try {
            const schoolYears = await api.schoolYears.getAll()
            const activeYear = schoolYears.find((sy: { isActive: boolean }) => sy.isActive)
            if (activeYear) {
              const allGroups = await api.groups.getBySchoolYear(activeYear.id)

              // Fetch teachers only if teachers module is enabled
              let teachers: Array<{ id: string; fullName: string }> = []
              if (hasTeachersModule) {
                try {
                  teachers = await api.schools.getMyTeachers()
                } catch (teachersError) {
                  // Teachers module might not be enabled - continue without teacher names
                  console.warn('Could not fetch teachers:', teachersError)
                }
              }

              // Group by teacher and name to create unique groups
              const groupMap = new Map<string, { id: string; name: string | null; teacherName: string }>()
              allGroups.forEach((g: { id: string; teacherId: string; name: string | null; deletedAt: string | null }) => {
                if (!g.deletedAt) {
                  const teacher = teachers.find((t: { id: string }) => t.id === g.teacherId)
                  const groupKey = `${g.teacherId}-${g.name || 'default'}`
                  if (!groupMap.has(groupKey)) {
                    groupMap.set(groupKey, {
                      id: g.id, // Use first group ID as identifier
                      name: g.name,
                      teacherName: teacher?.fullName || t("groups.noTeacher") || 'Sin maestro' // Fallback if teacher not found
                    })
                  }
                }
              })
              if (isMounted) {
                setGroups(Array.from(groupMap.values()))
              }
            }
          } catch (err) {
            // Silently fail - groups filter is optional
            console.error('Error fetching groups:', err)
          }
        }

        if (isMounted) {
          // Transform API data to match frontend Student type
          const transformedStudents: Student[] = data.map((student: unknown) => {
            const s = student as Record<string, unknown>
            return {
              id: s.id as string,
              firstName: s.firstName as string,
              lastName: s.lastName as string,
              name: s.name as string,
              age: s.age as number,
              birthDate: s.birthDate as string,
              certificationType: s.certificationType as string,
              graduationDate: s.graduationDate as string,
              parents: (s.parents || []) as Student['parents'],
              contactPhone: (s.contactPhone || '') as string,
              isLeveled: s.isLeveled as boolean,
              expectedLevel: s.expectedLevel as string | undefined,
              address: (s.address || '') as string,
            }
          })

          setStudents(transformedStudents)
        }
      } catch (err) {
        const error = err as Error
        console.error('Error fetching students:', error)
        console.error('Error message:', error.message)
        if (isMounted) {
          // Check if it's a permission error (403)
          if (error.message?.includes('permiso') || error.message?.includes('403')) {
            console.log('Setting hasPermission to false')
            setHasPermission(false)
          } else {
            setError(error.message || 'Failed to load students')
            setStudents([])
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchStudents()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, schoolId, isStudentOnly])

  // Fetch individual student from API when viewing profile
  React.useEffect(() => {
    if (!studentId) {
      setSelectedStudent(null)
      return
    }

    let isMounted = true

    const fetchStudent = async () => {
      try {
        setIsLoadingStudent(true)
        setStudentError(null)
        const data = await api.students.getById(studentId)

        if (isMounted) {
          // Transform API data to match frontend Student type
          const s = data as Record<string, unknown>
          const transformedStudent: Student = {
            id: s.id as string,
            firstName: s.firstName as string,
            lastName: s.lastName as string,
            name: s.name as string,
            age: s.age as number,
            birthDate: s.birthDate as string,
            certificationType: s.certificationType as string,
            graduationDate: s.graduationDate as string,
            parents: (s.parents || []) as Student['parents'],
            contactPhone: (s.contactPhone || '') as string,
            isLeveled: s.isLeveled as boolean,
            expectedLevel: s.expectedLevel as string | undefined,
            address: (s.address || '') as string,
          }

          setSelectedStudent(transformedStudent)
        }
      } catch (err) {
        const error = err as Error
        console.error('Error fetching student:', error)
        if (isMounted) {
          // Check if it's a permission error (403) or not found error (404)
          if (error.message?.includes('permiso') || error.message?.includes('not found') || error.message?.includes('Student not found') || error.message?.includes('no encontrada') || error.message?.includes('no encontrado')) {
            setHasPermission(false)
          } else {
            setStudentError(error.message || 'Failed to load student')
            setSelectedStudent(null)
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingStudent(false)
        }
      }
    }

    fetchStudent()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  // Filter, search, and sort logic
  const filteredAndSortedStudents = React.useMemo(() => {
    // Filter students
    let result = students.filter((student) => {
      // Search filter (accent-insensitive)
      const matchesSearch =
        includesIgnoreAccents(student.name, searchTerm) ||
        includesIgnoreAccents(student.certificationType, searchTerm) ||
        student.contactPhone.includes(searchTerm) ||
        includesIgnoreAccents(student.address, searchTerm)

      // Certification type filter
      const matchesCertification =
        !filters.certificationType || student.certificationType === filters.certificationType

      // Graduation year filter
      const matchesGraduationYear =
        !filters.graduationYear ||
        new Date(student.graduationDate).getFullYear().toString() === filters.graduationYear

      // Leveling status filter
      const matchesLeveling =
        !filters.isLeveled ||
        (filters.isLeveled === "true" && student.isLeveled) ||
        (filters.isLeveled === "false" && !student.isLeveled)

      // Group filter - this will be handled by fetching students from the group
      // For now, return true and we'll handle group filtering separately
      const matchesGroup = !filters.groupId

      return matchesSearch && matchesCertification && matchesGraduationYear && matchesLeveling && matchesGroup
    })

    // Sort students
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField].toLowerCase()
        const bValue = b[sortField].toLowerCase()

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    return result
  }, [students, searchTerm, filters, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage)
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedStudents.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedStudents, currentPage, itemsPerPage])

  // Reset to page 1 when filters/search/sort changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, sortField, sortDirection])

  // Fetch students from group when group filter is selected
  React.useEffect(() => {
    if (!filters.groupId || !userInfo?.schoolId || studentId) {
      // If no group filter or viewing a student, refetch all students
      if (!filters.groupId && !studentId && !isStudentOnly) {
        const fetchAllStudents = async () => {
          try {
            setIsLoading(true)
            const data = schoolId
              ? await api.schools.getStudents(schoolId)
              : await api.students.getAll()

            const transformedStudents: Student[] = data.map((student: unknown) => {
              const s = student as Record<string, unknown>
              return {
                id: s.id as string,
                firstName: s.firstName as string,
                lastName: s.lastName as string,
                name: s.name as string,
                age: s.age as number,
                birthDate: s.birthDate as string,
                certificationType: s.certificationType as string,
                graduationDate: s.graduationDate as string,
                parents: (s.parents || []) as Student['parents'],
                contactPhone: (s.contactPhone || '') as string,
                isLeveled: s.isLeveled as boolean,
                expectedLevel: s.expectedLevel as string | undefined,
                address: (s.address || '') as string,
              }
            })
            setStudents(transformedStudents)
          } catch (err) {
            console.error('Error fetching all students:', err)
          } finally {
            setIsLoading(false)
          }
        }
        fetchAllStudents()
      }
      return
    }

    let isMounted = true

    const fetchStudentsByGroup = async () => {
      try {
        setIsLoading(true)

        // Find the group to get teacherId and schoolYearId
        const schoolYears = await api.schoolYears.getAll()
        const activeYear = schoolYears.find((sy: { isActive: boolean }) => sy.isActive)
        if (!activeYear) return

        const allGroups = await api.groups.getBySchoolYear(activeYear.id)
        const group = allGroups.find((g: { id: string; deletedAt: string | null }) =>
          g.id === filters.groupId && !g.deletedAt
        )

        if (!group) return

        // Get all groups with the same teacher, schoolYear, and name
        const sameGroups = allGroups.filter((g: { teacherId: string; schoolYearId: string; name: string | null; deletedAt: string | null }) =>
          !g.deletedAt &&
          g.teacherId === group.teacherId &&
          g.schoolYearId === group.schoolYearId &&
          (group.name ? g.name === group.name : !g.name)
        )

        // Fetch students for this group
        const allStudents = await api.students.getAll()
        const studentIds = sameGroups.map((g: { studentId: string }) => g.studentId)
        const groupStudents = allStudents.filter((s: { id: string }) => studentIds.includes(s.id))

        if (isMounted) {
          const transformedStudents: Student[] = groupStudents.map((student: unknown) => {
            const s = student as Record<string, unknown>
            return {
              id: s.id as string,
              firstName: s.firstName as string,
              lastName: s.lastName as string,
              name: s.name as string,
              age: s.age as number,
              birthDate: s.birthDate as string,
              certificationType: s.certificationType as string,
              graduationDate: s.graduationDate as string,
              parents: (s.parents || []) as Student['parents'],
              contactPhone: (s.contactPhone || '') as string,
              isLeveled: s.isLeveled as boolean,
              expectedLevel: s.expectedLevel as string | undefined,
              address: (s.address || '') as string,
            }
          })
          setStudents(transformedStudents)
        }
      } catch (err) {
        console.error('Error fetching students by group:', err)
        if (isMounted) {
          setError((err as Error).message || 'Failed to load students')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchStudentsByGroup()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.groupId, userInfo?.schoolId, studentId, schoolId, isStudentOnly])

  const handleStudentSelect = (student: Student) => {
    navigate(`/students/${student.id}`)
  }

  const handleBackToList = () => {
    if (schoolId) {
      navigate(`/schools/${schoolId}/students`)
    } else {
      navigate('/students')
    }
  }

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleCreateStudent = async (data: {
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    contactPhone?: string
    isLeveled?: boolean
    expectedLevel?: string
    currentLevel?: string
    address?: string
    parents: Array<{
      firstName: string
      lastName: string
      email: string
      relationship: string
    }>
  }) => {
    const targetSchoolId = schoolId || userInfo?.schoolId
    if (!targetSchoolId) {
      throw new Error("No se pudo determinar la escuela")
    }
    await api.students.create({ ...data, schoolId: targetSchoolId })
    // Reload students and count
    const studentsData = schoolId
      ? await api.schools.getStudents(targetSchoolId)
      : await api.students.getAll()
    const transformedStudents: Student[] = studentsData.map((student: unknown) => {
      const s = student as Record<string, unknown>
      return {
        id: s.id as string,
        firstName: s.firstName as string,
        lastName: s.lastName as string,
        name: s.name as string,
        age: s.age as number,
        birthDate: s.birthDate as string,
        certificationType: s.certificationType as string,
        graduationDate: s.graduationDate as string,
        parents: (s.parents || []) as Student['parents'],
        contactPhone: (s.contactPhone || '') as string,
        isLeveled: s.isLeveled as boolean,
        expectedLevel: s.expectedLevel as string | undefined,
        address: (s.address || '') as string,
      }
    })
    setStudents(transformedStudents)
    const countData = await api.schools.getStudentsCount(targetSchoolId)
    setStudentsCount(countData.count)
  }

  // Check if user is a parent (only has PARENT role, no TEACHER/ADMIN)
  const parentOnly = isParentOnly

  // Early returns after all hooks
  // Redirect super admins - they should not access the students page
  if (isSuperAdmin && !studentId) {
    return <Navigate to="/users" replace />
  }

  if (isStudentOnly && !studentId) {
    return <Navigate to="/my-profile" replace />
  }

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  // Show loading state when fetching student profile
  if (isLoadingStudent) {
    return <Loading variant="profile" />
  }

  // Show error state for student profile
  if (studentError && studentId) {
    return (
      <div className="space-y-6">
        {/* Mobile back button */}
        <div className="md:hidden">
          <BackButton onClick={handleBackToList}>
            {t("students.backToStudents")}
          </BackButton>
        </div>
        <ErrorAlert
          title="Error al cargar estudiante"
          message={studentError}
        />
      </div>
    )
  }

  if (isStudentOnly && selectedStudent) {
    navigate('/my-profile', { replace: true })
    return null
  }

  // Show student profile if we have a selected student
  if (selectedStudent) {
    return <StudentProfile student={selectedStudent} onBack={handleBackToList} isParentView={parentOnly} />
  }

  // Show loading state for students list
  if (isLoading) {
    return <Loading variant="table" />
  }

  // Show parent-specific view
  if (parentOnly && !studentId) {
    return (
      <div className="space-y-6">
        {error && (
          <ErrorAlert
            title="Error al cargar"
            message={error}
          />
        )}
        <ParentChildrenView students={students} />
      </div>
    )
  }

  // Show admin/teacher students list
  return (
    <div className="space-y-6">
      {/* Mobile back button for school context */}
      {schoolId && (
        <div className="md:hidden">
          <BackButton onClick={() => navigate('/school-settings/school-info')}>
            {t("students.backToSchoolInfo")}
          </BackButton>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <ErrorAlert
          title="Error al cargar"
          message={error}
        />
      )}
      <div className="flex items-center justify-between">
        <PageHeader
          title={schoolId ? t("students.titleForSchool") : t("students.title")}
          description={schoolId ? t("students.descriptionForSchool") : t("students.description")}
        />
        {isSchoolAdmin && (schoolId || userInfo?.schoolId) && (
          <Button onClick={() => navigate('/students/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t("students.addStudent")}
          </Button>
        )}
      </div>

      {/* Count and Limit Display for School Admins */}
      {isSchoolAdmin && school && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("students.registered")}</p>
                <p className="text-2xl font-bold text-blue-600">{studentsCount}</p>
              </div>
              {school.userLimit && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t("students.limit")}</p>
                  <p className="text-2xl font-bold">{school.userLimit}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.max(0, school.userLimit - studentsCount)} {t("students.available")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <SearchBar
        placeholder={t("students.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <StudentsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalStudents={students.length}
          filteredCount={filteredAndSortedStudents.length}
          groups={groups}
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Students Content */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || Object.values(filters).some(f => f !== "")
              ? t("students.noResults")
              : t("students.noStudents")
            }
          </p>
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <StudentsList
              students={paginatedStudents}
              onStudentSelect={handleStudentSelect}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedStudents.length}
              onPageChange={setCurrentPage}
            />
          ) : (
            <StudentsTable
              students={paginatedStudents}
              onStudentSelect={handleStudentSelect}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedStudents.length}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )
      }

      {/* Student Form Dialog */}
      {isSchoolAdmin && (schoolId || userInfo?.schoolId) && (
        <StudentFormDialog
          open={isStudentDialogOpen}
          onOpenChange={(open) => {
            setIsStudentDialogOpen(open)
          }}
          schoolId={schoolId || userInfo?.schoolId || ''}
          onSave={handleCreateStudent}
        />
      )}
    </div >
  )
}
