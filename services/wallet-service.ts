// services/wallet-service.ts
// Non-custodial wallet operations - sign & send transactions

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ENCRYPTED_SEED: 'auxite_encrypted_seed',
  PASSWORD_HASH: 'auxite_password_hash',
  WALLET_ADDRESS: 'auxite_wallet_address',
};

// RPC URLs
const ETH_MAINNET_RPC = process.env.EXPO_PUBLIC_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';

// Platform hot wallet address (for receiving ETH)
const HOT_WALLET_ADDRESS = '0x7227130EAaad17a35300A90631984676d303f5A0';

// ============================================
// DECRYPT SEED
// ============================================
function decryptSeed(encryptedSeed: string): string[] | null {
  try {
    // Check if it's hex encoded
    if (/^[0-9a-fA-F]+$/.test(encryptedSeed) && encryptedSeed.length % 2 === 0) {
      let decoded = '';
      for (let i = 0; i < encryptedSeed.length; i += 2) {
        decoded += String.fromCharCode(parseInt(encryptedSeed.substr(i, 2), 16));
      }
      return decoded.split(',');
    }
    // Fallback: try direct split
    return encryptedSeed.split(',');
  } catch (error) {
    console.error('Decrypt seed error:', error);
    return null;
  }
}

// ============================================
// GET WALLET FROM STORAGE
// ============================================
export async function getWallet(): Promise<ethers.Wallet | null> {
  try {
    const encryptedSeed = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTED_SEED);
    if (!encryptedSeed) {
      console.error('No encrypted seed found');
      return null;
    }

    const seedWords = decryptSeed(encryptedSeed);
    if (!seedWords || seedWords.length < 12) {
      console.error('Invalid seed phrase');
      return null;
    }

    const mnemonic = seedWords.join(' ');
    
    // Create wallet from mnemonic
    let wallet: ethers.Wallet;
    
    // ethers v6
    if (ethers.Wallet.fromPhrase) {
      wallet = ethers.Wallet.fromPhrase(mnemonic);
    }
    // ethers v5
    else if ((ethers.Wallet as any).fromMnemonic) {
      wallet = (ethers.Wallet as any).fromMnemonic(mnemonic);
    }
    else {
      throw new Error('Unsupported ethers version');
    }

    return wallet;
  } catch (error) {
    console.error('Get wallet error:', error);
    return null;
  }
}

// ============================================
// GET WALLET WITH PROVIDER
// ============================================
export async function getWalletWithProvider(): Promise<ethers.Wallet | null> {
  try {
    const wallet = await getWallet();
    if (!wallet) return null;

    const provider = new ethers.JsonRpcProvider(ETH_MAINNET_RPC);
    return wallet.connect(provider);
  } catch (error) {
    console.error('Get wallet with provider error:', error);
    return null;
  }
}

// ============================================
// GET ETH BALANCE
// ============================================
export async function getEthBalance(address?: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(ETH_MAINNET_RPC);
    const addr = address || await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    if (!addr) return '0';
    
    const balance = await provider.getBalance(addr);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Get ETH balance error:', error);
    return '0';
  }
}

// ============================================
// CANCEL/REPLACE PENDING TRANSACTION
// ============================================
export async function cancelPendingTransactions(
  onStatusUpdate?: (status: string) => void
): Promise<TransferResult> {
  try {
    onStatusUpdate?.('preparing_wallet');
    
    const wallet = await getWalletWithProvider();
    if (!wallet) {
      return { success: false, error: 'wallet_not_found' };
    }

    // Get current nonce (pending)
    const pendingNonce = await wallet.provider!.getTransactionCount(wallet.address, 'pending');
    const confirmedNonce = await wallet.provider!.getTransactionCount(wallet.address, 'latest');
    
    console.log('Nonce check:', { pendingNonce, confirmedNonce });
    
    if (pendingNonce === confirmedNonce) {
      return { success: true, error: 'no_pending_transactions' };
    }

    onStatusUpdate?.('cancelling_transactions');
    
    // Cancel all pending transactions by sending 0 ETH to self with higher gas
    const txHashes: string[] = [];
    
    for (let nonce = confirmedNonce; nonce < pendingNonce; nonce++) {
      console.log(`Cancelling TX with nonce ${nonce}...`);
      
      const tx = {
        to: wallet.address, // Send to self
        value: BigInt(0),   // 0 ETH
        nonce: nonce,
        gasLimit: BigInt(21000),
        maxFeePerGas: BigInt(20000000000),      // 20 Gwei
        maxPriorityFeePerGas: BigInt(3000000000), // 3 Gwei
      };
      
      const txResponse = await wallet.sendTransaction(tx);
      txHashes.push(txResponse.hash);
      console.log(`Cancel TX sent: ${txResponse.hash}`);
    }
    
    return { 
      success: true, 
      txHash: txHashes.join(','),
    };
  } catch (error: any) {
    console.error('Cancel pending TX error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// TRANSFER ETH TO HOT WALLET
// ============================================
export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  details?: { available: string; required: string };
}

export async function transferEthToHotWallet(
  amount: number,
  onStatusUpdate?: (status: string) => void
): Promise<TransferResult> {
  try {
    onStatusUpdate?.('preparing_wallet');
    
    const wallet = await getWalletWithProvider();
    if (!wallet) {
      return { success: false, error: 'wallet_not_found' };
    }

    onStatusUpdate?.('checking_balance');
    
    // Check balance
    const balance = await wallet.provider!.getBalance(wallet.address);
    
    // Round amount to 18 decimals max (ETH precision limit)
    const roundedAmount = Math.floor(amount * 1e18) / 1e18;
    const amountWei = ethers.parseEther(roundedAmount.toFixed(18));
    
    console.log('💰 Balance check:', {
      walletAddress: wallet.address,
      balanceWei: balance.toString(),
      balanceEth: ethers.formatEther(balance),
      amountToSend: amount,
      roundedAmount: roundedAmount,
      amountWei: amountWei.toString(),
    });
    
    // Get current gas prices
    const feeData = await wallet.provider!.getFeeData();
    const estimatedGas = BigInt(21000); // Standard ETH transfer
    
    // Minimum gas prices (to avoid stuck transactions)
    const MIN_GAS_PRICE = BigInt(5000000000); // 5 Gwei minimum
    const MIN_PRIORITY_FEE = BigInt(1500000000); // 1.5 Gwei minimum priority
    
    // Calculate gas cost (use maxFeePerGas for EIP-1559 or gasPrice for legacy)
    let gasPrice = feeData.maxFeePerGas || feeData.gasPrice || MIN_GAS_PRICE;
    
    // Ensure minimum gas price
    if (gasPrice < MIN_GAS_PRICE) {
      gasPrice = MIN_GAS_PRICE;
      console.log('Gas price too low, using minimum:', MIN_GAS_PRICE.toString());
    }
    
    const gasCost = estimatedGas * gasPrice;
    
    console.log('Gas calculation:', {
      gasPrice: gasPrice.toString(),
      gasCost: ethers.formatEther(gasCost),
    });
    
    const totalRequired = amountWei + gasCost;
    
    console.log('💰 Total required:', {
      amountWei: amountWei.toString(),
      gasCost: gasCost.toString(),
      totalRequired: totalRequired.toString(),
      totalRequiredEth: ethers.formatEther(totalRequired),
      balance: balance.toString(),
      balanceEth: ethers.formatEther(balance),
      hasSufficientBalance: balance >= totalRequired,
    });
    
    if (balance < totalRequired) {
      const balanceEth = ethers.formatEther(balance);
      const requiredEth = ethers.formatEther(totalRequired);
      return { 
        success: false, 
        error: 'insufficient_balance',
        details: { available: parseFloat(balanceEth).toFixed(6), required: parseFloat(requiredEth).toFixed(6) }
      };
    }

    onStatusUpdate?.('signing_transaction');
    
    // Use feeData from balance check above
    // EIP-1559 or legacy transaction
    let txParams: any = {
      to: HOT_WALLET_ADDRESS,
      value: amountWei,
      gasLimit: estimatedGas,
    };
    
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      // EIP-1559 transaction (recommended)
      // Apply minimum values
      const maxFee = feeData.maxFeePerGas < MIN_GAS_PRICE ? MIN_GAS_PRICE : feeData.maxFeePerGas;
      const priorityFee = feeData.maxPriorityFeePerGas < MIN_PRIORITY_FEE ? MIN_PRIORITY_FEE : feeData.maxPriorityFeePerGas;
      
      txParams.maxFeePerGas = maxFee;
      txParams.maxPriorityFeePerGas = priorityFee;
      console.log('Using EIP-1559 gas:', {
        maxFeePerGas: (Number(maxFee) / 1e9).toFixed(2) + ' Gwei',
        maxPriorityFeePerGas: (Number(priorityFee) / 1e9).toFixed(2) + ' Gwei',
      });
    } else {
      // Legacy transaction
      const legacyGasPrice = feeData.gasPrice && feeData.gasPrice > MIN_GAS_PRICE 
        ? feeData.gasPrice 
        : MIN_GAS_PRICE;
      txParams.gasPrice = legacyGasPrice;
      console.log('Using legacy gas price:', (Number(legacyGasPrice) / 1e9).toFixed(2) + ' Gwei');
    }

    onStatusUpdate?.('sending_transaction');
    
    // Send transaction
    const txResponse = await wallet.sendTransaction(txParams);
    
    onStatusUpdate?.('waiting_confirmation');
    
    // Don't wait for confirmation - continue immediately after tx is sent
    // The backend will verify the transaction
    // const receipt = await txResponse.wait(1);
    
    return { 
      success: true, 
      txHash: txResponse.hash 
    };
  } catch (error: any) {
    console.error('Transfer ETH error:', error);
    
    let errorKey = 'transfer_failed';
    if (error.message?.includes('insufficient funds')) {
      errorKey = 'insufficient_balance_gas';
    } else if (error.message?.includes('user rejected')) {
      errorKey = 'transaction_cancelled';
    } else if (error.message?.includes('network')) {
      errorKey = 'network_error';
    }
    
    return { success: false, error: errorKey };
  }
}

// ============================================
// SIGN MESSAGE (for future use)
// ============================================
export async function signMessage(message: string): Promise<string | null> {
  try {
    const wallet = await getWallet();
    if (!wallet) return null;
    
    return await wallet.signMessage(message);
  } catch (error) {
    console.error('Sign message error:', error);
    return null;
  }
}

// ============================================
// VERIFY WALLET OWNERSHIP
// ============================================
export async function verifyWalletOwnership(): Promise<boolean> {
  try {
    const storedAddress = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    if (!storedAddress) return false;
    
    const wallet = await getWallet();
    if (!wallet) return false;
    
    return wallet.address.toLowerCase() === storedAddress.toLowerCase();
  } catch (error) {
    console.error('Verify wallet ownership error:', error);
    return false;
  }
}
