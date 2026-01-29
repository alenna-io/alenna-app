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

  // Debug logging
  React.useEffect(() => {
    console.log('[PasswordSetupGuard] State:', {
      isLoading,
      hasUserInfo: !!userInfo,
      userInfo: userInfo ? {
        id: userInfo.id,
        email: userInfo.email,
        createdPassword: userInfo.createdPassword,
        createdPasswordType: typeof userInfo.createdPassword,
      } : null,
      currentPath: location.pathname,
    })
  }, [isLoading, userInfo, location.pathname])

  // Show loading while fetching user info - use spinner
  if (isLoading) {
    console.log('[PasswordSetupGuard] Loading user info...')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  // If user info is not loaded, don't redirect (let other guards handle it)
  if (!userInfo) {
    console.log('[PasswordSetupGuard] No user info available, allowing access')
    return <>{children}</>
  }

  // Debug: Log createdPassword value
  console.log('[PasswordSetupGuard] Checking createdPassword:', {
    createdPassword: userInfo.createdPassword,
    createdPasswordType: typeof userInfo.createdPassword,
    isFalse: userInfo.createdPassword === false,
    isUndefined: userInfo.createdPassword === undefined,
    isNull: userInfo.createdPassword === null,
    strictFalse: userInfo.createdPassword === false,
  })

  // Check if user needs to set password
  // Handle both false and undefined/null cases
  if (userInfo.createdPassword === false || userInfo.createdPassword === undefined || userInfo.createdPassword === null) {
    console.log('[PasswordSetupGuard] User needs to set password, createdPassword:', userInfo.createdPassword)

    // Allow access to password setup page itself
    if (location.pathname === "/setup-password") {
      console.log('[PasswordSetupGuard] Already on setup-password page, allowing access')
      return <>{children}</>
    }

    // Redirect to password setup
    console.log('[PasswordSetupGuard] Redirecting to /setup-password')
    return <Navigate to="/setup-password" replace />
  }

  // User has set password - if they're on the password setup page, redirect to dashboard
  if (location.pathname === "/setup-password") {
    console.log('[PasswordSetupGuard] User has password set, redirecting from setup-password to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // User has set password, allow access
  console.log('[PasswordSetupGuard] User has password set, allowing access')
  return <>{children}</>
}

