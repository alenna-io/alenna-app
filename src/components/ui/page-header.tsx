import type { LucideIcon } from "lucide-react"
import { ModuleIcon } from "@/components/ui/module-icon"
import { hasModuleIcon } from "@/lib/module-icon-utils"

interface PageHeaderProps {
  icon?: LucideIcon
  moduleKey?: string
  title: string
  description?: string
  className?: string
}

export function PageHeader({
  icon: Icon,
  moduleKey,
  title,
  description,
  className
}: PageHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {moduleKey && hasModuleIcon(moduleKey) ? (
          <ModuleIcon moduleKey={moduleKey} size={24} className="shrink-0" />
        ) : Icon ? (
          <Icon className="h-6 w-6 shrink-0" />
        ) : null}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {description && (
        <p className="text-sm text-muted mt-1">{description}</p>
      )}
    </div>
  )
}
