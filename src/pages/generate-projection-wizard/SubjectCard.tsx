import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, ChevronUp, ChevronDown, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { SubjectPicker } from "@/components/forms/SubjectPicker"
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
  onNotPairWithChange: (otherSubjectId: string, checked: boolean) => void
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

  return (
    <Card className="border shadow-none">
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
                        <div className="space-y-2">
                          <Label>{t("projections.startPace")} <span className="text-red-500">*</span></Label>
                          <Select
                            value={subject.startPace > 0 ? String(subject.startPace) : ""}
                            onValueChange={(value) => {
                              const paceNum = parseInt(value)
                              onSubjectChange('startPace', paceNum)
                              if (subject.endPace < paceNum) {
                                onSubjectChange('endPace', paceNum)
                              }
                            }}
                          >
                            <SelectTrigger className="cursor-pointer transition-all duration-200 hover:border-primary/50">
                              <SelectValue placeholder={t("projections.selectStart")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePaces.map((paceNum) => (
                                <SelectItem key={paceNum} value={String(paceNum)}>
                                  {paceNum}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t("projections.endPace")} <span className="text-red-500">*</span></Label>
                          <Select
                            value={subject.endPace > 0 ? String(subject.endPace) : ""}
                            onValueChange={(value) => {
                              onSubjectChange('endPace', parseInt(value))
                            }}
                          >
                            <SelectTrigger className="cursor-pointer transition-all duration-200 hover:border-primary/50">
                              <SelectValue placeholder={t("projections.selectEnd")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePaces
                                .filter((paceNum) => paceNum >= subject.startPace)
                                .map((paceNum) => (
                                  <SelectItem key={paceNum} value={String(paceNum)}>
                                    {paceNum}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
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
                          <Label>{t("projections.notPairWith")}:</Label>
                          <div className="space-y-2 mt-2">
                            {otherSubjects.map((otherSubject) => {
                              const isChecked = subject.notPairWith.includes(otherSubject.subjectId)
                              return (
                                <div key={otherSubject.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`not-pair-${index}-${otherSubject.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      onNotPairWithChange(otherSubject.subjectId, checked === true)
                                    }
                                    className="cursor-pointer"
                                  />
                                  <Label
                                    htmlFor={`not-pair-${index}-${otherSubject.id}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {getSubjectName(otherSubject.subjectId)}
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
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
