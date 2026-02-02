// hooks/useCrossAuth.ts
// Cross-device authentication hook
// Fixed: No direct expo-notifications import

import { useState, useCallback } from 'react';
import { Linking, Alert, Platform } from 'react-native';
import { useStore } from '@/stores/useStore';

interface CrossAuthState {
  isLoading: boolean;
  error: string | null;
  sessionToken: string | null;
}

export function useCrossAuth() {
  const [state, setState] = useState<CrossAuthState>({
    isLoading: false,
    error: null,
    sessionToken: null,
  });

  const { walletAddress, isConnected } = useStore();

  // Generate session token for web login
  const generateSessionToken = useCallback(async (): Promise<string | null> => {
    if (!isConnected || !walletAddress) {
      Alert.alert('Error', 'Please connect your wallet first');
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Mock token generation
      const token = `auxite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setState(prev => ({ ...prev, isLoading: false, sessionToken: token }));
      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate session';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, [walletAddress, isConnected]);

  // Open web app with authentication
  const openInWeb = useCallback(async (path: string = '/') => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const token = await generateSessionToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const webUrl = `https://app.auxite.io${path}?auth_token=${token}&wallet=${walletAddress}`;
      const canOpen = await Linking.canOpenURL(webUrl);
      
      if (canOpen) {
        await Linking.openURL(webUrl);
      } else {
        Alert.alert('Error', 'Cannot open web browser');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open web app');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletAddress, generateSessionToken]);

  // Handle QR code scan result
  const handleQRScan = useCallback(async (data: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const qrData = JSON.parse(data);
      
      if (!qrData.sessionId || !qrData.token) {
        throw new Error('Invalid QR code');
      }

      Alert.alert('Success', 'Web session authenticated successfully');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Invalid or expired QR code');
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletAddress]);

  // Share session via deep link
  const shareSession = useCallback(async () => {
    const token = await generateSessionToken();
    if (!token) return null;

    const deepLink = `auxite://auth?token=${token}&wallet=${walletAddress}`;
    return deepLink;
  }, [walletAddress, generateSessionToken]);

  return {
    ...state,
    openInWeb,
    handleQRScan,
    generateSessionToken,
    shareSession,
  };
}

export default useCrossAuth;
