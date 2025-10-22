import type { LucideIcon } from "lucide-react"

interface SectionHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  className
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5" />}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  )
}
