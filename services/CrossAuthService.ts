// services/CrossAuthService.ts
// Cross-device authentication service
// Supports: QR Scan (Mobile→Web) + Push Notification (Web→Mobile)

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useStore } from '@/stores/useStore';

// Conditional import for expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not available');
}

interface AuthRequest {
  id: string;
  type: 'qr_scan' | 'push_notification';
  sessionId: string;
  browserInfo?: string;
  ipAddress?: string;
  timestamp: number;
  expiresAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

interface QRCodeData {
  sessionId: string;
  token: string;
  expiresAt: number;
}

class CrossAuthService {
  private static instance: CrossAuthService;
  private pendingRequests: Map<string, AuthRequest> = new Map();
  private pushToken: string | null = null;

  private constructor() {
    this.initializeNotifications();
  }

  static getInstance(): CrossAuthService {
    if (!CrossAuthService.instance) {
      CrossAuthService.instance = new CrossAuthService();
    }
    return CrossAuthService.instance;
  }

  // Initialize push notifications
  private async initializeNotifications(): Promise<void> {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id',
      });
      
      this.pushToken = token.data;

      // Listen for notifications
      Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
      Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private handleNotificationReceived = (notification: any): void => {
    const data = notification.request.content.data;
    
    if (data?.type === 'auth_request') {
      const request: AuthRequest = {
        id: data.requestId,
        type: 'push_notification',
        sessionId: data.sessionId,
        browserInfo: data.browserInfo,
        ipAddress: data.ipAddress,
        timestamp: Date.now(),
        expiresAt: data.expiresAt || Date.now() + 5 * 60 * 1000,
        status: 'pending',
      };
      this.pendingRequests.set(request.id, request);
    }
  };

  private handleNotificationResponse = (response: any): void => {
    const data = response.notification.request.content.data;
    if (data?.type === 'auth_request') {
      Linking.openURL('auxite://auth/approve?requestId=' + data.requestId);
    }
  };

  async parseQRCode(qrData: string): Promise<AuthRequest | null> {
    try {
      const parsed: QRCodeData = JSON.parse(qrData);
      if (!parsed.sessionId || !parsed.token) throw new Error('Invalid QR code');
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) throw new Error('QR expired');

      const request: AuthRequest = {
        id: `qr_${Date.now()}`,
        type: 'qr_scan',
        sessionId: parsed.sessionId,
        timestamp: Date.now(),
        expiresAt: parsed.expiresAt || Date.now() + 5 * 60 * 1000,
        status: 'pending',
      };

      this.pendingRequests.set(request.id, request);
      return request;
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  async approveRequest(requestId: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request) return false;

    try {
      const { walletAddress } = useStore.getState();
      const response = await fetch('/api/cross-auth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          sessionId: request.sessionId,
          walletAddress,
          deviceId: this.pushToken,
        }),
      });

      if (response.ok) {
        request.status = 'approved';
        this.pendingRequests.set(requestId, request);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error approving request:', error);
      return false;
    }
  }

  async rejectRequest(requestId: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request) return false;

    try {
      const response = await fetch('/api/cross-auth/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, sessionId: request.sessionId }),
      });

      if (response.ok) {
        request.status = 'rejected';
        this.pendingRequests.set(requestId, request);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  }

  getPendingRequests(): AuthRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(r => r.status === 'pending' && Date.now() < r.expiresAt);
  }

  async registerDevice(walletAddress: string): Promise<boolean> {
    if (!this.pushToken) return false;

    try {
      const response = await fetch('/api/cross-auth/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          pushToken: this.pushToken,
          platform: Platform.OS,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }
}

export default CrossAuthService.getInstance();
