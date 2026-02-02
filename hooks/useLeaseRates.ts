// hooks/useLeaseRates.ts
// Dynamic APY rates based on SOFR and metal lease rates

import { useState, useEffect, useCallback } from 'react';
import { getLeaseRates, type LeaseRates } from '@/services/api';

// Default/fallback rates
const DEFAULT_RATES: LeaseRates = {
  gold: { '3m': 3.5, '6m': 5.2, '12m': 7.0 },
  silver: { '3m': 4.0, '6m': 6.0, '12m': 8.5 },
  platinum: { '3m': 3.2, '6m': 4.8, '12m': 6.5 },
  palladium: { '3m': 3.8, '6m': 5.5, '12m': 7.2 },
  lastUpdated: new Date().toISOString(),
  sofr: 4.33,
  gofo: 1.5,
  source: 'Default',
};

// Map metal tokens to lease rate keys
const METAL_MAP: Record<string, keyof Pick<LeaseRates, 'gold' | 'silver' | 'platinum' | 'palladium'>> = {
  AUXG: 'gold',
  AUXS: 'silver',
  AUXPT: 'platinum',
  AUXPD: 'palladium',
};

interface UseLeaseRatesReturn {
  rates: LeaseRates;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getAPY: (metal: string, duration: 3 | 6 | 12) => number;
  getStakingAPY: () => Record<number, Record<string, number>>;
}

export function useLeaseRates(): UseLeaseRatesReturn {
  const [rates, setRates] = useState<LeaseRates>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getLeaseRates();
      if (data) {
        setRates(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch lease rates:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRates();
    
    // Refresh every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  // Get APY for specific metal and duration
  const getAPY = useCallback((metal: string, duration: 3 | 6 | 12): number => {
    const metalKey = METAL_MAP[metal.toUpperCase()];
    if (!metalKey) return 0;
    
    const durationKey = `${duration}m` as '3m' | '6m' | '12m';
    return rates[metalKey]?.[durationKey] || 0;
  }, [rates]);

  // Get all staking APYs in the format used by UI components
  const getStakingAPY = useCallback((): Record<number, Record<string, number>> => {
    return {
      3: {
        AUXG: rates.gold['3m'],
        AUXS: rates.silver['3m'],
        AUXPT: rates.platinum['3m'],
        AUXPD: rates.palladium['3m'],
      },
      6: {
        AUXG: rates.gold['6m'],
        AUXS: rates.silver['6m'],
        AUXPT: rates.platinum['6m'],
        AUXPD: rates.palladium['6m'],
      },
      12: {
        AUXG: rates.gold['12m'],
        AUXS: rates.silver['12m'],
        AUXPT: rates.platinum['12m'],
        AUXPD: rates.palladium['12m'],
      },
    };
  }, [rates]);

  return {
    rates,
    isLoading,
    error,
    refresh: fetchRates,
    getAPY,
    getStakingAPY,
  };
}

export default useLeaseRates;
