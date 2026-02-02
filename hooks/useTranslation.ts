/**
 * useTranslation Hook
 * Merkezi çeviri erişimi için hook
 */

import { useCallback, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import { 
  translations, 
  languages, 
  LanguageCode, 
  TranslationSection,
  getLanguageInfo,
  isRTL 
} from '@/i18n/translations';

export function useTranslation<T extends TranslationSection>(section?: T) {
  const { language } = useStore();
  const lang = (language || 'en') as LanguageCode;

  // Belirli bir section için çevirileri getir
  const t = useMemo(() => {
    if (section) {
      // Section var mı kontrol et
      const sectionData = translations[section];
      if (!sectionData) {
        console.warn(`Translation section "${section}" not found`);
        return {};
      }
      // Dil var mı kontrol et
      return sectionData[lang] || sectionData['en'] || {};
    }
    // Section belirtilmemişse tüm çevirileri birleştir
    return Object.keys(translations).reduce((acc, sec) => {
      const sectionKey = sec as TranslationSection;
      const sectionData = translations[sectionKey];
      if (!sectionData) return acc;
      return {
        ...acc,
        ...(sectionData[lang] || sectionData['en'] || {}),
      };
    }, {});
  }, [lang, section]);

  // Dinamik key ile çeviri getir
  const translate = useCallback((key: string, sectionOverride?: TranslationSection): string => {
    const targetSection = sectionOverride || section;
    if (targetSection) {
      const sectionData = translations[targetSection];
      if (!sectionData) return key;
      const sectionTranslations = sectionData[lang] || sectionData['en'] || {};
      return (sectionTranslations as any)[key] || key;
    }
    
    // Section belirtilmemişse tüm section'larda ara
    for (const sec of Object.keys(translations)) {
      const sectionKey = sec as TranslationSection;
      const sectionData = translations[sectionKey];
      if (!sectionData) continue;
      const sectionTranslations = sectionData[lang] || sectionData['en'] || {};
      if ((sectionTranslations as any)[key]) {
        return (sectionTranslations as any)[key];
      }
    }
    return key;
  }, [lang, section]);

  // Birden fazla section'dan çevirileri birleştir
  const mergeTranslations = useCallback((...sections: TranslationSection[]) => {
    return sections.reduce((acc, sec) => {
      const sectionData = translations[sec];
      if (!sectionData) return acc;
      return {
        ...acc,
        ...(sectionData[lang] || sectionData['en'] || {}),
      };
    }, {});
  }, [lang]);

  return {
    t,
    translate,
    mergeTranslations,
    language: lang,
    languages,
    languageInfo: getLanguageInfo(lang),
    isRTL: isRTL(lang),
  };
}

// Section-specific hooks for convenience
export function useCommonTranslation() {
  return useTranslation('common');
}

export function useWalletTranslation() {
  return useTranslation('wallet');
}

export function useKYCTranslation() {
  return useTranslation('kyc');
}

export function useSettingsTranslation() {
  return useTranslation('settings');
}

export function useTradeTranslation() {
  return useTranslation('trade');
}

export function useDrawerTranslation() {
  return useTranslation('drawer');
}

export function useMetalsTranslation() {
  return useTranslation('metals');
}

export function useSecurityTranslation() {
  return useTranslation('security');
}

export function useSupportTranslation() {
  return useTranslation('support');
}

export function useWalletInfoTranslation() {
  return useTranslation('walletInfo');
}

export function useReferralTranslation() {
  return useTranslation('referral');
}

export function usePortfolioTranslation() {
  return useTranslation('portfolio');
}

export function useDCATranslation() {
  return useTranslation('dca');
}

export function useAlertsTranslation() {
  return useTranslation('alerts');
}

// Wallet Onboarding
export function useWalletOnboardingTranslation() {
  return useTranslation('walletOnboarding');
}

// Allocation Modal
export function useAllocationModalTranslation() {
  return useTranslation('allocationModal');
}

// Quick Buy Modal
export function useQuickBuyModalTranslation() {
  return useTranslation('quickBuyModal');
}

// Risk Modal
export function useRiskModalTranslation() {
  return useTranslation('riskModal');
}

// News Feed
export function useNewsFeedTranslation() {
  return useTranslation('newsFeed');
}

// Top Nav
export function useTopNavTranslation() {
  return useTranslation('topNav');
}

// Dynamic Banner
export function useDynamicBannerTranslation() {
  return useTranslation('dynamicBanner');
}

// Deposit Modals
export function useDepositModalsTranslation() {
  return useTranslation('depositModals');
}

// Locked Assets Modal
export function useLockedAssetsModalTranslation() {
  return useTranslation('lockedAssetsModal');
}

// Security Modal
export function useSecurityModalTranslation() {
  return useTranslation('securityModal');
}

// Tabs
export function useTabsTranslation() {
  return useTranslation('tabs');
}

// Trust
export function useTrustTranslation() {
  return useTranslation('trust');
}

// Stake
export function useStakeTranslation() {
  return useTranslation('stake');
}

// Cross Auth Modal
export function useCrossAuthModalTranslation() {
  return useTranslation('crossAuthModal');
}

// Recurring Stake Modal
export function useRecurringStakeModalTranslation() {
  return useTranslation('recurringStakeModal');
}

// Wallet Modals
export function useWalletModalsTranslation() {
  return useTranslation('walletModals');
}

// FAQ Modal
export function useFAQModalTranslation() {
  return useTranslation('faqModal');
}

// Home Screen
export function useHomeTranslation() {
  return useTranslation('home');
}

// Trade Screen
export function useTradeScreenTranslation() {
  return useTranslation('trade');
}

// Convert Screen
export function useConvertTranslation() {
  return useTranslation('convert');
}

// Stake Screen
export function useStakeScreenTranslation() {
  return useTranslation('stake');
}

// Assets Screen
export function useAssetsTranslation() {
  return useTranslation('assets');
}
