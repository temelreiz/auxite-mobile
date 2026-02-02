import { createWeb3Modal, defaultConfig } from '@web3modal/ethers-react-native';

// Reown Cloud Project ID
export const projectId = '3a14105336ff5cc9242e7526aaeacb79';

// Sepolia chain config
export const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://sepolia.infura.io/v3/06f4a3d8bae44ffb889975d654d8a680',
};

const metadata = {
  name: 'Auxite Wallet',
  description: 'Precious Metals Trading Platform',
  url: 'https://auxite.io',
  icons: ['https://auxite.io/icon.png'],
  redirect: {
    native: 'auxitewallet://',
  },
};

let initialized = false;

export function initWeb3Modal() {
  if (initialized) return true;
  
  try {
    // Check if crypto is available
    if (typeof global.crypto === 'undefined' || !global.crypto.getRandomValues) {
      console.log('⏳ Crypto not ready yet');
      return false;
    }
    
    const config = defaultConfig({ metadata });
    
    createWeb3Modal({
      projectId,
      chains: [sepolia],
      config,
      enableAnalytics: false,
    });
    
    initialized = true;
    console.log('✅ Web3Modal initialized');
    return true;
  } catch (e) {
    console.error('Web3Modal init error:', e);
    return false;
  }
}

export function isWeb3ModalReady() {
  return initialized;
}
