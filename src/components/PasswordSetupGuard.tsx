import * as React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { Spinner } from "@/components/ui/spinner"

interface PasswordSetupGuardProps {
  children: React.ReactNode
}

/**
 * Guard component that checks if user needs to set their password.
 * Redirects to password setup page if createdPassword is false.
 */
export function PasswordSetupGuard({ children }: PasswordSetupGuardProps) {
  const { userInfo, isLoading } = useUser()
  const location = useLocation()

  // Show loading while fetching user info - use spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  // If user info is not loaded, don't redirect (let other guards handle it)
  if (!userInfo) {
    return <>{children}</>
  }

  // Check if user needs to set password
  // Handle both false and undefined/null cases
  if (userInfo.createdPassword === false || userInfo.createdPassword === undefined || userInfo.createdPassword === null) {

    // Allow access to password setup page itself
    if (location.pathname === "/setup-password") {
      return <>{children}</>
    }

    // Redirect to password setup
    return <Navigate to="/setup-password" replace />
  }

  // User has set password - if they're on the password setup page, redirect to dashboard
  if (location.pathname === "/setup-password") {
    return <Navigate to="/dashboard" replace />
  }

  // User has set password, allow access
  return <>{children}</>
}

