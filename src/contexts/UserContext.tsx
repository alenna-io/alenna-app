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

      const response = await fetch(`${API_BASE_URL}/auth/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`)
      }

      const info = await response.json()
      setUserInfo(info)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user info'
      console.error('[UserContext] Error loading user info:', err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  React.useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

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

