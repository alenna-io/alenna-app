import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  isActive: boolean
  activeText?: string
  inactiveText?: string
  className?: string
}

export function StatusBadge({
  isActive,
  activeText = "Activo",
  inactiveText = "Inactivo",
  className
}: StatusBadgeProps) {
  return (
    <Badge
      variant={isActive ? "status-active" : "status-inactive"}
      className={className}
    >
      {isActive ? activeText : inactiveText}
    </Badge>
  )
}
