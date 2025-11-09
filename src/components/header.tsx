import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { useApi } from "@/services/api"
import type { CurrentWeekInfo } from "@/services/api"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Header() {
  const api = useApi()
  const [currentWeekInfo, setCurrentWeekInfo] = React.useState<CurrentWeekInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Fetch current week info from school year configuration
  React.useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const weekInfo = await api.schoolYears.getCurrentWeek()
        console.log('Week info loaded in header:', weekInfo)
        setCurrentWeekInfo(weekInfo)
      } catch (err) {
        console.error('Error fetching current week in header:', err)
        // Don't fail if current week can't be fetched
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentWeek()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show a placeholder while loading
  if (loading) {
    return (
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-xs text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  // If no current quarter found, try to find the closest quarter (fallback logic)
  let activeQuarter = currentWeekInfo?.currentQuarter
  let activeWeek = currentWeekInfo?.currentWeek || 0

  if (!activeQuarter && currentWeekInfo?.schoolYear?.quarters) {
    // Find the quarter that's currently happening or the most recent one
    const today = new Date()
    const sortedQuarters = [...currentWeekInfo.schoolYear.quarters].sort((a, b) => a.order - b.order)

    for (const quarter of sortedQuarters) {
      const startDate = new Date(quarter.startDate)
      const endDate = new Date(quarter.endDate)

      // If today is within this quarter (inclusive of end date)
      if (today >= startDate && today <= endDate) {
        activeQuarter = quarter
        // Calculate which week we're in
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        activeWeek = Math.floor(daysDiff / 7) + 1
        break
      }

      // If we're before the start of this quarter, use the previous quarter's last week
      if (today < startDate && quarter.order > 1) {
        const prevQuarter = sortedQuarters[quarter.order - 2]
        if (prevQuarter) {
          activeQuarter = prevQuarter
          activeWeek = prevQuarter.weeksCount || 9
        }
        break
      }
    }

    console.log('Fallback quarter selected:', activeQuarter)
  }

  // Don't render if no quarter could be determined
  if (!activeQuarter) {
    console.log('No quarter could be determined')
    return null
  }

  const currentWeekInQuarter = activeWeek
  const quarterOrder = activeQuarter.order || 0
  const currentSchoolWeek = activeWeek
    ? ((quarterOrder - 1) * 9) + activeWeek
    : 0

  return (
    <>
      {/* Mobile menu trigger */}
      <SidebarTrigger className="md:hidden" />

      {/* Breadcrumbs on the left (desktop only) */}
      <BreadcrumbNav />

      {/* Week indicator on the right */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden md:flex items-center gap-2">
          <Clock className="h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-green-900">
              {activeQuarter.displayName} - Semana {currentWeekInQuarter}
            </span>
            <span className="text-xs text-muted-foreground">
              Semana {currentSchoolWeek} del año escolar
            </span>
          </div>
        </div>
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          Semana {currentSchoolWeek}
        </Badge>
      </div>
    </>
  )
}

