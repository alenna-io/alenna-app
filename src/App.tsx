import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LoginPage } from '@/pages/login'
import { SignUpPage } from '@/pages/signup'
import { DashboardPage } from '@/pages/dashboard'
import StudentsPage from '@/pages/students'
import TeachersPage from '@/pages/teachers'
import ProjectionListPage from '@/pages/projection-list'
import ProjectionsPage from '@/pages/projections'
import ACEProjectionPage from '@/pages/projection-details'
import DailyGoalsPage from '@/pages/daily-goals'
import ConfigurationPage from '@/pages/configuration'
import ConfigurationLanguagePage from '@/pages/configuration-language'
import SchoolSettingsPage from '@/pages/school-settings'
import SchoolYearsPage from '@/pages/school-years'
import SchoolYearWizardPage from '@/pages/school-year-wizard'
import QuartersManagementPage from '@/pages/quarters-management'
import SchoolInfoPage from '@/pages/school-info'
import CertificationTypesPage from '@/pages/certification-types'
import BillingPage from '@/pages/billing'
import UsersPage from '@/pages/users'
import UserDetailPage from '@/pages/user-detail'
import SchoolsPage from '@/pages/schools'
import MyProfilePage from '@/pages/my-profile'
import MonthlyAssignmentsPage from '@/pages/monthly-assignments'
import ReportCardsListPage from '@/pages/report-cards-list'
import ReportCardDetailPage from '@/pages/report-card-detail'
import ReportCardsPage from '@/pages/report-cards'
import LecturesPage from '@/pages/lectures'
import GenerateProjectionWizardPage from '@/pages/generate-projection-wizard'
import CreateStudentWizardPage from '@/pages/create-student-wizard'
import CreateSchoolWizardPage from '@/pages/create-school-wizard'
import GroupsPage from '@/pages/groups'
import GroupDetailPage from '@/pages/group-detail'
import CreateGroupWizardPage from '@/pages/create-group-wizard'
import { NotFoundPage } from '@/pages/not-found'
import { ScrollToTop } from '@/components/scroll-to-top'
import { AuthSync } from '@/components/auth-sync'
import { UserProvider } from '@/contexts/UserContext'
import { ModuleProvider } from '@/contexts/ModuleContext'
import { Toaster } from '@/components/ui/sonner'
import { ModuleRouteGuard } from '@/components/ModuleRouteGuard'
import { PasswordSetupGuard } from '@/components/PasswordSetupGuard'
import { SetupPasswordPage } from '@/pages/setup-password'
import { AlennaBackground } from '@/components/ui/alenna-background'
import '@/lib/i18n' // Initialize i18n

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <AuthSync>
          <UserProvider>
            <PasswordSetupGuard>
              <ModuleProvider>{children}</ModuleProvider>
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="students" element={<ModuleRouteGuard requiredModule="students"><StudentsPage /></ModuleRouteGuard>} />
          <Route path="students/create" element={<ModuleRouteGuard requiredModule="students"><CreateStudentWizardPage /></ModuleRouteGuard>} />
          <Route path="students/:studentId" element={<ModuleRouteGuard requiredModule="students"><StudentsPage /></ModuleRouteGuard>} />
          <Route path="projections" element={<ModuleRouteGuard requiredModule="projections"><ProjectionsPage /></ModuleRouteGuard>} />
          <Route path="projections/generate" element={<ModuleRouteGuard requiredModule="projections"><GenerateProjectionWizardPage /></ModuleRouteGuard>} />
          <Route path="students/:studentId/projections" element={<ModuleRouteGuard requiredModule="projections"><ProjectionListPage /></ModuleRouteGuard>} />
          <Route path="students/:studentId/projections/:projectionId" element={<ModuleRouteGuard requiredModule="projections"><ACEProjectionPage /></ModuleRouteGuard>} />
          <Route path="students/:studentId/projections/:projectionId/:quarter/week/:week" element={<ModuleRouteGuard requiredModule="projections"><DailyGoalsPage /></ModuleRouteGuard>} />
          <Route path="my-profile" element={<MyProfilePage />} />
          <Route path="configuration" element={<ConfigurationPage />} />
          <Route path="configuration/language" element={<ConfigurationLanguagePage />} />
          <Route path="school-settings" element={<ModuleRouteGuard requiredModule="school_admin"><SchoolSettingsPage /></ModuleRouteGuard>} />
          <Route path="school-settings/school-info" element={<ModuleRouteGuard requiredModule="school_admin"><SchoolInfoPage /></ModuleRouteGuard>} />
          <Route path="school-settings/school-years" element={<ModuleRouteGuard requiredModule="school_admin"><SchoolYearsPage /></ModuleRouteGuard>} />
          <Route path="school-settings/school-years/wizard/:schoolYearId" element={<ModuleRouteGuard requiredModule="school_admin"><SchoolYearWizardPage /></ModuleRouteGuard>} />
          <Route path="school-settings/school-years/wizard" element={<ModuleRouteGuard requiredModule="school_admin"><SchoolYearWizardPage /></ModuleRouteGuard>} />
          <Route path="school-settings/quarters" element={<ModuleRouteGuard requiredModule="school_admin"><QuartersManagementPage /></ModuleRouteGuard>} />
          <Route path="school-settings/certification-types" element={<ModuleRouteGuard requiredModule="school_admin"><CertificationTypesPage /></ModuleRouteGuard>} />
          <Route path="configuration/billing" element={<BillingPage />} />
          <Route path="users" element={<ModuleRouteGuard requiredModule="users"><UsersPage /></ModuleRouteGuard>} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="schools" element={<ModuleRouteGuard requiredModule="schools"><SchoolsPage /></ModuleRouteGuard>} />
          <Route path="schools/create" element={<ModuleRouteGuard requiredModule="schools"><CreateSchoolWizardPage /></ModuleRouteGuard>} />
          <Route path="schools/:schoolId" element={<SchoolInfoPage />} />
          <Route path="schools/:schoolId/students" element={<StudentsPage />} />
          <Route path="schools/:schoolId/teachers" element={<TeachersPage />} />
          <Route path="groups" element={<ModuleRouteGuard requiredModule="groups"><GroupsPage /></ModuleRouteGuard>} />
          <Route path="groups/create" element={<ModuleRouteGuard requiredModule="groups"><CreateGroupWizardPage /></ModuleRouteGuard>} />
          <Route path="groups/:groupId" element={<ModuleRouteGuard requiredModule="groups"><GroupDetailPage /></ModuleRouteGuard>} />
          <Route path="lectures" element={<ModuleRouteGuard requiredModule="paces"><LecturesPage /></ModuleRouteGuard>} />
          <Route path="monthly-assignments" element={<ModuleRouteGuard requiredModule="monthlyAssignments"><MonthlyAssignmentsPage /></ModuleRouteGuard>} />
          <Route path="report-cards" element={<ModuleRouteGuard requiredModule="reportCards"><ReportCardsPage /></ModuleRouteGuard>} />
          <Route path="students/:studentId/report-cards" element={<ModuleRouteGuard requiredModule="reportCards"><ReportCardsListPage /></ModuleRouteGuard>} />
          <Route path="students/:studentId/report-cards/:projectionId" element={<ModuleRouteGuard requiredModule="reportCards"><ReportCardDetailPage /></ModuleRouteGuard>} />
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
