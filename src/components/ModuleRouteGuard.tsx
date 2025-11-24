import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Loading } from '@/components/ui/loading';
import { NotFoundPage } from '@/pages/not-found';

interface ModuleRouteGuardProps {
  children: React.ReactNode;
  requiredModule: 'students' | 'projections' | 'paces' | 'monthlyAssignments' | 'reportCards' | 'groups' | 'teachers' | 'school_admin' | 'schools' | 'users';
  fallback?: React.ReactNode;
}

/**
 * Route guard component that checks if user has access to a required module.
 * Redirects to 404 if module is not enabled.
 */
export function ModuleRouteGuard({ children, requiredModule, fallback }: ModuleRouteGuardProps) {
  const { hasModule, isLoading } = useModuleAccess();
  const location = useLocation();

  // Show loading while checking module access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading variant="spinner" />
      </div>
    );
  }

  // Check if user has access to the required module
  if (!hasModule(requiredModule)) {
    // Use custom fallback if provided, otherwise show 404
    if (fallback) {
      return <>{fallback}</>;
    }

    return <NotFoundPage isUnauthorized={true} />;
  }

  return <>{children}</>;
}
