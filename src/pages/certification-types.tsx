import * as React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { useApi } from "@/services/api";
import type { ModuleData } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface CertificationType {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export default function CertificationTypesPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { userInfo, isLoading: isLoadingUser } = useUser();
  const { t } = useTranslation();

  const [certificationTypes, setCertificationTypes] = React.useState<CertificationType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState(true);
  const [isReadOnly, setIsReadOnly] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState<{
    open: boolean;
    title?: string;
    message: string;
  }>({ open: false, message: "" });

  // Load permissions
  React.useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const modules = await api.modules.getUserModules();
        const allPermissions = new Set<string>();
        modules.forEach((module: ModuleData) => {
          module.actions.forEach((action: string) => allPermissions.add(action));
        });

        if (!allPermissions.has("schoolInfo.read")) {
          setHasPermission(false);
        }

        const canWrite = allPermissions.has("schoolInfo.update");
        setIsReadOnly(!canWrite);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      }
    };

    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load certification types once user info is available
  React.useEffect(() => {
    const fetchData = async () => {
      if (!userInfo?.schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const types = await api.schools.getCertificationTypes(userInfo.schoolId);
        setCertificationTypes(types as CertificationType[]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("permiso")) {
          setHasPermission(false);
        } else {
          console.error("Error loading certification types:", error);
          setErrorDialog({
            open: true,
            title: t("common.error"),
            message: t("certificationTypes.loadError") || message,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (!isLoadingUser) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, isLoadingUser]);

  const handleAdd = async () => {
    if (!userInfo?.schoolId) return;

    const name = newName.trim();
    const description = newDescription.trim();

    if (!name) {
      toast.error(t("certificationTypes.nameRequired") || "Certification name is required");
      return;
    }

    try {
      setIsSaving(true);
      const created = await api.schools.createCertificationType(userInfo.schoolId, {
        name,
        description: description || undefined,
        isActive: true,
      });

      const newType = created as CertificationType;
      setCertificationTypes((prev) => [...prev, newType]);
      setNewName("");
      setNewDescription("");
      toast.success(t("certificationTypes.createSuccess") || "Certification type created successfully");
    } catch (error) {
      console.error("Error creating certification type:", error);
      const message = error instanceof Error ? error.message : t("certificationTypes.createError");
      toast.error(message || "Error creating certification type");
      setErrorDialog({
        open: true,
        title: t("common.error"),
        message: message || "Error creating certification type",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPermission) {
    return <Navigate to="/404" replace />;
  }

  if (loading || isLoadingUser) {
    return <Loading variant="page" />;
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
          {t("certificationTypes.backToSchoolSettings")}
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <PageHeader
          title={t("certificationTypes.title")}
          description={t("certificationTypes.description")}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        {certificationTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("certificationTypes.noCertificationTypes")}
          </p>
        ) : (
          <ul className="space-y-2">
            {certificationTypes.map((type) => (
              <li
                key={type.id}
                className="flex items-center justify-between border rounded-md px-4 py-2 bg-white"
              >
                <div>
                  <div className="font-medium">{type.name}</div>
                  {type.description && (
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  )}
                </div>
                {type.isActive === false && (
                  <span className="text-xs text-muted-foreground">
                    {t("common.disabled")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isReadOnly && (
        <div className="mt-6 space-y-3 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold">
            {t("certificationTypes.addNew")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {t("certificationTypes.nameLabel")}
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("certificationTypes.nameLabel") || "Certification name"}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {t("certificationTypes.descriptionLabel")}
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t("certificationTypes.descriptionLabel") || "Optional description"}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
            >
              {isSaving ? t("common.saving") : t("certificationTypes.addNew")}
            </Button>
          </div>
        </div>
      )}

      <ErrorDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
        title={errorDialog.title || t("common.error")}
        message={errorDialog.message}
        confirmText={t("common.accept")}
      />
    </div>
  );
}
