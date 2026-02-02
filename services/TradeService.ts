// services/TradeService.ts
// Trade Service - Quote and Execute Metal Trades

import apiService from './ApiService';
import walletService from './WalletService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Quote {
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
}

export interface TradeResult {
  success: boolean;
  trade?: {
    id: string;
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
    totalAUXM: number;
    executedAt: string;
    txHash?: string;
  };
  newBalance?: Record<string, number>;
  error?: string;
}

export interface LimitOrder {
  id: string;
  type: 'buy' | 'sell';
  metal: string;
  grams: number;
  limitPrice: number;
  paymentMethod: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  filledAt?: string;
  filledPrice?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const QUOTE_REFRESH_INTERVAL = 25000; // 25 seconds (quote expires in 30s)
const TROY_OZ_TO_GRAM = 31.1035;

export const METAL_INFO = {
  AUXG: { name: 'Gold', nametr: 'Altın', color: '#EAB308', minAmount: 0.1 },
  AUXS: { name: 'Silver', nameTr: 'Gümüş', color: '#94A3B8', minAmount: 1 },
  AUXPT: { name: 'Platinum', nameTr: 'Platin', color: '#E2E8F0', minAmount: 0.1 },
  AUXPD: { name: 'Palladium', nameTr: 'Paladyum', color: '#64748B', minAmount: 0.1 },
};

// ═══════════════════════════════════════════════════════════════════════════
// TRADE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class TradeService {
  private currentQuote: Quote | null = null;
  private quoteRefreshTimer: NodeJS.Timeout | null = null;
  private quoteListeners: Array<(quote: Quote | null) => void> = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICE FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current metal prices
   */
  async getMetalPrices(): Promise<Record<string, { pricePerGram: number; change24h: number }>> {
    const response = await apiService.getMetalPrices();
    
    if (!response.success || !response.data?.data) {
      return {};
    }

    const prices: Record<string, { pricePerGram: number; change24h: number }> = {};
    
    for (const metal of response.data.data) {
      if (metal.priceOz) {
        prices[metal.symbol] = {
          pricePerGram: metal.priceOz / TROY_OZ_TO_GRAM,
          change24h: response.data.changes?.[metal.symbol] || 0,
        };
      }
    }

    return prices;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Request a new quote
   */
  async requestQuote(params: {
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
  }): Promise<{ success: boolean; quote?: Quote; error?: string }> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Validate metal
    const metalUpper = params.metal.toUpperCase();
    if (!METAL_INFO[metalUpper as keyof typeof METAL_INFO]) {
      return { success: false, error: 'Invalid metal' };
    }

    // Validate amount
    const minAmount = METAL_INFO[metalUpper as keyof typeof METAL_INFO].minAmount;
    if (params.grams < minAmount) {
      return { success: false, error: `Minimum amount is ${minAmount}g` };
    }

    // Clear existing quote
    this.clearQuote();

    // Request new quote
    const response = await apiService.createQuote({
      type: params.type,
      metal: metalUpper,
      grams: params.grams,
      address: walletState.address,
    });

    if (!response.success || !response.data?.quote) {
      return { success: false, error: response.error || 'Failed to get quote' };
    }

    this.currentQuote = response.data.quote;
    this.notifyQuoteListeners();
    this.startQuoteCountdown();

    return { success: true, quote: this.currentQuote };
  }

  /**
   * Get current quote
   */
  getCurrentQuote(): Quote | null {
    return this.currentQuote;
  }

  /**
   * Clear current quote
   */
  clearQuote(): void {
    this.currentQuote = null;
    if (this.quoteRefreshTimer) {
      clearInterval(this.quoteRefreshTimer);
      this.quoteRefreshTimer = null;
    }
    this.notifyQuoteListeners();
  }

  /**
   * Subscribe to quote updates
   */
  subscribeToQuote(callback: (quote: Quote | null) => void): () => void {
    this.quoteListeners.push(callback);
    return () => {
      this.quoteListeners = this.quoteListeners.filter(l => l !== callback);
    };
  }

  private notifyQuoteListeners(): void {
    this.quoteListeners.forEach(l => l(this.currentQuote));
  }

  private startQuoteCountdown(): void {
    if (this.quoteRefreshTimer) {
      clearInterval(this.quoteRefreshTimer);
    }

    this.quoteRefreshTimer = setInterval(() => {
      if (this.currentQuote) {
        const remaining = Math.max(0, this.currentQuote.expiresAt - Date.now());
        this.currentQuote.timeRemaining = Math.floor(remaining / 1000);
        
        if (this.currentQuote.timeRemaining <= 0) {
          this.clearQuote();
        } else {
          this.notifyQuoteListeners();
        }
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute current quote
   */
  async executeTrade(): Promise<TradeResult> {
    if (!this.currentQuote) {
      return { success: false, error: 'No active quote' };
    }

    if (this.currentQuote.timeRemaining <= 0) {
      this.clearQuote();
      return { success: false, error: 'Quote expired' };
    }

    const walletState = walletService.getState();
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Execute trade via API
    const response = await apiService.executeTrade({
      quoteId: this.currentQuote.id,
      address: walletState.address,
    });

    if (!response.success || !response.data?.trade) {
      return { success: false, error: response.error || 'Trade failed' };
    }

    const trade = response.data.trade;
    
    // Clear quote after successful trade
    this.clearQuote();

    return {
      success: true,
      trade: {
        id: trade.id,
        type: trade.type,
        metal: trade.metal,
        grams: trade.grams,
        totalAUXM: trade.totalAUXM,
        executedAt: trade.executedAt,
      },
      newBalance: response.data.newBalance,
    };
  }

  /**
   * Quick trade - get quote and execute in one call
   */
  async quickTrade(params: {
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
  }): Promise<TradeResult> {
    // Get quote
    const quoteResult = await this.requestQuote(params);
    if (!quoteResult.success) {
      return { success: false, error: quoteResult.error };
    }

    // Execute immediately
    return this.executeTrade();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIMIT ORDERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get user's limit orders
   */
  async getLimitOrders(status?: 'pending' | 'filled' | 'cancelled' | 'expired'): Promise<{
    success: boolean;
    orders: LimitOrder[];
    error?: string;
  }> {
    const walletState = walletService.getState();
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, orders: [], error: 'Wallet not connected' };
    }

    const response = await apiService.getLimitOrders(walletState.address, status);
    
    if (!response.success) {
      return { success: false, orders: [], error: response.error };
    }

    return {
      success: true,
      orders: response.data?.orders || [],
    };
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(params: {
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
    limitPrice: number;
    paymentMethod?: 'AUXM' | 'USDT' | 'USD';
    expiresInDays?: number;
  }): Promise<{ success: boolean; order?: LimitOrder; error?: string }> {
    const walletState = walletService.getState();
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Validate
    const metalUpper = params.metal.toUpperCase();
    if (!METAL_INFO[metalUpper as keyof typeof METAL_INFO]) {
      return { success: false, error: 'Invalid metal' };
    }

    if (params.grams <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    if (params.limitPrice <= 0) {
      return { success: false, error: 'Invalid price' };
    }

    const response = await apiService.createLimitOrder({
      address: walletState.address,
      type: params.type,
      metal: metalUpper,
      grams: params.grams,
      limitPrice: params.limitPrice,
      paymentMethod: params.paymentMethod || 'AUXM',
      expiresInDays: params.expiresInDays || 7,
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      order: response.data?.order,
    };
  }

  /**
   * Cancel a limit order
   */
  async cancelLimitOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    const walletState = walletService.getState();
    if (!walletState.isConnected || !walletState.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    const response = await apiService.cancelLimitOrder(orderId, walletState.address);
    return response.success ? { success: true } : { success: false, error: response.error };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate estimated cost/proceeds
   */
  calculateEstimate(type: 'buy' | 'sell', grams: number, pricePerGram: number): {
    subtotal: number;
    spreadEstimate: number;
    total: number;
  } {
    const subtotal = grams * pricePerGram;
    // Estimate 0.5% spread
    const spreadPercent = type === 'buy' ? 0.5 : -0.3;
    const spreadEstimate = subtotal * (spreadPercent / 100);
    const total = subtotal + spreadEstimate;

    return {
      subtotal,
      spreadEstimate: Math.abs(spreadEstimate),
      total,
    };
  }

  /**
   * Format quote for display
   */
  formatQuote(quote: Quote, language: 'en' | 'tr' = 'en'): {
    typeLabel: string;
    metalLabel: string;
    amountLabel: string;
    priceLabel: string;
    totalLabel: string;
    expiresLabel: string;
  } {
    const metalInfo = METAL_INFO[quote.metal as keyof typeof METAL_INFO];
    
    return {
      typeLabel: language === 'tr' 
        ? (quote.type === 'buy' ? 'Alım' : 'Satım')
        : (quote.type === 'buy' ? 'Buy' : 'Sell'),
      metalLabel: metalInfo?.name || quote.metal,
      amountLabel: `${quote.grams.toFixed(2)}g`,
      priceLabel: `$${quote.pricePerGram.toFixed(2)}/g`,
      totalLabel: `$${quote.totalUSD.toFixed(2)}`,
      expiresLabel: language === 'tr'
        ? `${quote.timeRemaining} saniye`
        : `${quote.timeRemaining} seconds`,
    };
  }
}

export const tradeService = new TradeService();
export default tradeService;
