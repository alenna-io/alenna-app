import * as React from "react"
import { getModuleIconPath } from "@/lib/module-icon-utils"

interface ModuleIconProps {
  moduleKey: string
  className?: string
  size?: number
}

export function ModuleIcon({ moduleKey, className, size = 80 }: ModuleIconProps): React.ReactElement | null {
  const iconName = getModuleIconPath(moduleKey)

  // If no icon file exists for this module, return null (caller should handle fallback)
  if (iconName === null || iconName === undefined) {
    return null
  }

  const iconPath = `/icons/modules/${iconName}.svg`

  return (
    <img
      src={iconPath}
      alt={`${moduleKey} icon`}
      className={className}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  )
}

