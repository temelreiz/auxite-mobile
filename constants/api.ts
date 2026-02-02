// constants/api.ts
// API Configuration

// Production API URL
export const API_URL = 'https://wallet.auxite.io';
export const ETH_RPC_URL = process.env.EXPO_PUBLIC_ETH_RPC_URL || 'https://mainnet.infura.io/v3/06f4a3d8bae44ffb889975d654d8a680';

// API Endpoints
export const ENDPOINTS = {
  // Prices
  PRICES: '/api/prices',
  METALS: '/api/metals',
  GOLD_PRICES: '/api/gold-prices',
  
  // KYC
  KYC: '/api/kyc',
  KYC_SUMSUB: '/api/kyc/sumsub',
  
  // Auth
  AUTH_SESSION: '/api/auth/session',
  AUTH_VERIFY: '/api/auth/verify',
  
  // Balance
  BALANCE: '/api/balance',
  
  // Trading
  TRADE: '/api/trade',
  ORDERS: '/api/orders',
  QUOTE: '/api/quote',
  
  // Transactions
  TRANSACTIONS: '/api/transactions',
  DEPOSIT: '/api/deposit',
  WITHDRAW: '/api/withdraw',
  
  // Staking/Leasing
  LEASE_RATES: '/api/lease-rates',
  RECURRING_STAKE: '/api/recurring-stake',
  
  // User
  USER: '/api/user',
  USER_REGISTER: '/api/user/register',
  USER_BALANCE: '/api/user/balance',
  REFERRAL: '/api/referral',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  ALERTS: '/api/alerts',
  
  // Security
  SECURITY: '/api/security',
  DEVICES: '/api/devices',
  
  // Mobile specific
  MOBILE_PAIR: '/api/mobile/pair',
};

// Request timeout (ms)
export const REQUEST_TIMEOUT = 30000;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
};
