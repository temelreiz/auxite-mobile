// components/DelegationApproval.tsx
// Web3Modal ile on-chain staking için component

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers-react-native';
import { ethers } from 'ethers';
import { Ionicons } from '@expo/vector-icons';

// V8 Token ABI
const TOKEN_V8_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

// Staking V2 ABI
const STAKING_V2_ABI = [
  'function stake(bytes32 metalId, uint256 amount, uint256 durationMonths, bool compounding, uint256 allocationId) returns (uint256 stakeId, bytes32 stakeCode)',
];

// Contract Addresses
const TOKEN_V8_ADDRESSES: Record<string, string> = {
  AUXG: '0xD14D32B1e03B3027D1f8381EeeC567e147De9CCe',
  AUXS: '0xc924EE950BF5A5Fbe3c26eECB27D99031B441caD',
  AUXPT: '0x37402EA435a91567223C132414C3A50C6bBc7200',
  AUXPD: '0x6026338B9Bfd94fed07EA61cbE60b15e300911DC',
};

const STAKING_V2_ADDRESS = '0x96ff8358183BA045e3d6cDA4ca2AfF30423A9dC8';

interface OnChainStakeProps {
  metal: string;
  amount: number;
  durationMonths: 3 | 6 | 12;
  isDark: boolean;
  onSuccess: (txHash: string, stakeCode: string) => void;
  onError: (error: string) => void;
}

export default function OnChainStake({ metal, amount, durationMonths, isDark, onSuccess, onError }: OnChainStakeProps) {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'idle' | 'approve' | 'stake'>('idle');

  const handleStake = async () => {
    if (!isConnected || !walletProvider || !address) {
      open();
      return;
    }

    try {
      setIsProcessing(true);
      
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      
      const tokenAddress = TOKEN_V8_ADDRESSES[metal.toUpperCase()];
      if (!tokenAddress) {
        throw new Error('Geçersiz metal');
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_V8_ABI, signer);
      const stakingContract = new ethers.Contract(STAKING_V2_ADDRESS, STAKING_V2_ABI, signer);
      
      // Amount in token units (3 decimals)
      const amountUnits = BigInt(Math.floor(amount * 1000));
      
      // Step 1: Check allowance
      setStep('approve');
      const allowance = await tokenContract.allowance(address, STAKING_V2_ADDRESS);
      
      if (allowance < amountUnits) {
        // Approve
        const approveTx = await tokenContract.approve(STAKING_V2_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      // Step 2: Stake
      setStep('stake');
      const metalId = ethers.keccak256(ethers.toUtf8Bytes(metal.toUpperCase()));
      
      const stakeTx = await stakingContract.stake(
        metalId,
        amountUnits,
        BigInt(durationMonths),
        false, // compounding
        BigInt(0) // allocationId
      );
      
      const receipt = await stakeTx.wait();
      
      // Parse stake code from logs
      let stakeCode = '';
      for (const log of receipt.logs) {
        try {
          const parsed = stakingContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed && parsed.name === 'Staked') {
            stakeCode = parsed.args[1];
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      onSuccess(receipt.hash, stakeCode);
      
    } catch (error: any) {
      console.error('Stake error:', error);
      onError(error.message || 'Stake işlemi başarısız');
    } finally {
      setIsProcessing(false);
      setStep('idle');
    }
  };

  if (!isConnected) {
    return (
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#3b82f6' }]}
        onPress={() => open()}
      >
        <Ionicons name="wallet-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>Cüzdan Bağla</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: isProcessing ? '#64748b' : '#10b981' }]}
      onPress={handleStake}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.buttonText}>
            {step === 'approve' ? 'Onaylanıyor...' : 'Stake Ediliyor...'}
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={styles.buttonText}>On-Chain Stake</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
