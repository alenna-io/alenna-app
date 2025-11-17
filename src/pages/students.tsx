import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StudentsList } from "@/components/students-list"
import { StudentsTable } from "@/components/students-table"
import { StudentProfile } from "@/components/student-profile"
import { StudentsFilters } from "@/components/students-filters"
import { ViewToggle } from "@/components/view-toggle"
import { LoadingState } from "@/components/ui/loading-state"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Navigate } from "react-router-dom"
import { ParentChildrenView } from "@/components/parent-children-view"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { useApi } from "@/services/api"
import type { Student } from "@/types/student"
import { useUser } from "@/contexts/UserContext"
import { SearchBar } from "@/components/ui/search-bar"

interface Filters extends Record<string, string> {
  certificationType: string
  graduationYear: string
  isLeveled: string
}

type SortField = "firstName" | "lastName" | null
type SortDirection = "asc" | "desc"

export default function StudentsPage() {
  const { studentId, schoolId } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo } = useUser()
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
    isLeveled: ""
  })
  const [view, setView] = React.useState<"cards" | "table">("table")
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  const isParentOnly = hasRole('PARENT') && !hasRole('TEACHER') && !hasRole('ADMIN') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')
  const isStudentOnly = hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('ADMIN') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')

  if (isStudentOnly && !studentId) {
    return <Navigate to="/my-profile" replace />
  }

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

      return matchesSearch && matchesCertification && matchesGraduationYear && matchesLeveling
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

  // Check if user is a parent (only has PARENT role, no TEACHER/ADMIN)
  const parentOnly = isParentOnly

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  // Show loading state when fetching student profile
  if (isLoadingStudent) {
    return <LoadingState variant="profile" />
  }

  // Show error state for student profile
  if (studentError && studentId) {
    return (
      <div className="space-y-6">
        {/* Mobile back button */}
        <div className="md:hidden">
          <BackButton onClick={handleBackToList}>
            Volver a Estudiantes
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
    return <LoadingState variant="list" />
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
          <BackButton onClick={() => navigate('/configuration/school-info')}>
            Volver a Información de la Escuela
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
      <PageHeader
        title={schoolId ? "Estudiantes de la Escuela" : "Estudiantes"}
        description={schoolId ? "Gestiona los estudiantes de esta escuela específica" : "Gestiona la información de todos los estudiantes"}
      />

      {/* Search */}
      <SearchBar
        placeholder="Buscar estudiantes por nombre, certificación, teléfono o dirección..."
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
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Students Content */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || Object.values(filters).some(f => f !== "")
              ? "No se encontraron estudiantes que coincidan con los filtros"
              : "No hay estudiantes registrados"
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
    </div >
  )
}
