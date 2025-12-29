import { Navigate, Link, useLocation } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { Loading } from "@/components/ui/loading"
import { useModuleAccess } from "@/hooks/useModuleAccess"
import { Card, CardContent } from "@/components/ui/card"
import { AlennaSkeleton } from "@/components/ui/alenna-skeleton"
import { useTranslation } from "react-i18next"
import { GraduationCap, BookOpen, Library, Calendar, Award, Users2, UserCog, Settings, Users, Building, Sliders } from "lucide-react"

type MenuIcon = typeof GraduationCap

export function HomePage() {
  const { userInfo, isLoading: isLoadingUser } = useUser()
  const { modules, isLoading: isLoadingModules } = useModuleAccess()
  const { t } = useTranslation()
  const location = useLocation()

  // STRICT: Only render if we're actually on the home/dashboard route
  // Return null immediately if not on home route to prevent skeleton cards from showing
  const isHomeRoute = location.pathname === '/' || location.pathname === '/dashboard'

  if (!isHomeRoute) {
    return null
  }

  // MAIN LOADING: Show spinner when userInfo is loading (authentication phase)
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <Loading variant="button" size="lg" />
      </div>
    )
  }

  // PAGE LOADING: Show skeleton cards when modules are loading (after userInfo loaded)
  if (isLoadingModules) {
    return (
      <Loading variant="page">
        <div className="space-y-8 w-full">
          {/* Welcome Section Skeleton */}
          <div className="space-y-3">
            <AlennaSkeleton height={48} width="40%" className="max-w-md" />
            <AlennaSkeleton height={24} width="70%" variant="text" className="max-w-2xl" />
          </div>

          {/* Modules Section */}
          <div className="space-y-4">
            <AlennaSkeleton height={28} width="15%" className="max-w-xs" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-full">
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                    <AlennaSkeleton height={64} width={64} variant="rectangular" className="rounded-xl" />
                    <AlennaSkeleton height={24} width="80%" variant="text" className="max-w-[120px]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Loading>
    )
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

  // Filter modules based on user access
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

    if (module.key === 'users' || module.key === 'schools') {
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
  const moduleDisplayMap: Record<string, { title: string; url: string; icon: MenuIcon }> = {
    students: { title: t("sidebar.students"), url: "/students", icon: GraduationCap },
    projections: { title: t("sidebar.projections"), url: "/projections", icon: BookOpen },
    paces: { title: t("sidebar.lectures") || "Lectures", url: "/lectures", icon: Library },
    monthlyAssignments: { title: t("sidebar.monthlyAssignments"), url: "/monthly-assignments", icon: Calendar },
    reportCards: { title: t("sidebar.reportCards"), url: "/report-cards", icon: Award },
    groups: { title: t("sidebar.groups"), url: "/groups", icon: Users2 },
    teachers: { title: t("sidebar.teachers"), url: `/schools/${userInfo?.schoolId || ''}/teachers`, icon: UserCog },
    school_admin: { title: t("sidebar.schoolSettings"), url: "/school-settings", icon: Sliders },
    users: { title: t("sidebar.users"), url: "/users", icon: Users },
    schools: { title: t("sidebar.schools"), url: "/schools", icon: Building },
    configuration: { title: t("sidebar.configuration"), url: "/configuration", icon: Settings },
  }

  const moduleItems = accessibleModules
    .filter(module => module.key !== 'configuration' && module.key !== 'school_admin')
    .map(module => {
      const config = moduleDisplayMap[module.key] || {
        title: t(`modules.${module.key}`) || module.name,
        url: `/${module.key}`,
        icon: Settings,
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
      icon: Settings,
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {greeting}, {userName.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("dashboard.welcomeMessage") || "Bienvenido a tu panel de control. Selecciona un módulo para comenzar."}
        </p>
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("dashboard.modules") || "Módulos"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {moduleItems.map((module) => {
            const isActive = location.pathname.startsWith(module.url)
            const IconComponent = module.icon

            return (
              <Link key={module.moduleKey} to={module.url}>
                <Card className={`h-full transition-all hover:shadow-xl hover:shadow-primary/10 cursor-pointer border-2 ${isActive ? 'ring-2 ring-primary border-primary shadow-lg' : 'border-transparent hover:border-primary/20'}`}>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                    <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-[#8B5CF6]" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">{module.title}</h3>
                    </div>
                  </CardContent>
                </Card>
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