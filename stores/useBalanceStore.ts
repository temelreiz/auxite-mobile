// stores/useBalanceStore.ts
// Balance, Trading & Staking State Management
// ✅ Non-custodial ETH transfer support
// ✅ Custodial wallet support

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBalance,
  executeTrade,
  createLimitOrder,
  cancelLimitOrder,
  getLimitOrders,
  getTransactions,
  getStakePositions,
  createStake,
  getWalletMode,
  type UserBalance,
  type TradeResult,
  type LimitOrder,
  type Transaction,
  type StakePosition,
} from '@/services/api';
import { transferEthToHotWallet } from '@/services/wallet-service';

// Crypto tokens that require on-chain transfer before trade (only for non-custodial)
const ON_CHAIN_CRYPTOS = ['eth'];

interface BalanceState {
  // User
  address: string | null;
  walletMode: 'custodial' | 'external' | null;

  // Balances
  balance: UserBalance | null;
  isLoadingBalance: boolean;
  
  // Orders
  orders: LimitOrder[];
  isLoadingOrders: boolean;
  
  // Transactions
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  
  // Staking
  stakePositions: StakePosition[];
  isLoadingStakes: boolean;
  
  // Trading
  isTrading: boolean;
  tradingStatus: string;
  lastTradeResult: TradeResult | null;
  
  // Actions
  setAddress: (address: string | null, walletMode?: 'custodial' | 'external' | null) => void;
  setWalletMode: (mode: 'custodial' | 'external' | null) => void;
  loadWalletMode: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  fetchOrders: (status?: 'pending' | 'filled' | 'cancelled' | 'expired') => Promise<void>;
  fetchTransactions: (limit?: number) => Promise<void>;
  fetchStakePositions: () => Promise<void>;
  
  // Trade actions
  executeBuy: (params: {
    email?: string;
    holderName?: string;
    fromToken: string;
    toToken: string;
    amount: number;
  }) => Promise<TradeResult>;
  
  executeSell: (params: {
    email?: string;
    holderName?: string;
    fromToken: string;
    toToken: string;
    amount: number;
  }) => Promise<TradeResult>;
  
  createOrder: (params: {
    type: 'buy' | 'sell';
    metal: 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
    grams: number;
    limitPrice: number;
    paymentMethod?: 'AUXM' | 'USDT' | 'USD';
  }) => Promise<{ success: boolean; error?: string }>;
  
  cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Staking actions
  createStakePosition: (params: {
    metal: string;
    amount: number;
    duration: number;
  }) => Promise<{ success: boolean; error?: string }>;
  
  // Refresh all
  refreshAll: () => Promise<void>;
  
  // Clear
  clearAll: () => void;
}

export const useBalanceStore = create<BalanceState>((set, get) => ({
  // Initial state
  address: null,
  walletMode: null,
  balance: null,
  isLoadingBalance: false,
  orders: [],
  isLoadingOrders: false,
  transactions: [],
  isLoadingTransactions: false,
  stakePositions: [],
  isLoadingStakes: false,
  isTrading: false,
  tradingStatus: '',
  lastTradeResult: null,
  
  // Set wallet address
  setAddress: (address, walletMode) => {
    const normalizedAddress = address?.toLowerCase() || null;
    set({ address: normalizedAddress, walletMode: walletMode || get().walletMode });
    if (normalizedAddress) {
      // Auto-fetch all data when address is set
      get().refreshAll();
    } else {
      // Clear everything when address is cleared
      get().clearAll();
    }
  },

  // Set wallet mode
  setWalletMode: (mode) => {
    set({ walletMode: mode });
  },

  // Load wallet mode from storage
  loadWalletMode: async () => {
    try {
      const mode = await getWalletMode();
      set({ walletMode: mode });
    } catch (error) {
      console.error('Load wallet mode error:', error);
    }
  },
  
  // Fetch user balance
  fetchBalance: async () => {
    const { address } = get();
    if (!address) return;
    
    set({ isLoadingBalance: true });
    try {
      const balance = await getBalance(address);
      set({ balance, isLoadingBalance: false });
    } catch (error) {
      console.error('fetchBalance error:', error);
      set({ isLoadingBalance: false });
    }
  },
  
  // Fetch limit orders
  fetchOrders: async (status) => {
    const { address } = get();
    if (!address) return;
    
    set({ isLoadingOrders: true });
    try {
      const orders = await getLimitOrders(address, status);
      set({ orders, isLoadingOrders: false });
    } catch (error) {
      console.error('fetchOrders error:', error);
      set({ isLoadingOrders: false });
    }
  },
  
  // Fetch transactions
  fetchTransactions: async (limit = 50) => {
    const { address } = get();
    if (!address) return;
    
    set({ isLoadingTransactions: true });
    try {
      const transactions = await getTransactions(address, limit);
      set({ transactions, isLoadingTransactions: false });
    } catch (error) {
      console.error('fetchTransactions error:', error);
      set({ isLoadingTransactions: false });
    }
  },
  
  // Fetch stake positions
  fetchStakePositions: async () => {
    const { address } = get();
    if (!address) return;
    
    set({ isLoadingStakes: true });
    try {
      const stakePositions = await getStakePositions(address);
      set({ stakePositions, isLoadingStakes: false });
    } catch (error) {
      console.error('fetchStakePositions error:', error);
      set({ isLoadingStakes: false });
    }
  },
  
  // Execute buy trade
  executeBuy: async (params) => {
    const { address, walletMode } = get();
    if (!address) {
      return { success: false, error: 'No wallet connected' };
    }

    const fromTokenLower = params.fromToken.toLowerCase();
    const isCustodial = walletMode === 'custodial';

    set({ isTrading: true, tradingStatus: 'Başlatılıyor...' });

    try {
      // ═══════════════════════════════════════════════════════════════════
      // CUSTODIAL: Server handles everything - no client-side signing
      // ═══════════════════════════════════════════════════════════════════
      if (isCustodial) {
        console.log(`🔐 Custodial ${params.fromToken} trade - server-side execution`);
        set({ tradingStatus: 'İşlem sunucuda işleniyor...' });

        const result = await executeTrade({
          address,
          type: 'buy',
          fromToken: params.fromToken,
          toToken: params.toToken,
          fromAmount: params.amount,
          executeOnChain: true,
          email: params.email,
          holderName: params.holderName,
          custodial: true, // Mark as custodial trade
        });

        set({ isTrading: false, tradingStatus: '', lastTradeResult: result });

        if (result.success) {
          get().fetchBalance();
          get().fetchTransactions();
        }

        return result;
      }

      // ═══════════════════════════════════════════════════════════════════
      // NON-CUSTODIAL: ETH transfer to hot wallet
      // OPTIMISTIC: TX imzası alındıktan sonra hemen başarılı kabul et
      // ═══════════════════════════════════════════════════════════════════
      let ethTxHash: string | undefined;

      if (ON_CHAIN_CRYPTOS.includes(fromTokenLower)) {
        console.log(`🔷 Non-custodial ${params.fromToken} trade - transferring to hot wallet`);

        const transferResult = await transferEthToHotWallet(
          params.amount,
          (status) => set({ tradingStatus: status })
        );

        if (!transferResult.success) {
          set({ isTrading: false, tradingStatus: '' });
          return { success: false, error: transferResult.error || 'Transfer başarısız' };
        }

        ethTxHash = transferResult.txHash;
        console.log(`✅ ETH TX signed & broadcast: ${ethTxHash}`);

        // OPTIMISTIC: TX hash aldık = kullanıcı imzaladı = ETH gelecek
        // Blockchain onayını BEKLEMEDEN devam et
        set({ tradingStatus: 'İşlem onaylanıyor...' });
      }

      // ═══════════════════════════════════════════════════════════════════
      // EXECUTE TRADE ON BACKEND (OPTIMISTIC)
      // Backend TX hash'i alır, hemen AUXG yazar, arkaplanda onay kontrol eder
      // ═══════════════════════════════════════════════════════════════════
      const result = await executeTrade({
        address,
        type: 'buy',
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        executeOnChain: true,
        email: params.email,
        holderName: params.holderName,
        // TX hash gönder - backend onay beklemeden işlemi tamamlar
        ...(ethTxHash && { ethTransferTxHash: ethTxHash }),
        optimistic: true, // Backend'e optimistic modda çalıştığımızı bildir
      });

      set({ isTrading: false, tradingStatus: '', lastTradeResult: result });

      // Refresh balance after successful trade
      if (result.success) {
        get().fetchBalance();
        get().fetchTransactions();
      }

      return result;
    } catch (error: any) {
      let errorMsg = error.message || 'Trade failed';
      
      // Kullanıcı dostu hata mesajları
      if (errorMsg.includes('insufficient funds') || errorMsg.includes('INSUFFICIENT_FUNDS') || errorMsg.includes('Insufficient hot wallet')) {
        errorMsg = 'Yetersiz bakiye. Lütfen bakiyenizi kontrol edin.';
      } else if (errorMsg.includes('user rejected') || errorMsg.includes('User denied')) {
        errorMsg = 'İşlem iptal edildi.';
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        errorMsg = 'Ağ hatası. Lütfen tekrar deneyin.';
      } else if (errorMsg.length > 100) {
        errorMsg = 'İşlem başarısız. Lütfen bakiyenizi kontrol edin ve tekrar deneyin.';
      }
      
      const result = { success: false, error: errorMsg };
      set({ isTrading: false, tradingStatus: '', lastTradeResult: result });
      return result;
    }
  },
  
  // Execute sell trade
  executeSell: async (params) => {
    const { address, walletMode } = get();
    if (!address) {
      return { success: false, error: 'No wallet connected' };
    }

    const isCustodial = walletMode === 'custodial';

    set({ isTrading: true, tradingStatus: 'Satış işlemi başlatılıyor...' });
    try {
      const result = await executeTrade({
        address,
        type: 'sell',
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        executeOnChain: true,
        email: params.email,
        holderName: params.holderName,
        ...(isCustodial && { custodial: true }),
      });

      set({ isTrading: false, tradingStatus: '', lastTradeResult: result });

      if (result.success) {
        get().fetchBalance();
        get().fetchTransactions();
      }

      return result;
    } catch (error: any) {
      let errorMsg = error.message || 'Trade failed';
      
      if (errorMsg.includes('insufficient funds') || errorMsg.includes('INSUFFICIENT_FUNDS') || errorMsg.includes('Insufficient hot wallet')) {
        errorMsg = 'Yetersiz bakiye. Lütfen bakiyenizi kontrol edin.';
      } else if (errorMsg.includes('user rejected') || errorMsg.includes('User denied')) {
        errorMsg = 'İşlem iptal edildi.';
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        errorMsg = 'Ağ hatası. Lütfen tekrar deneyin.';
      } else if (errorMsg.length > 100) {
        errorMsg = 'İşlem başarısız. Lütfen bakiyenizi kontrol edin ve tekrar deneyin.';
      }
      
      const result = { success: false, error: errorMsg };
      set({ isTrading: false, tradingStatus: '', lastTradeResult: result });
      return result;
    }
  },
  
  // Create limit order
  createOrder: async (params) => {
    const { address } = get();
    if (!address) {
      return { success: false, error: 'No wallet connected' };
    }
    
    set({ isTrading: true });
    try {
      const result = await createLimitOrder({
        address,
        ...params,
      });
      
      set({ isTrading: false });
      
      if (result.success) {
        get().fetchOrders('pending');
        get().fetchBalance();
      }
      
      return result;
    } catch (error: any) {
      set({ isTrading: false });
      return { success: false, error: error.message };
    }
  },
  
  // Cancel limit order
  cancelOrder: async (orderId) => {
    const { address } = get();
    if (!address) {
      return { success: false, error: 'No wallet connected' };
    }
    
    try {
      const result = await cancelLimitOrder(orderId, address);
      
      if (result.success) {
        get().fetchOrders('pending');
        get().fetchBalance();
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  
  // Create stake position
  createStakePosition: async (params) => {
    const { address } = get();
    if (!address) {
      return { success: false, error: 'No wallet connected' };
    }
    
    set({ isTrading: true });
    try {
      const result = await createStake({
        address,
        ...params,
      });
      
      set({ isTrading: false });
      
      if (result.success) {
        get().fetchStakePositions();
        get().fetchBalance();
      }
      
      return result;
    } catch (error: any) {
      set({ isTrading: false });
      return { success: false, error: error.message };
    }
  },
  
  // Refresh all data
  refreshAll: async () => {
    const { address } = get();
    if (!address) return;
    
    await Promise.all([
      get().fetchBalance(),
      get().fetchOrders('pending'),
      get().fetchTransactions(),
      get().fetchStakePositions(),
    ]);
  },
  
  // Clear all data
  clearAll: () => {
    set({
      address: null,
      balance: null,
      orders: [],
      transactions: [],
      stakePositions: [],
      lastTradeResult: null,
      tradingStatus: '',
    });
  },
}));

// Selector hooks for convenience
export const useBalance = () => useBalanceStore((state) => state.balance);
export const useAddress = () => useBalanceStore((state) => state.address);
export const useWalletMode = () => useBalanceStore((state) => state.walletMode);
export const useIsCustodial = () => useBalanceStore((state) => state.walletMode === 'custodial');
export const useOrders = () => useBalanceStore((state) => state.orders);
export const useTransactions = () => useBalanceStore((state) => state.transactions);
export const useStakePositions = () => useBalanceStore((state) => state.stakePositions);
export const useIsTrading = () => useBalanceStore((state) => state.isTrading);
export const useTradingStatus = () => useBalanceStore((state) => state.tradingStatus);
