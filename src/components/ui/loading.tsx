import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

/**
 * Unified Loading Component
 * 
 * Usage Guidelines:
 * 
 * 1. SKELETONS (use for initial page loads when structure is known):
 *    - variant="list" - For list/grid pages (students, projections, schools, etc.)
 *    - variant="profile" - For profile/detail pages (user profile, school info, etc.)
 *    - variant="table" - For table views
 *    - variant="page" - For full page loads with custom layout
 * 
 * 2. SPINNERS (use for quick operations or when structure is unknown):
 *    - variant="spinner" - Centered spinner with optional message (default)
 *    - size="sm" | "md" | "lg" - Spinner size
 *    - inline - For inline loading (buttons, small sections)
 * 
 * 3. MESSAGES:
 *    - Default: "Cargando..."
 *    - Custom messages allowed for specific contexts
 */

interface LoadingProps {
  /**
   * Loading variant
   * - "spinner": Centered spinner (default, best for quick ops)
   * - "list": Skeleton cards in grid (best for list pages)
   * - "profile": Profile card skeleton (best for detail pages)
   * - "table": Table skeleton (best for table views)
   * - "page": Full page skeleton with custom layout
   */
  variant?: "spinner" | "list" | "profile" | "table" | "page"

  /**
   * Loading message (only used for spinner variant)
   * @default "Cargando..."
   */
  message?: string

  /**
   * Spinner size (only used for spinner variant)
   * @default "md"
   */
  size?: "sm" | "md" | "lg"

  /**
   * Inline loading (only used for spinner variant)
   * When true, removes padding and centers content
   * @default false
   */
  inline?: boolean

  /**
   * Custom className
   */
  className?: string

  /**
   * For "page" variant: custom skeleton layout
   */
  children?: React.ReactNode
}

export function Loading({
  variant = "spinner",
  message,
  size = "md",
  inline = false,
  className,
  children
}: LoadingProps) {
  const { t } = useTranslation()
  const displayMessage = message || t("common.loading")
  // SPINNER VARIANT (default)
  if (variant === "spinner") {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12"
    }

    if (inline) {
      return (
        <div className={cn("flex items-center justify-center", className)}>
          <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
        </div>
      )
    }

    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
          </div>
          {displayMessage && (
            <p className="text-sm text-muted-foreground">{displayMessage}</p>
          )}
        </div>
      </div>
    )
  }

  // LIST VARIANT (skeleton cards in grid)
  if (variant === "list") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // PROFILE VARIANT (profile card skeleton)
  if (variant === "profile") {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-[300px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // TABLE VARIANT (table skeleton)
  if (variant === "table") {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // PAGE VARIANT (custom layout via children)
  if (variant === "page") {
    return (
      <div className={cn("space-y-6 animate-pulse", className)}>
        {children}
      </div>
    )
  }

  return null
}

/**
 * Inline Spinner Component
 * Use for buttons, small sections, or inline loading states
 */
export function LoadingSpinner({
  size = "sm",
  className
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />
  )
}

