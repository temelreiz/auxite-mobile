// app/referral.tsx
// Referral Dashboard Screen
// 6-Language Support | Dark/Light Mode | Tier System

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Referans Programı',
    yourCode: 'Referans Kodunuz',
    copyCode: 'Kodu Kopyala',
    copied: 'Kopyalandı!',
    shareLink: 'Paylaş',
    stats: 'İstatistikler',
    totalReferrals: 'Toplam Referans',
    qualified: 'Onaylanan',
    pending: 'Bekleyen',
    earnings: 'Kazançlar',
    totalEarnings: 'Toplam Kazanç',
    pendingEarnings: 'Bekleyen Kazanç',
    withdraw: 'Çek',
    withdrawing: 'Çekiliyor...',
    tier: 'Seviye',
    commission: 'Komisyon',
    referrals: 'Referanslarım',
    noReferrals: 'Henüz referans yok',
    noReferralsDesc: 'Arkadaşlarınızı davet edin ve bonus kazanın!',
    applyCode: 'Kod Uygula',
    enterCode: 'Referans kodu girin',
    apply: 'Uygula',
    cancel: 'İptal',
    referredBy: 'Referansınız',
    howItWorks: 'Nasıl Çalışır?',
    step1: 'Arkadaşlarınızla kodunuzu paylaşın',
    step2: 'Arkadaşınız $50+ işlem yaptığında',
    step3: 'İkiniz de $10 AUXM bonus kazanın!',
    nextTier: 'Sonraki seviye',
    referral: 'referans',
    max: 'MAX',
    rewarded: 'Ödendi',
    ready: 'Hazır',
    bronze: 'Bronz',
    silver: 'Gümüş',
    gold: 'Altın',
    platinum: 'Platin',
    back: 'Geri',
    inviteFriends: 'Arkadaşlarını Davet Et',
    earnBonus: 'Bonus Kazan',
    shareMessage: 'Auxite Wallet\'a katıl ve bonus kazan! Referans kodum: {code}\n\nhttps://auxite.com/?ref={code}',
  },
  en: {
    title: 'Referral Program',
    yourCode: 'Your Referral Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    shareLink: 'Share',
    stats: 'Statistics',
    totalReferrals: 'Total Referrals',
    qualified: 'Qualified',
    pending: 'Pending',
    earnings: 'Earnings',
    totalEarnings: 'Total Earnings',
    pendingEarnings: 'Pending Earnings',
    withdraw: 'Withdraw',
    withdrawing: 'Withdrawing...',
    tier: 'Tier',
    commission: 'Commission',
    referrals: 'My Referrals',
    noReferrals: 'No referrals yet',
    noReferralsDesc: 'Invite your friends and earn bonus!',
    applyCode: 'Apply Code',
    enterCode: 'Enter referral code',
    apply: 'Apply',
    cancel: 'Cancel',
    referredBy: 'Referred By',
    howItWorks: 'How It Works?',
    step1: 'Share your code with friends',
    step2: 'When your friend makes a $50+ trade',
    step3: 'You both earn $10 AUXM bonus!',
    nextTier: 'Next tier at',
    referral: 'referrals',
    max: 'MAX',
    rewarded: 'Rewarded',
    ready: 'Ready',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    back: 'Back',
    inviteFriends: 'Invite Friends',
    earnBonus: 'Earn Bonus',
    shareMessage: 'Join Auxite Wallet and earn bonus! My referral code: {code}\n\nhttps://auxite.com/?ref={code}',
  },
  de: {
    title: 'Empfehlungsprogramm',
    yourCode: 'Ihr Empfehlungscode',
    copyCode: 'Code kopieren',
    copied: 'Kopiert!',
    shareLink: 'Teilen',
    stats: 'Statistiken',
    totalReferrals: 'Gesamte Empfehlungen',
    qualified: 'Qualifiziert',
    pending: 'Ausstehend',
    earnings: 'Einnahmen',
    totalEarnings: 'Gesamteinnahmen',
    pendingEarnings: 'Ausstehende Einnahmen',
    withdraw: 'Abheben',
    withdrawing: 'Wird abgehoben...',
    tier: 'Stufe',
    commission: 'Provision',
    referrals: 'Meine Empfehlungen',
    noReferrals: 'Noch keine Empfehlungen',
    noReferralsDesc: 'Laden Sie Freunde ein und verdienen Sie Bonus!',
    applyCode: 'Code anwenden',
    enterCode: 'Empfehlungscode eingeben',
    apply: 'Anwenden',
    cancel: 'Abbrechen',
    referredBy: 'Empfohlen von',
    howItWorks: 'Wie funktioniert es?',
    step1: 'Teilen Sie Ihren Code mit Freunden',
    step2: 'Wenn Ihr Freund einen $50+ Trade macht',
    step3: 'Sie beide verdienen $10 AUXM Bonus!',
    nextTier: 'Nächste Stufe bei',
    referral: 'Empfehlungen',
    max: 'MAX',
    rewarded: 'Belohnt',
    ready: 'Bereit',
    bronze: 'Bronze',
    silver: 'Silber',
    gold: 'Gold',
    platinum: 'Platin',
    back: 'Zurück',
    inviteFriends: 'Freunde einladen',
    earnBonus: 'Bonus verdienen',
    shareMessage: 'Tritt Auxite Wallet bei! Mein Code: {code}\n\nhttps://auxite.com/?ref={code}',
  },
  fr: {
    title: 'Programme de Parrainage',
    yourCode: 'Votre Code de Parrainage',
    copyCode: 'Copier le Code',
    copied: 'Copié!',
    shareLink: 'Partager',
    stats: 'Statistiques',
    totalReferrals: 'Total des Parrainages',
    qualified: 'Qualifiés',
    pending: 'En attente',
    earnings: 'Gains',
    totalEarnings: 'Gains Totaux',
    pendingEarnings: 'Gains en Attente',
    withdraw: 'Retirer',
    withdrawing: 'Retrait...',
    tier: 'Niveau',
    commission: 'Commission',
    referrals: 'Mes Parrainages',
    noReferrals: 'Pas encore de parrainages',
    noReferralsDesc: 'Invitez vos amis et gagnez des bonus!',
    applyCode: 'Appliquer le Code',
    enterCode: 'Entrez le code de parrainage',
    apply: 'Appliquer',
    cancel: 'Annuler',
    referredBy: 'Parrainé par',
    howItWorks: 'Comment ça marche?',
    step1: 'Partagez votre code avec vos amis',
    step2: 'Quand votre ami fait un trade de $50+',
    step3: 'Vous gagnez tous les deux $10 AUXM!',
    nextTier: 'Prochain niveau à',
    referral: 'parrainages',
    max: 'MAX',
    rewarded: 'Récompensé',
    ready: 'Prêt',
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
    back: 'Retour',
    inviteFriends: 'Inviter des amis',
    earnBonus: 'Gagner un bonus',
    shareMessage: 'Rejoins Auxite Wallet! Mon code: {code}\n\nhttps://auxite.com/?ref={code}',
  },
  ar: {
    title: 'برنامج الإحالة',
    yourCode: 'رمز الإحالة الخاص بك',
    copyCode: 'نسخ الرمز',
    copied: 'تم النسخ!',
    shareLink: 'مشاركة',
    stats: 'الإحصائيات',
    totalReferrals: 'إجمالي الإحالات',
    qualified: 'مؤهل',
    pending: 'قيد الانتظار',
    earnings: 'الأرباح',
    totalEarnings: 'إجمالي الأرباح',
    pendingEarnings: 'الأرباح المعلقة',
    withdraw: 'سحب',
    withdrawing: 'جارٍ السحب...',
    tier: 'المستوى',
    commission: 'العمولة',
    referrals: 'إحالاتي',
    noReferrals: 'لا توجد إحالات بعد',
    noReferralsDesc: 'ادعُ أصدقاءك واكسب مكافآت!',
    applyCode: 'تطبيق الرمز',
    enterCode: 'أدخل رمز الإحالة',
    apply: 'تطبيق',
    cancel: 'إلغاء',
    referredBy: 'تمت الإحالة بواسطة',
    howItWorks: 'كيف يعمل؟',
    step1: 'شارك رمزك مع الأصدقاء',
    step2: 'عندما يقوم صديقك بتداول $50+',
    step3: 'كلاكما يكسب $10 AUXM!',
    nextTier: 'المستوى التالي عند',
    referral: 'إحالات',
    max: 'الحد الأقصى',
    rewarded: 'مكافأ',
    ready: 'جاهز',
    bronze: 'برونزي',
    silver: 'فضي',
    gold: 'ذهبي',
    platinum: 'بلاتيني',
    back: 'رجوع',
    inviteFriends: 'دعوة الأصدقاء',
    earnBonus: 'اكسب مكافأة',
    shareMessage: 'انضم إلى Auxite Wallet! رمزي: {code}\n\nhttps://auxite.com/?ref={code}',
  },
  ru: {
    title: 'Реферальная Программа',
    yourCode: 'Ваш Реферальный Код',
    copyCode: 'Копировать код',
    copied: 'Скопировано!',
    shareLink: 'Поделиться',
    stats: 'Статистика',
    totalReferrals: 'Всего рефералов',
    qualified: 'Квалифицированы',
    pending: 'В ожидании',
    earnings: 'Заработок',
    totalEarnings: 'Общий заработок',
    pendingEarnings: 'Ожидающий заработок',
    withdraw: 'Вывести',
    withdrawing: 'Вывод...',
    tier: 'Уровень',
    commission: 'Комиссия',
    referrals: 'Мои рефералы',
    noReferrals: 'Пока нет рефералов',
    noReferralsDesc: 'Пригласите друзей и получите бонус!',
    applyCode: 'Применить код',
    enterCode: 'Введите реферальный код',
    apply: 'Применить',
    cancel: 'Отмена',
    referredBy: 'Приглашён',
    howItWorks: 'Как это работает?',
    step1: 'Поделитесь кодом с друзьями',
    step2: 'Когда друг совершит сделку на $50+',
    step3: 'Вы оба получите $10 AUXM бонус!',
    nextTier: 'Следующий уровень',
    referral: 'рефералов',
    max: 'МАКС',
    rewarded: 'Выплачено',
    ready: 'Готов',
    bronze: 'Бронза',
    silver: 'Серебро',
    gold: 'Золото',
    platinum: 'Платина',
    back: 'Назад',
    inviteFriends: 'Пригласить друзей',
    earnBonus: 'Получить бонус',
    shareMessage: 'Присоединяйся к Auxite Wallet! Мой код: {code}\n\nhttps://auxite.com/?ref={code}',
  },
};

// ============================================
// TYPES
// ============================================
interface ReferralStats {
  code: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commissionRate: number;
}

interface ReferralUsage {
  id: string;
  code: string;
  referrerAddress: string;
  referredAddress: string;
  usedAt: number;
  status: 'pending' | 'qualified' | 'rewarded';
  firstTradeAt?: number;
  firstTradeAmount?: number;
  rewardAmount?: number;
}

// ============================================
// TIER CONFIG
// ============================================
const TIER_CONFIG = {
  bronze: { icon: '🥉', nextAt: 10, color: '#CD7F32' },
  silver: { icon: '🥈', nextAt: 50, color: '#C0C0C0' },
  gold: { icon: '🥇', nextAt: 100, color: '#FFD700' },
  platinum: { icon: '💎', nextAt: null, color: '#00CED1' },
};

// Wallet adresinden benzersiz referral kodu üret
const generateReferralCode = (address: string): string => {
  if (!address) return 'AUXITE';
  // Adresin hash'inden 6 karakterlik kod üret
  const cleaned = address.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = 'AUX';
  const suffix = cleaned.slice(-6);
  return `${prefix}${suffix}`;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress: storeWalletAddress } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;
  const isRTL = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralUsage[]>([]);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(storeWalletAddress);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showApplyCode, setShowApplyCode] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#10B981',
    purple: '#8B5CF6',
    amber: '#F59E0B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    loadWalletAndData();
  }, [storeWalletAddress]);

  const loadWalletAndData = async () => {
    try {
      let address = storeWalletAddress;
      if (!address) {
        address = await AsyncStorage.getItem('auxite_wallet_address');
      }

      if (address) {
        setWalletAddress(address);
        await fetchReferralData(address);
      } else {
        // Wallet yoksa varsayılan değerlerle başlat
        setStats({
          code: 'AUXITE',
          totalReferrals: 0,
          qualifiedReferrals: 0,
          pendingReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          tier: 'bronze',
          commissionRate: 0.1,
        });
      }
    } catch (err) {
      console.error('Load error:', err);
      // Hata durumunda da varsayılan değerler
      setStats({
        code: 'AUXITE',
        totalReferrals: 0,
        qualifiedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        tier: 'bronze',
        commissionRate: 0.1,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralData = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/referral?address=${address}`);
      const data = await res.json();
      
      // API'den kod geldiyse kullan, yoksa wallet'tan üret
      const referralCode = data.stats?.code || generateReferralCode(address);
      
      setStats({
        code: referralCode,
        totalReferrals: data.stats?.totalReferrals || 0,
        qualifiedReferrals: data.stats?.qualifiedReferrals || 0,
        pendingReferrals: data.stats?.pendingReferrals || 0,
        totalEarnings: data.stats?.totalEarnings || 0,
        pendingEarnings: data.stats?.pendingEarnings || 0,
        tier: data.stats?.tier || 'bronze',
        commissionRate: data.stats?.commissionRate || 0.1,
      });
      setReferrals(data.referrals || []);
      setReferredBy(data.referredBy);
    } catch (err) {
      console.error('Fetch referral error:', err);
      // API hatası durumunda da kod üret
      const referralCode = generateReferralCode(address);
      setStats({
        code: referralCode,
        totalReferrals: 0,
        qualifiedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        tier: 'bronze',
        commissionRate: 0.1,
      });
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await fetchReferralData(walletAddress);
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    if (!stats?.code) return;
    await Clipboard.setStringAsync(stats.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!stats?.code) return;
    try {
      const message = t.shareMessage.replace(/{code}/g, stats.code);
      await Share.share({ message });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!stats?.pendingEarnings || stats.pendingEarnings <= 0 || !walletAddress) return;

    setWithdrawing(true);
    try {
      const res = await fetch(`${API_URL}/api/referral`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, action: 'withdraw' }),
      });

      if (res.ok) {
        const data = await res.json();
        Alert.alert('✓', `$${data.paidAmount.toFixed(2)} AUXM added to your balance!`);
        await fetchReferralData(walletAddress);
      }
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleApplyCode = async () => {
    if (!applyCode.trim() || !walletAddress) return;

    setApplyLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, referralCode: applyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert('✓', data.message);
      setShowApplyCode(false);
      setApplyCode('');
      await fetchReferralData(walletAddress);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setApplyLoading(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(
      language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
  };

  const tierConfig = stats?.tier ? TIER_CONFIG[stats.tier] : TIER_CONFIG.bronze;
  const tierName = stats?.tier ? t[stats.tier as keyof typeof t] : t.bronze;

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Your Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t.yourCode}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{stats?.code || generateReferralCode(walletAddress || '')}</Text>
            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copyButtonActive]}
              onPress={handleCopyCode}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? '#10B981' : '#C084FC'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#FFF" />
            <Text style={styles.shareButtonText}>{t.shareLink}</Text>
          </TouchableOpacity>
        </View>

        {/* Tier Card */}
        <View style={[styles.tierCard, { backgroundColor: tierConfig.color + '20', borderColor: tierConfig.color + '40' }]}>
          <View style={styles.tierLeft}>
            <Text style={styles.tierIcon}>{tierConfig.icon}</Text>
            <View>
              <Text style={[styles.tierName, { color: tierConfig.color }]}>{t.tier}: {tierName}</Text>
              <Text style={[styles.tierCommission, { color: colors.textSecondary }]}>
                {t.commission}: {((stats?.commissionRate || 0.1) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={styles.tierRight}>
            <Text style={[styles.tierNextLabel, { color: colors.textMuted }]}>{t.nextTier}</Text>
            <Text style={[styles.tierNextValue, { color: tierConfig.color }]}>
              {tierConfig.nextAt ? `${tierConfig.nextAt} ${t.referral}` : t.max}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalReferrals || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.totalReferrals}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.qualifiedReferrals || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.qualified}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.amber }]}>{stats?.pendingReferrals || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.pending}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.purple }]}>${(stats?.totalEarnings || 0).toFixed(2)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.totalEarnings}</Text>
          </View>
        </View>

        {/* Pending Earnings */}
        {(stats?.pendingEarnings || 0) > 0 && (
          <View style={[styles.pendingCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <View>
              <Text style={[styles.pendingLabel, { color: colors.textSecondary }]}>{t.pendingEarnings}</Text>
              <Text style={[styles.pendingValue, { color: colors.primary }]}>${stats?.pendingEarnings.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.withdrawButton, withdrawing && styles.withdrawButtonDisabled]}
              onPress={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.withdrawButtonText}>{t.withdraw}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Apply Code */}
        {!referredBy && (
          <View style={[styles.applyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {!showApplyCode ? (
              <TouchableOpacity onPress={() => setShowApplyCode(true)}>
                <Text style={[styles.applyLink, { color: colors.purple }]}>{t.applyCode}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.applyForm}>
                <TextInput
                  style={[styles.applyInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                  placeholder={t.enterCode}
                  placeholderTextColor={colors.textMuted}
                  value={applyCode}
                  onChangeText={(text) => setApplyCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <View style={styles.applyButtons}>
                  <TouchableOpacity
                    style={[styles.applySubmitButton, applyLoading && { opacity: 0.6 }]}
                    onPress={handleApplyCode}
                    disabled={applyLoading}
                  >
                    {applyLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.applySubmitText}>{t.apply}</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.applyCancelButton, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => { setShowApplyCode(false); setApplyCode(''); }}
                  >
                    <Text style={[styles.applyCancelText, { color: colors.text }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Referred By */}
        {referredBy && (
          <View style={[styles.referredByCard, { backgroundColor: colors.purple + '15', borderColor: colors.purple + '30' }]}>
            <Text style={[styles.referredByLabel, { color: colors.purple }]}>
              {t.referredBy}: <Text style={styles.referredByCode}>{referredBy}</Text>
            </Text>
          </View>
        )}

        {/* Referrals List */}
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: colors.text }]}>{t.referrals}</Text>
          {referrals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noReferrals}</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t.noReferralsDesc}</Text>
            </View>
          ) : (
            referrals.map((ref) => (
              <View key={ref.id} style={[styles.referralCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.referralLeft}>
                  <View style={[styles.statusDot, {
                    backgroundColor: ref.status === 'rewarded' ? colors.primary :
                      ref.status === 'qualified' ? colors.amber : colors.textMuted
                  }]} />
                  <View>
                    <Text style={[styles.referralAddress, { color: colors.text }]}>{formatAddress(ref.referredAddress)}</Text>
                    <Text style={[styles.referralDate, { color: colors.textMuted }]}>{formatDate(ref.usedAt)}</Text>
                  </View>
                </View>
                <View style={styles.referralRight}>
                  <View style={[styles.statusBadge, {
                    backgroundColor: ref.status === 'rewarded' ? colors.primary + '20' :
                      ref.status === 'qualified' ? colors.amber + '20' : colors.surfaceAlt
                  }]}>
                    <Text style={[styles.statusText, {
                      color: ref.status === 'rewarded' ? colors.primary :
                        ref.status === 'qualified' ? colors.amber : colors.textMuted
                    }]}>
                      {ref.status === 'rewarded' ? `✓ ${t.rewarded}` : ref.status === 'qualified' ? t.ready : t.pending}
                    </Text>
                  </View>
                  {ref.rewardAmount && (
                    <Text style={[styles.rewardAmount, { color: colors.primary }]}>+${ref.rewardAmount.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* How It Works */}
        <View style={[styles.howItWorksCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.howItWorksTitle, { color: colors.text }]}>{t.howItWorks}</Text>
          <View style={styles.howItWorksSteps}>
            <Text style={[styles.howItWorksStep, { color: colors.textSecondary }]}>1️⃣ {t.step1}</Text>
            <Text style={[styles.howItWorksStep, { color: colors.textSecondary }]}>2️⃣ {t.step2}</Text>
            <Text style={[styles.howItWorksStep, { color: colors.textSecondary }]}>3️⃣ {t.step3}</Text>
          </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16 },
  codeCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(139, 92, 246, 0.15)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  codeLabel: { fontSize: 13, color: '#C084FC', marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  codeText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: 2 },
  copyButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(139, 92, 246, 0.3)', justifyContent: 'center', alignItems: 'center' },
  copyButtonActive: { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#8B5CF6', borderRadius: 10 },
  shareButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  tierCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierIcon: { fontSize: 32 },
  tierName: { fontSize: 15, fontWeight: '600' },
  tierCommission: { fontSize: 12, marginTop: 2 },
  tierRight: { alignItems: 'flex-end' },
  tierNextLabel: { fontSize: 11 },
  tierNextValue: { fontSize: 13, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  pendingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  pendingLabel: { fontSize: 12, marginBottom: 4 },
  pendingValue: { fontSize: 24, fontWeight: '700' },
  withdrawButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#10B981', borderRadius: 10, minWidth: 100, alignItems: 'center' },
  withdrawButtonDisabled: { opacity: 0.6 },
  withdrawButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  applyCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  applyLink: { textAlign: 'center', fontWeight: '500', fontSize: 14 },
  applyForm: { gap: 12 },
  applyInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600', textAlign: 'center', letterSpacing: 2 },
  applyButtons: { flexDirection: 'row', gap: 10 },
  applySubmitButton: { flex: 1, paddingVertical: 12, backgroundColor: '#8B5CF6', borderRadius: 10, alignItems: 'center' },
  applySubmitText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  applyCancelButton: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  applyCancelText: { fontSize: 16, fontWeight: '600' },
  referredByCard: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  referredByLabel: { fontSize: 13 },
  referredByCode: { fontFamily: 'monospace', fontWeight: '600' },
  listSection: { marginBottom: 16 },
  listTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyCard: { padding: 30, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '500', marginTop: 12 },
  emptyDesc: { fontSize: 12, marginTop: 4 },
  referralCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  referralLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  referralAddress: { fontSize: 13, fontFamily: 'monospace', fontWeight: '500' },
  referralDate: { fontSize: 11, marginTop: 2 },
  referralRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '500' },
  rewardAmount: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  howItWorksCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  howItWorksTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  howItWorksSteps: { gap: 8 },
  howItWorksStep: { fontSize: 13, lineHeight: 20 },
});
