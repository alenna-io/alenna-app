import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, Lock, Users, Plus, Eye, GraduationCap } from "lucide-react";
import { useApi } from "@/services/api";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { UserInfo } from "@/services/api";

interface SchoolInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SchoolInfoPage() {
  const { schoolId } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const [school, setSchool] = React.useState<SchoolInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [studentsCount, setStudentsCount] = React.useState<number>(0);
  const [loadingStudentsCount, setLoadingStudentsCount] = React.useState(false);
  const [teachersCount, setTeachersCount] = React.useState<number>(0);
  const [loadingTeachersCount, setLoadingTeachersCount] = React.useState(false);

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

        const canViewStudents = userData.permissions.includes('students.read');
        const canViewTeachers = userData.permissions.includes('users.read');

        if (canViewStudents) {
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

        if (canViewTeachers) {
          setLoadingTeachersCount(true);
          try {
            const teachersCountData = await api.schools.getTeachersCount(schoolData.id);
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
    return <Loading variant="profile" />;
  }

  const canViewStudents = userInfo?.permissions.includes('students.read') ?? false;
  const canCreateStudents = userInfo?.permissions.includes('students.create') ?? false;
  const canViewTeachers = userInfo?.permissions.includes('users.read') ?? false;
  const canCreateTeachers = userInfo?.permissions.includes('users.create') ?? false;

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <BackButton to={schoolId ? "/schools" : "/configuration"}>
          {schoolId ? "Volver a Escuelas" : "Volver a Configuración"}
        </BackButton>
      </div>

      <PageHeader
        title="Información de la Escuela"
        description="Esta información es gestionada por Alenna. Para cambios, contacta a soporte."
      />

      <Separator />

      {school && (
        <>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información General
                </CardTitle>
                <CardDescription>Datos principales de la institución</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                      Nombre de la Escuela
                    </label>
                    <p className="text-lg font-semibold">{school.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                      ID de la Escuela
                    </label>
                    <p className="text-sm font-mono bg-muted px-3 py-2 rounded">{school.id}</p>
                  </div>
                </div>
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
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base">{school.email}</p>
                    </div>
                  </div>
                )}

                {school.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                      <p className="text-base">{school.phone}</p>
                    </div>
                  </div>
                )}

                {school.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                      <p className="text-base">{school.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {canViewStudents && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión de Estudiantes
                  </CardTitle>
                  <CardDescription>Administra los estudiantes de la escuela</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">
                        Total de Estudiantes
                      </label>
                      <div className="flex items-center gap-2">
                        {loadingStudentsCount ? (
                          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <p className="text-2xl font-bold text-blue-600">{studentsCount}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => navigate('/students')}
                        className="w-full"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Lista de Estudiantes
                      </Button>
                      {canCreateStudents && (
                        <Button
                          onClick={() => navigate('/students')}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Nuevo Estudiante
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teachers Management Section */}
            {canViewTeachers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Gestión de Maestros
                  </CardTitle>
                  <CardDescription>Administra los maestros de la escuela</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">
                        Total de Maestros
                      </label>
                      <div className="flex items-center gap-2">
                        {loadingTeachersCount ? (
                          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <p className="text-2xl font-bold text-green-600">{teachersCount}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => navigate('/users')}
                        className="w-full"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Lista de Maestros
                      </Button>
                      {canCreateTeachers && (
                        <Button
                          onClick={() => navigate('/users')}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Nuevo Maestro
                        </Button>
                      )}
                    </div>
                  </div>
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
    </div>
  );
}

