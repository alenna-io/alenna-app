import * as React from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"

interface BreadcrumbItem {
  label: string
  path: string
}

export function BreadcrumbNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const api = useApi()
  const { userInfo } = useUser()
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([])
  const [userName, setUserName] = React.useState<string | null>(null)

  // Check if user is school admin
  const isSchoolAdmin = React.useMemo(() => {
    return userInfo?.roles.some((role) => role.name === 'SCHOOL_ADMIN') &&
      !userInfo?.roles.some((role) => role.name === 'SUPERADMIN')
  }, [userInfo])

  // Fetch user/teacher name when on user detail page or group detail page
  React.useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const userIndex = pathSegments.indexOf('users')
    const groupsIndex = pathSegments.indexOf('groups')

    // Check if we're on a user detail page
    if (userIndex >= 0 && pathSegments.length > userIndex + 1) {
      const userId = pathSegments[userIndex + 1]
      // Check if it's a UUID (user detail page)
      if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const fetchUserName = async () => {
          try {
            let user: { id: string; firstName?: string; lastName?: string; email: string } | undefined

            // For school admins, try /me/teachers first to avoid 404 errors
            if (isSchoolAdmin) {
              try {
                const teachers = await api.schools.getMyTeachers()
                user = teachers.find((t: { id: string }) => t.id === userId)
                if (user) {
                  // Found user, exit early
                  const name = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  setUserName(name)
                  return
                }
              } catch {
                // Silently fail - expected for some cases
              }
              // If /me/teachers didn't find the user or failed, just show "Detail"
              setUserName(null)
              return
            } else {
              // For super admins, try getUsers
              try {
                const users = await api.getUsers()
                user = users.find((u: { id: string }) => u.id === userId)
              } catch {
                // If getUsers fails, just show "Detail"
                setUserName(null)
                return
              }
            }

            if (user) {
              const name = user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email
              setUserName(name)
            } else {
              // If user not found in list (e.g., deactivated), just show "Detail" if not found
              setUserName(null)
            }
          } catch {
            // Silently fail - just show "Detail" instead
            // Don't log to console to avoid noise from expected permission errors
            setUserName(null)
          }
        }
        fetchUserName()
      } else {
        setUserName(null)
      }
    }
    // Check if we're on a group detail page (groups/:groupId)
    else if (groupsIndex >= 0 && pathSegments.length > groupsIndex + 1) {
      const groupId = pathSegments[groupsIndex + 1]
      // Check if it's a UUID (group ID)
      if (groupId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const fetchGroupName = async () => {
          try {
            // Fetch group by ID to get group name
            const group = await api.groups.getById(groupId)
            if (group && !group.deletedAt) {
              // Use group name if available, otherwise fetch teacher name
              if (group.name) {
                setUserName(group.name)
                return
              }

              // If no group name, fetch teacher name
              if (isSchoolAdmin) {
                try {
                  const teachers = await api.schools.getMyTeachers()
                  const teacher = teachers.find((t: { id: string }) => t.id === group.teacherId)
                  if (teacher) {
                    const name = teacher.firstName && teacher.lastName
                      ? `${teacher.firstName} ${teacher.lastName}`
                      : teacher.email || teacher.fullName || t("breadcrumbs.detail")
                    setUserName(name)
                    return
                  }
                } catch {
                  // Silently fail
                }
              }
              setUserName(null)
            } else {
              setUserName(null)
            }
          } catch {
            // Silently fail - just show "Detail" instead
            setUserName(null)
          }
        }
        fetchGroupName()
      } else {
        setUserName(null)
      }
    } else {
      setUserName(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isSchoolAdmin])

  React.useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const locationState = location.state as { fromProjectionsList?: boolean; studentName?: string; fromTeachers?: boolean } | null

    // Special case: User detail page accessed from teachers page
    // Path: /users/:userId with state.fromTeachers = true
    const userIndex = pathSegments.indexOf('users')
    if (userIndex >= 0 && pathSegments.length > userIndex + 1 && locationState?.fromTeachers) {
      const userId = pathSegments[userIndex + 1]
      // Check if it's a UUID (user detail page)
      if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Show: Maestros > <teacher_name>
        // Get schoolId from userInfo or use 'me' as fallback
        const schoolId = userInfo?.schoolId || 'me'
        setBreadcrumbs([
          { label: t("breadcrumbs.teachers"), path: `/schools/${schoolId}/teachers` },
          { label: userName || t("breadcrumbs.detail"), path: location.pathname }
        ])
        return
      }
    }

    // Special case: Teachers module should be independent from Schools in breadcrumbs.
    // Any route that includes "teachers" will show only a single "Teachers" crumb.
    const teachersIndex = pathSegments.indexOf('teachers')
    if (teachersIndex !== -1) {
      const teachersPath = '/' + pathSegments.slice(0, teachersIndex + 1).join('/')
      setBreadcrumbs([{ label: t("breadcrumbs.teachers"), path: teachersPath }])
      return
    }

    // Special case: Projection detail page accessed from projections list
    // Path: /students/:studentId/projections/:projectionId
    const projectionsIndex = pathSegments.indexOf('projections')
    const studentsIndex = pathSegments.indexOf('students')

    if (locationState?.fromProjectionsList &&
      studentsIndex !== -1 &&
      projectionsIndex !== -1 &&
      projectionsIndex === studentsIndex + 2) {
      // We're on a projection detail page accessed from projections list
      // Show: Proyecciones > <student_name>
      const studentName = locationState.studentName || t("breadcrumbs.detail")
      const projectionsPath = '/projections'
      setBreadcrumbs([
        { label: t("breadcrumbs.projections"), path: projectionsPath },
        { label: studentName, path: location.pathname }
      ])
      return
    }

    const items: BreadcrumbItem[] = []

    // Map routes to breadcrumb labels with translations
    const routeMap: Record<string, string> = {
      'students': t("breadcrumbs.students"),
      'users': t("breadcrumbs.users"),
      'schools': t("breadcrumbs.schools"),
      'configuration': t("breadcrumbs.configuration"),
      'projections': t("breadcrumbs.projections"),
      'my-profile': t("breadcrumbs.myProfile"),
      'school-years': t("breadcrumbs.schoolYears"),
      'school-info': t("breadcrumbs.schoolInfo"),
      'daily-goals': t("breadcrumbs.dailyGoals"),
      'report-cards': t("breadcrumbs.reportCards"),
      'groups': t("breadcrumbs.groups"),
      'dashboard': t("breadcrumbs.dashboard"),
      'lectures': t("breadcrumbs.lectures"),
      'monthly-assignments': t("breadcrumbs.monthlyAssignments"),
      'school-settings': t("breadcrumbs.schoolSettings"),
      'teachers': t("breadcrumbs.teachers"),
      'documents': t("breadcrumbs.documents"),
      'settings': t("breadcrumbs.settings"),
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
          items.push({ label: t("breadcrumbs.reportCard"), path: currentPath })
        } else if (prevSegment === 'students') {
          items.push({ label: t("breadcrumbs.detail"), path: currentPath })
        } else if (prevSegment === 'users') {
          // Use user name if available, otherwise use "Detail"
          items.push({ label: userName || t("breadcrumbs.detail"), path: currentPath })
        } else if (prevSegment === 'schools') {
          items.push({ label: t("breadcrumbs.detail"), path: currentPath })
        } else if (prevSegment === 'projections') {
          items.push({ label: t("breadcrumbs.projection"), path: currentPath })
        } else if (prevSegment === 'groups') {
          // This is a group ID in groups path (groups/:groupId)
          items.push({ label: userName || t("breadcrumbs.detail"), path: currentPath })
        }
        continue
      }

      // Handle special cases
      if (segment === 'week') {
        const weekNum = pathSegments[i + 1]
        items.push({ label: t("breadcrumbs.week", { week: weekNum }), path: currentPath + `/${weekNum}` })
        break // Don't process further
      }

      // Handle quarter in path (Q1, Q2, etc.)
      if (segment.match(/^Q[1-4]$/)) {
        const quarterNum = segment.charAt(1)
        items.push({ label: t("breadcrumbs.quarter", { quarter: quarterNum }), path: currentPath })
        continue
      }

      // Map known routes
      const label = routeMap[segment]
      if (label) {
        items.push({ label, path: currentPath })
      }
    }

    setBreadcrumbs(items)
  }, [location.pathname, t, userName])

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
