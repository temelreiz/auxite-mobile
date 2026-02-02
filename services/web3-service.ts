// services/web3.ts
// Auxite Mobile - Web3 Service for On-Chain Operations

import { 
  CONTRACTS, 
  ERC20_ABI, 
  EXCHANGE_ABI, 
  STAKING_ABI,
  CHAIN_ID,
  LOCK_PERIODS,
  getTokenAddress,
  parseTokenAmount,
  formatTokenAmount,
} from '@/config/web3';

// For Expo/React Native, we'll use ethers.js
// Install: npx expo install ethers@5.7.2
import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OnChainBalance {
  symbol: string;
  balance: string;
  balanceRaw: bigint;
}

export interface StakeInfo {
  id: number;
  token: string;
  amount: string;
  startTime: number;
  endTime: number;
  apy: number;
  pendingRewards: string;
  claimed: boolean;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB3 SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class Web3Service {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  
  // Initialize with RPC (read-only)
  initializeReadOnly(rpcUrl: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }
  
  // Connect with external signer (from WalletConnect/MetaMask)
  connectSigner(signer: ethers.Signer) {
    this.signer = signer;
  }
  
  // Get provider
  getProvider() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }
  
  // Get signer
  getSigner() {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }
    return this.signer;
  }
  
  // Check if signer is connected
  isSignerConnected(): boolean {
    return this.signer !== null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ OPERATIONS (No gas required)
  // ═══════════════════════════════════════════════════════════════════════════

  // Get token balance
  async getTokenBalance(tokenSymbol: string, address: string): Promise<OnChainBalance | null> {
    try {
      const tokenAddress = getTokenAddress(tokenSymbol);
      if (!tokenAddress) return null;
      
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.getProvider());
      const balance = await contract.balanceOf(address);
      
      return {
        symbol: tokenSymbol,
        balance: formatTokenAmount(balance),
        balanceRaw: balance,
      };
    } catch (error) {
      console.error(`getTokenBalance error for ${tokenSymbol}:`, error);
      return null;
    }
  }

  // Get all metal balances
  async getAllMetalBalances(address: string): Promise<OnChainBalance[]> {
    const symbols = ['AUXG', 'AUXS', 'AUXPT', 'AUXPD'];
    const balances = await Promise.all(
      symbols.map(symbol => this.getTokenBalance(symbol, address))
    );
    return balances.filter((b): b is OnChainBalance => b !== null);
  }

  // Get ETH balance
  async getEthBalance(address: string): Promise<string> {
    try {
      const balance = await this.getProvider().getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('getEthBalance error:', error);
      return '0';
    }
  }

  // Get exchange rate
  async getExchangeRate(fromToken: string, toToken: string, amount: string): Promise<{
    toAmount: string;
    fee: string;
  } | null> {
    try {
      const fromAddress = getTokenAddress(fromToken);
      const toAddress = getTokenAddress(toToken);
      if (!fromAddress || !toAddress) return null;
      
      const contract = new ethers.Contract(CONTRACTS.EXCHANGE, EXCHANGE_ABI, this.getProvider());
      const amountBN = parseTokenAmount(amount);
      
      const [toAmount, fee] = await contract.getExchangeRate(fromAddress, toAddress, amountBN);
      
      return {
        toAmount: formatTokenAmount(toAmount),
        fee: formatTokenAmount(fee),
      };
    } catch (error) {
      console.error('getExchangeRate error:', error);
      return null;
    }
  }

  // Get user stakes (requires staking contract)
  async getUserStakes(address: string): Promise<StakeInfo[]> {
    try {
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, this.getProvider());
      const stakes = await contract.getUserStakes(address);
      
      return stakes.map((stake: any) => ({
        id: stake.id.toNumber(),
        token: this.getTokenSymbolByAddress(stake.token),
        amount: formatTokenAmount(stake.amount),
        startTime: stake.startTime.toNumber(),
        endTime: stake.endTime.toNumber(),
        apy: stake.apy.toNumber() / 100, // Convert from basis points
        pendingRewards: '0', // Will be fetched separately
        claimed: stake.claimed,
      }));
    } catch (error) {
      console.error('getUserStakes error:', error);
      return [];
    }
  }

  // Get pending rewards
  async getPendingRewards(stakeId: number): Promise<string> {
    try {
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, this.getProvider());
      const rewards = await contract.getPendingRewards(stakeId);
      return formatTokenAmount(rewards);
    } catch (error) {
      console.error('getPendingRewards error:', error);
      return '0';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE OPERATIONS (Requires gas)
  // ═══════════════════════════════════════════════════════════════════════════

  // Approve token spending
  async approveToken(tokenSymbol: string, spender: string, amount: string): Promise<TransactionResult> {
    try {
      const tokenAddress = getTokenAddress(tokenSymbol);
      if (!tokenAddress) {
        return { success: false, error: 'Invalid token' };
      }
      
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.getSigner());
      const amountBN = parseTokenAmount(amount);
      
      const tx = await contract.approve(spender, amountBN);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('approveToken error:', error);
      return {
        success: false,
        error: error.message || 'Approval failed',
      };
    }
  }

  // Swap tokens via Exchange contract
  async swapTokens(fromToken: string, toToken: string, fromAmount: string): Promise<TransactionResult> {
    try {
      const fromAddress = getTokenAddress(fromToken);
      const toAddress = getTokenAddress(toToken);
      
      if (!fromAddress || !toAddress) {
        return { success: false, error: 'Invalid token' };
      }
      
      // First approve
      const approveResult = await this.approveToken(fromToken, CONTRACTS.EXCHANGE, fromAmount);
      if (!approveResult.success) {
        return approveResult;
      }
      
      // Then swap
      const contract = new ethers.Contract(CONTRACTS.EXCHANGE, EXCHANGE_ABI, this.getSigner());
      const amountBN = parseTokenAmount(fromAmount);
      
      const tx = await contract.swap(fromAddress, toAddress, amountBN);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('swapTokens error:', error);
      return {
        success: false,
        error: error.message || 'Swap failed',
      };
    }
  }

  // Stake tokens
  async stakeTokens(
    tokenSymbol: string, 
    amount: string, 
    durationMonths: 3 | 6 | 12
  ): Promise<TransactionResult> {
    try {
      const tokenAddress = getTokenAddress(tokenSymbol);
      if (!tokenAddress) {
        return { success: false, error: 'Invalid token' };
      }
      
      // Calculate lock period
      let lockPeriod: number;
      switch (durationMonths) {
        case 3: lockPeriod = LOCK_PERIODS.THREE_MONTHS; break;
        case 6: lockPeriod = LOCK_PERIODS.SIX_MONTHS; break;
        case 12: lockPeriod = LOCK_PERIODS.TWELVE_MONTHS; break;
        default: return { success: false, error: 'Invalid duration' };
      }
      
      // First approve
      const approveResult = await this.approveToken(tokenSymbol, CONTRACTS.STAKING, amount);
      if (!approveResult.success) {
        return approveResult;
      }
      
      // Then stake
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, this.getSigner());
      const amountBN = parseTokenAmount(amount);
      
      const tx = await contract.stake(tokenAddress, amountBN, lockPeriod);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('stakeTokens error:', error);
      return {
        success: false,
        error: error.message || 'Stake failed',
      };
    }
  }

  // Unstake tokens
  async unstakeTokens(stakeId: number): Promise<TransactionResult> {
    try {
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, this.getSigner());
      
      const tx = await contract.unstake(stakeId);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('unstakeTokens error:', error);
      return {
        success: false,
        error: error.message || 'Unstake failed',
      };
    }
  }

  // Claim rewards
  async claimRewards(stakeId: number): Promise<TransactionResult> {
    try {
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, this.getSigner());
      
      const tx = await contract.claimRewards(stakeId);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
      };
    } catch (error: any) {
      console.error('claimRewards error:', error);
      return {
        success: false,
        error: error.message || 'Claim failed',
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private getTokenSymbolByAddress(address: string): string {
    const normalizedAddress = address.toLowerCase();
    for (const [symbol, addr] of Object.entries(CONTRACTS)) {
      if (addr.toLowerCase() === normalizedAddress) {
        return symbol;
      }
    }
    return 'UNKNOWN';
  }
}

// Singleton instance
export const web3Service = new Web3Service();
export default web3Service;

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK FOR WEB3
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';

export function useWeb3() {
  const { address, isConnected } = useWallet();
  const [onChainBalances, setOnChainBalances] = useState<OnChainBalance[]>([]);
  const [ethBalance, setEthBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch on-chain balances
  const fetchOnChainBalances = useCallback(async () => {
    if (!address || !isConnected) return;
    
    setIsLoading(true);
    try {
      const [balances, eth] = await Promise.all([
        web3Service.getAllMetalBalances(address),
        web3Service.getEthBalance(address),
      ]);
      
      setOnChainBalances(balances);
      setEthBalance(eth);
    } catch (error) {
      console.error('fetchOnChainBalances error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);
  
  useEffect(() => {
    if (address) {
      fetchOnChainBalances();
    }
  }, [address, fetchOnChainBalances]);
  
  return {
    onChainBalances,
    ethBalance,
    isLoading,
    refreshBalances: fetchOnChainBalances,
    
    // Pass through web3 service methods
    getExchangeRate: web3Service.getExchangeRate.bind(web3Service),
    swapTokens: web3Service.swapTokens.bind(web3Service),
    stakeTokens: web3Service.stakeTokens.bind(web3Service),
    unstakeTokens: web3Service.unstakeTokens.bind(web3Service),
    claimRewards: web3Service.claimRewards.bind(web3Service),
    getUserStakes: () => address ? web3Service.getUserStakes(address) : Promise.resolve([]),
  };
}
