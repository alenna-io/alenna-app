import * as React from "react"
import { Settings, Users, FileText, GraduationCap, Building, User as UserIcon, BookOpen, Sliders, Library, Calendar, Award, UserCog, Users2 } from "lucide-react"
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
import { useModuleAccess } from "@/hooks/useModuleAccess"
import type { ModuleData } from "@/services/api"
import { useUser } from "@/contexts/UserContext"
import { LoadingSpinner } from "@/components/ui/loading"
import { useTranslation } from "react-i18next"

type MenuIcon = typeof GraduationCap

// Module to route/icon mapping - will be created inside component to use translations


export function AppSidebar() {
  const location = useLocation()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()
  const { modules, isLoading } = useModuleAccess()

  // Module to route/icon mapping with translations
  const moduleConfig: Record<string, { title: string; url: string; icon: MenuIcon }> = React.useMemo(() => ({
    students: { title: t("sidebar.students"), url: "/students", icon: GraduationCap },
    projections: { title: t("sidebar.projections"), url: "/projections", icon: BookOpen },
    paces: { title: t("sidebar.lectures") || "Lectures", url: "/lectures", icon: Library },
    monthlyAssignments: { title: t("sidebar.monthlyAssignments"), url: "/monthly-assignments", icon: Calendar },
    reportCards: { title: t("sidebar.reportCards"), url: "/report-cards", icon: Award },
    groups: { title: t("sidebar.groups"), url: "/groups", icon: Users2 },
    teachers: { title: t("sidebar.teachers"), url: `/schools/${userInfo?.schoolId || ''}/teachers`, icon: UserCog },
    school_admin: { title: t("sidebar.schoolSettings"), url: "/school-settings", icon: Sliders },
    users: { title: t("sidebar.users"), url: "/users", icon: Users },
    schools: { title: t("sidebar.schools"), url: "/schools", icon: Building },
    configuration: { title: t("sidebar.configuration"), url: "/configuration", icon: Settings },
  }), [t, userInfo?.schoolId])

  // Get school name - show "Alenna" only if userInfo is loaded but schoolName is missing
  const schoolName = userInfo?.schoolName || (userInfo ? "Alenna" : "")

  const roleNames = React.useMemo(() => {
    const roles = userInfo?.roles?.map(role => role.name) ?? []
    // Log roles for debugging on mobile devices
    return roles
  }, [userInfo])

  const hasRole = React.useCallback((role: string) => roleNames.includes(role), [roleNames])

  const isSuperAdmin = hasRole('SUPERADMIN')
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN')
  const isStudentOnly = hasRole('STUDENT') && !isSuperAdmin && !isSchoolAdmin && !hasRole('TEACHER') && !hasRole('PARENT')

  // Build menu items from modules - filter based on module access
  const filteredModules = modules.filter(module => {
    const hasActions = (module.actions?.length ?? 0) > 0

    // Module must have actions (permissions) to be shown
    if (!hasActions) {
      // Exception: Configuration module can be shown without actions (for language/profile settings)
      if (module.key === 'configuration') {
        return true;
      }
      return false;
    }

    // SUPERADMIN can only see: users, schools modules (only in Alenna school), and configuration
    if (isSuperAdmin) {
      const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
      if (isAlennaSchool) {
        return module.key === 'users' || module.key === 'schools' || module.key === 'configuration'
      } else {
        // Super admin in non-Alenna school can only see configuration
        return module.key === 'configuration'
      }
    }

    // Users module only for Super Admins in Alenna school
    if (module.key === 'users') {
      const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
      if (!isSuperAdmin || !isAlennaSchool) {
        return false;
      }
    }

    // Schools module only for Super Admins in Alenna school
    if (module.key === 'schools') {
      const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
      if (!isSuperAdmin || !isAlennaSchool) {
        return false
      }
    }

    // Paces module is a separate module for browsing lectures catalog
    // Keep it enabled - it will show in sidebar

    // Students module - filter based on role
    if (module.key === 'students') {
      // Students can't see the students module (they see their own profile instead)
      if (isStudentOnly) {
        return false
      }
      // Super admins can't see students
      if (isSuperAdmin) {
        return false
      }
      // Parents, teachers, and school admins can see students
      return true
    }

    // Teachers module - only for school admins
    if (module.key === 'teachers' && !isSchoolAdmin) {
      return false;
    }

    // Groups module - only for school admins and teachers
    if (module.key === 'groups' && !(isSchoolAdmin || hasRole('TEACHER'))) {
      return false;
    }

    // School admin module - only for school admins (not super admins)
    if (module.key === 'school_admin' && !isSchoolAdmin) {
      return false;
    }

    // For all other modules (projections, monthlyAssignments, reportCards, paces), show if module is enabled
    return true
  })

  // Filter out configuration and school_admin modules (we'll add them manually to configuration section)
  const otherModules = filteredModules.filter(module => module.key !== 'configuration' && module.key !== 'school_admin')

  // For super admins in Alenna school, ensure users and schools modules are always present
  const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
  if (isSuperAdmin && isAlennaSchool) {
    const hasUsersModule = otherModules.some(m => m.key === 'users')
    const hasSchoolsModule = otherModules.some(m => m.key === 'schools')

    if (!hasUsersModule) {
      // Add users module manually for super admins in Alenna school
      otherModules.push({
        id: 'users-manual',
        key: 'users',
        name: t("sidebar.users"),
        description: undefined,
        displayOrder: 0,
        actions: ['users.read', 'users.create', 'users.update', 'users.delete'],
      } as ModuleData)
    }

    if (!hasSchoolsModule) {
      // Add schools module manually for super admins in Alenna school
      otherModules.push({
        id: 'schools-manual',
        key: 'schools',
        name: t("sidebar.schools"),
        description: undefined,
        displayOrder: 1,
        actions: ['schools.read', 'schools.create', 'schools.update', 'schools.delete'],
      } as ModuleData)
    }
  }

  // Organize navigation items into groups
  const academicModules = ['students', 'projections', 'reportCards', 'monthlyAssignments']
  const schoolManagementModules = ['groups', 'teachers', 'paces']

  const academicItems = otherModules
    .filter(module => academicModules.includes(module.key))
    .sort((a, b) => {
      const orderA = academicModules.indexOf(a.key)
      const orderB = academicModules.indexOf(b.key)
      return orderA - orderB
    })
    .map(module => {
      const config = moduleConfig[module.key] || {
        title: t(`modules.${module.key}`) || module.name,
        url: `/${module.key}`,
        icon: FileText,
      }
      return {
        title: config.title,
        url: config.url,
        icon: config.icon,
        moduleKey: module.key,
      }
    })

  const schoolManagementItems = otherModules
    .filter(module => schoolManagementModules.includes(module.key))
    .sort((a, b) => {
      const orderA = schoolManagementModules.indexOf(a.key)
      const orderB = schoolManagementModules.indexOf(b.key)
      return orderA - orderB
    })
    .map(module => {
      const config = moduleConfig[module.key] || {
        title: t(`modules.${module.key}`) || module.name,
        url: `/${module.key}`,
        icon: FileText,
      }
      return {
        title: config.title,
        url: config.url,
        icon: config.icon,
        moduleKey: module.key,
      }
    })

  // Other items that don't fit into the groups above
  const otherItems = otherModules
    .filter(module => !academicModules.includes(module.key) && !schoolManagementModules.includes(module.key))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map(module => {
      const config = moduleConfig[module.key] || {
        title: t(`modules.${module.key}`) || module.name,
        url: `/${module.key}`,
        icon: FileText,
      }
      return {
        title: config.title,
        url: config.url,
        icon: config.icon,
        moduleKey: module.key,
      }
    })

  if (isStudentOnly) {
    academicItems.push({
      title: t("sidebar.myProfile"),
      url: "/my-profile",
      icon: UserIcon,
      moduleKey: 'my-profile',
    })
  }

  // Configuration menu items
  // Always include Configuration for all users (for language, profile, etc.)
  const configurationMenuItems: Array<{ title: string; url: string; icon: MenuIcon }> = [
    {
      title: t("sidebar.configuration"),
      url: "/configuration",
      icon: Settings,
    }
  ]

  // Add School Settings (school_admin module) to configuration section if enabled
  const schoolAdminModule = filteredModules.find(m => m.key === 'school_admin');
  if (schoolAdminModule) {
    configurationMenuItems.unshift({
      title: t("sidebar.schoolSettings"),
      url: "/school-settings",
      icon: Sliders,
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
                <SidebarMenuButton size="lg" asChild className="justify-center">
                  <Link to="/" className="flex justify-center">
                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
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
                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <span className="text-lg font-bold">
                        {isLoadingUser ? (
                          <LoadingSpinner size="sm" className="text-sidebar-primary-foreground" />
                        ) : (
                          schoolName.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="font-semibold break-words leading-tight text-xs">
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
        {/* Helper function to render menu items */}
        {(() => {
          const renderMenuItem = (item: { title: string; url: string; icon: MenuIcon; moduleKey?: string }, index: number) => {
            const isReportCardPath = location.pathname.includes('/report-cards')
            const locationState = location.state as { fromProjectionsList?: boolean; fromTeachers?: boolean } | null
            const isProjectionDetailFromList = !!locationState?.fromProjectionsList &&
              location.pathname.includes('/students/') &&
              location.pathname.includes('/projections/')
            let isActive: boolean

            if (item.url === '/report-cards') {
              isActive = isReportCardPath
            } else if (item.url === '/projections') {
              isActive = location.pathname.startsWith('/projections') || isProjectionDetailFromList
            } else if (item.url === '/students') {
              isActive = !isReportCardPath && !isProjectionDetailFromList && location.pathname.startsWith(item.url)
            } else if (item.url.includes('/teachers')) {
              isActive = location.pathname.includes('/teachers') ||
                (location.pathname.startsWith('/users/') && !!locationState?.fromTeachers)
            } else {
              isActive = item.url === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.url)
            }

            return (
              <SidebarMenuItem key={`${item.url}-${index}`}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={`!overflow-visible !h-auto [&>span:last-child]:!whitespace-normal [&>span:last-child]:!overflow-visible ${isActive ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 hover:!text-primary-foreground data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground [&>svg]:!text-primary-foreground" : ""}`}
                >
                  <Link
                    to={item.url}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false)
                      }
                    }}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <item.icon className={`flex-shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground"}`} />
                    <span className="break-words leading-tight flex-1 whitespace-normal group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <>
              {/* Academic Section */}
              {academicItems.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel>{t("sidebar.academicSection") || "Academic"}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {(isLoading || isLoadingUser) ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="md" className="text-muted-foreground" />
                      </div>
                    ) : (
                      <SidebarMenu>
                        {academicItems.map((item, index) => renderMenuItem(item, index))}
                      </SidebarMenu>
                    )}
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {/* School Management Section */}
              {schoolManagementItems.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel>{t("sidebar.schoolManagementSection") || "School Management"}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {(isLoading || isLoadingUser) ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="md" className="text-muted-foreground" />
                      </div>
                    ) : (
                      <SidebarMenu>
                        {schoolManagementItems.map((item, index) => renderMenuItem(item, index))}
                      </SidebarMenu>
                    )}
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {/* Other items (if any) */}
              {otherItems.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {(isLoading || isLoadingUser) ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="md" className="text-muted-foreground" />
                      </div>
                    ) : (
                      <SidebarMenu>
                        {otherItems.map((item, index) => renderMenuItem(item, index))}
                      </SidebarMenu>
                    )}
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </>
          )
        })()}

        {configurationMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.configurationSection")}</SidebarGroupLabel>
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
                        className={`!overflow-visible !h-auto [&>span:last-child]:!whitespace-normal [&>span:last-child]:!overflow-visible ${isActive ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 hover:!text-primary-foreground data-[active=true]:!bg-primary data-[active=true]:!text-primary-foreground [&>svg]:!text-primary-foreground" : ""}`}
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

      <SidebarFooter className={`${isCollapsed ? "!p-0 !pb-3" : ""}`}>
        <SidebarMenu className={`${isCollapsed ? "justify-center items-center" : ""}`}>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className={isCollapsed ? "justify-center" : ""}>
              {isCollapsed ? (
                <div className="flex justify-center w-full !p-0">
                  <UserButton />
                </div>
              ) : (
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
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}