// services/StakingService.ts
// Staking/Leasing Service - On-chain Contract Integration

import walletService, { CONTRACTS, StakingPosition } from './WalletService';
import apiService from './ApiService';
import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LeaseRate {
  metal: string;
  symbol: string;
  name: string;
  nameTr: string;
  periods: Array<{
    months: number;
    days: number;
    apy: number;
  }>;
  minAmount: number;
  maxAmount: number;
  tvl: number;
  contractAddress: string;
  tokenAddress: string;
}

export interface StakeParams {
  metal: string;
  amount: number; // in grams (will be converted to wei)
  periodMonths: number;
}

export interface StakeResult {
  success: boolean;
  txHash?: string;
  position?: StakingPosition;
  error?: string;
}

export interface ClaimResult {
  success: boolean;
  txHash?: string;
  claimedAmount?: number;
  error?: string;
}

export interface StakingSummary {
  totalStaked: number; // USD value
  totalRewards: number; // USD value
  activePositions: number;
  maturedPositions: number;
  positionsByMetal: Record<string, {
    staked: number;
    rewards: number;
    positions: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const LEASE_RATES_CONFIG: LeaseRate[] = [
  {
    metal: 'AUXG',
    symbol: 'AUXG',
    name: 'Gold',
    nameTr: 'Altın',
    periods: [
      { months: 3, days: 90, apy: 2.5 },
      { months: 6, days: 180, apy: 3.0 },
      { months: 12, days: 365, apy: 3.5 },
    ],
    minAmount: 10,
    maxAmount: 0, // 0 = unlimited
    tvl: 500000,
    contractAddress: '0xe63050b6d0497a970d3fB44EBF428742631d1006',
    tokenAddress: '0xE425A9923250E94Fe2F4cB99cbc0896Aea24933a',
  },
  {
    metal: 'AUXS',
    symbol: 'AUXS',
    name: 'Silver',
    nameTr: 'Gümüş',
    periods: [
      { months: 3, days: 90, apy: 2.0 },
      { months: 6, days: 180, apy: 2.5 },
      { months: 12, days: 365, apy: 3.0 },
    ],
    minAmount: 100,
    maxAmount: 0,
    tvl: 250000,
    contractAddress: '0x6396163f0CeA0EdC639c353f6D1EbCd7C5427945',
    tokenAddress: '0xaE583c98c833a0B4b1B23e58209E697d95F05D23',
  },
  {
    metal: 'AUXPT',
    symbol: 'AUXPT',
    name: 'Platinum',
    nameTr: 'Platin',
    periods: [
      { months: 3, days: 90, apy: 3.0 },
      { months: 6, days: 180, apy: 3.5 },
      { months: 12, days: 365, apy: 4.0 },
    ],
    minAmount: 5,
    maxAmount: 0,
    tvl: 350000,
    contractAddress: '0xeB95c1C459506F6265c800C64D3423005499C3Ea',
    tokenAddress: '0xeCfD88bE4f93C9379644B303444943e636A35F66',
  },
  {
    metal: 'AUXPD',
    symbol: 'AUXPD',
    name: 'Palladium',
    nameTr: 'Paladyum',
    periods: [
      { months: 3, days: 90, apy: 2.8 },
      { months: 6, days: 180, apy: 3.3 },
      { months: 12, days: 365, apy: 3.8 },
    ],
    minAmount: 5,
    maxAmount: 0,
    tvl: 150000,
    contractAddress: '0x587706Bf9A907288145cfFc35b57818Df4db68A4',
    tokenAddress: '0x6F4E027B42E14e06f3eaeA39d574122188eab1D4',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// STAKING SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class StakingService {
  private positionsCache: StakingPosition[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  // ═══════════════════════════════════════════════════════════════════════════
  // LEASE RATES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get lease rates for all metals
   */
  getLeaseRates(): LeaseRate[] {
    return LEASE_RATES_CONFIG;
  }

  /**
   * Get lease rate for specific metal
   */
  getLeaseRateByMetal(metal: string): LeaseRate | undefined {
    return LEASE_RATES_CONFIG.find(r => r.metal === metal.toUpperCase());
  }

  /**
   * Get APY for specific metal and period
   */
  getApy(metal: string, months: number): number {
    const rate = this.getLeaseRateByMetal(metal);
    if (!rate) return 0;
    
    const period = rate.periods.find(p => p.months === months);
    return period?.apy || 0;
  }

  /**
   * Calculate expected reward
   */
  calculateExpectedReward(amount: number, apy: number, days: number): number {
    // Simple interest calculation: reward = principal * (apy/100) * (days/365)
    return amount * (apy / 100) * (days / 365);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAKING OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create new stake position
   */
  async stake(params: StakeParams): Promise<StakeResult> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    const rate = this.getLeaseRateByMetal(params.metal);
    if (!rate) {
      return { success: false, error: 'Invalid metal' };
    }

    // Validate period
    const period = rate.periods.find(p => p.months === params.periodMonths);
    if (!period) {
      return { success: false, error: 'Invalid staking period' };
    }

    // Validate amount
    if (params.amount < rate.minAmount) {
      return { success: false, error: `Minimum amount is ${rate.minAmount}g` };
    }

    if (rate.maxAmount > 0 && params.amount > rate.maxAmount) {
      return { success: false, error: `Maximum amount is ${rate.maxAmount}g` };
    }

    // Convert amount to wei (18 decimals)
    const amountWei = ethers.parseUnits(params.amount.toString(), 18).toString();

    // Check balance
    const balance = await walletService.getTokenBalance(rate.tokenAddress);
    if (!balance || balance.balanceFormatted < params.amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Deposit to leasing contract
    const result = await walletService.depositToLeasing(params.metal, amountWei);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Clear cache to force refresh
    this.lastFetch = 0;

    return {
      success: true,
      txHash: result.txHash,
    };
  }

  /**
   * Withdraw/Claim matured position
   */
  async claim(metal: string, positionIndex: number): Promise<ClaimResult> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Check if position exists and is matured
    const positions = await this.getPositions(metal);
    const position = positions.find(p => p.index === positionIndex);

    if (!position) {
      return { success: false, error: 'Position not found' };
    }

    if (!position.isMatured) {
      return { success: false, error: 'Position not yet matured' };
    }

    if (position.closed) {
      return { success: false, error: 'Position already claimed' };
    }

    // Withdraw from leasing contract
    const result = await walletService.withdrawFromLeasing(metal, positionIndex);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Clear cache
    this.lastFetch = 0;

    return {
      success: true,
      txHash: result.txHash,
      claimedAmount: position.amountFormatted,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POSITION QUERIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get positions for specific metal
   */
  async getPositions(metal: string): Promise<StakingPosition[]> {
    return walletService.getStakingPositions(metal);
  }

  /**
   * Get all positions across all metals
   */
  async getAllPositions(forceRefresh: boolean = false): Promise<StakingPosition[]> {
    const now = Date.now();
    
    if (!forceRefresh && this.positionsCache.length > 0 && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.positionsCache;
    }

    this.positionsCache = await walletService.getAllStakingPositions();
    this.lastFetch = now;

    return this.positionsCache;
  }

  /**
   * Get staking summary
   */
  async getSummary(metalPrices: Record<string, number>): Promise<StakingSummary> {
    const positions = await this.getAllPositions();
    
    const summary: StakingSummary = {
      totalStaked: 0,
      totalRewards: 0,
      activePositions: 0,
      maturedPositions: 0,
      positionsByMetal: {},
    };

    for (const position of positions) {
      if (position.closed) continue;

      const price = metalPrices[position.metal] || 0;
      const stakedValue = position.amountFormatted * price;
      
      // Calculate expected reward based on APY
      const rate = this.getLeaseRateByMetal(position.metal);
      const days = (position.endTime - position.startTime) / 86400;
      const months = Math.round(days / 30);
      const apy = this.getApy(position.metal, months);
      const expectedReward = this.calculateExpectedReward(position.amountFormatted, apy, days);
      const rewardValue = expectedReward * price;

      summary.totalStaked += stakedValue;
      summary.totalRewards += rewardValue;

      if (position.isMatured) {
        summary.maturedPositions++;
      } else {
        summary.activePositions++;
      }

      // Group by metal
      if (!summary.positionsByMetal[position.metal]) {
        summary.positionsByMetal[position.metal] = {
          staked: 0,
          rewards: 0,
          positions: 0,
        };
      }
      summary.positionsByMetal[position.metal].staked += stakedValue;
      summary.positionsByMetal[position.metal].rewards += rewardValue;
      summary.positionsByMetal[position.metal].positions++;
    }

    return summary;
  }

  /**
   * Get active positions count
   */
  async getActivePositionsCount(): Promise<number> {
    const positions = await this.getAllPositions();
    return positions.filter(p => !p.closed && !p.isMatured).length;
  }

  /**
   * Get matured positions that can be claimed
   */
  async getClaimablePositions(): Promise<StakingPosition[]> {
    const positions = await this.getAllPositions();
    return positions.filter(p => p.isMatured && !p.closed);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format position for display
   */
  formatPosition(position: StakingPosition, language: 'en' | 'tr' = 'en'): {
    metalLabel: string;
    amountLabel: string;
    statusLabel: string;
    statusColor: string;
    progressLabel: string;
    daysRemaining: number;
    endDateLabel: string;
  } {
    const rate = this.getLeaseRateByMetal(position.metal);
    const now = Math.floor(Date.now() / 1000);
    const daysRemaining = Math.max(0, Math.ceil((position.endTime - now) / 86400));
    const endDate = new Date(position.endTime * 1000);

    let statusLabel: string;
    let statusColor: string;

    if (position.closed) {
      statusLabel = language === 'tr' ? 'Kapatıldı' : 'Closed';
      statusColor = '#64748b';
    } else if (position.isMatured) {
      statusLabel = language === 'tr' ? 'Çekilebilir' : 'Claimable';
      statusColor = '#10b981';
    } else {
      statusLabel = language === 'tr' ? 'Aktif' : 'Active';
      statusColor = '#3b82f6';
    }

    return {
      metalLabel: language === 'tr' ? (rate?.nameTr || position.metal) : (rate?.name || position.metal),
      amountLabel: `${position.amountFormatted.toFixed(2)}g`,
      statusLabel,
      statusColor,
      progressLabel: `${position.progress}%`,
      daysRemaining,
      endDateLabel: endDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
    };
  }

  /**
   * Estimate gas for staking
   */
  async estimateStakeGas(metal: string, amount: string): Promise<{
    gasLimit: string;
    gasPriceGwei: string;
    estimatedCostEth: string;
  } | null> {
    // This would require provider access - simplified version
    return {
      gasLimit: '150000',
      gasPriceGwei: '20',
      estimatedCostEth: '0.003',
    };
  }

  /**
   * Clear positions cache
   */
  clearCache(): void {
    this.positionsCache = [];
    this.lastFetch = 0;
  }
}

export const stakingService = new StakingService();
export default stakingService;
