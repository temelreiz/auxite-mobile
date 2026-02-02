// app/recurring-buy.tsx
// Recurring Buy (DCA) Manager Screen
// 6-Language Support | Dark/Light Mode | Automated Purchase Plans

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
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';
import { Image } from 'react-native';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Otomatik Alım (DCA)',
    subtitle: 'Düzenli aralıklarla otomatik yatırım yapın',
    activePlans: 'Aktif Planlar',
    createPlan: 'Yeni Plan Oluştur',
    noPlan: 'Henüz otomatik alım planınız yok',
    noPlanDesc: 'DCA stratejisi ile düzenli yatırım yapın',
    selectAsset: 'Varlık Seçin',
    amount: 'Miktar (USD)',
    frequency: 'Sıklık',
    daily: 'Günlük',
    weekly: 'Haftalık',
    biweekly: '2 Haftada Bir',
    monthly: 'Aylık',
    startDate: 'Başlangıç',
    nextPurchase: 'Sonraki Alım',
    totalInvested: 'Toplam Yatırım',
    totalPurchases: 'Toplam Alım',
    status: 'Durum',
    active: 'Aktif',
    paused: 'Duraklatıldı',
    cancelled: 'İptal Edildi',
    pause: 'Duraklat',
    resume: 'Devam Et',
    cancel: 'İptal',
    delete: 'Sil',
    create: 'Oluştur',
    minAmount: 'Minimum: $10',
    paymentMethod: 'Ödeme Yöntemi',
    usdBalance: 'USD Bakiyesi',
    card: 'Kayıtlı Kart',
    confirmDelete: 'Bu planı silmek istediğinize emin misiniz?',
    confirmCancel: 'Bu planı iptal etmek istediğinize emin misiniz?',
    success: 'Plan oluşturuldu!',
    error: 'Hata',
    insufficientBalance: 'Yetersiz bakiye',
    back: 'Geri',
    dcaInfo: 'DCA Nedir?',
    dcaInfoDesc: 'Dollar Cost Averaging, düzenli aralıklarla sabit miktarda yatırım yaparak piyasa dalgalanmalarından korunmanızı sağlar.',
  },
  en: {
    title: 'Recurring Buy (DCA)',
    subtitle: 'Automate your investments at regular intervals',
    activePlans: 'Active Plans',
    createPlan: 'Create New Plan',
    noPlan: 'No recurring buy plans yet',
    noPlanDesc: 'Invest regularly with DCA strategy',
    selectAsset: 'Select Asset',
    amount: 'Amount (USD)',
    frequency: 'Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    startDate: 'Start Date',
    nextPurchase: 'Next Purchase',
    totalInvested: 'Total Invested',
    totalPurchases: 'Total Purchases',
    status: 'Status',
    active: 'Active',
    paused: 'Paused',
    cancelled: 'Cancelled',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    delete: 'Delete',
    create: 'Create',
    minAmount: 'Minimum: $10',
    paymentMethod: 'Payment Method',
    usdBalance: 'USD Balance',
    card: 'Saved Card',
    confirmDelete: 'Are you sure you want to delete this plan?',
    confirmCancel: 'Are you sure you want to cancel this plan?',
    success: 'Plan created!',
    error: 'Error',
    insufficientBalance: 'Insufficient balance',
    back: 'Back',
    dcaInfo: 'What is DCA?',
    dcaInfoDesc: 'Dollar Cost Averaging helps protect you from market volatility by investing a fixed amount at regular intervals.',
  },
  de: {
    title: 'Wiederkehrender Kauf (DCA)',
    subtitle: 'Automatisieren Sie Ihre Investitionen',
    activePlans: 'Aktive Pläne',
    createPlan: 'Neuen Plan erstellen',
    noPlan: 'Noch keine wiederkehrenden Käufe',
    noPlanDesc: 'Investieren Sie regelmäßig mit DCA',
    selectAsset: 'Asset auswählen',
    amount: 'Betrag (USD)',
    frequency: 'Häufigkeit',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    biweekly: 'Zweiwöchentlich',
    monthly: 'Monatlich',
    startDate: 'Startdatum',
    nextPurchase: 'Nächster Kauf',
    totalInvested: 'Gesamt investiert',
    totalPurchases: 'Gesamtkäufe',
    status: 'Status',
    active: 'Aktiv',
    paused: 'Pausiert',
    cancelled: 'Storniert',
    pause: 'Pausieren',
    resume: 'Fortsetzen',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    create: 'Erstellen',
    minAmount: 'Minimum: $10',
    paymentMethod: 'Zahlungsmethode',
    usdBalance: 'USD Guthaben',
    card: 'Gespeicherte Karte',
    confirmDelete: 'Möchten Sie diesen Plan wirklich löschen?',
    confirmCancel: 'Möchten Sie diesen Plan wirklich abbrechen?',
    success: 'Plan erstellt!',
    error: 'Fehler',
    insufficientBalance: 'Unzureichendes Guthaben',
    back: 'Zurück',
    dcaInfo: 'Was ist DCA?',
    dcaInfoDesc: 'Dollar Cost Averaging schützt Sie vor Marktschwankungen durch regelmäßige Investitionen.',
  },
  fr: {
    title: 'Achat Récurrent (DCA)',
    subtitle: 'Automatisez vos investissements',
    activePlans: 'Plans Actifs',
    createPlan: 'Créer un Plan',
    noPlan: 'Aucun plan d\'achat récurrent',
    noPlanDesc: 'Investissez régulièrement avec DCA',
    selectAsset: 'Sélectionner l\'actif',
    amount: 'Montant (USD)',
    frequency: 'Fréquence',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    biweekly: 'Bi-mensuel',
    monthly: 'Mensuel',
    startDate: 'Date de début',
    nextPurchase: 'Prochain achat',
    totalInvested: 'Total investi',
    totalPurchases: 'Achats totaux',
    status: 'Statut',
    active: 'Actif',
    paused: 'En pause',
    cancelled: 'Annulé',
    pause: 'Pause',
    resume: 'Reprendre',
    cancel: 'Annuler',
    delete: 'Supprimer',
    create: 'Créer',
    minAmount: 'Minimum: $10',
    paymentMethod: 'Méthode de paiement',
    usdBalance: 'Solde USD',
    card: 'Carte enregistrée',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce plan?',
    confirmCancel: 'Êtes-vous sûr de vouloir annuler ce plan?',
    success: 'Plan créé!',
    error: 'Erreur',
    insufficientBalance: 'Solde insuffisant',
    back: 'Retour',
    dcaInfo: 'Qu\'est-ce que le DCA?',
    dcaInfoDesc: 'Le DCA vous protège de la volatilité en investissant régulièrement.',
  },
  ar: {
    title: 'الشراء المتكرر (DCA)',
    subtitle: 'أتمتة استثماراتك بشكل منتظم',
    activePlans: 'الخطط النشطة',
    createPlan: 'إنشاء خطة جديدة',
    noPlan: 'لا توجد خطط شراء متكررة',
    noPlanDesc: 'استثمر بانتظام مع استراتيجية DCA',
    selectAsset: 'اختر الأصل',
    amount: 'المبلغ (USD)',
    frequency: 'التكرار',
    daily: 'يومي',
    weekly: 'أسبوعي',
    biweekly: 'كل أسبوعين',
    monthly: 'شهري',
    startDate: 'تاريخ البدء',
    nextPurchase: 'الشراء التالي',
    totalInvested: 'إجمالي الاستثمار',
    totalPurchases: 'إجمالي المشتريات',
    status: 'الحالة',
    active: 'نشط',
    paused: 'متوقف مؤقتاً',
    cancelled: 'ملغى',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    cancel: 'إلغاء',
    delete: 'حذف',
    create: 'إنشاء',
    minAmount: 'الحد الأدنى: $10',
    paymentMethod: 'طريقة الدفع',
    usdBalance: 'رصيد USD',
    card: 'البطاقة المحفوظة',
    confirmDelete: 'هل أنت متأكد من حذف هذه الخطة؟',
    confirmCancel: 'هل أنت متأكد من إلغاء هذه الخطة؟',
    success: 'تم إنشاء الخطة!',
    error: 'خطأ',
    insufficientBalance: 'رصيد غير كافٍ',
    back: 'رجوع',
    dcaInfo: 'ما هو DCA؟',
    dcaInfoDesc: 'متوسط تكلفة الدولار يحميك من تقلبات السوق من خلال الاستثمار المنتظم.',
  },
  ru: {
    title: 'Регулярная Покупка (DCA)',
    subtitle: 'Автоматизируйте ваши инвестиции',
    activePlans: 'Активные Планы',
    createPlan: 'Создать План',
    noPlan: 'Нет планов регулярных покупок',
    noPlanDesc: 'Инвестируйте регулярно со стратегией DCA',
    selectAsset: 'Выберите актив',
    amount: 'Сумма (USD)',
    frequency: 'Частота',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    biweekly: 'Раз в 2 недели',
    monthly: 'Ежемесячно',
    startDate: 'Дата начала',
    nextPurchase: 'Следующая покупка',
    totalInvested: 'Всего инвестировано',
    totalPurchases: 'Всего покупок',
    status: 'Статус',
    active: 'Активен',
    paused: 'На паузе',
    cancelled: 'Отменён',
    pause: 'Пауза',
    resume: 'Продолжить',
    cancel: 'Отмена',
    delete: 'Удалить',
    create: 'Создать',
    minAmount: 'Минимум: $10',
    paymentMethod: 'Способ оплаты',
    usdBalance: 'Баланс USD',
    card: 'Сохранённая карта',
    confirmDelete: 'Вы уверены, что хотите удалить этот план?',
    confirmCancel: 'Вы уверены, что хотите отменить этот план?',
    success: 'План создан!',
    error: 'Ошибка',
    insufficientBalance: 'Недостаточный баланс',
    back: 'Назад',
    dcaInfo: 'Что такое DCA?',
    dcaInfoDesc: 'DCA защищает от волатильности рынка через регулярные инвестиции фиксированной суммы.',
  },
};

// ============================================
// TYPES & CONSTANTS
// ============================================
interface RecurringPlan {
  id: string;
  asset: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: 'usd_balance' | 'card';
  nextPurchase: string;
  totalInvested: number;
  totalPurchases: number;
  createdAt: string;
}

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

const ASSETS = [
  { symbol: 'AUXG', name: 'Gold', color: '#EAB308' },
  { symbol: 'AUXS', name: 'Silver', color: '#94A3B8' },
  { symbol: 'AUXPT', name: 'Platinum', color: '#E2E8F0' },
  { symbol: 'AUXPD', name: 'Palladium', color: '#64748B' },
];

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'] as const;

// ============================================
// MAIN COMPONENT
// ============================================
export default function RecurringBuyScreen() {
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
  const [walletAddress, setWalletAddress] = useState<string | null>(storeWalletAddress);
  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usdBalance, setUsdBalance] = useState(0);

  // Form state
  const [selectedAsset, setSelectedAsset] = useState('AUXG');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>('weekly');
  const [paymentMethod, setPaymentMethod] = useState<'usd_balance' | 'card'>('usd_balance');

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#10B981',
    danger: '#EF4444',
    amber: '#F59E0B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    loadData();
  }, [storeWalletAddress]);

  const loadData = async () => {
    try {
      let address = storeWalletAddress;
      if (!address) {
        address = await AsyncStorage.getItem('auxite_wallet_address');
      }
      setWalletAddress(address);

      if (address) {
        await Promise.all([fetchPlans(address), fetchBalance(address)]);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/recurring-buy`, {
        headers: { 'x-wallet-address': address },
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Fetch plans error:', err);
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/user/balance`, {
        headers: { 'x-wallet-address': address },
      });
      const data = await res.json();
      setUsdBalance(data.balance || 0);
    } catch (err) {
      console.error('Fetch balance error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await Promise.all([fetchPlans(walletAddress), fetchBalance(walletAddress)]);
    setRefreshing(false);
  };

  const handleCreatePlan = async () => {
    if (!walletAddress || !amount) return;

    const amountNum = parseFloat(amount);
    if (amountNum < 10) {
      Alert.alert(t.error, t.minAmount);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/recurring-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({ asset: selectedAsset, amount: amountNum, frequency, paymentMethod }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('✓', t.success);
      setShowCreateModal(false);
      setAmount('');
      setSelectedAsset('AUXG');
      setFrequency('weekly');
      await fetchPlans(walletAddress);
    } catch (err: any) {
      Alert.alert(t.error, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePausePlan = async (planId: string, currentStatus: string) => {
    if (!walletAddress) return;
    
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await fetch(`${API_URL}/api/recurring-buy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({ planId, status: newStatus }),
      });
      await fetchPlans(walletAddress);
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!walletAddress) return;

    Alert.alert('', t.confirmDelete, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/recurring-buy?planId=${planId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });
            await fetchPlans(walletAddress);
          } catch (err) {
            console.error('Delete error:', err);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short', day: 'numeric',
    });
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = { daily: t.daily, weekly: t.weekly, biweekly: t.biweekly, monthly: t.monthly };
    return labels[freq] || freq;
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>{t.dcaInfo}</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{t.dcaInfoDesc}</Text>
          </View>
        </View>

        {/* Plans */}
        {plans.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noPlan}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t.noPlanDesc}</Text>
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyButtonText}>{t.createPlan}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((plan) => {
              const asset = ASSETS.find((a) => a.symbol === plan.asset);
              return (
                <View key={plan.id} style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.planHeader}>
                    <View style={styles.planAsset}>
                      <View style={[styles.assetIcon, { backgroundColor: asset?.color + '20' }]}>
                        <Text style={styles.assetIconText}>{asset?.icon}</Text>
                      </View>
                      <View>
                        <Text style={[styles.planAssetName, { color: colors.text }]}>{asset?.symbol}</Text>
                        <Text style={[styles.planAmount, { color: colors.textMuted }]}>${plan.amount} / {getFrequencyLabel(plan.frequency)}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: plan.status === 'active' ? colors.primary + '20' : plan.status === 'paused' ? colors.amber + '20' : colors.danger + '20' }]}>
                      <Text style={[styles.statusText, { color: plan.status === 'active' ? colors.primary : plan.status === 'paused' ? colors.amber : colors.danger }]}>
                        {plan.status === 'active' ? t.active : plan.status === 'paused' ? t.paused : t.cancelled}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planStats}>
                    <View style={styles.planStat}>
                      <Text style={[styles.planStatLabel, { color: colors.textMuted }]}>{t.nextPurchase}</Text>
                      <Text style={[styles.planStatValue, { color: colors.text }]}>{formatDate(plan.nextPurchase)}</Text>
                    </View>
                    <View style={styles.planStat}>
                      <Text style={[styles.planStatLabel, { color: colors.textMuted }]}>{t.totalInvested}</Text>
                      <Text style={[styles.planStatValue, { color: colors.text }]}>${plan.totalInvested.toFixed(2)}</Text>
                    </View>
                    <View style={styles.planStat}>
                      <Text style={[styles.planStatLabel, { color: colors.textMuted }]}>{t.totalPurchases}</Text>
                      <Text style={[styles.planStatValue, { color: colors.text }]}>{plan.totalPurchases}</Text>
                    </View>
                  </View>

                  <View style={styles.planActions}>
                    {plan.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]}
                        onPress={() => handlePausePlan(plan.id, plan.status)}
                      >
                        <Ionicons name={plan.status === 'active' ? 'pause' : 'play'} size={16} color={colors.text} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>
                          {plan.status === 'active' ? t.pause : t.resume}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
                      onPress={() => handleDeletePlan(plan.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={[styles.actionButtonText, { color: colors.danger }]}>{t.delete}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.createPlan}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Asset Selection */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.selectAsset}</Text>
              <View style={styles.assetGrid}>
               {ASSETS.map((asset) => (
                  <TouchableOpacity
                    key={asset.symbol}
                    style={[styles.assetButton, { backgroundColor: selectedAsset === asset.symbol ? asset.color + '20' : colors.surfaceAlt, borderColor: selectedAsset === asset.symbol ? asset.color : 'transparent' }]}
                    onPress={() => setSelectedAsset(asset.symbol)}
                  >
                    <Image source={metalIcons[asset.symbol]} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    <Text style={[styles.assetButtonText, { color: colors.text }]}>{asset.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t.amount}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="50.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.hint, { color: colors.textMuted }]}>{t.minAmount}</Text>

              {/* Frequency */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.frequency}</Text>
              <View style={styles.frequencyGrid}>
                {FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[styles.frequencyButton, { backgroundColor: frequency === freq ? colors.primary + '20' : colors.surfaceAlt, borderColor: frequency === freq ? colors.primary : 'transparent' }]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text style={[styles.frequencyButtonText, { color: frequency === freq ? colors.primary : colors.text }]}>
                      {getFrequencyLabel(freq)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Method */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.paymentMethod}</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[styles.paymentOption, { backgroundColor: paymentMethod === 'usd_balance' ? colors.primary + '20' : colors.surfaceAlt, borderColor: paymentMethod === 'usd_balance' ? colors.primary : 'transparent' }]}
                  onPress={() => setPaymentMethod('usd_balance')}
                >
                  <Ionicons name="wallet" size={20} color={paymentMethod === 'usd_balance' ? colors.primary : colors.textMuted} />
                  <View>
                    <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>{t.usdBalance}</Text>
                    <Text style={[styles.paymentOptionValue, { color: colors.textMuted }]}>${usdBalance.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surfaceAlt }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, (!amount || parseFloat(amount) < 10) && styles.buttonDisabled]}
                onPress={handleCreatePlan}
                disabled={!amount || parseFloat(amount) < 10 || submitting}
              >
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.createButtonText}>{t.create}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  addButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16 },
  infoCard: { flexDirection: 'row', padding: 14, borderRadius: 12, borderWidth: 1, gap: 10, marginBottom: 16 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  infoDesc: { fontSize: 12, lineHeight: 18 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '500' },
  emptyDesc: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  plansList: { gap: 12 },
  planCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  planAsset: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  assetIconText: { fontSize: 22 },
  planAssetName: { fontSize: 16, fontWeight: '600' },
  planAmount: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '500' },
  planStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  planStat: { alignItems: 'center' },
  planStatLabel: { fontSize: 11, marginBottom: 4 },
  planStatValue: { fontSize: 14, fontWeight: '600' },
  planActions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionButtonText: { fontSize: 13, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  assetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  assetButton: { width: '48%', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2 },
  assetButtonIcon: { fontSize: 24 },
  assetButtonText: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  input: { fontSize: 15, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  hint: { fontSize: 11, marginTop: 6 },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  frequencyButton: { width: '48%', alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 2 },
  frequencyButtonText: { fontSize: 13, fontWeight: '500' },
  paymentOptions: { gap: 10 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2 },
  paymentOptionTitle: { fontSize: 14, fontWeight: '500' },
  paymentOptionValue: { fontSize: 12, marginTop: 2 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontWeight: '600', fontSize: 15 },
  createButton: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
});
