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
  const [studentName, setStudentName] = React.useState<string | null>(null)

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

  // Fetch student name when on daily goals page or projection detail page
  React.useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const studentsIndex = pathSegments.indexOf('students')
    const projectionsIndex = pathSegments.indexOf('projections')

    if (studentsIndex !== -1 && projectionsIndex !== -1 && projectionsIndex === studentsIndex + 2) {
      const studentId = pathSegments[studentsIndex + 1]
      const projectionId = pathSegments[projectionsIndex + 1]
      const quarterIndex = pathSegments.findIndex((seg, idx) => idx > projectionsIndex && seg.match(/^Q[1-4]$/))
      const weekIndex = pathSegments.findIndex((seg, idx) => seg === 'week' && idx > (quarterIndex >= 0 ? quarterIndex : projectionsIndex))

      // Check if this is a daily goals page or projection detail page
      const isDailyGoalsPage = quarterIndex !== -1 && weekIndex !== -1
      const isProjectionDetailPage = !isDailyGoalsPage && studentId && projectionId

      if ((isDailyGoalsPage || isProjectionDetailPage) && projectionId) {
        const fetchStudentName = async () => {
          try {
            const projection = await api.projections.getById(projectionId)
            const name = projection.student.user.firstName && projection.student.user.lastName
              ? `${projection.student.user.firstName} ${projection.student.user.lastName}`
              : projection.student.user.email || t("breadcrumbs.detail")
            setStudentName(name)
          } catch {
            setStudentName(null)
          }
        }
        fetchStudentName()
      } else {
        setStudentName(null)
      }
    } else {
      setStudentName(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

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

    // Special case: Daily goals page - extract projection detail path for quarter/week breadcrumbs
    // Path: /students/:studentId/projections/:projectionId/:quarter/week/:week
    let projectionDetailPath: string | null = null
    let isDailyGoalsPage = false
    let dailyGoalsStudentId: string | null = null
    let dailyGoalsQuarter: string | null = null
    let dailyGoalsWeek: string | null = null

    if (studentsIndex !== -1 && projectionsIndex !== -1 && projectionsIndex === studentsIndex + 2) {
      const studentId = pathSegments[studentsIndex + 1]
      const projectionId = pathSegments[projectionsIndex + 1]
      if (studentId && projectionId) {
        projectionDetailPath = `/students/${studentId}/projections/${projectionId}`

        // Check if this is a daily goals page (has quarter and week segments)
        const quarterIndex = pathSegments.findIndex((seg, idx) => idx > projectionsIndex && seg.match(/^Q[1-4]$/))
        const weekIndex = pathSegments.findIndex((seg, idx) => seg === 'week' && idx > (quarterIndex >= 0 ? quarterIndex : projectionsIndex))

        if (quarterIndex !== -1 && weekIndex !== -1 && weekIndex < pathSegments.length - 1) {
          isDailyGoalsPage = true
          dailyGoalsStudentId = studentId
          dailyGoalsQuarter = pathSegments[quarterIndex]
          dailyGoalsWeek = pathSegments[weekIndex + 1]
        }
      }
    }

    // Special case: Daily goals page breadcrumbs
    if (isDailyGoalsPage && dailyGoalsStudentId && dailyGoalsQuarter && dailyGoalsWeek) {
      const quarterNum = dailyGoalsQuarter.charAt(1)
      const items: BreadcrumbItem[] = [
        { label: t("breadcrumbs.projections"), path: '/projections' },
        { label: studentName || t("breadcrumbs.detail"), path: projectionDetailPath || `/students/${dailyGoalsStudentId}/projections` },
        { label: t("breadcrumbs.quarter", { quarter: quarterNum }), path: projectionDetailPath || '' },
        { label: t("breadcrumbs.week", { week: dailyGoalsWeek }), path: location.pathname },
      ]
      setBreadcrumbs(items)
      return
    }

    // Special case: Projection detail page (not from projections list, not daily goals)
    // Path: /students/:studentId/projections/:projectionId
    if (studentsIndex !== -1 && projectionsIndex !== -1 && projectionsIndex === studentsIndex + 2) {
      const studentId = pathSegments[studentsIndex + 1]
      const projectionId = pathSegments[projectionsIndex + 1]
      // Check if this is just the projection detail page (no quarter/week after)
      const hasQuarterOrWeek = pathSegments.some((seg, idx) =>
        idx > projectionsIndex && (seg.match(/^Q[1-4]$/) || seg === 'week')
      )

      if (studentId && projectionId && !hasQuarterOrWeek) {
        // Show: Proyecciones > <student_name>
        // studentName is fetched in the useEffect above
        setBreadcrumbs([
          { label: t("breadcrumbs.projections"), path: '/projections' },
          { label: studentName || t("breadcrumbs.detail"), path: location.pathname }
        ])
        return
      }
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
      'quarters': t("breadcrumbs.quarters"),
      'certification-types': t("breadcrumbs.certificationTypes"),
      'teachers': t("breadcrumbs.teachers"),
      'documents': t("breadcrumbs.documents"),
      'settings': t("breadcrumbs.settings"),
      'billing': t("breadcrumbs.billing") || "Billing",
      'config': t("breadcrumbs.config") || "Configuration",
    }

    let currentPath = ''

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const prevSegment = i > 0 ? pathSegments[i - 1] : null
      const nextSegment = i < pathSegments.length - 1 ? pathSegments[i + 1] : null
      currentPath += `/${segment}`

      // Handle "create" route
      if (segment === 'create') {
        if (prevSegment === 'students') {
          items.push({ label: t("breadcrumbs.createStudent") || "Create Student", path: currentPath })
          continue
        } else if (prevSegment === 'schools') {
          items.push({ label: t("breadcrumbs.createSchool") || "Create School", path: currentPath })
          continue
        } else if (prevSegment === 'groups') {
          items.push({ label: t("breadcrumbs.createGroup") || "Create Group", path: currentPath })
          continue
        } else if (prevSegment === 'projections') {
          items.push({ label: t("breadcrumbs.generateProjection") || "Generate Projection", path: currentPath })
          continue
        }
      }

      // Handle "config" route
      if (segment === 'config' && prevSegment === 'billing') {
        items.push({ label: t("breadcrumbs.config") || "Configuration", path: currentPath })
        continue
      }

      // Check if segment is an ID (UUID, Prisma ID, or numeric)
      // UUID format: 8-4-4-4-12 hex with dashes
      // Prisma ID format: alphanumeric string (e.g., cmjppw4if0001ib8czsdnyiud)
      // Numeric ID: pure numbers
      const isUUID = segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      const isNumeric = segment.match(/^\d+$/)
      // Prisma ID: typically starts with letters and contains alphanumeric, usually 20+ chars
      // More lenient: any alphanumeric string that's not a known route and is reasonably long
      const isPrismaId = !isUUID && !isNumeric && segment.length >= 15 && segment.match(/^[a-z0-9]+$/i) && !routeMap[segment]
      const isId = isUUID || isNumeric || isPrismaId

      if (isId) {
        // Check what comes before and after this ID to determine the label
        if (prevSegment === 'students' && nextSegment === 'report-cards') {
          // Skip student ID when it's followed by report-cards
          continue
        } else if (prevSegment === 'report-cards') {
          // Show "Boleta" for projection ID after report-cards
          items.push({ label: t("breadcrumbs.reportCard"), path: currentPath })
        } else if (prevSegment === 'students') {
          // Check if this is a student ID followed by projections
          if (nextSegment === 'projections') {
            // This is a student ID before projections - show "Detail" and link to student detail
            items.push({ label: t("breadcrumbs.detail"), path: currentPath })
          } else {
            // Regular student detail page
            items.push({ label: t("breadcrumbs.detail"), path: currentPath })
          }
        } else if (prevSegment === 'users') {
          // Use user name if available, otherwise use "Detail"
          items.push({ label: userName || t("breadcrumbs.detail"), path: currentPath })
        } else if (prevSegment === 'schools') {
          items.push({ label: t("breadcrumbs.detail"), path: currentPath })
        } else if (prevSegment === 'projections') {
          // This is a projection ID - link to projection detail page
          items.push({ label: t("breadcrumbs.projection"), path: currentPath })
        } else if (prevSegment === 'groups') {
          // This is a group ID in groups path (groups/:groupId)
          items.push({ label: userName || t("breadcrumbs.detail"), path: currentPath })
        } else if (prevSegment && isId) {
          // Generic ID handling - if we have a previous segment, treat it as a detail page
          // This catches cases where ID format might not match expected patterns
          items.push({ label: t("breadcrumbs.detail"), path: currentPath })
        }
        continue
      }

      // Handle special cases
      if (segment === 'week') {
        const weekNum = pathSegments[i + 1]
        // When on daily goals page, clicking week breadcrumb should go to projection detail
        if (projectionDetailPath) {
          items.push({ label: t("breadcrumbs.week", { week: weekNum }), path: projectionDetailPath })
        } else {
          items.push({ label: t("breadcrumbs.week", { week: weekNum }), path: currentPath + `/${weekNum}` })
        }
        break // Don't process further
      }

      // Handle quarter in path (Q1, Q2, etc.)
      if (segment.match(/^Q[1-4]$/)) {
        const quarterNum = segment.charAt(1)
        // When on daily goals page, clicking quarter breadcrumb should go to projection detail
        if (projectionDetailPath) {
          items.push({ label: t("breadcrumbs.quarter", { quarter: quarterNum }), path: projectionDetailPath })
        } else {
          items.push({ label: t("breadcrumbs.quarter", { quarter: quarterNum }), path: currentPath })
        }
        continue
      }

      // Map known routes
      const label = routeMap[segment]
      if (label) {
        items.push({ label, path: currentPath })
      }
    }

    setBreadcrumbs(items)
  }, [location.pathname, location.state, t, userName, studentName, userInfo?.schoolId, isSchoolAdmin])

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
            <React.Fragment key={`${crumb.path}-${index}`}>
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
