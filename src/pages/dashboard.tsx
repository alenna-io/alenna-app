import * as React from "react"
import { Navigate, Link, useLocation } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { Loading } from "@/components/ui/loading"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { useTranslation } from "react-i18next"
import { GraduationCap, Users, Building } from "lucide-react"
import { ModuleIcon } from "@/components/ui/module-icon"
import { hasModuleIcon } from "@/lib/module-icon-utils"
import { DashboardResumeCards } from "@/components/dashboard-resume-cards"
import { useApi } from "@/services/api"
import type { CurrentWeekInfo } from "@/services/api"

type MenuIcon = typeof GraduationCap

export function DashboardPage() {
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { modules, isLoading: isLoadingModules } = useModuleAccess()
  const { t } = useTranslation()
  const location = useLocation()
  const api = useApi()
  const [currentWeekInfo, setCurrentWeekInfo] = React.useState<CurrentWeekInfo | null>(null)

  React.useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const weekInfo = await api.schoolYears.getCurrentWeek()
        setCurrentWeekInfo(weekInfo)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        let statusCode: number | undefined
        if (err && typeof err === 'object') {
          const errorObj = err as { status?: number; response?: { status?: number } }
          statusCode = errorObj?.status || errorObj?.response?.status
        }
        if (statusCode === 404 ||
          errorMessage.includes('año escolar activo') ||
          errorMessage.includes('No hay un año escolar activo') ||
          errorMessage.includes('404') ||
          errorMessage.includes('not found')) {
          setCurrentWeekInfo(null)
        }
      }
    }

    fetchCurrentWeek()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading when user or modules are loading
  if (isLoadingUser || isLoadingModules) {
    return <Loading variant="dashboard" />
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />
  }

  const roleNames = userInfo.roles.map(role => role.name)
  const hasRole = (role: string) => roleNames.includes(role)
  const isSuperAdmin = hasRole('SUPERADMIN')
  const isSchoolAdmin = hasRole('SCHOOL_ADMIN')
  const isStudentOnly = hasRole('STUDENT') && !isSuperAdmin && !isSchoolAdmin && !hasRole('TEACHER') && !hasRole('PARENT')
  const schoolName = userInfo?.schoolName || "Alenna"

  // Filter modules based on user access - same logic as sidebar
  const accessibleModules = modules.filter(module => {
    const hasActions = (module.actions?.length ?? 0) > 0

    if (!hasActions) {
      if (module.key === 'configuration') {
        return true
      }
      return false
    }

    if (isSuperAdmin) {
      const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
      if (isAlennaSchool) {
        return module.key === 'users' || module.key === 'schools' || module.key === 'configuration'
      } else {
        return module.key === 'configuration'
      }
    }

    if (module.key === 'users') {
      const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
      if (!isSuperAdmin || !isAlennaSchool) {
        return false
      }
    }

    if (module.key === 'schools') {
      const isAlennaSchool = schoolName?.toLowerCase() === 'alenna'
      if (!isSuperAdmin || !isAlennaSchool) {
        return false
      }
    }

    if (module.key === 'students') {
      if (isStudentOnly || isSuperAdmin) {
        return false
      }
      return true
    }

    if (module.key === 'teachers' && !isSchoolAdmin) {
      return false
    }

    if (module.key === 'groups' && !(isSchoolAdmin || hasRole('TEACHER'))) {
      return false
    }

    if (module.key === 'school_admin' && !isSchoolAdmin) {
      return false
    }

    return true
  })

  // Map modules to display format
  const moduleDisplayMap: Record<string, { title: string; url: string; icon?: MenuIcon }> = {
    students: { title: t("sidebar.students"), url: "/students" },
    projections: { title: t("sidebar.projections"), url: "/projections" },
    paces: { title: t("sidebar.lectures") || "Lectures", url: "/lectures" },
    monthlyAssignments: { title: t("sidebar.monthlyAssignments"), url: "/monthly-assignments" },
    reportCards: { title: t("sidebar.reportCards"), url: "/report-cards" },
    groups: { title: t("sidebar.groups"), url: "/groups" },
    teachers: { title: t("sidebar.teachers"), url: `/schools/${userInfo?.schoolId || ''}/teachers` },
    school_admin: { title: t("sidebar.schoolSettings"), url: "/school-settings" },
    users: { title: t("sidebar.users"), url: "/users", icon: Users },
    schools: { title: t("sidebar.schools"), url: "/schools", icon: Building },
    configuration: { title: t("sidebar.configuration"), url: "/configuration" },
  }

  const moduleItems = accessibleModules
    .filter(module => module.key !== 'configuration' && module.key !== 'school_admin')
    .map(module => {
      const config = moduleDisplayMap[module.key] || {
        title: t(`modules.${module.key}`) || module.name,
        url: `/${module.key}`,
      }
      return {
        ...config,
        moduleKey: module.key,
      }
    })

  // Add configuration module
  const configModule = accessibleModules.find(m => m.key === 'configuration')
  if (configModule) {
    moduleItems.push({
      title: moduleDisplayMap.configuration.title,
      url: moduleDisplayMap.configuration.url,
      moduleKey: 'configuration',
    })
  }

  // For students, redirect to profile
  if (isStudentOnly) {
    return <Navigate to="/my-profile" replace />
  }

  const userName = userInfo.fullName || userInfo.email || "Usuario"
  const greeting = new Date().getHours() < 12 ? t("dashboard.goodMorning") || "Buenos días" :
    new Date().getHours() < 18 ? t("dashboard.goodAfternoon") || "Buenas tardes" :
      t("dashboard.goodEvening") || "Buenas noches"

  return (
    <div className="space-y-8 px-4">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {greeting}, {userName.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("dashboard.welcomeMessage") || "Bienvenido a tu panel de control. Selecciona un módulo para comenzar."}
        </p>
      </div>

      {/* Resume Cards for School Admins */}
      {isSchoolAdmin && (
        <DashboardResumeCards currentWeekInfo={currentWeekInfo} />
      )}

      {/* Modules Grid - Single Row */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("dashboard.modules") || "Módulos"}
        </h2>
        <div className="flex flex-wrap gap-6 overflow-x-auto pb-4">
          {moduleItems.map((module) => {
            const isActive = location.pathname.startsWith(module.url)

            return (
              <Link key={module.moduleKey} to={module.url} className="shrink-0">
                <div className={`flex flex-col items-center gap-3 transition-all cursor-pointer ${isActive ? 'scale-105' : 'hover:scale-105'}`}>
                  {/* Icon with shadow and effects */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${isActive
                    ? 'shadow-lg shadow-primary/30 ring-2 ring-primary'
                    : 'shadow-md hover:shadow-lg hover:shadow-primary/20'
                    }`}>
                    {module.moduleKey && hasModuleIcon(module.moduleKey) ? (
                      <ModuleIcon moduleKey={module.moduleKey} size={80} className="rounded-2xl p-4" />
                    ) : module.icon ? (
                      <module.icon className="h-8 w-8 text-[#8B5CF6]" />
                    ) : null}
                  </div>
                  {/* Module name below */}
                  <h3 className={`font-semibold text-sm text-center transition-colors ${isActive ? 'text-primary' : 'text-foreground'
                    }`}>
                    {module.title}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>

        {moduleItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("dashboard.noModulesAvailable") || "No hay módulos disponibles en este momento."}</p>
          </div>
        )}
      </div>
    </div>
  )
}