import { cn } from "@/lib/utils"
import * as React from "react"

/**
 * AlennaSkeleton - Premium skeleton component with shimmer animation
 * 
 * Core Philosophy:
 * - Soft surfaces breathing
 * - Gentle shimmer (not pulsing)
 * - Matches component radius
 * - Uses Alenna color system
 */
interface AlennaSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of skeleton
   * Can be a Tailwind class or specific value
   */
  width?: string | number

  /**
   * Height of skeleton
   * Can be a Tailwind class or specific value
   */
  height?: string | number

  /**
   * Shape variant
   */
  variant?: "rectangular" | "circular" | "text"

  /**
   * Disable animation (for reduced motion)
   */
  disableAnimation?: boolean
}

export function AlennaSkeleton({
  className,
  width,
  height,
  variant = "rectangular",
  disableAnimation = false,
  style,
  ...props
}: AlennaSkeletonProps) {
  const baseClasses = "relative overflow-hidden"

  // Shape-specific classes
  const shapeClasses = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded"
  }

  // Base skeleton color - more visible gray (softer but visible)
  const baseStyle: React.CSSProperties = {
    backgroundColor: "#E5E7EB", // More visible gray (#E5E7EB instead of #EFF1F9)
    width: width,
    height: height,
    ...style
  }

  return (
    <div
      className={cn(
        baseClasses,
        shapeClasses[variant],
        className
      )}
      style={baseStyle}
      {...props}
    >
      {/* Shimmer overlay */}
      {!disableAnimation && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer will-change-transform"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(108, 99, 255, 0.15) 20%,
              rgba(196, 181, 253, 0.20) 50%,
              rgba(108, 99, 255, 0.15) 80%,
              transparent 100%
            )`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

