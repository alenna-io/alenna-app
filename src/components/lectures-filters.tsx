import { GenericFilters } from "@/components/ui/generic-filters"
import type { FilterField } from "@/components/ui/generic-filters"
import { useTranslation } from "react-i18next"

interface Filters extends Record<string, string> {
  category: string
  level: string
  subject: string
}

interface LecturesFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  totalLectures: number
  filteredCount: number
  categories: string[]
  levels: string[]
  subjects: Array<{ id: string; name: string }> // All subjects for filter dropdown
}

export function LecturesFilters({
  filters,
  onFiltersChange,
  totalLectures,
  filteredCount,
  categories,
  levels,
  subjects // All subjects for the filter dropdown
}: LecturesFiltersProps) {
  const { t } = useTranslation()

  const filterFields: FilterField[] = [
    {
      key: "category",
      label: t("lectures.category") || "Category",
      type: "select",
      color: "bg-blue-500",
      placeholder: t("lectures.allCategories") || "All Categories",
      options: [
        { value: "all", label: t("lectures.allCategories") || "All Categories" },
        ...categories.map(cat => ({
          value: cat,
          label: cat
        }))
      ]
    },
    {
      key: "level",
      label: t("lectures.level") || "Level",
      type: "select",
      color: "bg-green-500",
      placeholder: t("lectures.allLevels") || "All Levels",
      options: [
        { value: "all", label: t("lectures.allLevels") || "All Levels" },
        ...levels.map(level => ({
          value: level,
          label: level
        }))
      ]
    },
    {
      key: "subject",
      label: t("lectures.subject") || "Subject",
      type: "select",
      color: "bg-purple-500",
      placeholder: t("lectures.allSubjects") || "All Subjects",
      options: [
        { value: "all", label: t("lectures.allSubjects") || "All Subjects" },
        ...subjects
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(subject => ({
            value: subject.id,
            label: subject.name
          }))
      ]
    }
  ]

  const getActiveFilterLabels = (currentFilters: Filters) => {
    const labels: string[] = []
    if (currentFilters.category && currentFilters.category !== "all") {
      labels.push(`${filterFields[0].label}: ${currentFilters.category}`)
    }
    if (currentFilters.level && currentFilters.level !== "all") {
      labels.push(`${filterFields[1].label}: ${currentFilters.level}`)
    }
    if (currentFilters.subject && currentFilters.subject !== "all") {
      const subject = subjects.find(s => s.id === currentFilters.subject)
      if (subject) {
        labels.push(`${filterFields[2].label}: ${subject.name}`)
      }
    }
    return labels
  }

  // Handle filter change - all filters work together with AND logic
  const handleFiltersChange = (newFilters: Filters) => {
    onFiltersChange(newFilters)
  }

  return (
    <GenericFilters<Filters>
      filters={filters}
      onFiltersChange={handleFiltersChange}
      totalItems={totalLectures}
      filteredCount={filteredCount}
      fields={filterFields}
      getActiveFilterLabels={getActiveFilterLabels}
    />
  )
}

