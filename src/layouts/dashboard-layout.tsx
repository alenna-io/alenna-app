import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { useState } from "react"

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        transition-all duration-300 
        flex-shrink-0 
        bg-sidebar 
        border-r 
        border-sidebar-border
        md:relative
        md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed
        z-50
        md:z-auto
        h-full
        md:h-auto
      `}>
        <AppSidebar isCollapsed={!sidebarOpen} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-0">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-xl font-semibold">Alenna</h1>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
