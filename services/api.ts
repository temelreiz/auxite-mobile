// services/api.ts
// Ana API servis dosyası - tüm backend çağrıları

import { API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  WALLET_MODE: 'auxite_wallet_mode',
  WALLET_ADDRESS: 'auxite_wallet_address',
  USER_ID: 'auxite_user_id',
  HAS_WALLET: 'auxite_has_wallet',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UserBalance {
  auxm: number;
  bonusAuxm: number;
  totalAuxm: number;
  eth: number;
  btc: number;
  xrp: number;
  sol: number;
  usdt: number;
  usd: number;
  auxg: number;
  auxs: number;
  auxpt: number;
  auxpd: number;
}

export interface TradeResult {
  success: boolean;
  error?: string;
  transaction?: {
    id: string;
    type: string;
    fromToken: string;
    toToken: string;
    fromAmount: number;
    toAmount: number;
    fee: number;
    price: number;
    txHash?: string;
    timestamp: number;
  };
}

export interface LimitOrder {
  id: string;
  type: 'buy' | 'sell';
  metal: string;
  grams: number;
  limitPrice: number;
  currentPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  filledAt?: number;
  expiresAt?: number;
}

export interface Transaction {
  id: string;
  type: string;
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  amount?: string;
  fee?: string;
  status: string;
  timestamp: number;
  txHash?: string;
}

export interface StakePosition {
  id: string;
  metal: string;
  amount: number;
  duration: number;
  apy: number;
  startDate: number;
  endDate: number;
  expectedReward: number;
  status: 'active' | 'completed' | 'withdrawn';
  withdrawnAt?: number;
  actualReward?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BALANCE
// ═══════════════════════════════════════════════════════════════════════════

export async function getBalance(address: string): Promise<UserBalance> {
  const res = await fetch(`${API_URL}/api/user/balance?address=${address}`);
  if (!res.ok) {
    throw new Error('Failed to fetch balance');
  }
  const data = await res.json();
  return data.balances || data;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADING
// ═══════════════════════════════════════════════════════════════════════════

export interface ExecuteTradeParams {
  address: string;
  type: 'buy' | 'sell';
  fromToken: string;
  toToken: string;
  fromAmount: number;
  executeOnChain?: boolean;
  email?: string;
  holderName?: string;
  ethTransferTxHash?: string;
  optimistic?: boolean;
}

export async function executeTrade(params: ExecuteTradeParams): Promise<TradeResult> {
  const res = await fetch(`${API_URL}/api/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Trade failed' };
  }
  
  return {
    success: true,
    transaction: data.transaction,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LIMIT ORDERS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateLimitOrderParams {
  address: string;
  type: 'buy' | 'sell';
  metal: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
  grams: number;
  limitPrice: number;
  paymentMethod?: 'AUXM' | 'USDT' | 'USD';
}

export async function createLimitOrder(params: CreateLimitOrderParams): Promise<{ success: boolean; order?: LimitOrder; error?: string }> {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to create order' };
  }
  
  return { success: true, order: data.order };
}

export async function cancelLimitOrder(orderId: string, address: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, address }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to cancel order' };
  }
  
  return { success: true };
}

export async function getLimitOrders(address: string, status?: 'pending' | 'filled' | 'cancelled' | 'expired'): Promise<LimitOrder[]> {
  const url = status 
    ? `${API_URL}/api/orders?address=${address}&status=${status}`
    : `${API_URL}/api/orders?address=${address}`;
    
  const res = await fetch(url);
  
  if (!res.ok) {
    return [];
  }
  
  const data = await res.json();
  return data.orders || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function getTransactions(address: string, limit: number = 50): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/api/user/balance?address=${address}`);
  
  if (!res.ok) {
    return [];
  }
  
  const data = await res.json();
  
  // Transactions from balance endpoint or separate endpoint
  if (data.transactions) {
    return data.transactions.slice(0, limit);
  }
  
  // Try dedicated transactions endpoint
  try {
    const txRes = await fetch(`${API_URL}/api/transactions?address=${address}&limit=${limit}`);
    if (txRes.ok) {
      const txData = await txRes.json();
      return txData.transactions || [];
    }
  } catch (e) {
    console.error('Failed to fetch transactions:', e);
  }
  
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// STAKING
// ═══════════════════════════════════════════════════════════════════════════

export async function getStakePositions(address: string): Promise<StakePosition[]> {
  const res = await fetch(`${API_URL}/api/staking?address=${address}`);
  
  if (!res.ok) {
    return [];
  }
  
  const data = await res.json();
  return data.positions || [];
}

export interface CreateStakeParams {
  address: string;
  metal: string;
  amount: number;
  duration: number; // days: 30, 90, 180, 365
}

export async function createStake(params: CreateStakeParams): Promise<{ success: boolean; position?: StakePosition; error?: string }> {
  const res = await fetch(`${API_URL}/api/staking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      ...params,
    }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to create stake' };
  }
  
  return { success: true, position: data.position };
}

export async function withdrawStake(address: string, positionId: string): Promise<{ success: boolean; withdrawal?: any; error?: string }> {
  const res = await fetch(`${API_URL}/api/staking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'withdraw',
      address,
      positionId,
    }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to withdraw stake' };
  }
  
  return { success: true, withdrawal: data.withdrawal };
}

// ═══════════════════════════════════════════════════════════════════════════
// WITHDRAW
// ═══════════════════════════════════════════════════════════════════════════

export interface WithdrawParams {
  address: string;
  coin: string;
  amount: number;
  withdrawAddress: string;
  memo?: string;
  twoFactorCode?: string;
}

export async function withdraw(params: WithdrawParams): Promise<{ success: boolean; withdrawal?: any; error?: string }> {
  const res = await fetch(`${API_URL}/api/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Withdrawal failed' };
  }
  
  return { success: true, withdrawal: data.withdrawal };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTE
// ═══════════════════════════════════════════════════════════════════════════

export interface Quote {
  id: string;
  type: 'buy' | 'sell';
  metal: string;
  grams: number;
  pricePerGram: number;
  totalPrice: number;
  fee: number;
  validUntil: number;
}

export async function getQuote(params: {
  type: 'buy' | 'sell';
  metal: string;
  grams: number;
  address: string;
}): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  const res = await fetch(`${API_URL}/api/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to get quote' };
  }
  
  return { success: true, quote: data.quote };
}

export async function executeQuoteTrade(quoteId: string, address: string): Promise<TradeResult> {
  const res = await fetch(`${API_URL}/api/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      quoteId,
      executeOnChain: true,
    }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, error: data.error || 'Trade failed' };
  }
  
  return {
    success: true,
    transaction: data.transaction,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADE PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

export interface TradePreview {
  fromAmount: number;
  toAmount: number;
  fee: number;
  feePercent: number;
  price: number;
  spreadPercent: number;
  allocationPreview?: {
    hasPartialAllocation: boolean;
    totalGrams: number;
    allocatedGrams: number;
    nonAllocatedGrams: number;
    suggestion?: {
      targetGrams: number;
      description: string;
    };
  };
}

export async function getTradePreview(params: {
  type: 'buy' | 'sell';
  fromToken: string;
  toToken: string;
  amount: number;
  address?: string;
}): Promise<TradePreview | null> {
  const url = new URL(`${API_URL}/api/trade`);
  url.searchParams.set('type', params.type);
  url.searchParams.set('fromToken', params.fromToken);
  url.searchParams.set('toToken', params.toToken);
  url.searchParams.set('amount', params.amount.toString());
  if (params.address) {
    url.searchParams.set('address', params.address);
  }
  
  const res = await fetch(url.toString());
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  return data.preview || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTODIAL WALLET
// ═══════════════════════════════════════════════════════════════════════════

export interface CustodialWalletResult {
  success: boolean;
  userId?: string;
  walletAddress?: string;
  walletType?: 'custodial' | 'external';
  isNew?: boolean;
  error?: string;
  depositAddresses?: Record<string, string>;
}

/**
 * Create a new custodial wallet (AWS KMS encrypted)
 */
export async function createCustodialWallet(email?: string, referralCode?: string): Promise<CustodialWalletResult> {
  try {
    const res = await fetch(`${API_URL}/api/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        createCustodial: true,
        email,
        referralCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create wallet' };
    }

    // Save to AsyncStorage
    if (data.user?.walletAddress) {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_MODE, 'custodial');
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, data.user.walletAddress);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, data.userId);
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
    }

    return {
      success: true,
      userId: data.userId,
      walletAddress: data.user?.walletAddress,
      walletType: data.user?.walletType || 'custodial',
      isNew: data.isNew,
      depositAddresses: data.depositAddresses,
    };
  } catch (error: any) {
    console.error('Create custodial wallet error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

/**
 * Register with external wallet address
 */
export async function registerExternalWallet(walletAddress: string, email?: string, referralCode?: string): Promise<CustodialWalletResult> {
  try {
    const res = await fetch(`${API_URL}/api/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        email,
        referralCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to register wallet' };
    }

    // Save to AsyncStorage
    if (data.user?.walletAddress) {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_MODE, 'external');
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, data.user.walletAddress);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, data.userId);
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
    }

    return {
      success: true,
      userId: data.userId,
      walletAddress: data.user?.walletAddress,
      walletType: data.user?.walletType || 'external',
      isNew: data.isNew,
      depositAddresses: data.depositAddresses,
    };
  } catch (error: any) {
    console.error('Register external wallet error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

/**
 * Check if user exists and get their info
 */
export async function checkUserExists(address: string): Promise<{
  exists: boolean;
  userId?: string;
  walletType?: string;
  depositAddresses?: Record<string, string>;
}> {
  try {
    const res = await fetch(`${API_URL}/api/user/register?address=${address}`);
    const data = await res.json();

    return {
      exists: data.exists || false,
      userId: data.userId,
      walletType: data.user?.walletType,
      depositAddresses: data.depositAddresses,
    };
  } catch (error) {
    console.error('Check user exists error:', error);
    return { exists: false };
  }
}

/**
 * Get current wallet mode from storage
 */
export async function getWalletMode(): Promise<'custodial' | 'external' | null> {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_MODE);
    return mode as 'custodial' | 'external' | null;
  } catch {
    return null;
  }
}

/**
 * Get stored wallet address
 */
export async function getStoredWalletAddress(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
  } catch {
    return null;
  }
}

/**
 * Clear wallet data (logout)
 */
export async function clearWalletData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.WALLET_MODE,
      STORAGE_KEYS.WALLET_ADDRESS,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.HAS_WALLET,
    ]);
  } catch (error) {
    console.error('Clear wallet data error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTODIAL TRANSFER (server-side signed)
// ═══════════════════════════════════════════════════════════════════════════

export interface CustodialTransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Execute transfer for custodial wallet (signed by server)
 */
export async function executeCustodialTransfer(params: {
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
}): Promise<CustodialTransferResult> {
  try {
    const res = await fetch(`${API_URL}/api/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        custodial: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Transfer failed' };
    }

    return {
      success: true,
      txHash: data.txHash || data.transaction?.txHash,
    };
  } catch (error: any) {
    console.error('Custodial transfer error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}
