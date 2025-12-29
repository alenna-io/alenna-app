import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

function HeaderWithGradient() {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Calculate gradient stops based on sidebar state
  // Collapsed: 4rem (64px) sidebar + 1rem (16px) gap = ~80px
  // Expanded: 200px sidebar + 1rem (16px) gap = ~216px
  // Make transition imperceptible - start from 0 and fade very gradually
  const gradientStart = isCollapsed ? "80px" : "216px"
  const gradientEnd = isCollapsed ? "180px" : "320px"

  const gradientStyle = isMobile
    ? { background: 'rgba(255, 255, 255, 0.9)' }
    : {
      background: `linear-gradient(to right, rgba(246, 247, 251, 0.95) 0%, rgba(246, 247, 251, 0.95) ${gradientStart}, rgba(255, 255, 255, 0.92) ${gradientEnd}, rgba(255, 255, 255, 0.9) 100%)`,
    }

  return (
    <header
      className="flex h-14 md:h-16 shrink-0 items-center gap-2 px-4 md:px-6 border-b border-border/30 backdrop-blur-sm z-20 relative transition-[background] duration-220 ease-out"
      style={gradientStyle}
    >
      <Header />
    </header>
  )
}

export function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden relative z-0">
        {/* Sidebar - full height (100vh), fixed on desktop, overlay on mobile */}
        <AppSidebar />

        {/* Main content wrapper - spacing handled by sidebar gap div */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden bg-background bg-gradient-wash-subtle">
          {/* Header - fixed at top, non-scrollable */}
          <HeaderWithGradient />

          {/* Content area - only this section scrolls */}
          <div className="flex flex-col flex-1 overflow-y-auto pt-0 scroll-smooth" style={{ transform: 'translateZ(0)', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex-1 p-4 md:p-6">
              <Outlet />
            </div>
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
