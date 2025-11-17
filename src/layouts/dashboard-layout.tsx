import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { MobileDebugPanel } from "@/components/mobile-debug-panel"

export function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <MobileDebugPanel />
      <div className="flex h-screen w-screen overflow-hidden relative z-0">
        {/* Sidebar - full height (100vh), fixed on desktop, overlay on mobile */}
        <AppSidebar />

        {/* Main content wrapper - padding controlled by SidebarInset based on sidebar state */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          {/* Header - fixed at top, non-scrollable */}
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 px-4 md:px-6 border-b bg-card z-10 relative">
            <Header />
          </header>

          {/* Content area - only this section scrolls */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="flex-1 p-3 md:p-6">
              <Outlet />
            </div>
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
