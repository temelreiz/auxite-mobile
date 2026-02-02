// hooks/useServices.ts
// React Hooks for all services

import { useState, useEffect, useCallback } from 'react';
import walletService, { WalletState, StakingPosition } from '@/services/WalletService';
import balanceService, { UserBalance, BalanceWithValue, PortfolioSummary } from '@/services/BalanceService';
import tradeService, { Quote, LimitOrder, METAL_INFO } from '@/services/TradeService';
import stakingService, { LeaseRate, StakingSummary } from '@/services/StakingService';
import convertService, { ConversionQuote } from '@/services/ConvertService';
import apiService from '@/services/ApiService';

// ═══════════════════════════════════════════════════════════════════════════
// useWallet - Wallet connection hook
// ═══════════════════════════════════════════════════════════════════════════

export function useWallet() {
  const [state, setState] = useState<WalletState>(walletService.getState());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe(setState);
    
    // Check for previous connection
    walletService.checkPreviousConnection();
    
    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    
    const result = await walletService.connect();
    
    setConnecting(false);
    
    if (!result.success) {
      setError(result.error || 'Connection failed');
    }
    
    return result;
  }, []);

  const disconnect = useCallback(async () => {
    await walletService.disconnect();
  }, []);

  return {
    ...state,
    connecting,
    error,
    connect,
    disconnect,
    formatAddress: walletService.formatAddress,
    getExplorerUrl: walletService.getExplorerUrl,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useBalance - Balance management hook
// ═══════════════════════════════════════════════════════════════════════════

export function useBalance() {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    
    const result = await balanceService.getBalance(force);
    
    if (result) {
      setBalance(result);
    } else {
      setError('Failed to fetch balance');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBalance();
    
    // Subscribe to balance updates
    const unsubscribe = balanceService.subscribe(setBalance);
    
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchBalance(), 30000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchBalance]);

  const refresh = useCallback(() => fetchBalance(true), [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh,
    hasSufficientBalance: balanceService.hasSufficientBalance.bind(balanceService),
    formatBalance: balanceService.formatBalance.bind(balanceService),
    formatValue: balanceService.formatValue.bind(balanceService),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// usePortfolio - Portfolio with values hook
// ═══════════════════════════════════════════════════════════════════════════

export function usePortfolio() {
  const [assets, setAssets] = useState<BalanceWithValue[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [prices, setPrices] = useState<{
    metals: Record<string, number>;
    crypto: Record<string, number>;
  }>({ metals: {}, crypto: {} });
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const [metalRes, cryptoRes] = await Promise.all([
        apiService.getMetalPrices(),
        apiService.getCryptoPrices(),
      ]);

      const metalPrices: Record<string, number> = {};
      const cryptoPrices: Record<string, number> = {};

      if (metalRes.success && metalRes.data?.data) {
        for (const metal of metalRes.data.data) {
          if (metal.priceOz) {
            metalPrices[metal.symbol] = metal.priceOz / 31.1035;
          }
        }
      }

      if (cryptoRes.success && cryptoRes.data) {
        if (cryptoRes.data.bitcoin) cryptoPrices.bitcoin = cryptoRes.data.bitcoin.usd;
        if (cryptoRes.data.ethereum) cryptoPrices.ethereum = cryptoRes.data.ethereum.usd;
      }

      setPrices({ metals: metalPrices, crypto: cryptoPrices });
      return { metalPrices, cryptoPrices };
    } catch {
      return { metalPrices: {}, cryptoPrices: {} };
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    
    const { metalPrices, cryptoPrices } = await fetchPrices();
    
    const [assetsResult, summaryResult] = await Promise.all([
      balanceService.getBalanceWithValues(metalPrices, cryptoPrices),
      balanceService.getPortfolioSummary(metalPrices, cryptoPrices),
    ]);

    setAssets(assetsResult);
    setSummary(summaryResult);
    setLoading(false);
  }, [fetchPrices]);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  return {
    assets,
    summary,
    prices,
    loading,
    refresh: fetchPortfolio,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useTrade - Trading hook
// ═══════════════════════════════════════════════════════════════════════════

export function useTrade() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = tradeService.subscribeToQuote(setQuote);
    return unsubscribe;
  }, []);

  const requestQuote = useCallback(async (params: {
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
  }) => {
    setLoading(true);
    setError(null);
    
    const result = await tradeService.requestQuote(params);
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Failed to get quote');
    }
    
    return result;
  }, []);

  const executeTrade = useCallback(async () => {
    setExecuting(true);
    setError(null);
    
    const result = await tradeService.executeTrade();
    
    setExecuting(false);
    
    if (!result.success) {
      setError(result.error || 'Trade failed');
    }
    
    return result;
  }, []);

  const clearQuote = useCallback(() => {
    tradeService.clearQuote();
    setError(null);
  }, []);

  return {
    quote,
    loading,
    executing,
    error,
    requestQuote,
    executeTrade,
    clearQuote,
    getMetalPrices: tradeService.getMetalPrices.bind(tradeService),
    calculateEstimate: tradeService.calculateEstimate.bind(tradeService),
    metalInfo: METAL_INFO,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useLimitOrders - Limit orders hook
// ═══════════════════════════════════════════════════════════════════════════

export function useLimitOrders() {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status?: 'pending' | 'filled' | 'cancelled') => {
    setLoading(true);
    setError(null);
    
    const result = await tradeService.getLimitOrders(status);
    
    if (result.success) {
      setOrders(result.orders);
    } else {
      setError(result.error || 'Failed to fetch orders');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = useCallback(async (params: {
    type: 'buy' | 'sell';
    metal: string;
    grams: number;
    limitPrice: number;
  }) => {
    const result = await tradeService.createLimitOrder(params);
    if (result.success) {
      fetchOrders();
    }
    return result;
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const result = await tradeService.cancelLimitOrder(orderId);
    if (result.success) {
      fetchOrders();
    }
    return result;
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
    createOrder,
    cancelOrder,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useStaking - Staking/Leasing hook
// ═══════════════════════════════════════════════════════════════════════════

export function useStaking() {
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [summary, setSummary] = useState<StakingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    
    const positionsResult = await stakingService.getAllPositions(true);
    setPositions(positionsResult);
    
    // Fetch prices for summary
    const pricesRes = await apiService.getMetalPrices();
    const metalPrices: Record<string, number> = {};
    
    if (pricesRes.success && pricesRes.data?.data) {
      for (const metal of pricesRes.data.data) {
        if (metal.priceOz) {
          metalPrices[metal.symbol] = metal.priceOz / 31.1035;
        }
      }
    }
    
    const summaryResult = await stakingService.getSummary(metalPrices);
    setSummary(summaryResult);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 60000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  const stake = useCallback(async (params: {
    metal: string;
    amount: number;
    periodMonths: number;
  }) => {
    setStaking(true);
    setError(null);
    
    const result = await stakingService.stake(params);
    
    setStaking(false);
    
    if (result.success) {
      fetchPositions();
    } else {
      setError(result.error || 'Staking failed');
    }
    
    return result;
  }, [fetchPositions]);

  const claim = useCallback(async (metal: string, positionIndex: number) => {
    setClaiming(true);
    setError(null);
    
    const result = await stakingService.claim(metal, positionIndex);
    
    setClaiming(false);
    
    if (result.success) {
      fetchPositions();
    } else {
      setError(result.error || 'Claim failed');
    }
    
    return result;
  }, [fetchPositions]);

  return {
    positions,
    summary,
    loading,
    staking,
    claiming,
    error,
    refresh: fetchPositions,
    stake,
    claim,
    leaseRates: stakingService.getLeaseRates(),
    getApy: stakingService.getApy.bind(stakingService),
    calculateExpectedReward: stakingService.calculateExpectedReward.bind(stakingService),
    formatPosition: stakingService.formatPosition.bind(stakingService),
    getClaimablePositions: () => positions.filter(p => p.isMatured && !p.closed),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useConvert - Metal conversion hook
// ═══════════════════════════════════════════════════════════════════════════

export function useConvert() {
  const [quote, setQuote] = useState<ConversionQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (
    fromMetal: string,
    toMetal: string,
    fromAmount: number,
    metalPrices: Record<string, number>
  ) => {
    setLoading(true);
    setError(null);
    
    const result = await convertService.getQuote(fromMetal, toMetal, fromAmount, metalPrices);
    
    setLoading(false);
    
    if (result.success && result.quote) {
      setQuote(result.quote);
    } else {
      setError(result.error || 'Failed to get quote');
      setQuote(null);
    }
    
    return result;
  }, []);

  const convert = useCallback(async () => {
    if (!quote) {
      return { success: false, error: 'No active quote' };
    }

    setConverting(true);
    setError(null);
    
    const result = await convertService.executeQuote();
    
    setConverting(false);
    
    if (result.success) {
      setQuote(null);
    } else {
      setError(result.error || 'Conversion failed');
    }
    
    return result;
  }, [quote]);

  const clearQuote = useCallback(() => {
    convertService.clearQuote();
    setQuote(null);
    setError(null);
  }, []);

  return {
    quote,
    loading,
    converting,
    error,
    getQuote,
    convert,
    clearQuote,
    getConversionPairs: convertService.getConversionPairs.bind(convertService),
    formatQuote: convertService.formatQuote.bind(convertService),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useTransactions - Transaction history hook
// ═══════════════════════════════════════════════════════════════════════════

export function useTransactions(limit: number = 20) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const { isConnected, address } = useWallet();

  const fetchTransactions = useCallback(async (reset: boolean = false) => {
    if (!isConnected || !address) return;

    setLoading(true);
    
    const currentOffset = reset ? 0 : offset;
    
    const result = await apiService.getTransactions({
      address,
      limit,
      offset: currentOffset,
    });

    if (result.success && result.data) {
      if (reset) {
        setTransactions(result.data.transactions);
      } else {
        setTransactions(prev => [...prev, ...result.data!.transactions]);
      }
      setHasMore(result.data.pagination.hasMore);
      setOffset(currentOffset + limit);
    }
    
    setLoading(false);
  }, [isConnected, address, limit, offset]);

  useEffect(() => {
    fetchTransactions(true);
  }, [isConnected, address]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTransactions();
    }
  }, [loading, hasMore, fetchTransactions]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchTransactions(true);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    hasMore,
    loadMore,
    refresh,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Default export
// ═══════════════════════════════════════════════════════════════════════════

export default {
  useWallet,
  useBalance,
  usePortfolio,
  useTrade,
  useLimitOrders,
  useStaking,
  useConvert,
  useTransactions,
};
