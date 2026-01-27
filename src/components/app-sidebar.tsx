import { UserButton } from "@clerk/clerk-react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/contexts/UserContext"
import { LoadingSpinner } from "@/components/ui/loading"
import { useTranslation } from "react-i18next"
import { ModuleIcon } from './ui/module-icon'

interface MenuItem {
  title: string
  url: string
  icon: string
}

export function AppSidebar() {
  const location = useLocation()
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { t } = useTranslation()
  const { state, setOpenMobile, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  const menuItems: MenuItem[] = [
    { title: t("sidebar.home") || "Home", url: "/", icon: "home" },
    { title: t("sidebar.projections") || "Projections", url: "/projections", icon: "projections" },
  ]

  const schoolName = userInfo?.schoolName || (userInfo ? "Alenna" : "")
  const schoolLogoUrl = userInfo?.schoolLogoUrl

  const isMenuItemActive = (url: string): boolean => {
    if (url === "/") {
      return location.pathname === "/"
    }
    if (url === "/projections") {
      return location.pathname.startsWith("/projections") ||
        (location.pathname.includes("/students/") && location.pathname.includes("/projections/"))
    }
    return location.pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon" className="w-[200px]">
      <SidebarHeader>
        {isCollapsed ? (
          // Collapsed state: centered toggle button below logo
          <div className="flex flex-col gap-2 items-center">
            <SidebarMenu className="w-full">
              <SidebarMenuItem>
                <SidebarMenuButton size="default" asChild className="justify-center">
                  <Link to="/" className="flex justify-center p-0!">
                    <div className={`flex aspect-square size-10 items-center justify-center overflow-hidden ${schoolLogoUrl ? '' : 'bg-primary text-primary-foreground rounded-xl shadow-sm'}`}>
                      {isLoadingUser ? (
                        <LoadingSpinner size="sm" className="text-sidebar-primary-foreground" />
                      ) : schoolLogoUrl ? (
                        <img src={schoolLogoUrl} alt={schoolName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-lg font-bold">
                          {schoolName.charAt(0).toUpperCase()}
                        </span>
                      )}
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
                <SidebarMenuButton size="lg" asChild className='px-2.5'>
                  <Link to="/">
                    <div className={`flex aspect-square size-10 items-center justify-center overflow-hidden ${schoolLogoUrl ? '' : 'bg-primary text-primary-foreground rounded-xl shadow-sm'}`}>
                      {isLoadingUser ? (
                        <LoadingSpinner size="sm" className="text-sidebar-primary-foreground" />
                      ) : schoolLogoUrl ? (
                        <img src={schoolLogoUrl} alt={schoolName} className="w-full h-auto! object-contain" />
                      ) : (
                        <span className="text-lg font-bold">
                          {schoolName.charAt(0).toUpperCase()}
                        </span>
                      )}
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
        <SidebarGroup>
          <SidebarGroupContent>
            {isLoadingUser ? (
              <SidebarMenu>
                {Array.from({ length: 2 }).map((_, index) => (
                  <SidebarMenuItem key={`skeleton-${index}`}>
                    <div className="flex items-center gap-2 px-2 py-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : (
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = isMenuItemActive(item.url)

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`!overflow-visible !h-auto [&>span:last-child]:!whitespace-normal [&>span:last-child]:!overflow-visible ${isActive ? "!bg-primary/90 !text-primary! hover:!bg-primary/90 hover:!text-primary data-[active=true]:!bg-primary/20 data-[active=true]:!text-primary [&>svg]:!text-primary-foreground" : ""}`}
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
                          <ModuleIcon moduleKey={item.icon} size={24} className="shrink-0" />
                          <span className="break-words leading-tight flex-1 whitespace-normal group-data-[collapsible=icon]:hidden">{item.title}</span>
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