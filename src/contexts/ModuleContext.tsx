import * as React from 'react';
import { useApi } from '@/services/api';
import { useUser } from '@/contexts/UserContext';

export type ModuleKey = 'students' | 'projections' | 'paces' | 'monthlyAssignments' | 'reportCards' | 'groups' | 'teachers' | 'school_admin' | 'schools' | 'users';

interface ModuleData {
  id: string;
  key: string;
  name: string;
  description?: string;
  displayOrder: number;
  actions: string[];
}

interface ModuleContextValue {
  modules: ModuleData[];
  isLoading: boolean;
  error: Error | null;
  hasModule: (moduleKey: ModuleKey) => boolean;
  hasPermission: (permission: string) => boolean;
  getModule: (moduleKey: ModuleKey) => ModuleData | undefined;
}

const ModuleContext = React.createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const { userInfo, isLoading: isLoadingUser } = useUser();
  const [modules, setModules] = React.useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Track if we've fetched modules for this user to prevent duplicate fetches
  const lastFetchedUserIdRef = React.useRef<string | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (isLoadingUser || !userInfo?.id) {
      setIsLoading(true);
      return;
    }

    // If we've already fetched modules for this user, don't fetch again
    if (lastFetchedUserIdRef.current === userInfo.id) {
      setIsLoading(false);
      return;
    }

    // If we're already fetching, don't start another fetch
    if (isFetchingRef.current) {
      return;
    }

    let cancelled = false;

    const fetchModules = async () => {
      try {
        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        const userModules = await api.modules.getUserModules();
        if (!cancelled) {
          setModules(userModules || []);
          lastFetchedUserIdRef.current = userInfo.id;
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching modules:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch modules'));
          setModules([]);
          // Reset on error so we can retry
          lastFetchedUserIdRef.current = null;
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchModules();

    return () => {
      cancelled = true;
      isFetchingRef.current = false;
    };
    // api object is recreated on every render, so we don't include it in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, userInfo?.id]);

  // Helper function to check if a module is enabled
  const hasModule = React.useCallback(
    (moduleKey: ModuleKey): boolean => {
      return modules.some((module) => module.key === moduleKey && (module.actions?.length ?? 0) > 0);
    },
    [modules]
  );

  // Helper function to check if user has a specific permission
  const hasPermission = React.useCallback(
    (permission: string): boolean => {
      return modules.some((module) => module.actions?.includes(permission) ?? false);
    },
    [modules]
  );

  // Helper function to get a specific module
  const getModule = React.useCallback(
    (moduleKey: ModuleKey): ModuleData | undefined => {
      return modules.find((module) => module.key === moduleKey);
    },
    [modules]
  );

  const value: ModuleContextValue = React.useMemo(
    () => ({
      modules,
      isLoading,
      error,
      hasModule,
      hasPermission,
      getModule,
    }),
    [modules, isLoading, error, hasModule, hasPermission, getModule]
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModuleAccess(): ModuleContextValue {
  const context = React.useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleAccess must be used within ModuleProvider');
  }
  return context;
}
