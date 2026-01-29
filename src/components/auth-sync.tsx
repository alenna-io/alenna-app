import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Spinner } from '@/components/ui/spinner';

interface AuthSyncProps {
  children: React.ReactNode;
}

export function AuthSync({ children }: AuthSyncProps) {
  const { isSignedIn } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'loading' | 'synced' | 'error'>('loading');

  useEffect(() => {
    // MVP: Fake auth sync - just wait a bit then mark as synced
    if (!isSignedIn) {
      setSyncStatus('loading');
      return;
    }

    // Fake sync - simulate API call
    const syncUser = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setSyncStatus('synced');
    };

    syncUser();
  }, [isSignedIn]);

  // Loading state - use spinner, not full-screen skeleton
  if (syncStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  // Success - user is synced (faked for MVP)
  return <>{children}</>;
}

