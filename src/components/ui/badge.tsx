import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "status-active" | "status-inactive" | "status-open" | "status-closed" | "status-gracePeriod" | "status-completed" | "status-failed" | "status-unfinished" | "primary-soft" | "filter-active"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    outline: "text-foreground",
    "status-active": "bg-mint-soft text-[#059669] border-0", // Darker green for contrast
    "status-inactive": "bg-amber-soft text-[#D97706] border-0", // Darker amber for contrast
    "status-open": "bg-sky-soft text-[#0284C7] border-0", // Darker sky blue for contrast
    "status-closed": "bg-coral-soft text-[#E11D48] border-0", // Darker coral for contrast
    "status-gracePeriod": "bg-soft-orange-soft text-[#EA580C] border-0", // Darker orange for contrast
    "status-completed": "bg-mint-soft text-[#059669] border-0", // Darker green for contrast
    "status-failed": "bg-coral-soft text-[#E11D48] border-0", // Darker coral for contrast
    "status-unfinished": "bg-amber-soft text-[#D97706] border-0", // Darker amber for contrast
    "primary-soft": "bg-primary-soft text-primary border-0", // Soft primary background with primary text
    "filter-active": "bg-primary-soft text-primary border-0", // Same as primary-soft, alias for filters
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }