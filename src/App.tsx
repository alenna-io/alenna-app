import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LoginPage } from '@/pages/login'
import { SignUpPage } from '@/pages/signup'
import { DashboardPage } from '@/pages/dashboard'
import { HomePage } from '@/pages/home'
import StudentsPage from '@/pages/students'
import TeachersPage from '@/pages/teachers'
import ProjectionListPage from '@/pages/projection-list'
import ProjectionsPage from '@/pages/projections'
import ACEProjectionPage from '@/pages/ace-projection'
import DailyGoalsPage from '@/pages/daily-goals'
import ConfigurationPage from '@/pages/configuration'
import SchoolYearsPage from '@/pages/school-years'
import SchoolInfoPage from '@/pages/school-info'
import BillingPage from '@/pages/billing'
import UsersPage from '@/pages/users'
import UserDetailPage from '@/pages/user-detail'
import SchoolsPage from '@/pages/schools'
import MyProfilePage from '@/pages/my-profile'
import MonthlyAssignmentsPage from '@/pages/monthly-assignments'
import ReportCardsListPage from '@/pages/report-cards-list'
import ReportCardDetailPage from '@/pages/report-card-detail'
import ReportCardsPage from '@/pages/report-cards'
import GenerateProjectionWizardPage from '@/pages/generate-projection-wizard'
import { NotFoundPage } from '@/pages/not-found'
import { ScrollToTop } from '@/components/scroll-to-top'
import { AuthSync } from '@/components/auth-sync'
import { UserProvider } from '@/contexts/UserContext'
import { Toaster } from '@/components/ui/sonner'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <AuthSync>
          <UserProvider>{children}</UserProvider>
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
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public routes - without sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signup/*" element={<SignUpPage />} />

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
          <Route path="projections" element={<ProjectionsPage />} />
          <Route path="projections/generate" element={<GenerateProjectionWizardPage />} />
          <Route path="students/:studentId/projections" element={<ProjectionListPage />} />
          <Route path="students/:studentId/projections/:projectionId" element={<ACEProjectionPage />} />
          <Route path="students/:studentId/projections/:projectionId/:quarter/week/:week" element={<DailyGoalsPage />} />
          <Route path="my-profile" element={<MyProfilePage />} />
          <Route path="configuration" element={<ConfigurationPage />} />
          <Route path="configuration/school-info" element={<SchoolInfoPage />} />
          <Route path="configuration/school-years" element={<SchoolYearsPage />} />
          <Route path="configuration/billing" element={<BillingPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="schools/:schoolId" element={<SchoolInfoPage />} />
          <Route path="schools/:schoolId/students" element={<StudentsPage />} />
          <Route path="schools/:schoolId/teachers" element={<TeachersPage />} />
          <Route path="monthly-assignments" element={<MonthlyAssignmentsPage />} />
          <Route path="report-cards" element={<ReportCardsPage />} />
          <Route path="students/:studentId/report-cards" element={<ReportCardsListPage />} />
          <Route path="students/:studentId/report-cards/:projectionId" element={<ReportCardDetailPage />} />
          <Route path="documents" element={<div className="text-2xl font-bold">Documents Page</div>} />
          <Route path="settings" element={<div className="text-2xl font-bold">Settings Page</div>} />
        </Route>

        {/* Catch all - show 404 */}
        <Route path="/404" element={<NotFoundPage isUnauthorized={true} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  )
}
