# API Connection Guide

This document explains how the frontend connects to the backend API with multi-tenant architecture.

## Overview

The Alenna frontend connects to a Node.js/Express backend API that implements:
- 🔐 **Clerk Authentication** - Secure JWT-based authentication
- 🏫 **Multi-Tenant Isolation** - All data is scoped to the user's school
- 🛡️ **Automatic Data Scoping** - Backend automatically filters data by school

## Architecture

```
┌─────────────────┐
│  Frontend (App) │
│   React + Vite  │
└────────┬────────┘
         │ HTTP + Bearer Token
         ↓
┌─────────────────┐
│   Backend API   │
│  Node + Express │
├─────────────────┤
│ 1. Clerk Auth   │ ← Validates JWT token
│ 2. User Context │ ← Loads user's school
│ 3. Tenant Check │ ← Ensures school context
│ 4. Data Access  │ ← Scopes queries to school
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   (via Prisma)  │
└─────────────────┘
```

## API Service (`/src/services/api.ts`)

### Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
```

### Authentication

All API requests include:
```typescript
headers: {
  'Authorization': `Bearer ${clerkToken}`,
  'Content-Type': 'application/json'
}
```

### Students API Endpoints

| Method | Endpoint        | Description        | Tenant Scoped                               |
| ------ | --------------- | ------------------ | ------------------------------------------- |
| GET    | `/students`     | Get all students   | ✅ Yes - returns only school's students      |
| GET    | `/students/:id` | Get student by ID  | ✅ Yes - validates student belongs to school |
| POST   | `/students`     | Create new student | ✅ Yes - creates in user's school            |
| PUT    | `/students/:id` | Update student     | ✅ Yes - updates only if belongs to school   |
| DELETE | `/students/:id` | Delete student     | ✅ Yes - deletes only if belongs to school   |

## Backend Middleware Flow

Every request to `/students` goes through this middleware chain:

### 1. Clerk Middleware (`@clerk/express`)
```typescript
clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
})
```
- Validates JWT token
- Extracts Clerk user ID

### 2. Require Auth (`requireAuth()`)
```typescript
requireAuth()
```
- Ensures user is authenticated
- Returns 401 if not authenticated

### 3. Attach User Context (`attachUserContext`)
```typescript
// Finds user in database by Clerk ID
const user = await prisma.user.findUnique({
  where: { clerkId },
  include: { school: true }
});

// Attaches to request
req.userId = user.id;
req.userEmail = user.email;
req.schoolId = user.schoolId;  // ← KEY: This scopes all data
req.userRole = user.role;
```

### 4. Ensure Tenant Isolation (`ensureTenantIsolation`)
```typescript
if (!req.schoolId) {
  return res.status(401).json({ error: 'School context not found' });
}
```
- Validates school context exists
- Prevents access without school

### 5. Controller Logic
```typescript
// All queries use req.schoolId to filter data
const students = await prisma.student.findMany({
  where: { schoolId: req.schoolId }  // ← Automatic tenant filtering
});
```

## Frontend Integration

### Using the `useApi` Hook

```typescript
import { useApi } from '@/services/api';

function MyComponent() {
  const api = useApi();

  // Fetch all students (automatically scoped to user's school)
  const students = await api.students.getAll();

  // Get specific student (validates belongs to school)
  const student = await api.students.getById('student-id');

  // Create student (automatically added to user's school)
  const newStudent = await api.students.create({
    firstName: 'John',
    lastName: 'Doe',
    // ... other fields
  });

  // Update student (only if belongs to user's school)
  const updated = await api.students.update('student-id', {
    firstName: 'Jane'
  });

  // Delete student (only if belongs to user's school)
  await api.students.delete('student-id');
}
```

### Data Transformation

The frontend automatically transforms API responses:

```typescript
// Backend returns:
{
  id: "uuid",
  firstName: "John",
  lastName: "Doe",
  name: "John Doe",  // Backend provides fullName
  age: 15,
  birthDate: "2009-01-01T00:00:00.000Z",
  certificationType: "INEA",
  graduationDate: "2025-06-15T00:00:00.000Z",
  parents: [{ id: "uuid", name: "Parent Name" }],
  contactPhone: "+52 555 123 4567",
  isLeveled: true,
  expectedLevel: "Secundaria",
  address: "Street 123"
}

// Frontend uses directly (matches Student type)
```

## Security

### Multi-Tenant Isolation

1. **Authentication Required**: All endpoints require valid Clerk token
2. **User Context**: Backend loads user and school from database
3. **Automatic Scoping**: All queries filtered by `schoolId`
4. **Validation**: Cross-tenant access attempts return 404 or 401

### Example Security Flow

```typescript
// User from School A tries to access student from School B

// Frontend request
GET /students/student-from-school-b

// Backend middleware
1. ✅ Validates Clerk token
2. ✅ Loads user (schoolId = "school-a")
3. ✅ Ensures school context exists
4. ❌ Query filtered by schoolId:
   WHERE id = "student-from-school-b" 
   AND schoolId = "school-a"  // Fails - returns 404

// Result: Student not found (proper isolation)
```

## Environment Variables

### Frontend (`.env`)

```env
# Backend API endpoint
VITE_API_URL=http://localhost:3000/api/v1

# Clerk authentication (frontend)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Backend (`alenna-api/.env`)

```env
# Server configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/alenna_db"

# Clerk authentication (backend)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Error Handling

### Frontend Error Display

```typescript
try {
  const students = await api.students.getAll();
  setStudents(students);
} catch (err) {
  // Shows error message to user
  setError(err.message);
  setStudents([]); // Empty array, no fallback data
}
```

### Common Error Responses

| Status | Error                      | Meaning                                |
| ------ | -------------------------- | -------------------------------------- |
| 401    | `Unauthorized`             | Invalid or missing token               |
| 401    | `School context not found` | User not associated with school        |
| 404    | `Student not found`        | Student doesn't exist in user's school |
| 404    | `User not found in system` | User needs to complete registration    |
| 500    | `Internal server error`    | Server-side error                      |

## Testing the Connection

### 1. Start Backend

```bash
cd alenna-api
pnpm install
# Create .env with your configuration
pnpm dev
```

Backend should start on `http://localhost:3000`

### 2. Start Frontend

```bash
cd alenna-app
pnpm install
# Create .env with VITE_API_URL and Clerk keys
pnpm dev
```

Frontend should start on `http://localhost:5173`

### 3. Verify Connection

1. Sign in with Clerk
2. Backend automatically syncs user
3. Navigate to `/students`
4. Should see students from your school (or empty list if none)

### 4. Check Browser Console

Open DevTools → Network tab:
- Should see `GET http://localhost:3000/api/v1/students`
- Status should be `200 OK`
- Response should contain student array

## Debugging

### Frontend Not Connecting?

1. Check `.env` file exists with `VITE_API_URL`
2. Verify backend is running: `curl http://localhost:3000/api/v1/students`
3. Check browser console for errors
4. Verify Clerk token is being sent: Network tab → Headers

### Backend Returning Errors?

1. Check backend console for error logs
2. Verify database connection: `DATABASE_URL` in `.env`
3. Run migrations: `pnpm prisma migrate dev`
4. Verify Clerk keys match between frontend and backend

### Tenant Isolation Not Working?

1. User must exist in database (run sync: `/auth/sync`)
2. User must have `schoolId` set
3. Check backend logs for middleware flow
4. Verify `attachUserContext` loads school correctly

## Next Steps

### Extending the API

To add more tenant-scoped endpoints:

1. Add route in backend with middleware chain:
   ```typescript
   router.use(clerkMiddleware());
   router.use(requireAuth());
   router.use(attachUserContext);
   router.use(ensureTenantIsolation);
   ```

2. Always filter by `req.schoolId` in controller:
   ```typescript
   const data = await prisma.model.findMany({
     where: { schoolId: req.schoolId }
   });
   ```

3. Add API service in frontend:
   ```typescript
   export const myApi = {
     getAll: (token: string | null) => apiFetch('/my-endpoint', token)
   };
   ```

4. Use in components:
   ```typescript
   const data = await api.myApi.getAll();
   ```

## Summary

✅ **Frontend → Backend**: Authenticated with Clerk JWT  
✅ **Backend → Database**: Filtered by user's school  
✅ **Automatic Isolation**: No manual tenant checks needed  
✅ **Type Safe**: TypeScript throughout  
✅ **Secure**: Cross-tenant access prevented  

All student data is automatically scoped to the authenticated user's school. You never need to manually filter by school in your components - the backend handles it transparently.

