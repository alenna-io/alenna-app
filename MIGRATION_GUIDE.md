# React Query Migration Guide

## Current Setup (No Backend)

Your code is now structured to make React Query migration trivial:

### 1. Service Layer (`src/services/projection.service.ts`)
- Contains all data operations
- Structured like API calls
- Easy to swap with real API later

### 2. Custom Hook (`src/hooks/useProjectionData.ts`)
- Abstracts state management
- Same interface now and later
- Component doesn't need to change

### 3. Component Usage
```tsx
// src/pages/ace-projection.tsx
import { useProjectionData } from '@/hooks/useProjectionData'

export default function ACEProjectionPage() {
  const { studentId, projectionId } = useParams()
  
  // ✅ This hook call stays the same after migration!
  const {
    data: projectionData,
    isLoading,
    updatePace,
    movePace,
    addPace,
    deletePace,
  } = useProjectionData(initialProjectionData) // Now: initial data
  // Later: useProjectionData(studentId, projectionId) // Auto-fetches from API!

  if (isLoading) return <LoadingSkeleton />

  return (
    <>
      <ACEQuarterlyTable
        data={projectionData.Q1}
        onPaceToggle={updatePace}
        onPaceDrop={movePace}
        onAddPace={addPace}
        onDeletePace={deletePace}
      />
      {/* Q2, Q3, Q4... */}
    </>
  )
}
```

---

## Future Migration (When Backend is Ready)

### Step 1: Install React Query
```bash
pnpm add @tanstack/react-query
```

### Step 2: Add QueryClientProvider
```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* existing app */}
    </QueryClientProvider>
  )
}
```

### Step 3: Update Service Layer
```typescript
// src/services/projection.service.ts
export const projectionService = {
  getProjection: async (studentId: string, projectionId: string) => {
    const response = await fetch(`/api/students/${studentId}/projections/${projectionId}`)
    return response.json()
  },

  updatePace: async (params: UpdatePaceParams) => {
    const response = await fetch(`/api/paces/${params.paceId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    })
    return response.json()
  },
  
  // ... other methods
}
```

### Step 4: Update Hook Implementation
Just replace the internals of `useProjectionData.ts` with the commented React Query version!

### Step 5: Update Component
```tsx
// From:
const { data } = useProjectionData(initialData)

// To:
const { data, isLoading } = useProjectionData(studentId, projectionId)

// That's it! Everything else stays the same
```

---

## Migration Benefits

✅ **No Component Changes** - Your UI code doesn't change  
✅ **Optimistic Updates** - Instant UI feedback  
✅ **Auto Caching** - No unnecessary refetches  
✅ **Error Handling** - Built-in retry and error states  
✅ **Background Sync** - Data stays fresh  

---

## Timeline

**Now:**
- ✅ Code is structured and ready
- ✅ Works perfectly with local state
- ✅ No unnecessary complexity

**When Backend is Ready:**
- 🚀 1-2 hours to add React Query
- 🚀 Just update service layer and hook
- 🚀 Components work unchanged

**Estimated Migration Time:** ~2 hours  
**Lines of Code to Change:** ~50-100  
**Breaking Changes:** Zero

