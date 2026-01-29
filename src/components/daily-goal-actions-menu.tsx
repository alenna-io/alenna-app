import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, FileText, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface DailyGoalActionsMenuProps {
  onAddNote: () => void
  onMarkComplete: () => void
  isCompleted: boolean
}

export function DailyGoalActionsMenu({
  onAddNote,
  onMarkComplete,
  isCompleted,
}: DailyGoalActionsMenuProps) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shadow-sm bg-gray-200 hover:bg-gray-300 text-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onAddNote}>
          <FileText className="h-4 w-4 mr-2" />
          {t("dailyGoals.addNote") || "Add Note"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMarkComplete}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {isCompleted
            ? (t("dailyGoals.markIncomplete") || "Mark as Incomplete")
            : (t("dailyGoals.markComplete") || "Mark as Complete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
