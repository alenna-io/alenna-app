import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FilePlus, Sparkles, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"

interface CreateProjectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectEmpty: () => void
  onSelectGenerate: () => void
  onSelectFromTemplate: () => void
}

export function CreateProjectionDialog({
  open,
  onOpenChange,
  onSelectEmpty,
  onSelectGenerate,
  onSelectFromTemplate,
}: CreateProjectionDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-3xl max-w-[90%]">
        <DialogHeader>
          <DialogTitle>{t("projections.createDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("projections.createDialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-auto w-full p-6 flex flex-col items-start gap-3 text-left whitespace-normal border-2 hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            onClick={onSelectGenerate}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold w-full break-words text-gray-900">{t("projections.generateAutomaticTitle")}</div>
                <div className="hidden sm:block text-sm text-gray-600 w-full break-words mt-1">
                  {t("projections.generateAutomaticDescription")}
                </div>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full p-6 flex flex-col items-start gap-3 text-left whitespace-normal border-2 hover:border-green-400 hover:bg-green-50 transition-colors group"
            onClick={onSelectFromTemplate}
            disabled={true}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                <Copy className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold w-full break-words text-gray-900">{t("projections.fromTemplateTitle")}</div>
                <div className="hidden sm:block text-sm text-gray-600 w-full break-words mt-1">
                  {t("projections.fromTemplateDescription")}
                </div>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full p-6 flex flex-col items-start gap-3 text-left whitespace-normal border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            onClick={onSelectEmpty}
            disabled={true}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <FilePlus className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold w-full break-words text-gray-900">{t("projections.emptyProjectionTitle")}</div>
                <div className="hidden sm:block text-sm text-gray-600 w-full break-words mt-1">
                  {t("projections.emptyProjectionDescription")}
                </div>
              </div>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

