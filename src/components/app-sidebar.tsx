import * as React from "react"
import { Settings, Users, FileText, GraduationCap, Loader2, Building, User as UserIcon } from "lucide-react"
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
import type { ModuleData, UserInfo } from "@/services/api"

type MenuIcon = typeof GraduationCap

// Module to route/icon mapping keyed by module key
const moduleConfig: Record<string, { title: string; url: string; icon: MenuIcon }> = {
  students: { title: "Estudiantes", url: "/students", icon: GraduationCap },
  users: { title: "Usuarios", url: "/users", icon: Users },
  schools: { title: "Escuelas", url: "/schools", icon: Building },
  configuration: { title: "Configuración", url: "/configuration", icon: Settings },
  // Add more as modules are created
}

// Always visible items (no module required)
const staticMenuItems: Array<{ title: string; url: string; icon: MenuIcon }> = [
  // { title: "Inicio", url: "/", icon: Home },
]

export function AppSidebar() {
  const location = useLocation()
  const api = useApi()
  const [modules, setModules] = React.useState<ModuleData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [schoolName, setSchoolName] = React.useState<string>("Alenna")
  const [isLoadingSchool, setIsLoadingSchool] = React.useState(true)
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)

  // Fetch user's modules and school name
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch modules and school name in parallel
        const [userModules, userInfo] = await Promise.all([
          api.modules.getUserModules(),
          api.auth.getUserInfo()
        ])

        setModules(userModules)
        setSchoolName(userInfo.schoolName)
        setUserInfo(userInfo)
      } catch (error) {
        console.error('Error fetching data:', error)
        setModules([])
        // Keep default school name if fetch fails
      } finally {
        setIsLoading(false)
        setIsLoadingSchool(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only fetch once on mount

  const roleNames = React.useMemo(() => userInfo?.roles.map(role => role.name) ?? [], [userInfo])
  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  const isSuperAdmin = hasRole('SUPERADMIN')
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN')
  const isTeacherOnly = hasRole('TEACHER') && !isSuperAdmin && !isSchoolAdmin
  const isParentOnly = hasRole('PARENT') && !isSuperAdmin && !isSchoolAdmin && !hasRole('TEACHER')
  const isStudentOnly = hasRole('STUDENT') && !isSuperAdmin && !isSchoolAdmin && !hasRole('TEACHER') && !hasRole('PARENT')

  // Build menu items from modules
  const filteredModules = modules.filter(module => {
    const hasActions = (module.actions?.length ?? 0) > 0
    if (!hasActions) return false

    if (module.key === 'configuration' && (isTeacherOnly || isParentOnly || isStudentOnly)) {
      return false
    }

    if (module.key === 'students' && isStudentOnly) {
      return false
    }

    return true
  })

  const dynamicMenuItems = filteredModules
    .map(module => {
      const config = moduleConfig[module.key] || {
        title: module.name,
        url: `/${module.key}`,
        icon: FileText,
      }

      return {
        title: config.title,
        url: config.url,
        icon: config.icon,
      }
    })

  if (isStudentOnly) {
    dynamicMenuItems.push({
      title: "Mi Perfil",
      url: "/my-profile",
      icon: UserIcon,
    })
  }

  const allMenuItems = [...staticMenuItems, ...dynamicMenuItems]

  return (
    <Sidebar collapsible="icon" variant="floating" className="w-[170px]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-lg font-bold">
                    {isLoadingSchool ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      schoolName.charAt(0).toUpperCase()
                    )}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="font-semibold break-words leading-tight">
                    {isLoadingSchool ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      schoolName
                    )}
                  </span>
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
                  <span className="truncate font-semibold">Usuario</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Administrar</span>
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
