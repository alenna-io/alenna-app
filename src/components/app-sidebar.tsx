import * as React from "react"
import { Settings, Users, FileText, GraduationCap, Building, User as UserIcon, BookOpen, ClipboardList } from "lucide-react"
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useApi } from "@/services/api"
import type { ModuleData } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { LoadingSpinner } from "@/components/ui/loading"

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
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const [modules, setModules] = React.useState<ModuleData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch user's modules - wait for userInfo to be loaded first
  // Use a ref to track if we've already fetched modules for this user to prevent unnecessary re-fetches
  const lastFetchedUserIdRef = React.useRef<string | null>(null)
  const modulesFetchedRef = React.useRef<boolean>(false)

  React.useEffect(() => {
    // If userInfo is still loading, keep isLoading true but don't fetch yet
    if (isLoadingUser) {
      return
    }

    // If userInfo failed to load or is missing, stop loading and show empty state
    if (!userInfo || !userInfo.id) {
      // Log detailed info on mobile to help debug
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        console.warn('[AppSidebar] No userInfo available on mobile:', {
          hasUserInfo: !!userInfo,
          userInfoId: userInfo?.id,
          userInfoEmail: userInfo?.email,
          isLoadingUser,
          userInfoKeys: userInfo ? Object.keys(userInfo) : [],
        })
      } else {
        console.warn('[AppSidebar] No userInfo available, stopping module fetch')
      }
      setIsLoading(false)
      setModules([])
      lastFetchedUserIdRef.current = null
      modulesFetchedRef.current = false
      return
    }

    // Only fetch if this is a different user or we haven't fetched yet
    if (lastFetchedUserIdRef.current === userInfo.id && modulesFetchedRef.current) {
      // Already fetched modules for this user, don't re-fetch
      return
    }

    // UserInfo is loaded and we haven't fetched modules for this user yet
    let isMounted = true
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const userModules = await api.modules.getUserModules()
        if (isMounted) {
          // Log on mobile to help debug
          if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            console.log('[AppSidebar] Modules fetched on mobile:', {
              count: userModules?.length || 0,
              modules: userModules?.map((m: ModuleData) => ({ key: m.key, name: m.name, actions: m.actions?.length || 0 })),
            })
          }
          setModules(userModules || [])
          lastFetchedUserIdRef.current = userInfo.id
          modulesFetchedRef.current = true
        }
      } catch (error) {
        // Enhanced error logging on mobile
        if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          console.error('[AppSidebar] Error fetching modules on mobile:', {
            error,
            userId: userInfo.id,
            userEmail: userInfo.email,
            errorMessage: error instanceof Error ? error.message : String(error),
          })
        } else {
          console.error('[AppSidebar] Error fetching modules:', error)
        }
        if (isMounted) {
          setModules([])
          // Don't set lastFetchedUserIdRef on error so we can retry
          modulesFetchedRef.current = false
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
    // Only depend on isLoadingUser and userInfo.id - not the entire userInfo object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, userInfo?.id])

  // Timeout fallback: if loading takes too long (10 seconds), stop loading
  React.useEffect(() => {
    if (!isLoading) return

    const timeout = setTimeout(() => {
      console.warn('[AppSidebar] Module loading timeout, stopping loading state')
      setIsLoading(false)
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [isLoading])

  // Get school name - show "Alenna" only if userInfo is loaded but schoolName is missing
  const schoolName = userInfo?.schoolName || (userInfo ? "Alenna" : "")

  const roleNames = React.useMemo(() => {
    const roles = userInfo?.roles?.map(role => role.name) ?? []
    // Log roles for debugging on mobile devices
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && roles.length > 0) {
      console.log('[AppSidebar] User roles detected:', roles, 'from userInfo:', userInfo)
    }
    return roles
  }, [userInfo])

  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  const isSuperAdmin = hasRole('SUPERADMIN')
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN')
  const isTeacherOnly = hasRole('TEACHER') && !isSuperAdmin && !isSchoolAdmin
  const isParentOnly = hasRole('PARENT') && !isSuperAdmin && !isSchoolAdmin && !hasRole('TEACHER')
  const isStudentOnly = hasRole('STUDENT') && !isSuperAdmin && !isSchoolAdmin && !hasRole('TEACHER') && !hasRole('PARENT')
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('SCHOOL_ADMIN')

  // Log role checks for debugging on mobile
  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && userInfo) {
      console.log('[AppSidebar] Role checks:', {
        roleNames,
        isSuperAdmin,
        isSchoolAdmin,
        isTeacherOnly,
        isTeacherOrAdmin,
        schoolName: userInfo.schoolName,
        fullName: userInfo.fullName,
        email: userInfo.email,
      })
    }
  }, [roleNames, isSuperAdmin, isSchoolAdmin, isTeacherOnly, isTeacherOrAdmin, userInfo])

  // Build menu items from modules
  const filteredModules = modules.filter(module => {
    const hasActions = (module.actions?.length ?? 0) > 0
    if (!hasActions) return false

    // SUPERADMIN can only see: users, schools, and configuration
    if (isSuperAdmin) {
      return module.key === 'users' || module.key === 'schools' || module.key === 'configuration'
    }

    // Usuarios module only for Super Admins
    if (module.key === 'users' && !isSuperAdmin) {
      return false
    }

    if (module.key === 'configuration' && (isTeacherOnly || isParentOnly || isStudentOnly)) {
      return false
    }

    if (module.key === 'students' && isStudentOnly) {
      return false
    }

    return true
  })

  // Separate configuration module from other modules
  const configurationModule = filteredModules.find(module => module.key === 'configuration')
  const otherModules = filteredModules.filter(module => module.key !== 'configuration')

  const navigationMenuItems = otherModules
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
    navigationMenuItems.push({
      title: "Mi Perfil",
      url: "/my-profile",
      icon: UserIcon,
    })
  }

  // Add projections menu item for teachers and school admins
  if (isTeacherOrAdmin) {
    navigationMenuItems.push({
      title: "Proyecciones",
      url: "/projections",
      icon: BookOpen,
    })
    // Add monthly assignments management for teachers and school admins
    navigationMenuItems.push({
      title: "Asignaciones Mensuales",
      url: "/monthly-assignments",
      icon: ClipboardList,
    })
  }

  // Add report cards menu item for users with permission
  // For teachers/admins, they can access report cards from the projections page
  // For parents/students, they can access from their profile/students list
  // We'll add a general "Boletas" menu item that links to a list page
  if (userInfo && (userInfo.permissions.includes('reportCards.read') || userInfo.permissions.includes('reportCards.readOwn'))) {
    // For now, we'll add it for teachers/admins - parents/students can access via their profile
    if (isTeacherOrAdmin) {
      navigationMenuItems.push({
        title: "Boletas",
        url: "/report-cards",
        icon: FileText,
      })
    }
  }

  const allNavigationItems = [...staticMenuItems, ...navigationMenuItems]

  // Configuration menu items
  const configurationMenuItems: Array<{ title: string; url: string; icon: MenuIcon }> = []

  // Add teachers menu item to configuration section for school admins only (before Configuración)
  if (isSchoolAdmin && !isSuperAdmin) {
    configurationMenuItems.push({
      title: "Maestros",
      url: userInfo?.schoolId ? `/schools/${userInfo.schoolId}/teachers` : "/configuration/school-info",
      icon: Users,
    })
  }

  if (configurationModule) {
    const config = moduleConfig[configurationModule.key] || {
      title: configurationModule.name,
      url: `/${configurationModule.key}`,
      icon: FileText,
    }

    configurationMenuItems.push({
      title: config.title,
      url: config.url,
      icon: config.icon,
    })
  }
  const { state, setOpenMobile, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="w-[200px]">
      <SidebarHeader>
        {isCollapsed ? (
          // Collapsed state: centered toggle button below logo
          <div className="flex flex-col gap-2 items-center">
            <SidebarMenu className="w-full">
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link to="/">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <span className="text-lg font-bold">
                        {isLoadingUser ? (
                          <LoadingSpinner size="sm" className="text-sidebar-primary-foreground" />
                        ) : (
                          schoolName.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* Desktop sidebar toggle - centered when collapsed */}
            <div className="hidden md:flex w-full justify-center">
              <SidebarTrigger />
            </div>
          </div>
        ) : (
          // Expanded state: toggle button to the right of school name
          <div className="flex items-center justify-between gap-2">
            <SidebarMenu className="flex-1">
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link to="/">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <span className="text-lg font-bold">
                        {isLoadingUser ? (
                          <LoadingSpinner size="sm" className="text-sidebar-primary-foreground" />
                        ) : (
                          schoolName.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="font-semibold break-words leading-tight">
                        {isLoadingUser ? (
                          <LoadingSpinner size="sm" className="text-sidebar-primary-foreground" />
                        ) : schoolName ? (
                          schoolName
                        ) : (
                          'Cargando...'
                        )}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* Desktop sidebar toggle - to the right when expanded */}
            <SidebarTrigger className="hidden md:inline-flex" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            {(isLoading || isLoadingUser) ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="md" className="text-muted-foreground" />
              </div>
            ) : allNavigationItems.length > 0 ? (
              <SidebarMenu>
                {allNavigationItems.map((item) => {
                  // Special handling for report cards: activate "Boletas" if path contains /report-cards
                  const isReportCardPath = location.pathname.includes('/report-cards')
                  let isActive: boolean

                  if (item.url === '/report-cards') {
                    isActive = isReportCardPath
                  } else if (item.url === '/students') {
                    // Don't activate "Estudiantes" if we're on a report card page
                    isActive = !isReportCardPath && location.pathname.startsWith(item.url)
                  } else if (item.url.includes('/teachers')) {
                    // Activate "Maestros" if we're on any teachers page
                    isActive = location.pathname.includes('/teachers')
                  } else {
                    isActive = item.url === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.url)
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`!overflow-visible !h-auto [&>span:last-child]:!whitespace-normal [&>span:last-child]:!overflow-visible ${isActive ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground" : ""}`}
                      >
                        <Link
                          to={item.url}
                          onClick={() => {
                            // Close sidebar on mobile when clicking a menu item
                            if (isMobile) {
                              setOpenMobile(false)
                            }
                          }}
                          className="flex items-center gap-2 min-w-0"
                        >
                          <item.icon className="flex-shrink-0" />
                          <span className="break-words leading-tight flex-1 whitespace-normal group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            ) : (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground px-4 text-center">
                No hay módulos disponibles
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {configurationMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Configuración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {configurationMenuItems.map((item) => {
                  const isActive = item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url)

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`!overflow-visible !h-auto [&>span:last-child]:!whitespace-normal [&>span:last-child]:!overflow-visible ${isActive ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground" : ""}`}
                      >
                        <Link
                          to={item.url}
                          onClick={() => {
                            // Close sidebar on mobile when clicking a menu item
                            if (isMobile) {
                              setOpenMobile(false)
                            }
                          }}
                          className="flex items-center gap-2 min-w-0"
                        >
                          <item.icon className="flex-shrink-0" />
                          <span className="break-words leading-tight flex-1 whitespace-normal group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <UserButton />
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-semibold">
                    {isLoadingUser ? (
                      <LoadingSpinner size="sm" />
                    ) : userInfo?.fullName ? (
                      userInfo.fullName
                    ) : userInfo?.email ? (
                      userInfo.email
                    ) : (
                      'Usuario'
                    )}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {isLoadingUser ? (
                      '...'
                    ) : userInfo?.email ? (
                      userInfo.email
                    ) : (
                      'Cargando...'
                    )}
                  </span>
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
