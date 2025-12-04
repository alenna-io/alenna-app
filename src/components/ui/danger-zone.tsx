import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export interface DangerZoneAction {
  title: string
  description: string
  buttonText: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  buttonClassName?: string
  borderClassName?: string
  onClick: () => void
}

interface DangerZoneProps {
  title?: string
  actions: DangerZoneAction[]
}

export function DangerZone({ title, actions }: DangerZoneProps) {
  const { t } = useTranslation()

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="md:col-span-2 mt-8">
      <div className="border-t border-border pt-8">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          {title || t("common.dangerZone")}
        </h2>
        <div className="border border-destructive/50 rounded-lg bg-transparent overflow-hidden">
          {actions.map((action, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 ${index !== actions.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex-1 pr-4">
                <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              <Button
                variant={action.buttonVariant || "outline"}
                className={`ml-4 shrink-0 ${action.buttonClassName || ""}`}
                onClick={action.onClick}
              >
                {action.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

