import * as React from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  path: string
}

export function BreadcrumbNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([])

  React.useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []

    // Map routes to breadcrumb labels
    const routeMap: Record<string, string> = {
      'students': 'Estudiantes',
      'users': 'Usuarios',
      'schools': 'Escuelas',
      'configuration': 'Configuración',
      'projections': 'Proyecciones',
      'my-profile': 'Mi Perfil',
      'school-years': 'Años Escolares',
      'school-info': 'Información de la Escuela',
      'daily-goals': 'Metas Diarias',
      'report-cards': 'Boletas',
    }

    let currentPath = ''

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const prevSegment = i > 0 ? pathSegments[i - 1] : null
      const nextSegment = i < pathSegments.length - 1 ? pathSegments[i + 1] : null
      currentPath += `/${segment}`

      // Skip UUIDs and numeric IDs in breadcrumbs display
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
        segment.match(/^\d+$/)) {
        // Check what comes before and after this ID to determine the label
        if (prevSegment === 'students' && nextSegment === 'report-cards') {
          // Skip student ID when it's followed by report-cards
          continue
        } else if (prevSegment === 'report-cards') {
          // Show "Boleta" for projection ID after report-cards
          items.push({ label: 'Boleta', path: currentPath })
        } else if (prevSegment === 'students') {
          items.push({ label: 'Detalle', path: currentPath })
        } else if (prevSegment === 'users') {
          items.push({ label: 'Detalle', path: currentPath })
        } else if (prevSegment === 'schools') {
          items.push({ label: 'Detalle', path: currentPath })
        } else if (prevSegment === 'projections') {
          items.push({ label: 'Proyección', path: currentPath })
        }
        continue
      }

      // Handle special cases
      if (segment === 'week') {
        const weekNum = pathSegments[i + 1]
        items.push({ label: `Semana ${weekNum}`, path: currentPath + `/${weekNum}` })
        break // Don't process further
      }

      // Handle quarter in path (Q1, Q2, etc.)
      if (segment.match(/^Q[1-4]$/)) {
        const quarterNum = segment.charAt(1)
        items.push({ label: `Bloque ${quarterNum}`, path: currentPath })
        continue
      }

      // Map known routes
      const label = routeMap[segment]
      if (label) {
        items.push({ label, path: currentPath })
      }
    }

    setBreadcrumbs(items)
  }, [location.pathname])

  // Don't show breadcrumbs on home page
  if (location.pathname === '/' || breadcrumbs.length === 0) {
    return null
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Back button - only show if not on first level */}
      {breadcrumbs.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={crumb.path}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {isLast ? (
                <span className="font-semibold text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </nav>
    </div>
  )
}

