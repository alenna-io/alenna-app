import { Navigate } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { Loading } from "@/components/ui/loading"

export function HomePage() {
  const { userInfo, isLoading } = useUser()

  if (isLoading) {
    return <Loading />
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />
  }

  const roleNames = userInfo.roles.map(role => role.name)
  const hasRole = (role: string) => roleNames.includes(role)

  // Students -> My Profile
  if (hasRole('STUDENT') && !hasRole('TEACHER') && !hasRole('SCHOOL_ADMIN') && !hasRole('SUPERADMIN')) {
    return <Navigate to="/my-profile" replace />
  }

  // Super Admin -> Users
  if (hasRole('SUPERADMIN')) {
    return <Navigate to="/users" replace />
  }

  // Teachers, Parents, School Admin -> Students
  return <Navigate to="/students" replace />
}

