import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  className
}: PageHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-6 w-6" />}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  )
}
