// app/wallet-onboarding.tsx
// WalletOnboarding Sayfası - Expo Router

import React from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletOnboarding from '../components/WalletOnboarding';
import { useStore } from '@/stores/useStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wallet.auxite.io';

export default function WalletOnboardingScreen() {
  const router = useRouter();
  const { language, setWalletAddress } = useStore();

  const handleWalletReady = async (address: string) => {
    console.log('Wallet ready:', address);
    
    try {
      // 1. Global state'i güncelle
      setWalletAddress(address);
      
      // 2. AsyncStorage'daki user objesini güncelle
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.walletAddress = address;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      
      // 3. Backend'e wallet address'i kaydet
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await fetch(`${API_URL}/api/auth/link-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ walletAddress: address }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Wallet linked to account successfully');
          
          // Backend'den gelen güncel user ve token'ı kaydet
          if (data.user) {
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
          }
          if (data.token) {
            await AsyncStorage.setItem('authToken', data.token);
          }
        } else {
          console.warn('Failed to link wallet:', data.error);
        }
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
    }
    
    // Ana sayfaya yönlendir
    router.replace('/(tabs)');
  };

  return (
    <WalletOnboarding
      lang={language as 'tr' | 'en' | 'de' | 'fr' | 'ar' | 'ru'}
      onWalletReady={handleWalletReady}
    />
  );
}
