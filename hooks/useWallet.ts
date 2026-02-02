// hooks/useWallet.ts
// Mobile Wallet Hook - Full wallet integration for React Native
// Default chain: Sepolia (11155111)

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useStore } from '@/stores/useStore';
import { useBalanceStore } from '@/stores/useBalanceStore';

// Supported chains
const SUPPORTED_CHAINS: Record<number, { name: string; rpcUrl: string; explorer: string }> = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
  },
  84532: {
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
  },
  8453: {
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
  },
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
  },
};

// Default chain - Sepolia (matches web app)
const DEFAULT_CHAIN_ID = 11155111;

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  chainSupported: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const { 
    walletAddress, 
    isConnected: storeConnected, 
    setWalletAddress, 
    setIsConnected 
  } = useStore();

  // ✅ Balance store'u da al
  const { setAddress: setBalanceAddress } = useBalanceStore();

  const [state, setState] = useState<WalletState>({
    address: walletAddress || null,
    isConnected: storeConnected,
    chainId: DEFAULT_CHAIN_ID,
    chainSupported: true,
    connecting: false,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);

  // Initialize provider
  useEffect(() => {
    const chainConfig = SUPPORTED_CHAINS[state.chainId || DEFAULT_CHAIN_ID];
    if (chainConfig) {
      try {
        const rpcProvider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
        setProvider(rpcProvider);
      } catch (err) {
        console.error('Failed to create provider:', err);
      }
    }
  }, [state.chainId]);

  // ✅ Sync with store AND balance store
  useEffect(() => {
    setState(prev => ({
      ...prev,
      address: walletAddress || null,
      isConnected: storeConnected,
    }));
    
    // ✅ Balance store'u da sync et
    if (walletAddress) {
      setBalanceAddress(walletAddress);
    } else {
      setBalanceAddress(null);
    }
  }, [walletAddress, storeConnected, setBalanceAddress]);

  // Get provider for current chain
  const getProvider = useCallback((): ethers.providers.JsonRpcProvider => {
    if (provider) return provider;
    
    const chainConfig = SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
    return new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
  }, [provider]);

  // Switch chain
  const switchChain = useCallback(async (chainId: number) => {
    if (!(chainId in SUPPORTED_CHAINS)) {
      throw new Error(`Chain ${chainId} is not supported`);
    }

    const chainConfig = SUPPORTED_CHAINS[chainId];
    const newProvider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
    setProvider(newProvider);

    setState(prev => ({
      ...prev,
      chainId,
      chainSupported: true,
    }));
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      if (walletAddress) {
        // ✅ Balance store'u da güncelle
        setBalanceAddress(walletAddress);
        
        setState(prev => ({
          ...prev,
          address: walletAddress,
          isConnected: true,
          connecting: false,
          chainSupported: true,
        }));
        return walletAddress;
      }

      throw new Error('No wallet connected');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: err.message,
      }));
      throw err;
    }
  }, [walletAddress, setBalanceAddress]);

  // Disconnect
  const disconnect = useCallback(() => {
    setWalletAddress('');
    setIsConnected(false);
    // ✅ Balance store'u da temizle
    setBalanceAddress(null);
    
    setState({
      address: null,
      isConnected: false,
      chainId: DEFAULT_CHAIN_ID,
      chainSupported: true,
      connecting: false,
      error: null,
    });
  }, [setWalletAddress, setIsConnected, setBalanceAddress]);

  // Call contract (read-only)
  const callContract = useCallback(async (
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<any> => {
    const currentProvider = getProvider();
    const contract = new ethers.Contract(contractAddress, abi, currentProvider);

    try {
      const result = await contract[functionName](...args);
      return result;
    } catch (err: any) {
      console.error(`Contract call failed: ${functionName}`, err);
      throw err;
    }
  }, [getProvider]);

  // Execute contract (write - requires signer)
  const executeContract = useCallback(async (
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<string> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected');
    }

    // TODO: Integrate WalletConnect signer
    throw new Error('Transaction signing requires WalletConnect. Please use web app.');
  }, [state.isConnected, state.address]);

  // Get token balance
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    decimals: number = 18
  ): Promise<string> => {
    if (!state.address) return '0';

    const currentProvider = getProvider();
    const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, tokenAbi, currentProvider);

    try {
      const balance = await contract.balanceOf(state.address);
      return ethers.utils.formatUnits(balance, decimals);
    } catch (err) {
      console.error('Failed to get token balance:', err);
      return '0';
    }
  }, [state.address, getProvider]);

  // Get native balance (ETH)
  const getNativeBalance = useCallback(async (): Promise<string> => {
    if (!state.address) return '0';

    const currentProvider = getProvider();
    try {
      const balance = await currentProvider.getBalance(state.address);
      return ethers.utils.formatEther(balance);
    } catch (err) {
      console.error('Failed to get native balance:', err);
      return '0';
    }
  }, [state.address, getProvider]);

  // Approve token spending
  const approveToken = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    decimals: number = 18
  ): Promise<string> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected');
    }

    // TODO: Integrate WalletConnect
    throw new Error('Token approval requires WalletConnect. Please use web app.');
  }, [state.isConnected, state.address]);

  // Get allowance
  const getAllowance = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    decimals: number = 18
  ): Promise<string> => {
    if (!state.address) return '0';

    const currentProvider = getProvider();
    const tokenAbi = ['function allowance(address owner, address spender) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, tokenAbi, currentProvider);

    try {
      const allowance = await contract.allowance(state.address, spenderAddress);
      return ethers.utils.formatUnits(allowance, decimals);
    } catch (err) {
      console.error('Failed to get allowance:', err);
      return '0';
    }
  }, [state.address, getProvider]);

  // Format address for display
  const formatAddress = useCallback((address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Get explorer URL
  const getExplorerUrl = useCallback((txHash: string): string => {
    const chainConfig = SUPPORTED_CHAINS[state.chainId || DEFAULT_CHAIN_ID];
    return `${chainConfig.explorer}/tx/${txHash}`;
  }, [state.chainId]);

  return {
    // State
    address: state.address,
    isConnected: state.isConnected,
    chainId: state.chainId,
    chainSupported: state.chainSupported,
    connecting: state.connecting,
    error: state.error,

    // Chain info
    chainName: SUPPORTED_CHAINS[state.chainId || DEFAULT_CHAIN_ID]?.name || 'Unknown',
    supportedChains: SUPPORTED_CHAINS,

    // Actions
    connect,
    disconnect,
    switchChain,

    // Contract interactions
    callContract,
    executeContract,

    // Token operations
    getTokenBalance,
    getNativeBalance,
    approveToken,
    getAllowance,

    // Utilities
    formatAddress,
    getExplorerUrl,
    getProvider,
  };
}

export default useWallet;
