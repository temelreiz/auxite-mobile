// services/WalletService.ts
// WalletConnect + Ethers.js integration for React Native

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Network Configuration - Sepolia Testnet
export const NETWORK_CONFIG = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia',
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with your key
  blockExplorer: 'https://sepolia.etherscan.io',
  currency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Contract Addresses (Sepolia)
export const CONTRACTS = {
  // Metal Tokens
  AUXG: '0xBF74Fc9f0dD50A79f9FaC2e9Aa05a268E3dcE6b6',
  AUXS: '0x705D9B193e5E349847C2Efb18E68fe989eC2C0e9',
  AUXPT: '0x1819447f624D8e22C1A4F3B14e96693625B6d74F',
  AUXPD: '0xb23545dE86bE9F65093D3a51a6ce52Ace0d8935E',
  
  // Exchange
  EXCHANGE: '0xCdFC3e54Bf2A884cd647dC205c89B46C878072Fc',
  USDT: '0x738e3134d83014B7a63CFF08C13CBBF0671EEeF2',
  
  // Leasing Contracts
  AUXG_LEASING: '0xe63050b6d0497a970d3fB44EBF428742631d1006',
  AUXS_LEASING: '0x6396163f0CeA0EdC639c353f6D1EbCd7C5427945',
  AUXPT_LEASING: '0xeB95c1C459506F6265c800C64D3423005499C3Ea',
  AUXPD_LEASING: '0x587706Bf9A907288145cfFc35b57818Df4db68A4',
} as const;

// ABIs
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export const LEASING_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 index) external',
  'function numPositions(address user) view returns (uint256)',
  'function getPosition(address user, uint256 index) view returns (uint256 amount, uint64 startTime, uint64 endTime, bool closed, bool rewardClaimed)',
  'function rewardRate() view returns (uint256)',
  'function lockDuration() view returns (uint256)',
];

export const EXCHANGE_ABI = [
  'function swap(address fromToken, address toToken, uint256 fromAmount) returns (uint256 toAmount)',
  'function getExchangeRate(address fromToken, address toToken, uint256 fromAmount) view returns (uint256 toAmount, uint256 fee)',
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  balanceFormatted: number;
  decimals: number;
}

export interface StakingPosition {
  index: number;
  amount: string;
  amountFormatted: number;
  startTime: number;
  endTime: number;
  closed: boolean;
  rewardClaimed: boolean;
  progress: number;
  isMatured: boolean;
  metal: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WALLET SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  private chainId: number | null = null;
  private listeners: Array<(state: WalletState) => void> = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Connect to wallet via WalletConnect or injected provider
   */
  async connect(walletType: 'walletconnect' | 'metamask' = 'walletconnect'): Promise<{
    success: boolean;
    address?: string;
    error?: string;
  }> {
    try {
      // For React Native, we'll use WalletConnect
      // This is a simplified version - in production use @walletconnect/modal
      
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Browser/WebView with injected provider
        const ethereum = (window as any).ethereum;
        
        // Request accounts
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
          return { success: false, error: 'No accounts found' };
        }

        // Create provider and signer
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        this.address = accounts[0];
        
        // Get chain ID
        const network = await this.provider.getNetwork();
        this.chainId = Number(network.chainId);

        // Check if correct network
        if (this.chainId !== NETWORK_CONFIG.chainId) {
          await this.switchNetwork();
        }

        // Save connection
        await this.saveConnection();
        
        // Notify listeners
        this.notifyListeners();

        // Setup event listeners
        this.setupEventListeners(ethereum);

        return { success: true, address: this.address };
      } else {
        // No injected provider - need WalletConnect
        return { 
          success: false, 
          error: 'No wallet detected. Please install MetaMask or use WalletConnect.' 
        };
      }
    } catch (error: any) {
      console.error('Wallet connect error:', error);
      return { success: false, error: error.message || 'Connection failed' };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    
    await AsyncStorage.removeItem('walletConnection');
    this.notifyListeners();
  }

  /**
   * Check if wallet was previously connected
   */
  async checkPreviousConnection(): Promise<boolean> {
    try {
      const saved = await AsyncStorage.getItem('walletConnection');
      if (saved) {
        const { address } = JSON.parse(saved);
        if (address) {
          // Try to reconnect
          const result = await this.connect();
          return result.success;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Switch to correct network
   */
  private async switchNetwork(): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: NETWORK_CONFIG.chainIdHex,
            chainName: NETWORK_CONFIG.name,
            rpcUrls: [NETWORK_CONFIG.rpcUrl],
            blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
            nativeCurrency: NETWORK_CONFIG.currency,
          }],
        });
      }
    }
  }

  /**
   * Save connection to storage
   */
  private async saveConnection(): Promise<void> {
    if (this.address) {
      await AsyncStorage.setItem('walletConnection', JSON.stringify({
        address: this.address,
        chainId: this.chainId,
        timestamp: Date.now(),
      }));
    }
  }

  /**
   * Setup event listeners for wallet changes
   */
  private setupEventListeners(ethereum: any): void {
    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.address = accounts[0];
        this.saveConnection();
        this.notifyListeners();
      }
    });

    ethereum.on('chainChanged', (chainId: string) => {
      this.chainId = parseInt(chainId, 16);
      this.notifyListeners();
    });

    ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  getState(): WalletState {
    return {
      isConnected: !!this.address,
      address: this.address,
      chainId: this.chainId,
      provider: this.provider,
      signer: this.signer,
    };
  }

  subscribe(callback: (state: WalletState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string): Promise<TokenBalance | null> {
    if (!this.provider || !this.address) return null;

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(this.address),
        contract.decimals(),
        contract.symbol(),
      ]);

      return {
        symbol,
        balance: balance.toString(),
        balanceFormatted: parseFloat(ethers.formatUnits(balance, decimals)),
        decimals,
      };
    } catch (error) {
      console.error('Get balance error:', error);
      return null;
    }
  }

  /**
   * Get all metal token balances
   */
  async getAllMetalBalances(): Promise<Record<string, TokenBalance>> {
    const balances: Record<string, TokenBalance> = {};

    for (const [symbol, address] of Object.entries({
      AUXG: CONTRACTS.AUXG,
      AUXS: CONTRACTS.AUXS,
      AUXPT: CONTRACTS.AUXPT,
      AUXPD: CONTRACTS.AUXPD,
    })) {
      const balance = await this.getTokenBalance(address);
      if (balance) {
        balances[symbol] = balance;
      }
    }

    return balances;
  }

  /**
   * Approve token spending
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const tx = await contract.approve(spenderAddress, amount);
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('Approve error:', error);
      return { success: false, error: error.message || 'Approval failed' };
    }
  }

  /**
   * Check token allowance
   */
  async checkAllowance(
    tokenAddress: string,
    spenderAddress: string
  ): Promise<string> {
    if (!this.provider || !this.address) return '0';

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const allowance = await contract.allowance(this.address, spenderAddress);
      return allowance.toString();
    } catch {
      return '0';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEASING / STAKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get leasing contract for metal
   */
  private getLeasingContract(metal: string): string {
    const contracts: Record<string, string> = {
      AUXG: CONTRACTS.AUXG_LEASING,
      AUXS: CONTRACTS.AUXS_LEASING,
      AUXPT: CONTRACTS.AUXPT_LEASING,
      AUXPD: CONTRACTS.AUXPD_LEASING,
    };
    return contracts[metal.toUpperCase()] || '';
  }

  /**
   * Deposit to leasing contract
   */
  async depositToLeasing(
    metal: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const leasingAddress = this.getLeasingContract(metal);
      const tokenAddress = CONTRACTS[metal.toUpperCase() as keyof typeof CONTRACTS];

      if (!leasingAddress || !tokenAddress) {
        return { success: false, error: 'Invalid metal' };
      }

      // Check and approve if needed
      const allowance = await this.checkAllowance(tokenAddress, leasingAddress);
      if (BigInt(allowance) < BigInt(amount)) {
        const approveResult = await this.approveToken(
          tokenAddress,
          leasingAddress,
          ethers.MaxUint256.toString()
        );
        if (!approveResult.success) {
          return { success: false, error: 'Approval failed: ' + approveResult.error };
        }
      }

      // Deposit
      const contract = new ethers.Contract(leasingAddress, LEASING_ABI, this.signer);
      const tx = await contract.deposit(amount);
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('Leasing deposit error:', error);
      return { success: false, error: error.message || 'Deposit failed' };
    }
  }

  /**
   * Withdraw from leasing contract
   */
  async withdrawFromLeasing(
    metal: string,
    positionIndex: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const leasingAddress = this.getLeasingContract(metal);
      if (!leasingAddress) {
        return { success: false, error: 'Invalid metal' };
      }

      const contract = new ethers.Contract(leasingAddress, LEASING_ABI, this.signer);
      const tx = await contract.withdraw(positionIndex);
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('Leasing withdraw error:', error);
      return { success: false, error: error.message || 'Withdrawal failed' };
    }
  }

  /**
   * Get staking positions for a metal
   */
  async getStakingPositions(metal: string): Promise<StakingPosition[]> {
    if (!this.provider || !this.address) return [];

    try {
      const leasingAddress = this.getLeasingContract(metal);
      if (!leasingAddress) return [];

      const contract = new ethers.Contract(leasingAddress, LEASING_ABI, this.provider);
      const numPositions = await contract.numPositions(this.address);
      
      const positions: StakingPosition[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < Number(numPositions); i++) {
        const [amount, startTime, endTime, closed, rewardClaimed] = await contract.getPosition(this.address, i);
        
        const startTimestamp = Number(startTime);
        const endTimestamp = Number(endTime);
        const duration = endTimestamp - startTimestamp;
        const elapsed = now - startTimestamp;
        const progress = Math.min(100, Math.round((elapsed / duration) * 100));

        positions.push({
          index: i,
          amount: amount.toString(),
          amountFormatted: parseFloat(ethers.formatUnits(amount, 18)),
          startTime: startTimestamp,
          endTime: endTimestamp,
          closed,
          rewardClaimed,
          progress,
          isMatured: now >= endTimestamp,
          metal,
        });
      }

      return positions;
    } catch (error) {
      console.error('Get positions error:', error);
      return [];
    }
  }

  /**
   * Get all staking positions for all metals
   */
  async getAllStakingPositions(): Promise<StakingPosition[]> {
    const allPositions: StakingPosition[] = [];

    for (const metal of ['AUXG', 'AUXS', 'AUXPT', 'AUXPD']) {
      const positions = await this.getStakingPositions(metal);
      allPositions.push(...positions);
    }

    return allPositions;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCHANGE / CONVERT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get exchange rate between two metals
   */
  async getExchangeRate(
    fromMetal: string,
    toMetal: string,
    amount: string
  ): Promise<{ toAmount: string; fee: string } | null> {
    if (!this.provider) return null;

    try {
      const fromToken = CONTRACTS[fromMetal.toUpperCase() as keyof typeof CONTRACTS];
      const toToken = CONTRACTS[toMetal.toUpperCase() as keyof typeof CONTRACTS];

      if (!fromToken || !toToken) return null;

      const contract = new ethers.Contract(CONTRACTS.EXCHANGE, EXCHANGE_ABI, this.provider);
      const [toAmount, fee] = await contract.getExchangeRate(fromToken, toToken, amount);

      return {
        toAmount: toAmount.toString(),
        fee: fee.toString(),
      };
    } catch (error) {
      console.error('Get exchange rate error:', error);
      return null;
    }
  }

  /**
   * Swap metals
   */
  async swapMetals(
    fromMetal: string,
    toMetal: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; toAmount?: string; error?: string }> {
    if (!this.signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const fromToken = CONTRACTS[fromMetal.toUpperCase() as keyof typeof CONTRACTS];
      const toToken = CONTRACTS[toMetal.toUpperCase() as keyof typeof CONTRACTS];

      if (!fromToken || !toToken) {
        return { success: false, error: 'Invalid metals' };
      }

      // Check and approve
      const allowance = await this.checkAllowance(fromToken, CONTRACTS.EXCHANGE);
      if (BigInt(allowance) < BigInt(amount)) {
        const approveResult = await this.approveToken(
          fromToken,
          CONTRACTS.EXCHANGE,
          ethers.MaxUint256.toString()
        );
        if (!approveResult.success) {
          return { success: false, error: 'Approval failed' };
        }
      }

      // Swap
      const contract = new ethers.Contract(CONTRACTS.EXCHANGE, EXCHANGE_ABI, this.signer);
      const tx = await contract.swap(fromToken, toToken, amount);
      const receipt = await tx.wait();

      // Get swap amount from events (simplified)
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('Swap error:', error);
      return { success: false, error: error.message || 'Swap failed' };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get block explorer URL
   */
  getExplorerUrl(txHash: string): string {
    return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
  }

  /**
   * Parse units to wei
   */
  parseUnits(amount: string, decimals: number = 18): string {
    return ethers.parseUnits(amount, decimals).toString();
  }

  /**
   * Format units from wei
   */
  formatUnits(amount: string, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }
}

export const walletService = new WalletService();
export default walletService;
