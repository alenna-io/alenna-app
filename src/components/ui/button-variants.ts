import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium press-scale disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer rounded-xs",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-white/3 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-[var(--motion-short)]",
        "primary-soft": "bg-primary-soft text-primary hover:bg-primary-soft/90 hover:shadow-md hover:shadow-primary-soft/20 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-white/3 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-[var(--motion-short)]",
        soft: "bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-md hover:shadow-primary/10 border border-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20 focus-visible:ring-destructive/25 border-1 border-destructive",
        outline:
          "bg-card/60 backdrop-blur-sm hover:bg-primary-soft hover:text-primary border-0",
        secondary:
          "bg-secondary/60 text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-primary-soft hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3.5 has-[>svg]:px-2.5 text-xs font-medium",
        lg: "h-12 px-7 has-[>svg]:px-5 text-base font-medium",
        icon: "size-10 rounded-xs",
        "icon-sm": "size-8 rounded-xs",
        "icon-lg": "size-12 rounded-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

