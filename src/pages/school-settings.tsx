import * as React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { Building2, Calendar, ChevronRight, Lock, GraduationCap, Clock, BookOpen } from "lucide-react";
import { useApi } from "@/services/api";
import type { ModuleData } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { useTranslation } from "react-i18next";

interface SchoolSettingsModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  readPermission: string;
  writePermission?: string;
  readOnly?: boolean;
}

export default function SchoolSettingsPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { userInfo } = useUser();
  const { t } = useTranslation();
  const [userPermissions, setUserPermissions] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  // Check if user is SUPERADMIN
  const isSuperAdmin = React.useMemo(() => {
    return userInfo?.roles?.some((role) => role.name === 'SUPERADMIN') ?? false;
  }, [userInfo]);

  // Check if user is SCHOOL_ADMIN
  const isSchoolAdmin = React.useMemo(() => {
    return userInfo?.roles?.some((role) => role.name === 'SCHOOL_ADMIN') ?? false;
  }, [userInfo]);

  // Define school settings modules with translations
  const schoolSettingsModules: SchoolSettingsModule[] = React.useMemo(() => [
    {
      id: "school-info",
      title: t("schoolSettings.schoolInfo.title"),
      description: t("schoolSettings.schoolInfo.description"),
      icon: Building2,
      path: "/school-settings/school-info",
      readPermission: "schoolInfo.read",
      writePermission: "schoolInfo.update",
      readOnly: true, // Managed by Alenna
    },
    {
      id: "school-year",
      title: t("schoolSettings.schoolYear.title"),
      description: t("schoolSettings.schoolYear.description"),
      icon: Calendar,
      path: "/school-settings/school-years",
      readPermission: "schoolYear.read",
      writePermission: "schoolYear.update",
    },
    {
      id: "certification-types",
      title: t("schoolSettings.certificationTypes.title"),
      description: t("schoolSettings.certificationTypes.description"),
      icon: GraduationCap,
      path: "/school-settings/certification-types",
      readPermission: "schoolInfo.read",
      writePermission: "schoolInfo.update",
    },
    {
      id: "quarters",
      title: t("quarters.title") || "Quarter Management",
      description: t("quarters.description") || "Manage quarter closing and status",
      icon: Clock,
      path: "/school-settings/quarters",
      readPermission: "quarters.read",
      writePermission: "quarters.close",
    },
    {
      id: "monthly-content",
      title: t("schoolSettings.monthlyContent.title"),
      description: t("schoolSettings.monthlyContent.description"),
      icon: BookOpen,
      path: "/school-settings/monthly-content",
      readPermission: "schoolInfo.read",
      writePermission: "schoolInfo.update",
    },
  ], [t]);

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

  const canWrite = (module: SchoolSettingsModule) => {
    return module.writePermission && hasPermission(module.writePermission);
  };

  if (loading) {
    return <Loading variant="simple-page" />;
  }

  // Only school admins can access school settings (not SUPERADMIN or others)
  if (!isSchoolAdmin || isSuperAdmin) {
    return <Navigate to="/404" replace />;
  }

  // Filter modules user has access to
  const accessibleModules = schoolSettingsModules.filter(module => {
    if (!hasPermission(module.readPermission)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        moduleKey="school_admin"
        title={t("schoolSettings.title")}
        description={t("schoolSettings.description")}
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
