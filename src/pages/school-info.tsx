import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Building2, Mail, Phone, MapPin, Lock } from "lucide-react";
import { useApi } from "@/services/api";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

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
  const api = useApi();
  const navigate = useNavigate();
  const [school, setSchool] = React.useState<SchoolInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);

  React.useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true);
        const data = await api.schools.getMy();
        setSchool(data as SchoolInfo);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("permiso")) {
          setHasPermission(false);
        }
        console.error("Error fetching school:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return <LoadingSkeleton variant="profile" />;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/configuration">
        Volver a Configuración
      </BackButton>

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

