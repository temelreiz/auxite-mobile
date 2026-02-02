// services/adminApi.ts
// Auxite Mobile App - Admin Panel API Integration

import { API_URL } from '@/constants/api';
const API_BASE = API_URL;

// TYPES
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  icon: string;
  color: string;
}

export interface AppConfig {
  ios: { minVersion: string; currentVersion: string; forceUpdate: boolean; storeUrl: string; };
  android: { minVersion: string; currentVersion: string; forceUpdate: boolean; storeUrl: string; };
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: { tr: string; en: string };
  estimatedEnd: string | null;
  allowedVersions: string[];
}

export interface FeatureFlags {
  cryptoTrading: boolean;
  metalTrading: boolean;
  leasing: boolean;
  staking: boolean;
  p2pTransfer: boolean;
  fiatDeposit: boolean;
  fiatWithdraw: boolean;
  cryptoDeposit: boolean;
  cryptoWithdraw: boolean;
  biometricAuth: boolean;
  darkMode: boolean;
  priceAlerts: boolean;
  referralProgram: boolean;
  nftSupport: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  actionType: 'none' | 'link' | 'screen' | 'promo';
  actionValue?: string;
  active: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
}

export interface MobileConfig {
  appConfig: AppConfig;
  maintenance: MaintenanceConfig;
  features: FeatureFlags;
}

// NEWS API
export const fetchNews = async (language: string = 'tr'): Promise<NewsItem[]> => {
  try {
    const res = await fetch(API_BASE + '/api/news?lang=' + language);
    if (!res.ok) throw new Error('News fetch failed');
    const data = await res.json();
    return data.news || [];
  } catch (error) {
    console.error('fetchNews error:', error);
    return [];
  }
};

// MOBILE CONFIG API
export const fetchMobileConfig = async (): Promise<MobileConfig | null> => {
  try {
    const res = await fetch(API_BASE + '/api/mobile/config');
    if (!res.ok) throw new Error('Config fetch failed');
    const data = await res.json();
    return { appConfig: data.appConfig, maintenance: data.maintenance, features: data.features };
  } catch (error) {
    console.error('fetchMobileConfig error:', error);
    return null;
  }
};

// BANNER API
export const fetchBanners = async (language: string = 'tr'): Promise<Banner[]> => {
  try {
    const res = await fetch(API_BASE + '/api/mobile/banners?active=true');
    if (!res.ok) throw new Error('Banners fetch failed');
    const data = await res.json();
    const now = new Date();
    return (data.banners || [])
      .filter((banner: any) => {
        if (!banner.active) return false;
        if (banner.startDate && new Date(banner.startDate) > now) return false;
        if (banner.endDate && new Date(banner.endDate) < now) return false;
        return true;
      })
      .sort((a: Banner, b: Banner) => b.priority - a.priority);
  } catch (error) {
    console.error('fetchBanners error:', error);
    return [];
  }
};

// VERSION CHECK
export const checkAppVersion = (
  currentVersion: string,
  config: AppConfig,
  platform: 'ios' | 'android'
): { needsUpdate: boolean; forceUpdate: boolean; storeUrl: string } => {
  const platformConfig = config[platform];
  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  };
  const needsUpdate = compareVersions(currentVersion, platformConfig.currentVersion) < 0;
  const forceUpdate = platformConfig.forceUpdate && compareVersions(currentVersion, platformConfig.minVersion) < 0;
  return { needsUpdate, forceUpdate, storeUrl: platformConfig.storeUrl };
};

// PUSH TOKEN REGISTRATION
export const registerPushToken = async (
  token: string,
  platform: 'ios' | 'android',
  walletAddress?: string
): Promise<boolean> => {
  try {
    const res = await fetch(API_BASE + '/api/mobile/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform, walletAddress, deviceId: platform + '-' + Date.now() }),
    });
    return res.ok;
  } catch (error) {
    console.error('registerPushToken error:', error);
    return false;
  }
};

// ANALYTICS
export const trackEvent = async (
  eventName: string,
  eventData?: Record<string, any>,
  walletAddress?: string
): Promise<void> => {
  try {
    await fetch(API_BASE + '/api/mobile/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName, data: eventData, walletAddress, timestamp: new Date().toISOString(), platform: 'mobile' }),
    });
  } catch (error) {
    console.log('Analytics tracking failed:', error);
  }
};
