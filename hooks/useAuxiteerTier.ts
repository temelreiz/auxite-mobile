/**
 * useAuxiteerTier Hook (Mobile)
 * Kullanıcının Auxiteer tier bilgisini API'den çeker
 * Trade/Swap işlemlerinde tier bazlı fee göstermek için kullanılır
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface AuxiteerTierData {
  id: string;
  name: string;
  spread: number;
  fee: number;
}

export interface AuxiteerStats {
  balanceUsd: number;
  daysSinceRegistration: number;
  registeredAt: string | null;
  isKycVerified: boolean;
  kycLevel: string;
  hasMetalAsset: boolean;
  hasActiveLease: boolean;
}

export interface AuxiteerProgress {
  nextTier: string;
  nextTierName: string;
  requirements: {
    balanceUsd: { current: number; required: number; met: boolean };
    days: { current: number; required: number; met: boolean };
    kyc: { current: boolean; required: boolean; met: boolean };
    metalAsset: { current: boolean; required: boolean; met: boolean };
    activeLease: { current: boolean; required: boolean; met: boolean };
  };
}

export interface AuxiteerTierInfo {
  id: string;
  name: string;
  spread: number;
  fee: number;
  requirements: {
    kyc: boolean;
    minBalanceUsd: number;
    minDays: number;
    metalAsset: boolean;
    activeEarnLease: boolean;
    invitation: boolean;
  };
  isCurrent: boolean;
}

export interface UseAuxiteerTierReturn {
  tier: AuxiteerTierData | null;
  stats: AuxiteerStats | null;
  progress: AuxiteerProgress | null;
  allTiers: AuxiteerTierInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_TIER: AuxiteerTierData = {
  id: 'regular',
  name: 'Regular',
  spread: 1.0,
  fee: 0.35,
};

// ============================================
// HOOK
// ============================================

export function useAuxiteerTier(): UseAuxiteerTierReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tier, setTier] = useState<AuxiteerTierData | null>(null);
  const [stats, setStats] = useState<AuxiteerStats | null>(null);
  const [progress, setProgress] = useState<AuxiteerProgress | null>(null);
  const [allTiers, setAllTiers] = useState<AuxiteerTierInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wallet address from storage
  useEffect(() => {
    const getAddress = async () => {
      try {
        const address = await AsyncStorage.getItem('walletAddress');
        setWalletAddress(address);
      } catch (e) {
        console.error('Failed to get wallet address:', e);
      }
    };
    getAddress();
  }, []);

  const fetchTierData = useCallback(async () => {
    if (!walletAddress) {
      setTier(DEFAULT_TIER);
      setStats(null);
      setProgress(null);
      setAllTiers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auxiteer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTier(data.tier);
      setStats(data.stats);
      setProgress(data.progress);
      setAllTiers(data.allTiers || []);
      
      // Cache the tier data
      await AsyncStorage.setItem('auxiteer_tier', JSON.stringify(data.tier));
      
    } catch (err) {
      console.error('Failed to fetch Auxiteer tier:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tier data');
      
      // Try to use cached tier
      try {
        const cached = await AsyncStorage.getItem('auxiteer_tier');
        if (cached) {
          setTier(JSON.parse(cached));
        } else {
          setTier(DEFAULT_TIER);
        }
      } catch {
        setTier(DEFAULT_TIER);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchTierData();
  }, [fetchTierData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(fetchTierData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchTierData]);

  return {
    tier,
    stats,
    progress,
    allTiers,
    isLoading,
    error,
    refetch: fetchTierData,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format spread percentage
 */
export function formatSpread(spread: number): string {
  if (spread === 0) return 'Custom';
  return `${spread.toFixed(2)}%`;
}

/**
 * Format fee percentage
 */
export function formatFee(fee: number): string {
  if (fee === 0) return 'Custom';
  return `${fee.toFixed(2)}%`;
}

/**
 * Calculate fee amount based on tier
 */
export function calculateTierFee(amount: number, tierFee: number): number {
  return amount * (tierFee / 100);
}

/**
 * Get tier color by ID
 */
export function getTierColor(tierId: string): string {
  const colors: Record<string, string> = {
    regular: '#64748b',
    core: '#10b981',
    reserve: '#3b82f6',
    vault: '#8b5cf6',
    sovereign: '#f59e0b',
  };
  return colors[tierId] || colors.regular;
}

/**
 * Get tier background color by ID
 */
export function getTierBgColor(tierId: string): string {
  const colors: Record<string, string> = {
    regular: 'rgba(100, 116, 139, 0.1)',
    core: 'rgba(16, 185, 129, 0.1)',
    reserve: 'rgba(59, 130, 246, 0.1)',
    vault: 'rgba(139, 92, 246, 0.1)',
    sovereign: 'rgba(245, 158, 11, 0.1)',
  };
  return colors[tierId] || colors.regular;
}

/**
 * Get tier icon by ID
 */
export function getTierIcon(tierId: string): string {
  const icons: Record<string, string> = {
    regular: '👤',
    core: '🛡️',
    reserve: '📦',
    vault: '🏛️',
    sovereign: '⭐',
  };
  return icons[tierId] || icons.regular;
}

// ============================================
// TIER CONFIGURATION (Offline reference)
// ============================================

export const AUXITEER_TIERS = [
  {
    id: 'regular',
    name: 'Regular',
    spread: 1.00,
    fee: 0.35,
    icon: '👤',
    color: '#64748b',
  },
  {
    id: 'core',
    name: 'Core',
    spread: 0.80,
    fee: 0.25,
    icon: '🛡️',
    color: '#10b981',
  },
  {
    id: 'reserve',
    name: 'Reserve',
    spread: 0.65,
    fee: 0.18,
    icon: '📦',
    color: '#3b82f6',
  },
  {
    id: 'vault',
    name: 'Vault',
    spread: 0.50,
    fee: 0.12,
    icon: '🏛️',
    color: '#8b5cf6',
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    spread: 0,
    fee: 0,
    icon: '⭐',
    color: '#f59e0b',
  },
];

export default useAuxiteerTier;
