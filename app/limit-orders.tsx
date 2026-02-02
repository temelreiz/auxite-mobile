// app/limit-orders.tsx
// Limit Orders List Screen
// 6-Language Support | Dark/Light Mode | Buy/Sell Limit Orders Management

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Limit Emirleri',
    subtitle: 'Aktif ve geçmiş limit emirleriniz',
    openOrders: 'Açık Emirler',
    orderHistory: 'Emir Geçmişi',
    createOrder: 'Yeni Emir',
    noOrders: 'Henüz limit emriniz yok',
    noOrdersDesc: 'Belirli fiyattan alım/satım emri oluşturun',
    noHistory: 'Emir geçmişi boş',
    buy: 'Alış',
    sell: 'Satış',
    pair: 'Çift',
    price: 'Fiyat',
    amount: 'Miktar',
    total: 'Toplam',
    status: 'Durum',
    filled: 'Gerçekleşti',
    partial: 'Kısmi',
    cancelled: 'İptal',
    pending: 'Beklemede',
    expired: 'Süresi Doldu',
    cancel: 'İptal Et',
    create: 'Oluştur',
    close: 'Kapat',
    currentPrice: 'Güncel Fiyat',
    targetPrice: 'Hedef Fiyat',
    orderType: 'Emir Tipi',
    confirmCancel: 'Bu emri iptal etmek istediğinize emin misiniz?',
    success: 'Emir oluşturuldu!',
    error: 'Hata',
    insufficientBalance: 'Yetersiz bakiye',
    invalidPrice: 'Geçersiz fiyat',
    back: 'Geri',
    filledAt: 'Gerçekleşme',
    createdAt: 'Oluşturulma',
    expiry: 'Geçerlilik',
    day1: '1 Gün',
    day7: '7 Gün',
    day30: '30 Gün',
    gtc: 'İptal Edilene Kadar',
  },
  en: {
    title: 'Limit Orders',
    subtitle: 'Your active and past limit orders',
    openOrders: 'Open Orders',
    orderHistory: 'Order History',
    createOrder: 'New Order',
    noOrders: 'No limit orders yet',
    noOrdersDesc: 'Create buy/sell orders at specific prices',
    noHistory: 'Order history is empty',
    buy: 'Buy',
    sell: 'Sell',
    pair: 'Pair',
    price: 'Price',
    amount: 'Amount',
    total: 'Total',
    status: 'Status',
    filled: 'Filled',
    partial: 'Partial',
    cancelled: 'Cancelled',
    pending: 'Pending',
    expired: 'Expired',
    cancel: 'Cancel',
    create: 'Create',
    close: 'Close',
    currentPrice: 'Current Price',
    targetPrice: 'Target Price',
    orderType: 'Order Type',
    confirmCancel: 'Are you sure you want to cancel this order?',
    success: 'Order created!',
    error: 'Error',
    insufficientBalance: 'Insufficient balance',
    invalidPrice: 'Invalid price',
    back: 'Back',
    filledAt: 'Filled at',
    createdAt: 'Created at',
    expiry: 'Expiry',
    day1: '1 Day',
    day7: '7 Days',
    day30: '30 Days',
    gtc: 'Good Till Cancel',
  },
  de: {
    title: 'Limit-Aufträge',
    subtitle: 'Ihre aktiven und vergangenen Limit-Aufträge',
    openOrders: 'Offene Aufträge',
    orderHistory: 'Auftragshistorie',
    createOrder: 'Neuer Auftrag',
    noOrders: 'Noch keine Limit-Aufträge',
    noOrdersDesc: 'Erstellen Sie Kauf-/Verkaufsaufträge zu bestimmten Preisen',
    noHistory: 'Auftragshistorie ist leer',
    buy: 'Kaufen',
    sell: 'Verkaufen',
    pair: 'Paar',
    price: 'Preis',
    amount: 'Menge',
    total: 'Gesamt',
    status: 'Status',
    filled: 'Ausgeführt',
    partial: 'Teilweise',
    cancelled: 'Storniert',
    pending: 'Ausstehend',
    expired: 'Abgelaufen',
    cancel: 'Stornieren',
    create: 'Erstellen',
    close: 'Schließen',
    currentPrice: 'Aktueller Preis',
    targetPrice: 'Zielpreis',
    orderType: 'Auftragstyp',
    confirmCancel: 'Möchten Sie diesen Auftrag wirklich stornieren?',
    success: 'Auftrag erstellt!',
    error: 'Fehler',
    insufficientBalance: 'Unzureichendes Guthaben',
    invalidPrice: 'Ungültiger Preis',
    back: 'Zurück',
    filledAt: 'Ausgeführt am',
    createdAt: 'Erstellt am',
    expiry: 'Ablauf',
    day1: '1 Tag',
    day7: '7 Tage',
    day30: '30 Tage',
    gtc: 'Gültig bis Stornierung',
  },
  fr: {
    title: 'Ordres Limites',
    subtitle: 'Vos ordres limites actifs et passés',
    openOrders: 'Ordres Ouverts',
    orderHistory: 'Historique des Ordres',
    createOrder: 'Nouvel Ordre',
    noOrders: 'Aucun ordre limite',
    noOrdersDesc: 'Créez des ordres d\'achat/vente à des prix spécifiques',
    noHistory: 'L\'historique est vide',
    buy: 'Achat',
    sell: 'Vente',
    pair: 'Paire',
    price: 'Prix',
    amount: 'Montant',
    total: 'Total',
    status: 'Statut',
    filled: 'Exécuté',
    partial: 'Partiel',
    cancelled: 'Annulé',
    pending: 'En attente',
    expired: 'Expiré',
    cancel: 'Annuler',
    create: 'Créer',
    close: 'Fermer',
    currentPrice: 'Prix Actuel',
    targetPrice: 'Prix Cible',
    orderType: 'Type d\'Ordre',
    confirmCancel: 'Êtes-vous sûr de vouloir annuler cet ordre?',
    success: 'Ordre créé!',
    error: 'Erreur',
    insufficientBalance: 'Solde insuffisant',
    invalidPrice: 'Prix invalide',
    back: 'Retour',
    filledAt: 'Exécuté le',
    createdAt: 'Créé le',
    expiry: 'Expiration',
    day1: '1 Jour',
    day7: '7 Jours',
    day30: '30 Jours',
    gtc: 'Valable jusqu\'à annulation',
  },
  ar: {
    title: 'أوامر الحد',
    subtitle: 'أوامر الحد النشطة والسابقة',
    openOrders: 'الأوامر المفتوحة',
    orderHistory: 'سجل الأوامر',
    createOrder: 'أمر جديد',
    noOrders: 'لا توجد أوامر حد',
    noOrdersDesc: 'أنشئ أوامر شراء/بيع بأسعار محددة',
    noHistory: 'سجل الأوامر فارغ',
    buy: 'شراء',
    sell: 'بيع',
    pair: 'الزوج',
    price: 'السعر',
    amount: 'الكمية',
    total: 'الإجمالي',
    status: 'الحالة',
    filled: 'تم التنفيذ',
    partial: 'جزئي',
    cancelled: 'ملغى',
    pending: 'قيد الانتظار',
    expired: 'منتهي الصلاحية',
    cancel: 'إلغاء',
    create: 'إنشاء',
    close: 'إغلاق',
    currentPrice: 'السعر الحالي',
    targetPrice: 'السعر المستهدف',
    orderType: 'نوع الأمر',
    confirmCancel: 'هل أنت متأكد من إلغاء هذا الأمر؟',
    success: 'تم إنشاء الأمر!',
    error: 'خطأ',
    insufficientBalance: 'رصيد غير كافٍ',
    invalidPrice: 'سعر غير صالح',
    back: 'رجوع',
    filledAt: 'تم التنفيذ في',
    createdAt: 'تم الإنشاء في',
    expiry: 'الصلاحية',
    day1: 'يوم واحد',
    day7: '7 أيام',
    day30: '30 يوم',
    gtc: 'صالح حتى الإلغاء',
  },
  ru: {
    title: 'Лимитные Ордера',
    subtitle: 'Ваши активные и прошлые лимитные ордера',
    openOrders: 'Открытые Ордера',
    orderHistory: 'История Ордеров',
    createOrder: 'Новый Ордер',
    noOrders: 'Нет лимитных ордеров',
    noOrdersDesc: 'Создайте ордера на покупку/продажу по определённым ценам',
    noHistory: 'История ордеров пуста',
    buy: 'Покупка',
    sell: 'Продажа',
    pair: 'Пара',
    price: 'Цена',
    amount: 'Количество',
    total: 'Итого',
    status: 'Статус',
    filled: 'Исполнен',
    partial: 'Частично',
    cancelled: 'Отменён',
    pending: 'Ожидание',
    expired: 'Истёк',
    cancel: 'Отменить',
    create: 'Создать',
    close: 'Закрыть',
    currentPrice: 'Текущая Цена',
    targetPrice: 'Целевая Цена',
    orderType: 'Тип Ордера',
    confirmCancel: 'Вы уверены, что хотите отменить этот ордер?',
    success: 'Ордер создан!',
    error: 'Ошибка',
    insufficientBalance: 'Недостаточный баланс',
    invalidPrice: 'Недопустимая цена',
    back: 'Назад',
    filledAt: 'Исполнен',
    createdAt: 'Создан',
    expiry: 'Срок действия',
    day1: '1 День',
    day7: '7 Дней',
    day30: '30 Дней',
    gtc: 'До отмены',
  },
};

// ============================================
// TYPES & CONSTANTS
// ============================================
interface LimitOrder {
  id: string;
  type: 'buy' | 'sell';
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'expired';
  createdAt: string;
  filledAt?: string;
  expiresAt?: string;
}

const TRADING_PAIRS = [
  { pair: 'BTC/USD', base: 'BTC', quote: 'USD', icon: '₿', color: '#F7931A', currentPrice: 43250 },
  { pair: 'ETH/USD', base: 'ETH', quote: 'USD', icon: '⟠', color: '#627EEA', currentPrice: 2280 },
  { pair: 'AUXG/USD', base: 'AUXG', quote: 'USD', icon: '🥇', color: '#FFD700', currentPrice: 65.50 },
  { pair: 'AUXS/USD', base: 'AUXS', quote: 'USD', icon: '🥈', color: '#C0C0C0', currentPrice: 0.78 },
  { pair: 'SOL/USD', base: 'SOL', quote: 'USD', icon: '◎', color: '#9945FF', currentPrice: 98.50 },
  { pair: 'XRP/USD', base: 'XRP', quote: 'USD', icon: '✕', color: '#23292F', currentPrice: 0.62 },
];

const EXPIRY_OPTIONS = ['day1', 'day7', 'day30', 'gtc'] as const;

// ============================================
// MAIN COMPONENT
// ============================================
export default function LimitOrdersScreen() {
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
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [expiry, setExpiry] = useState<typeof EXPIRY_OPTIONS[number]>('day7');

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
    buy: '#10B981',
    sell: '#EF4444',
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
        await fetchOrders(address);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/limit-orders`, {
        headers: { 'x-wallet-address': address },
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await fetchOrders(walletAddress);
    setRefreshing(false);
  };

  const handleCreateOrder = async () => {
    if (!walletAddress || !price || !amount) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/limit-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({
          type: orderType,
          pair: selectedPair.pair,
          baseAsset: selectedPair.base,
          quoteAsset: selectedPair.quote,
          price: parseFloat(price),
          amount: parseFloat(amount),
          expiry,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('✓', t.success);
      setShowCreateModal(false);
      setPrice('');
      setAmount('');
      await fetchOrders(walletAddress);
    } catch (err: any) {
      Alert.alert(t.error, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!walletAddress) return;

    Alert.alert('', t.confirmCancel, [
      { text: t.close, style: 'cancel' },
      {
        text: t.cancel,
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/limit-orders?orderId=${orderId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });
            await fetchOrders(walletAddress);
          } catch (err) {
            console.error('Cancel error:', err);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getExpiryLabel = (exp: string) => {
    const labels: Record<string, string> = { day1: t.day1, day7: t.day7, day30: t.day30, gtc: t.gtc };
    return labels[exp] || exp;
  };

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : '0.00';

  const openOrders = orders.filter((o) => o.status === 'pending' || o.status === 'partial');
  const historyOrders = orders.filter((o) => o.status !== 'pending' && o.status !== 'partial');

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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'open' ? colors.primary : colors.textMuted }]}>
            {t.openOrders} ({openOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.primary : colors.textMuted }]}>
            {t.orderHistory}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'open' && (
          <>
            {openOrders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noOrders}</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t.noOrdersDesc}</Text>
                <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.emptyButtonText}>{t.createOrder}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ordersList}>
                {openOrders.map((order) => {
                  const pairInfo = TRADING_PAIRS.find((p) => p.pair === order.pair);
                  const fillPercent = order.amount > 0 ? ((order.filled / order.amount) * 100).toFixed(0) : 0;
                  return (
                    <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderPair}>
                          <View style={[styles.pairIcon, { backgroundColor: pairInfo?.color + '20' }]}>
                            <Text style={styles.pairIconText}>{pairInfo?.icon}</Text>
                          </View>
                          <View>
                            <Text style={[styles.orderPairName, { color: colors.text }]}>{order.pair}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: order.type === 'buy' ? colors.buy + '20' : colors.sell + '20' }]}>
                              <Text style={[styles.typeText, { color: order.type === 'buy' ? colors.buy : colors.sell }]}>
                                {order.type === 'buy' ? t.buy : t.sell}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.danger + '20' }]} onPress={() => handleCancelOrder(order.id)}>
                          <Text style={[styles.cancelButtonText, { color: colors.danger }]}>{t.cancel}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.orderDetails}>
                        <View style={styles.orderDetail}>
                          <Text style={[styles.orderDetailLabel, { color: colors.textMuted }]}>{t.price}</Text>
                          <Text style={[styles.orderDetailValue, { color: colors.text }]}>${order.price.toLocaleString()}</Text>
                        </View>
                        <View style={styles.orderDetail}>
                          <Text style={[styles.orderDetailLabel, { color: colors.textMuted }]}>{t.amount}</Text>
                          <Text style={[styles.orderDetailValue, { color: colors.text }]}>{order.amount} {order.baseAsset}</Text>
                        </View>
                        <View style={styles.orderDetail}>
                          <Text style={[styles.orderDetailLabel, { color: colors.textMuted }]}>{t.total}</Text>
                          <Text style={[styles.orderDetailValue, { color: colors.text }]}>${order.total.toLocaleString()}</Text>
                        </View>
                      </View>

                      {order.status === 'partial' && (
                        <View style={styles.fillProgress}>
                          <View style={[styles.fillBar, { backgroundColor: colors.surfaceAlt }]}>
                            <View style={[styles.fillBarInner, { width: `${fillPercent}%`, backgroundColor: colors.primary }]} />
                          </View>
                          <Text style={[styles.fillText, { color: colors.textMuted }]}>{fillPercent}% {t.filled}</Text>
                        </View>
                      )}

                      <Text style={[styles.orderDate, { color: colors.textMuted }]}>{t.createdAt}: {formatDate(order.createdAt)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {historyOrders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>📜</Text>
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noHistory}</Text>
              </View>
            ) : (
              <View style={styles.ordersList}>
                {historyOrders.map((order) => {
                  const pairInfo = TRADING_PAIRS.find((p) => p.pair === order.pair);
                  const statusColors: Record<string, string> = { filled: colors.primary, partial: colors.amber, cancelled: colors.danger, expired: colors.textMuted };
                  return (
                    <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: order.status === 'cancelled' || order.status === 'expired' ? 0.6 : 1 }]}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderPair}>
                          <View style={[styles.pairIcon, { backgroundColor: pairInfo?.color + '20' }]}>
                            <Text style={styles.pairIconText}>{pairInfo?.icon}</Text>
                          </View>
                          <View>
                            <Text style={[styles.orderPairName, { color: colors.text }]}>{order.pair}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: order.type === 'buy' ? colors.buy + '20' : colors.sell + '20' }]}>
                              <Text style={[styles.typeText, { color: order.type === 'buy' ? colors.buy : colors.sell }]}>
                                {order.type === 'buy' ? t.buy : t.sell}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] + '20' }]}>
                          <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
                            {order.status === 'filled' ? t.filled : order.status === 'partial' ? t.partial : order.status === 'cancelled' ? t.cancelled : t.expired}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.orderDetails}>
                        <View style={styles.orderDetail}>
                          <Text style={[styles.orderDetailLabel, { color: colors.textMuted }]}>{t.price}</Text>
                          <Text style={[styles.orderDetailValue, { color: colors.text }]}>${order.price.toLocaleString()}</Text>
                        </View>
                        <View style={styles.orderDetail}>
                          <Text style={[styles.orderDetailLabel, { color: colors.textMuted }]}>{t.amount}</Text>
                          <Text style={[styles.orderDetailValue, { color: colors.text }]}>{order.filled}/{order.amount}</Text>
                        </View>
                        <View style={styles.orderDetail}>
                          <Text style={[styles.orderDetailLabel, { color: colors.textMuted }]}>{t.total}</Text>
                          <Text style={[styles.orderDetailValue, { color: colors.text }]}>${(order.filled * order.price).toLocaleString()}</Text>
                        </View>
                      </View>

                      <Text style={[styles.orderDate, { color: colors.textMuted }]}>
                        {order.filledAt ? `${t.filledAt}: ${formatDate(order.filledAt)}` : `${t.createdAt}: ${formatDate(order.createdAt)}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.createOrder}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Order Type */}
              <View style={styles.orderTypeButtons}>
                <TouchableOpacity
                  style={[styles.orderTypeButton, { backgroundColor: orderType === 'buy' ? colors.buy : colors.surfaceAlt }]}
                  onPress={() => setOrderType('buy')}
                >
                  <Text style={[styles.orderTypeButtonText, { color: orderType === 'buy' ? '#FFF' : colors.text }]}>{t.buy}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderTypeButton, { backgroundColor: orderType === 'sell' ? colors.sell : colors.surfaceAlt }]}
                  onPress={() => setOrderType('sell')}
                >
                  <Text style={[styles.orderTypeButtonText, { color: orderType === 'sell' ? '#FFF' : colors.text }]}>{t.sell}</Text>
                </TouchableOpacity>
              </View>

              {/* Pair Selection */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.pair}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pairScroll}>
                {TRADING_PAIRS.map((pair) => (
                  <TouchableOpacity
                    key={pair.pair}
                    style={[styles.pairButton, { backgroundColor: selectedPair.pair === pair.pair ? pair.color + '20' : colors.surfaceAlt, borderColor: selectedPair.pair === pair.pair ? pair.color : 'transparent' }]}
                    onPress={() => setSelectedPair(pair)}
                  >
                    <Text style={styles.pairButtonIcon}>{pair.icon}</Text>
                    <Text style={[styles.pairButtonText, { color: colors.text }]}>{pair.base}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Current Price */}
              <View style={[styles.currentPriceCard, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.currentPriceLabel, { color: colors.textMuted }]}>{t.currentPrice}</Text>
                <Text style={[styles.currentPriceValue, { color: colors.text }]}>${selectedPair.currentPrice.toLocaleString()}</Text>
              </View>

              {/* Price Input */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.targetPrice}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              {/* Amount Input */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.amount}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              {/* Total */}
              <View style={[styles.totalCard, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>{t.total}</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>${total}</Text>
              </View>

              {/* Expiry */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.expiry}</Text>
              <View style={styles.expiryGrid}>
                {EXPIRY_OPTIONS.map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[styles.expiryButton, { backgroundColor: expiry === exp ? colors.primary + '20' : colors.surfaceAlt, borderColor: expiry === exp ? colors.primary : 'transparent' }]}
                    onPress={() => setExpiry(exp)}
                  >
                    <Text style={[styles.expiryButtonText, { color: expiry === exp ? colors.primary : colors.text }]}>{getExpiryLabel(exp)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.footerCancelButton, { backgroundColor: colors.surfaceAlt }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.footerCancelButtonText, { color: colors.text }]}>{t.close}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: orderType === 'buy' ? colors.buy : colors.sell }, (!price || !amount) && styles.buttonDisabled]}
                onPress={handleCreateOrder}
                disabled={!price || !amount || submitting}
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
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '500' },
  emptyDesc: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  ordersList: { gap: 12 },
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderPair: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pairIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  pairIconText: { fontSize: 20 },
  orderPairName: { fontSize: 15, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  typeText: { fontSize: 10, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '500' },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  cancelButtonText: { fontSize: 12, fontWeight: '500' },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderDetail: { alignItems: 'center' },
  orderDetailLabel: { fontSize: 11, marginBottom: 4 },
  orderDetailValue: { fontSize: 13, fontWeight: '600' },
  fillProgress: { marginBottom: 12 },
  fillBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fillBarInner: { height: '100%', borderRadius: 3 },
  fillText: { fontSize: 11, marginTop: 4 },
  orderDate: { fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 16 },
  orderTypeButtons: { flexDirection: 'row', gap: 12 },
  orderTypeButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  orderTypeButtonText: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  pairScroll: { marginBottom: 12 },
  pairButton: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 2 },
  pairButtonIcon: { fontSize: 20 },
  pairButtonText: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  currentPriceCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10 },
  currentPriceLabel: { fontSize: 13 },
  currentPriceValue: { fontSize: 15, fontWeight: '600' },
  input: { fontSize: 15, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginTop: 12 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 16, fontWeight: '700' },
  expiryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  expiryButton: { width: '48%', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 2 },
  expiryButtonText: { fontSize: 13, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  footerCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  footerCancelButtonText: { fontWeight: '600', fontSize: 15 },
  createButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
});
