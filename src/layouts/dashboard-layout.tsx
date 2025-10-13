import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/footer"

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">Alenna</h1>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
