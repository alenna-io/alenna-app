import * as React from "react"
import { useTranslation } from "react-i18next"
import { SearchablePicker } from "./SearchablePicker"
import type { SearchablePickerOption } from "./SearchablePicker"
import { includesIgnoreAccents } from "@/lib/string-utils"

interface Subject {
  id: string
  name: string
  categoryId: string
  categoryName?: string
}

interface SubjectPickerProps {
  label: string
  required?: boolean
  value: string
  onValueChange: (subjectId: string) => void
  placeholder?: string
  subjectsByCategory: Record<string, Subject[]>
  availableSubjects: Subject[]
  searchTerm: string
  onSearchChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  getSubjectName: (subjectId: string) => string
}

export function SubjectPicker({
  label,
  required = false,
  value,
  onValueChange,
  placeholder,
  subjectsByCategory,
  availableSubjects,
  searchTerm,
  onSearchChange,
  open,
  onOpenChange,
  getSubjectName,
}: SubjectPickerProps) {
  const { t } = useTranslation()

  // Flatten all subjects into an array with group information
  const allSubjects: Array<SearchablePickerOption & { categoryName: string }> = React.useMemo(() => {
    const subjects: Array<SearchablePickerOption & { categoryName: string }> = []
    Object.entries(subjectsByCategory).forEach(([categoryName, categorySubjects]) => {
      categorySubjects.forEach(subject => {
        subjects.push({
          id: subject.id,
          label: subject.name,
          categoryName,
          group: categoryName,
        })
      })
    })
    return subjects
  }, [subjectsByCategory])

  // Filter available subjects
  const availableSubjectsArray = React.useMemo(() => {
    const availableIds = new Set(availableSubjects.map(s => s.id))
    return allSubjects.filter(s => availableIds.has(s.id))
  }, [allSubjects, availableSubjects])

  return (
    <SearchablePicker
      label={label}
      required={required}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      options={allSubjects}
      availableOptions={availableSubjectsArray}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      open={open}
      onOpenChange={onOpenChange}
      getDisplayValue={getSubjectName}
      searchPlaceholder={t("projections.searchSubject")}
      emptyMessage={t("projections.noSubjectsFound")}
      groupBy={(option) => (option as { categoryName: string }).categoryName || null}
      filterOptions={(option, searchTerm) => {
        const subject = option as { label: string; categoryName: string }
        return includesIgnoreAccents(subject.label, searchTerm) ||
          includesIgnoreAccents(subject.categoryName, searchTerm)
      }}
    />
  )
}
