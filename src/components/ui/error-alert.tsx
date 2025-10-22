import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorAlertProps {
  title?: string
  message: string
  className?: string
}

export function ErrorAlert({ title = "Error", message, className }: ErrorAlertProps) {
  return (
    <div className={cn(
      "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3",
      className
    )}>
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1">
        <h3 className="font-semibold text-red-900 dark:text-red-100">
          {title}
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          {message}
        </p>
      </div>
    </div>
  )
}
