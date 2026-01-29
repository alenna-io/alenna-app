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
      } catch (err: unknown) {
        // Silently handle missing active school year - this is expected for super admins
        // or when no school year is configured yet
        const errorMessage = err instanceof Error ? err.message : String(err)

        // Extract status code from error object
        let statusCode: number | undefined
        if (err && typeof err === 'object') {
          const errorObj = err as { status?: number; response?: { status?: number } }
          statusCode = errorObj?.status || errorObj?.response?.status
        }

        // Check for 404 errors or messages indicating no active school year
        if (statusCode === 404 ||
          errorMessage.includes('año escolar activo') ||
          errorMessage.includes('No hay un año escolar activo') ||
          errorMessage.includes('404') ||
          errorMessage.includes('not found')) {
          // Expected case - no active school year, don't show error
          setCurrentWeekInfo(null)
        } else {
          // Unexpected error, log it (but don't log 404s as they're expected)
          console.error('Error fetching current week in header:', err)
        }
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

  // Use the current week info from the API
  const activeQuarter = currentWeekInfo?.currentQuarter
  const activeWeek = currentWeekInfo?.currentWeek || 0

  const currentWeekInQuarter = activeWeek
  const quarterOrder = activeQuarter?.order || 0
  const currentSchoolWeek = activeWeek && quarterOrder
    ? ((quarterOrder - 1) * 9) + activeWeek
    : 0

  // Get translated quarter name
  const getQuarterLabel = (quarterName: string) => {
    const quarterLabels: { [key: string]: string } = {
      'Q1': t("common.quarterLabelQ1"),
      'Q2': t("common.quarterLabelQ2"),
      'Q3': t("common.quarterLabelQ3"),
      'Q4': t("common.quarterLabelQ4"),
    }
    return quarterLabels[quarterName] || activeQuarter?.displayName || quarterName
  }

  return (
    <div className="w-full h-[60px]! rounded-3xl p-3 md:p-4 flex items-center gap-3 mx-auto">
      {/* Mobile menu trigger - only on small screens */}
      <SidebarTrigger className="md:hidden shrink-0" />

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
    </div>
  )
}

