import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

export function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden relative z-0">
        {/* Sidebar - full height (100vh), fixed on desktop, overlay on mobile */}
        <AppSidebar />

        {/* Main content wrapper - positioned to the right of sidebar on desktop, full width on mobile */}
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden md:ml-[200px]">
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
        </div>
      </div>
    </SidebarProvider>
  )
}
