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

// Use the same environment variable as api.ts so both use the same API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

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
          sessionStorage.removeItem(USER_INFO_STORAGE_KEY)
          sessionStorage.removeItem(USER_INFO_TIMESTAMP_KEY)
        }
      }
    } catch {
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

      // Get authentication token
      let token: string | null = null
      try {
        token = await getToken()
      } catch (tokenError) {
        const tokenErrorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError)
        console.error('[UserContext] Failed to get token:', {
          error: tokenErrorMsg,
          errorType: tokenError?.constructor?.name,
          errorString: String(tokenError),
        })
        throw new Error(`Failed to get authentication token: ${tokenErrorMsg}`)
      }

      if (!token) {
        throw new Error('No authentication token received from Clerk')
      }

      const timestamp = new Date().getTime()
      const url = `${API_BASE_URL}/auth/info?t=${timestamp}`

      let response: Response
      try {
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store',
        })
      } catch (fetchError) {
        // Network error - fetch failed completely
        const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError)
        const networkError = {
          type: 'NetworkError',
          message: fetchErrorMsg,
          name: fetchError instanceof Error ? fetchError.name : 'Unknown',
          stack: fetchError instanceof Error ? fetchError.stack : undefined,
          toString: String(fetchError),
        }
        console.error('[UserContext] Network error fetching user info:', networkError)
        throw new Error(`Network error: ${fetchErrorMsg}. Check your internet connection and API URL.`)
      }

      if (!response.ok) {
        let errorBody = ''
        try {
          errorBody = await response.text()
        } catch {
          // Ignore error reading body
        }
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: url,
          body: errorBody,
        }
        console.error('[UserContext] HTTP error response:', errorDetails)
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`)
      }

      let info: UserInfo
      try {
        info = await response.json()
      } catch (parseError) {
        const parseErrorMsg = parseError instanceof Error ? parseError.message : String(parseError)
        console.error('[UserContext] Failed to parse JSON response:', {
          error: parseErrorMsg,
          responseText: await response.text().catch(() => 'Could not read response'),
        })
        throw new Error(`Failed to parse response: ${parseErrorMsg}`)
      }

      // Validate that we have the required fields
      if (!info || !info.id || !info.email) {
        console.error('[UserContext] Invalid user info received:', info)
        throw new Error('Invalid user info received from server')
      }


      setUserInfo(info)

      // Update i18n language if user has a language preference
      if (info.language && (info.language === 'es' || info.language === 'en')) {
        try {
          // Dynamically import i18n to avoid circular dependencies
          import('@/lib/i18n').then(({ updateLanguageFromUser }) => {
            updateLanguageFromUser(info.language);
          });
        } catch {
          // Silently fail if language update fails
        }
      }

      // Persist to sessionStorage
      try {
        sessionStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(info))
        sessionStorage.setItem(USER_INFO_TIMESTAMP_KEY, Date.now().toString())
      } catch {
        // Silently fail if sessionStorage is unavailable
      }

      if (showLoading) {
        setIsLoading(false)
      }

      /* Original code (commented out - now using real API)
      let token: string | null = null
      try {
        token = await getToken()
        if (isMobile) {
          console.log('[UserContext] Token obtained:', token ? 'Yes (length: ' + token.length + ')' : 'No')
        }
      } catch (tokenError) {
        const tokenErrorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError)
        console.error('[UserContext] Failed to get token:', {
          error: tokenErrorMsg,
          errorType: tokenError?.constructor?.name,
          errorString: String(tokenError),
        })
        throw new Error(`Failed to get authentication token: ${tokenErrorMsg}`)
      }

      if (!token) {
        throw new Error('No authentication token received from Clerk')
      }

      const timestamp = new Date().getTime()
      const url = `${API_BASE_URL}/auth/info?t=${timestamp}`

      if (isMobile) {
        console.log('[UserContext] Fetching from URL:', url)
      }

      let response: Response
      try {
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store',
        })
      } catch (fetchError) {
        // Network error - fetch failed completely
        const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError)
        const networkError = {
          type: 'NetworkError',
          message: fetchErrorMsg,
          name: fetchError instanceof Error ? fetchError.name : 'Unknown',
          stack: fetchError instanceof Error ? fetchError.stack : undefined,
          toString: String(fetchError),
        }
        console.error('[UserContext] Network error fetching user info:', networkError)
        throw new Error(`Network error: ${fetchErrorMsg}. Check your internet connection and API URL.`)
      }

      if (isMobile) {
        console.log('[UserContext] Response status:', response.status, response.statusText)
      }

      if (!response.ok) {
        let errorBody = ''
        try {
          errorBody = await response.text()
        } catch {
          // Ignore error reading body
        }
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: url,
          body: errorBody,
        }
        console.error('[UserContext] HTTP error response:', errorDetails)
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`)
      }

      let info: UserInfo
      try {
        info = await response.json()
      } catch (parseError) {
        const parseErrorMsg = parseError instanceof Error ? parseError.message : String(parseError)
        console.error('[UserContext] Failed to parse JSON response:', {
          error: parseErrorMsg,
          responseText: await response.text().catch(() => 'Could not read response'),
        })
        throw new Error(`Failed to parse response: ${parseErrorMsg}`)
      }

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

      // Update i18n language if user has a language preference
      if (info.language && (info.language === 'es' || info.language === 'en')) {
        try {
          // Dynamically import i18n to avoid circular dependencies
          import('@/lib/i18n').then(({ updateLanguageFromUser }) => {
            updateLanguageFromUser(info.language);
          });
        } catch (e) {
          console.warn('[UserContext] Failed to update language:', e);
        }
      }

      // Persist to sessionStorage
      try {
        sessionStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(info))
        sessionStorage.setItem(USER_INFO_TIMESTAMP_KEY, Date.now().toString())
      } catch (e) {
        console.warn('[UserContext] Failed to save user info to sessionStorage:', e)
      }
      */
    } catch (err) {
      // Enhanced error logging with full details
      const errorDetails = {
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'Unknown',
        stack: err instanceof Error ? err.stack : undefined,
        toString: String(err),
        type: err?.constructor?.name,
        // Try to get more info
        ...(err instanceof TypeError && { typeError: true }),
      }

      // Log error details for debugging (only in development)
      if (import.meta.env.DEV) {
        console.error('[UserContext] Error loading user info:', errorDetails)
      }

      const message = err instanceof Error ? err.message : 'Failed to load user info'
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

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = React.useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

