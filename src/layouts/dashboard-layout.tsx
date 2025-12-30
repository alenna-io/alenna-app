import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

function HeaderWithGradient() {
  return (
    <header
      className="flex h-[60px]! w-[97%] mx-auto shrink-0 items-center gap-2 px-4 md:px-6 z-20 relative top-3 rounded-4xl bg-background/50 backdrop-blur-xs border border-border/50 shadow-lg"
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
        <SidebarInset className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden bg-transparent">
          {/* Header - fixed at top, non-scrollable */}
          <HeaderWithGradient />

          {/* Content area - only this section scrolls */}
          <div className="flex flex-col flex-1 overflow-y-auto pt-5 scroll-smooth" style={{ transform: 'translateZ(0)', WebkitOverflowScrolling: 'touch' }}>
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