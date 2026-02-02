// services/WithdrawService.ts
// Withdraw Service - Handle Crypto & Fiat Withdrawals

import apiService from './ApiService';
import balanceService from './BalanceService';
import walletService from './WalletService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WithdrawNetwork {
  id: string;
  name: string;
  symbol: string;
  fee: number;
  minAmount: number;
  maxAmount: number;
  estimatedTime: string;
  addressRegex?: string;
  tagRequired?: boolean;
  tagName?: string;
}

export interface WithdrawRequest {
  coin: string;
  network: string;
  amount: number;
  toAddress: string;
  tag?: number;
  memo?: string;
}

export interface WithdrawResult {
  success: boolean;
  withdrawal?: {
    id: string;
    coin: string;
    amount: number;
    fee: number;
    netAmount: number;
    toAddress: string;
    status: string;
    estimatedTime: string;
  };
  error?: string;
}

export interface WithdrawHistory {
  id: string;
  coin: string;
  amount: number;
  fee: number;
  toAddress: string;
  txHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const WITHDRAW_NETWORKS: Record<string, WithdrawNetwork[]> = {
  ETH: [
    {
      id: 'eth_mainnet',
      name: 'Ethereum Mainnet',
      symbol: 'ERC20',
      fee: 0.005,
      minAmount: 0.01,
      maxAmount: 100,
      estimatedTime: '5-15 minutes',
      addressRegex: '^0x[a-fA-F0-9]{40}$',
    },
  ],
  USDT: [
    {
      id: 'usdt_erc20',
      name: 'Ethereum (ERC20)',
      symbol: 'ERC20',
      fee: 15,
      minAmount: 50,
      maxAmount: 100000,
      estimatedTime: '5-15 minutes',
      addressRegex: '^0x[a-fA-F0-9]{40}$',
    },
    {
      id: 'usdt_trc20',
      name: 'Tron (TRC20)',
      symbol: 'TRC20',
      fee: 1,
      minAmount: 10,
      maxAmount: 100000,
      estimatedTime: '1-5 minutes',
      addressRegex: '^T[a-zA-Z0-9]{33}$',
    },
  ],
  BTC: [
    {
      id: 'btc_mainnet',
      name: 'Bitcoin Network',
      symbol: 'BTC',
      fee: 0.0005,
      minAmount: 0.001,
      maxAmount: 10,
      estimatedTime: '30-60 minutes',
      addressRegex: '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$',
    },
  ],
  XRP: [
    {
      id: 'xrp_mainnet',
      name: 'XRP Ledger',
      symbol: 'XRP',
      fee: 0.1,
      minAmount: 20,
      maxAmount: 100000,
      estimatedTime: '1-5 minutes',
      addressRegex: '^r[1-9A-HJ-NP-Za-km-z]{24,34}$',
      tagRequired: true,
      tagName: 'Destination Tag',
    },
  ],
  SOL: [
    {
      id: 'sol_mainnet',
      name: 'Solana Network',
      symbol: 'SOL',
      fee: 0.01,
      minAmount: 0.1,
      maxAmount: 1000,
      estimatedTime: '1-5 minutes',
      addressRegex: '^[1-9A-HJ-NP-Za-km-z]{32,44}$',
    },
  ],
};

const SUPPORTED_COINS = ['ETH', 'USDT', 'BTC', 'XRP', 'SOL'];

// ═══════════════════════════════════════════════════════════════════════════
// WITHDRAW SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class WithdrawService {
  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORK INFO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get supported coins for withdrawal
   */
  getSupportedCoins(): string[] {
    return SUPPORTED_COINS;
  }

  /**
   * Get available networks for a coin
   */
  getNetworks(coin: string): WithdrawNetwork[] {
    return WITHDRAW_NETWORKS[coin.toUpperCase()] || [];
  }

  /**
   * Get network by ID
   */
  getNetwork(coin: string, networkId: string): WithdrawNetwork | null {
    const networks = this.getNetworks(coin);
    return networks.find(n => n.id === networkId) || null;
  }

  /**
   * Get default network for a coin
   */
  getDefaultNetwork(coin: string): WithdrawNetwork | null {
    const networks = this.getNetworks(coin);
    return networks[0] || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate withdrawal address
   */
  validateAddress(coin: string, networkId: string, address: string): {
    valid: boolean;
    error?: string;
  } {
    const network = this.getNetwork(coin, networkId);
    
    if (!network) {
      return { valid: false, error: 'Invalid network' };
    }

    if (!address || address.trim() === '') {
      return { valid: false, error: 'Address is required' };
    }

    if (network.addressRegex) {
      const regex = new RegExp(network.addressRegex);
      if (!regex.test(address)) {
        return { valid: false, error: 'Invalid address format' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate withdrawal amount
   */
  async validateAmount(coin: string, networkId: string, amount: number): Promise<{
    valid: boolean;
    error?: string;
    fee?: number;
    netAmount?: number;
  }> {
    const network = this.getNetwork(coin, networkId);
    
    if (!network) {
      return { valid: false, error: 'Invalid network' };
    }

    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (amount < network.minAmount) {
      return { valid: false, error: `Minimum withdrawal is ${network.minAmount} ${coin}` };
    }

    if (amount > network.maxAmount) {
      return { valid: false, error: `Maximum withdrawal is ${network.maxAmount} ${coin}` };
    }

    // Check balance
    const withdrawable = await balanceService.getWithdrawableBalance(coin);
    if (amount > withdrawable) {
      return { valid: false, error: `Insufficient balance. Available: ${withdrawable.toFixed(6)} ${coin}` };
    }

    const netAmount = amount - network.fee;
    if (netAmount <= 0) {
      return { valid: false, error: 'Amount too low to cover fees' };
    }

    return {
      valid: true,
      fee: network.fee,
      netAmount,
    };
  }

  /**
   * Validate tag/memo if required
   */
  validateTag(coin: string, networkId: string, tag?: number | string): {
    valid: boolean;
    error?: string;
  } {
    const network = this.getNetwork(coin, networkId);
    
    if (!network) {
      return { valid: false, error: 'Invalid network' };
    }

    if (network.tagRequired && (tag === undefined || tag === null || tag === '')) {
      return { valid: false, error: `${network.tagName || 'Tag'} is required for ${coin}` };
    }

    return { valid: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWAL EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Request withdrawal
   */
  async requestWithdraw(request: WithdrawRequest): Promise<WithdrawResult> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Validate address
    const addressValid = this.validateAddress(request.coin, request.network, request.toAddress);
    if (!addressValid.valid) {
      return { success: false, error: addressValid.error };
    }

    // Validate amount
    const amountValid = await this.validateAmount(request.coin, request.network, request.amount);
    if (!amountValid.valid) {
      return { success: false, error: amountValid.error };
    }

    // Validate tag if needed
    const tagValid = this.validateTag(request.coin, request.network, request.tag);
    if (!tagValid.valid) {
      return { success: false, error: tagValid.error };
    }

    const network = this.getNetwork(request.coin, request.network)!;

    // Submit withdrawal request
    const response = await apiService.requestWithdraw({
      address: walletState.address,
      coin: request.coin,
      amount: request.amount,
      toAddress: request.toAddress,
      tag: request.tag,
    });

    if (!response.success || !response.data?.withdrawal) {
      return { success: false, error: response.error || 'Withdrawal request failed' };
    }

    // Clear balance cache
    balanceService.clearCache();

    return {
      success: true,
      withdrawal: {
        id: response.data.withdrawal.id,
        coin: request.coin,
        amount: request.amount,
        fee: network.fee,
        netAmount: request.amount - network.fee,
        toAddress: request.toAddress,
        status: response.data.withdrawal.status,
        estimatedTime: network.estimatedTime,
      },
    };
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawHistory(): Promise<{
    success: boolean;
    withdrawals: WithdrawHistory[];
    error?: string;
  }> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, withdrawals: [], error: 'Wallet not connected' };
    }

    const response = await apiService.getWithdrawHistory(walletState.address);

    if (!response.success) {
      return { success: false, withdrawals: [], error: response.error };
    }

    return {
      success: true,
      withdrawals: response.data?.withdrawals || [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate withdrawal summary
   */
  calculateSummary(coin: string, networkId: string, amount: number): {
    amount: number;
    fee: number;
    netAmount: number;
    feePercent: number;
  } | null {
    const network = this.getNetwork(coin, networkId);
    if (!network) return null;

    const fee = network.fee;
    const netAmount = Math.max(0, amount - fee);
    const feePercent = amount > 0 ? (fee / amount) * 100 : 0;

    return {
      amount,
      fee,
      netAmount,
      feePercent,
    };
  }

  /**
   * Get maximum withdrawable amount (balance - fee)
   */
  async getMaxWithdrawable(coin: string, networkId: string): Promise<number> {
    const network = this.getNetwork(coin, networkId);
    if (!network) return 0;

    const balance = await balanceService.getWithdrawableBalance(coin);
    const maxAmount = Math.min(balance, network.maxAmount);
    
    // Ensure enough for fee
    if (maxAmount <= network.fee) return 0;
    
    return maxAmount;
  }

  /**
   * Format withdrawal for display
   */
  formatWithdrawal(withdrawal: WithdrawHistory, language: 'en' | 'tr' = 'en'): {
    statusLabel: string;
    statusColor: string;
    dateLabel: string;
    amountLabel: string;
    addressLabel: string;
  } {
    const statusMap: Record<string, { label: { en: string; tr: string }; color: string }> = {
      pending: { label: { en: 'Pending', tr: 'Bekliyor' }, color: '#f59e0b' },
      processing: { label: { en: 'Processing', tr: 'İşleniyor' }, color: '#3b82f6' },
      completed: { label: { en: 'Completed', tr: 'Tamamlandı' }, color: '#10b981' },
      failed: { label: { en: 'Failed', tr: 'Başarısız' }, color: '#ef4444' },
    };

    const status = statusMap[withdrawal.status] || statusMap.pending;

    return {
      statusLabel: status.label[language],
      statusColor: status.color,
      dateLabel: new Date(withdrawal.createdAt).toLocaleDateString(
        language === 'tr' ? 'tr-TR' : 'en-US'
      ),
      amountLabel: `${withdrawal.amount} ${withdrawal.coin}`,
      addressLabel: this.shortenAddress(withdrawal.toAddress),
    };
  }

  /**
   * Shorten address for display
   */
  shortenAddress(address: string): string {
    if (!address || address.length < 12) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }
}

export const withdrawService = new WithdrawService();
export default withdrawService;
