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
import { Plus } from "lucide-react"
import { TeacherFormDialog } from "@/components/teacher-form-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

type SortField = "firstName" | "lastName" | null
type SortDirection = "asc" | "desc"

export default function TeachersPage() {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const { userInfo } = useUser()
  const { t } = useTranslation()
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [view, setView] = React.useState<"cards" | "table">("table")
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = React.useState(false)
  const [school, setSchool] = React.useState<{ userLimit?: number; teacherLimit?: number } | null>(null)
  const [teachersCount, setTeachersCount] = React.useState<number>(0)
  const itemsPerPage = 10

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  // Only SCHOOL_ADMIN can access this page
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')

  React.useEffect(() => {
    if (!isSchoolAdmin && !hasRole('SUPERADMIN')) {
      setHasPermission(false)
      return
    }
  }, [isSchoolAdmin, hasRole])

  // Fetch school info and teachers count for school admins
  React.useEffect(() => {
    if (!isSchoolAdmin) return

    const fetchSchoolInfo = async () => {
      try {
        const targetSchoolId = schoolId || userInfo?.schoolId
        if (!targetSchoolId) return

        const schoolData = await api.schools.getById(targetSchoolId)
        setSchool(schoolData)

        const countData = await api.schools.getTeachersCount(targetSchoolId)
        setTeachersCount(countData.count)
      } catch (err) {
        console.error('Error fetching school info:', err)
      }
    }

    fetchSchoolInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSchoolAdmin, schoolId, userInfo?.schoolId])

  // Fetch teachers list from API
  React.useEffect(() => {
    if (!isSchoolAdmin) {
      setTeachers([])
      setIsLoading(false)
      return
    }

    if (!schoolId && !userInfo?.schoolId) {
      setError("No se pudo determinar la escuela")
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchTeachers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use schoolId from route if available, otherwise use user's school
        const targetSchoolId = schoolId || userInfo?.schoolId
        if (!targetSchoolId) {
          throw new Error("No se pudo determinar la escuela")
        }

        const data = await api.schools.getTeachers(targetSchoolId)

        if (isMounted) {
          // Transform API data to match frontend Teacher type
          const transformedTeachers: Teacher[] = data.map((teacher: unknown) => {
            const t = teacher as Record<string, unknown>
            return {
              id: t.id as string,
              clerkId: t.clerkId as string,
              email: t.email as string,
              firstName: t.firstName as string,
              lastName: t.lastName as string,
              fullName: t.fullName as string,
              schoolId: t.schoolId as string,
              roles: (t.roles || []) as Teacher['roles'],
              primaryRole: t.primaryRole as Teacher['primaryRole'],
            }
          })

          setTeachers(transformedTeachers)
        }
      } catch (err) {
        const error = err as Error
        console.error('Error fetching teachers:', error)
        if (isMounted) {
          // Check if it's a permission error (403)
          if (error.message?.includes('permiso') || error.message?.includes('403')) {
            setHasPermission(false)
          } else {
            setError(error.message || 'Failed to load teachers')
            setTeachers([])
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTeachers()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, isSchoolAdmin, userInfo?.schoolId])

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
    const targetSchoolId = schoolId || userInfo?.schoolId
    if (!targetSchoolId) {
      throw new Error("No se pudo determinar la escuela")
    }
    await api.createUser({ ...data, schoolId: targetSchoolId })
    // Reload teachers and count
    const teachersData = await api.schools.getTeachers(targetSchoolId)
    const transformedTeachers: Teacher[] = teachersData.map((teacher: unknown) => {
      const t = teacher as Record<string, unknown>
      return {
        id: t.id as string,
        clerkId: t.clerkId as string,
        email: t.email as string,
        firstName: t.firstName as string,
        lastName: t.lastName as string,
        fullName: t.fullName as string,
        schoolId: t.schoolId as string,
        roles: (t.roles || []) as Teacher['roles'],
        primaryRole: t.primaryRole as Teacher['primaryRole'],
      }
    })
    setTeachers(transformedTeachers)
    const countData = await api.schools.getTeachersCount(targetSchoolId)
    setTeachersCount(countData.count)
  }

  // Show permission error if user doesn't have access
  if (!hasPermission || !isSchoolAdmin) {
    return <Navigate to="/404" replace />
  }

  // Show loading state
  if (isLoading) {
    return <Loading variant="list" />
  }

  const targetSchoolId = schoolId || userInfo?.schoolId

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
      <div className="flex items-center justify-between">
        <PageHeader
          title={schoolId ? t("teachers.titleForSchool") : t("teachers.title")}
          description={schoolId ? t("teachers.descriptionForSchool") : t("teachers.description")}
        />
        {targetSchoolId && (
          <Button onClick={() => setIsTeacherDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("teachers.addTeacher")}
          </Button>
        )}
      </div>

      {/* Count and Limit Display for School Admins */}
      {isSchoolAdmin && school && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("teachers.registered")}</p>
                <p className="text-2xl font-bold text-green-600">{teachersCount}</p>
              </div>
              {school.teacherLimit && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t("teachers.limit")}</p>
                  <p className="text-2xl font-bold">{school.teacherLimit}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.max(0, school.teacherLimit - teachersCount)} {t("teachers.available")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
          onSave={handleCreateTeacher}
        />
      )}
    </div>
  )
}

