/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

type EditMode = 'view' | 'moving' | 'editing'

interface EditModeContextValue {
  editMode: EditMode | null
  setEditMode: (mode: EditMode | null) => void
}

const EditModeContext = React.createContext<EditModeContextValue>({
  editMode: null,
  setEditMode: () => {},
})

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = React.useState<EditMode | null>(null)

  return (
    <EditModeContext.Provider value={{ editMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  return React.useContext(EditModeContext)
}
