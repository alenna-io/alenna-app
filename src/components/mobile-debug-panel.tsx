import * as React from "react"
import { useUser } from "@/contexts/UserContext"
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Store logs in localStorage for mobile debugging
const DEBUG_LOG_KEY = 'alenna_debug_logs'
const MAX_LOGS = 50

interface DebugLog {
  timestamp: string
  level: 'log' | 'warn' | 'error'
  message: string
  data?: any
}

export function MobileDebugPanel() {
  const { userInfo, isLoading, error } = useUser()
  const [isOpen, setIsOpen] = React.useState(false)
  const [logs, setLogs] = React.useState<DebugLog[]>([])

  // Check if we're on mobile
  const isMobile = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  }, [])

  // Load logs from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(DEBUG_LOG_KEY)
      if (stored) {
        setLogs(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Failed to load debug logs:', e)
    }
  }, [])

  // Add log function to window for easy access
  React.useEffect(() => {
    if (!isMobile) return

    const addLog = (level: 'log' | 'warn' | 'error', message: string, data?: any) => {
      const newLog: DebugLog = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data: data ? JSON.parse(JSON.stringify(data, null, 2)) : undefined,
      }

      setLogs((prev) => {
        const updated = [newLog, ...prev].slice(0, MAX_LOGS)
        try {
          localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(updated))
        } catch (e) {
          console.warn('Failed to save debug logs:', e)
        }
        return updated
      })
    }

    // Override console methods to capture logs
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args: any[]) => {
      originalLog.apply(console, args)
      const firstArg = args[0]
      const isRelevant = typeof firstArg === 'string' &&
        (firstArg.includes('[AppSidebar]') || firstArg.includes('[UserContext]'))
      if (isRelevant) {
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
        addLog('log', message, args.length > 1 ? args.slice(1) : undefined)
      }
    }

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args)
      const firstArg = args[0]
      const isRelevant = typeof firstArg === 'string' &&
        (firstArg.includes('[AppSidebar]') || firstArg.includes('[UserContext]'))
      if (isRelevant) {
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
        addLog('warn', message, args.length > 1 ? args.slice(1) : undefined)
      }
    }

    console.error = (...args: any[]) => {
      originalError.apply(console, args)
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      addLog('error', message, args.length > 1 ? args.slice(1) : undefined)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [isMobile])

  // Only show on mobile
  if (!isMobile) return null

  const clearLogs = () => {
    setLogs([])
    localStorage.removeItem(DEBUG_LOG_KEY)
  }

  const copyLogs = () => {
    const logText = logs.map(log =>
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n')

    navigator.clipboard.writeText(logText).then(() => {
      alert('Logs copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy logs')
    })
  }

  return (
    <>
      {/* Floating debug button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Mobile Debug Panel</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyLogs}>
                  Copy Logs
                </Button>
                <Button size="sm" variant="outline" onClick={clearLogs}>
                  Clear
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4">
              {/* Current State */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Current State</h3>
                <div className="bg-muted p-3 rounded text-xs space-y-1">
                  <div>
                    <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
                    {isLoading && <Loader2 className="h-3 w-3 inline ml-1 animate-spin" />}
                  </div>
                  <div>
                    <strong>Error:</strong> {error || 'None'}
                  </div>
                  <div>
                    <strong>User ID:</strong> {userInfo?.id || 'Not set'}
                  </div>
                  <div>
                    <strong>Email:</strong> {userInfo?.email || 'Not set'}
                  </div>
                  <div>
                    <strong>Full Name:</strong> {userInfo?.fullName || 'Not set'}
                  </div>
                  <div>
                    <strong>School Name:</strong> {userInfo?.schoolName || 'Not set'}
                  </div>
                  <div>
                    <strong>Roles:</strong> {userInfo?.roles?.map(r => r.name).join(', ') || 'Not set'}
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Logs ({logs.length})</h3>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No logs yet</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded text-xs ${log.level === 'error'
                          ? 'bg-red-50 border border-red-200'
                          : log.level === 'warn'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-muted'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {log.level === 'error' ? (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          ) : log.level === 'warn' ? (
                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          )}
                          <span className="text-muted-foreground text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-mono text-xs break-words">{log.message}</div>
                        {log.data && (
                          <pre className="mt-1 text-xs overflow-auto bg-black/5 p-2 rounded">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

