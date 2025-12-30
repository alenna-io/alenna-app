import { AlennaLoader } from "./alenna-loader"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Loading - Unified loading component (wraps AlennaLoader)
 * 
 * This component now uses the premium Alenna loading system.
 * All loading states use skeletons by default, except inline/button variants.
 * 
 * Migration from old system:
 * - variant="spinner" → variant="button" or "inline" (only for small actions)
 * - variant="list" → variant="page" (cards grid)
 * - variant="profile" → variant="card"
 * - variant="table" → variant="section"
 * - variant="page" → variant="page" (unchanged)
 */

interface LoadingProps {
  /**
   * Loading variant
   * - "page": Full page skeleton (default, replaces old "list")
   * - "section": Section skeleton (replaces old "table")
   * - "card": Card skeleton (replaces old "profile")
   * - "inline": Small inline skeleton (replaces old "spinner" inline)
   * - "button": Button spinner (only for button loading states)
   */
  variant?: "page" | "section" | "card" | "inline" | "button"

  /**
   * Loading message (deprecated - no longer shown)
   * Kept for backward compatibility
   */
  message?: string

  /**
   * Size for button variant only
   */
  size?: "sm" | "md" | "lg"

  /**
   * Inline loading (deprecated - use variant="inline" instead)
   */
  inline?: boolean

  /**
   * Custom className
   */
  className?: string

  /**
   * For page variant: custom skeleton layout
   */
  children?: React.ReactNode
}

export function Loading({
  variant: propVariant,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: _message, // Deprecated but kept for compatibility
  size = "sm",
  inline,
  className,
  children
}: LoadingProps) {
  // Handle deprecated inline prop
  let variant = propVariant
  if (!variant && inline) {
    variant = "inline"
  } else if (!variant) {
    // Default changed from "spinner" to "page" (skeletons by default)
    variant = "page"
  }

  // Map old variants to new ones for backward compatibility
  const variantMap: Record<string, "page" | "section" | "card" | "inline" | "button"> = {
    spinner: inline ? "inline" : "button",
    list: "page",
    profile: "card",
    table: "section",
    page: "page"
  }

  const mappedVariant = variantMap[variant] || variant

  return (
    <AlennaLoader
      variant={mappedVariant}
      size={size}
      className={className}
      children={children}
    />
  )
}

/**
 * LoadingSpinner - Inline spinner component
 * 
 * @deprecated Use <Loading variant="button" /> or <AlennaLoader variant="button" /> instead
 * Kept for backward compatibility
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
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )}
      style={{ color: "var(--color-primary)" }}
      aria-label="Loading"
    />
  )
}
