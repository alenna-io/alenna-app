import * as React from "react"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useTranslation } from "react-i18next"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { LecturesFilters } from "@/components/lectures-filters"
import { SearchBar } from "@/components/ui/search-bar"
import { LecturesTable } from "@/components/lectures-table"
import { usePersistedState } from "@/hooks/use-table-state"
import { useLectures, useSubjects } from "@/hooks/queries"

interface PaceCatalogItem {
  id: string
  code: string
  name: string
  subSubjectName: string
  subSubjectId: string
  categoryName: string
  levelId: string
  difficulty?: string
}

interface SubSubject {
  id: string
  name: string
  categoryId: string
  categoryName: string
  levelId: string
  levelName?: string
  levelNumber?: number
}

export default function LecturesPage() {
  const { t } = useTranslation()

  const { data: allLecturesData = [], isLoading: isLoadingLectures, error: lecturesError } = useLectures()
  const { data: subjectsData = [], isLoading: isLoadingSubjects, error: subjectsError } = useSubjects()

  const allLectures = (allLecturesData as unknown[]) as PaceCatalogItem[]
  const subjects = (subjectsData as unknown[]) as SubSubject[]
  const isLoading = isLoadingLectures || isLoadingSubjects
  const error = lecturesError ? (lecturesError as Error).message : (subjectsError ? (subjectsError as Error).message : null)
  const tableId = "lectures"
  const [filters, setFilters] = usePersistedState<{ category: string; level: string; subject: string }>("filters", {
    category: "all",
    level: "all",
    subject: "all"
  }, tableId)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortField, setSortField] = usePersistedState<"code" | "name" | "category" | "subject" | "level" | null>("sortField", "code", tableId)
  const [sortDirection, setSortDirection] = usePersistedState<"asc" | "desc">("sortDirection", "asc", tableId)
  const [currentPage, setCurrentPage] = usePersistedState("currentPage", 1, tableId)
  const itemsPerPage = 10

  // Get unique categories and levels from subjects
  const categories = React.useMemo(() => {
    const cats = new Set<string>()
    subjects.forEach(s => cats.add(s.categoryName))
    return Array.from(cats).sort()
  }, [subjects])

  const levels = React.useMemo(() => {
    const levs = new Set<string>()
    subjects.forEach(s => levs.add(s.levelId))
    return Array.from(levs).sort()
  }, [subjects])

  // Filter lectures by filters and search term (using AND logic for all filters)
  const filteredLectures = React.useMemo(() => {
    let filtered = allLectures

    // Apply all filters with AND logic (all must match)

    // Filter by category if selected
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(lecture => lecture.categoryName === filters.category)
    }

    // Filter by level if selected
    if (filters.level && filters.level !== "all") {
      // Filter by level - we need to check if the lecture's subject matches the level
      const subjectsInLevel = subjects.filter(s => s.levelId === filters.level).map(s => s.id)
      filtered = filtered.filter(lecture => subjectsInLevel.includes(lecture.subSubjectId))
    }

    // Filter by subject if selected (works with category and level - AND logic)
    if (filters.subject && filters.subject !== "all") {
      filtered = filtered.filter(lecture => lecture.subSubjectId === filters.subject)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lecture =>
        includesIgnoreAccents(lecture.name, searchTerm) ||
        includesIgnoreAccents(lecture.code, searchTerm) ||
        includesIgnoreAccents(lecture.subSubjectName, searchTerm) ||
        includesIgnoreAccents(lecture.categoryName, searchTerm)
      )
    }

    return filtered
  }, [allLectures, searchTerm, filters, subjects])

  // Sort lectures
  const sortedLectures = React.useMemo(() => {
    if (!sortField) return filteredLectures

    const sorted = [...filteredLectures].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "code":
          aValue = parseInt(a.code) || 0
          bValue = parseInt(b.code) || 0
          break
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "category":
          aValue = a.categoryName.toLowerCase()
          bValue = b.categoryName.toLowerCase()
          break
        case "subject":
          aValue = a.subSubjectName.toLowerCase()
          bValue = b.subSubjectName.toLowerCase()
          break
        case "level":
          aValue = a.levelId.toLowerCase()
          bValue = b.levelId.toLowerCase()
          break
        default:
          return 0
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      const comparison = String(aValue).localeCompare(String(bValue))
      return sortDirection === "asc" ? comparison : -comparison
    })

    return sorted
  }, [filteredLectures, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedLectures.length / itemsPerPage)
  const paginatedLectures = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedLectures.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedLectures, currentPage, itemsPerPage])

  // Reset to page 1 when filters/sort/search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, sortField, sortDirection, setCurrentPage])

  const handleSort = (field: "code" | "name" | "category" | "subject" | "level") => {
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
    return <Loading variant="list-page" showCreateButton={false} view="table" showFilters={true} />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          moduleKey="paces"
          title={t("lectures.title") || "Lectures"}
          description={t("lectures.description") || "Browse and search the lectures catalog"}
        />
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
          <PageHeader
            moduleKey="paces"
            title={t("lectures.title") || "Lectures"}
            description={t("lectures.description") || "Browse and search the lectures catalog"}
            className="flex-1"
          />
        </div>
      </div>

      {/* Search */}
      <SearchBar
        placeholder={t("lectures.searchPlaceholder") || "Search by name, code, or subject..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filters */}
      <LecturesFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalLectures={allLectures.length}
        filteredCount={filteredLectures.length}
        categories={categories}
        levels={levels}
        subjects={subjects}
      />

      {/* Lectures Content */}
      {sortedLectures.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm
              ? t("lectures.noResults") || "No results found"
              : t("lectures.noLectures") || "No lectures found"}
          </p>
        </div>
      ) : (
        <LecturesTable
          lectures={paginatedLectures}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedLectures.length}
          onPageChange={setCurrentPage}
          loading={false}
          tableId={tableId}
        />
      )}
    </div>
  )
}

