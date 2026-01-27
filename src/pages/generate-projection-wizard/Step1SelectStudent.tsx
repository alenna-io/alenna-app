import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import type { Student } from "@/services/api"

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

  const filteredStudents = React.useMemo(() => {
    if (!studentSearchTerm) return students
    const searchLower = studentSearchTerm.toLowerCase()
    return students.filter(s => {
      const firstName = s.user?.firstName?.toLowerCase() || ""
      const lastName = s.user?.lastName?.toLowerCase() || ""
      return firstName.includes(searchLower) || lastName.includes(searchLower)
    })
  }, [students, studentSearchTerm])

  const selectedStudent = React.useMemo(() => {
    return students.find(s => s.id === selectedStudentId)
  }, [students, selectedStudentId])

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
        <div className="space-y-2">
          <Label>{t("common.student")} <span className="text-red-500">*</span></Label>
          <Popover open={openStudentPopover} onOpenChange={onOpenPopoverChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between transition-all duration-200 hover:border-primary/50"
              >
                {selectedStudent
                  ? `${selectedStudent.user?.firstName} ${selectedStudent.user?.lastName}`
                  : t("projections.selectStudent")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={t("projections.searchStudent")}
                  value={studentSearchTerm}
                  onValueChange={onSearchChange}
                  className="cursor-pointer"
                />
                <CommandList>
                  <CommandEmpty>{t("projections.noStudentsFound")}</CommandEmpty>
                  <CommandGroup>
                    {filteredStudents.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={`${student.user?.firstName} ${student.user?.lastName}`}
                        onSelect={() => {
                          onStudentSelect(student.id)
                          onOpenPopoverChange(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{student.user?.firstName} {student.user?.lastName}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

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
