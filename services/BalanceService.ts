// services/BalanceService.ts
// Balance Service - Unified On-chain + Off-chain Balance Management

import apiService from './ApiService';
import walletService, { TokenBalance } from './WalletService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UserBalance {
  // Stablecoins (off-chain)
  auxm: number;
  bonusAuxm: number;
  usdt: number;
  usd: number;
  
  // Metals (hybrid - can be on-chain or off-chain)
  auxg: number;
  auxs: number;
  auxpt: number;
  auxpd: number;
  
  // Crypto (off-chain for custodial)
  btc: number;
  eth: number;
  xrp: number;
  sol: number;
  
  // Computed
  totalAuxm: number;
}

export interface OnChainBalance {
  auxg: number;
  auxs: number;
  auxpt: number;
  auxpd: number;
  eth: number;
}

export interface BalanceWithValue {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  value: number;
  change24h: number;
  type: 'metal' | 'crypto' | 'stablecoin';
  isOnChain: boolean;
}

export interface PortfolioSummary {
  totalValue: number;
  availableValue: number;
  lockedValue: number;
  change24h: number;
  changePercent: number;
  breakdown: {
    metals: number;
    crypto: number;
    stablecoins: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ASSET_INFO: Record<string, { name: string; type: 'metal' | 'crypto' | 'stablecoin'; icon: string }> = {
  // Metals
  AUXG: { name: 'Gold', type: 'metal', icon: '🥇' },
  AUXS: { name: 'Silver', type: 'metal', icon: '🥈' },
  AUXPT: { name: 'Platinum', type: 'metal', icon: '💎' },
  AUXPD: { name: 'Palladium', type: 'metal', icon: '🔶' },
  
  // Stablecoins
  AUXM: { name: 'Auxite Money', type: 'stablecoin', icon: '◈' },
  USDT: { name: 'Tether', type: 'stablecoin', icon: '₮' },
  USD: { name: 'US Dollar', type: 'stablecoin', icon: '$' },
  
  // Crypto
  BTC: { name: 'Bitcoin', type: 'crypto', icon: '₿' },
  ETH: { name: 'Ethereum', type: 'crypto', icon: 'Ξ' },
  XRP: { name: 'Ripple', type: 'crypto', icon: '✕' },
  SOL: { name: 'Solana', type: 'crypto', icon: '◎' },
};

// ═══════════════════════════════════════════════════════════════════════════
// BALANCE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class BalanceService {
  private cachedBalance: UserBalance | null = null;
  private cachedOnChainBalance: OnChainBalance | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 10000; // 10 seconds
  private listeners: Array<(balance: UserBalance) => void> = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get off-chain balance from API (Redis)
   */
  async getOffChainBalance(): Promise<UserBalance | null> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected || !walletState.address) {
      return null;
    }

    const response = await apiService.getBalance(walletState.address);
    
    if (!response.success || !response.data?.balances) {
      return null;
    }

    const b = response.data.balances;
    
    return {
      auxm: b.auxm || 0,
      bonusAuxm: b.bonusAuxm || 0,
      usdt: b.usdt || 0,
      usd: b.usd || 0,
      auxg: b.auxg || 0,
      auxs: b.auxs || 0,
      auxpt: b.auxpt || 0,
      auxpd: b.auxpd || 0,
      btc: b.btc || 0,
      eth: b.eth || 0,
      xrp: b.xrp || 0,
      sol: b.sol || 0,
      totalAuxm: (b.auxm || 0) + (b.bonusAuxm || 0),
    };
  }

  /**
   * Get on-chain token balances
   */
  async getOnChainBalance(): Promise<OnChainBalance | null> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected) {
      return null;
    }

    const metalBalances = await walletService.getAllMetalBalances();
    
    return {
      auxg: metalBalances.AUXG?.balanceFormatted || 0,
      auxs: metalBalances.AUXS?.balanceFormatted || 0,
      auxpt: metalBalances.AUXPT?.balanceFormatted || 0,
      auxpd: metalBalances.AUXPD?.balanceFormatted || 0,
      eth: 0, // Would need to fetch ETH balance separately
    };
  }

  /**
   * Get unified balance (off-chain + on-chain)
   * Off-chain balances are preferred for non-token assets
   * On-chain balances are authoritative for tokens
   */
  async getBalance(forceRefresh: boolean = false): Promise<UserBalance | null> {
    const now = Date.now();
    
    if (!forceRefresh && this.cachedBalance && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.cachedBalance;
    }

    const [offChain, onChain] = await Promise.all([
      this.getOffChainBalance(),
      this.getOnChainBalance(),
    ]);

    if (!offChain) {
      return null;
    }

    // Merge: prefer on-chain for tokens, off-chain for custodial
    this.cachedBalance = {
      ...offChain,
      // On-chain token balances override off-chain if wallet is connected
      auxg: onChain?.auxg ?? offChain.auxg,
      auxs: onChain?.auxs ?? offChain.auxs,
      auxpt: onChain?.auxpt ?? offChain.auxpt,
      auxpd: onChain?.auxpd ?? offChain.auxpd,
    };

    this.cachedOnChainBalance = onChain;
    this.lastFetch = now;
    this.notifyListeners();

    return this.cachedBalance;
  }

  /**
   * Get balance with USD values
   */
  async getBalanceWithValues(
    metalPrices: Record<string, number>,
    cryptoPrices: Record<string, number>
  ): Promise<BalanceWithValue[]> {
    const balance = await this.getBalance();
    if (!balance) return [];

    const assets: BalanceWithValue[] = [];
    const onChain = this.cachedOnChainBalance;

    // Metals
    for (const symbol of ['AUXG', 'AUXS', 'AUXPT', 'AUXPD']) {
      const bal = balance[symbol.toLowerCase() as keyof UserBalance] as number;
      if (bal > 0) {
        const price = metalPrices[symbol] || 0;
        assets.push({
          symbol,
          name: ASSET_INFO[symbol]?.name || symbol,
          balance: bal,
          price,
          value: bal * price,
          change24h: 0, // Would need to fetch
          type: 'metal',
          isOnChain: onChain ? (onChain[symbol.toLowerCase() as keyof OnChainBalance] || 0) > 0 : false,
        });
      }
    }

    // Stablecoins
    for (const symbol of ['AUXM', 'USDT', 'USD']) {
      const key = symbol.toLowerCase() as keyof UserBalance;
      let bal = 0;
      if (symbol === 'AUXM') {
        bal = balance.totalAuxm;
      } else {
        bal = balance[key] as number;
      }
      
      if (bal > 0) {
        assets.push({
          symbol,
          name: ASSET_INFO[symbol]?.name || symbol,
          balance: bal,
          price: 1,
          value: bal,
          change24h: 0,
          type: 'stablecoin',
          isOnChain: false,
        });
      }
    }

    // Crypto
    for (const symbol of ['BTC', 'ETH', 'XRP', 'SOL']) {
      const bal = balance[symbol.toLowerCase() as keyof UserBalance] as number;
      if (bal > 0) {
        const priceKey = symbol === 'BTC' ? 'bitcoin' : symbol === 'ETH' ? 'ethereum' : symbol.toLowerCase();
        const price = cryptoPrices[priceKey] || 0;
        assets.push({
          symbol,
          name: ASSET_INFO[symbol]?.name || symbol,
          balance: bal,
          price,
          value: bal * price,
          change24h: 0,
          type: 'crypto',
          isOnChain: false, // Custodial
        });
      }
    }

    // Sort by value descending
    assets.sort((a, b) => b.value - a.value);

    return assets;
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(
    metalPrices: Record<string, number>,
    cryptoPrices: Record<string, number>,
    lockedValue: number = 0
  ): Promise<PortfolioSummary | null> {
    const assets = await this.getBalanceWithValues(metalPrices, cryptoPrices);
    
    if (assets.length === 0) {
      return null;
    }

    const breakdown = { metals: 0, crypto: 0, stablecoins: 0 };
    let totalValue = 0;

    for (const asset of assets) {
      totalValue += asset.value;
      if (asset.type === 'metal') {
        breakdown.metals += asset.value;
      } else if (asset.type === 'crypto') {
        breakdown.crypto += asset.value;
      } else {
        breakdown.stablecoins += asset.value;
      }
    }

    return {
      totalValue,
      availableValue: totalValue - lockedValue,
      lockedValue,
      change24h: 0, // Would need historical data
      changePercent: 0,
      breakdown,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(symbol: string, amount: number): Promise<{
    sufficient: boolean;
    available: number;
    required: number;
  }> {
    const balance = await this.getBalance();
    if (!balance) {
      return { sufficient: false, available: 0, required: amount };
    }

    const key = symbol.toLowerCase() as keyof UserBalance;
    let available = 0;

    if (symbol === 'AUXM') {
      available = balance.totalAuxm;
    } else if (key in balance) {
      available = balance[key] as number;
    }

    return {
      sufficient: available >= amount,
      available,
      required: amount,
    };
  }

  /**
   * Get withdrawable balance (excludes bonus AUXM)
   */
  async getWithdrawableBalance(symbol: string): Promise<number> {
    const balance = await this.getBalance();
    if (!balance) return 0;

    // For AUXM, only normal balance is withdrawable (not bonus)
    if (symbol === 'AUXM') {
      return balance.auxm;
    }

    const key = symbol.toLowerCase() as keyof UserBalance;
    return (balance[key] as number) || 0;
  }

  /**
   * Check if bonus AUXM can be used (only for metal purchases)
   */
  canUseBonusAuxm(purchaseType: 'metal' | 'crypto' | 'withdraw'): boolean {
    return purchaseType === 'metal';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to balance updates
   */
  subscribe(callback: (balance: UserBalance) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    if (this.cachedBalance) {
      this.listeners.forEach(l => l(this.cachedBalance!));
    }
  }

  /**
   * Clear cache and force refresh
   */
  clearCache(): void {
    this.cachedBalance = null;
    this.cachedOnChainBalance = null;
    this.lastFetch = 0;
  }

  /**
   * Refresh balance
   */
  async refresh(): Promise<UserBalance | null> {
    return this.getBalance(true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format balance for display
   */
  formatBalance(symbol: string, amount: number): string {
    if (['BTC', 'ETH'].includes(symbol)) {
      return amount.toFixed(6);
    }
    if (['AUXG', 'AUXS', 'AUXPT', 'AUXPD'].includes(symbol)) {
      return amount.toFixed(2) + 'g';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Format value for display
   */
  formatValue(amount: number): string {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Get asset info
   */
  getAssetInfo(symbol: string): { name: string; type: string; icon: string } | null {
    return ASSET_INFO[symbol.toUpperCase()] || null;
  }
}

export const balanceService = new BalanceService();
export default balanceService;
