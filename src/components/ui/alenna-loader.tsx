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
  variant?: "page" | "section" | "card" | "inline" | "button"

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
  disableAnimation = false
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
    default:
      return <PageLoader className={className} children={children} disableAnimation={shouldDisableAnimation} />
  }
}

