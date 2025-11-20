import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { useApi } from "@/services/api"
import type { CurrentWeekInfo } from "@/services/api"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTranslation } from "react-i18next"

export function Header() {
  const api = useApi()
  const { t } = useTranslation()
  const [currentWeekInfo, setCurrentWeekInfo] = React.useState<CurrentWeekInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Fetch current week info from school year configuration
  React.useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const weekInfo = await api.schoolYears.getCurrentWeek()
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
        <span className="text-xs text-muted-foreground">{t("common.loading")}</span>
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
  }

  const currentWeekInQuarter = activeQuarter ? activeWeek : 0
  const quarterOrder = activeQuarter?.order || 0
  const currentSchoolWeek = activeWeek
    ? ((quarterOrder - 1) * 9) + activeWeek
    : 0

  // Get translated quarter name
  const getQuarterLabel = (quarterName: string) => {
    const quarterLabels: { [key: string]: string } = {
      'Q1': t("monthlyAssignments.quarterLabelQ1"),
      'Q2': t("monthlyAssignments.quarterLabelQ2"),
      'Q3': t("monthlyAssignments.quarterLabelQ3"),
      'Q4': t("monthlyAssignments.quarterLabelQ4"),
    }
    return quarterLabels[quarterName] || activeQuarter?.displayName || quarterName
  }

  return (
    <>
      {/* Mobile menu trigger - only on small screens */}
      <SidebarTrigger className="md:hidden mr-2" />

      {/* Breadcrumbs on the left (desktop only) */}
      <BreadcrumbNav />

      {/* Week indicator on the right - only render if we have a quarter */}
      {activeQuarter && (
        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden md:flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-green-900">
                {getQuarterLabel(activeQuarter.name)} - {t("common.week")} {currentWeekInQuarter}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("common.week")} {currentSchoolWeek} {t("common.ofTheSchoolYear")}
              </span>
            </div>
          </div>
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            {t("common.week")} {currentSchoolWeek}
          </Badge>
        </div>
      )}
    </>
  )
}

