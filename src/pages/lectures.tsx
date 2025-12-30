import * as React from "react"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/ui/page-header"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useApi } from "@/services/api"
import { useTranslation } from "react-i18next"
import { includesIgnoreAccents } from "@/lib/string-utils"
import { LecturesFilters } from "@/components/lectures-filters"
import { SearchBar } from "@/components/ui/search-bar"
import { LecturesTable } from "@/components/lectures-table"

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
  categoryName: string
  levelId: string
}

export default function LecturesPage() {
  const api = useApi()
  const { t } = useTranslation()
  const [allLectures, setAllLectures] = React.useState<PaceCatalogItem[]>([])
  const [subjects, setSubjects] = React.useState<SubSubject[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<{ category: string; level: string; subject: string }>({
    category: "all",
    level: "all",
    subject: "all"
  })
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortField, setSortField] = React.useState<"code" | "name" | "category" | "subject" | "level" | null>("code")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
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


  // Fetch all subjects first
  React.useEffect(() => {
    let cancelled = false
    const fetchSubjects = async () => {
      try {
        const allSubjects = await api.subjects.getAll()
        if (!cancelled) {
          setSubjects(allSubjects as SubSubject[])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching subjects:', err)
          setError(err instanceof Error ? err.message : 'Failed to load subjects')
        }
      }
    }
    fetchSubjects()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch all lectures once on mount
  React.useEffect(() => {
    let cancelled = false

    const fetchAllLectures = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch all lectures at once
        const data = await api.paceCatalog.get({})

        if (!cancelled) {
          setAllLectures(data as PaceCatalogItem[])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching lectures:', err)
          setError(err instanceof Error ? err.message : 'Failed to load lectures')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchAllLectures()

    return () => {
      cancelled = true
    }
    // Only fetch once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  }, [searchTerm, filters, sortField, sortDirection])

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

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("lectures.title") || "Lectures"}
          description={t("lectures.description") || "Browse and search the lectures catalog"}
        />
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("lectures.title") || "Lectures"}
        description={t("lectures.description") || "Browse and search the lectures catalog"}
      />

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

      {/* Lectures Table */}
      {isLoading ? (
        <Loading variant="section" />
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
        />
      )}
    </div>
  )
}

