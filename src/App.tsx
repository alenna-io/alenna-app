import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LoginPage } from '@/pages/login'
import { SignUpPage } from '@/pages/signup'
import { DashboardPage } from '@/pages/dashboard'
import ConfigurationPage from '@/pages/configuration'
import ConfigurationLanguagePage from '@/pages/configuration-language'
import { NotFoundPage } from '@/pages/not-found'
import { ScrollToTop } from '@/components/scroll-to-top'
import { AuthSync } from '@/components/auth-sync'
import { UserProvider } from '@/contexts/UserContext'
import { Toaster } from '@/components/ui/sonner'
import { PasswordSetupGuard } from '@/components/PasswordSetupGuard'
import { SetupPasswordPage } from '@/pages/setup-password'
import { AlennaBackground } from '@/components/ui/alenna-background'
import '@/lib/i18n' // Initialize i18n
import ProjectionsPageV2 from '@/pages/projections-v2'
import GenerateProjectionWizardPageV2 from '@/pages/generate-projection-wizard-v2'
import ProjectionDetailsPageV2 from '@/pages/projection-details-v2'
import DailyGoalsPage from '@/pages/daily-goals-page'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <AuthSync>
          <UserProvider>
            <PasswordSetupGuard>
              {children}
            </PasswordSetupGuard>
          </UserProvider>
        </AuthSync>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AlennaBackground />
        <ScrollToTop />
        <Routes>
          {/* Public routes - without sidebar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signup/*" element={<SignUpPage />} />

          {/* Password setup route - requires auth but no layout */}
          <Route
            path="/setup-password"
            element={
              <SignedIn>
                <AuthSync>
                  <UserProvider>
                    <PasswordSetupGuard>
                      <SetupPasswordPage />
                    </PasswordSetupGuard>
                  </UserProvider>
                </AuthSync>
              </SignedIn>
            }
          />

          {/* Protected routes - with sidebar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard routes */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            {/* Projections routes*/}
            <Route path="projections" element={<ProjectionsPageV2 />} />
            <Route path="projections/generate" element={<GenerateProjectionWizardPageV2 />} />
            <Route path="students/:studentId/projections/:projectionId/v2" element={<ProjectionDetailsPageV2 />} />
            <Route path="students/:studentId/projections/:projectionId/v2/:quarter/week/:week" element={<DailyGoalsPage />} />
            {/* Configuration routes */}
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route path="configuration/language" element={<ConfigurationLanguagePage />} />
          </Route>

          {/* Catch all - show 404 */}
          <Route path="/404" element={<NotFoundPage isUnauthorized={true} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster richColors position="bottom-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
