// config/web3.ts
// Auxite Mobile - Web3 Configuration

// Network Configuration
export const CHAIN_ID = 11155111; // Sepolia Testnet
export const CHAIN_NAME = 'Sepolia';
export const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'; // Replace with your RPC

// Deployed Contract Addresses (Sepolia)
export const CONTRACTS: Record<string, `0x${string}`> = {
  AUXG: '0xE425A9923250E94Fe2F4cB99cbc0896Aea24933a' as `0x${string}`,
  AUXS: '0xaE583c98c833a0B4b1B23e58209E697d95F05D23' as `0x${string}`,
  AUXPT: '0xeCfD88bE4f93C9379644B303444943e636A35F66' as `0x${string}`,
  AUXPD: '0x6F4E027B42E14e06f3eaeA39d574122188eab1D4' as `0x${string}`,
  EXCHANGE: '0xB015A2bA40c429B0FE3ea97BDE6fdb6bf8D6E78b' as `0x${string}`,
  STAKING: '0x74D7Edb0e8716c445cA17E64AaED111A55B7b3c4' as `0x${string}`,
};

// Token Decimals
export const DECIMALS = {
  AUXG: 18,
  AUXS: 18,
  AUXPT: 18,
  AUXPD: 18,
  ETH: 18,
};

// Metal token addresses map
export const METAL_TOKENS: Record<string, `0x${string}`> = {
  AUXG: CONTRACTS.AUXG,
  AUXS: CONTRACTS.AUXS,
  AUXPT: CONTRACTS.AUXPT,
  AUXPD: CONTRACTS.AUXPD,
};

// ERC20 Token ABI (minimal)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Exchange ABI
export const EXCHANGE_ABI = [
  {
    inputs: [
      { name: 'fromToken', type: 'address' },
      { name: 'toToken', type: 'address' },
      { name: 'fromAmount', type: 'uint256' },
    ],
    name: 'swap',
    outputs: [{ name: 'toAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'fromToken', type: 'address' },
      { name: 'toToken', type: 'address' },
      { name: 'fromAmount', type: 'uint256' },
    ],
    name: 'getExchangeRate',
    outputs: [
      { name: 'toAmount', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Staking ABI (placeholder - update when contract is deployed)
export const STAKING_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'lockPeriod', type: 'uint256' }, // in seconds
    ],
    name: 'stake',
    outputs: [{ name: 'stakeId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'unstake',
    outputs: [{ name: 'amount', type: 'uint256' }, { name: 'rewards', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'claimRewards',
    outputs: [{ name: 'rewards', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStakes',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'apy', type: 'uint256' },
          { name: 'claimed', type: 'bool' },
        ],
        name: 'stakes',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    name: 'getPendingRewards',
    outputs: [{ name: 'rewards', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'duration', type: 'uint256' },
    ],
    name: 'getAPY',
    outputs: [{ name: 'apy', type: 'uint256' }], // basis points (e.g., 500 = 5%)
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Lock periods in seconds
export const LOCK_PERIODS = {
  THREE_MONTHS: 90 * 24 * 60 * 60,   // 7,776,000 seconds
  SIX_MONTHS: 180 * 24 * 60 * 60,    // 15,552,000 seconds
  TWELVE_MONTHS: 365 * 24 * 60 * 60, // 31,536,000 seconds
};

// Helper functions
export function getTokenAddress(symbol: string): `0x${string}` | null {
  const upperSymbol = symbol.toUpperCase();
  return METAL_TOKENS[upperSymbol] || null;
}

export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${integerPart}.${fractionalStr}`;
}

export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [integer, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFraction);
}

// Block explorer URLs
export function getExplorerTxUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}
