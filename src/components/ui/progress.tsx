import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  indeterminate?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indeterminate = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        {indeterminate ? (
          <div className="h-full w-1/3 bg-gradient-cool-mint-aqua animate-progress-indeterminate rounded-full" />
        ) : (
          <div
            className="h-full bg-gradient-cool-mint-aqua transition-all duration-300 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }

