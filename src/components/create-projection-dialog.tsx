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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear Proyección</DialogTitle>
          <DialogDescription>
            Elige cómo deseas crear la proyección académica
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
                <div className="font-semibold w-full break-words text-gray-900">Generar Proyección Automática</div>
                <div className="text-sm text-gray-600 w-full break-words mt-1">
                  El sistema generará automáticamente una proyección basada en las materias y lecciones que elijas. Puedes personalizar todo.
                </div>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full p-6 flex flex-col items-start gap-3 text-left whitespace-normal border-2 hover:border-green-400 hover:bg-green-50 transition-colors group"
            onClick={onSelectFromTemplate}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                <Copy className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold w-full break-words text-gray-900">Desde Plantilla</div>
                <div className="text-sm text-gray-600 w-full break-words mt-1">
                  Crea una proyección rápidamente usando una plantilla predefinida. Selecciona estudiante y plantilla.
                </div>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full p-6 flex flex-col items-start gap-3 text-left whitespace-normal border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            onClick={onSelectEmpty}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <FilePlus className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold w-full break-words text-gray-900">Crear Proyección Vacía</div>
                <div className="text-sm text-gray-600 w-full break-words mt-1">
                  Crea una proyección sin lecciones. Podrás agregar lecciones manualmente después.
                </div>
              </div>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

