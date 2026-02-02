// services/WalletConnectService.ts
// WalletConnect v2 Integration for External Wallets

import { ethers } from 'ethers';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
const PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id';

// Supported chains
const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    currency: 'ETH',
    explorer: 'https://etherscan.io',
  },
  8453: {
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    currency: 'ETH',
    explorer: 'https://basescan.org',
  },
  84532: {
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    currency: 'ETH',
    explorer: 'https://sepolia.basescan.org',
  },
};

export interface WalletConnectSession {
  address: string;
  chainId: number;
  connected: boolean;
}

export interface PendingRequest {
  id: number;
  method: string;
  params: any[];
}

type EventCallback = (data: any) => void;

class WalletConnectService {
  private provider: any = null;
  private session: WalletConnectSession | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid issues on web
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      
      this.provider = await UniversalProvider.init({
        projectId: PROJECT_ID,
        metadata: {
          name: 'Auxite Wallet',
          description: 'Precious Metal Backed Digital Assets',
          url: 'https://auxite.io',
          icons: ['https://auxite.io/icon.png'],
        },
        relayUrl: 'wss://relay.walletconnect.com',
      });

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('WalletConnect init error:', error);
      throw new Error('Failed to initialize WalletConnect');
    }
  }

  private setupEventListeners(): void {
    if (!this.provider) return;

    // Session events
    this.provider.on('session_event', (event: any) => {
      console.log('WC session_event:', event);
      this.emit('session_event', event);
    });

    this.provider.on('session_update', (event: any) => {
      console.log('WC session_update:', event);
      if (event.namespaces?.eip155?.accounts?.[0]) {
        const [namespace, chainId, address] = event.namespaces.eip155.accounts[0].split(':');
        this.session = {
          address,
          chainId: parseInt(chainId),
          connected: true,
        };
        this.emit('session_update', this.session);
      }
    });

    this.provider.on('session_delete', () => {
      console.log('WC session_delete');
      this.session = null;
      this.emit('disconnect', null);
    });

    // Display URI for QR code
    this.provider.on('display_uri', (uri: string) => {
      console.log('WC display_uri:', uri);
      this.emit('display_uri', uri);
    });
  }

  // ============================================
  // CONNECTION
  // ============================================

  async connect(chainId: number = 84532): Promise<WalletConnectSession> {
    if (!this.provider) {
      await this.initialize();
    }

    try {
      // Request session
      const session = await this.provider.connect({
        namespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
              'eth_signTypedData_v4',
            ],
            chains: [`eip155:${chainId}`],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {
              [chainId]: SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.rpcUrl || SUPPORTED_CHAINS[84532].rpcUrl,
            },
          },
        },
      });

      // Extract address from session
      const accounts = session.namespaces.eip155.accounts;
      if (accounts && accounts.length > 0) {
        const [namespace, chain, address] = accounts[0].split(':');
        this.session = {
          address,
          chainId: parseInt(chain),
          connected: true,
        };
        
        this.emit('connect', this.session);
        return this.session;
      }

      throw new Error('No accounts returned');
    } catch (error) {
      console.error('WalletConnect connect error:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      try {
        await this.provider.disconnect();
      } catch (error) {
        console.error('WalletConnect disconnect error:', error);
      }
    }
    this.session = null;
    this.emit('disconnect', null);
  }

  // ============================================
  // SESSION STATE
  // ============================================

  isConnected(): boolean {
    return this.session?.connected || false;
  }

  getSession(): WalletConnectSession | null {
    return this.session;
  }

  getAddress(): string | null {
    return this.session?.address || null;
  }

  getChainId(): number | null {
    return this.session?.chainId || null;
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  async sendTransaction(tx: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
  }): Promise<string> {
    if (!this.session || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const txParams = {
        from: this.session.address,
        to: tx.to,
        value: tx.value ? ethers.toBeHex(ethers.parseEther(tx.value)) : '0x0',
        data: tx.data || '0x',
        gasLimit: tx.gasLimit,
      };

      const hash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      }, `eip155:${this.session.chainId}`);

      return hash;
    } catch (error) {
      console.error('WC sendTransaction error:', error);
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.session || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [ethers.hexlify(ethers.toUtf8Bytes(message)), this.session.address],
      }, `eip155:${this.session.chainId}`);

      return signature;
    } catch (error) {
      console.error('WC signMessage error:', error);
      throw error;
    }
  }

  async signTypedData(typedData: any): Promise<string> {
    if (!this.session || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'eth_signTypedData_v4',
        params: [this.session.address, JSON.stringify(typedData)],
      }, `eip155:${this.session.chainId}`);

      return signature;
    } catch (error) {
      console.error('WC signTypedData error:', error);
      throw error;
    }
  }

  // ============================================
  // CONTRACT INTERACTIONS
  // ============================================

  async callContract(
    contractAddress: string,
    abi: ethers.InterfaceAbi,
    method: string,
    args: any[] = []
  ): Promise<any> {
    const chainConfig = SUPPORTED_CHAINS[this.session?.chainId as keyof typeof SUPPORTED_CHAINS];
    if (!chainConfig) throw new Error('Unsupported chain');

    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    return contract[method](...args);
  }

  async executeContract(
    contractAddress: string,
    abi: ethers.InterfaceAbi,
    method: string,
    args: any[] = [],
    value?: string
  ): Promise<string> {
    if (!this.session || !this.provider) {
      throw new Error('Wallet not connected');
    }

    // Encode function call
    const iface = new ethers.Interface(abi);
    const data = iface.encodeFunctionData(method, args);

    return this.sendTransaction({
      to: contractAddress,
      data,
      value,
    });
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  getSupportedChains(): typeof SUPPORTED_CHAINS {
    return SUPPORTED_CHAINS;
  }

  getExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string | null {
    const chainConfig = SUPPORTED_CHAINS[this.session?.chainId as keyof typeof SUPPORTED_CHAINS];
    if (!chainConfig) return null;
    
    return `${chainConfig.explorer}/${type}/${hash}`;
  }
}

// Singleton instance
export const walletConnectService = new WalletConnectService();
export default walletConnectService;
