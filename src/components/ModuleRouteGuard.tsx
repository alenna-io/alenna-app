import * as React from 'react';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Loading } from '@/components/ui/loading';
import { NotFoundPage } from '@/pages/not-found';
import { useUser } from '@/contexts/UserContext';

interface ModuleRouteGuardProps {
  children: React.ReactNode;
  requiredModule: 'students' | 'projections' | 'paces' | 'monthlyAssignments' | 'reportCards' | 'groups' | 'teachers' | 'school_admin' | 'schools' | 'users' | 'billing';
  fallback?: React.ReactNode;
}

/**
 * Route guard component that checks if user has access to a required module.
 * Redirects to 404 if module is not enabled.
 * 
 * Shows spinner during main loading (userInfo/auth phase), then renders children
 * so pages can show their own skeleton loaders.
 */
export function ModuleRouteGuard({ children, requiredModule, fallback }: ModuleRouteGuardProps) {
  const { hasModule, isLoading: isLoadingModules } = useModuleAccess();
  const { userInfo, isLoading: isLoadingUser } = useUser();

  // MAIN LOADING: Show spinner ONLY during userInfo loading (authentication phase)
  // Once userInfo is loaded, render children so pages can show their own loaders
  // This prevents showing cards skeleton from HomePage while modules are loading
  if (isLoadingUser || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <Loading variant="button" size="lg" />
      </div>
    );
  }

  // If modules are still loading, render children so page can show its loader
  // HomePage will return null if not on home route, preventing skeleton cards
  if (isLoadingModules) {
    return <>{children}</>;
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
