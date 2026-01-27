import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { SubjectConfig } from "./types"
import type { Student } from "@/services/api"

interface Step3ReviewProps {
  selectedStudent: Student | undefined
  activeSchoolYear: { id: string; name: string } | null
  subjects: SubjectConfig[]
  getSubjectName: (subjectId: string) => string
  getCategoryName: (categoryId: string) => string
  onBack: () => void
  onGenerate: () => void
  isGenerating: boolean
}

export function Step3Review({
  selectedStudent,
  activeSchoolYear,
  subjects,
  getSubjectName,
  getCategoryName,
  onBack,
  onGenerate,
  isGenerating,
}: Step3ReviewProps) {
  const { t } = useTranslation()

  const totalEstimatedPaces = React.useMemo(() => {
    return subjects.reduce((total, subject) => {
      const subjectPaces = subject.endPace - subject.startPace + 1 - subject.skipPaces.length
      return total + Math.max(0, subjectPaces)
    }, 0)
  }, [subjects])

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>{t("projections.step3Title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("common.student")}</Label>
          <div className="p-3 bg-muted rounded-md border-0">
            {selectedStudent
              ? `${selectedStudent.user?.firstName} ${selectedStudent.user?.lastName}`
              : t("common.noSelection")}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("projections.schoolYear")}</Label>
          <div className="p-3 bg-muted rounded-md border-0">
            {activeSchoolYear?.name || t("common.noSelection")}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("projections.subject")} ({subjects.length})</Label>
          <div className="space-y-2">
            {subjects.map((subject, index) => {
              const totalPaces = subject.endPace - subject.startPace + 1 - subject.skipPaces.length
              return (
                <div key={index} className="p-3 bg-muted rounded-md border-0">
                  <div className="font-semibold">{getSubjectName(subject.subjectId)}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("projections.category")}: {getCategoryName(subject.categoryId)}
                  </div>
                  <div className="text-sm">
                    {t("projections.paces")}: {subject.startPace} - {subject.endPace}
                    {subject.skipPaces.length > 0 && (
                      <span className="ml-2">
                        ({t("projections.skip")}: {subject.skipPaces.join(", ")})
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    {t("projections.totalPaces")}: {Math.max(0, totalPaces)}
                  </div>
                  {subject.notPairWith.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("projections.notPairWith")}:{" "}
                      {subject.notPairWith.map(id => getSubjectName(id)).join(", ")}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">{t("projections.totalSubjects")}</Label>
            <p className="font-semibold">{subjects.length}</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">{t("projections.totalEstimatedPaces")}</Label>
            <p className="font-semibold">{totalEstimatedPaces}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("common.previous")}
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? t("projections.generating") : t("projections.generateProjection")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
