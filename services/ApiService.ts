// services/ApiService.ts
// Base API Client for Auxite Backend

import { API_URL } from '@/constants/api';
const API_BASE_URL = API_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICES
  // ═══════════════════════════════════════════════════════════════════════════

  async getMetalPrices() {
    return this.request<{
      ok: boolean;
      data: Array<{
        id: string;
        symbol: string;
        name: string;
        priceOz: number;
        ts: string;
      }>;
      changes: Record<string, number>;
    }>('/api/prices?chain=84532');
  }

  async getCryptoPrices() {
    return this.request<{
      bitcoin: { usd: number; usd_24h_change: number };
      ethereum: { usd: number; usd_24h_change: number };
      ripple: { usd: number; usd_24h_change: number };
      solana: { usd: number; usd_24h_change: number };
      tether: { usd: number; usd_24h_change: number };
    }>('/api/crypto');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async getBalance(address: string) {
    return this.request<{
      success: boolean;
      address: string;
      balances: {
        auxm: number;
        bonusAuxm: number;
        totalAuxm: number;
        auxg: number;
        auxs: number;
        auxpt: number;
        auxpd: number;
        eth: number;
        btc: number;
        xrp: number;
        sol: number;
        usdt: number;
        usd: number;
      };
    }>(`/api/user/balance?address=${address}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTE & TRADE
  // ═══════════════════════════════════════════════════════════════════════════

  async createQuote(params: {
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
    address: string;
  }) {
    return this.request<{
      success: boolean;
      quote: {
        id: string;
        type: 'buy' | 'sell';
        metal: string;
        grams: number;
        basePrice: number;
        pricePerGram: number;
        spreadPercent: number;
        totalUSD: number;
        totalAUXM: number;
        expiresAt: number;
        createdAt: number;
        timeRemaining: number;
      };
      message: string;
    }>('/api/quote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getQuote(quoteId: string) {
    return this.request<{
      id: string;
      type: 'buy' | 'sell';
      metal: string;
      grams: number;
      pricePerGram: number;
      totalUSD: number;
      totalAUXM: number;
      timeRemaining: number;
    }>(`/api/quote?id=${quoteId}`);
  }

  async executeTrade(params: {
    quoteId: string;
    address: string;
  }) {
    return this.request<{
      success: boolean;
      trade: {
        id: string;
        type: 'buy' | 'sell';
        metal: string;
        grams: number;
        totalAUXM: number;
        executedAt: string;
      };
      newBalance: Record<string, number>;
    }>('/api/trade/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIMIT ORDERS
  // ═══════════════════════════════════════════════════════════════════════════

  async getLimitOrders(address: string, status?: string) {
    const url = status 
      ? `/api/orders/limit?address=${address}&status=${status}`
      : `/api/orders/limit?address=${address}`;
    return this.request<{
      success: boolean;
      orders: Array<{
        id: string;
        type: 'buy' | 'sell';
        metal: string;
        grams: number;
        limitPrice: number;
        paymentMethod: string;
        status: 'pending' | 'filled' | 'cancelled' | 'expired';
        createdAt: string;
        expiresAt: string;
      }>;
      count: number;
    }>(url);
  }

  async createLimitOrder(params: {
    address: string;
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
    limitPrice: number;
    paymentMethod?: string;
    expiresInDays?: number;
  }) {
    return this.request<{
      success: boolean;
      order: any;
      message: string;
    }>('/api/orders/limit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async cancelLimitOrder(orderId: string, address: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/orders/limit', {
      method: 'DELETE',
      body: JSON.stringify({ orderId, address }),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTransactions(params: {
    address: string;
    type?: string;
    coin?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.set('address', params.address);
    if (params.type) searchParams.set('type', params.type);
    if (params.coin) searchParams.set('coin', params.coin);
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    return this.request<{
      address: string;
      transactions: Array<{
        id: string;
        type: string;
        coin: string;
        amount: number;
        amountUsd: number;
        fee?: number;
        status: 'pending' | 'completed' | 'failed';
        txHash?: string;
        createdAt: string;
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
      summary: any;
    }>(`/api/transactions?${searchParams.toString()}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPOSITS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDepositAddress(params: {
    address: string;
    coin: string;
    network?: string;
  }) {
    return this.request<{
      success: boolean;
      depositAddress: string;
      coin: string;
      network: string;
      minDeposit: number;
      confirmations: number;
    }>('/api/deposits/address', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getDepositHistory(address: string, limit: number = 20) {
    return this.request<{
      address: string;
      deposits: Array<{
        id: string;
        coin: string;
        amount: number;
        amountUsd: number;
        auxmAmount: number;
        bonusAmount: number;
        totalAuxm: number;
        status: 'pending' | 'confirmed' | 'failed';
        txHash: string;
        createdAt: string;
      }>;
      summary: {
        totalAuxmReceived: number;
        totalBonusReceived: number;
      };
    }>(`/api/deposits?address=${address}&limit=${limit}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWALS
  // ═══════════════════════════════════════════════════════════════════════════

  async requestWithdraw(params: {
    address: string;
    coin: string;
    amount: number;
    toAddress: string;
    tag?: number;
  }) {
    return this.request<{
      success: boolean;
      withdrawal: {
        id: string;
        coin: string;
        amount: number;
        fee: number;
        netAmount: number;
        toAddress: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
      };
      message: string;
    }>('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getWithdrawHistory(address: string) {
    return this.request<{
      withdrawals: Array<{
        id: string;
        coin: string;
        amount: number;
        fee: number;
        toAddress: string;
        txHash?: string;
        status: string;
        createdAt: string;
      }>;
    }>(`/api/withdrawals?address=${address}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAKING / LEASING
  // ═══════════════════════════════════════════════════════════════════════════

  async getLeaseRates() {
    return this.request<{
      rates: Array<{
        metal: string;
        symbol: string;
        periods: Array<{
          months: number;
          days: number;
          apy: number;
        }>;
        minAmount: number;
        tvl: number;
      }>;
    }>('/api/staking/rates');
  }

  async getStakingPositions(address: string) {
    return this.request<{
      positions: Array<{
        id: string;
        metal: string;
        amount: number;
        startTime: number;
        endTime: number;
        apy: number;
        expectedReward: number;
        progress: number;
        isMatured: boolean;
        contractAddress: string;
      }>;
    }>(`/api/staking/positions?address=${address}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAKES
  // ═══════════════════════════════════════════════════════════════════════════

  async getStakes(address: string) {
    return this.request<{
      success: boolean;
      stakes: Array<{
        id: string;
        metal: string;
        amount: number;
        duration: number;
        startDate: string;
        endDate: string;
        status: string;
      }>;
    }>(`/api/stakes?address=${address}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALLOCATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAllocations(address: string) {
    return this.request<{
      success: boolean;
      allocations: Array<{
        id: string;
        metal: string;
        grams: number;
        vaultId: string;
        createdAt: string;
      }>;
    }>(`/api/allocations?address=${address}`);
  }

  async requestAllocation(params: {
    address: string;
    metal: string;
    grams: number;
    vaultId?: string;
  }) {
    return this.request<{
      success: boolean;
      allocations: any;
    }>('/api/allocations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECURRING BUY (DCA)
  // ═══════════════════════════════════════════════════════════════════════════

  async getRecurringBuys(address: string) {
    return this.request<{
      recurringBuys: Array<{
        id: string;
        token: string;
        amount: number;
        frequency: string;
        status: string;
        stats: {
          totalPurchased: number;
          totalSpent: number;
          averagePrice: number;
          executionCount: number;
          nextExecutionAt?: string;
        };
      }>;
    }>(`/api/recurring-buy?address=${address}`);
  }

  async createRecurringBuy(params: {
    address: string;
    token: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    paymentSource: 'usd_balance' | 'usdt_balance';
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour?: number;
  }) {
    return this.request<{
      success: boolean;
      recurringBuy: any;
      message: string;
    }>('/api/recurring-buy', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async cancelRecurringBuy(id: string, address: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/recurring-buy', {
      method: 'DELETE',
      body: JSON.stringify({ id, address }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
