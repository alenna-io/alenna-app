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
import { usePersistedState } from "@/hooks/use-table-state"
import { CreateSubjectDialog } from "@/components/create-subject-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
  const api = useApi()
  const { t } = useTranslation()
  const [allLectures, setAllLectures] = React.useState<PaceCatalogItem[]>([])
  const [subjects, setSubjects] = React.useState<SubSubject[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

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

  // Extract unique categories with IDs and levels with IDs for the dialog
  const categoriesWithIds = React.useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>()
    subjects.forEach(s => {
      if (!categoryMap.has(s.categoryName) && s.categoryId) {
        categoryMap.set(s.categoryName, {
          id: s.categoryId,
          name: s.categoryName,
        })
      }
    })
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [subjects])

  const levelsWithIds = React.useMemo(() => {
    const levelMap = new Map<string, { id: string; name: string; number?: number }>()
    subjects.forEach(s => {
      if (!levelMap.has(s.levelId)) {
        levelMap.set(s.levelId, {
          id: s.levelId,
          name: s.levelName || s.levelId,
          number: s.levelNumber,
        })
      }
    })
    return Array.from(levelMap.values()).sort((a, b) => {
      if (a.number !== undefined && b.number !== undefined) {
        return a.number - b.number
      }
      if (a.number !== undefined) return -1
      if (b.number !== undefined) return 1
      return a.name.localeCompare(b.name)
    })
  }, [subjects])

  const handleSubjectCreated = async () => {
    // Refresh subjects and lectures
    try {
      const allSubjects = await api.subjects.getAll()
      setSubjects(allSubjects as SubSubject[])

      const data = await api.paceCatalog.get({})
      setAllLectures(data as PaceCatalogItem[])
    } catch (err) {
      console.error('Error refreshing data:', err)
    }
  }


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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      <CreateSubjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleSubjectCreated}
        categories={categoriesWithIds}
        levels={levelsWithIds}
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

