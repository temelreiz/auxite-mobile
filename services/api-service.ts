// services/api.ts
// Auxite Mobile - API Service (Backend Entegrasyonlu)
// ⚠️ SECURITY: 2FA zorunlu yapıldı, rate limiting eklendi

import { API_URL } from '@/constants/api';
const API_BASE_URL = `${API_URL}/api`;

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitCache: Record<string, RateLimitEntry> = {};

const RATE_LIMITS = {
  withdraw: { maxRequests: 3, windowMs: 300000 },    // 3 requests per 5 minutes
  trade: { maxRequests: 30, windowMs: 60000 },       // 30 requests per minute
  general: { maxRequests: 60, windowMs: 60000 },     // 60 requests per minute
};

function checkRateLimit(action: keyof typeof RATE_LIMITS): { allowed: boolean; retryAfter?: number } {
  const limit = RATE_LIMITS[action];
  const now = Date.now();
  const key = action;

  if (!rateLimitCache[key] || now - rateLimitCache[key].windowStart >= limit.windowMs) {
    rateLimitCache[key] = { count: 1, windowStart: now };
    return { allowed: true };
  }

  if (rateLimitCache[key].count >= limit.maxRequests) {
    const retryAfter = Math.ceil((limit.windowMs - (now - rateLimitCache[key].windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  rateLimitCache[key].count++;
  return { allowed: true };
}

// Types
export interface UserBalance {
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
}

export interface TradePreview {
  type: 'buy' | 'sell' | 'swap';
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  price: number;
  fee: number;
  spread: string;
  blockchainEnabled: boolean;
  blockchain?: {
    contractPrice: number;
    estimatedETHCost?: number;
    estimatedETHPayout?: number;
    reserveAllowed?: boolean;
    maxMintable?: number;
  };
}

export interface TradeResult {
  success: boolean;
  transaction?: {
    id: string;
    type: 'buy' | 'sell' | 'swap';
    fromToken: string;
    toToken: string;
    fromAmount: number;
    toAmount: number;
    fee: number;
    price: number;
    usedBonus: number;
    status: string;
    txHash?: string;
    blockchain?: any;
  };
  balances?: Partial<UserBalance>;
  error?: string;
}

export interface LimitOrder {
  id: string;
  address: string;
  type: 'buy' | 'sell';
  metal: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  grams: number;
  limitPrice: number;
  paymentMethod: 'AUXM' | 'USDT' | 'USD';
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';
  filledGrams: number;
  createdAt: string;
  expiresAt: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'swap' | 'deposit' | 'withdraw';
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  price: number;
  status: string;
  timestamp: number;
  txHash?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BALANCE API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getBalance(address: string): Promise<UserBalance | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/balance/add?address=${address}`);
    const data = await response.json();
    
    if (data.success && data.balance) {
      return {
        auxm: parseFloat(data.balance.auxm || '0'),
        bonusAuxm: parseFloat(data.balance.bonusAuxm || data.balance.bonusauxm || '0'),
        totalAuxm: parseFloat(data.balance.totalAuxm || '0'),
        auxg: parseFloat(data.balance.auxg || '0'),
        auxs: parseFloat(data.balance.auxs || '0'),
        auxpt: parseFloat(data.balance.auxpt || '0'),
        auxpd: parseFloat(data.balance.auxpd || '0'),
        eth: parseFloat(data.balance.eth || '0'),
        btc: parseFloat(data.balance.btc || '0'),
        xrp: parseFloat(data.balance.xrp || '0'),
        sol: parseFloat(data.balance.sol || '0'),
        usdt: parseFloat(data.balance.usdt || '0'),
        usd: parseFloat(data.balance.usd || '0'),
      };
    }
    return null;
  } catch (error) {
    console.error('getBalance error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTradePreview(params: {
  type: 'buy' | 'sell' | 'swap';
  fromToken: string;
  toToken: string;
  amount: number;
}): Promise<TradePreview | null> {
  try {
    const query = new URLSearchParams({
      type: params.type,
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/trade?${query}`);
    const data = await response.json();
    
    if (data.success && data.preview) {
      return data.preview;
    }
    return null;
  } catch (error) {
    console.error('getTradePreview error:', error);
    return null;
  }
}

export async function executeTrade(params: {
  address: string;
  type: 'buy' | 'sell' | 'swap';
  fromToken: string;
  toToken: string;
  fromAmount: number;
  slippage?: number;
  executeOnChain?: boolean;
  quoteId?: string;
}): Promise<TradeResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: params.address,
        type: params.type,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        slippage: params.slippage || 1,
        executeOnChain: params.executeOnChain ?? false, // Off-chain by default for mobile
        quoteId: params.quoteId,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        transaction: data.transaction,
        balances: data.balances,
      };
    }
    
    return {
      success: false,
      error: data.error || 'Trade failed',
    };
  } catch (error: any) {
    console.error('executeTrade error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIMIT ORDERS API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLimitOrders(
  address: string, 
  status?: 'pending' | 'filled' | 'cancelled' | 'expired'
): Promise<LimitOrder[]> {
  try {
    let url = `${API_BASE_URL}/orders/limit?address=${address}`;
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.orders) {
      return data.orders;
    }
    return [];
  } catch (error) {
    console.error('getLimitOrders error:', error);
    return [];
  }
}

export async function createLimitOrder(params: {
  address: string;
  type: 'buy' | 'sell';
  metal: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  grams: number;
  limitPrice: number;
  paymentMethod?: 'AUXM' | 'USDT' | 'USD';
  expiresInDays?: number;
}): Promise<{ success: boolean; order?: LimitOrder; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: params.address,
        type: params.type,
        metal: params.metal,
        grams: params.grams,
        limitPrice: params.limitPrice,
        paymentMethod: params.paymentMethod || 'AUXM',
        expiresInDays: params.expiresInDays || 7,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, order: data.order };
    }
    
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('createLimitOrder error:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelLimitOrder(
  orderId: string, 
  address: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/limit`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, address }),
    });
    
    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error: any) {
    console.error('cancelLimitOrder error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTransactions(
  address: string,
  limit: number = 50
): Promise<Transaction[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/transactions?address=${address}&limit=${limit}`
    );
    const data = await response.json();
    
    if (data.success && data.transactions) {
      return data.transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        fromToken: tx.fromToken,
        toToken: tx.toToken,
        fromAmount: parseFloat(tx.fromAmount),
        toAmount: parseFloat(tx.toAmount),
        fee: parseFloat(tx.fee || '0'),
        price: parseFloat(tx.price || '0'),
        status: tx.status,
        timestamp: tx.timestamp,
        txHash: tx.txHash,
      }));
    }
    return [];
  } catch (error) {
    console.error('getTransactions error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICES API
// ═══════════════════════════════════════════════════════════════════════════════

export interface MetalPrice {
  symbol: string;
  price: number;
  priceOz: number;
  askPrice: number;
  bidPrice: number;
  change24h: number;
}

export interface CryptoPrice {
  symbol: string;
  usd: number;
  usd_24h_change: number;
}

export async function getMetalPrices(): Promise<MetalPrice[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/metals`);
    const data = await response.json();
    
    if (data.ok && data.data) {
      return data.data.map((m: any) => ({
        symbol: m.symbol,
        price: m.priceOz / 31.1035, // per gram
        priceOz: m.priceOz,
        askPrice: m.askPrice || m.priceOz / 31.1035,
        bidPrice: m.bidPrice || m.priceOz / 31.1035,
        change24h: data.changes?.[m.symbol] || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('getMetalPrices error:', error);
    return [];
  }
}

export async function getCryptoPrices(): Promise<Record<string, CryptoPrice>> {
  try {
    const response = await fetch(`${API_BASE_URL}/crypto`);
    const data = await response.json();
    
    const result: Record<string, CryptoPrice> = {};
    
    const mapping: Record<string, string> = {
      bitcoin: 'BTC',
      ethereum: 'ETH',
      tether: 'USDT',
      ripple: 'XRP',
      solana: 'SOL',
    };
    
    for (const [key, symbol] of Object.entries(mapping)) {
      if (data[key]) {
        result[symbol] = {
          symbol,
          usd: data[key].usd || 1,
          usd_24h_change: data[key].usd_24h_change || 0,
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('getCryptoPrices error:', error);
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTE API (Locked price for 30 seconds)
// ═══════════════════════════════════════════════════════════════════════════════

export interface Quote {
  quoteId: string;
  type: 'buy' | 'sell';
  metal: string;
  grams: number;
  pricePerGram: number;
  totalPrice: number;
  expiresAt: string;
  expiresIn: number;
}

export async function getQuote(params: {
  type: 'buy' | 'sell';
  metal: string;
  grams: number;
}): Promise<Quote | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    
    if (data.success && data.quote) {
      return data.quote;
    }
    return null;
  } catch (error) {
    console.error('getQuote error:', error);
    return null;
  }
}

// Execute trade with locked quote price
export async function executeTradeWithQuote(params: {
  address: string;
  quoteId: string;
  type: 'buy' | 'sell';
  fromToken: string;
  toToken: string;
  fromAmount: number;
}): Promise<TradeResult> {
  return executeTrade({
    ...params,
    executeOnChain: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING BUY (DCA) API
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecurringBuyPlan {
  id: string;
  walletAddress: string;
  token: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  amount: number; // USD
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  paymentSource: 'usd_balance' | 'usdt_balance' | 'eth_balance' | 'btc_balance' | 'xrp_balance' | 'sol_balance';
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  autoStake?: boolean;
  stakeDuration?: 3 | 6 | 12;
  minPrice?: number;
  maxPrice?: number;
  createdAt: string;
  stats: {
    totalPurchased: number;
    totalSpent: number;
    averagePrice: number;
    executionCount: number;
    nextExecutionAt?: string;
  };
}

export async function getRecurringBuyPlans(address: string): Promise<RecurringBuyPlan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-buy`, {
      headers: { 'x-wallet-address': address },
    });
    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('getRecurringBuyPlans error:', error);
    return [];
  }
}

export async function createRecurringBuyPlan(params: {
  address: string;
  token: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  amount: number; // USD
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  paymentSource: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  autoStake?: boolean;
  stakeDuration?: 3 | 6 | 12;
  minPrice?: number;
  maxPrice?: number;
}): Promise<{ success: boolean; plan?: RecurringBuyPlan; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-buy`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': params.address,
      },
      body: JSON.stringify({
        token: params.token,
        amount: params.amount,
        frequency: params.frequency,
        paymentSource: params.paymentSource,
        dayOfWeek: params.dayOfWeek,
        dayOfMonth: params.dayOfMonth,
        hour: params.hour || 9,
        autoStake: params.autoStake,
        stakeDuration: params.stakeDuration,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
      }),
    });
    
    const data = await response.json();
    if (data.success) {
      return { success: true, plan: data.plan };
    }
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('createRecurringBuyPlan error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateRecurringBuyPlan(
  address: string,
  planId: string,
  action: 'pause' | 'resume' | 'cancel' | 'update',
  updates?: { amount?: number; minPrice?: number; maxPrice?: number }
): Promise<{ success: boolean; plan?: RecurringBuyPlan; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-buy`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ planId, action, ...updates }),
    });
    
    const data = await response.json();
    if (data.success) {
      return { success: true, plan: data.plan };
    }
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('updateRecurringBuyPlan error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRecurringBuyPlan(
  address: string,
  planId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-buy?id=${planId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error: any) {
    console.error('deleteRecurringBuyPlan error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL API
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReferralStats {
  code: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commissionRate: number;
}

export interface ReferralUsage {
  id: string;
  code: string;
  referrerAddress: string;
  referredAddress: string;
  usedAt: number;
  status: 'pending' | 'qualified' | 'rewarded';
  firstTradeAt?: number;
  firstTradeAmount?: number;
  rewardAmount?: number;
}

export interface ReferralInfo {
  stats: ReferralStats;
  referrals: ReferralUsage[];
  referredBy: string | null;
  bonusAmount: number;
  minTradeAmount: number;
  tiers: {
    bronze: { minReferrals: number; rate: number };
    silver: { minReferrals: number; rate: number };
    gold: { minReferrals: number; rate: number };
    platinum: { minReferrals: number; rate: number };
  };
}

export async function getReferralInfo(address: string): Promise<ReferralInfo | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/referral?address=${address}`);
    const data = await response.json();
    
    if (data.stats) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('getReferralInfo error:', error);
    return null;
  }
}

export async function validateReferralCode(code: string): Promise<{ valid: boolean; ownerAddress?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/referral?action=validate&code=${code}`);
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('validateReferralCode error:', error);
    return { valid: false, error: error.message };
  }
}

export async function applyReferralCode(
  address: string,
  referralCode: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/referral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, referralCode }),
    });
    
    const data = await response.json();
    if (data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('applyReferralCode error:', error);
    return { success: false, error: error.message };
  }
}

export async function withdrawReferralEarnings(address: string): Promise<{ 
  success: boolean; 
  paidAmount?: number; 
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/referral`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, action: 'withdraw' }),
    });
    
    const data = await response.json();
    if (data.success) {
      return { success: true, paidAmount: data.paidAmount };
    }
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('withdrawReferralEarnings error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEASE RATES API (Staking APY source)
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeaseRates {
  gold: { '3m': number; '6m': number; '12m': number };
  silver: { '3m': number; '6m': number; '12m': number };
  platinum: { '3m': number; '6m': number; '12m': number };
  palladium: { '3m': number; '6m': number; '12m': number };
  lastUpdated: string;
  sofr: number;
  gofo: number;
  source: string;
}

export async function getLeaseRates(): Promise<LeaseRates | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/lease-rates`);
    const data = await response.json();
    
    if (data.success && data.rates) {
      return data.rates;
    }
    return null;
  } catch (error) {
    console.error('getLeaseRates error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - 2FA API
// ═══════════════════════════════════════════════════════════════════════════════

export interface TwoFAStatus {
  enabled: boolean;
  setupRequired: boolean;
  backupCodesRemaining: number;
  enabledAt?: string;
}

export interface TwoFASetupResponse {
  success: boolean;
  qrCodeDataUrl?: string;
  secret?: string;
  backupCodes?: string[];
  message?: string;
  error?: string;
}

export async function get2FAStatus(address: string): Promise<TwoFAStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/2fa/status`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('get2FAStatus error:', error);
    return { enabled: false, setupRequired: true, backupCodesRemaining: 0 };
  }
}

export async function setup2FA(address: string, email?: string): Promise<TwoFASetupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/2fa/setup`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error: any) {
    console.error('setup2FA error:', error);
    return { success: false, error: error.message };
  }
}

export async function enable2FA(address: string, code: string): Promise<{ success: boolean; backupCodesRemaining?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/2fa/enable`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ code }),
    });
    return await response.json();
  } catch (error: any) {
    console.error('enable2FA error:', error);
    return { success: false, error: error.message };
  }
}

export async function verify2FA(address: string, code: string, isBackupCode?: boolean): Promise<{ 
  success: boolean; 
  verified?: boolean; 
  verificationToken?: string;
  backupCodesRemaining?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/2fa/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ code, isBackupCode }),
    });
    return await response.json();
  } catch (error: any) {
    console.error('verify2FA error:', error);
    return { success: false, error: error.message };
  }
}

export async function disable2FA(address: string, code: string, isBackupCode?: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/2fa/disable`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ code, isBackupCode }),
    });
    return await response.json();
  } catch (error: any) {
    console.error('disable2FA error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - BIOMETRIC/PASSKEY API
// ═══════════════════════════════════════════════════════════════════════════════

export interface Passkey {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  deviceType: string;
  backedUp: boolean;
}

export interface BiometricStatus {
  enabled: boolean;
  passkeys: Passkey[];
  count: number;
}

export async function getBiometricStatus(address: string): Promise<BiometricStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/biometric`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getBiometricStatus error:', error);
    return { enabled: false, passkeys: [], count: 0 };
  }
}

export async function registerPasskey(address: string, userName?: string): Promise<{ success: boolean; options?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/biometric`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ action: 'register-options', userName }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyPasskeyRegistration(address: string, response: any, name?: string): Promise<{ success: boolean; passkey?: Passkey; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/security/biometric`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ action: 'register-verify', response, name }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePasskey(address: string, passkeyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/biometric?id=${passkeyId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - SESSIONS API
// ═══════════════════════════════════════════════════════════════════════════════

export interface Session {
  id: string;
  walletAddress: string;
  deviceInfo: { browser: string; os: string; device: string };
  ip: string;
  location?: string;
  createdAt: number;
  lastActiveAt: number;
  isCurrent: boolean;
}

export async function getSessions(address: string): Promise<{ sessions: Session[]; count: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/sessions?address=${address}`);
    return await response.json();
  } catch (error) {
    console.error('getSessions error:', error);
    return { sessions: [], count: 0 };
  }
}

export async function createSession(address: string): Promise<{ success: boolean; session?: Session; isNew?: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false };
  }
}

export async function terminateSession(address: string, sessionId?: string, terminateAll?: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, sessionId, terminateAll }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - DEVICES API
// ═══════════════════════════════════════════════════════════════════════════════

export interface Device {
  id: string;
  name: string;
  fingerprint: string;
  ip: string;
  location?: { city?: string; country?: string; countryCode?: string };
  locationFormatted?: string;
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
  isCurrent?: boolean;
}

export async function getDevices(address: string): Promise<{ devices: Device[]; totalDevices: number; trustedDevices: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/devices`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getDevices error:', error);
    return { devices: [], totalDevices: 0, trustedDevices: 0 };
  }
}

export async function registerDevice(address: string): Promise<{ success: boolean; device?: Device; isNew?: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/devices`, {
      method: 'POST',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false };
  }
}

export async function trustDevice(address: string, deviceId: string, trusted: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/devices/trust`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ deviceId, trusted }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDevice(address: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/devices?deviceId=${deviceId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - LIMITS API
// ═══════════════════════════════════════════════════════════════════════════════

export interface TransactionLimits {
  enabled: boolean;
  daily: { amount: number; used: number; enabled: boolean };
  weekly: { amount: number; used: number; enabled: boolean };
  monthly: { amount: number; used: number; enabled: boolean };
  perTransaction: { amount: number; enabled: boolean };
  whitelistedAddresses: string[];
}

export async function getLimits(address: string): Promise<{ limits: TransactionLimits; usage: any; tier: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/limits`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getLimits error:', error);
    return { limits: {} as TransactionLimits, usage: {}, tier: 'basic' };
  }
}

export async function updateLimits(address: string, updates: Partial<{ daily: number; weekly: number; monthly: number; perTransaction: number }>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/limits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ action: 'update_limits', ...updates }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - WHITELIST API
// ═══════════════════════════════════════════════════════════════════════════════

export interface WhitelistAddress {
  id: string;
  address: string;
  label: string;
  network: 'ETH' | 'BTC' | 'XRP' | 'SOL';
  addedAt: number;
  verifiedAt?: number;
  isVerified: boolean;
}

export async function getWhitelist(address: string): Promise<{ addresses: WhitelistAddress[]; count: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/whitelist?address=${address}`);
    return await response.json();
  } catch (error) {
    console.error('getWhitelist error:', error);
    return { addresses: [], count: 0 };
  }
}

export async function addToWhitelist(walletAddress: string, withdrawAddress: string, network: string, label?: string): Promise<{ success: boolean; address?: WhitelistAddress; verificationTime?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/whitelist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, withdrawAddress, network, label }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeFromWhitelist(walletAddress: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/whitelist`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, addressId }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY - LOGS API
// ═══════════════════════════════════════════════════════════════════════════════

export interface SecurityLog {
  event: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  details: Record<string, unknown>;
  timestamp: string;
  relativeTime: string;
}

export async function getSecurityLogs(address: string, limit?: number, severity?: string): Promise<{ logs: SecurityLog[]; total: number; hasMore: boolean }> {
  try {
    let url = `${API_BASE_URL}/security/logs?limit=${limit || 50}`;
    if (severity) url += `&severity=${severity}`;
    
    const response = await fetch(url, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getSecurityLogs error:', error);
    return { logs: [], total: 0, hasMore: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER API
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserInfo {
  userId: string;
  walletAddress: string;
  email?: string;
  referralCode?: string;
  createdAt: string;
  status: string;
}

export interface DepositAddresses {
  ETH: string;
  BASE: string;
  BTC: string;
  XRP: string;
  SOL: string;
}

export async function registerUser(walletAddress: string, email?: string, referralCode?: string): Promise<{ 
  success: boolean; 
  isNew: boolean;
  userId?: string;
  user?: UserInfo;
  depositAddresses?: DepositAddresses;
  welcomeBonus?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, email, referralCode }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, isNew: false, error: error.message };
  }
}

export async function getUserInfo(address: string): Promise<{ 
  exists: boolean; 
  userId?: string;
  user?: UserInfo;
  balances?: Record<string, number>;
  depositAddresses?: DepositAddresses;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register?address=${address}`);
    return await response.json();
  } catch (error) {
    console.error('getUserInfo error:', error);
    return { exists: false };
  }
}

export async function convertUsdUsdt(address: string, direction: 'usd-to-usdt' | 'usdt-to-usd', amount: number): Promise<{ 
  success: boolean; 
  data?: { spent: number; received: number; newBalances: { usd: number; usdt: number } };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/convert-usd-usdt`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ direction, amount }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPOSIT API
// ═══════════════════════════════════════════════════════════════════════════════

export interface DepositAddress {
  address: string;
  network: string;
  memo?: string;
}

export async function getDepositAddresses(coin?: string): Promise<{ success: boolean; addresses?: Record<string, DepositAddress>; address?: string; network?: string; memo?: string }> {
  try {
    let url = `${API_BASE_URL}/deposit`;
    if (coin) url += `?coin=${coin}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('getDepositAddresses error:', error);
    return { success: false };
  }
}

export async function processDeposit(address: string, coin: string, amount: number, convertToAuxm?: boolean, txHash?: string): Promise<{
  success: boolean;
  deposit?: {
    id: string;
    coin: string;
    amount: number;
    amountUsd: number;
    converted: boolean;
    auxmReceived?: number;
    bonusReceived?: number;
    bonusPercent?: number;
  };
  balances?: Record<string, number>;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, coin, amount, convertToAuxm, txHash }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepositHistory(address: string, limit?: number): Promise<{ deposits: any[]; count: number; totalAuxmDeposited: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/deposits/history?address=${address}&limit=${limit || 20}`);
    return await response.json();
  } catch (error) {
    console.error('getDepositHistory error:', error);
    return { deposits: [], count: 0, totalAuxmDeposited: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAW API
// ═══════════════════════════════════════════════════════════════════════════════

export interface WithdrawResult {
  success: boolean;
  withdrawal?: {
    id: string;
    coin: string;
    auxmAmount: number;
    cryptoAmount: number;
    networkFee: number;
    withdrawAddress: string;
    status: string;
    txHash?: string;
    explorerUrl?: string;
  };
  balances?: { auxm: number; bonusAuxm: number };
  requires2FA?: boolean;
  error?: string;
}

export async function withdraw(
  address: string,
  coin: string,
  auxmAmount: number,
  withdrawAddress: string,
  memo?: string,
  twoFactorCode?: string  // ⚠️ SECURITY: Artık zorunlu - 2FA kodu olmadan çekim yapılamaz
): Promise<WithdrawResult> {
  // 🔒 SECURITY: Client-side rate limiting
  const rateLimitCheck = checkRateLimit('withdraw');
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Çok fazla çekim denemesi. Lütfen ${rateLimitCheck.retryAfter} saniye bekleyin.`
    };
  }

  // 🔒 SECURITY: 2FA zorunlu kontrolü (güvenlik için client-side de kontrol)
  if (!twoFactorCode || twoFactorCode.length < 6) {
    return {
      success: false,
      error: 'Çekim işlemleri için 2FA kodu zorunludur.',
      requires2FA: true
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': address.toLowerCase(),
      },
      body: JSON.stringify({
        address,
        coin,
        auxmAmount,
        withdrawAddress,
        memo,
        twoFactorCode
      }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KYC API
// ═══════════════════════════════════════════════════════════════════════════════

export type KYCLevel = 'none' | 'basic' | 'verified' | 'enhanced';
export type KYCStatus = 'none' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface KYCData {
  level: KYCLevel;
  status: KYCStatus;
  limits: { daily: number; monthly: number; singleTransaction: number };
  personalInfo?: { firstName: string; lastName: string; email: string; phone: string };
  address?: { city: string; country: string };
  documents?: { type: string; verifiedAt?: string };
  completion: { basic: number; verified: number; enhanced: number };
}

export async function getKYCStatus(address: string): Promise<{ kyc: KYCData; limits: any; completion: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/kyc`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getKYCStatus error:', error);
    return { kyc: {} as KYCData, limits: {}, completion: {} };
  }
}

export async function submitKYCStep(address: string, step: string, data: Record<string, any>): Promise<{ success: boolean; level?: KYCLevel; status?: KYCStatus; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/kyc`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ step, data }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICE ALERTS API
// ═══════════════════════════════════════════════════════════════════════════════

export interface PriceAlert {
  id: string;
  token: string;
  targetPrice: number;
  direction: 'above' | 'below';
  status: 'active' | 'triggered' | 'cancelled' | 'expired';
  repeat: boolean;
  createdAt: string;
  expiresAt?: string;
  triggeredAt?: string;
}

export async function getPriceAlerts(address: string, status?: string, token?: string): Promise<{ alerts: PriceAlert[]; total: number; active: number }> {
  try {
    let url = `${API_BASE_URL}/alerts`;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (token) params.set('token', token);
    if (params.toString()) url += `?${params}`;
    
    const response = await fetch(url, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getPriceAlerts error:', error);
    return { alerts: [], total: 0, active: 0 };
  }
}

export async function createPriceAlert(
  address: string, 
  token: string, 
  targetPrice: number, 
  direction: 'above' | 'below',
  expiresInDays?: number,
  repeat?: boolean
): Promise<{ success: boolean; alert?: PriceAlert; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ token, targetPrice, direction, expiresInDays, repeat }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePriceAlert(address: string, alertId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts?id=${alertId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePriceAlert(address: string, alertId: string, action: 'cancel' | 'reactivate' | 'update', updates?: { targetPrice?: number; repeat?: boolean }): Promise<{ success: boolean; alert?: PriceAlert; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ alertId, action, ...updates }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS API
// ═══════════════════════════════════════════════════════════════════════════════

export interface NotificationPreferences {
  transactions: boolean;
  priceAlerts: boolean;
  security: boolean;
  marketing: boolean;
  enabled: boolean;
}

export async function getNotificationStatus(address: string): Promise<{ isSubscribed: boolean; subscriptionCount: number; preferences: NotificationPreferences }> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getNotificationStatus error:', error);
    return { 
      isSubscribed: false, 
      subscriptionCount: 0, 
      preferences: { transactions: true, priceAlerts: true, security: true, marketing: false, enabled: true } 
    };
  }
}

export async function subscribeNotifications(address: string, endpoint: string, keys: { p256dh: string; auth: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ endpoint, keys }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unsubscribeNotifications(address: string, endpoint?: string): Promise<{ success: boolean; error?: string }> {
  try {
    let url = `${API_BASE_URL}/notifications/subscribe`;
    if (endpoint) url += `?endpoint=${encodeURIComponent(endpoint)}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNotificationPreferences(address: string, preferences: Partial<NotificationPreferences>): Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify(preferences),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARTS & PRICE HISTORY API
// ═══════════════════════════════════════════════════════════════════════════════

export interface PriceHistoryData {
  date: string;
  timestamp: number;
  price: number;
  change: number;
  changePercent: number;
}

export interface PriceHistoryMetrics {
  volatility: number;
  avgReturn: number;
  priceRange: number;
  minPrice: number;
  maxPrice: number;
}

export async function getPriceHistory(metal: string, days?: number): Promise<{ 
  metal: string; 
  days: number; 
  count: number; 
  data: PriceHistoryData[]; 
  metrics?: PriceHistoryMetrics 
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/prices/history?metal=${metal}&days=${days || 7}`);
    return await response.json();
  } catch (error) {
    console.error('getPriceHistory error:', error);
    return { metal, days: days || 7, count: 0, data: [] };
  }
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getChartData(symbol: string, period?: string): Promise<{ 
  symbol: string; 
  period: string; 
  data: CandleData[]; 
  currentPrice: number;
  basePrice: number;
  spread: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/chart-data?symbol=${symbol}&period=${period || '1h'}`);
    return await response.json();
  } catch (error) {
    console.error('getChartData error:', error);
    return { symbol, period: period || '1h', data: [], currentPrice: 0, basePrice: 0, spread: 0 };
  }
}

export async function getCryptoChartData(symbol: string, interval?: string, limit?: number): Promise<{ 
  symbol: string; 
  interval: string; 
  candles: CandleData[];
  source: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/crypto/chart?symbol=${symbol}&interval=${interval || '1h'}&limit=${limit || 100}`);
    return await response.json();
  } catch (error) {
    console.error('getCryptoChartData error:', error);
    return { symbol, interval: interval || '1h', candles: [], source: 'error' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEWS & TRENDS API
// ═══════════════════════════════════════════════════════════════════════════════

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  icon: string;
  color: string;
}

export async function getNews(lang?: 'tr' | 'en'): Promise<{ success: boolean; news: NewsItem[]; lastUpdated?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/news?lang=${lang || 'tr'}`);
    return await response.json();
  } catch (error) {
    console.error('getNews error:', error);
    return { success: false, news: [] };
  }
}

export interface TrendData {
  symbol: string;
  buyVolume: number;
  sellVolume: number;
  trend: 'buy' | 'sell' | 'neutral';
}

export async function getTrends(): Promise<{ ok: boolean; trends: TrendData[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/trends`);
    return await response.json();
  } catch (error) {
    console.error('getTrends error:', error);
    return { ok: false, trends: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERY API (Physical Metal Delivery)
// ═══════════════════════════════════════════════════════════════════════════════

export interface DeliveryAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  isDefault: boolean;
}

export interface DeliveryRequest {
  id: string;
  token: string;
  amount: number;
  address: DeliveryAddress;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{ status: string; timestamp: string; note?: string }>;
}

export async function getDeliveryRequests(address: string): Promise<{ requests: DeliveryRequest[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery?type=requests`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getDeliveryRequests error:', error);
    return { requests: [] };
  }
}

export async function getDeliveryAddresses(address: string): Promise<{ addresses: DeliveryAddress[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery?type=addresses`, {
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error) {
    console.error('getDeliveryAddresses error:', error);
    return { addresses: [] };
  }
}

export async function getDeliveryLimits(): Promise<{ minAmounts: Record<string, number>; fees: Record<string, number> }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery?type=limits`);
    return await response.json();
  } catch (error) {
    console.error('getDeliveryLimits error:', error);
    return { 
      minAmounts: { AUXG: 80, AUXS: 5000, AUXPT: 200, AUXPD: 200 },
      fees: { AUXG: 50, AUXS: 75, AUXPT: 50, AUXPD: 50 }
    };
  }
}

export async function addDeliveryAddress(address: string, data: Omit<DeliveryAddress, 'id'>): Promise<{ success: boolean; address?: DeliveryAddress; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ action: 'add_address', ...data }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function requestDelivery(walletAddress: string, token: string, amount: number, addressId: string): Promise<{ success: boolean; request?: DeliveryRequest; fee?: number; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress,
      },
      body: JSON.stringify({ token, amount, addressId }),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelDeliveryRequest(address: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery?type=request&id=${requestId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDeliveryAddress(address: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delivery?type=address&id=${addressId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS EXPORT API
// ═══════════════════════════════════════════════════════════════════════════════

export async function exportTransactions(
  address: string, 
  format: 'csv' | 'json',
  options?: { startDate?: string; endDate?: string; type?: string; lang?: 'tr' | 'en' }
): Promise<string | { transactions: any[]; count: number }> {
  try {
    let url = `${API_BASE_URL}/transactions/export?address=${address}&format=${format}`;
    if (options?.startDate) url += `&startDate=${options.startDate}`;
    if (options?.endDate) url += `&endDate=${options.endDate}`;
    if (options?.type) url += `&type=${options.type}`;
    if (options?.lang) url += `&lang=${options.lang}`;
    
    const response = await fetch(url);
    
    if (format === 'csv') {
      return await response.text();
    }
    return await response.json();
  } catch (error) {
    console.error('exportTransactions error:', error);
    return format === 'csv' ? '' : { transactions: [], count: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECURRING STAKE API (Düzenli Biriktir)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecurringStakePlan {
  id: string;
  walletAddress: string;
  token: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  amount: number; // gram
  frequency: 'weekly' | 'biweekly' | 'monthly';
  stakeDuration: 3 | 6 | 12; // months
  status: 'active' | 'paused' | 'cancelled';
  paymentSource: 'metal_balance' | 'usd_balance' | 'usdt_balance' | 'eth_balance' | 'btc_balance' | 'xrp_balance' | 'sol_balance';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23
  createdAt: string;
  stats: {
    totalStaked: number;
    totalSpent: number;
    executionCount: number;
    nextExecutionAt?: string;
    lastExecutionAt?: string;
  };
}

export async function getRecurringStakePlans(address: string): Promise<RecurringStakePlan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-stake`, {
      headers: { 'x-wallet-address': address },
    });
    const data = await response.json();
    
    if (data.plans) {
      return data.plans;
    }
    return [];
  } catch (error) {
    console.error('getRecurringStakePlans error:', error);
    return [];
  }
}

export async function createRecurringStakePlan(params: {
  address: string;
  token: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  stakeDuration: 3 | 6 | 12;
  paymentSource: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
}): Promise<{ success: boolean; plan?: RecurringStakePlan; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-stake`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': params.address,
      },
      body: JSON.stringify({
        token: params.token,
        amount: params.amount,
        frequency: params.frequency,
        stakeDuration: params.stakeDuration,
        paymentSource: params.paymentSource,
        dayOfWeek: params.dayOfWeek,
        dayOfMonth: params.dayOfMonth,
        hour: params.hour || 9,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, plan: data.plan };
    }
    
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('createRecurringStakePlan error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateRecurringStakePlan(
  address: string,
  planId: string,
  action: 'pause' | 'resume' | 'cancel'
): Promise<{ success: boolean; plan?: RecurringStakePlan; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-stake`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({ planId, action }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, plan: data.plan };
    }
    
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('updateRecurringStakePlan error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRecurringStakePlan(
  address: string,
  planId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/recurring-stake?id=${planId}`, {
      method: 'DELETE',
      headers: { 'x-wallet-address': address },
    });
    
    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error: any) {
    console.error('deleteRecurringStakePlan error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAKING API (Tek seferlik stake)
// ═══════════════════════════════════════════════════════════════════════════════

export interface StakePosition {
  id: string;
  token: string;
  amount: number;
  duration: number; // months
  apy: number;
  startDate: string;
  endDate: string;
  earnedRewards: number;
  status: 'active' | 'completed' | 'cancelled';
}

export async function getStakePositions(address: string): Promise<StakePosition[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking?action=positions`, {
      headers: { 'x-wallet-address': address },
    });
    const data = await response.json();
    
    if (data.positions) {
      return data.positions;
    }
    return [];
  } catch (error) {
    console.error('getStakePositions error:', error);
    return [];
  }
}

export async function createStake(params: {
  address: string;
  token: string;
  amount: number;
  duration: number; // months: 3, 6, or 12
}): Promise<{ success: boolean; position?: StakePosition; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': params.address,
      },
      body: JSON.stringify({
        action: 'stake',
        token: params.token,
        amount: params.amount,
        duration: params.duration,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, position: data.position };
    }
    
    return { success: false, error: data.error };
  } catch (error: any) {
    console.error('createStake error:', error);
    return { success: false, error: error.message };
  }
}

export async function unstake(
  address: string,
  stakeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet-address': address,
      },
      body: JSON.stringify({
        action: 'unstake',
        stakeId,
      }),
    });
    
    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error: any) {
    console.error('unstake error:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER CLASS - Singleton API Service
// ═══════════════════════════════════════════════════════════════════════════════

class ApiService {
  private address: string | null = null;
  
  setAddress(address: string) {
    this.address = address?.toLowerCase();
  }
  
  getAddress() {
    return this.address;
  }
  
  clearAddress() {
    this.address = null;
  }
  
  // Convenience methods that use stored address
  async myBalance() {
    if (!this.address) throw new Error('No address set');
    return getBalance(this.address);
  }
  
  async myOrders(status?: 'pending' | 'filled' | 'cancelled' | 'expired') {
    if (!this.address) throw new Error('No address set');
    return getLimitOrders(this.address, status);
  }
  
  async myTransactions(limit?: number) {
    if (!this.address) throw new Error('No address set');
    return getTransactions(this.address, limit);
  }
  
  async myStakePositions() {
    if (!this.address) throw new Error('No address set');
    return getStakePositions(this.address);
  }
  
  async trade(params: Omit<Parameters<typeof executeTrade>[0], 'address'>) {
    if (!this.address) throw new Error('No address set');
    return executeTrade({ ...params, address: this.address });
  }
  
  async createOrder(params: Omit<Parameters<typeof createLimitOrder>[0], 'address'>) {
    if (!this.address) throw new Error('No address set');
    return createLimitOrder({ ...params, address: this.address });
  }
  
  async stake(params: Omit<Parameters<typeof createStake>[0], 'address'>) {
    if (!this.address) throw new Error('No address set');
    return createStake({ ...params, address: this.address });
  }
}

export const api = new ApiService();
export default api;
