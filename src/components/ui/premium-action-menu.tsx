import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
  section?: string
}

interface PremiumActionMenuProps {
  items: PremiumActionMenuItem[]
  align?: 'start' | 'end'
  className?: string
}

export function PremiumActionMenu({
  items,
  align = 'end',
  className
}: PremiumActionMenuProps) {
  const groupedItems = React.useMemo(() => {
    const groups: Map<string | undefined, PremiumActionMenuItem[]> = new Map()
    
    items.forEach((item) => {
      const section = item.section || undefined
      if (!groups.has(section)) {
        groups.set(section, [])
      }
      groups.get(section)!.push(item)
    })

    return Array.from(groups.entries())
  }, [items])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        onClick={(e) => e.stopPropagation()}
        sideOffset={8}
        className={cn(
          "rounded-md border border-border/50 bg-popover shadow-lg premium-dropdown-menu",
          "data-[state=open]:shadow-xl data-[state=closed]:shadow-lg"
        )}
      >
        {groupedItems.map(([section, sectionItems], groupIndex) => (
          <React.Fragment key={section || 'default'}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            {section && (
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {section}
              </DropdownMenuLabel>
            )}
            <DropdownMenuGroup>
              {sectionItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!item.disabled) {
                      item.onClick()
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "cursor-pointer transition-colors",
                    item.variant === 'destructive' && "text-destructive focus:text-destructive focus:bg-destructive/10"
                  )}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

