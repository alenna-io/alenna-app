import * as React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { Building2, Calendar, CreditCard, ChevronRight, Lock } from "lucide-react";
import { useApi } from "@/services/api";
import type { ModuleData } from "@/services/api";
import { useUser } from "@/contexts/UserContext";

interface ConfigModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  readPermission: string;
  writePermission?: string;
  readOnly?: boolean;
}

const configModules: ConfigModule[] = [
  {
    id: "school-info",
    title: "Información de la Escuela",
    description: "Nombre, dirección, contacto y configuración general",
    icon: Building2,
    path: "/configuration/school-info",
    readPermission: "schoolInfo.read",
    writePermission: "schoolInfo.update",
    readOnly: true, // Managed by Alenna
  },
  {
    id: "school-year",
    title: "Años Escolares",
    description: "Configuración de años escolares, trimestres y calendario",
    icon: Calendar,
    path: "/configuration/school-years",
    readPermission: "schoolYear.read",
    writePermission: "schoolYear.update",
  },
  {
    id: "billing",
    title: "Facturación",
    description: "Gestión de pagos, facturas y suscripciones",
    icon: CreditCard,
    path: "/configuration/billing",
    readPermission: "billing.read",
    writePermission: "billing.update",
  },
];

export default function ConfigurationPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { userInfo } = useUser();
  const [userPermissions, setUserPermissions] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  // Check if user is SUPERADMIN
  const isSuperAdmin = React.useMemo(() => {
    return userInfo?.roles?.some((role) => role.name === 'SUPERADMIN') ?? false;
  }, [userInfo]);

  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Fetch user's modules to get permissions
        const modules = await api.modules.getUserModules();
        const allPermissions = new Set<string>();
        modules.forEach((module: ModuleData) => {
          module.actions.forEach((action: string) => allPermissions.add(action));
        });
        setUserPermissions(allPermissions);
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPermission = (permission: string) => {
    return userPermissions.has(permission);
  };

  const canWrite = (module: ConfigModule) => {
    return module.writePermission && hasPermission(module.writePermission);
  };

  if (loading) {
    return <Loading variant="list" />;
  }

  // Filter modules user has access to
  // SUPERADMIN should only see "Información de la Escuela", not "Años Escolares"
  const accessibleModules = configModules.filter(module => {
    if (!hasPermission(module.readPermission)) {
      return false;
    }

    // Hide "Años Escolares" for SUPERADMIN
    if (isSuperAdmin && module.id === 'school-year') {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestiona la configuración de tu escuela"
      />

      <div className="space-y-3">
        {accessibleModules.map((module) => {
          const Icon = module.icon;
          const isReadOnly = module.readOnly || !canWrite(module);

          return (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(module.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {module.title}
                        {isReadOnly && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {accessibleModules.length === 0 && (
        <Navigate to="/404" replace />
      )}
    </div>
  );
}


