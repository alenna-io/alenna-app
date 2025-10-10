import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Grid3X3, List } from "lucide-react"

interface ViewToggleProps {
  view: "cards" | "table"
  onViewChange: (view: "cards" | "table") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Vista:</span>
          <div className="flex rounded-md border">
            <Button
              variant={view === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("cards")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Tarjetas</span>
            </Button>
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("table")}
              className="rounded-l-none border-l"
            >
              <List className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Lista</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
