// app/kyc.tsx
// KYC Verification Screen - Sumsub Integration
// 6-Language Support | Dark/Light Mode

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';
import KYCWebView from '@/components/KYCWebView';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Kimlik Doğrulama',
    subtitle: 'Limitlerini artırmak için kimliğini doğrula',
    currentLevel: 'Mevcut Seviye',
    levels: {
      none: 'Doğrulanmamış',
      basic: 'Temel',
      verified: 'Doğrulanmış',
      enhanced: 'Tam Doğrulama',
    },
    status: {
      not_started: 'Başlanmadı',
      pending: 'Bekliyor',
      under_review: 'İnceleniyor',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      expired: 'Süresi Doldu',
    },
    limits: 'Limitler',
    dailyWithdraw: 'Günlük Çekim',
    monthlyWithdraw: 'Aylık Çekim',
    singleTransaction: 'Tek İşlem',
    startVerification: 'Doğrulamayı Başlat',
    continueVerification: 'Doğrulamaya Devam Et',
    verificationInProgress: 'Doğrulama devam ediyor...',
    rejected: 'Başvurunuz reddedildi',
    rejectionReason: 'Sebep',
    tryAgain: 'Tekrar Dene',
    approved: 'Kimlik doğrulamanız tamamlandı!',
    pending: 'Başvurunuz inceleniyor. Bu işlem 24-48 saat sürebilir.',
    error: 'Bir hata oluştu',
    loading: 'Yükleniyor...',
    benefits: 'Doğrulama Avantajları',
    benefit1: 'Daha yüksek çekim limitleri',
    benefit2: 'Tüm özelliklere erişim',
    benefit3: 'Fiziksel metal teslimatı',
    benefit4: 'Öncelikli destek',
    requiredDocs: 'Gerekli Belgeler',
    doc1: 'Kimlik belgesi (TC Kimlik, Pasaport veya Ehliyet)',
    doc2: 'Selfie fotoğrafı',
    doc3: 'Adres belgesi (isteğe bağlı)',
    processingTime: 'İşlem Süresi: 5-10 dakika',
    back: 'Geri',
    unlimited: 'Limitsiz',
  },
  en: {
    title: 'Identity Verification',
    subtitle: 'Verify your identity to increase limits',
    currentLevel: 'Current Level',
    levels: {
      none: 'Unverified',
      basic: 'Basic',
      verified: 'Verified',
      enhanced: 'Enhanced',
    },
    status: {
      not_started: 'Not Started',
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      expired: 'Expired',
    },
    limits: 'Limits',
    dailyWithdraw: 'Daily Withdraw',
    monthlyWithdraw: 'Monthly Withdraw',
    singleTransaction: 'Single Transaction',
    startVerification: 'Start Verification',
    continueVerification: 'Continue Verification',
    verificationInProgress: 'Verification in progress...',
    rejected: 'Your application was rejected',
    rejectionReason: 'Reason',
    tryAgain: 'Try Again',
    approved: 'Your identity has been verified!',
    pending: 'Your application is under review. This may take 24-48 hours.',
    error: 'An error occurred',
    loading: 'Loading...',
    benefits: 'Verification Benefits',
    benefit1: 'Higher withdrawal limits',
    benefit2: 'Access to all features',
    benefit3: 'Physical metal delivery',
    benefit4: 'Priority support',
    requiredDocs: 'Required Documents',
    doc1: 'ID Document (Passport, ID Card, or Driver License)',
    doc2: 'Selfie photo',
    doc3: 'Proof of address (optional)',
    processingTime: 'Processing Time: 5-10 minutes',
    back: 'Back',
    unlimited: 'Unlimited',
  },
  de: {
    title: 'Identitätsverifizierung',
    subtitle: 'Verifizieren Sie Ihre Identität, um Limits zu erhöhen',
    currentLevel: 'Aktuelles Level',
    levels: {
      none: 'Nicht verifiziert',
      basic: 'Basis',
      verified: 'Verifiziert',
      enhanced: 'Erweitert',
    },
    status: {
      not_started: 'Nicht gestartet',
      pending: 'Ausstehend',
      under_review: 'In Prüfung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      expired: 'Abgelaufen',
    },
    limits: 'Limits',
    dailyWithdraw: 'Täglich',
    monthlyWithdraw: 'Monatlich',
    singleTransaction: 'Einzeln',
    startVerification: 'Verifizierung starten',
    continueVerification: 'Verifizierung fortsetzen',
    verificationInProgress: 'Verifizierung läuft...',
    rejected: 'Ihr Antrag wurde abgelehnt',
    rejectionReason: 'Grund',
    tryAgain: 'Erneut versuchen',
    approved: 'Ihre Identität wurde verifiziert!',
    pending: 'Ihr Antrag wird geprüft. Dies kann 24-48 Stunden dauern.',
    error: 'Ein Fehler ist aufgetreten',
    loading: 'Laden...',
    benefits: 'Verifizierungsvorteile',
    benefit1: 'Höhere Auszahlungslimits',
    benefit2: 'Zugang zu allen Funktionen',
    benefit3: 'Physische Metalllieferung',
    benefit4: 'Prioritäts-Support',
    requiredDocs: 'Erforderliche Dokumente',
    doc1: 'Ausweisdokument (Reisepass, Personalausweis oder Führerschein)',
    doc2: 'Selfie-Foto',
    doc3: 'Adressnachweis (optional)',
    processingTime: 'Bearbeitungszeit: 5-10 Minuten',
    back: 'Zurück',
    unlimited: 'Unbegrenzt',
  },
  fr: {
    title: 'Vérification d\'identité',
    subtitle: 'Vérifiez votre identité pour augmenter vos limites',
    currentLevel: 'Niveau actuel',
    levels: {
      none: 'Non vérifié',
      basic: 'Basique',
      verified: 'Vérifié',
      enhanced: 'Amélioré',
    },
    status: {
      not_started: 'Non commencé',
      pending: 'En attente',
      under_review: 'En cours d\'examen',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      expired: 'Expiré',
    },
    limits: 'Limites',
    dailyWithdraw: 'Quotidien',
    monthlyWithdraw: 'Mensuel',
    singleTransaction: 'Unique',
    startVerification: 'Commencer la vérification',
    continueVerification: 'Continuer la vérification',
    verificationInProgress: 'Vérification en cours...',
    rejected: 'Votre demande a été rejetée',
    rejectionReason: 'Raison',
    tryAgain: 'Réessayer',
    approved: 'Votre identité a été vérifiée!',
    pending: 'Votre demande est en cours d\'examen. Cela peut prendre 24-48 heures.',
    error: 'Une erreur est survenue',
    loading: 'Chargement...',
    benefits: 'Avantages de la vérification',
    benefit1: 'Limites de retrait plus élevées',
    benefit2: 'Accès à toutes les fonctionnalités',
    benefit3: 'Livraison physique de métaux',
    benefit4: 'Support prioritaire',
    requiredDocs: 'Documents requis',
    doc1: 'Pièce d\'identité (Passeport, Carte d\'identité ou Permis de conduire)',
    doc2: 'Photo selfie',
    doc3: 'Justificatif de domicile (optionnel)',
    processingTime: 'Temps de traitement: 5-10 minutes',
    back: 'Retour',
    unlimited: 'Illimité',
  },
  ar: {
    title: 'التحقق من الهوية',
    subtitle: 'تحقق من هويتك لزيادة الحدود',
    currentLevel: 'المستوى الحالي',
    levels: {
      none: 'غير موثق',
      basic: 'أساسي',
      verified: 'موثق',
      enhanced: 'متقدم',
    },
    status: {
      not_started: 'لم يبدأ',
      pending: 'قيد الانتظار',
      under_review: 'قيد المراجعة',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      expired: 'منتهي الصلاحية',
    },
    limits: 'الحدود',
    dailyWithdraw: 'يومي',
    monthlyWithdraw: 'شهري',
    singleTransaction: 'فردي',
    startVerification: 'بدء التحقق',
    continueVerification: 'متابعة التحقق',
    verificationInProgress: 'التحقق جارٍ...',
    rejected: 'تم رفض طلبك',
    rejectionReason: 'السبب',
    tryAgain: 'حاول مرة أخرى',
    approved: 'تم التحقق من هويتك!',
    pending: 'طلبك قيد المراجعة. قد يستغرق هذا 24-48 ساعة.',
    error: 'حدث خطأ',
    loading: 'جارٍ التحميل...',
    benefits: 'فوائد التحقق',
    benefit1: 'حدود سحب أعلى',
    benefit2: 'الوصول إلى جميع الميزات',
    benefit3: 'توصيل المعادن الفعلية',
    benefit4: 'دعم ذو أولوية',
    requiredDocs: 'المستندات المطلوبة',
    doc1: 'وثيقة الهوية (جواز السفر أو بطاقة الهوية أو رخصة القيادة)',
    doc2: 'صورة سيلفي',
    doc3: 'إثبات العنوان (اختياري)',
    processingTime: 'وقت المعالجة: 5-10 دقائق',
    back: 'رجوع',
    unlimited: 'غير محدود',
  },
  ru: {
    title: 'Верификация личности',
    subtitle: 'Подтвердите свою личность для увеличения лимитов',
    currentLevel: 'Текущий уровень',
    levels: {
      none: 'Не подтверждено',
      basic: 'Базовый',
      verified: 'Подтверждено',
      enhanced: 'Расширенный',
    },
    status: {
      not_started: 'Не начато',
      pending: 'Ожидание',
      under_review: 'На рассмотрении',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      expired: 'Истекло',
    },
    limits: 'Лимиты',
    dailyWithdraw: 'Ежедневно',
    monthlyWithdraw: 'Ежемесячно',
    singleTransaction: 'Разовый',
    startVerification: 'Начать верификацию',
    continueVerification: 'Продолжить верификацию',
    verificationInProgress: 'Верификация в процессе...',
    rejected: 'Ваша заявка отклонена',
    rejectionReason: 'Причина',
    tryAgain: 'Попробовать снова',
    approved: 'Ваша личность подтверждена!',
    pending: 'Ваша заявка на рассмотрении. Это может занять 24-48 часов.',
    error: 'Произошла ошибка',
    loading: 'Загрузка...',
    benefits: 'Преимущества верификации',
    benefit1: 'Более высокие лимиты на вывод',
    benefit2: 'Доступ ко всем функциям',
    benefit3: 'Физическая доставка металлов',
    benefit4: 'Приоритетная поддержка',
    requiredDocs: 'Необходимые документы',
    doc1: 'Удостоверение личности (Паспорт, ID-карта или Водительские права)',
    doc2: 'Селфи фото',
    doc3: 'Подтверждение адреса (необязательно)',
    processingTime: 'Время обработки: 5-10 минут',
    back: 'Назад',
    unlimited: 'Без лимита',
  },
};

// ============================================
// TYPES
// ============================================
interface KYCData {
  walletAddress: string;
  level: 'none' | 'basic' | 'verified' | 'enhanced';
  status: 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  limits: {
    dailyWithdraw: number;
    monthlyWithdraw: number;
    singleTransaction: number;
  };
  verification?: {
    rejectionReason?: string;
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function KYCScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress: storeWalletAddress } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;
  const isRTL = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KYCData | null>(null);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(storeWalletAddress);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    loadWalletAndKYC();
  }, [storeWalletAddress]);

  const loadWalletAndKYC = async () => {
    try {
      // Önce store'dan, yoksa AsyncStorage'dan oku
      let address = storeWalletAddress;
      if (!address) {
        address = await AsyncStorage.getItem('auxite_wallet_address');
      }
      
      if (address) {
        setWalletAddress(address);
        // KYC durumunu getir
        const res = await fetch(`${API_URL}/api/kyc`, {
          headers: { 'x-wallet-address': address },
        });
        const data = await res.json();
        setKyc(data.kyc);
      }
    } catch (err) {
      console.error('Load wallet/KYC error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKYC = async () => {
    if (!walletAddress) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/kyc`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setKyc(data.kyc);
    } catch (err) {
      console.error('Fetch KYC error:', err);
    }
  };

  const launchSumsubSDK = useCallback(async () => {
    if (!walletAddress) {
      setErrorMessage(t.error + ': Wallet address not found');
      return;
    }
    
    setSdkLoading(true);
    setErrorMessage('');

    try {
      // Token al
      const tokenRes = await fetch(`${API_URL}/api/kyc/sumsub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({}),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        throw new Error(tokenData.error || 'Token alınamadı');
      }

      // Token'ı kaydet ve WebView'ı aç
      setAccessToken(tokenData.accessToken);
      setShowWebView(true);

    } catch (err: any) {
      console.error('SDK launch error:', err);
      setErrorMessage(err.message || t.error);
    } finally {
      setSdkLoading(false);
    }
  }, [walletAddress, t.error]);

  const handleWebViewComplete = () => {
    setShowWebView(false);
    fetchKYC(); // Durumu güncelle
  };

  const isApproved = kyc?.status === 'approved';
  const isRejected = kyc?.status === 'rejected';
  const isPending = kyc?.status === 'pending' || kyc?.status === 'under_review';

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'enhanced': return '#8B5CF6';
      case 'verified': return colors.primary;
      case 'basic': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getStatusColor = () => {
    if (isApproved) return colors.primary;
    if (isRejected) return colors.danger;
    if (isPending) return colors.warning;
    return colors.textMuted;
  };

  const formatLimit = (value: number) => {
    if (value >= 1000000) return t.unlimited;
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.loading}</Text>
        </View>
      </View>
    );
  }

  // Wallet bağlı değilse
  if (!walletAddress) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.noWalletContainer}>
          <View style={[styles.noWalletIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.warning} />
          </View>
          <Text style={[styles.noWalletTitle, { color: colors.text }]}>
            {language === 'tr' ? 'Cüzdan Bağlı Değil' : 'No Wallet Connected'}
          </Text>
          <Text style={[styles.noWalletDesc, { color: colors.textSecondary }]}>
            {language === 'tr' 
              ? 'KYC doğrulaması için önce bir cüzdan oluşturmanız veya içe aktarmanız gerekiyor.'
              : 'You need to create or import a wallet first to start KYC verification.'}
          </Text>
          <TouchableOpacity 
            style={styles.createWalletButton}
            onPress={() => router.push('/wallet-onboarding')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.createWalletButtonText}>
              {language === 'tr' ? 'Cüzdan Oluştur' : 'Create Wallet'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Level Card */}
        <View style={[styles.levelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>{t.currentLevel}</Text>
              <Text style={[styles.levelValue, { color: getLevelColor(kyc?.level || 'none') }]}>
                {t.levels[kyc?.level || 'none']}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {t.status[kyc?.status || 'not_started']}
              </Text>
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.levelProgress}>
            {['none', 'basic', 'verified', 'enhanced'].map((level, index) => (
              <View key={level} style={styles.levelStep}>
                <View style={[
                  styles.levelDot,
                  {
                    backgroundColor: ['none', 'basic', 'verified', 'enhanced'].indexOf(kyc?.level || 'none') >= index
                      ? getLevelColor(level)
                      : colors.surfaceAlt,
                  },
                ]}>
                  {['none', 'basic', 'verified', 'enhanced'].indexOf(kyc?.level || 'none') >= index && (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  )}
                </View>
                {index < 3 && (
                  <View style={[
                    styles.levelLine,
                    {
                      backgroundColor: ['none', 'basic', 'verified', 'enhanced'].indexOf(kyc?.level || 'none') > index
                        ? colors.primary
                        : colors.surfaceAlt,
                    },
                  ]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Limits Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t.limits}</Text>
          <View style={styles.limitsGrid}>
            <View style={styles.limitItem}>
              <Ionicons name="today-outline" size={20} color={colors.primary} />
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>{t.dailyWithdraw}</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(kyc?.limits.dailyWithdraw || 0)}
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>{t.monthlyWithdraw}</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(kyc?.limits.monthlyWithdraw || 0)}
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>{t.singleTransaction}</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(kyc?.limits.singleTransaction || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Messages */}
        {isApproved && (
          <View style={[styles.statusCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <Text style={[styles.statusMessage, { color: colors.primary }]}>{t.approved}</Text>
          </View>
        )}

        {isPending && (
          <View style={[styles.statusCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
            <Ionicons name="time" size={24} color={colors.warning} />
            <Text style={[styles.statusMessage, { color: colors.warning }]}>{t.pending}</Text>
          </View>
        )}

        {isPending && (
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: colors.warning }]}
            onPress={launchSumsubSDK}
            disabled={sdkLoading}
          >
            {sdkLoading ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color={colors.warning} />
                <Text style={[styles.retryButtonText, { color: colors.warning }]}>
                  {language === 'tr' ? 'Doğrulamaya Devam Et' : 'Continue Verification'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isRejected && (
          <View style={[styles.statusCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '30' }]}>
            <Ionicons name="close-circle" size={24} color={colors.danger} />
            <View style={styles.rejectedContent}>
              <Text style={[styles.statusMessage, { color: colors.danger }]}>{t.rejected}</Text>
              {kyc?.verification?.rejectionReason && (
                <Text style={[styles.rejectionReason, { color: colors.danger }]}>
                  {t.rejectionReason}: {kyc.verification.rejectionReason}
                </Text>
              )}
            </View>
          </View>
        )}

        {errorMessage && (
          <View style={[styles.errorCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '30' }]}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Benefits Card */}
        {!isApproved && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.benefits}</Text>
            {[t.benefit1, t.benefit2, t.benefit3, t.benefit4].map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Required Documents */}
        {!isApproved && !isPending && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.requiredDocs}</Text>
            {[t.doc1, t.doc2, t.doc3].map((doc, index) => (
              <View key={index} style={styles.docRow}>
                <Ionicons 
                  name={index === 0 ? 'card-outline' : index === 1 ? 'camera-outline' : 'home-outline'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
                <Text style={[styles.docText, { color: colors.textSecondary }]}>{doc}</Text>
              </View>
            ))}
            <View style={styles.processingTimeRow}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.processingTimeText, { color: colors.primary }]}>{t.processingTime}</Text>
            </View>
          </View>
        )}

        {/* Start/Continue Button */}
        {!isApproved && !isPending && (
          <TouchableOpacity
            style={[styles.startButton, sdkLoading && styles.buttonDisabled]}
            onPress={launchSumsubSDK}
            disabled={sdkLoading}
          >
            {sdkLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={22} color="#FFF" />
                <Text style={styles.startButtonText}>
                  {isRejected ? t.tryAgain : kyc?.status === 'not_started' ? t.startVerification : t.continueVerification}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* KYC WebView Modal */}
      {showWebView && accessToken && (
        <KYCWebView
          visible={showWebView}
          onClose={() => {
            setShowWebView(false);
            fetchKYC();
          }}
          accessToken={accessToken}
          onComplete={handleWebViewComplete}
        />
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  levelCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  levelLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  limitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  limitItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  limitLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  statusMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  rejectedContent: {
    flex: 1,
  },
  rejectionReason: {
    fontSize: 12,
    marginTop: 4,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  docText: {
    fontSize: 13,
    flex: 1,
  },
  processingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  processingTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // No Wallet Styles
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noWalletIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noWalletTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  noWalletDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  createWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  createWalletButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
