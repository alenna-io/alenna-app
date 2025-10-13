import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface LinkButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showChevron?: boolean
  disabled?: boolean
  className?: string
}

export function LinkButton({
  children,
  onClick,
  variant = "outline",
  size = "sm",
  showChevron = true,
  disabled = false,
  className = ""
}: LinkButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer ${className}`}
    >
      {children}
      {showChevron && <ChevronRight className="h-4 w-4 ml-1" />}
    </Button>
  )
}

