/**
 * useKYC Hook
 * Sumsub KYC entegrasyonu için
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/Api';

export type KYCStatus = 'none' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'retry';

export interface KYCData {
  status: KYCStatus;
  level: string;
  applicantId?: string;
  reviewResult?: {
    reviewAnswer: string;
    rejectLabels?: string[];
    moderationComment?: string;
  };
  updatedAt?: string;
}

const KYC_STORAGE_KEY = 'auxite_kyc_status';

export function useKYC(walletAddress?: string) {
  const [kycData, setKycData] = useState<KYCData>({ status: 'none', level: 'none' });
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // KYC durumunu yükle
  const loadKYCStatus = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      // Önce cache'den kontrol et
      const cached = await AsyncStorage.getItem(`${KYC_STORAGE_KEY}:${walletAddress}`);
      if (cached) {
        setKycData(JSON.parse(cached));
      }

      // API'den güncel durumu al
      const response = await fetch(`${API_BASE_URL}/api/kyc`, {
        headers: {
          'x-wallet-address': walletAddress,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newKycData: KYCData = {
          status: data.status || 'none',
          level: data.level || 'none',
          applicantId: data.applicantId,
          reviewResult: data.reviewResult,
          updatedAt: data.updatedAt,
        };
        setKycData(newKycData);
        await AsyncStorage.setItem(`${KYC_STORAGE_KEY}:${walletAddress}`, JSON.stringify(newKycData));
      }
    } catch (error) {
      console.error('KYC status load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Sumsub access token al
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!walletAddress) {
      return null;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc/sumsub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          userId: walletAddress,
          levelName: 'basic-kyc-level', // Sumsub'da tanımlı level
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Token alınamadı');
      }

      const data = await response.json();
      setAccessToken(data.token);
      return data.token;
    } catch (error: any) {
      console.error('Sumsub token error:', error);
      Alert.alert('Hata', error.message || 'KYC başlatılamadı');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // KYC başlat
  const startKYC = useCallback(async () => {
    const token = await getAccessToken();
    return token;
  }, [getAccessToken]);

  // KYC sonucunu güncelle (webhook'tan gelecek)
  const updateKYCResult = useCallback(async (result: Partial<KYCData>) => {
    if (!walletAddress) return;

    const newKycData = { ...kycData, ...result, updatedAt: new Date().toISOString() };
    setKycData(newKycData);
    await AsyncStorage.setItem(`${KYC_STORAGE_KEY}:${walletAddress}`, JSON.stringify(newKycData));
  }, [walletAddress, kycData]);

  // KYC durumunu sıfırla (test için)
  const resetKYC = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/kyc/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
      });

      if (response.ok) {
        setKycData({ status: 'none', level: 'none' });
        await AsyncStorage.removeItem(`${KYC_STORAGE_KEY}:${walletAddress}`);
      }
    } catch (error) {
      console.error('KYC reset error:', error);
    }
  }, [walletAddress]);

  // Durum kontrolleri
  const isVerified = kycData.status === 'approved';
  const isPending = kycData.status === 'pending' || kycData.status === 'in_review';
  const isRejected = kycData.status === 'rejected';
  const canRetry = kycData.status === 'rejected' || kycData.status === 'retry';

  // Durum metni
  const getStatusText = (lang: 'tr' | 'en' = 'tr') => {
    const texts = {
      tr: {
        none: 'Doğrulanmadı',
        pending: 'Bekleniyor',
        in_review: 'İnceleniyor',
        approved: 'Doğrulandı',
        rejected: 'Reddedildi',
        retry: 'Tekrar Deneyin',
      },
      en: {
        none: 'Not Verified',
        pending: 'Pending',
        in_review: 'In Review',
        approved: 'Verified',
        rejected: 'Rejected',
        retry: 'Retry',
      },
    };
    return texts[lang][kycData.status] || texts[lang].none;
  };

  // Durum rengi
  const getStatusColor = () => {
    switch (kycData.status) {
      case 'approved': return '#10b981';
      case 'pending':
      case 'in_review': return '#f59e0b';
      case 'rejected':
      case 'retry': return '#ef4444';
      default: return '#64748b';
    }
  };

  return {
    kycData,
    isLoading,
    accessToken,
    isVerified,
    isPending,
    isRejected,
    canRetry,
    loadKYCStatus,
    startKYC,
    getAccessToken,
    updateKYCResult,
    resetKYC,
    getStatusText,
    getStatusColor,
  };
}
