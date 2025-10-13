import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '@/services/api';

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
        <div className="text-center">
          <div className="mb-4 text-lg">Loading...</div>
          <div className="text-sm text-muted-foreground">Syncing your account</div>
        </div>
      </div>
    );
  }

  // Error state - user not found in database
  if (syncStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-destructive">Account Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            {errorMessage}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to set up your account.
          </p>
        </div>
      </div>
    );
  }

  // Success - user is synced
  return <>{children}</>;
}

