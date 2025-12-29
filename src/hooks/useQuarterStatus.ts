import { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import type { Quarter } from '../services/api';

export interface QuarterStatus {
  quarter: Quarter;
  status: 'open' | 'gracePeriod' | 'closed';
  canClose: boolean;
}

export function useQuarterStatus(schoolYearId: string | null) {
  const api = useApi();
  const [quarters, setQuarters] = useState<QuarterStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolYearId) {
      setQuarters([]);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.quarters.getStatus(schoolYearId) as Quarter[];
        const statusQuarters: QuarterStatus[] = data.map(q => ({
          quarter: q,
          status: q.status || 'open',
          canClose: q.canClose || false,
        }));
        setQuarters(statusQuarters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quarter status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYearId]); // api is stable from useApi hook, no need to include it

  const getQuarterStatus = (quarterName: string): QuarterStatus | null => {
    return quarters.find(q => q.quarter.name === quarterName) || null;
  };

  const isQuarterClosed = (quarterName: string): boolean => {
    const status = getQuarterStatus(quarterName);
    return status?.status === 'closed' || false;
  };

  const isQuarterInGracePeriod = (quarterName: string): boolean => {
    const status = getQuarterStatus(quarterName);
    return status?.status === 'gracePeriod' || false;
  };

  const canCloseQuarter = (quarterName: string): boolean => {
    const status = getQuarterStatus(quarterName);
    return status?.canClose || false;
  };

  return {
    quarters,
    loading,
    error,
    getQuarterStatus,
    isQuarterClosed,
    isQuarterInGracePeriod,
    canCloseQuarter,
  };
}

