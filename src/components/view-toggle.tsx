import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { List, LayoutGrid } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ViewToggleProps {
  view: "cards" | "table"
  onViewChange: (view: "cards" | "table") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  const { t } = useTranslation()

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t("common.viewLabel")}</span>
          <div className="flex rounded-lg border bg-muted/50">
            <Button
              variant={view === "table" ? "ghost" : "ghost"}
              size="sm"
              onClick={() => onViewChange("table")}
              className={`flex items-center gap-2 transition-all cursor-pointer ${view === "table"
                ? "bg-white text-black shadow-sm"
                : "hover:bg-background/50 text-muted-foreground"
                }`}
            >
              <List className="h-4 w-4" />
              <span className="text-sm font-medium">{t("common.list")}</span>
            </Button>
            <Button
              variant={view === "cards" ? "ghost" : "ghost"}
              size="sm"
              onClick={() => onViewChange("cards")}
              className={`flex items-center gap-2 transition-all cursor-pointer ${view === "cards"
                ? "bg-white text-black shadow-sm"
                : "hover:bg-background/50 text-muted-foreground"
                }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm font-medium">{t("common.cards")}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
