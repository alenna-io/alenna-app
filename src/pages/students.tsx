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
import {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useDeactivateStudent,
  useReactivateStudent,
} from "@/hooks/queries"
import { useSchoolYears } from "@/hooks/queries/use-school-years"
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
import { usePersistedState } from "@/hooks/use-table-state"
import { queryKeys } from "@/hooks/queries/query-keys"
import { useQueryClient } from "@tanstack/react-query"

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
  const [error, setError] = React.useState<string | null>(null)
  const [studentError, setStudentError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const tableId = "students"
  const [filters, setFilters] = usePersistedState<Filters>("filters", {
    certificationType: "all",
    graduationYear: "all",
    isLeveled: "all",
    groupId: "all",
    isActive: "all"
  }, tableId)
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string | null; teacherName: string }>>([])
  const [view, setView] = React.useState<"cards" | "table">("table")
  const [sortField, setSortField] = usePersistedState<SortField>("sortField", null, tableId)
  const [sortDirection, setSortDirection] = usePersistedState<SortDirection>("sortDirection", "asc", tableId)
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
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
  const [hasConfirmedDangerZoneAction, setHasConfirmedDangerZoneAction] = React.useState<{
    deactivate: boolean
    reactivate: boolean
    delete: boolean
  }>({ deactivate: false, reactivate: false, delete: false })
  const itemsPerPage = 10

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  const isSuperAdmin = hasRole('SUPERADMIN')
  const isParentOnly = hasRole('PARENT') && !hasRole('TEACHER') && !hasRole('ADMIN') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')
  const isStudentOnly = hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('ADMIN') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')

  const queryClient = useQueryClient()

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

  const targetSchoolId = schoolId || userInfo?.schoolId
  const { data: students = [], isLoading, error: studentsError } = useStudents(
    !studentId && !isStudentOnly ? targetSchoolId : undefined
  )

  React.useEffect(() => {
    if (studentsError) {
      const error = studentsError as Error
      if (error.message?.includes('permiso') || error.message?.includes('403')) {
        setHasPermission(false)
      } else {
        setError(error.message || 'Failed to load students')
      }
    } else {
      setError(null)
    }
  }, [studentsError])

  const { data: selectedStudentData, isLoading: isLoadingStudent, error: studentQueryError } = useStudent(
    studentId || undefined
  )

  React.useEffect(() => {
    if (studentQueryError) {
      const error = studentQueryError as Error
      if (error.message?.includes('permiso') || error.message?.includes('not found') || error.message?.includes('Student not found') || error.message?.includes('no encontrada') || error.message?.includes('no encontrado')) {
        setHasPermission(false)
      } else {
        setStudentError(error.message || 'Failed to load student')
      }
    } else {
      setStudentError(null)
    }
  }, [studentQueryError])

  const selectedStudent = selectedStudentData || null

  const createStudentMutation = useCreateStudent()
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()
  const deactivateStudentMutation = useDeactivateStudent()
  const reactivateStudentMutation = useReactivateStudent()

  const { data: schoolYears = [] } = useSchoolYears()

  React.useEffect(() => {
    if (!isSchoolAdmin || !userInfo?.schoolId || studentId || isStudentOnly) return

    const fetchGroups = async () => {
      try {
        const activeYear = schoolYears.find((sy: { isActive: boolean }) => sy.isActive)
        if (activeYear) {
          const allGroups = await api.groups.getBySchoolYear(activeYear.id)

          let teachers: Array<{ id: string; fullName: string }> = []
          if (hasTeachersModule) {
            try {
              teachers = await api.schools.getMyTeachers()
            } catch (teachersError) {
              console.warn('Could not fetch teachers:', teachersError)
            }
          }

          const groupMap = new Map<string, { id: string; name: string | null; teacherName: string }>()
          allGroups.forEach((g: { id: string; teacherId: string; name: string | null; deletedAt: string | null }) => {
            if (!g.deletedAt) {
              const teacher = teachers.find((t: { id: string }) => t.id === g.teacherId)
              const groupKey = `${g.teacherId}-${g.name || 'default'}`
              if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                  id: g.id,
                  name: g.name,
                  teacherName: teacher?.fullName || t("groups.noTeacher") || 'Sin maestro'
                })
              }
            }
          })
          setGroups(Array.from(groupMap.values()))
        }
      } catch (err) {
        console.error('Error fetching groups:', err)
      }
    }

    fetchGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSchoolAdmin, userInfo?.schoolId, studentId, isStudentOnly, schoolYears, hasTeachersModule])


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

      // Group filter - when a group is selected, students are already filtered by the API
      // So all students in the list match the selected group
      const matchesGroup = true

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
  }, [searchTerm, filters, sortField, sortDirection, setCurrentPage])

  // Group filtering is now handled client-side in filteredAndSortedStudents
  // The students list is cached via TanStack Query

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
    setHasConfirmedDangerZoneAction({ deactivate: true, reactivate: false, delete: false })
    if (deactivateConfirmation.studentEmail && deactivateEmailInput !== deactivateConfirmation.studentEmail) {
      setError(t("users.emailMismatchError"))
      return
    }

    const studentId = deactivateConfirmation.studentId
    const studentName = deactivateConfirmation.studentName

    setDeactivateConfirmation({ open: false, studentId: '', studentName: '', studentEmail: '' })
    setDeactivateEmailInput('')

    try {
      await deactivateStudentMutation.mutateAsync(studentId)
      toast.success(t("students.deactivateSuccess", { studentName }))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("students.deactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) })
      setHasConfirmedDangerZoneAction({ deactivate: false, reactivate: false, delete: false })
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
    setHasConfirmedDangerZoneAction({ deactivate: false, reactivate: true, delete: false })
    const studentId = reactivateConfirmation.studentId
    const studentName = reactivateConfirmation.studentName

    setReactivateConfirmation({ open: false, studentId: '', studentName: '' })

    try {
      await reactivateStudentMutation.mutateAsync(studentId)
      toast.success(t("students.reactivateSuccess", { studentName }))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("students.reactivateError")
      setError(errorMessage)
      toast.error(errorMessage)
    }
    finally {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) })
      setHasConfirmedDangerZoneAction({ deactivate: false, reactivate: false, delete: false })
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
    setHasConfirmedDangerZoneAction({ deactivate: false, reactivate: false, delete: true })
    if (deleteEmailInput !== deleteConfirmation.studentEmail) {
      setError(t("users.emailMismatchError"))
      return
    }

    const studentId = deleteConfirmation.studentId
    const studentName = deleteConfirmation.studentName

    setDeleteConfirmation({ open: false, studentId: '', studentName: '', studentEmail: '' })
    setDeleteEmailInput('')

    try {
      await deleteStudentMutation.mutateAsync(studentId)
      toast.success(t("students.deleteSuccess", { studentName }))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("students.deleteError")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setHasConfirmedDangerZoneAction({ deactivate: false, reactivate: false, delete: false })
      navigate('/students')
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
    await createStudentMutation.mutateAsync({ ...data, schoolId: targetSchoolId })
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

    await updateStudentMutation.mutateAsync({
      id: editingStudent.id,
      data,
    })

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
    return <Loading variant="detail-page" />
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
          hasConfirmedDangerZoneAction={hasConfirmedDangerZoneAction}
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
          <DialogContent className="max-w-2xl">
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
          <DialogContent className="max-w-2xl">
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
          <DialogContent className="max-w-2xl">
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

  // PAGE LOADING: Show skeleton table when loading students data
  if (isLoading) {
    return (
      <Loading
        variant="list-page"
        showCreateButton={userInfo?.permissions.includes('students.create') ?? false}
        view={view}
        showFilters={true}
        showViewToggle={true}
      />
    )
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
            moduleKey="students"
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
          tableId={tableId}
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
