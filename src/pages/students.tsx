import * as React from "react"
import { StudentsList } from "@/components/students-list"
import { StudentsTable } from "@/components/students-table"
import { StudentProfile } from "@/components/student-profile"
import { StudentsFilters } from "@/components/students-filters"
import { ViewToggle } from "@/components/view-toggle"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Parent {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  age: number
  birthDate: string
  certificationType: "INEA" | "Grace Christian" | "Home Life" | "Lighthouse" | "Otro"
  graduationDate: string
  parents: Parent[]
  contactPhone: string
  isLeveled: boolean
  expectedLevel?: string
  address: string
}

// Mock data - simulating API fetch
const mockStudents: Student[] = [
  {
    id: "1",
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
  }
]

interface Filters {
  certificationType: string
  graduationYear: string
  isLeveled: string
}

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [students, setStudents] = React.useState<Student[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>({
    certificationType: "",
    graduationYear: "",
    isLeveled: ""
  })
  const [view, setView] = React.useState<"cards" | "table">("cards")

  // Simulate API fetch
  React.useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setStudents(mockStudents)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Filter and search logic
  const filteredStudents = React.useMemo(() => {
    return students.filter((student) => {
      // Search filter
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.certificationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contactPhone.includes(searchTerm) ||
        student.address.toLowerCase().includes(searchTerm.toLowerCase())

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
  }, [students, searchTerm, filters])

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
  }

  const handleBackToList = () => {
    setSelectedStudent(null)
  }

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  if (selectedStudent) {
    return <StudentProfile student={selectedStudent} onBack={handleBackToList} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estudiantes</h1>
        <p className="text-muted-foreground">
          Gestiona la información de todos los estudiantes
        </p>
        {/* Debug info */}
        <p className="text-xs text-muted-foreground mt-2">
          Total: {students.length} | Filtrados: {filteredStudents.length} | Vista: {view}
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
          filteredCount={filteredStudents.length}
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Students Content */}
      {filteredStudents.length === 0 ? (
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
            <StudentsList students={filteredStudents} onStudentSelect={handleStudentSelect} />
          ) : (
            <StudentsTable students={filteredStudents} onStudentSelect={handleStudentSelect} />
          )}
        </>
      )}
    </div>
  )
}
