import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * AlennaBackground - Premium atmospheric background gradient
 * 
 * Multi-layer gradient system:
 * - Base wash: Large radial gradient covering viewport
 * - Color blooms: 2-3 soft radial gradients positioned off-center
 * - Optional: Ultra-light grain texture
 * 
 * Colors:
 * - Lavender/Indigo (primary)
 * - Sky Blue (secondary)
 * - Soft Coral/Peach (accent)
 * - Mint/Teal (accent)
 * - Warm off-white (neutral)
 */

interface AlennaBackgroundProps {
  /**
   * Enable slow animation (drift effect)
   * @default true
   */
  animated?: boolean

  /**
   * Animation duration in seconds
   * @default 90
   */
  duration?: number

  /**
   * Custom className
   */
  className?: string
}

export function AlennaBackground({
  animated = true,
  duration = 90,
  className
}: AlennaBackgroundProps) {
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

  const shouldAnimate = animated && !prefersReducedMotion

  return (
    <div
      className={cn(
        "fixed inset-0 -z-10 pointer-events-none overflow-hidden",
        shouldAnimate && "animate-background-drift",
        className
      )}
      style={{
        // Base color - soft off-white (intermediate between white and #F6F7FB)
        backgroundColor: "#FBFBFD",
        // Multi-layer gradient system - Subtle purple-orange (intermediate visibility)
        backgroundImage: [
          // Layer 1: Top-left purple/lavender bloom - subtle
          "radial-gradient(ellipse 140% 120% at -10% -10%, rgba(196, 181, 253, 0.08) 0%, rgba(108, 99, 255, 0.04) 30%, transparent 65%)",
          // Layer 2: Bottom-right orange/peach bloom - subtle
          "radial-gradient(ellipse 130% 140% at 110% 110%, rgba(255, 180, 162, 0.07) 0%, rgba(251, 113, 133, 0.03) 35%, transparent 70%)",
          // Layer 3: Center soft purple blend - subtle
          "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(196, 181, 253, 0.05) 0%, transparent 50%)",
          // Layer 4: Top-right soft orange - subtle
          "radial-gradient(ellipse 110% 100% at 85% 15%, rgba(255, 180, 162, 0.05) 0%, transparent 60%)",
          // Ultra-light grain texture (prevents banding) - only when not animated
          ...(shouldAnimate ? [] : ["url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E\")"])
        ].join(", "),
        animationDuration: shouldAnimate ? `${duration}s` : undefined,
      }}
      aria-hidden="true"
    >
      {/* Additional barely perceptible depth layer - purple-orange */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 25% 25%, rgba(196, 181, 253, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 180, 162, 0.03) 0%, transparent 50%)
          `,
          mixBlendMode: 'multiply',
          opacity: 0.35
        }}
      />
    </div>
  )
}

