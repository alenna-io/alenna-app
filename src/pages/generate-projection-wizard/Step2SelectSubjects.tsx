import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { SubjectCard } from "./SubjectCard"
import type { SubjectConfig } from "./types"

interface Subject {
  id: string
  name: string
  categoryId: string
}

interface Step2SelectSubjectsProps {
  subjects: SubjectConfig[]
  onAddSubject: () => void
  onRemoveSubject: (index: number) => void
  onSubjectSelect: (index: number, subjectId: string) => void
  onSubjectChange: (index: number, field: keyof SubjectConfig, value: unknown) => void
  onSkipPaceChange: (index: number, pace: number, checked: boolean) => void
  onNotPairWithChange: (index: number, otherSubjectId: string, checked: boolean) => void
  expandedSubjectIndex: number | null
  onToggleExpand: (index: number) => void
  getAvailablePacesForSubject: (index: number) => number[]
  loadingPaces: Record<string, boolean>
  subjectsByCategory: Record<string, Subject[]>
  getAvailableSubjectsForIndex: (index: number) => Subject[]
  subjectSearchTerms: Record<number, string>
  onSearchChange: (index: number, value: string) => void
  openSubjectPopoverIndex: number | null
  onOpenPopoverChange: (index: number | null) => void
  getSubjectName: (subjectId: string) => string
  getNextLevelsCount: (index: number) => number
  getCategoryName: (categoryId: string) => string
  onBack: () => void
  onNext: () => void
  canProceed: boolean
}

export const Step2SelectSubjects = React.memo(function Step2SelectSubjects({
  subjects,
  onAddSubject,
  onRemoveSubject,
  onSubjectSelect,
  onSubjectChange,
  onSkipPaceChange,
  onNotPairWithChange,
  expandedSubjectIndex,
  onToggleExpand,
  getAvailablePacesForSubject,
  loadingPaces,
  subjectsByCategory,
  getAvailableSubjectsForIndex,
  subjectSearchTerms,
  onSearchChange,
  openSubjectPopoverIndex,
  onOpenPopoverChange,
  getSubjectName,
  getNextLevelsCount,
  getCategoryName,
  onBack,
  onNext,
  canProceed,
}: Step2SelectSubjectsProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>{t("projections.step2Title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t("projections.clickToAddSubject")}
          </div>
        )}

        {subjects.map((subject, index) => {
          const availablePaces = getAvailablePacesForSubject(index)
          const otherSubjects = subjects
            .map((s, i) => ({ id: `subject-${i}`, subjectId: s.subjectId }))
            .filter((s, i) => i !== index && s.subjectId)

          return (
            <SubjectCard
              key={`subject-${index}-${subject.subjectId || 'empty'}`}
              index={index}
              subject={subject}
              isExpanded={expandedSubjectIndex === index}
              onToggleExpand={() => onToggleExpand(index)}
              onRemove={() => onRemoveSubject(index)}
              canRemove={index > 0}
              availablePaces={availablePaces}
              loadingPaces={loadingPaces[subject.subjectId] || false}
              onSubjectSelect={(subjectId) => onSubjectSelect(index, subjectId)}
              onSubjectChange={(field, value) => onSubjectChange(index, field, value)}
              onSkipPaceChange={(pace, checked) => onSkipPaceChange(index, pace, checked)}
              onNotPairWithChange={(otherSubjectId, checked) =>
                onNotPairWithChange(index, otherSubjectId, checked)
              }
              otherSubjects={otherSubjects}
              subjectsByCategory={subjectsByCategory}
              availableSubjects={getAvailableSubjectsForIndex(index)}
              subjectSearchTerm={subjectSearchTerms[index] || ""}
              onSearchChange={(value) => onSearchChange(index, value)}
              openPopover={openSubjectPopoverIndex === index}
              onOpenPopoverChange={(open) => onOpenPopoverChange(open ? index : null)}
              getSubjectName={getSubjectName}
              getNextLevelsCount={getNextLevelsCount}
              getCategoryName={getCategoryName}
            />
          )
        })}

        {subjects.length < 6 && (
          <Button
            variant="outline"
            onClick={onAddSubject}
            className="w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("projections.addSubject")}
          </Button>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("common.previous")}
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
})
