// hooks/useStakingMobile.ts
// Mobile Staking Hook - On-chain staking integration
// Uses Sepolia testnet contracts

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { ethers } from 'ethers';

// ============================================
// CONTRACT ADDRESSES (Sepolia Testnet)
// ============================================
const STAKING_CONTRACT_ADDRESS = '0x74D7Edb0e8716c445cA17E64AaED111A55B7b3c4';

// Token addresses
export const TOKEN_ADDRESSES: Record<string, string> = {
  AUXG: '0xD14D32B1e03B3027D1f8381EeeC567e147De9CCe',
  AUXS: '0xc924EE950BF5A5Fbe3c26eECB27D99031B441caD',
  AUXPT: '0x37402EA435a91567223C132414C3A50C6bBc7200',
  AUXPD: '0x6026338B9Bfd94fed07EA61cbE60b15e300911DC',
};

// Metal ID constants (keccak256 hashes)
export const METAL_IDS: Record<string, string> = {
  AUXG: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AUXG')),
  AUXS: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AUXS')),
  AUXPT: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AUXPT')),
  AUXPD: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AUXPD')),
};

// Token decimals (Auxite tokens use 3 decimals)
const TOKEN_DECIMALS = 3;

// Staking Contract ABI (simplified)
const STAKING_ABI = [
  'function getUserStakes(address user) view returns (tuple(uint256 id, bytes32 stakeCode, address staker, bytes32 metalId, uint256 amount, uint256 startTime, uint256 endTime, uint256 duration, uint256 apyBps, uint256 expectedReward, uint256 claimedReward, bool active, bool compounding, uint256 allocationId)[])',
  'function getUserActiveStakes(address user) view returns (tuple(uint256 id, bytes32 stakeCode, address staker, bytes32 metalId, uint256 amount, uint256 startTime, uint256 endTime, uint256 duration, uint256 apyBps, uint256 expectedReward, uint256 claimedReward, bool active, bool compounding, uint256 allocationId)[])',
  'function getClaimableRewards(uint256 stakeId) view returns (uint256)',
  'function getAllAPYs(bytes32 metalId) view returns (uint256 apy3m, uint256 apy6m, uint256 apy12m)',
  'function previewReward(bytes32 metalId, uint256 amount, uint256 durationMonths) view returns (uint256 expectedReward, uint256 apyBps)',
  'function stake(bytes32 metalId, uint256 amount, uint256 durationMonths, bool compounding, uint256 allocationId) returns (uint256 stakeId, bytes32 stakeCode)',
  'function unstake(uint256 stakeId)',
  'function claimRewards(uint256 stakeId)',
  'function compoundRewards(uint256 stakeId)',
];

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// ============================================
// TYPES
// ============================================
export interface StakeData {
  id: number;
  stakeCode: string;
  shortCode: string;
  staker: string;
  metal: string;
  metalSymbol: string;
  amountGrams: number;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  apyPercent: number;
  expectedRewardGrams: number;
  claimedRewardGrams: number;
  claimableRewardGrams: number;
  active: boolean;
  compounding: boolean;
  progress: number;
  timeRemaining: string;
  isMatured: boolean;
}

export interface StakingStats {
  totalStaked: number;
  activePositions: number;
  totalEarnings: number;
  avgAPY: number;
}

// ============================================
// HELPERS
// ============================================
const getMetalFromId = (metalId: string): { name: string; symbol: string } => {
  for (const [symbol, id] of Object.entries(METAL_IDS)) {
    if (id.toLowerCase() === metalId.toLowerCase()) {
      const names: Record<string, string> = {
        AUXG: 'Gold',
        AUXS: 'Silver',
        AUXPT: 'Platinum',
        AUXPD: 'Palladium',
      };
      return { name: names[symbol], symbol };
    }
  }
  return { name: 'Unknown', symbol: 'UNK' };
};

const formatStake = (raw: any, claimable: bigint = BigInt(0)): StakeData => {
  const metal = getMetalFromId(raw.metalId);
  const startDate = new Date(Number(raw.startTime) * 1000);
  const endDate = new Date(Number(raw.endTime) * 1000);
  const now = Date.now();

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now - startDate.getTime();
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const isMatured = now >= endDate.getTime();

  let timeRemaining = '';
  if (!isMatured) {
    const remainingMs = endDate.getTime() - now;
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    timeRemaining = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  }

  const durationSeconds = Number(raw.duration);
  let durationMonths = 3;
  if (durationSeconds >= 365 * 24 * 60 * 60 - 86400) durationMonths = 12;
  else if (durationSeconds >= 180 * 24 * 60 * 60 - 86400) durationMonths = 6;

  return {
    id: Number(raw.id),
    stakeCode: raw.stakeCode,
    shortCode: `STK-${raw.stakeCode.slice(2, 10).toUpperCase()}`,
    staker: raw.staker,
    metal: metal.name,
    metalSymbol: metal.symbol,
    amountGrams: Number(raw.amount) / 1000,
    startDate,
    endDate,
    durationMonths,
    apyPercent: Number(raw.apyBps) / 100,
    expectedRewardGrams: Number(raw.expectedReward) / 1000,
    claimedRewardGrams: Number(raw.claimedReward) / 1000,
    claimableRewardGrams: Number(claimable) / 1000,
    active: raw.active,
    compounding: raw.compounding,
    progress,
    timeRemaining,
    isMatured,
  };
};

// Default APY rates (shown when not connected)
const DEFAULT_APY: Record<string, { apy3m: number; apy6m: number; apy12m: number }> = {
  AUXG: { apy3m: 1.53, apy6m: 2.03, apy12m: 2.53 },
  AUXS: { apy3m: 1.23, apy6m: 1.73, apy12m: 2.23 },
  AUXPT: { apy3m: 1.83, apy6m: 2.33, apy12m: 2.83 },
  AUXPD: { apy3m: 1.93, apy6m: 2.43, apy12m: 2.93 },
};

// ============================================
// MAIN HOOK
// ============================================
export function useStakingMobile() {
  const wallet = useWallet();
  
  const [stakes, setStakes] = useState<StakeData[]>([]);
  const [stats, setStats] = useState<StakingStats>({
    totalStaked: 0,
    activePositions: 0,
    totalEarnings: 0,
    avgAPY: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction states
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Success states
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [stakeSuccess, setStakeSuccess] = useState(false);
  const [lastStakeCode, setLastStakeCode] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // ============================================
  // READ FUNCTIONS
  // ============================================

  const fetchUserStakes = useCallback(async () => {
    // Don't fetch if not connected - just return empty
    if (!wallet.isConnected || !wallet.address) {
      setStakes([]);
      setStats({ totalStaked: 0, activePositions: 0, totalEarnings: 0, avgAPY: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rawStakes = await wallet.callContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'getUserStakes',
        [wallet.address]
      );

      if (!rawStakes || rawStakes.length === 0) {
        setStakes([]);
        setStats({ totalStaked: 0, activePositions: 0, totalEarnings: 0, avgAPY: 0 });
        setLoading(false);
        return;
      }

      const formattedStakes = await Promise.all(
        rawStakes.map(async (raw: any) => {
          let claimable = BigInt(0);
          try {
            claimable = await wallet.callContract(
              STAKING_CONTRACT_ADDRESS,
              STAKING_ABI,
              'getClaimableRewards',
              [raw.id]
            );
          } catch {}
          return formatStake(raw, claimable);
        })
      );

      setStakes(formattedStakes);

      // Calculate stats
      const activeStakes = formattedStakes.filter(s => s.active);
      const totalStaked = formattedStakes.reduce((sum, s) => sum + s.amountGrams, 0);
      const totalEarnings = formattedStakes.reduce((sum, s) => sum + s.claimedRewardGrams + s.claimableRewardGrams, 0);
      const avgAPY = activeStakes.length > 0
        ? activeStakes.reduce((sum, s) => sum + s.apyPercent, 0) / activeStakes.length
        : 0;

      setStats({ totalStaked, activePositions: activeStakes.length, totalEarnings, avgAPY });

    } catch (err: any) {
      console.warn('Failed to fetch stakes:', err.message);
      // Don't show error to user - just empty state
      setStakes([]);
      setStats({ totalStaked: 0, activePositions: 0, totalEarnings: 0, avgAPY: 0 });
    } finally {
      setLoading(false);
    }
  }, [wallet.isConnected, wallet.address, wallet.callContract]);

  // Get token balance
  const getTokenBalance = useCallback(async (metalSymbol: string): Promise<number> => {
    const tokenAddress = TOKEN_ADDRESSES[metalSymbol];
    if (!tokenAddress || !wallet.address) return 0;

    try {
      const balance = await wallet.getTokenBalance(tokenAddress, TOKEN_DECIMALS);
      return parseFloat(balance);
    } catch {
      return 0;
    }
  }, [wallet.address, wallet.getTokenBalance]);

  // Check allowance
  const checkAllowance = useCallback(async (metalSymbol: string): Promise<number> => {
    const tokenAddress = TOKEN_ADDRESSES[metalSymbol];
    if (!tokenAddress || !wallet.address) return 0;

    try {
      const allowance = await wallet.callContract(
        tokenAddress,
        ERC20_ABI,
        'allowance',
        [wallet.address, STAKING_CONTRACT_ADDRESS]
      );
      return Number(allowance) / 1000;
    } catch {
      return 0;
    }
  }, [wallet.address, wallet.callContract]);

  // Get APY rates
  const getAPYRates = useCallback(async (metalSymbol: string): Promise<{ apy3m: number; apy6m: number; apy12m: number }> => {
    // Return defaults if not connected
    if (!wallet.isConnected) {
      return DEFAULT_APY[metalSymbol] || { apy3m: 0, apy6m: 0, apy12m: 0 };
    }

    const metalId = METAL_IDS[metalSymbol];
    if (!metalId) return DEFAULT_APY[metalSymbol] || { apy3m: 0, apy6m: 0, apy12m: 0 };

    try {
      const [apy3m, apy6m, apy12m] = await wallet.callContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'getAllAPYs',
        [metalId]
      );

      return {
        apy3m: Number(apy3m) / 100,
        apy6m: Number(apy6m) / 100,
        apy12m: Number(apy12m) / 100,
      };
    } catch {
      return DEFAULT_APY[metalSymbol] || { apy3m: 0, apy6m: 0, apy12m: 0 };
    }
  }, [wallet.isConnected, wallet.callContract]);

  // Preview reward
  const previewReward = useCallback(async (
    metalSymbol: string,
    amountGrams: number,
    durationMonths: number
  ): Promise<{ expectedRewardGrams: number; apyPercent: number }> => {
    const fallbackCalc = () => {
      const rates = DEFAULT_APY[metalSymbol];
      const apyPercent = durationMonths === 3 ? rates?.apy3m : durationMonths === 6 ? rates?.apy6m : rates?.apy12m;
      const durationDays = durationMonths === 3 ? 90 : durationMonths === 6 ? 180 : 365;
      const expectedRewardGrams = (amountGrams * (apyPercent || 0) * durationDays) / (100 * 365);
      return { expectedRewardGrams, apyPercent: apyPercent || 0 };
    };

    if (!wallet.isConnected) return fallbackCalc();

    const metalId = METAL_IDS[metalSymbol];
    if (!metalId) return fallbackCalc();

    try {
      const amount = BigInt(Math.floor(amountGrams * 1000));
      const [expectedReward, apyBps] = await wallet.callContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'previewReward',
        [metalId, amount, BigInt(durationMonths)]
      );

      return {
        expectedRewardGrams: Number(expectedReward) / 1000,
        apyPercent: Number(apyBps) / 100,
      };
    } catch {
      return fallbackCalc();
    }
  }, [wallet.isConnected, wallet.callContract]);

  // ============================================
  // WRITE FUNCTIONS
  // ============================================

  const approve = useCallback(async (metalSymbol: string, amountGrams: number): Promise<string> => {
    const tokenAddress = TOKEN_ADDRESSES[metalSymbol];
    if (!tokenAddress) throw new Error('Invalid metal symbol');

    setIsApproving(true);
    setApproveSuccess(false);
    setError(null);

    try {
      const amount = (amountGrams * 1000).toString();
      const hash = await wallet.approveToken(tokenAddress, STAKING_CONTRACT_ADDRESS, amount, TOKEN_DECIMALS);
      
      setApproveSuccess(true);
      setLastTxHash(hash);
      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsApproving(false);
    }
  }, [wallet.approveToken]);

  const stake = useCallback(async (
    metalSymbol: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD',
    amountGrams: number,
    durationMonths: 3 | 6 | 12,
    compounding: boolean = false,
    allocationId: number = 0
  ): Promise<{ hash: string; stakeCode: string }> => {
    const metalId = METAL_IDS[metalSymbol];
    if (!metalId) throw new Error('Invalid metal symbol');

    setIsStaking(true);
    setStakeSuccess(false);
    setLastStakeCode(null);
    setError(null);

    try {
      const amount = BigInt(Math.floor(amountGrams * 1000));

      const hash = await wallet.executeContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'stake',
        [metalId, amount, BigInt(durationMonths), compounding, BigInt(allocationId)]
      );

      const shortCode = `STK-${hash.slice(2, 10).toUpperCase()}`;
      
      setStakeSuccess(true);
      setLastStakeCode(shortCode);
      setLastTxHash(hash);

      setTimeout(() => fetchUserStakes(), 2000);

      return { hash, stakeCode: shortCode };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsStaking(false);
    }
  }, [wallet.executeContract, fetchUserStakes]);

  const unstake = useCallback(async (stakeId: number): Promise<string> => {
    setIsUnstaking(true);
    setError(null);

    try {
      const hash = await wallet.executeContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'unstake',
        [BigInt(stakeId)]
      );

      setLastTxHash(hash);
      setTimeout(() => fetchUserStakes(), 2000);

      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUnstaking(false);
    }
  }, [wallet.executeContract, fetchUserStakes]);

  const claimRewards = useCallback(async (stakeId: number): Promise<string> => {
    setIsClaiming(true);
    setError(null);

    try {
      const hash = await wallet.executeContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'claimRewards',
        [BigInt(stakeId)]
      );

      setLastTxHash(hash);
      setTimeout(() => fetchUserStakes(), 2000);

      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsClaiming(false);
    }
  }, [wallet.executeContract, fetchUserStakes]);

  const compoundRewards = useCallback(async (stakeId: number): Promise<string> => {
    setIsClaiming(true);
    setError(null);

    try {
      const hash = await wallet.executeContract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_ABI,
        'compoundRewards',
        [BigInt(stakeId)]
      );

      setLastTxHash(hash);
      setTimeout(() => fetchUserStakes(), 2000);

      return hash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsClaiming(false);
    }
  }, [wallet.executeContract, fetchUserStakes]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (wallet.isConnected) {
      fetchUserStakes();
    } else {
      setStakes([]);
      setStats({ totalStaked: 0, activePositions: 0, totalEarnings: 0, avgAPY: 0 });
    }
  }, [wallet.isConnected, fetchUserStakes]);

  useEffect(() => {
    if (approveSuccess) {
      const timer = setTimeout(() => setApproveSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [approveSuccess]);

  useEffect(() => {
    if (stakeSuccess) {
      const timer = setTimeout(() => setStakeSuccess(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [stakeSuccess]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    stakes,
    activeStakes: stakes.filter(s => s.active),
    stats,
    loading,
    error,
    isConnected: wallet.isConnected,

    // Transaction states
    isApproving,
    isStaking,
    isUnstaking,
    isClaiming,

    // Success states
    approveSuccess,
    stakeSuccess,
    lastStakeCode,
    lastTxHash,

    // Read functions
    fetchUserStakes,
    getTokenBalance,
    checkAllowance,
    getAPYRates,
    previewReward,

    // Write functions
    approve,
    stake,
    unstake,
    claimRewards,
    compoundRewards,

    // Refresh
    refresh: fetchUserStakes,
  };
}

export default useStakingMobile;
