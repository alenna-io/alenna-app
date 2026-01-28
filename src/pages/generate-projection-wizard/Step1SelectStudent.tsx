import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Student } from "@/services/api"
import { StudentPicker } from "@/components/forms/StudentPicker"

interface Step1SelectStudentProps {
  students: Student[]
  selectedStudentId: string
  onStudentSelect: (studentId: string) => void
  studentSearchTerm: string
  onSearchChange: (value: string) => void
  openStudentPopover: boolean
  onOpenPopoverChange: (open: boolean) => void
  activeSchoolYear: { id: string; name: string } | null
  onNext: () => void
  onCancel: () => void
  canProceed: boolean
}

export function Step1SelectStudent({
  students,
  selectedStudentId,
  onStudentSelect,
  studentSearchTerm,
  onSearchChange,
  openStudentPopover,
  onOpenPopoverChange,
  activeSchoolYear,
  onNext,
  onCancel,
  canProceed,
}: Step1SelectStudentProps) {
  const { t } = useTranslation()

  const getStudentName = React.useCallback((studentId: string): string => {
    const student = students.find(s => s.id === studentId)
    if (!student) return ""
    return `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim()
  }, [students])

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <CardTitle>{t("projections.step1Title")}</CardTitle>
          {activeSchoolYear && (
            <Badge variant="primary-soft">
              {t("projections.schoolYear")}: {activeSchoolYear.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <StudentPicker
          label={t("common.student")}
          required
          value={selectedStudentId}
          onValueChange={onStudentSelect}
          placeholder={t("projections.selectStudent")}
          students={students}
          searchTerm={studentSearchTerm}
          onSearchChange={onSearchChange}
          open={openStudentPopover}
          onOpenChange={onOpenPopoverChange}
          getStudentName={getStudentName}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
          >
            {t("common.next")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
