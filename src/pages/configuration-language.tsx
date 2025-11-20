import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { Languages } from "lucide-react";

export default function ConfigurationLanguagePage() {
  const { t, i18n } = useTranslation();
  const api = useApi();
  const { userInfo, refetch } = useUser();
  const [currentLanguage, setCurrentLanguage] = React.useState<string>(i18n.language);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync language from userInfo when available
  React.useEffect(() => {
    if (userInfo?.language && (userInfo.language === 'es' || userInfo.language === 'en')) {
      if (userInfo.language !== currentLanguage) {
        i18n.changeLanguage(userInfo.language);
        setCurrentLanguage(userInfo.language);
      }
    }
  }, [userInfo?.language, currentLanguage, i18n]);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === currentLanguage) return;

    setIsSaving(true);
    try {
      // Update language in i18n immediately for better UX
      await i18n.changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);

      // Try to save to backend (optional - if it fails, language is still changed locally)
      if (userInfo?.id) {
        try {
          // Use updateMyProfile endpoint which doesn't require users.update permission
          await api.updateMyProfile({ language: newLanguage });
          // Refetch user info to get updated language
          await refetch();
        } catch (error) {
          console.warn("Failed to save language preference to backend:", error);
          // Language is already changed locally, so we continue
        }
      }

      toast.success(t("configuration.language.languageUpdated"));
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error(t("common.error"));
      // Revert on error
      await i18n.changeLanguage(currentLanguage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("configuration.language.title")}
        description={t("configuration.language.description")}
      />

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  {t("configuration.language.selectLanguage")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("configuration.language.description")}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("configuration.language.selectLanguage")}
                </label>
                <Select
                  value={currentLanguage}
                  onValueChange={handleLanguageChange}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">
                      {t("configuration.language.spanish")}
                    </SelectItem>
                    <SelectItem value="en">
                      {t("configuration.language.english")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

