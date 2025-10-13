import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LoginPage } from '@/pages/login'
import { SignUpPage } from '@/pages/signup'
import { DashboardPage } from '@/pages/dashboard'
import { HomePage } from '@/pages/home'
import StudentsPage from '@/pages/students'
import ProjectionListPage from '@/pages/projection-list'
import ACEProjectionPage from '@/pages/ace-projection'
import { ScrollToTop } from '@/components/scroll-to-top'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public routes - without sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected routes - with sidebar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentsPage />} />
          <Route path="students/:studentId/projections" element={<ProjectionListPage />} />
          <Route path="students/:studentId/projections/:projectionId" element={<ACEProjectionPage />} />
          <Route path="users" element={<div className="text-2xl font-bold">Users Page</div>} />
          <Route path="documents" element={<div className="text-2xl font-bold">Documents Page</div>} />
          <Route path="settings" element={<div className="text-2xl font-bold">Settings Page</div>} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
