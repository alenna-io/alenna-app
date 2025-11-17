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

const USER_INFO_STORAGE_KEY = 'alenna_user_info'
const USER_INFO_TIMESTAMP_KEY = 'alenna_user_info_timestamp'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()
  // Try to load from sessionStorage first
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(() => {
    try {
      const stored = sessionStorage.getItem(USER_INFO_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate that cached data has required fields
        if (parsed && parsed.id && parsed.email) {
          return parsed
        } else {
          // Clear corrupted/incomplete cached data
          console.warn('[UserContext] Cached user info is incomplete, clearing it')
          sessionStorage.removeItem(USER_INFO_STORAGE_KEY)
          sessionStorage.removeItem(USER_INFO_TIMESTAMP_KEY)
        }
      }
    } catch (e) {
      console.warn('[UserContext] Failed to load user info from sessionStorage:', e)
      // Clear corrupted cached data
      try {
        sessionStorage.removeItem(USER_INFO_STORAGE_KEY)
        sessionStorage.removeItem(USER_INFO_TIMESTAMP_KEY)
      } catch {
        // Ignore errors when clearing
      }
    }
    return null
  })
  // If we have cached data, start with loading false so UI can render immediately
  // Otherwise start with loading true
  const [isLoading, setIsLoading] = React.useState(() => {
    try {
      return !sessionStorage.getItem(USER_INFO_STORAGE_KEY)
    } catch {
      return true
    }
  })
  const [error, setError] = React.useState<string | null>(null)

  const fetchUserInfo = React.useCallback(async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
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
        console.error('[UserContext] Invalid user info received:', info)
        throw new Error('Invalid user info received from server')
      }

      // Log user info for debugging (only on mobile/devices)
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        console.log('[UserContext] User info loaded on mobile:', {
          id: info.id,
          email: info.email,
          fullName: info.fullName,
          schoolName: info.schoolName,
          roles: info.roles?.map((r: { name: string }) => r.name),
        })
      }

      setUserInfo(info)

      // Persist to sessionStorage
      try {
        sessionStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(info))
        sessionStorage.setItem(USER_INFO_TIMESTAMP_KEY, Date.now().toString())
      } catch (e) {
        console.warn('[UserContext] Failed to save user info to sessionStorage:', e)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user info'
      console.error('[UserContext] Error loading user info:', err)
      setError(message)
      // Don't clear userInfo on error to avoid flickering - only clear if it's a critical error
      // Keep existing userInfo if available
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [getToken])

  // Track if we've already fetched user info in this session to prevent re-fetching
  const hasFetchedRef = React.useRef<boolean>(false)

  // Always fetch once on mount to verify/update cached data
  // But don't block the UI if we have cached data
  React.useEffect(() => {
    // Only fetch once on initial mount
    if (hasFetchedRef.current) {
      return
    }

    hasFetchedRef.current = true
    let isMounted = true

    // Fetch in the background - don't set loading to true if we have cached data
    // This allows the UI to render immediately with cached data on mobile
    const shouldShowLoading = !userInfo

    fetchUserInfo(shouldShowLoading).catch((err) => {
      // If fetch fails and we have cached data, keep using it
      console.error('[UserContext] Failed to fetch user info, using cached data if available:', err)
      if (isMounted && !userInfo) {
        // Only set error if we don't have cached data
        setError(err instanceof Error ? err.message : 'Failed to load user info')
      }
    }).finally(() => {
      if (isMounted) {
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [fetchUserInfo, userInfo])


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

