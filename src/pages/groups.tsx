import * as React from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { useTranslation } from "react-i18next"
import { GroupsTable } from "@/components/groups-table"
import { GroupsFilters } from "@/components/groups-filters"
import { SearchBar } from "@/components/ui/search-bar"
import { includesIgnoreAccents } from "@/lib/string-utils"

interface GroupFromAPI {
  id: string
  name?: string | null
  teacherId: string
  schoolYearId: string
  studentCount?: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface GroupDisplay {
  id: string
  name: string | null
  teacherId: string
  teacherName: string
  schoolYearId: string
  schoolYearName: string
  studentCount: number
  students: Array<{ id: string; studentId: string; studentName: string }>
}

interface Filters extends Record<string, string> {
  schoolYear: string
  teacher: string
}

export default function GroupsPage() {
  const api = useApi()
  const navigate = useNavigate()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { hasModule } = useModuleAccess()
  const { t } = useTranslation()

  // Check if teachers module is enabled
  const hasTeachersModule = hasModule('teachers')
  const [isLoading, setIsLoading] = React.useState(true)
  const [schoolYears, setSchoolYears] = React.useState<Array<{ id: string; name: string; isActive: boolean }>>([])
  const [teachers, setTeachers] = React.useState<Array<{ id: string; fullName: string }>>([])
  const [allGroups, setAllGroups] = React.useState<GroupDisplay[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>({
    schoolYear: "",
    teacher: ""
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Check if user is school admin
  const isSchoolAdmin = React.useMemo(() => {
    return userInfo?.roles.some((role) => role.name === 'SCHOOL_ADMIN') ?? false
  }, [userInfo])

  React.useEffect(() => {
    const fetchData = async () => {
      // Only fetch if user is a school admin and has schoolId
      if (!isSchoolAdmin || !userInfo || !userInfo.schoolId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // Fetch school years
        const schoolYearsData = await api.schoolYears.getAll()
        setSchoolYears(schoolYearsData)

        // Set active school year as default filter
        const activeYear = schoolYearsData.find((sy: { isActive: boolean }) => sy.isActive)
        if (activeYear) {
          setFilters(prev => ({ ...prev, schoolYear: activeYear.id }))
        }

        // Fetch teachers only if teachers module is enabled
        let teachersList: Array<{ id: string; fullName: string }> = []
        if (hasTeachersModule) {
          try {
            const teachersData = await api.schools.getMyTeachers()
            teachersList = teachersData.map((t: { id: string; fullName: string }) => ({ id: t.id, fullName: t.fullName }))
            setTeachers(teachersList)
          } catch (error) {
            console.warn('Could not fetch teachers (module may not be enabled):', error)
            // Continue without teachers - groups can still be displayed
          }
        }

        // Fetch all groups from all school years
        const allGroupsData: GroupFromAPI[] = []
        for (const year of schoolYearsData) {
          try {
            const groupsData = await api.groups.getBySchoolYear(year.id)
            allGroupsData.push(...groupsData)
          } catch (error) {
            // Silently skip years we can't access
            console.error(`Error fetching groups for year ${year.id}:`, error)
          }
        }

        // Map groups to display format (no longer need logical grouping - API returns distinct groups)
        const grouped: GroupDisplay[] = allGroupsData
          .filter((group: GroupFromAPI) => !group.deletedAt)
          .map((group: GroupFromAPI) => {
            const teacher = teachersList.find((t: { id: string }) => t.id === group.teacherId)
            const schoolYear = schoolYearsData.find((sy: { id: string }) => sy.id === group.schoolYearId)

            // Allow groups even without teacher (when teachers module is disabled)
            if (!schoolYear) return null

            return {
              id: group.id,
              name: group.name || null,
              teacherId: group.teacherId,
              teacherName: teacher?.fullName || t("groups.noTeacher") || 'Sin maestro',
              schoolYearId: group.schoolYearId,
              schoolYearName: schoolYear.name,
              studentCount: group.studentCount || 0,
              students: [] as Array<{ id: string; studentId: string; studentName: string }>
            }
          })
          .filter((g): g is GroupDisplay => g !== null)

        setAllGroups(grouped)
      } catch (error) {
        console.error('Error fetching groups data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!isLoadingUser && userInfo) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, isSchoolAdmin, isLoadingUser])

  // Filter and search groups - must be before early returns
  const filteredGroups = React.useMemo(() => {
    const result = allGroups.filter((group) => {
      // Search filter
      const matchesSearch = !searchTerm ||
        includesIgnoreAccents(group.teacherName.toLowerCase(), searchTerm.toLowerCase()) ||
        (group.name && includesIgnoreAccents(group.name.toLowerCase(), searchTerm.toLowerCase()))

      // School year filter
      const matchesSchoolYear = !filters.schoolYear || group.schoolYearId === filters.schoolYear

      // Teacher filter
      const matchesTeacher = !filters.teacher || group.teacherId === filters.teacher

      return matchesSearch && matchesSchoolYear && matchesTeacher
    })

    // Sort by teacher name
    return [...result].sort((a, b) => a.teacherName.localeCompare(b.teacherName))
  }, [allGroups, searchTerm, filters])

  // Pagination - must be before early returns
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)
  const paginatedGroups = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredGroups.slice(start, end)
  }, [filteredGroups, currentPage])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const handleViewDetails = (groupId: string) => {
    navigate(`/groups/${groupId}`)
  }

  const canCreateGroups = React.useMemo(() => {
    const selectedYear = filters.schoolYear
      ? schoolYears.find(sy => sy.id === filters.schoolYear)
      : schoolYears.find(sy => sy.isActive)
    return selectedYear?.isActive ?? false
  }, [filters.schoolYear, schoolYears])

  if (isLoadingUser || isLoading) {
    return <Loading variant="list-page" showCreateButton={true} view="table" showFilters={true} />
  }

  // Only school admins can access groups
  if (!isSchoolAdmin) {
    return <Navigate to="/404" replace />
  }

  const selectedYear = filters.schoolYear
    ? schoolYears.find(y => y.id === filters.schoolYear)
    : schoolYears.find(y => y.isActive)

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
        <PageHeader
          moduleKey="groups"
          title={t("groups.title")}
          description={t("groups.description")}
        />
        {selectedYear?.isActive && (
          <Button
            onClick={() => {
              if (selectedYear) {
                navigate(`/groups/create?schoolYearId=${selectedYear.id}`)
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("groups.createGroup")}
          </Button>
        )}
      </div>

      {/* Search */}
      <SearchBar
        placeholder={t("groups.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filters */}
      <GroupsFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalGroups={allGroups.length}
        filteredCount={filteredGroups.length}
        schoolYears={schoolYears}
        teachers={teachers}
      />

      {/* Groups Table */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm || filters.schoolYear || filters.teacher
            ? t("groups.noGroupsFound")
            : t("groups.noGroups")}
        </div>
      ) : (
        <GroupsTable
          groups={paginatedGroups}
          onViewDetails={handleViewDetails}
          canManage={canCreateGroups}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredGroups.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
