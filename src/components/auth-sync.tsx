import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '@/services/api';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorAlert } from '@/components/ui/error-alert';

interface AuthSyncProps {
  children: React.ReactNode;
}

export function AuthSync({ children }: AuthSyncProps) {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const [syncStatus, setSyncStatus] = useState<'loading' | 'synced' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isSignedIn) {
      setSyncStatus('loading');
      return;
    }

    // Sync user with backend when signed in
    const syncUser = async () => {
      try {
        await api.auth.syncUser();
        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync user with backend:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to sync user';
        setErrorMessage(errorMsg);
        setSyncStatus('error');
      }
    };

    syncUser();
  }, [isSignedIn, api.auth]);

  // Loading state
  if (syncStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState variant="default" />
      </div>
    );
  }

  // Error state - user not found in database
  if (syncStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md">
          <ErrorAlert
            title="Account Not Found"
            message={`${errorMessage}. Please contact your administrator to set up your account.`}
          />
        </div>
      </div>
    );
  }

  // Success - user is synced
  return <>{children}</>;
}

