import * as React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { ChevronRight, Languages } from "lucide-react";
import { useApi } from "@/services/api";
import type { ModuleData } from "@/services/api";
import { useTranslation } from "react-i18next";

interface ConfigModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  readPermission?: string; // Optional - if empty, accessible to all authenticated users
  writePermission?: string;
  readOnly?: boolean;
}

// Note: configModules will be defined inside the component to use translations

export default function ConfigurationPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { t } = useTranslation();
  const [userPermissions, setUserPermissions] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);


  // Define config modules with translations
  // Configuration is for user preferences (language, profile, passwords, etc.)
  const configModules: ConfigModule[] = React.useMemo(() => [
    {
      id: "language",
      title: t("configuration.language.title"),
      description: t("configuration.language.description"),
      icon: Languages,
      path: "/configuration/language",
      readPermission: "", // No permission required - all authenticated users can access their language preference
      writePermission: "", // No permission required - all authenticated users can update their language preference
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

  if (loading) {
    return <Loading variant="simple-page" />;
  }

  // Filter modules user has access to
  // Language module is accessible to all authenticated users (no permission check needed)
  const accessibleModules = configModules.filter(module => {
    // If no readPermission is specified, allow access to all authenticated users
    if (!module.readPermission) {
      return true;
    }
    // Otherwise, check if user has the required permission
    if (!hasPermission(module.readPermission)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        moduleKey="configuration"
        title={t("configuration.title")}
        description={t("configuration.description")}
      />

      <div className="space-y-3">
        {accessibleModules.map((module) => {
          const Icon = module.icon;

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
                      <h3 className="text-lg font-semibold">
                        {module.title}
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


