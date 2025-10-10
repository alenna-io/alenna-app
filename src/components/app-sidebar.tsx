import { Home, Settings, Users, FileText, LayoutDashboard } from "lucide-react"
import { UserButton } from "@clerk/clerk-react"
import { Link } from "react-router-dom"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Home", url: "/", icon: Home },
  { title: "Users", url: "/users", icon: Users },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
]

interface AppSidebarProps {
  isCollapsed?: boolean
}

export function AppSidebar({ isCollapsed = false }: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className={`border-b border-sidebar-border py-4 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <span className="text-lg font-bold">A</span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-sm font-semibold">Alenna</span>
              <span className="text-xs text-sidebar-foreground/70">Your SaaS App</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex-1 py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/70">
              Navigation
            </div>
          )}
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
                }`}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t border-sidebar-border ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          <UserButton />
          {!isCollapsed && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">User Account</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
