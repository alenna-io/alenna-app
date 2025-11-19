import * as React from "react"
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom"
import { UserProfile } from "@/components/user-profile"
import { Loading } from "@/components/ui/loading"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useApi } from "@/services/api"
import { useUser } from "@/contexts/UserContext"

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const api = useApi()
  const { userInfo } = useUser()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)
  const [targetUser, setTargetUser] = React.useState<any>(null)

  // Fetch user info to check permissions and get target user
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userInfo) return

        const isSuperAdmin = userInfo.roles.some((role: any) => role.name === 'SUPERADMIN')
        const isSchoolAdmin = userInfo.roles.some((role: any) => role.name === 'SCHOOL_ADMIN')
        const hasUserReadPermission = userInfo.permissions.includes('users.read')

        // SUPERADMIN can view any user
        if (isSuperAdmin && hasUserReadPermission) {
          setHasPermission(true)
          return
        }

        // SCHOOL_ADMIN can view teachers from their school
        if (isSchoolAdmin && hasUserReadPermission && userId) {
          try {
            // Get teachers from the school
            const teachers = await api.schools.getTeachers(userInfo.schoolId)
            const teacher = teachers.find((t: any) => t.id === userId)

            if (teacher) {
              setTargetUser(teacher)
              setHasPermission(true)
              return
            }
          } catch (err) {
            console.error('Error fetching teachers:', err)
          }
        }

        setHasPermission(false)
      } catch (err) {
        console.error('Error fetching user info:', err)
        setError('Error al cargar información del usuario')
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userInfo])

  const handleBackToList = () => {
    // If coming from teachers page, go back to teachers
    if (location.state?.fromTeachers || location.pathname.includes('/teachers')) {
      const schoolId = userInfo?.schoolId
      if (schoolId) {
        navigate(`/schools/${schoolId}/teachers`)
      } else {
        navigate('/configuration/school-info')
      }
    } else {
      navigate('/users')
    }
  }

  // Show loading state
  if (loading) {
    return <Loading variant="profile" />
  }

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return <Navigate to="/404" replace />
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Error al cargar"
          message={error}
        />
      </div>
    )
  }

  // Show user profile if we have a userId
  if (userId) {
    return <UserProfile userId={userId} onBack={handleBackToList} user={targetUser} />
  }

  // Fallback if no userId
  return (
    <div className="space-y-6">
      <ErrorAlert
        title="Error"
        message="ID de usuario no encontrado"
      />
    </div>
  )
}