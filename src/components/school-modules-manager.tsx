import * as React from "react";
import { useApi } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info, GraduationCap, BookOpen, Library, Calendar, Award, UserCog, Users2, Sliders, Settings, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { ModuleIcon } from "@/components/ui/module-icon";
import { hasModuleIcon } from "@/lib/module-icon-utils";

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
  billing: [],
};

// Fallback icons for modules without icon files
const MODULE_FALLBACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  students: GraduationCap,
  projections: BookOpen,
  paces: Library,
  monthlyAssignments: Calendar,
  reportCards: Award,
  groups: Users2,
  teachers: UserCog,
  school_admin: Sliders,
  configuration: Settings,
  billing: CreditCard,
};

interface SchoolModulesManagerProps {
  schoolId: string;
}

export function SchoolModulesManager({ schoolId }: SchoolModulesManagerProps) {
  const api = useApi();
  const { t } = useTranslation();
  const { userInfo } = useUser();
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
          // Filter out users and schools modules - these are only for Super Admins
          const filteredModules = schoolModules.filter((module: Module) => {
            return module.key !== 'users' && module.key !== 'schools';
          });
          setModules(filteredModules);
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
    // Only refetch when schoolId or userInfo changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, userInfo?.schoolName]);

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
      // Filter out users and schools modules - these are only for Super Admins
      const filteredModules = schoolModules.filter((module: Module) => {
        return module.key !== 'users' && module.key !== 'schools';
      });
      setModules(filteredModules);
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
    const FallbackIcon = MODULE_FALLBACK_ICONS[module.key];

    return (
      <Card
        key={module.id}
        className={cn(
          "transition-all duration-300 hover:shadow-lg",
          module.isEnabled
            ? "border-primary/50 shadow-md bg-gradient-to-br from-background to-primary/5"
            : "border-border/50 hover:border-border"
        )}
      >
        <CardHeader className="pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Module Icon */}
              <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                {hasModuleIcon(module.key) ? (
                  <ModuleIcon
                    moduleKey={module.key}
                    size={32}
                    className=""
                  />
                ) : FallbackIcon ? (
                  <FallbackIcon className={cn(
                    "h-7 w-7",
                    module.isEnabled ? "text-primary" : "text-muted-foreground"
                  )} />
                ) : null}
              </div>

              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CardTitle className="text-base font-semibold m-0 text-foreground">
                    {module.name}
                  </CardTitle>
                  {dependencies.length > 0 && (
                    <Badge variant="outline" className="text-xs font-normal bg-muted/50 border-muted-foreground/20">
                      <Info className="h-3 w-3 mr-1 opacity-70" />
                      {t("schools.modules.requires") || "Requires"}{" "}
                      {dependencies.map((key) => {
                        const dep = modules.find((m) => m.key === key);
                        return dep?.name || key;
                      }).join(", ")}
                    </Badge>
                  )}
                </div>
                {module.description && (
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </CardDescription>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {module.isEnabled ? (
                <Badge variant="default" className="bg-primary/90 text-primary-foreground shadow-sm">
                  {t("common.enabled") || "Enabled"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
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
                  className="h-5 w-5 cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {hasDependentModules && (
          <CardContent className="pt-0 pb-4 px-6">
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/30">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed">
                <span className="font-semibold text-blue-900 dark:text-blue-300">
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
    <div className="space-y-5">
      {/* Select/Deselect All Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={updating !== null || modules.length === 0}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          {allEnabled
            ? t("schools.modules.deselectAll") || "Deselect All"
            : t("schools.modules.selectAll") || "Select All"}
        </Button>
      </div>

      {/* Render grouped modules */}
      <div className="space-y-4">
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
            <div key={`group-${group.parent?.id || groupIndex}`} className="space-y-3">
              {group.parent && renderModuleCard(group.parent)}
              {group.children.length > 0 && (
                <div className="ml-8 space-y-3 pl-6 border-l-2 border-primary/20 dark:border-primary/30 relative">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary/20 dark:bg-primary/30 border-2 border-background"></div>
                  {group.children.map((module) => renderModuleCard(module))}
                </div>
              )}
              {groupIndex < groupedModules.length - 1 && (
                <Separator className="my-5 bg-border/50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

