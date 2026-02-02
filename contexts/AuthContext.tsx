// app/contexts/AuthContext.tsx
// Authentication Context for managing auth state

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('user'),
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
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
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
    
    await Promise.all([
      AsyncStorage.setItem('authToken', newToken),
      AsyncStorage.setItem('user', JSON.stringify(newUser)),
    ]);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    
    await Promise.all([
      AsyncStorage.removeItem('authToken'),
      AsyncStorage.removeItem('user'),
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
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
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
        // Update user and token
        if (data.user) {
          setUser(data.user);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.token) {
          setToken(data.token);
          await AsyncStorage.setItem('authToken', data.token);
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
