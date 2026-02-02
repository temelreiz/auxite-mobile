// app/auxiteer-tier.tsx
// Auxiteer Tier Program Screen
// Matches Web Version | 6-Language Support | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/stores/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// AUXITEER TIER CONFIGURATION (Same as Web)
// ============================================
interface AuxiteerTier {
  id: string;
  name: string;
  spread: string;
  fee: string;
  color: string;
  bgColor: string;
  icon: string;
  requirements: {
    kyc: boolean;
    minBalance: number;
    minDays: number;
    metalAsset?: boolean;
    activeEarnLease?: boolean;
    invitation?: boolean;
  };
  benefits: string[];
  extras?: string[];
}

const AUXITEER_TIERS: AuxiteerTier[] = [
  {
    id: 'regular',
    name: 'Regular',
    spread: '1.00%',
    fee: '0.35%',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    icon: '👤',
    requirements: {
      kyc: false,
      minBalance: 0,
      minDays: 0,
    },
    benefits: ['basicAccess', 'standardPricing'],
  },
  {
    id: 'core',
    name: 'Core',
    spread: '0.80%',
    fee: '0.25%',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '🛡️',
    requirements: {
      kyc: true,
      minBalance: 10000,
      minDays: 7,
    },
    benefits: ['preferentialPricing', 'reducedFees', 'prioritySupport'],
  },
  {
    id: 'reserve',
    name: 'Reserve',
    spread: '0.65%',
    fee: '0.18%',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: '📦',
    requirements: {
      kyc: true,
      minBalance: 100000,
      minDays: 30,
      metalAsset: true,
    },
    benefits: ['preferentialPricing', 'reducedFees', 'prioritySupport', 'enhancedPriority'],
  },
  {
    id: 'vault',
    name: 'Vault',
    spread: '0.50%',
    fee: '0.12%',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: '🏛️',
    requirements: {
      kyc: true,
      minBalance: 500000,
      minDays: 90,
      activeEarnLease: true,
    },
    benefits: ['preferentialPricing', 'reducedFees', 'prioritySupport', 'enhancedPriority'],
    extras: ['priorityExecution', 'otcQuote'],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    spread: 'Custom',
    fee: 'Custom',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '⭐',
    requirements: {
      kyc: true,
      minBalance: 1000000,
      minDays: 180,
      invitation: true,
    },
    benefits: ['preferentialPricing', 'reducedFees', 'prioritySupport', 'enhancedPriority'],
    extras: ['dedicatedManager', 'customCustody', 'priorityExecution', 'otcQuote'],
  },
];

// ============================================
// TRANSLATIONS (6 Languages)
// ============================================
const translations: Record<string, Record<string, string>> = {
  tr: {
    auxiteerProgram: 'Auxiteer Programı',
    currentTier: 'Mevcut Seviyeniz',
    spread: 'Spread',
    fee: 'İşlem Ücreti',
    requirements: 'Gereksinimler',
    benefits: 'Avantajlar',
    kycRequired: 'KYC Doğrulaması',
    minBalance: 'Min. Bakiye',
    minDays: 'Min. Gün',
    metalAsset: 'Metal Varlık',
    activeEarnLease: 'Aktif Earn/Lease',
    invitationOnly: 'Sadece Davetiye',
    basicAccess: 'Temel erişim',
    standardPricing: 'Standart fiyatlandırma',
    preferentialPricing: 'Tercihli fiyatlandırma (spread)',
    reducedFees: 'Düşük işlem ücretleri',
    prioritySupport: 'Öncelikli destek',
    enhancedPriority: 'Gelişmiş işlem önceliği',
    priorityExecution: 'Öncelikli işlem penceresi',
    otcQuote: 'OTC teklif talebi',
    dedicatedManager: 'Özel hesap yöneticisi',
    customCustody: 'Özel saklama seçenekleri',
    allTiers: 'Tüm Seviyeler',
    close: 'Kapat',
    yourTier: 'Seviyeniz',
    notEligible: 'Bu seviye için henüz uygun değilsiniz.',
    auxiteerNote: 'Auxiteer programı, herhangi bir finansal getiri veya ödül vaadi içermez. Spread ve ücret oranları piyasa koşullarına göre değişebilir.',
    nextTierHint: 'Bir sonraki seviye için gereksinimleri karşılayın',
    back: 'Geri',
    required: 'Gerekli',
    completed: 'Tamamlandı',
    days: 'gün',
  },
  en: {
    auxiteerProgram: 'Auxiteer Program',
    currentTier: 'Your Current Tier',
    spread: 'Spread',
    fee: 'Transaction Fee',
    requirements: 'Requirements',
    benefits: 'Benefits',
    kycRequired: 'KYC Verification',
    minBalance: 'Min. Balance',
    minDays: 'Min. Days',
    metalAsset: 'Metal Asset',
    activeEarnLease: 'Active Earn/Lease',
    invitationOnly: 'Invitation Only',
    basicAccess: 'Basic access',
    standardPricing: 'Standard pricing',
    preferentialPricing: 'Preferential pricing (spread)',
    reducedFees: 'Reduced transaction fees',
    prioritySupport: 'Priority support',
    enhancedPriority: 'Enhanced execution priority',
    priorityExecution: 'Priority execution window',
    otcQuote: 'OTC quote request',
    dedicatedManager: 'Dedicated account manager',
    customCustody: 'Custom custody options',
    allTiers: 'All Tiers',
    close: 'Close',
    yourTier: 'Your Tier',
    notEligible: 'You are not yet eligible for this tier.',
    auxiteerNote: 'The Auxiteer program does not promise any financial returns or rewards. Spread and fee rates may vary according to market conditions.',
    nextTierHint: 'Meet the requirements for the next tier',
    back: 'Back',
    required: 'Required',
    completed: 'Completed',
    days: 'days',
  },
  de: {
    auxiteerProgram: 'Auxiteer Programm',
    currentTier: 'Ihre aktuelle Stufe',
    spread: 'Spread',
    fee: 'Transaktionsgebühr',
    requirements: 'Anforderungen',
    benefits: 'Vorteile',
    kycRequired: 'KYC-Verifizierung',
    minBalance: 'Min. Guthaben',
    minDays: 'Min. Tage',
    metalAsset: 'Metall-Asset',
    activeEarnLease: 'Aktives Earn/Lease',
    invitationOnly: 'Nur auf Einladung',
    basicAccess: 'Basiszugang',
    standardPricing: 'Standardpreise',
    preferentialPricing: 'Vorzugspreise (Spread)',
    reducedFees: 'Reduzierte Gebühren',
    prioritySupport: 'Prioritäts-Support',
    enhancedPriority: 'Verbesserte Ausführungspriorität',
    priorityExecution: 'Prioritäts-Ausführungsfenster',
    otcQuote: 'OTC-Angebotsanfrage',
    dedicatedManager: 'Dedizierter Account-Manager',
    customCustody: 'Individuelle Verwahrungsoptionen',
    allTiers: 'Alle Stufen',
    close: 'Schließen',
    yourTier: 'Ihre Stufe',
    notEligible: 'Sie sind für diese Stufe noch nicht berechtigt.',
    auxiteerNote: 'Das Auxiteer-Programm verspricht keine finanziellen Renditen oder Belohnungen. Spread- und Gebührensätze können je nach Marktbedingungen variieren.',
    nextTierHint: 'Erfüllen Sie die Anforderungen für die nächste Stufe',
    back: 'Zurück',
    required: 'Erforderlich',
    completed: 'Abgeschlossen',
    days: 'Tage',
  },
  fr: {
    auxiteerProgram: 'Programme Auxiteer',
    currentTier: 'Votre niveau actuel',
    spread: 'Spread',
    fee: 'Frais de transaction',
    requirements: 'Conditions',
    benefits: 'Avantages',
    kycRequired: 'Vérification KYC',
    minBalance: 'Solde min.',
    minDays: 'Jours min.',
    metalAsset: 'Actif métal',
    activeEarnLease: 'Earn/Lease actif',
    invitationOnly: 'Sur invitation uniquement',
    basicAccess: 'Accès de base',
    standardPricing: 'Tarification standard',
    preferentialPricing: 'Tarification préférentielle (spread)',
    reducedFees: 'Frais réduits',
    prioritySupport: 'Support prioritaire',
    enhancedPriority: 'Priorité d\'exécution améliorée',
    priorityExecution: 'Fenêtre d\'exécution prioritaire',
    otcQuote: 'Demande de cotation OTC',
    dedicatedManager: 'Gestionnaire de compte dédié',
    customCustody: 'Options de garde personnalisées',
    allTiers: 'Tous les niveaux',
    close: 'Fermer',
    yourTier: 'Votre niveau',
    notEligible: 'Vous n\'êtes pas encore éligible pour ce niveau.',
    auxiteerNote: 'Le programme Auxiteer ne promet aucun rendement financier ni récompense. Les taux de spread et de frais peuvent varier selon les conditions du marché.',
    nextTierHint: 'Remplissez les conditions pour le niveau suivant',
    back: 'Retour',
    required: 'Requis',
    completed: 'Terminé',
    days: 'jours',
  },
  ar: {
    auxiteerProgram: 'برنامج Auxiteer',
    currentTier: 'مستواك الحالي',
    spread: 'السبريد',
    fee: 'رسوم المعاملة',
    requirements: 'المتطلبات',
    benefits: 'المزايا',
    kycRequired: 'التحقق من الهوية',
    minBalance: 'الحد الأدنى للرصيد',
    minDays: 'الحد الأدنى للأيام',
    metalAsset: 'أصول معدنية',
    activeEarnLease: 'Earn/Lease نشط',
    invitationOnly: 'بدعوة فقط',
    basicAccess: 'وصول أساسي',
    standardPricing: 'تسعير قياسي',
    preferentialPricing: 'تسعير تفضيلي (سبريد)',
    reducedFees: 'رسوم مخفضة',
    prioritySupport: 'دعم أولوية',
    enhancedPriority: 'أولوية تنفيذ محسنة',
    priorityExecution: 'نافذة تنفيذ أولوية',
    otcQuote: 'طلب عرض OTC',
    dedicatedManager: 'مدير حساب مخصص',
    customCustody: 'خيارات حفظ مخصصة',
    allTiers: 'جميع المستويات',
    close: 'إغلاق',
    yourTier: 'مستواك',
    notEligible: 'أنت غير مؤهل لهذا المستوى بعد.',
    auxiteerNote: 'برنامج Auxiteer لا يعد بأي عوائد مالية أو مكافآت. قد تختلف معدلات السبريد والرسوم حسب ظروف السوق.',
    nextTierHint: 'استوفِ المتطلبات للمستوى التالي',
    back: 'رجوع',
    required: 'مطلوب',
    completed: 'مكتمل',
    days: 'أيام',
  },
  ru: {
    auxiteerProgram: 'Программа Auxiteer',
    currentTier: 'Ваш текущий уровень',
    spread: 'Спред',
    fee: 'Комиссия',
    requirements: 'Требования',
    benefits: 'Преимущества',
    kycRequired: 'Верификация KYC',
    minBalance: 'Мин. баланс',
    minDays: 'Мин. дней',
    metalAsset: 'Металлический актив',
    activeEarnLease: 'Активный Earn/Lease',
    invitationOnly: 'Только по приглашению',
    basicAccess: 'Базовый доступ',
    standardPricing: 'Стандартные цены',
    preferentialPricing: 'Льготное ценообразование (спред)',
    reducedFees: 'Сниженные комиссии',
    prioritySupport: 'Приоритетная поддержка',
    enhancedPriority: 'Повышенный приоритет исполнения',
    priorityExecution: 'Приоритетное окно исполнения',
    otcQuote: 'Запрос OTC котировки',
    dedicatedManager: 'Персональный менеджер',
    customCustody: 'Индивидуальные опции хранения',
    allTiers: 'Все уровни',
    close: 'Закрыть',
    yourTier: 'Ваш уровень',
    notEligible: 'Вы пока не соответствуете этому уровню.',
    auxiteerNote: 'Программа Auxiteer не обещает финансовой прибыли или вознаграждений. Ставки спреда и комиссий могут меняться в зависимости от рыночных условий.',
    nextTierHint: 'Выполните требования для следующего уровня',
    back: 'Назад',
    required: 'Требуется',
    completed: 'Выполнено',
    days: 'дней',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AuxiteerTierScreen() {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const t = translations[language] || translations.en;

  // User state (would come from API in real app)
  const [userBalance, setUserBalance] = useState(0);
  const [userDays, setUserDays] = useState(0);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [hasMetalAsset, setHasMetalAsset] = useState(false);
  const [hasActiveEarnLease, setHasActiveEarnLease] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<AuxiteerTier[]>(AUXITEER_TIERS);

  // Calculate current tier
  const calculateCurrentTier = (): number => {
    const tiers = [...AUXITEER_TIERS].reverse();
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const req = tier.requirements;
      
      if (req.invitation) continue;
      if (req.kyc && !isKycVerified) continue;
      if (userBalance < req.minBalance) continue;
      if (userDays < req.minDays) continue;
      if (req.metalAsset && !hasMetalAsset) continue;
      if (req.activeEarnLease && !hasActiveEarnLease) continue;
      
      return AUXITEER_TIERS.length - 1 - i;
    }
    return 0;
  };

  const currentTierIndex = calculateCurrentTier();
  const currentTier = tiers[currentTierIndex];
  const selectedTier = tiers[selectedTierIndex];


  // Fetch tiers from API
  useEffect(() => {
    fetch(`${API_URL}/api/tiers`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.tiers) {
          const updatedTiers = tiers.map(defaultTier => {
            const apiTier = data.tiers.find((t: any) => t.id === defaultTier.id);
            if (apiTier) {
              return {
                ...defaultTier,
                spread: apiTier.spread === 0 ? "Custom" : apiTier.spread.toFixed(2) + "%",
                fee: apiTier.fee === 0 ? "Custom" : apiTier.fee.toFixed(2) + "%",
              };
            }
            return defaultTier;
          });
          setTiers(updatedTiers);
        }
      })
      .catch(err => console.log("Tier fetch error:", err));
  }, []);
  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // Colors
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    surfaceAlt: isDark ? '#334155' : '#f1f5f9',
    text: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#f59e0b',
    success: '#10b981',
  };

  const formatBalance = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Check if requirement is met
  const isRequirementMet = (tier: AuxiteerTier, reqType: string): boolean => {
    switch (reqType) {
      case 'kyc': return isKycVerified;
      case 'minBalance': return userBalance >= tier.requirements.minBalance;
      case 'minDays': return userDays >= tier.requirements.minDays;
      case 'metalAsset': return hasMetalAsset;
      case 'activeEarnLease': return hasActiveEarnLease;
      default: return false;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.auxiteerProgram}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tier Selector - Horizontal */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tierSelector}
        >
          {tiers.map((tier, index) => {
            const isSelected = index === selectedTierIndex;
            const isCurrent = index === currentTierIndex;
            const isLocked = index > currentTierIndex && !tier.requirements.invitation;
            
            return (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierTab,
                  {
                    backgroundColor: isSelected ? tier.color + '20' : colors.surface,
                    borderColor: isSelected ? tier.color : colors.border,
                  },
                ]}
                onPress={() => setSelectedTierIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.tierTabIcon}>{tier.icon}</Text>
                <Text style={[styles.tierTabName, { color: isSelected ? tier.color : colors.text }]}>
                  {tier.name}
                </Text>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: tier.color }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
                {isLocked && (
                  <View style={styles.lockedIcon}>
                    <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Tier Detail Card */}
        <View 
          style={[
            styles.detailCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: selectedTier.color,
            }
          ]}
        >
          {/* Tier Header */}
          <View style={styles.detailHeader}>
            <View style={[styles.tierIconLarge, { backgroundColor: selectedTier.bgColor }]}>
              <Text style={styles.tierIconText}>{selectedTier.icon}</Text>
            </View>
            <View style={styles.detailHeaderText}>
              <Text style={[styles.detailTierName, { color: selectedTier.color }]}>
                {selectedTier.name}
              </Text>
              {currentTierIndex === selectedTierIndex && (
                <View style={[styles.yourTierBadge, { backgroundColor: selectedTier.color + '20' }]}>
                  <Text style={[styles.yourTierText, { color: selectedTier.color }]}>
                    {t.yourTier}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Spread & Fee */}
          <View style={styles.ratesRow}>
            <View style={[styles.rateBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>{t.spread}</Text>
              <Text style={[styles.rateValue, { color: selectedTier.color }]}>{selectedTier.spread}</Text>
            </View>
            <View style={[styles.rateBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>{t.fee}</Text>
              <Text style={[styles.rateValue, { color: selectedTier.color }]}>{selectedTier.fee}</Text>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.requirements}</Text>
            </View>
            <View style={styles.requirementsGrid}>
              {selectedTier.requirements.kyc && (
                <View style={[
                  styles.reqItem, 
                  { 
                    backgroundColor: isRequirementMet(selectedTier, 'kyc') ? colors.success + '15' : colors.surfaceAlt,
                    borderColor: isRequirementMet(selectedTier, 'kyc') ? colors.success + '50' : colors.border,
                  }
                ]}>
                  <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{t.kycRequired}</Text>
                  <Text style={[
                    styles.reqValue, 
                    { color: isRequirementMet(selectedTier, 'kyc') ? colors.success : colors.text }
                  ]}>
                    {isRequirementMet(selectedTier, 'kyc') ? '✓' : t.required}
                  </Text>
                </View>
              )}
              {selectedTier.requirements.minBalance > 0 && (
                <View style={[
                  styles.reqItem, 
                  { 
                    backgroundColor: isRequirementMet(selectedTier, 'minBalance') ? colors.success + '15' : colors.surfaceAlt,
                    borderColor: isRequirementMet(selectedTier, 'minBalance') ? colors.success + '50' : colors.border,
                  }
                ]}>
                  <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{t.minBalance}</Text>
                  <Text style={[
                    styles.reqValue, 
                    { color: isRequirementMet(selectedTier, 'minBalance') ? colors.success : colors.text }
                  ]}>
                    {formatBalance(selectedTier.requirements.minBalance)}
                  </Text>
                </View>
              )}
              {selectedTier.requirements.minDays > 0 && (
                <View style={[
                  styles.reqItem, 
                  { 
                    backgroundColor: isRequirementMet(selectedTier, 'minDays') ? colors.success + '15' : colors.surfaceAlt,
                    borderColor: isRequirementMet(selectedTier, 'minDays') ? colors.success + '50' : colors.border,
                  }
                ]}>
                  <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{t.minDays}</Text>
                  <Text style={[
                    styles.reqValue, 
                    { color: isRequirementMet(selectedTier, 'minDays') ? colors.success : colors.text }
                  ]}>
                    {selectedTier.requirements.minDays} {t.days}
                  </Text>
                </View>
              )}
              {selectedTier.requirements.metalAsset && (
                <View style={[
                  styles.reqItem, 
                  { 
                    backgroundColor: isRequirementMet(selectedTier, 'metalAsset') ? colors.success + '15' : colors.surfaceAlt,
                    borderColor: isRequirementMet(selectedTier, 'metalAsset') ? colors.success + '50' : colors.border,
                  }
                ]}>
                  <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{t.metalAsset}</Text>
                  <Text style={[
                    styles.reqValue, 
                    { color: isRequirementMet(selectedTier, 'metalAsset') ? colors.success : colors.text }
                  ]}>
                    {isRequirementMet(selectedTier, 'metalAsset') ? '✓' : t.required}
                  </Text>
                </View>
              )}
              {selectedTier.requirements.activeEarnLease && (
                <View style={[
                  styles.reqItem, 
                  { 
                    backgroundColor: isRequirementMet(selectedTier, 'activeEarnLease') ? colors.success + '15' : colors.surfaceAlt,
                    borderColor: isRequirementMet(selectedTier, 'activeEarnLease') ? colors.success + '50' : colors.border,
                  }
                ]}>
                  <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{t.activeEarnLease}</Text>
                  <Text style={[
                    styles.reqValue, 
                    { color: isRequirementMet(selectedTier, 'activeEarnLease') ? colors.success : colors.text }
                  ]}>
                    {isRequirementMet(selectedTier, 'activeEarnLease') ? '✓' : t.required}
                  </Text>
                </View>
              )}
              {selectedTier.requirements.invitation && (
                <View style={[styles.reqItem, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b50' }]}>
                  <Text style={[styles.reqLabel, { color: colors.textSecondary }]}>{t.invitationOnly}</Text>
                  <Text style={[styles.reqValue, { color: '#f59e0b' }]}>★</Text>
                </View>
              )}
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.benefits}</Text>
            </View>
            <View style={styles.benefitsList}>
              {selectedTier.benefits.map((benefit, index) => (
                <View key={index} style={[styles.benefitItem, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.benefitIcon, { backgroundColor: selectedTier.bgColor }]}>
                    <Ionicons name="checkmark" size={14} color={selectedTier.color} />
                  </View>
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    {t[benefit as keyof typeof t] || benefit}
                  </Text>
                </View>
              ))}
              {selectedTier.extras?.map((extra, index) => (
                <View key={`extra-${index}`} style={[styles.benefitItem, { backgroundColor: selectedTier.bgColor }]}>
                  <View style={[styles.benefitIcon, { backgroundColor: selectedTier.color + '30' }]}>
                    <Ionicons name="star" size={14} color={selectedTier.color} />
                  </View>
                  <Text style={[styles.benefitText, { color: selectedTier.color, fontWeight: '600' }]}>
                    {t[extra as keyof typeof t] || extra}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Warning Note */}
        <View style={[styles.noteCard, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b30' }]}>
          <Ionicons name="warning-outline" size={18} color="#f59e0b" />
          <Text style={[styles.noteText, { color: '#b45309' }]}>
            {t.auxiteerNote}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  
  content: { flex: 1, paddingHorizontal: 16 },
  
  // Tier Selector
  tierSelector: { paddingVertical: 16, gap: 10 },
  tierTab: { 
    width: 90, 
    paddingVertical: 12, 
    paddingHorizontal: 8,
    borderRadius: 14, 
    borderWidth: 2, 
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  tierTabIcon: { fontSize: 24, marginBottom: 4 },
  tierTabName: { fontSize: 12, fontWeight: '600' },
  currentBadge: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  lockedIcon: { position: 'absolute', top: 6, right: 6 },
  
  // Detail Card
  detailCard: { 
    borderRadius: 20, 
    borderWidth: 2, 
    padding: 20, 
    marginBottom: 16,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  tierIconLarge: { 
    width: 60, 
    height: 60, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 16,
  },
  tierIconText: { fontSize: 32 },
  detailHeaderText: { flex: 1 },
  detailTierName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  yourTierBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  yourTierText: { fontSize: 11, fontWeight: '600' },
  
  // Rates
  ratesRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  rateBox: { flex: 1, padding: 14, borderRadius: 12 },
  rateLabel: { fontSize: 12, marginBottom: 4 },
  rateValue: { fontSize: 20, fontWeight: '700' },
  
  // Section
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  
  // Requirements Grid
  requirementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reqItem: { 
    width: (SCREEN_WIDTH - 32 - 40 - 20) / 2, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1,
  },
  reqLabel: { fontSize: 11, marginBottom: 4 },
  reqValue: { fontSize: 14, fontWeight: '600' },
  
  // Benefits List
  benefitsList: { gap: 8 },
  benefitItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12,
    gap: 12,
  },
  benefitIcon: { 
    width: 26, 
    height: 26, 
    borderRadius: 13, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  benefitText: { flex: 1, fontSize: 14 },
  
  // Note Card
  noteCard: { 
    flexDirection: 'row', 
    padding: 14, 
    borderRadius: 14, 
    borderWidth: 1,
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
