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
  const statusColor = isActive
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-gray-100 text-gray-800 border-gray-200"

  return (
    <Badge className={`${statusColor} ${className || ""}`}>
      {isActive ? activeText : inactiveText}
    </Badge>
  )
}
