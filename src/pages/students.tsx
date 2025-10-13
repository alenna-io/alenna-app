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

// Mock data - simulating API fetch
const mockStudents: Student[] = [
  {
    id: "1",
    firstName: "María",
    lastName: "González López",
    name: "María González López",
    age: 15,
    birthDate: "2009-03-15",
    certificationType: "INEA",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p1", name: "Carlos González" },
      { id: "p2", name: "Ana López" }
    ],
    contactPhone: "+52 555 123 4567",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Calle Principal 123, Colonia Centro, Ciudad de México"
  },
  {
    id: "2",
    firstName: "José Antonio",
    lastName: "Rodríguez",
    name: "José Antonio Rodríguez",
    age: 14,
    birthDate: "2010-07-22",
    certificationType: "Grace Christian",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p3", name: "María Rodríguez" }
    ],
    contactPhone: "+52 555 987 6543",
    isLeveled: false,
    address: "Av. Libertad 456, Colonia Norte, Guadalajara"
  },
  {
    id: "3",
    firstName: "Sofía",
    lastName: "Hernández Martínez",
    name: "Sofía Hernández Martínez",
    age: 16,
    birthDate: "2008-11-08",
    certificationType: "Home Life",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p4", name: "Roberto Hernández" },
      { id: "p5", name: "Carmen Martínez" }
    ],
    contactPhone: "+52 555 456 7890",
    isLeveled: true,
    expectedLevel: "Preparatoria",
    address: "Calle Reforma 789, Colonia Sur, Monterrey"
  },
  {
    id: "4",
    firstName: "Diego Fernando",
    lastName: "Silva",
    name: "Diego Fernando Silva",
    age: 13,
    birthDate: "2011-01-30",
    certificationType: "Lighthouse",
    graduationDate: "2026-06-15",
    parents: [
      { id: "p6", name: "Patricia Silva" }
    ],
    contactPhone: "+52 555 321 0987",
    isLeveled: true,
    expectedLevel: "Primaria",
    address: "Blvd. Universidad 321, Colonia Este, Puebla"
  },
  {
    id: "5",
    firstName: "Valentina",
    lastName: "Cruz Morales",
    name: "Valentina Cruz Morales",
    age: 15,
    birthDate: "2009-05-14",
    certificationType: "Otro",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p7", name: "Miguel Cruz" },
      { id: "p8", name: "Laura Morales" }
    ],
    contactPhone: "+52 555 654 3210",
    isLeveled: false,
    address: "Calle Independencia 654, Colonia Oeste, Tijuana"
  },
  {
    id: "6",
    firstName: "Andrés",
    lastName: "Ramírez Torres",
    name: "Andrés Ramírez Torres",
    age: 14,
    birthDate: "2010-09-20",
    certificationType: "INEA",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p9", name: "Fernando Ramírez" }
    ],
    contactPhone: "+52 555 789 0123",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Av. Juárez 890, Colonia Centro, Querétaro"
  },
  {
    id: "7",
    firstName: "Camila",
    lastName: "Jiménez Flores",
    name: "Camila Jiménez Flores",
    age: 16,
    birthDate: "2008-02-14",
    certificationType: "Grace Christian",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p10", name: "Sandra Jiménez" },
      { id: "p11", name: "Roberto Flores" }
    ],
    contactPhone: "+52 555 234 5678",
    isLeveled: true,
    expectedLevel: "Preparatoria",
    address: "Calle Morelos 234, Colonia Sur, Mérida"
  },
  {
    id: "8",
    firstName: "Mateo",
    lastName: "García Mendoza",
    name: "Mateo García Mendoza",
    age: 13,
    birthDate: "2011-06-18",
    certificationType: "Lighthouse",
    graduationDate: "2026-06-15",
    parents: [
      { id: "p12", name: "Gabriela García" }
    ],
    contactPhone: "+52 555 345 6789",
    isLeveled: false,
    address: "Blvd. Insurgentes 345, Colonia Norte, León"
  },
  {
    id: "9",
    firstName: "Isabella",
    lastName: "Vargas Sánchez",
    name: "Isabella Vargas Sánchez",
    age: 15,
    birthDate: "2009-11-25",
    certificationType: "Home Life",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p13", name: "Luis Vargas" },
      { id: "p14", name: "María Sánchez" }
    ],
    contactPhone: "+52 555 456 7890",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Calle Hidalgo 456, Colonia Centro, Toluca"
  },
  {
    id: "10",
    firstName: "Santiago",
    lastName: "Ortiz Ruiz",
    name: "Santiago Ortiz Ruiz",
    age: 14,
    birthDate: "2010-04-30",
    certificationType: "INEA",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p15", name: "Elena Ortiz" }
    ],
    contactPhone: "+52 555 567 8901",
    isLeveled: false,
    address: "Av. Constitución 567, Colonia Este, Aguascalientes"
  },
  {
    id: "11",
    firstName: "Lucía",
    lastName: "Morales Castro",
    name: "Lucía Morales Castro",
    age: 16,
    birthDate: "2008-08-12",
    certificationType: "Grace Christian",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p16", name: "Jorge Morales" },
      { id: "p17", name: "Diana Castro" }
    ],
    contactPhone: "+52 555 678 9012",
    isLeveled: true,
    expectedLevel: "Preparatoria",
    address: "Calle Zaragoza 678, Colonia Oeste, Chihuahua"
  },
  {
    id: "12",
    firstName: "Sebastián",
    lastName: "López Reyes",
    name: "Sebastián López Reyes",
    age: 13,
    birthDate: "2011-12-05",
    certificationType: "Otro",
    graduationDate: "2026-06-15",
    parents: [
      { id: "p18", name: "Carolina López" }
    ],
    contactPhone: "+52 555 789 0123",
    isLeveled: true,
    expectedLevel: "Primaria",
    address: "Av. Revolución 789, Colonia Sur, Culiacán"
  },
  {
    id: "13",
    firstName: "Emilia",
    lastName: "Fernández Guzmán",
    name: "Emilia Fernández Guzmán",
    age: 15,
    birthDate: "2009-03-22",
    certificationType: "Lighthouse",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p19", name: "Ricardo Fernández" },
      { id: "p20", name: "Sofía Guzmán" }
    ],
    contactPhone: "+52 555 890 1234",
    isLeveled: false,
    address: "Calle Madero 890, Colonia Centro, Morelia"
  },
  {
    id: "14",
    firstName: "Nicolás",
    lastName: "Pérez Navarro",
    name: "Nicolás Pérez Navarro",
    age: 14,
    birthDate: "2010-10-08",
    certificationType: "Home Life",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p21", name: "Beatriz Pérez" }
    ],
    contactPhone: "+52 555 901 2345",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Blvd. López Mateos 901, Colonia Norte, Hermosillo"
  },
  {
    id: "15",
    firstName: "Valeria",
    lastName: "Romero Delgado",
    name: "Valeria Romero Delgado",
    age: 16,
    birthDate: "2008-05-17",
    certificationType: "INEA",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p22", name: "Alberto Romero" },
      { id: "p23", name: "Patricia Delgado" }
    ],
    contactPhone: "+52 555 012 3456",
    isLeveled: true,
    expectedLevel: "Preparatoria",
    address: "Calle Allende 012, Colonia Este, Saltillo"
  },
  {
    id: "16",
    firstName: "Leonardo",
    lastName: "Torres Medina",
    name: "Leonardo Torres Medina",
    age: 13,
    birthDate: "2011-07-29",
    certificationType: "Grace Christian",
    graduationDate: "2026-06-15",
    parents: [
      { id: "p24", name: "Verónica Torres" }
    ],
    contactPhone: "+52 555 123 4567",
    isLeveled: false,
    address: "Av. Independencia 123, Colonia Sur, Durango"
  },
  {
    id: "17",
    firstName: "Regina",
    lastName: "Castillo Vega",
    name: "Regina Castillo Vega",
    age: 15,
    birthDate: "2009-09-03",
    certificationType: "Lighthouse",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p25", name: "Héctor Castillo" },
      { id: "p26", name: "Claudia Vega" }
    ],
    contactPhone: "+52 555 234 5678",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Calle Victoria 234, Colonia Centro, Oaxaca"
  },
  {
    id: "18",
    firstName: "Gabriel",
    lastName: "Ruiz Aguilar",
    name: "Gabriel Ruiz Aguilar",
    age: 14,
    birthDate: "2010-01-15",
    certificationType: "Otro",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p27", name: "Mónica Ruiz" }
    ],
    contactPhone: "+52 555 345 6789",
    isLeveled: false,
    address: "Blvd. Díaz Ordaz 345, Colonia Norte, Cuernavaca"
  },
  {
    id: "19",
    firstName: "Martina",
    lastName: "Chávez Ibarra",
    name: "Martina Chávez Ibarra",
    age: 16,
    birthDate: "2008-12-20",
    certificationType: "Home Life",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p28", name: "Arturo Chávez" },
      { id: "p29", name: "Raquel Ibarra" }
    ],
    contactPhone: "+52 555 456 7890",
    isLeveled: true,
    expectedLevel: "Preparatoria",
    address: "Calle Juárez 456, Colonia Este, Villahermosa"
  },
  {
    id: "20",
    firstName: "Daniel",
    lastName: "Méndez Solís",
    name: "Daniel Méndez Solís",
    age: 13,
    birthDate: "2011-04-11",
    certificationType: "INEA",
    graduationDate: "2026-06-15",
    parents: [
      { id: "p30", name: "Adriana Méndez" }
    ],
    contactPhone: "+52 555 567 8901",
    isLeveled: true,
    expectedLevel: "Primaria",
    address: "Av. Carranza 567, Colonia Oeste, Pachuca"
  },
  {
    id: "21",
    firstName: "Renata",
    lastName: "Domínguez Rojas",
    name: "Renata Domínguez Rojas",
    age: 15,
    birthDate: "2009-06-28",
    certificationType: "Grace Christian",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p31", name: "Guillermo Domínguez" },
      { id: "p32", name: "Isabel Rojas" }
    ],
    contactPhone: "+52 555 678 9012",
    isLeveled: false,
    address: "Calle Guerrero 678, Colonia Centro, Tuxtla Gutiérrez"
  },
  {
    id: "22",
    firstName: "Ángel",
    lastName: "Herrera Campos",
    name: "Ángel Herrera Campos",
    age: 14,
    birthDate: "2010-11-02",
    certificationType: "Lighthouse",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p33", name: "Mariana Herrera" }
    ],
    contactPhone: "+52 555 789 0123",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Blvd. Kukulcán 789, Colonia Sur, Cancún"
  },
  {
    id: "23",
    firstName: "Paulina",
    lastName: "Santos Núñez",
    name: "Paulina Santos Núñez",
    age: 16,
    birthDate: "2008-07-14",
    certificationType: "Otro",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p34", name: "Eduardo Santos" },
      { id: "p35", name: "Lorena Núñez" }
    ],
    contactPhone: "+52 555 890 1234",
    isLeveled: true,
    expectedLevel: "Preparatoria",
    address: "Calle Obregón 890, Colonia Norte, Veracruz"
  },
  {
    id: "24",
    firstName: "Joaquín",
    lastName: "Ríos Parra",
    name: "Joaquín Ríos Parra",
    age: 13,
    birthDate: "2011-02-26",
    certificationType: "Home Life",
    graduationDate: "2026-06-15",
    parents: [
      { id: "p36", name: "Cristina Ríos" }
    ],
    contactPhone: "+52 555 901 2345",
    isLeveled: false,
    address: "Av. Benito Juárez 901, Colonia Este, Mazatlán"
  },
  {
    id: "25",
    firstName: "Ximena",
    lastName: "Molina Cortés",
    name: "Ximena Molina Cortés",
    age: 15,
    birthDate: "2009-10-19",
    certificationType: "INEA",
    graduationDate: "2025-06-15",
    parents: [
      { id: "p37", name: "Pablo Molina" },
      { id: "p38", name: "Daniela Cortés" }
    ],
    contactPhone: "+52 555 012 3456",
    isLeveled: true,
    expectedLevel: "Secundaria",
    address: "Calle Progreso 012, Colonia Oeste, Colima"
  }
]

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

  // Fetch students from API
  React.useEffect(() => {
    let isMounted = true

    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await api.students.getAll()

        if (isMounted) {
          // Transform API data to match frontend Student type
          const transformedStudents: Student[] = data.map((student: any) => ({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            name: `${student.firstName} ${student.lastName}`,
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
          // Fallback to mock data for development
          setStudents(mockStudents)
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Using Demo Data
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {error}. Showing mock data for development.
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
