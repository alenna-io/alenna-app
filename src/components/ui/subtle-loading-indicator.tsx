import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubtleLoadingIndicatorProps {
  loading?: boolean
  className?: string
}

export function SubtleLoadingIndicator({ loading = false, className }: SubtleLoadingIndicatorProps) {
  if (!loading) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-background/95 backdrop-blur-sm border border-border px-3 py-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <Loader2 className="h-3 w-3 animate-spin text-primary" />
      <span className="text-xs text-muted-foreground">Loading...</span>
    </div>
  )
}

