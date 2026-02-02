// hooks/useAppConfig.ts
// Auxite Mobile App - App Configuration Hook

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { 
  fetchMobileConfig, 
  fetchBanners, 
  fetchNews,
  checkAppVersion,
  type MobileConfig, 
  type Banner, 
  type NewsItem,
  type FeatureFlags 
} from '@/services/adminApi';
import { useStore } from '@/stores/useStore';

// App versiyonu - bu değeri app.json veya package.json'dan alın
const APP_VERSION = '1.0.0';

interface UseAppConfigReturn {
  // Loading states
  isLoading: boolean;
  isReady: boolean;
  
  // Config data
  config: MobileConfig | null;
  banners: Banner[];
  news: NewsItem[];
  
  // Status
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  needsUpdate: boolean;
  forceUpdate: boolean;
  
  // Feature checks
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  
  // Refresh
  refreshConfig: () => Promise<void>;
  refreshNews: () => Promise<void>;
  refreshBanners: () => Promise<void>;
}

export const useAppConfig = (): UseAppConfigReturn => {
  const { language } = useStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const [config, setConfig] = useState<MobileConfig | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');

  // Feature check helper
  const isFeatureEnabled = useCallback((feature: keyof FeatureFlags): boolean => {
    if (!config?.features) return true; // Varsayılan olarak aktif
    return config.features[feature] ?? true;
  }, [config]);

  // Load config
  const refreshConfig = useCallback(async () => {
    try {
      const mobileConfig = await fetchMobileConfig();
      
      if (mobileConfig) {
        setConfig(mobileConfig);
        
        // Maintenance mode kontrolü
        if (mobileConfig.maintenance.enabled) {
          setIsMaintenanceMode(true);
          setMaintenanceMessage(
            language === 'en' 
              ? mobileConfig.maintenance.message.en 
              : mobileConfig.maintenance.message.tr
          );
        } else {
          setIsMaintenanceMode(false);
          setMaintenanceMessage('');
        }
        
        // Version kontrolü
        const platform = Platform.OS as 'ios' | 'android';
        const versionCheck = checkAppVersion(APP_VERSION, mobileConfig.appConfig, platform);
        
        setNeedsUpdate(versionCheck.needsUpdate);
        setForceUpdate(versionCheck.forceUpdate);
        setStoreUrl(versionCheck.storeUrl);
        
        // Zorunlu güncelleme varsa alert göster
        if (versionCheck.forceUpdate) {
          Alert.alert(
            language === 'en' ? 'Update Required' : 'Güncelleme Gerekli',
            language === 'en' 
              ? 'Please update the app to continue using Auxite.'
              : 'Auxite\'i kullanmaya devam etmek için lütfen uygulamayı güncelleyin.',
            [
              {
                text: language === 'en' ? 'Update' : 'Güncelle',
                onPress: () => {
                  if (versionCheck.storeUrl) {
                    Linking.openURL(versionCheck.storeUrl);
                  }
                },
              },
            ],
            { cancelable: false }
          );
        }
      }
    } catch (error) {
      console.error('Config refresh error:', error);
    }
  }, [language]);

  // Load banners
  const refreshBanners = useCallback(async () => {
    try {
      const fetchedBanners = await fetchBanners();
      setBanners(fetchedBanners);
    } catch (error) {
      console.error('Banners refresh error:', error);
    }
  }, []);

  // Load news
  const refreshNews = useCallback(async () => {
    try {
      const fetchedNews = await fetchNews(language);
      setNews(fetchedNews);
    } catch (error) {
      console.error('News refresh error:', error);
    }
  }, [language]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      try {
        await Promise.all([
          refreshConfig(),
          refreshBanners(),
          refreshNews(),
        ]);
      } catch (error) {
        console.error('App config init error:', error);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };
    
    init();
  }, []);

  // Language değişince news'i yenile
  useEffect(() => {
    if (isReady) {
      refreshNews();
    }
  }, [language, isReady]);

  return {
    isLoading,
    isReady,
    config,
    banners,
    news,
    isMaintenanceMode,
    maintenanceMessage,
    needsUpdate,
    forceUpdate,
    isFeatureEnabled,
    refreshConfig,
    refreshNews,
    refreshBanners,
  };
};

export default useAppConfig;
