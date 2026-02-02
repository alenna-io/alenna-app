import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ChevronUp, ChevronDown, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { SubjectPicker, SelectField } from "@/components/forms"
import type { SubjectConfig } from "./types"

interface Subject {
  id: string
  name: string
  categoryId: string
}

interface SubjectCardProps {
  index: number
  subject: SubjectConfig
  isExpanded: boolean
  onToggleExpand: () => void
  onRemove: () => void
  canRemove: boolean
  availablePaces: number[]
  loadingPaces: boolean
  onSubjectSelect: (subjectId: string) => void
  onSubjectChange: (field: keyof SubjectConfig, value: unknown) => void
  onSkipPaceChange: (pace: number, checked: boolean) => void
  onNotPairWithChange: (otherSubjectId: string | null) => void
  otherSubjects: Array<{ id: string; subjectId: string }>
  subjectsByCategory: Record<string, Subject[]>
  availableSubjects: Subject[]
  subjectSearchTerm: string
  onSearchChange: (value: string) => void
  openPopover: boolean
  onOpenPopoverChange: (open: boolean) => void
  getSubjectName: (subjectId: string) => string
  getNextLevelsCount: (index: number) => number
  getCategoryName: (categoryId: string) => string
  isIncomplete?: boolean
  isAbandoned?: boolean
}

export const SubjectCard = React.memo(function SubjectCard({
  index,
  subject,
  isExpanded,
  onToggleExpand,
  onRemove,
  canRemove,
  availablePaces,
  loadingPaces,
  onSubjectSelect,
  onSubjectChange,
  onSkipPaceChange,
  onNotPairWithChange,
  otherSubjects,
  subjectsByCategory,
  availableSubjects,
  subjectSearchTerm,
  onSearchChange,
  openPopover,
  onOpenPopoverChange,
  getSubjectName,
  getNextLevelsCount,
  getCategoryName,
  isIncomplete = false,
  isAbandoned = false,
}: SubjectCardProps) {
  const { t } = useTranslation()

  const selectedPaceRange = React.useMemo(() => {
    if (subject.startPace > 0 && subject.endPace > 0) {
      return Array.from(
        { length: subject.endPace - subject.startPace + 1 },
        (_, i) => subject.startPace + i
      ).filter(p => availablePaces.includes(p))
    }
    return []
  }, [subject.startPace, subject.endPace, availablePaces])

  const isIncompleteCheck = React.useMemo(() => {
    if (!subject.subjectId || subject.subjectId.trim() === "") {
      return false
    }
    const startPaceValid = subject.startPace != null &&
      typeof subject.startPace === 'number' &&
      Number.isInteger(subject.startPace) &&
      subject.startPace >= 1
    const endPaceValid = subject.endPace != null &&
      typeof subject.endPace === 'number' &&
      Number.isInteger(subject.endPace) &&
      subject.endPace >= 1
    return !startPaceValid || !endPaceValid || (startPaceValid && endPaceValid && subject.startPace >= subject.endPace)
  }, [subject.subjectId, subject.startPace, subject.endPace])

  const showIncompleteWarning = isIncomplete || isIncompleteCheck
  // Only show the alert when expanded if the subject is incomplete AND abandoned (user moved on)
  const showAlertWhenExpanded = showIncompleteWarning && isExpanded && isAbandoned

  return (
    <Card className={cn("border shadow-none", showIncompleteWarning && !isExpanded && "border-orange-300 bg-orange-50/30")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity duration-150 cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <p className="font-semibold text-md">
              {subject.subjectId ? getSubjectName(subject.subjectId) : `${t("projections.subject")} ${index + 1}`}
            </p>
            {showIncompleteWarning && !isExpanded && (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
          </button>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-150 ease-out will-change-[grid-template-rows,opacity]",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 pt-0">
              {showAlertWhenExpanded && (
                <Alert variant="destructive" className="bg-orange-50! border-orange-200! text-orange-500! rounded-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {t("projections.subjectIncompleteWarning") || "Esta materia está incompleta. Por favor configura el pace inicial y final."}
                  </AlertDescription>
                </Alert>
              )}
              <SubjectPicker
                label={t("projections.subject")}
                required
                value={subject.subjectId}
                onValueChange={onSubjectSelect}
                placeholder={t("projections.selectSubject")}
                subjectsByCategory={subjectsByCategory}
                availableSubjects={availableSubjects}
                searchTerm={subjectSearchTerm}
                onSearchChange={onSearchChange}
                open={openPopover}
                onOpenChange={onOpenPopoverChange}
                getSubjectName={getSubjectName}
              />

              {subject.subjectId && (
                <>
                  {loadingPaces ? (
                    <div className="text-sm text-muted-foreground">{t("projections.loadingPaces")}</div>
                  ) : availablePaces.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          {(() => {
                            const nextLevelsCount = getNextLevelsCount(index)
                            const categoryName = getCategoryName(subject.categoryId)
                            const isElectives = categoryName === 'Electives'

                            if (isElectives || nextLevelsCount === 0) {
                              return null
                            }

                            return (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`extend-${index}`}
                                  checked={subject.extendToNextLevel || false}
                                  onCheckedChange={(checked) => {
                                    onSubjectChange('extendToNextLevel', checked === true)
                                    // Reset pace selection when toggling extend
                                    if (checked) {
                                      onSubjectChange('startPace', 0)
                                      onSubjectChange('endPace', 0)
                                    }
                                  }}
                                  className="cursor-pointer"
                                />
                                <Label
                                  htmlFor={`extend-${index}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {nextLevelsCount === 2
                                    ? t("projections.extendToNext2Levels") || "Extender a los siguientes 2 niveles"
                                    : t("projections.extendToNext1Level") || "Extender al siguiente nivel"}
                                </Label>
                              </div>
                            )
                          })()}
                        </div>
                        <Button
                          type="button"
                          variant="soft"
                          size="sm"
                          onClick={() => {
                            const firstPace = availablePaces[0]
                            const lastPace = availablePaces[availablePaces.length - 1]
                            onSubjectChange('startPace', firstPace)
                            onSubjectChange('endPace', lastPace)
                          }}
                        >
                          {t("projections.fillCompleteLevel")}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <SelectField
                          label={t("projections.startPace")}
                          required
                          value={subject.startPace > 0 ? String(subject.startPace) : ""}
                          onValueChange={(value) => {
                            const paceNum = parseInt(value)
                            onSubjectChange('startPace', paceNum)
                            if (subject.endPace < paceNum) {
                              onSubjectChange('endPace', paceNum)
                            }
                          }}
                          placeholder={t("projections.selectStart")}
                          options={availablePaces.map((paceNum) => ({
                            value: String(paceNum),
                            label: String(paceNum),
                          }))}
                        />

                        <SelectField
                          label={t("projections.endPace")}
                          required
                          value={subject.endPace > 0 ? String(subject.endPace) : ""}
                          onValueChange={(value) => {
                            onSubjectChange('endPace', parseInt(value))
                          }}
                          placeholder={t("projections.selectEnd")}
                          options={availablePaces
                            .filter((paceNum) => paceNum >= subject.startPace)
                            .map((paceNum) => ({
                              value: String(paceNum),
                              label: String(paceNum),
                            }))}
                        />
                      </div>

                      {subject.startPace > 0 && subject.endPace > 0 && selectedPaceRange.length > 0 && (
                        <div className="space-y-2">
                          <Label>{t("projections.skipPaces")}:</Label>
                          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-4 gap-2">
                              {selectedPaceRange.map((paceNum) => {
                                const isSkipped = subject.skipPaces.includes(paceNum)
                                return (
                                  <div key={paceNum} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`skip-${index}-${paceNum}`}
                                      checked={isSkipped}
                                      onCheckedChange={(checked) =>
                                        onSkipPaceChange(paceNum, checked === true)
                                      }
                                      className="cursor-pointer"
                                    />
                                    <Label
                                      htmlFor={`skip-${index}-${paceNum}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {paceNum}
                                    </Label>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {otherSubjects.length > 0 && (
                        <div className="space-y-2">
                          <SelectField
                            label={t("projections.notPairWith")}
                            value={subject.notPairWith[0] || "__none__"}
                            onValueChange={(value) => {
                              onNotPairWithChange(value === "__none__" ? null : value)
                            }}
                            placeholder={t("projections.selectNotPairWith") || "Select a subject (optional)"}
                            options={[
                              { value: "__none__", label: t("common.none") || "None" },
                              ...otherSubjects.map((otherSubject) => ({
                                value: otherSubject.subjectId,
                                label: getSubjectName(otherSubject.subjectId),
                              })),
                            ]}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t("projections.noPacesAvailable")}</div>
                  )}
                </>
              )}

              {subject.endPace < subject.startPace && subject.startPace > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("projections.endPaceMustBeGreater")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.index === nextProps.index &&
    prevProps.subject.subjectId === nextProps.subject.subjectId &&
    prevProps.subject.startPace === nextProps.subject.startPace &&
    prevProps.subject.endPace === nextProps.subject.endPace &&
    prevProps.subject.skipPaces.length === nextProps.subject.skipPaces.length &&
    prevProps.subject.skipPaces.every((p, i) => p === nextProps.subject.skipPaces[i]) &&
    prevProps.subject.notPairWith.length === nextProps.subject.notPairWith.length &&
    prevProps.subject.notPairWith.every((id, i) => id === nextProps.subject.notPairWith[i]) &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.loadingPaces === nextProps.loadingPaces &&
    prevProps.availablePaces.length === nextProps.availablePaces.length &&
    prevProps.availablePaces.every((p, i) => p === nextProps.availablePaces[i]) &&
    prevProps.subjectSearchTerm === nextProps.subjectSearchTerm &&
    prevProps.openPopover === nextProps.openPopover &&
    prevProps.otherSubjects.length === nextProps.otherSubjects.length
  )
})
