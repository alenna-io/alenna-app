import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  onClick?: () => void
  children?: React.ReactNode
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function BackButton({
  onClick,
  children = "Volver",
  variant = "ghost",
  size = "sm",
  className = ""
}: BackButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {children}
    </Button>
  )
}

