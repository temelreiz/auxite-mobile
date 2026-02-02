/**
 * Zustand Store
 * Global state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'system' | 'light' | 'dark';
export type LanguageType = 'tr' | 'en' | 'de' | 'fr' | 'ar' | 'ru';

interface StoreState {
  // Theme & Language
  theme: ThemeType;
  language: LanguageType;
  setTheme: (theme: ThemeType) => void;
  setLanguage: (language: LanguageType) => void;

  // Auth
  isLoggedIn: boolean;
  pendingVerificationEmail: string;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setPendingVerificationEmail: (email: string) => void;

  // Wallet
  isConnected: boolean;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  setIsConnected: (connected: boolean) => void;

  // User
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  setUserId: (id: string | null) => void;
  setUserEmail: (email: string | null) => void;
  setUserName: (name: string | null) => void;

  // KYC
  kycStatus: string;
  setKycStatus: (status: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  theme: 'system' as ThemeType,
  language: 'tr' as LanguageType,
  isLoggedIn: false,
  pendingVerificationEmail: '',
  isConnected: false,
  walletAddress: null,
  userId: null,
  userEmail: null,
  userName: null,
  kycStatus: 'none',
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setPendingVerificationEmail: (pendingVerificationEmail) => set({ pendingVerificationEmail }),

      setWalletAddress: (walletAddress) => set({ walletAddress, isConnected: !!walletAddress }),
      setIsConnected: (isConnected) => set({ isConnected }),

      setUserId: (userId) => set({ userId }),
      setUserEmail: (userEmail) => set({ userEmail }),
      setUserName: (userName) => set({ userName }),

      setKycStatus: (kycStatus) => set({ kycStatus }),

      reset: () => set(initialState),
    }),
    {
      name: 'auxite-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        walletAddress: state.walletAddress,
        isConnected: state.isConnected,
        isLoggedIn: state.isLoggedIn,
        kycStatus: state.kycStatus,
      }),
    }
  )
);
