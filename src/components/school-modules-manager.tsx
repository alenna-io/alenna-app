import * as React from "react";
import { useApi } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  key: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isEnabled: boolean;
}

// Module dependencies - matches backend MODULE_DEPENDENCIES
const MODULE_DEPENDENCIES: Record<string, string[]> = {
  students: [],
  projections: [],
  paces: [],
  monthlyAssignments: ['projections'],
  reportCards: ['projections'],
  groups: [],
  teachers: [],
  school_admin: [],
  schools: [],
  users: [],
  billing: [],
};

interface SchoolModulesManagerProps {
  schoolId: string;
}

export function SchoolModulesManager({ schoolId }: SchoolModulesManagerProps) {
  const api = useApi();
  const { t } = useTranslation();
  const [modules, setModules] = React.useState<Module[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchModules = async () => {
      try {
        setLoading(true);
        const schoolModules = await api.schools.getSchoolModules(schoolId);
        if (!cancelled) {
          setModules(schoolModules);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching school modules:", error);
          toast.error(t("schools.modules.fetchError") || "Error loading modules");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchModules();

    return () => {
      cancelled = true;
    };
    // Only refetch when schoolId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const handleToggleModule = async (moduleId: string, isEnabled: boolean) => {
    try {
      setUpdating(moduleId);

      const module = modules.find((m) => m.id === moduleId);
      if (!module) {
        throw new Error("Module not found");
      }

      // Check dependencies when enabling
      if (isEnabled) {
        const dependencies = MODULE_DEPENDENCIES[module.key] || [];
        const missingDependencies: string[] = [];

        for (const depKey of dependencies) {
          const depModule = modules.find((m) => m.key === depKey);
          if (!depModule || !depModule.isEnabled) {
            const depModuleName = modules.find((m) => m.key === depKey)?.name || depKey;
            missingDependencies.push(depModuleName);
          }
        }

        if (missingDependencies.length > 0) {
          toast.error(
            t("schools.modules.dependencyError", {
              module: module.name,
              dependencies: missingDependencies.join(", "),
            }) ||
            `Cannot enable ${module.name}. Required modules must be enabled first: ${missingDependencies.join(", ")}`
          );
          setUpdating(null);
          return;
        }
      } else {
        // Check if any enabled modules depend on this one
        const dependentModules: string[] = [];
        for (const otherModule of modules) {
          if (otherModule.id === moduleId || !otherModule.isEnabled) continue;

          const otherDependencies = MODULE_DEPENDENCIES[otherModule.key] || [];
          if (otherDependencies.includes(module.key)) {
            dependentModules.push(otherModule.name);
          }
        }

        if (dependentModules.length > 0) {
          toast.error(
            t("schools.modules.dependentModulesError", {
              module: module.name,
              dependents: dependentModules.join(", "),
            }) ||
            `Cannot disable ${module.name}. The following modules depend on it: ${dependentModules.join(", ")}. Please disable them first.`
          );
          setUpdating(null);
          return;
        }
      }

      if (isEnabled) {
        await api.schools.enableModule(schoolId, moduleId);
        toast.success(t("schools.modules.enableSuccess") || "Module enabled successfully");
      } else {
        await api.schools.disableModule(schoolId, moduleId);
        toast.success(t("schools.modules.disableSuccess") || "Module disabled successfully");
      }

      // Refresh modules list
      const schoolModules = await api.schools.getSchoolModules(schoolId);
      setModules(schoolModules);
    } catch (error) {
      console.error("Error toggling module:", error);
      const errorMessage = error instanceof Error ? error.message : "Error updating module";
      toast.error(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const getModuleDependencies = (moduleKey: string): string[] => {
    return MODULE_DEPENDENCIES[moduleKey] || [];
  };

  const getDependentModules = (moduleKey: string): string[] => {
    const dependents: string[] = [];
    for (const [key, deps] of Object.entries(MODULE_DEPENDENCIES)) {
      if (deps.includes(moduleKey)) {
        const module = modules.find((m) => m.key === key);
        if (module && module.isEnabled) {
          dependents.push(module.name);
        }
      }
    }
    return dependents;
  };

  // Group modules: parent modules with their dependents grouped together
  const groupedModules = React.useMemo(() => {
    if (modules.length === 0) return [];

    interface ModuleGroup {
      parent: Module | null;
      children: Module[];
      standalone: Module[];
    }

    const groups: ModuleGroup[] = [];
    const processed = new Set<string>();

    // First, find all parent modules (those with no dependencies)
    const parentModules = modules
      .filter(m => {
        const deps = getModuleDependencies(m.key);
        return deps.length === 0;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Create groups for each parent module
    for (const parent of parentModules) {
      if (processed.has(parent.id)) continue;

      // Find children that depend on this parent
      const children = modules
        .filter(m => {
          if (processed.has(m.id) || m.id === parent.id) return false;
          const deps = getModuleDependencies(m.key);
          return deps.includes(parent.key);
        })
        .sort((a, b) => a.displayOrder - b.displayOrder);

      // Mark as processed
      processed.add(parent.id);
      children.forEach(c => processed.add(c.id));

      if (children.length > 0) {
        // Parent with children
        groups.push({ parent, children, standalone: [] });
      } else {
        // Standalone module (no children, no dependencies)
        groups.push({ parent: null, children: [], standalone: [parent] });
      }
    }

    // Handle any remaining modules (shouldn't happen with current structure, but safety check)
    const remaining = modules.filter(m => !processed.has(m.id));
    if (remaining.length > 0) {
      // Sort remaining by display order
      remaining.sort((a, b) => a.displayOrder - b.displayOrder);
      groups.push({ parent: null, children: [], standalone: remaining });
    }

    // Sort groups by the first module's display order
    groups.sort((a, b) => {
      const aOrder = a.parent?.displayOrder ?? a.standalone[0]?.displayOrder ?? 999;
      const bOrder = b.parent?.displayOrder ?? b.standalone[0]?.displayOrder ?? 999;
      return aOrder - bOrder;
    });

    return groups;
  }, [modules]);

  const enabledCount = modules.filter(m => m.isEnabled).length;
  const allEnabled = enabledCount === modules.length && modules.length > 0;

  const handleSelectAll = async () => {
    if (allEnabled) {
      // Disable all modules
      for (const module of modules.reverse()) { // Reverse to disable dependents first
        if (module.isEnabled) {
          try {
            await handleToggleModule(module.id, false);
          } catch (error) {
            // Continue with other modules even if one fails
            console.error(`Error disabling module ${module.name}:`, error);
          }
        }
      }
    } else {
      // Enable all modules (respecting dependencies)
      const modulesToEnable = [...modules].sort((a, b) => {
        const aDeps = MODULE_DEPENDENCIES[a.key]?.length || 0;
        const bDeps = MODULE_DEPENDENCIES[b.key]?.length || 0;
        return aDeps - bDeps; // Enable modules with fewer dependencies first
      });

      for (const module of modulesToEnable) {
        if (!module.isEnabled) {
          try {
            await handleToggleModule(module.id, true);
          } catch (error) {
            // Continue with other modules even if one fails
            console.error(`Error enabling module ${module.name}:`, error);
          }
        }
      }
    }
  };

  const renderModuleCard = (module: Module) => {
    const dependencies = getModuleDependencies(module.key);
    const dependents = getDependentModules(module.key);
    const missingDependencies = dependencies
      .map((depKey) => {
        const depModule = modules.find((m) => m.key === depKey);
        return depModule && !depModule.isEnabled ? depModule.name : null;
      })
      .filter((name): name is string => name !== null);

    const hasDependencyIssue = !module.isEnabled && missingDependencies.length > 0;
    const hasDependentModules = module.isEnabled && dependents.length > 0;

    return (
      <Card
        key={module.id}
        className={cn(
          "transition-all",
          module.isEnabled && "border-green-200 dark:border-green-800"
        )}
      >
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-base font-semibold m-0">
                  {module.name}
                </CardTitle>
                {dependencies.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Info className="h-3 w-3 mr-1.5" />
                    {t("schools.modules.requires") || "Requires"}{" "}
                    {dependencies.map((key) => {
                      const dep = modules.find((m) => m.key === key);
                      return dep?.name || key;
                    }).join(", ")}
                  </Badge>
                )}
              </div>
              {module.description && (
                <CardDescription className="text-sm mt-1">
                  {module.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-3">
              {module.isEnabled ? (
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t("common.enabled") || "Enabled"}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  {t("common.disabled") || "Disabled"}
                </Badge>
              )}
              <div className="cursor-pointer" onClick={() => {
                if (!updating && !(hasDependencyIssue && !module.isEnabled) && !(hasDependentModules && module.isEnabled)) {
                  handleToggleModule(module.id, !module.isEnabled);
                }
              }}>
                <Checkbox
                  id={`module-${module.id}`}
                  checked={module.isEnabled}
                  disabled={updating === module.id || (hasDependencyIssue && !module.isEnabled) || (hasDependentModules && module.isEnabled)}
                  onCheckedChange={(checked) => handleToggleModule(module.id, checked === true)}
                  className="h-5 w-5 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {hasDependentModules && (
          <CardContent className="pt-0 pb-3 px-6">
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 border border-border">
              <Info className="h-3.5 w-3.5 text-muted-foreground/80 mt-0.5 shrink-0" />
              <span>
                <span className="font-medium text-foreground/90">
                  {t("schools.modules.dependentModules") || "Dependent Modules"}:{" "}
                </span>
                {t("schools.modules.usedBy", {
                  modules: dependents.join(", "),
                }) ||
                  `This module is required by: ${dependents.join(", ")}`}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return <Loading variant="button" />;
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("schools.modules.noModules") || "No modules available"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select/Deselect All Button */}
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={updating !== null || modules.length === 0}
        >
          {allEnabled
            ? t("schools.modules.deselectAll") || "Deselect All"
            : t("schools.modules.selectAll") || "Select All"}
        </Button>
      </div>

      {/* Render grouped modules */}
      {groupedModules.map((group, groupIndex) => {
        if (group.standalone.length > 0) {
          // Standalone modules (no dependencies, no children)
          return (
            <React.Fragment key={`standalone-${groupIndex}`}>
              {group.standalone.map((module) => renderModuleCard(module))}
            </React.Fragment>
          );
        }

        // Parent module with children
        return (
          <div key={`group-${group.parent?.id || groupIndex}`} className="space-y-2">
            {group.parent && renderModuleCard(group.parent)}
            {group.children.length > 0 && (
              <div className="ml-6 space-y-2 pl-4 border-l-2 border-muted-foreground/30">
                {group.children.map((module) => renderModuleCard(module))}
              </div>
            )}
            {groupIndex < groupedModules.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}

