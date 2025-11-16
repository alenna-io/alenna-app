import * as React from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { UserProfile } from "@/components/user-profile"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useApi } from "@/services/api"

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const api = useApi()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasPermission, setHasPermission] = React.useState(true)

  // Fetch user info to check permissions
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const info = await api.auth.getUserInfo()

        // Check if user has permission to view users (superadmin only)
        const hasUserReadPermission = info.permissions.includes('users.read') &&
          info.roles.some((role: any) => role.name === 'SUPERADMIN')
        setHasPermission(hasUserReadPermission)
      } catch (err) {
        console.error('Error fetching user info:', err)
        setError('Error al cargar información del usuario')
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [api.auth])

  const handleBackToList = () => {
    navigate('/users')
  }

  // Show loading state
  if (loading) {
    return <LoadingState />
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
    return <UserProfile userId={userId} onBack={handleBackToList} />
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