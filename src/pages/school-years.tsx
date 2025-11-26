import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Navigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useApi } from "@/services/api";
import type { SchoolYear, ModuleData } from "@/services/api";
import { toast } from "sonner";
import { SchoolYearsTable } from "@/components/school-years-table";
import { useTranslation } from "react-i18next";


export default function SchoolYearsPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { t } = useTranslation();
  const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);
  const [isReadOnly, setIsReadOnly] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
  }>({ open: false, message: "" });

  // Check user permissions
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Check if user has write permissions
        const modules = await api.modules.getUserModules();
        const allPermissions = new Set<string>();
        modules.forEach((module: ModuleData) => {
          module.actions.forEach((action: string) => allPermissions.add(action));
        });

        // If user only has read permission, set read-only mode
        const canWrite = allPermissions.has('schoolYear.create') || allPermissions.has('schoolYear.update');
        setIsReadOnly(!canWrite);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load school years
  React.useEffect(() => {
    fetchSchoolYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchoolYears = async () => {
    try {
      setLoading(true);
      const years = await api.schoolYears.getAll();
      setSchoolYears(years);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("permiso")) {
        setHasPermission(false);
      } else {
        setErrorDialog({
          open: true,
          title: "Error",
          message: errorMessage || "Error al cargar años escolares",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate("/school-settings/school-years/wizard");
  };

  const handleEdit = (year: SchoolYear) => {
    navigate(`/school-settings/school-years/wizard/${year.id}`);
  };


  const handleSetActive = async (id: string) => {
    try {
      await api.schoolYears.setActive(id);
      fetchSchoolYears();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("schoolYears.errorActivating"));
      setErrorDialog({
        open: true,
        title: t("common.error"),
        message: error instanceof Error ? error.message : t("schoolYears.errorActivating"),
      });
    }
  };

  const handleDelete = async (year: SchoolYear) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el año escolar "${year.name}"?`)) {
      return;
    }

    try {
      await api.schoolYears.delete(year.id);
      fetchSchoolYears();
      toast.success(t("schoolYears.deletedSuccess"));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("schoolYears.errorDeleting");
      toast.error(errorMessage);
      setErrorDialog({
        open: true,
        title: t("common.error"),
        message: errorMessage,
      });
    }
  };

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile back button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={() => navigate("/school-settings")}
          className="mb-4"
        >
          {t("schoolYears.backToSchoolSettings")}
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader
          title={t("schoolYears.title")}
          description={t("schoolYears.description")}
        />
        {!isReadOnly && (
          <Button onClick={handleCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            {t("schoolYears.newSchoolYear")}
          </Button>
        )}
      </div>

      <Separator />

      {/* School Years Table */}
      <SchoolYearsTable
        schoolYears={schoolYears}
        onEdit={!isReadOnly ? handleEdit : undefined}
        onDelete={!isReadOnly ? handleDelete : undefined}
        onSetActive={!isReadOnly ? handleSetActive : undefined}
        canEdit={!isReadOnly}
        canDelete={!isReadOnly}
      />


      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title || "Error"}
        message={errorDialog.message}
        confirmText={t("common.accept")}
      />
    </div>
  );
}

