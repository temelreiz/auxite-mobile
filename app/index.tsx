// app/index.tsx
// Entry point - redirects based on auth state

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  
  // Get store setters
  const { 
    setWalletAddress, 
    setIsLoggedIn, 
    setUserEmail, 
    setUserId, 
    setUserName 
  } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [token, userStr, walletAddr] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('auxite_wallet_address'), // Also check WalletOnboarding key
      ]);

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        
        // Check if email is verified
        if (userData.emailVerified) {
          setIsAuthenticated(true);
          setIsLoggedIn(true);
          
          // Set user info in store
          if (userData.email) setUserEmail(userData.email);
          if (userData.id) setUserId(userData.id);
          if (userData.name) setUserName(userData.name);
          
          // Check wallet address from multiple sources
          const walletAddress = userData.walletAddress || walletAddr;
          
          if (walletAddress && walletAddress.length > 0) {
            setHasWallet(true);
            // ✅ Set wallet address in global store
            setWalletAddress(walletAddress);
            console.log('✅ Wallet address loaded:', walletAddress);
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Not authenticated -> Login
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  // Authenticated but no wallet -> Wallet Onboarding
  if (!hasWallet) {
    return <Redirect href="/wallet-onboarding" />;
  }

  // Authenticated with wallet -> Main app
  return <Redirect href="/(tabs)" />;
}
