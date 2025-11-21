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
    ? "bg-green-100 text-green-800 border border-green-300"
    : "bg-orange-100 text-orange-800 border border-orange-300"

  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor} ${className || ""}`}
    >
      {isActive ? activeText : inactiveText}
    </Badge>
  )
}
