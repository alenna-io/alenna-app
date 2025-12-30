import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/string-utils"
import { LinkButton } from "@/components/ui/link-button"
// BackButton replaced with shadcn Button
import { Calendar, FileText, Pencil } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { Student } from "@/types/student"
import { ParentProfileDialog } from "@/components/parent-profile-dialog"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { DangerZone } from "@/components/ui/danger-zone"

interface StudentProfileProps {
  student: Student
  onBack: () => void
  isParentView?: boolean
  isStudentView?: boolean
  canManage?: boolean
  canEdit?: boolean
  onEdit?: (student: Student) => void
  onDeactivate?: (student: Student) => void
  onReactivate?: (student: Student) => void
  onDelete?: (student: Student) => void
}

export function StudentProfile({ student, onBack, isParentView = false, isStudentView = false, canManage = false, canEdit = false, onEdit, onDeactivate, onReactivate, onDelete }: StudentProfileProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { hasModule } = useModuleAccess()
  const [selectedParent, setSelectedParent] = React.useState<Student['parents'][0] | null>(null)
  const [isParentDialogOpen, setIsParentDialogOpen] = React.useState(false)

  // Check module access
  const hasProjectionsModule = hasModule('projections')
  const hasReportCardsModule = hasModule('reportCards')


  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      {!isStudentView && (
        <div className="md:hidden">
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4"
          >
            {t("students.backToStudents")}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl md:text-2xl font-bold">{t("students.title")}</h1>
        {canEdit && onEdit && (
          <Button
            variant="default"
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white w-full sm:w-auto"
            onClick={() => onEdit(student)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t("students.edit")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Profile Header */}
        <Card className="md:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-12 w-12 md:h-10 md:w-10">
                <AvatarFallback className="text-base md:text-lg">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg md:text-xl truncate">{student.name}</CardTitle>
                <p className="text-sm md:text-base text-muted-foreground truncate">
                  {student.certificationType} • {student.age} años
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{t("students.personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nombre Completo
              </label>
              <p className="text-sm">{student.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Edad
              </label>
              <p className="text-sm">{student.age} años</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("students.birthDate")}
              </label>
              <p className="text-sm">
                {new Date(student.birthDate).toLocaleDateString("es-MX")}
              </p>
            </div>
            {student.email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("students.email")}
                </label>
                <p className="text-sm">{student.email}</p>
              </div>
            )}
            {student.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("students.phone")}
                </label>
                <p className="text-sm">{student.phone}</p>
              </div>
            )}
            {(student.streetAddress || student.city || student.state || student.country || student.zipCode) ? (
              <>
                {student.streetAddress && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("students.streetAddress")}
                    </label>
                    <p className="text-sm">{student.streetAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {student.city && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("students.city")}
                      </label>
                      <p className="text-sm">{student.city}</p>
                    </div>
                  )}
                  {student.state && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("students.state")}
                      </label>
                      <p className="text-sm">{student.state}</p>
                    </div>
                  )}
                  {student.country && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("students.country")}
                      </label>
                      <p className="text-sm">{student.country}</p>
                    </div>
                  )}
                  {student.zipCode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("students.zipCode")}
                      </label>
                      <p className="text-sm">{student.zipCode}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("students.fullAddress")}
                </label>
                <p className="text-sm text-muted-foreground">-</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{t("students.academicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Certificación
              </label>
              <p className="text-sm">{student.certificationType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Graduación
              </label>
              <p className="text-sm">
                {new Date(student.graduationDate).toLocaleDateString("es-MX")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("students.currentLevel")}
              </label>
              <p className="text-sm">{student.currentLevel || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Va Nivelado
              </label>
              <p className="text-sm">
                {student.isLeveled ? "Sí" : "No"}
              </p>
            </div>
            {!student.isLeveled && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("students.expectedLevel")}
                </label>
                <p className="text-sm">{student.expectedLevel || "-"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='flex flex-col md:flex-row gap-4 w-full md:col-span-2'>
          {/* A.C.E. Projections - Only show if projections module is enabled */}
          {hasProjectionsModule && (
            <Card className="w-full">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    {t("projections.academicProjections")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("projections.weeklyPlanning")}
                </p>
                {(isParentView || isStudentView) ? (
                  <LinkButton
                    variant="outline"
                    size="default"
                    showChevron={false}
                    className="w-full cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}/projections`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("projections.viewProjections")}
                  </LinkButton>
                ) : (
                  <LinkButton
                    variant="default"
                    size="lg"
                    showChevron={false}
                    className="w-full max-w-xs cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}/projections`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("projections.manageProjections")}
                  </LinkButton>
                )}
              </CardContent>
            </Card>
          )}

          {/* Report Cards - Only show if reportCards module is enabled */}
          {hasReportCardsModule && (
            <Card className="w-full">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    {t("reportCards.title")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("reportCards.description") || "Ver y generar boletas de calificaciones"}
                </p>
                {(isParentView || isStudentView) ? (
                  <LinkButton
                    variant="outline"
                    size="default"
                    showChevron={false}
                    className="w-full cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}/report-cards`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("reportCards.viewReportCards") || "Ver Boletas"}
                  </LinkButton>
                ) : (
                  <LinkButton
                    variant="default"
                    size="lg"
                    showChevron={false}
                    className="w-full max-w-xs cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}/report-cards`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("reportCards.manageReportCards") || "Gestionar Boletas"}
                  </LinkButton>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Parents Information - Hidden for parent users */}
        {!isParentView && !isStudentView && (
          <Card className="md:col-span-2">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">{t("students.parentsInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {student.parents.length > 0 ? (
                <div className="space-y-2">
                  {student.parents.map((parent) => (
                    <div
                      key={parent.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(parent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{parent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Padre/Madre
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto cursor-pointer"
                        onClick={() => {
                          setSelectedParent(parent)
                          setIsParentDialogOpen(true)
                        }}
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {t("students.noParents")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Parent Profile Dialog */}
        {selectedParent && (
          <ParentProfileDialog
            open={isParentDialogOpen}
            onOpenChange={(open) => {
              setIsParentDialogOpen(open)
              if (!open) {
                setSelectedParent(null)
              }
            }}
            parent={selectedParent}
          />
        )}

        {/* Danger Zone - Only for school admins */}
        {canManage && !isParentView && !isStudentView && (
          <DangerZone
            title={t("students.dangerZone")}
            actions={[
              ...(student.isActive && onDeactivate
                ? [
                  {
                    title: t("students.deactivate"),
                    description: t("students.deactivateDescription"),
                    buttonText: t("students.deactivate"),
                    buttonVariant: "outline" as const,
                    buttonClassName: "bg-red-50 border-red-300 text-red-700 hover:bg-red-100",
                    borderClassName: "border-l-red-300",
                    onClick: () => onDeactivate(student),
                  },
                ]
                : []),
              ...(!student.isActive && onReactivate
                ? [
                  {
                    title: t("students.reactivate"),
                    description: t("students.reactivateDescription"),
                    buttonText: t("students.reactivate"),
                    buttonVariant: "outline" as const,
                    buttonClassName: "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100",
                    borderClassName: "border-l-blue-300",
                    onClick: () => onReactivate(student),
                  },
                ]
                : []),
              ...(!student.isActive && onDelete
                ? [
                  {
                    title: t("students.delete"),
                    description: t("students.deleteDescription"),
                    buttonText: t("students.delete"),
                    buttonVariant: "destructive" as const,
                    buttonClassName: "bg-red-600 hover:bg-red-700 text-white",
                    borderClassName: "border-l-red-300",
                    onClick: () => onDelete(student),
                  },
                ]
                : []),
            ]}
          />
        )}
      </div>
    </div>
  )
}
