// services/CrossAuthService.ts
// Binance-style Cross-Platform Authentication
// Supports: QR Scan (Mobile→Web) + Push Notification (Web→Mobile)

import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useStore } from '@/stores/useStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://auxite-wallet.vercel.app';
const APP_SCHEME = 'auxite';

// ============================================
// TYPES
// ============================================

export interface PairingSession {
  sessionId: string;
  pairingCode: string;        // 6-digit code
  qrData: string;             // Full QR content
  walletAddress: string;
  sourceDevice: 'mobile' | 'web';
  targetDevice: 'mobile' | 'web';
  action?: string;            // Optional: specific page/action
  expiresAt: number;
  status: 'pending' | 'confirmed' | 'expired' | 'rejected';
}

export interface AuthRequest {
  requestId: string;
  fromDevice: 'web' | 'mobile';
  action: string;
  actionData?: Record<string, any>;
  walletAddress: string;
  timestamp: number;
  expiresAt: number;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  pushToken?: string;
  lastActive: number;
}

type EventCallback = (data: any) => void;

// ============================================
// CROSS AUTH SERVICE
// ============================================

class CrossAuthService {
  private pushToken: string | null = null;
  private deviceId: string | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') return;

    // Request push notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      this.pushToken = tokenData.data;
    }

    // Generate unique device ID
    this.deviceId = await this.getOrCreateDeviceId();

    // Setup notification handlers
    this.setupNotificationHandlers();

    // Register device with backend
    await this.registerDevice();
  }

  private async getOrCreateDeviceId(): Promise<string> {
    // In production, use expo-secure-store
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    let deviceId = await AsyncStorage.getItem('auxite_device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await AsyncStorage.setItem('auxite_device_id', deviceId);
    }
    
    return deviceId;
  }

  private setupNotificationHandlers(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      if (data?.type === 'auth_request') {
        this.emit('auth_request', data as AuthRequest);
      }
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'auth_request') {
        this.emit('auth_request_tap', data as AuthRequest);
      }
    });
  }

  private async registerDevice(): Promise<void> {
    const { walletAddress } = useStore.getState();
    if (!walletAddress || !this.deviceId) return;

    try {
      await fetch(`${API_BASE_URL}/api/auth/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          walletAddress,
          platform: Platform.OS,
          pushToken: this.pushToken,
        }),
      });
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }

  // ============================================
  // MOBILE → WEB (QR SCAN)
  // ============================================

  /**
   * Generate QR code data for web login
   * Called from WEB to display QR
   */
  async createWebLoginSession(): Promise<PairingSession> {
    const response = await fetch(`${API_BASE_URL}/api/auth/pair/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDevice: 'web',
        targetDevice: 'mobile',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create pairing session');
    }

    const session: PairingSession = await response.json();
    return session;
  }

  /**
   * Scan and verify QR code from mobile
   * Called from MOBILE after scanning
   */
  async verifyQRCode(qrData: string): Promise<{
    success: boolean;
    session?: PairingSession;
    error?: string;
  }> {
    const { walletAddress } = useStore.getState();
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Parse QR data
      const parsed = this.parseQRData(qrData);
      if (!parsed) {
        return { success: false, error: 'Invalid QR code' };
      }

      // Verify with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/pair/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: parsed.sessionId,
          pairingCode: parsed.code,
          walletAddress,
          deviceId: this.deviceId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, session: result.session };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm pairing from mobile
   * User approves the web login
   */
  async confirmPairing(sessionId: string, approve: boolean): Promise<boolean> {
    const { walletAddress } = useStore.getState();
    
    try {
      // Sign a message to prove ownership
      const message = `Auxite Auth: ${sessionId}:${Date.now()}`;
      // In real implementation, sign with wallet
      const signature = 'user_approved'; // Placeholder

      const response = await fetch(`${API_BASE_URL}/api/auth/pair/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          walletAddress,
          approved: approve,
          signature,
          deviceId: this.deviceId,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Confirm pairing error:', error);
      return false;
    }
  }

  /**
   * Poll for pairing status (called from web)
   */
  async checkPairingStatus(sessionId: string): Promise<PairingSession | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/pair/status/${sessionId}`);
      
      if (!response.ok) return null;
      
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Start polling for pairing confirmation (web side)
   */
  startPairingPoll(sessionId: string, onConfirmed: (session: PairingSession) => void): void {
    this.stopPairingPoll();

    this.pollInterval = setInterval(async () => {
      const session = await this.checkPairingStatus(sessionId);
      
      if (session?.status === 'confirmed') {
        this.stopPairingPoll();
        onConfirmed(session);
      } else if (session?.status === 'expired' || session?.status === 'rejected') {
        this.stopPairingPoll();
        this.emit('pairing_failed', session);
      }
    }, 2000); // Poll every 2 seconds
  }

  stopPairingPoll(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // ============================================
  // WEB → MOBILE (PUSH NOTIFICATION)
  // ============================================

  /**
   * Request mobile confirmation from web
   * Sends push notification to mobile
   */
  async requestMobileAuth(action: string, actionData?: Record<string, any>): Promise<{
    success: boolean;
    requestId?: string;
    error?: string;
  }> {
    const { walletAddress } = useStore.getState();
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mobile-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          action,
          actionData,
          sourceDevice: 'web',
        }),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm auth request from mobile
   * Called when user taps "Approve" on notification
   */
  async confirmAuthRequest(requestId: string, approve: boolean): Promise<boolean> {
    const { walletAddress } = useStore.getState();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mobile-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          walletAddress,
          approved: approve,
          deviceId: this.deviceId,
        }),
      });

      const result = await response.json();
      
      if (result.success && approve && result.deepLink) {
        // Open the requested page in mobile app
        Linking.openURL(result.deepLink);
      }

      return result.success;
    } catch (error) {
      console.error('Confirm auth request error:', error);
      return false;
    }
  }

  /**
   * Check auth request status (called from web)
   */
  async checkAuthRequestStatus(requestId: string): Promise<{
    status: 'pending' | 'confirmed' | 'rejected' | 'expired';
    token?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mobile-status/${requestId}`);
      return await response.json();
    } catch {
      return { status: 'expired' };
    }
  }

  // ============================================
  // DEEP LINKING
  // ============================================

  /**
   * Generate deep link for specific action
   */
  generateDeepLink(path: string, params?: Record<string, string>): string {
    let url = `${APP_SCHEME}://${path}`;
    
    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }
    
    return url;
  }

  /**
   * Generate web URL with auth token
   */
  generateWebAuthUrl(token: string, path: string = '/'): string {
    const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.auxite.io';
    return `${webBaseUrl}${path}?authToken=${token}`;
  }

  /**
   * Handle incoming deep link
   */
  handleDeepLink(url: string): { path: string; params: Record<string, string> } | null {
    try {
      const parsed = Linking.parse(url);
      return {
        path: parsed.path || '/',
        params: (parsed.queryParams as Record<string, string>) || {},
      };
    } catch {
      return null;
    }
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Create authenticated session token
   */
  async createSessionToken(walletAddress: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          deviceId: this.deviceId,
          platform: Platform.OS,
        }),
      });

      const result = await response.json();
      return result.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Verify session token
   */
  async verifySessionToken(token: string): Promise<{
    valid: boolean;
    walletAddress?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      return await response.json();
    } catch {
      return { valid: false };
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  private parseQRData(qrData: string): { sessionId: string; code: string } | null {
    try {
      // QR format: auxite://auth?session=xxx&code=yyy
      // or JSON: { sessionId: "xxx", code: "yyy" }
      
      if (qrData.startsWith('auxite://')) {
        const url = new URL(qrData);
        const sessionId = url.searchParams.get('session');
        const code = url.searchParams.get('code');
        if (sessionId && code) {
          return { sessionId, code };
        }
      } else if (qrData.startsWith('{')) {
        const parsed = JSON.parse(qrData);
        if (parsed.sessionId && parsed.code) {
          return parsed;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate 6-digit pairing code
   */
  generatePairingCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

  // Getters
  getPushToken(): string | null {
    return this.pushToken;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }
}

// Singleton
export const crossAuthService = new CrossAuthService();
export default crossAuthService;
