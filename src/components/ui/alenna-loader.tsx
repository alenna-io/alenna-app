import * as React from "react"
import { cn } from "@/lib/utils"
import { AlennaSkeleton } from "./alenna-skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

/**
 * AlennaLoader - Premium unified loading component
 * 
 * Core Philosophy:
 * - Calm, predictable, premium
 * - Skeletons by default (no spinners except inline/button)
 * - Matches layout structures
 * - Consistent animation language
 */

interface AlennaLoaderProps {
  /**
   * Loading variant
   */
  variant?: "page" | "section" | "card" | "inline" | "button" | "list-page" | "detail-page" | "projection-details" | "dashboard" | "report-cards-list" | "simple-page"

  /**
   * Custom className
   */
  className?: string

  /**
   * For page variant: custom skeleton layout
   */
  children?: React.ReactNode

  /**
   * For button variant: spinner size
   */
  size?: "sm" | "md" | "lg"

  /**
   * Disable animation (respects prefers-reduced-motion)
   */
  disableAnimation?: boolean

  /**
   * For list-page variant: show create button skeleton
   */
  showCreateButton?: boolean

  /**
   * For list-page variant: show table or cards skeleton
   */
  view?: "table" | "cards"

  /**
   * For list-page variant: show filters skeleton
   */
  showFilters?: boolean

  /**
   * For list-page variant: show view toggle skeleton
   */
  showViewToggle?: boolean
}

/**
 * PAGE variant - Full page skeleton
 * Use for initial page loads
 * Enhanced to fill full space and match common layouts
 */
function PageLoader({ className, children, disableAnimation }: AlennaLoaderProps) {
  if (children) {
    return (
      <div className={cn("w-full", className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn("space-y-8 w-full", className)}>
      {/* Welcome Section Skeleton */}
      <div className="space-y-3">
        <AlennaSkeleton height={48} width="40%" disableAnimation={disableAnimation} className="max-w-md" />
        <AlennaSkeleton height={24} width="70%" variant="text" disableAnimation={disableAnimation} className="max-w-2xl" />
      </div>

      {/* Section Title Skeleton */}
      <div className="space-y-4">
        <AlennaSkeleton height={28} width="20%" disableAnimation={disableAnimation} className="max-w-xs" />

        {/* Cards skeleton - full width grid matching home page */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <ModuleCardLoader key={i} disableAnimation={disableAnimation} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * SECTION variant - Section skeleton
 * Use for loading within existing layout
 */
function SectionLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <AlennaSkeleton height={24} width="40%" disableAnimation={disableAnimation} />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <AlennaSkeleton
            key={i}
            height={60}
            width="100%"
            disableAnimation={disableAnimation}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * CARD variant - Card skeleton (generic card)
 * Use for individual card loading
 */
function CardLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <AlennaSkeleton height={20} width="70%" disableAnimation={disableAnimation} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <AlennaSkeleton
            height={48}
            width={48}
            variant="circular"
            disableAnimation={disableAnimation}
          />
          <div className="space-y-2 flex-1">
            <AlennaSkeleton height={16} width="75%" variant="text" disableAnimation={disableAnimation} />
            <AlennaSkeleton height={14} width="50%" variant="text" disableAnimation={disableAnimation} />
          </div>
        </div>
        <div className="space-y-2">
          <AlennaSkeleton height={12} width="100%" variant="text" disableAnimation={disableAnimation} />
          <AlennaSkeleton height={12} width="85%" variant="text" disableAnimation={disableAnimation} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Module Card Loader - Matches home page module cards
 * Center-aligned icon and title
 */
function ModuleCardLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <Card className={cn("overflow-hidden h-full", className)}>
      <CardContent className="p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        {/* Icon container skeleton */}
        <AlennaSkeleton
          height={64}
          width={64}
          variant="rectangular"
          disableAnimation={disableAnimation}
          className="rounded-xl"
        />
        {/* Title skeleton */}
        <AlennaSkeleton height={24} width="80%" variant="text" disableAnimation={disableAnimation} className="max-w-[120px]" />
      </CardContent>
    </Card>
  )
}

/**
 * INLINE variant - Small inline skeleton
 * Use for small sections or inline loading
 */
function InlineLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AlennaSkeleton height={16} width={16} variant="circular" disableAnimation={disableAnimation} />
      <AlennaSkeleton height={14} width={100} variant="text" disableAnimation={disableAnimation} />
    </div>
  )
}

/**
 * LIST-PAGE variant - List page skeleton with header, search, filters, table/cards, pagination
 * Use for Students, Users, Projections, Groups pages
 */
function ListPageLoader({ className, disableAnimation, showCreateButton = false, view = "table", showFilters = true, showViewToggle = false }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Row */}
      <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <AlennaSkeleton height={28} width="40%" disableAnimation={disableAnimation} className="max-w-md" />
          <AlennaSkeleton height={20} width="70%" variant="text" disableAnimation={disableAnimation} className="max-w-2xl" />
        </div>
        {showCreateButton && (
          <AlennaSkeleton height={40} width={160} disableAnimation={disableAnimation} className="rounded-md" />
        )}
      </div>

      {/* Search Bar */}
      <AlennaSkeleton height={40} width="100%" disableAnimation={disableAnimation} className="rounded-md" />

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <AlennaSkeleton key={i} height={32} width={120} disableAnimation={disableAnimation} className="rounded-full" />
            ))}
          </div>
        )}
        {showViewToggle && (
          <div className="flex items-center gap-3">
            <AlennaSkeleton height={16} width={60} disableAnimation={disableAnimation} variant="text" />
            <div className="flex rounded-lg border bg-muted/50 p-1">
              <AlennaSkeleton height={32} width={80} disableAnimation={disableAnimation} className="rounded-md" />
              <AlennaSkeleton height={32} width={80} disableAnimation={disableAnimation} className="rounded-md" />
            </div>
          </div>
        )}
      </div>

      {/* Table or Cards */}
      {view === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <th key={i} className="h-14 px-4 text-left">
                        <AlennaSkeleton height={16} width={80} disableAnimation={disableAnimation} variant="text" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="p-4">
                          <AlennaSkeleton height={16} width={j === 0 ? 120 : j === 7 ? 40 : 100} disableAnimation={disableAnimation} variant="text" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <AlennaSkeleton height={48} width={48} variant="circular" disableAnimation={disableAnimation} />
                  <div className="flex-1 space-y-2">
                    <AlennaSkeleton height={20} width="80%" variant="text" disableAnimation={disableAnimation} />
                    <AlennaSkeleton height={16} width="60%" variant="text" disableAnimation={disableAnimation} />
                    <AlennaSkeleton height={24} width={80} disableAnimation={disableAnimation} className="rounded-full" />
                  </div>
                </div>
                <div className="mt-3 md:mt-4 space-y-2">
                  <AlennaSkeleton height={14} width="100%" variant="text" disableAnimation={disableAnimation} />
                  <AlennaSkeleton height={14} width="90%" variant="text" disableAnimation={disableAnimation} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <AlennaSkeleton height={16} width={120} variant="text" disableAnimation={disableAnimation} />
        <div className="flex items-center gap-2">
          <AlennaSkeleton height={36} width={36} disableAnimation={disableAnimation} className="rounded-md" />
          {Array.from({ length: 3 }).map((_, i) => (
            <AlennaSkeleton key={i} height={36} width={36} disableAnimation={disableAnimation} className="rounded-md" />
          ))}
          <AlennaSkeleton height={36} width={36} disableAnimation={disableAnimation} className="rounded-md" />
        </div>
      </div>
    </div>
  )
}

/**
 * DETAIL-PAGE variant - Detail page skeleton for profile/detail pages
 * Use for Student detail, User detail pages
 */
function DetailPageLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Mobile Back Button */}
      <div className="md:hidden">
        <AlennaSkeleton height={40} width={100} disableAnimation={disableAnimation} className="rounded-md" />
      </div>

      {/* Page Header */}
      <div className="space-y-2">
        <AlennaSkeleton height={28} width="40%" disableAnimation={disableAnimation} className="max-w-md" />
        <AlennaSkeleton height={20} width="70%" variant="text" disableAnimation={disableAnimation} className="max-w-2xl" />
      </div>

      {/* Content Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <AlennaSkeleton height={24} width="30%" disableAnimation={disableAnimation} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <AlennaSkeleton height={14} width="40%" variant="text" disableAnimation={disableAnimation} />
                  <AlennaSkeleton height={20} width="80%" variant="text" disableAnimation={disableAnimation} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * PROJECTION-DETAILS variant - Projection details page skeleton
 * Use for projection details page with tabs and table
 */
function ProjectionDetailsLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-4 md:space-y-6", className)}>
      {/* Mobile Back Button */}
      <div className="md:hidden">
        <AlennaSkeleton height={40} width={100} disableAnimation={disableAnimation} className="rounded-md" />
      </div>

      {/* Header with Tabs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <AlennaSkeleton height={32} width="50%" disableAnimation={disableAnimation} className="max-w-md" />
          <AlennaSkeleton height={20} width="70%" variant="text" disableAnimation={disableAnimation} className="max-w-2xl" />
        </div>
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {Array.from({ length: 4 }).map((_, i) => (
            <AlennaSkeleton key={i} height={40} width={100} disableAnimation={disableAnimation} className="rounded-t-md" />
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <AlennaSkeleton height={16} width="60%" variant="text" disableAnimation={disableAnimation} />
              <AlennaSkeleton height={32} width="40%" disableAnimation={disableAnimation} className="mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton - Matching ACEQuarterlyTable structure */}
      <Card>
        <CardHeader>
          <AlennaSkeleton height={24} width="30%" disableAnimation={disableAnimation} />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left">
                    <AlennaSkeleton height={16} width={100} disableAnimation={disableAnimation} variant="text" />
                  </th>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <th key={i} className="h-12 px-2 text-center">
                      <AlennaSkeleton height={16} width={40} disableAnimation={disableAnimation} variant="text" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3">
                      <AlennaSkeleton height={16} width={120} disableAnimation={disableAnimation} variant="text" />
                    </td>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="p-2 text-center">
                        <AlennaSkeleton height={32} width={32} disableAnimation={disableAnimation} className="rounded-md mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * DASHBOARD variant - Dashboard/home page skeleton
 * Use for dashboard page with welcome section and module cards
 */
function DashboardLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Welcome Section */}
      <div className="space-y-2">
        <AlennaSkeleton height={48} width="60%" disableAnimation={disableAnimation} className="max-w-2xl" />
        <AlennaSkeleton height={24} width="80%" variant="text" disableAnimation={disableAnimation} className="max-w-3xl" />
      </div>

      {/* Modules Section */}
      <div className="space-y-4">
        <AlennaSkeleton height={28} width="20%" disableAnimation={disableAnimation} className="max-w-xs" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ModuleCardLoader key={i} disableAnimation={disableAnimation} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * REPORT-CARDS-LIST variant - Report cards list page skeleton
 * Use for report cards list page
 */
function ReportCardsListLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header */}
      <div className="space-y-2">
        <AlennaSkeleton height={28} width="40%" disableAnimation={disableAnimation} className="max-w-md" />
        <AlennaSkeleton height={20} width="70%" variant="text" disableAnimation={disableAnimation} className="max-w-2xl" />
      </div>

      {/* List of Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <AlennaSkeleton height={24} width="200" disableAnimation={disableAnimation} />
                  <AlennaSkeleton height={16} width="300" variant="text" disableAnimation={disableAnimation} />
                </div>
                <AlennaSkeleton height={24} width={80} disableAnimation={disableAnimation} className="rounded-full" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * SIMPLE-PAGE variant - Simple page skeleton with just header and content
 * Use for simple pages with header and generic content
 */
function SimplePageLoader({ className, disableAnimation }: AlennaLoaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header */}
      <div className="space-y-2">
        <AlennaSkeleton height={28} width="40%" disableAnimation={disableAnimation} className="max-w-md" />
        <AlennaSkeleton height={20} width="70%" variant="text" disableAnimation={disableAnimation} className="max-w-2xl" />
      </div>

      {/* Generic Content */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <AlennaSkeleton key={i} height={60} width="100%" disableAnimation={disableAnimation} />
        ))}
      </div>
    </div>
  )
}

/**
 * BUTTON variant - Button loading state
 * Uses spinner (only exception to no-spinner rule)
 * Enhanced with smoother animation and better sizing
 */
function ButtonLoader({ size = "sm", className, disableAnimation }: AlennaLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  // For reduced motion, show static dot instead
  if (disableAnimation) {
    return (
      <div
        className={cn("rounded-full", className)}
        style={{
          width: size === "sm" ? "1rem" : size === "md" ? "1.5rem" : "2rem",
          height: size === "sm" ? "1rem" : size === "md" ? "1.5rem" : "2rem",
          backgroundColor: "var(--color-primary)",
          opacity: 0.8
        }}
        aria-label="Loading"
      />
    )
  }

  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        "text-primary",
        size === "lg" && "drop-shadow-sm",
        className
      )}
      style={{
        color: "var(--color-primary)",
        filter: size === "lg" ? "drop-shadow(0 1px 2px rgba(139, 92, 246, 0.3))" : undefined
      }}
      aria-label="Loading"
    />
  )
}

export function AlennaLoader({
  variant = "page",
  className,
  children,
  size = "sm",
  disableAnimation = false,
  showCreateButton = false,
  view = "table",
  showFilters = true,
  showViewToggle = false
}: AlennaLoaderProps) {
  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const shouldDisableAnimation = disableAnimation || prefersReducedMotion

  switch (variant) {
    case "page":
      return <PageLoader className={className} children={children} disableAnimation={shouldDisableAnimation} />
    case "section":
      return <SectionLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "card":
      return <CardLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "inline":
      return <InlineLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "button":
      return <ButtonLoader size={size} className={className} disableAnimation={shouldDisableAnimation} />
    case "list-page":
      return <ListPageLoader className={className} disableAnimation={shouldDisableAnimation} showCreateButton={showCreateButton} view={view} showFilters={showFilters} showViewToggle={showViewToggle} />
    case "detail-page":
      return <DetailPageLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "projection-details":
      return <ProjectionDetailsLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "dashboard":
      return <DashboardLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "report-cards-list":
      return <ReportCardsListLoader className={className} disableAnimation={shouldDisableAnimation} />
    case "simple-page":
      return <SimplePageLoader className={className} disableAnimation={shouldDisableAnimation} />
    default:
      return <PageLoader className={className} children={children} disableAnimation={shouldDisableAnimation} />
  }
}

