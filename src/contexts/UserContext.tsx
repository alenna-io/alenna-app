import * as React from "react"
import { useAuth } from "@clerk/clerk-react"
import type { UserInfo } from "@/services/api"

interface UserContextValue {
  userInfo: UserInfo | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const UserContext = React.createContext<UserContextValue | null>(null)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchUserInfo = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      // Add cache-busting timestamp to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`${API_BASE_URL}/auth/info?t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`)
      }

      const info = await response.json()

      // Validate that we have the required fields
      if (!info || !info.id || !info.email) {
        throw new Error('Invalid user info received from server')
      }

      setUserInfo(info)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user info'
      console.error('[UserContext] Error loading user info:', err)
      setError(message)
      // Don't clear userInfo on error to avoid flickering - only clear if it's a critical error
      // Keep existing userInfo if available
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  React.useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  // Refresh user info when the page becomes visible again (fixes iPad caching issues)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isLoading) {
        // Refresh user info when user comes back to the app
        fetchUserInfo()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchUserInfo, isLoading])

  // Periodic refresh every 5 minutes to keep data fresh
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchUserInfo()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchUserInfo, isLoading])

  const value = React.useMemo(
    () => ({
      userInfo,
      isLoading,
      error,
      refetch: fetchUserInfo,
    }),
    [userInfo, isLoading, error, fetchUserInfo]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = React.useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

