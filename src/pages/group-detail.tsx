import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { StudentsTable } from "@/components/students-table"
import type { Student } from "@/types/student"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { SearchBar } from "@/components/ui/search-bar"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { AddStudentsDialog } from "@/components/add-students-dialog"

interface GroupStudent {
  id: string
  groupId: string
  studentId: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface GroupDetailResponse {
  id: string
  name: string | null
  teacherId: string
  schoolYearId: string
  students: GroupStudent[]
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface GroupDetail {
  id: string
  name: string | null
  teacherId: string
  teacherName: string
  schoolYearId: string
  schoolYearName: string
  students: Array<{ id: string; studentId: string; studentName: string }>
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo } = useUser()
  const { hasModule } = useModuleAccess()
  const { t } = useTranslation()

  // Check if teachers module is enabled
  const hasTeachersModule = hasModule('teachers')
  const [isLoading, setIsLoading] = React.useState(true)
  const [groupDetail, setGroupDetail] = React.useState<GroupDetail | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [studentToDelete, setStudentToDelete] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = React.useState(false)
  const [allStudents, setAllStudents] = React.useState<Array<{ id: string; name: string }>>([])
  const [existingAssignments, setExistingAssignments] = React.useState<Array<{ studentId: string; groupId: string }>>([])
  const [groupStudents, setGroupStudents] = React.useState<Student[]>([])
  const [groupAssignmentMap, setGroupAssignmentMap] = React.useState<Map<string, string>>(new Map())
  const [sortField, setSortField] = React.useState<"firstName" | "lastName" | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  React.useEffect(() => {
    const fetchData = async () => {
      if (!groupId || !userInfo?.schoolId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Fetch the group by ID (includes students array)
        const group = await api.groups.getById(groupId) as GroupDetailResponse
        if (!group || group.deletedAt) {
          toast.error(t("groups.groupNotFound"))
          setIsLoading(false)
          return
        }

        // Fetch existing assignments for the school year (to filter students in the add dialog)
        const assignmentsData = await api.groups.getStudentAssignments(group.schoolYearId)
        setExistingAssignments(assignmentsData)

        // Fetch school year name
        const schoolYears = await api.schoolYears.getAll()
        const schoolYear = schoolYears.find((sy: { id: string }) => sy.id === group.schoolYearId)

        // Fetch teacher only if teachers module is enabled
        let teacher: { id: string; fullName: string } | undefined
        if (hasTeachersModule) {
          try {
            const teachers = await api.schools.getMyTeachers()
            teacher = teachers.find((t: { id: string }) => t.id === group.teacherId)
          } catch (error) {
            console.warn('Could not fetch teacher (module may not be enabled):', error)
            // Continue without teacher name
          }
        }

        // Fetch students
        const studentsData = await api.students.getAll()
        setAllStudents(studentsData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))

        // Map group students to student list and create assignment map
        const studentList = group.students
          .filter(gs => !gs.deletedAt)
          .map(gs => {
            const student = studentsData.find((s: { id: string }) => s.id === gs.studentId)
            return {
              id: gs.id, // GroupStudent ID
              studentId: gs.studentId,
              studentName: student?.name || ""
            }
          })
          .filter((s: { studentName: string }) => s.studentName)

        // Create full Student objects and assignment map
        const assignmentMap = new Map<string, string>() // studentId -> groupStudentId
        const fullStudents: Student[] = []

        group.students
          .filter(gs => !gs.deletedAt)
          .forEach(gs => {
            const studentData = studentsData.find((s: { id: string }) => s.id === gs.studentId)
            if (studentData) {
              const s = studentData as Record<string, unknown>
              const student: Student = {
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
              fullStudents.push(student)
              assignmentMap.set(student.id, gs.id) // Map studentId to groupStudentId
            }
          })

        if (teacher && schoolYear) {
          setGroupDetail({
            id: group.id,
            name: group.name || null,
            teacherId: group.teacherId,
            teacherName: teacher?.fullName || t("groups.noTeacher") || 'Sin maestro',
            schoolYearId: group.schoolYearId,
            schoolYearName: schoolYear.name,
            students: studentList
          })
          setGroupStudents(fullStudents)
          setGroupAssignmentMap(assignmentMap)
        } else {
          toast.error(t("groups.loadError"))
        }

      } catch (error) {
        console.error('Error fetching group detail:', error)
        toast.error(t("groups.loadError"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, userInfo])

  const handleAddStudents = async (studentIds: string[]) => {
    if (!groupDetail || !groupId) return

    try {
      // Fetch the group by ID to get the group name
      const group = await api.groups.getById(groupId)
      if (!group || group.deletedAt) {
        toast.error(t("groups.groupNotFound"))
        return
      }

      // Add students to the existing group
      await api.groups.addStudentsToGroup(groupId, studentIds)

      // Refetch group detail to update the student list
      const updatedGroup = await api.groups.getById(groupId) as GroupDetailResponse
      if (!updatedGroup || updatedGroup.deletedAt) {
        navigate("/groups")
        return
      }

      const updatedStudentsData = await api.students.getAll()
      setAllStudents(updatedStudentsData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))

      const updatedStudentList = updatedGroup.students
        .filter(gs => !gs.deletedAt)
        .map(gs => {
          const student = updatedStudentsData.find((s: { id: string }) => s.id === gs.studentId)
          return {
            id: gs.id,
            studentId: gs.studentId,
            studentName: student?.name || ""
          }
        })
        .filter((s: { studentName: string }) => s.studentName)

      // Update assignment map and full students list
      const updatedAssignmentMap = new Map<string, string>()
      const updatedFullStudents: Student[] = []

      updatedGroup.students
        .filter(gs => !gs.deletedAt)
        .forEach(gs => {
          const studentData = updatedStudentsData.find((s: { id: string }) => s.id === gs.studentId)
          if (studentData) {
            const s = studentData as Record<string, unknown>
            const student: Student = {
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
            updatedFullStudents.push(student)
            updatedAssignmentMap.set(student.id, gs.id)
          }
        })

      setGroupDetail({
        ...groupDetail,
        students: updatedStudentList
      })
      setGroupStudents(updatedFullStudents)
      setGroupAssignmentMap(updatedAssignmentMap)
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("groups.assignmentError"))
      throw error
    }
  }

  const handleDeleteGroup = async () => {
    if (!studentToDelete || !groupDetail || !groupId) return

    // Find the student ID from the groupStudent ID
    const groupStudent = groupDetail.students.find(s => s.id === studentToDelete)
    if (!groupStudent) {
      toast.error(t("groups.studentNotFound"))
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
      return
    }

    try {
      // Remove student from group using studentId
      await api.groups.removeStudentFromGroup(groupId, groupStudent.studentId)
      toast.success(t("groups.deleteAssignmentSuccess"))
      setDeleteDialogOpen(false)
      setStudentToDelete(null)

      // Refetch data
      const group = await api.groups.getById(groupId) as GroupDetailResponse
      if (!group || group.deletedAt) {
        navigate("/groups")
        return
      }

      const studentsData = await api.students.getAll()
      setAllStudents(studentsData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))

      const studentList = group.students
        .filter(gs => !gs.deletedAt)
        .map(gs => {
          const student = studentsData.find((s: { id: string }) => s.id === gs.studentId)
          return {
            id: gs.id,
            studentId: gs.studentId,
            studentName: student?.name || ""
          }
        })
        .filter((s: { studentName: string }) => s.studentName)

      // Create full Student objects and assignment map
      const updatedAssignmentMap = new Map<string, string>()
      const updatedFullStudents: Student[] = []

      group.students
        .filter(gs => !gs.deletedAt)
        .forEach(gs => {
          const studentData = studentsData.find((s: { id: string }) => s.id === gs.studentId)
          if (studentData) {
            const s = studentData as Record<string, unknown>
            const student: Student = {
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
            updatedFullStudents.push(student)
            updatedAssignmentMap.set(student.id, gs.id)
          }
        })

      setGroupDetail({
        ...groupDetail,
        students: studentList
      })
      setGroupStudents(updatedFullStudents)
      setGroupAssignmentMap(updatedAssignmentMap)

      setGroupDetail({
        ...groupDetail,
        students: studentList
      })
      setGroupStudents(updatedFullStudents)
      setGroupAssignmentMap(updatedAssignmentMap)
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || t("groups.deleteAssignmentError"))
    }
  }

  // Filter students by search term
  const filteredStudents = React.useMemo(() => {
    if (!searchTerm) return groupStudents

    return groupStudents.filter((student) =>
      includesIgnoreAccents(student.name.toLowerCase(), searchTerm.toLowerCase())
    )
  }, [groupStudents, searchTerm])

  // Sort students
  const filteredAndSortedStudents = React.useMemo(() => {
    const result = [...filteredStudents]

    if (sortField) {
      result.sort((a, b) => {
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
  }, [filteredStudents, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage)
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedStudents.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedStudents, currentPage, itemsPerPage])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortField, sortDirection])

  const handleSort = (field: "firstName" | "lastName") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleStudentSelect = (student: Student) => {
    navigate(`/students/${student.id}`)
  }

  const handleRemoveFromGroup = (_student: Student, assignmentId: string) => {
    setStudentToDelete(assignmentId)
    setDeleteDialogOpen(true)
  }

  if (isLoading) {
    return <Loading variant="list" />
  }

  if (!groupDetail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t("groups.groupNotFound")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManage = userInfo?.permissions.includes('groups.update') || userInfo?.permissions.includes('groups.delete')

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <Button variant="ghost" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
      </div>

      <PageHeader
        title={groupDetail.name || t("groups.defaultGroupName")}
        description={`${groupDetail.teacherName} - ${groupDetail.schoolYearName}`}
      />

      {/* Add Students Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("groups.studentsAssigned")}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {groupDetail.students.length} {t("groups.students")}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddStudentsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("groups.addStudents")}
          </Button>
        )}
      </div>

      {/* Search */}
      <SearchBar
        placeholder={t("groups.searchStudentsPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Students Table */}
      {filteredAndSortedStudents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm
                ? t("groups.noStudentsFound")
                : t("groups.noStudentsAssigned")}
            </p>
          </CardContent>
        </Card>
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
          onRemoveFromGroup={canManage ? handleRemoveFromGroup : undefined}
          groupAssignmentMap={canManage ? groupAssignmentMap : undefined}
          showRemoveFromGroup={canManage}
        />
      )}

      {/* Add Students Dialog */}
      {groupDetail && (
        <AddStudentsDialog
          open={addStudentsDialogOpen}
          onOpenChange={setAddStudentsDialogOpen}
          teacherId={groupDetail.teacherId}
          schoolYearId={groupDetail.schoolYearId}
          groupName={groupDetail.name}
          students={allStudents}
          existingAssignments={existingAssignments}
          onSave={handleAddStudents}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.deleteAssignment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("groups.deleteAssignmentConfirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
