import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StudentsList } from "@/components/students-list"
import { StudentsTable } from "@/components/students-table"
import { StudentProfile } from "@/components/student-profile"
import { StudentsFilters } from "@/components/students-filters"
import { ViewToggle } from "@/components/view-toggle"
import { Input } from "@/components/ui/input"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Search, AlertCircle } from "lucide-react"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { useApi } from "@/services/api"
import type { Student } from "@/types/student"

interface Filters {
  certificationType: string
  graduationYear: string
  isLeveled: string
}

type SortField = "firstName" | "lastName" | null
type SortDirection = "asc" | "desc"

export default function StudentsPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
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

  // Get selected student from URL param
  const selectedStudent = React.useMemo(() => {
    if (!studentId || students.length === 0) return null
    return students.find(s => s.id === studentId) || null
  }, [studentId, students])

  // If we have a studentId but no students loaded yet, show loading
  const isLoadingStudent = studentId && students.length === 0

  // Fetch students from API (scoped to user's school)
  React.useEffect(() => {
    let isMounted = true

    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await api.students.getAll()

        if (isMounted) {
          // Backend returns students for the authenticated user's school only
          // Transform API data to match frontend Student type
          const transformedStudents: Student[] = data.map((student: any) => ({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            name: student.name, // Backend already provides the full name
            age: student.age,
            birthDate: student.birthDate,
            certificationType: student.certificationType,
            graduationDate: student.graduationDate,
            parents: student.parents || [],
            contactPhone: student.contactPhone || '',
            isLeveled: student.isLeveled,
            expectedLevel: student.expectedLevel,
            address: student.address || '',
          }))

          setStudents(transformedStudents)
        }
      } catch (err: any) {
        console.error('Error fetching students:', err)
        if (isMounted) {
          setError(err.message || 'Failed to load students')
          // Set empty array on error - don't use mock data in production
          setStudents([])
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
  }, [])

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
    navigate('/students')
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

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton variant="list" />
  }

  // Show loading state when navigating to a student profile
  if (isLoadingStudent) {
    return <LoadingSkeleton variant="profile" />
  }

  // Show student profile if we have a selected student
  if (selectedStudent) {
    return <StudentProfile student={selectedStudent} onBack={handleBackToList} />
  }

  // Show students list
  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Error Loading Students
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}. Please make sure you're connected to the API and try refreshing the page.
            </p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold">Estudiantes</h1>
        <p className="text-muted-foreground">
          Gestiona la información de todos los estudiantes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar estudiantes por nombre, certificación, teléfono o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
