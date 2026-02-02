// services/index.ts
// Export all services

export { default as apiService } from './ApiService';
export { default as walletService, CONTRACTS, NETWORK_CONFIG, ERC20_ABI, LEASING_ABI, EXCHANGE_ABI } from './WalletService';
export { default as balanceService } from './BalanceService';
export { default as tradeService, METAL_INFO } from './TradeService';
export { default as stakingService, LEASE_RATES_CONFIG } from './StakingService';
export { default as convertService } from './ConvertService';
export { default as withdrawService, WITHDRAW_NETWORKS } from './WithdrawService';

// Re-export types
export type { WalletState, TokenBalance, StakingPosition } from './WalletService';
export type { UserBalance, OnChainBalance, BalanceWithValue, PortfolioSummary } from './BalanceService';
export type { Quote, TradeResult, LimitOrder } from './TradeService';
export type { LeaseRate, StakeParams, StakeResult, ClaimResult, StakingSummary } from './StakingService';
export type { ConversionQuote, ConversionResult } from './ConvertService';
export type { WithdrawNetwork, WithdrawRequest, WithdrawResult, WithdrawHistory } from './WithdrawService';
