// app/contexts/AuthContext.tsx
// Authentication Context for managing auth state

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

// ⚠️ SECURITY: Token'lar artık SecureStore'da şifreli saklanıyor
// AsyncStorage güvensizdi - veriler plaintext olarak depolanıyordu

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wallet.auxite.io';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  picture?: string;
  emailVerified: boolean;
  walletAddress: string;
  authProvider: 'email' | 'google' | 'apple';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasWallet: boolean;
  
  // Actions
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  linkWallet: (walletAddress: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ══════════════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ══════════════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ════════════════════════════════════════════════════════════════════════════
  // LOAD STORED AUTH
  // ════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // 🔒 SECURITY: SecureStore kullanarak şifreli depolama
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync('authToken'),
        SecureStore.getItemAsync('user'),
      ]);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Verify token is still valid
        verifyToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        }
      } else {
        // Token invalid, clear auth
        await logout();
      }
    } catch (error) {
      // Network error, keep local auth but don't clear
      console.error('Token verification error:', error);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH ACTIONS
  // ════════════════════════════════════════════════════════════════════════════
  
  const login = async (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);

    // 🔒 SECURITY: Güvenli depolama ile token kaydet
    await Promise.all([
      SecureStore.setItemAsync('authToken', newToken),
      SecureStore.setItemAsync('user', JSON.stringify(newUser)),
    ]);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);

    // 🔒 SECURITY: Güvenli depolamadan temizle
    await Promise.all([
      SecureStore.deleteItemAsync('authToken'),
      SecureStore.deleteItemAsync('user'),
    ]);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success && data.user) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const linkWallet = async (walletAddress: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/link-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user and token - 🔒 SECURITY: SecureStore kullan
        if (data.user) {
          setUser(data.user);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        }
        if (data.token) {
          setToken(data.token);
          await SecureStore.setItemAsync('authToken', data.token);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Link wallet error:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    if (token) {
      await verifyToken(token);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ════════════════════════════════════════════════════════════════════════════
  
  const isAuthenticated = !!user && !!token;
  const hasWallet = !!user?.walletAddress;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        hasWallet,
        login,
        logout,
        updateUser,
        linkWallet,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════════════════

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY HOOK - API requests with auth
// ══════════════════════════════════════════════════════════════════════════════

export function useAuthenticatedFetch() {
  const { token, logout } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, logout
    if (response.status === 401) {
      await logout();
      throw new Error('Unauthorized');
    }

    return response;
  };

  return authFetch;
}
