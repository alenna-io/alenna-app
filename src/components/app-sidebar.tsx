import * as React from "react"
import { Home, Settings, Users, FileText, GraduationCap, Loader2 } from "lucide-react"
import { UserButton } from "@clerk/clerk-react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useApi } from "@/services/api"
import type { ModuleData } from "@/services/api"

// Module to route/icon mapping
const moduleConfig: Record<string, { url: string; icon: typeof GraduationCap }> = {
  Students: { url: "/students", icon: GraduationCap },
  Users: { url: "/users", icon: Users },
  Configuration: { url: "/configuration", icon: Settings },
  // Add more as modules are created
}

// Always visible items (no module required)
const staticMenuItems = [
  { title: "Inicio", url: "/", icon: Home },
]

export function AppSidebar() {
  const location = useLocation()
  const api = useApi()
  const [modules, setModules] = React.useState<ModuleData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch user's modules
  React.useEffect(() => {
    const fetchModules = async () => {
      try {
        const userModules = await api.modules.getUserModules()
        setModules(userModules)
      } catch (error) {
        console.error('Error fetching modules:', error)
        setModules([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchModules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only fetch once on mount

  // Build menu items from modules
  const dynamicMenuItems = modules.map(module => {
    const config = moduleConfig[module.name] || { url: `/${module.name.toLowerCase()}`, icon: FileText }
    return {
      title: module.name,
      url: config.url,
      icon: config.icon,
    }
  })

  const allMenuItems = [...staticMenuItems, ...dynamicMenuItems]

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-lg font-bold">A</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Alenna</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">A.C.E.</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SidebarMenu>
                {allMenuItems.map((item) => {
                  const isActive = item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url)

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={isActive ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground" : ""}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <UserButton />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">User Account</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Manage account</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
