import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { TeachersList } from "@/components/teachers-list"
import { TeachersTable } from "@/components/teachers-table"
import { ViewToggle } from "@/components/view-toggle"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { BackButton } from "@/components/ui/back-button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Navigate } from "react-router-dom"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { useApi } from "@/services/api"
import type { Teacher } from "@/types/teacher"
import { useUser } from "@/contexts/UserContext"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
import { Plus, GraduationCap } from "lucide-react"
import { TeacherFormDialog } from "@/components/teacher-form-dialog"
import { useTranslation } from "react-i18next"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useTeachers, useTeachersCount, useCreateTeacher } from "@/hooks/queries"

type SortField = "firstName" | "lastName" | null
type SortDirection = "asc" | "desc"

export default function TeachersPage() {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo } = useUser()
  const { t } = useTranslation()
  
  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')
  
  const targetSchoolId = schoolId || userInfo?.schoolId
  const { data: teachersData = [], isLoading: isLoadingTeachers, error: teachersError } = useTeachers(targetSchoolId, isSchoolAdmin)
  const { data: teachersCountData, isLoading: isLoadingCount } = useTeachersCount(targetSchoolId, isSchoolAdmin)
  const createTeacherMutation = useCreateTeacher()
  
  const teachers = teachersData
  const teachersCount = teachersCountData?.count || 0
  const isLoading = isLoadingTeachers || isLoadingCount
  const error = teachersError ? (teachersError as Error).message : null
  const [hasPermission, setHasPermission] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [view, setView] = React.useState<"cards" | "table">("table")
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = React.useState(false)
  const [school, setSchool] = React.useState<{ userLimit?: number; teacherLimit?: number } | null>(null)
  const [limitWarningDialog, setLimitWarningDialog] = React.useState<{ open: boolean; title: string; message: string } | null>(null)
  const itemsPerPage = 10

  React.useEffect(() => {
    if (!isSchoolAdmin && !hasRole('SUPERADMIN')) {
      setHasPermission(false)
      return
    }
  }, [isSchoolAdmin, hasRole])

  React.useEffect(() => {
    if (!isSchoolAdmin) return

    const fetchSchoolInfo = async () => {
      try {
        const schoolData = await api.schools.getMy()
        setSchool(schoolData)
      } catch (err) {
        console.error('Error fetching school info:', err)
      }
    }

    fetchSchoolInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSchoolAdmin])
  
  React.useEffect(() => {
    if (teachersError && ((teachersError as Error).message?.includes('permiso') || (teachersError as Error).message?.includes('403'))) {
      setHasPermission(false)
    }
  }, [teachersError])

  // Filter, search, and sort logic
  const filteredAndSortedTeachers = React.useMemo(() => {
    // Filter teachers
    let result = teachers.filter((teacher) => {
      // Search filter (accent-insensitive)
      const matchesSearch =
        includesIgnoreAccents(teacher.fullName, searchTerm) ||
        includesIgnoreAccents(teacher.email, searchTerm) ||
        includesIgnoreAccents(teacher.firstName, searchTerm) ||
        includesIgnoreAccents(teacher.lastName, searchTerm)

      return matchesSearch
    })

    // Sort teachers
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
  }, [teachers, searchTerm, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTeachers.length / itemsPerPage)
  const paginatedTeachers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedTeachers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedTeachers, currentPage, itemsPerPage])

  // Reset to page 1 when filters/search/sort changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortField, sortDirection])

  const handleTeacherSelect = (teacher: Teacher) => {
    // Navigate to user detail page for editing
    navigate(`/users/${teacher.id}`, { state: { fromTeachers: true } })
  }

  const handleBackToList = () => {
    if (schoolId) {
      navigate(`/school-settings/school-info`)
    } else {
      navigate('/school-settings/school-info')
    }
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

  const handleCreateTeacher = async (data: {
    clerkId: string
    email: string
    firstName: string
    lastName: string
    roleIds: string[]
  }) => {
    if (!targetSchoolId) {
      throw new Error("No se pudo determinar la escuela")
    }
    await createTeacherMutation.mutateAsync({ ...data, schoolId: targetSchoolId })
  }

  // Show permission error if user doesn't have access
  if (!hasPermission || !isSchoolAdmin) {
    return <Navigate to="/404" replace />
  }

  // Show loading state
  if (isLoading) {
    return <Loading variant="list-page" showCreateButton={false} view="table" showFilters={false} />
  }

  // Show admin/teacher teachers list
  return (
    <div className="space-y-6">
      {/* Mobile back button for school context */}
      {schoolId && (
        <div className="md:hidden">
          <BackButton onClick={handleBackToList}>
            {t("teachers.backToSchoolInfo")}
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
            moduleKey="teachers"
            title={schoolId ? t("teachers.titleForSchool") : t("teachers.title")}
            description={schoolId ? t("teachers.descriptionForSchool") : t("teachers.description")}
            className="flex-1"
          />
          {targetSchoolId && (
            <Button
              onClick={() => {
                // Check if limit is reached
                if (school?.teacherLimit && teachersCount >= school.teacherLimit) {
                  setLimitWarningDialog({
                    open: true,
                    title: t("teachers.limitReached"),
                    message: t("teachers.limitReachedMessage", { limit: school.teacherLimit })
                  })
                } else {
                  setIsTeacherDialogOpen(true)
                }
              }}
              disabled={school?.teacherLimit ? teachersCount >= school.teacherLimit : false}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("teachers.addTeacher")}
            </Button>
          )}
        </div>

        {/* Count and Limit Display - Compact inline */}
        {isSchoolAdmin && school && school.teacherLimit && (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{t("teachers.registered")}:</span>
            <span className="text-base font-semibold text-green-600">
              {teachersCount}/{school.teacherLimit}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <SearchBar
        placeholder={t("teachers.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-end md:items-start">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Teachers Content */}
      {filteredAndSortedTeachers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm
              ? t("teachers.noResults")
              : t("teachers.noTeachers")}
          </p>
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <TeachersList
              teachers={paginatedTeachers}
              onTeacherSelect={handleTeacherSelect}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedTeachers.length}
              onPageChange={setCurrentPage}
            />
          ) : (
            <TeachersTable
              teachers={paginatedTeachers}
              onTeacherSelect={handleTeacherSelect}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedTeachers.length}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Teacher Form Dialog */}
      {targetSchoolId && (
        <TeacherFormDialog
          open={isTeacherDialogOpen}
          onOpenChange={(open) => {
            setIsTeacherDialogOpen(open)
          }}
          schoolId={targetSchoolId}
          school={school || undefined}
          teachersCount={teachersCount}
          onSave={handleCreateTeacher}
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
    </div>
  )
}

