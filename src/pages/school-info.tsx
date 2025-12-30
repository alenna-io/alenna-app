import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loading";
import { Building2, Mail, Phone, MapPin, Lock, Users, GraduationCap } from "lucide-react";
import { useApi } from "@/services/api";
import { Navigate, useParams } from "react-router-dom";
import type { UserInfo } from "@/services/api";
import { StudentFormDialog } from "@/components/student-form-dialog";
import { TeacherFormDialog } from "@/components/teacher-form-dialog";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { SchoolModulesManager } from "@/components/school-modules-manager";
import { useTranslation } from "react-i18next";
import { useModuleAccess } from "@/hooks/useModuleAccess";

interface SchoolInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  teacherLimit?: number;
  userLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export default function SchoolInfoPage() {
  const { schoolId } = useParams();
  const api = useApi();
  const { t } = useTranslation();
  const { hasModule } = useModuleAccess();
  const [school, setSchool] = React.useState<SchoolInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [studentsCount, setStudentsCount] = React.useState<number>(0);
  const [loadingStudentsCount, setLoadingStudentsCount] = React.useState(false);
  const [teachersCount, setTeachersCount] = React.useState<number>(0);
  const [loadingTeachersCount, setLoadingTeachersCount] = React.useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = React.useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean
    title?: string
    message: string
  }>({ open: false, message: "" });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Load user info first
        const userData = await api.auth.getUserInfo();
        setUserInfo(userData);

        const canViewSchoolInfo = userData.permissions.includes('schoolInfo.read') ||
          userData.roles.some((role: { name: string }) => role.name === 'SUPERADMIN');

        if (!canViewSchoolInfo) {
          setHasPermission(false);
          return;
        }

        // Load school data
        const schoolData = schoolId
          ? await api.schools.getById(schoolId)
          : await api.schools.getMy();
        setSchool(schoolData as SchoolInfo);

        const isSuperAdmin = userData.roles.some((role: { name: string }) => role.name === 'SUPERADMIN');
        const isSchoolAdmin = userData.roles.some((role: { name: string }) => role.name === 'SCHOOL_ADMIN') && !isSuperAdmin;
        const canViewStudents = userData.permissions.includes('students.read');
        // School admins can view teachers (module check will be done in rendering logic)
        const canViewTeachers = isSchoolAdmin || userData.permissions.includes('users.read');

        // SUPERADMIN can see counts even if they can't manage students/teachers
        // Regular users need permissions to see counts
        if (isSuperAdmin || canViewStudents) {
          setLoadingStudentsCount(true);
          try {
            const countData = await api.schools.getStudentsCount(schoolData.id);
            setStudentsCount(countData.count);
          } catch (error) {
            console.error("Error fetching students count:", error);
            setStudentsCount(0);
          } finally {
            setLoadingStudentsCount(false);
          }
        } else {
          setStudentsCount(0);
        }

        if (isSuperAdmin || canViewTeachers) {
          setLoadingTeachersCount(true);
          try {
            // Use /me endpoint for school admins
            const teachersCountData = isSchoolAdmin
              ? await api.schools.getMyTeachersCount()
              : await api.schools.getTeachersCount(schoolData.id);
            setTeachersCount(teachersCountData.count);
          } catch (error) {
            console.error("Error fetching teachers count:", error);
            setTeachersCount(0);
          } finally {
            setLoadingTeachersCount(false);
          }
        } else {
          setTeachersCount(0);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("permiso")) {
          setHasPermission(false);
        }
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return <Loading variant="card" />;
  }

  // Only SCHOOL_ADMIN can view/manage students and teachers for their school
  // SUPERADMIN cannot manage students/teachers - only schools
  const isSuperAdmin = userInfo?.roles.some((role: { name: string }) => role.name === 'SUPERADMIN') ?? false;
  const isSchoolAdmin = userInfo?.roles.some((role: { name: string }) => role.name === 'SCHOOL_ADMIN') ?? false;

  const canViewStudents = !isSuperAdmin && (userInfo?.permissions.includes('students.read') ?? false);
  // School admins can view teachers if the teachers module is enabled
  const canViewTeachers = !isSuperAdmin && isSchoolAdmin && hasModule('teachers');

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={schoolId ? "/schools" : "/school-settings"}>
          {schoolId ? t("schools.backToSchools") : t("schoolSettings.title")}
        </BackButton>
      </div>

      <PageHeader
        title={t("schoolInfo.title")}
        description={t("schoolInfo.description")}
      />

      <Separator />

      {school && (
        <>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("schoolInfo.generalInfo")}
                </CardTitle>
                <CardDescription>{t("schoolInfo.generalInfo")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                      {t("schoolInfo.schoolName")}
                    </label>
                    <p className="text-lg font-semibold">{school.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                      {t("schoolInfo.schoolId")}
                    </label>
                    <p className="text-sm font-mono bg-muted px-3 py-2 rounded">{school.id}</p>
                  </div>
                </div>

                {/* Statistics - Integrated at bottom of General Info Card */}
                {(canViewStudents || canViewTeachers || isSuperAdmin) && (
                  <div className="pt-4 mt-4 border-t">
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      {(canViewStudents || isSuperAdmin) && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">{t("schoolInfo.totalStudents")}:</span>
                          {loadingStudentsCount ? (
                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                          ) : (
                            <span className="text-base font-semibold text-blue-600 tabular-nums">
                              {school?.userLimit ? `${studentsCount}/${school.userLimit}` : studentsCount}
                            </span>
                          )}
                        </div>
                      )}

                      {(canViewTeachers || isSuperAdmin) && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">{t("schoolInfo.totalTeachers")}:</span>
                          {loadingTeachersCount ? (
                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                          ) : (
                            <span className="text-base font-semibold text-green-600 tabular-nums">
                              {school?.teacherLimit ? `${teachersCount}/${school.teacherLimit}` : teachersCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Datos de contacto de la institución</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {school.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t("schoolInfo.email")}</label>
                      <p className="text-base">{school.email}</p>
                    </div>
                  </div>
                )}

                {school.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t("schoolInfo.phone")}</label>
                      <p className="text-base">{school.phone}</p>
                    </div>
                  </div>
                )}

                {school.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t("schoolInfo.address")}</label>
                      <p className="text-base">{school.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Management Section - Super Admin Only */}
            {isSuperAdmin && school && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t("schoolInfo.modulesManagement") || "Module Management"}
                  </CardTitle>
                  <CardDescription>
                    {t("schoolInfo.modulesDescription") || "Enable or disable modules for this school"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SchoolModulesManager schoolId={school.id} />
                </CardContent>
              </Card>
            )}

          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Información Protegida</p>
                  <p className="text-sm text-blue-700">
                    Esta información es gestionada por Alenna para garantizar la integridad del sistema.
                    Para solicitar cambios, contacta a soporte técnico en{" "}
                    <a href="mailto:soporte@alenna.io" className="underline font-medium">
                      soporte@alenna.io
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Student Form Dialog */}
      {school && (
        <StudentFormDialog
          open={isStudentDialogOpen}
          onOpenChange={(open) => {
            setIsStudentDialogOpen(open)
          }}
          schoolId={school.id}
          onSave={async (data) => {
            try {
              await api.students.create(data)
              setIsStudentDialogOpen(false)
              // Reload students count
              if (canViewStudents) {
                setLoadingStudentsCount(true)
                try {
                  const countData = await api.schools.getStudentsCount(school.id)
                  setStudentsCount(countData.count)
                } catch (error) {
                  console.error("Error fetching students count:", error)
                } finally {
                  setLoadingStudentsCount(false)
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Error al crear estudiante"
              setErrorDialog({
                open: true,
                title: "Error",
                message: errorMessage,
              })
              throw error
            }
          }}
        />
      )}

      {/* Teacher Form Dialog */}
      {school && (
        <TeacherFormDialog
          open={isTeacherDialogOpen}
          onOpenChange={(open) => {
            setIsTeacherDialogOpen(open)
          }}
          schoolId={school.id}
          onSave={async (data) => {
            try {
              await api.createUser({ ...data, schoolId: school.id })
              setIsTeacherDialogOpen(false)
              // Reload teachers count
              if (canViewTeachers) {
                setLoadingTeachersCount(true)
                try {
                  const teachersCountData = await api.schools.getTeachersCount(school.id)
                  setTeachersCount(teachersCountData.count)
                } catch (error) {
                  console.error("Error fetching teachers count:", error)
                } finally {
                  setLoadingTeachersCount(false)
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Error al crear maestro"
              setErrorDialog({
                open: true,
                title: "Error",
                message: errorMessage,
              })
              throw error
            }
          }}
        />
      )}

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        confirmText="Aceptar"
      />
    </div>
  );
}

