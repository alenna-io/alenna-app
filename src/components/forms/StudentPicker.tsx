import * as React from "react"
import { useTranslation } from "react-i18next"
import { SearchablePicker } from "./SearchablePicker"
import type { SearchablePickerOption } from "./SearchablePicker"
import { includesIgnoreAccents } from "@/lib/string-utils"

interface Student {
  id: string
  user?: {
    firstName?: string | null
    lastName?: string | null
  } | null
}

interface StudentPickerProps {
  label: string
  required?: boolean
  value: string
  onValueChange: (studentId: string) => void
  placeholder?: string
  students: Student[]
  searchTerm: string
  onSearchChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  getStudentName: (studentId: string) => string
  disabled?: boolean
  className?: string
}

export function StudentPicker({
  label,
  required = false,
  value,
  onValueChange,
  placeholder,
  students,
  searchTerm,
  onSearchChange,
  open,
  onOpenChange,
  getStudentName,
  disabled = false,
  className,
}: StudentPickerProps) {
  const { t } = useTranslation()

  // Convert students to SearchablePickerOption format
  const studentOptions: Array<SearchablePickerOption> = React.useMemo(() => {
    return students.map(student => ({
      id: student.id,
      label: getStudentName(student.id),
    }))
  }, [students, getStudentName])

  return (
    <SearchablePicker
      label={label}
      required={required}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      options={studentOptions}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      open={open}
      onOpenChange={onOpenChange}
      getDisplayValue={getStudentName}
      searchPlaceholder={t("projections.searchStudent")}
      emptyMessage={t("projections.noStudentsFound")}
      filterOptions={(option, searchTerm) => {
        const student = students.find(s => s.id === option.id)
        if (!student) return false
        const firstName = student.user?.firstName || ""
        const lastName = student.user?.lastName || ""
        return includesIgnoreAccents(firstName, searchTerm) || includesIgnoreAccents(lastName, searchTerm)
      }}
      className={className}
      disabled={disabled}
    />
  )
}
