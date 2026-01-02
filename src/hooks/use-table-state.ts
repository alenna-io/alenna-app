import * as React from "react"

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  tableId?: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = tableId ? `alenna-table-${key}-${tableId}` : null

  const [state, setState] = React.useState<T>(() => {
    if (!storageKey) return defaultValue

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error)
    }
    return defaultValue
  })

  React.useEffect(() => {
    if (!storageKey) return

    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error)
    }
  }, [state, storageKey, key])

  return [state, setState]
}

