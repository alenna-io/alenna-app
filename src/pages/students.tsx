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
import { Plus, Users } from "lucide-react"
import { StudentFormDialog } from "@/components/student-form-dialog"
import { useTranslation } from "react-i18next"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Filters extends Record<string, string> {
  certificationType: string
  graduationYear: string
  isLeveled: string
  groupId: string
  isActive: string
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
    certificationType: "all",
    graduationYear: "all",
    isLeveled: "all",
    groupId: "all",
    isActive: "all"
  })
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string | null; teacherName: string }>>([])
  const [view, setView] = React.useState<"cards" | "table">("table")
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isStudentDialogOpen, setIsStudentDialogOpen] = React.useState(false)
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null)
  const [school, setSchool] = React.useState<{ userLimit?: number; teacherLimit?: number } | null>(null)
  const [studentsCount, setStudentsCount] = React.useState<number>(0)
  const [limitWarningDialog, setLimitWarningDialog] = React.useState<{ open: boolean; title: string; message: string } | null>(null)
  const [deactivateConfirmation, setDeactivateConfirmation] = React.useState<{ open: boolean; studentId: string; studentName: string; studentEmail: string }>({ open: false, studentId: '', studentName: '', studentEmail: '' })
  const [reactivateConfirmation, setReactivateConfirmation] = React.useState<{ open: boolean; studentId: string; studentName: string }>({ open: false, studentId: '', studentName: '' })
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{ open: boolean; studentId: string; studentName: string; studentEmail: string }>({ open: false, studentId: '', studentName: '', studentEmail: '' })
  const [deactivateEmailInput, setDeactivateEmailInput] = React.useState('')
  const [deleteEmailInput, setDeleteEmailInput] = React.useState('')
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
              certificationTypeId: (s.certificationTypeId as string | undefined) || undefined,
              graduationDate: s.graduationDate as string,
              parents: (s.parents || []) as Student['parents'],
              email: (s.email || undefined) as string | undefined,
              phone: (s.phone || undefined) as string | undefined,
              isLeveled: s.isLeveled as boolean,
              expectedLevel: s.expectedLevel as string | undefined,
              currentLevel: s.currentLevel as string | undefined,
              streetAddress: (s.streetAddress || undefined) as string | undefined,
              city: (s.city || undefined) as string | undefined,
              state: (s.state || undefined) as string | undefined,
              country: (s.country || undefined) as string | undefined,
              zipCode: (s.zipCode || undefined) as string | undefined,
              isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
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
            certificationTypeId: (s.certificationTypeId as string | undefined) || undefined,
            graduationDate: s.graduationDate as string,
            parents: (s.parents || []) as Student['parents'],
            email: (s.email || undefined) as string | undefined,
            phone: (s.phone || undefined) as string | undefined,
            isLeveled: s.isLeveled as boolean,
            expectedLevel: s.expectedLevel as string | undefined,
            currentLevel: s.currentLevel as string | undefined,
            streetAddress: (s.streetAddress || undefined) as string | undefined,
            city: (s.city || undefined) as string | undefined,
            state: (s.state || undefined) as string | undefined,
            country: (s.country || undefined) as string | undefined,
            zipCode: (s.zipCode || undefined) as string | undefined,
            isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
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

  // Calculate available graduation years from students
  const availableGraduationYears = React.useMemo(() => {
    const years = new Set<number>()
    students.forEach(student => {
      const year = new Date(student.graduationDate).getFullYear()
      years.add(year)
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [students])

  // Filter, search, and sort logic
  const filteredAndSortedStudents = React.useMemo(() => {
    // Filter students
    let result = students.filter((student) => {
      // Search filter (accent-insensitive)
      const matchesSearch =
        includesIgnoreAccents(student.name, searchTerm) ||
        includesIgnoreAccents(student.certificationType, searchTerm) ||
        (student.phone && student.phone.includes(searchTerm)) ||
        (student.streetAddress && includesIgnoreAccents(student.streetAddress, searchTerm)) ||
        (student.city && includesIgnoreAccents(student.city, searchTerm))

      // Certification type filter
      const matchesCertification =
        !filters.certificationType ||
        filters.certificationType === "all" ||
        student.certificationType === filters.certificationType

      // Graduation year filter
      const matchesGraduationYear =
        !filters.graduationYear ||
        filters.graduationYear === "all" ||
        new Date(student.graduationDate).getFullYear().toString() === filters.graduationYear

      // Leveling status filter
      const matchesLeveling =
        !filters.isLeveled ||
        filters.isLeveled === "all" ||
        (filters.isLeveled === "true" && student.isLeveled) ||
        (filters.isLeveled === "false" && !student.isLeveled)

      // Group filter - this will be handled by fetching students from the group
      // For now, return true and we'll handle group filtering separately
      const matchesGroup = !filters.groupId || filters.groupId === "all"

      // Active/Inactive status filter
      const matchesStatus =
        !filters.isActive ||
        filters.isActive === "all" ||
        (filters.isActive === "true" && student.isActive) ||
        (filters.isActive === "false" && !student.isActive)

      return matchesSearch && matchesCertification && matchesGraduationYear && matchesLeveling && matchesGroup && matchesStatus
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
    if ((!filters.groupId || filters.groupId === "all") || !userInfo?.schoolId || studentId) {
      // If no group filter or viewing a student, refetch all students
      if ((!filters.groupId || filters.groupId === "all") && !studentId && !isStudentOnly) {
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
                email: (s.email || undefined) as string | undefined,
                phone: (s.phone || undefined) as string | undefined,
                isLeveled: s.isLeveled as boolean,
                expectedLevel: s.expectedLevel as string | undefined,
                currentLevel: s.currentLevel as string | undefined,
                streetAddress: (s.streetAddress || undefined) as string | undefined,
                city: (s.city || undefined) as string | undefined,
                state: (s.state || undefined) as string | undefined,
                country: (s.country || undefined) as string | undefined,
                zipCode: (s.zipCode || undefined) as string | undefined,
                isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
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
              certificationTypeId: (s.certificationTypeId as string | undefined) || undefined,
              graduationDate: s.graduationDate as string,
              parents: (s.parents || []) as Student['parents'],
              email: (s.email || undefined) as string | undefined,
              phone: (s.phone || undefined) as string | undefined,
              isLeveled: s.isLeveled as boolean,
              expectedLevel: s.expectedLevel as string | undefined,
              currentLevel: s.currentLevel as string | undefined,
              streetAddress: (s.streetAddress || undefined) as string | undefined,
              city: (s.city || undefined) as string | undefined,
              state: (s.state || undefined) as string | undefined,
              country: (s.country || undefined) as string | undefined,
              zipCode: (s.zipCode || undefined) as string | undefined,
              isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
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

  const handleDeactivateStudent = (student: Student) => {
    setDeactivateConfirmation({
      open: true,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email || ''
    })
    setDeactivateEmailInput('')
  }

  const confirmDeactivateStudent = async () => {
    if (deactivateConfirmation.studentEmail && deactivateEmailInput !== deactivateConfirmation.studentEmail) {
      setError(t("users.emailMismatchError"))
      return
    }

    const studentId = deactivateConfirmation.studentId

    // Optimistic update
    setStudents(prevStudents => prevStudents.map(student =>
      student.id === studentId ? { ...student, isActive: false } : student
    ))
    setDeactivateConfirmation({ open: false, studentId: '', studentName: '', studentEmail: '' })
    setDeactivateEmailInput('')

    try {
      await api.students.deactivate(studentId)
      toast.success(t("students.deactivateSuccess", { studentName: deactivateConfirmation.studentName }))
      // Refresh to get actual state from server
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
          email: (s.email || undefined) as string | undefined,
          isLeveled: s.isLeveled as boolean,
          expectedLevel: s.expectedLevel as string | undefined,
          currentLevel: s.currentLevel as string | undefined,
          address: (s.address || undefined) as string | undefined,
          streetAddress: (s.streetAddress || undefined) as string | undefined,
          city: (s.city || undefined) as string | undefined,
          state: (s.state || undefined) as string | undefined,
          country: (s.country || undefined) as string | undefined,
          zipCode: (s.zipCode || undefined) as string | undefined,
          isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
        }
      })
      setStudents(transformedStudents)
    } catch (err: unknown) {
      // Revert optimistic update on error
      setStudents(prevStudents => prevStudents.map(student =>
        student.id === studentId ? { ...student, isActive: true } : student
      ))
      const errorMessage = err instanceof Error ? err.message : t("students.deactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleReactivateStudent = (student: Student) => {
    setReactivateConfirmation({
      open: true,
      studentId: student.id,
      studentName: student.name
    })
  }

  const confirmReactivateStudent = async () => {
    const studentId = reactivateConfirmation.studentId

    try {
      await api.students.reactivate(studentId)
      toast.success(t("students.reactivateSuccess", { studentName: reactivateConfirmation.studentName }))
      setReactivateConfirmation({ open: false, studentId: '', studentName: '' })

      // Refresh student data
      if (selectedStudent) {
        const updatedStudent = await api.students.getById(studentId)
        setSelectedStudent(updatedStudent as Student)
      }

      // Refresh students list
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
          email: (s.email || undefined) as string | undefined,
          isLeveled: s.isLeveled as boolean,
          expectedLevel: s.expectedLevel as string | undefined,
          currentLevel: s.currentLevel as string | undefined,
          address: (s.address || undefined) as string | undefined,
          streetAddress: (s.streetAddress || undefined) as string | undefined,
          city: (s.city || undefined) as string | undefined,
          state: (s.state || undefined) as string | undefined,
          country: (s.country || undefined) as string | undefined,
          zipCode: (s.zipCode || undefined) as string | undefined,
          isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
        }
      })
      setStudents(transformedStudents)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("students.reactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleDeleteStudent = (student: Student) => {
    if (!student.email) {
      toast.error(t("students.emailRequiredForDelete"))
      return
    }
    setDeleteConfirmation({
      open: true,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email
    })
    setDeleteEmailInput('')
  }

  const confirmDeleteStudent = async () => {
    if (deleteEmailInput !== deleteConfirmation.studentEmail) {
      setError(t("users.emailMismatchError"))
      return
    }

    try {
      await api.students.delete(deleteConfirmation.studentId)
      toast.success(t("students.deleteSuccess", { studentName: deleteConfirmation.studentName }))
      // Refresh students list
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
          email: (s.email || undefined) as string | undefined,
          isLeveled: s.isLeveled as boolean,
          expectedLevel: s.expectedLevel as string | undefined,
          currentLevel: s.currentLevel as string | undefined,
          address: (s.address || undefined) as string | undefined,
          streetAddress: (s.streetAddress || undefined) as string | undefined,
          city: (s.city || undefined) as string | undefined,
          state: (s.state || undefined) as string | undefined,
          country: (s.country || undefined) as string | undefined,
          zipCode: (s.zipCode || undefined) as string | undefined,
          isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
        }
      })
      setStudents(transformedStudents)
      setDeleteConfirmation({ open: false, studentId: '', studentName: '', studentEmail: '' })
      setDeleteEmailInput('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("students.deleteError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleCreateStudent = async (data: {
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    phone?: string
    isLeveled?: boolean
    expectedLevel?: string
    currentLevel?: string
    streetAddress?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
    parents?: Array<{
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
        email: (s.email || undefined) as string | undefined,
        phone: (s.phone || undefined) as string | undefined,
        isLeveled: s.isLeveled as boolean,
        expectedLevel: s.expectedLevel as string | undefined,
        currentLevel: s.currentLevel as string | undefined,
        streetAddress: (s.streetAddress || undefined) as string | undefined,
        city: (s.city || undefined) as string | undefined,
        state: (s.state || undefined) as string | undefined,
        country: (s.country || undefined) as string | undefined,
        zipCode: (s.zipCode || undefined) as string | undefined,
        isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
      }
    })
    setStudents(transformedStudents)
    const countData = await api.schools.getStudentsCount(targetSchoolId)
    setStudentsCount(countData.count)
  }

  const handleUpdateStudent = async (data: {
    firstName: string
    lastName: string
    email: string
    birthDate: string
    certificationTypeId: string
    graduationDate: string
    phone?: string
    isLeveled?: boolean
    expectedLevel?: string
    currentLevel?: string
    streetAddress?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
    parents?: Array<{
      firstName: string
      lastName: string
      email: string
      relationship: string
    }>
  }) => {
    if (!editingStudent) return

    // Update student and get the updated response (which includes certificationTypeId)
    const updatedStudentData = await api.students.update(editingStudent.id, data)
    const s = updatedStudentData as Record<string, unknown>

    // Transform the updated student data
    const updatedStudent: Student = {
      id: s.id as string,
      firstName: s.firstName as string,
      lastName: s.lastName as string,
      name: s.name as string,
      age: s.age as number,
      birthDate: s.birthDate as string,
      certificationType: s.certificationType as string,
      certificationTypeId: (s.certificationTypeId as string | undefined) || undefined,
      graduationDate: s.graduationDate as string,
      parents: (s.parents || []) as Student['parents'],
      email: (s.email || undefined) as string | undefined,
      phone: (s.phone || undefined) as string | undefined,
      isLeveled: s.isLeveled as boolean,
      expectedLevel: s.expectedLevel as string | undefined,
      currentLevel: s.currentLevel as string | undefined,
      streetAddress: (s.streetAddress || undefined) as string | undefined,
      city: (s.city || undefined) as string | undefined,
      state: (s.state || undefined) as string | undefined,
      country: (s.country || undefined) as string | undefined,
      zipCode: (s.zipCode || undefined) as string | undefined,
      isActive: (s.isActive !== undefined ? s.isActive : true) as boolean,
    }

    // Update the students list
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    )

    // Update selected student if it's the one being edited
    if (selectedStudent?.id === editingStudent.id) {
      setSelectedStudent(updatedStudent)
    }

    setEditingStudent(null)
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

  // Check if user can edit students (based on permission, not role)
  const canEditStudent = userInfo?.permissions.includes('students.update') ?? false
  const canDeleteStudent = userInfo?.permissions.includes('students.delete') ?? false

  // Show student profile if we have a selected student
  if (selectedStudent) {
    return (
      <>
        <StudentProfile
          student={selectedStudent}
          onBack={handleBackToList}
          isParentView={parentOnly}
          canManage={canEditStudent || canDeleteStudent}
          canEdit={canEditStudent}
          onEdit={canEditStudent ? (student) => setEditingStudent(student) : undefined}
          onDeactivate={canDeleteStudent ? handleDeactivateStudent : undefined}
          onReactivate={canDeleteStudent ? handleReactivateStudent : undefined}
          onDelete={canDeleteStudent ? handleDeleteStudent : undefined}
        />

        {/* Student Form Dialog - Edit */}
        {canEditStudent && editingStudent && (schoolId || userInfo?.schoolId) && (
          <StudentFormDialog
            open={!!editingStudent}
            onOpenChange={(open) => {
              if (!open) {
                setEditingStudent(null)
              }
            }}
            schoolId={schoolId || userInfo?.schoolId || ''}
            student={{
              id: editingStudent.id,
              firstName: editingStudent.firstName,
              lastName: editingStudent.lastName,
              email: editingStudent.email,
              birthDate: editingStudent.birthDate,
              certificationType: editingStudent.certificationType,
              certificationTypeId: editingStudent.certificationTypeId,
              graduationDate: editingStudent.graduationDate,
              phone: editingStudent.phone,
              isLeveled: editingStudent.isLeveled,
              expectedLevel: editingStudent.expectedLevel,
              currentLevel: editingStudent.currentLevel,
              streetAddress: editingStudent.streetAddress,
              city: editingStudent.city,
              state: editingStudent.state,
              country: editingStudent.country,
              zipCode: editingStudent.zipCode,
              parents: editingStudent.parents?.map(p => ({
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                email: p.email || '',
                phone: p.phone || '',
                relationship: p.relationship || '',
              })) || [],
            }}
            onSave={handleUpdateStudent}
          />
        )}

        {/* Deactivate Confirmation Dialog */}
        <Dialog open={deactivateConfirmation.open} onOpenChange={(open) => setDeactivateConfirmation({ ...deactivateConfirmation, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("students.deactivateConfirm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm font-semibold text-orange-800 mb-2">{t("common.important")}</p>
                <p className="text-sm text-orange-700">{t("students.deactivateWarning")}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t("students.deactivateConfirmMessage", { studentName: deactivateConfirmation.studentName })}
              </p>
              {deactivateConfirmation.studentEmail && (
                <>
                  <p className="text-sm text-gray-600">
                    {t("students.typeEmailToConfirmDeactivate", { studentEmail: deactivateConfirmation.studentEmail })}
                  </p>
                  <div>
                    <Label htmlFor="deactivate-email">{t("students.email")}</Label>
                    <Input
                      id="deactivate-email"
                      type="email"
                      value={deactivateEmailInput}
                      onChange={(e) => setDeactivateEmailInput(e.target.value)}
                      placeholder={t("students.deactivateEmailPlaceholder")}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setDeactivateConfirmation({ ...deactivateConfirmation, open: false })}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeactivateStudent}
                  disabled={deactivateConfirmation.studentEmail ? deactivateEmailInput !== deactivateConfirmation.studentEmail : false}
                >
                  {t("students.deactivate")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reactivate Confirmation Dialog */}
        <Dialog open={reactivateConfirmation.open} onOpenChange={(open) => setReactivateConfirmation({ ...reactivateConfirmation, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-600">{t("students.reactivateConfirm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-semibold text-green-800 mb-2">{t("common.important")}</p>
                <p className="text-sm text-green-700">{t("students.reactivateWarning")}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t("students.reactivateConfirmMessage", { studentName: reactivateConfirmation.studentName })}
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setReactivateConfirmation({ ...reactivateConfirmation, open: false })}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={confirmReactivateStudent}
                >
                  {t("students.reactivate")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmation.open} onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">{t("students.deleteConfirm")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-semibold text-red-800 mb-2">{t("common.important")}</p>
                <p className="text-sm text-red-700">{t("students.deleteWarning")}</p>
              </div>
              <p className="text-sm text-gray-700">
                {t("students.deleteConfirmMessage", { studentName: deleteConfirmation.studentName })}
              </p>
              <p className="text-sm text-gray-600">
                {t("students.typeEmailToConfirm", { studentEmail: deleteConfirmation.studentEmail })}
              </p>
              <div>
                <Label htmlFor="delete-email">{t("students.email")}</Label>
                <Input
                  id="delete-email"
                  type="email"
                  value={deleteEmailInput}
                  onChange={(e) => setDeleteEmailInput(e.target.value)}
                  placeholder={t("students.deleteEmailPlaceholder")}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ ...deleteConfirmation, open: false })}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteStudent}
                  disabled={deleteEmailInput !== deleteConfirmation.studentEmail}
                >
                  {t("students.delete")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
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
      <div className="flex flex-col gap-4">
        <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
          <PageHeader
            title={schoolId ? t("students.titleForSchool") : t("students.title")}
            description={schoolId ? t("students.descriptionForSchool") : t("students.description")}
            className="flex-1"
          />
          {(userInfo?.permissions.includes('students.create') ?? false) && (schoolId || userInfo?.schoolId) && (
            <Button
              onClick={() => {
                // Check if limit is reached
                if (school?.userLimit && studentsCount >= school.userLimit) {
                  setLimitWarningDialog({
                    open: true,
                    title: t("students.limitReached"),
                    message: t("students.limitReachedMessage", { limit: school.userLimit })
                  })
                } else {
                  navigate('/students/create')
                }
              }}
              disabled={school?.userLimit ? studentsCount >= school.userLimit : false}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("students.addStudent")}
            </Button>
          )}
        </div>

        {/* Count and Limit Display - Compact inline */}
        {(userInfo?.permissions.includes('students.create') ?? false) && school && school.userLimit && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{t("students.registered")}:</span>
            <span className="text-base font-semibold text-blue-600">
              {studentsCount}/{school.userLimit}
            </span>
          </div>
        )}
      </div>

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
          availableGraduationYears={availableGraduationYears}
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Students Content */}
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

      {/* Student Form Dialog */}
      {(userInfo?.permissions.includes('students.create') ?? false) && (schoolId || userInfo?.schoolId) && (
        <StudentFormDialog
          open={isStudentDialogOpen}
          onOpenChange={(open) => {
            setIsStudentDialogOpen(open)
          }}
          schoolId={schoolId || userInfo?.schoolId || ''}
          onSave={handleCreateStudent}
        />
      )}

      {/* Student Form Dialog - Edit */}
      {canEditStudent && editingStudent && (schoolId || userInfo?.schoolId) && (
        <StudentFormDialog
          open={!!editingStudent}
          onOpenChange={(open) => {
            if (!open) {
              setEditingStudent(null)
            }
          }}
          schoolId={schoolId || userInfo?.schoolId || ''}
          student={{
            id: editingStudent.id,
            firstName: editingStudent.firstName,
            lastName: editingStudent.lastName,
            email: editingStudent.email,
            birthDate: editingStudent.birthDate,
            certificationType: editingStudent.certificationType,
            certificationTypeId: editingStudent.certificationTypeId,
            graduationDate: editingStudent.graduationDate,
            phone: editingStudent.phone,
            isLeveled: editingStudent.isLeveled,
            expectedLevel: editingStudent.expectedLevel,
            currentLevel: editingStudent.currentLevel,
            streetAddress: editingStudent.streetAddress,
            city: editingStudent.city,
            state: editingStudent.state,
            country: editingStudent.country,
            zipCode: editingStudent.zipCode,
            parents: editingStudent.parents?.map(p => ({
              firstName: p.firstName || '',
              lastName: p.lastName || '',
              email: p.email || '',
              phone: p.phone || '',
              relationship: p.relationship || '',
            })) || [],
          }}
          onSave={handleUpdateStudent}
        />
      )}

      {/* Limit Warning Dialog */}
      {limitWarningDialog && (
        <AlertDialog open={limitWarningDialog.open} onOpenChange={(open) => setLimitWarningDialog(open ? limitWarningDialog : null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{limitWarningDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {limitWarningDialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setLimitWarningDialog(null)}>
                {t("common.accept")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateConfirmation.open} onOpenChange={(open) => setDeactivateConfirmation({ ...deactivateConfirmation, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("students.deactivateConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm font-semibold text-orange-800 mb-2">{t("common.important")}</p>
              <p className="text-sm text-orange-700">{t("students.deactivateWarning")}</p>
            </div>
            <p className="text-sm text-gray-700">
              {t("students.deactivateConfirmMessage", { studentName: deactivateConfirmation.studentName })}
            </p>
            {deactivateConfirmation.studentEmail && (
              <>
                <p className="text-sm text-gray-600">
                  {t("students.typeEmailToConfirmDeactivate", { studentEmail: deactivateConfirmation.studentEmail })}
                </p>
                <div>
                  <Label htmlFor="deactivate-email">{t("students.email")}</Label>
                  <Input
                    id="deactivate-email"
                    type="email"
                    value={deactivateEmailInput}
                    onChange={(e) => setDeactivateEmailInput(e.target.value)}
                    placeholder={t("students.deactivateEmailPlaceholder")}
                    className="mt-1"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setDeactivateConfirmation({ ...deactivateConfirmation, open: false })}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeactivateStudent}
                disabled={deactivateConfirmation.studentEmail ? deactivateEmailInput !== deactivateConfirmation.studentEmail : false}
              >
                {t("students.deactivate")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.open} onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("students.deleteConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm font-semibold text-red-800 mb-2">{t("common.important")}</p>
              <p className="text-sm text-red-700">{t("students.deleteWarning")}</p>
            </div>
            <p className="text-sm text-gray-700">
              {t("students.deleteConfirmMessage", { studentName: deleteConfirmation.studentName })}
            </p>
            <p className="text-sm text-gray-600">
              {t("students.typeEmailToConfirm", { studentEmail: deleteConfirmation.studentEmail })}
            </p>
            <div>
              <Label htmlFor="delete-email">{t("students.email")}</Label>
              <Input
                id="delete-email"
                type="email"
                value={deleteEmailInput}
                onChange={(e) => setDeleteEmailInput(e.target.value)}
                placeholder={t("students.deleteEmailPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation({ ...deleteConfirmation, open: false })}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteStudent}
                disabled={deleteEmailInput !== deleteConfirmation.studentEmail}
              >
                {t("students.delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={reactivateConfirmation.open} onOpenChange={(open) => setReactivateConfirmation({ ...reactivateConfirmation, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">{t("students.reactivateConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm font-semibold text-green-800 mb-2">{t("common.important")}</p>
              <p className="text-sm text-green-700">{t("students.reactivateWarning")}</p>
            </div>
            <p className="text-sm text-gray-700">
              {t("students.reactivateConfirmMessage", { studentName: reactivateConfirmation.studentName })}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setReactivateConfirmation({ ...reactivateConfirmation, open: false })}>
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={confirmReactivateStudent}
              >
                {t("students.reactivate")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}
