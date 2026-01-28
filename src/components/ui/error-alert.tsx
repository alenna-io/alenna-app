import { AlertCircle, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface ErrorAlertProps {
  title?: string
  message: string
  className?: string
  onRetry?: () => void
  isNetworkError?: boolean
}

export function ErrorAlert({ 
  title, 
  message, 
  className, 
  onRetry,
  isNetworkError = false 
}: ErrorAlertProps) {
  const { t } = useTranslation()
  
  // Detect network errors from common error messages
  const detectedNetworkError = isNetworkError || 
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('network error') ||
    message.toLowerCase().includes('networkerror') ||
    message.toLowerCase().includes('fetch failed')

  const displayTitle = title || (detectedNetworkError ? t("errors.networkError") : t("errors.error"))
  const displayMessage = detectedNetworkError 
    ? t("errors.networkErrorMessage")
    : message

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border-2 shadow-lg transition-all duration-300",
      detectedNetworkError 
        ? "bg-gradient-to-br from-red-50 via-red-50/95 to-orange-50/50 border-red-300/60" 
        : "bg-gradient-to-br from-red-50 via-red-50/95 to-red-50/80 border-red-300/60",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      <div className="relative p-6 flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          detectedNetworkError 
            ? "bg-red-100 ring-4 ring-red-200/50" 
            : "bg-red-100 ring-4 ring-red-200/50"
        )}>
          {detectedNetworkError ? (
            <WifiOff className="h-6 w-6 text-red-600" strokeWidth={2.5} />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600" strokeWidth={2.5} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-red-900 mb-2">
            {displayTitle}
          </h3>
          <p className="text-sm text-red-800/90 leading-relaxed mb-4">
            {displayMessage}
          </p>
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("errors.retry")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
