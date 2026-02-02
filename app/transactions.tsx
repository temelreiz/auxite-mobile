// app/transactions.tsx
// Transaction History Screen
// 6-Language Support | Dark/Light Mode | Filters | Pagination

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';
import TransactionExportModal from '@/components/TransactionExportModal';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'İşlem Geçmişi',
    noTransactions: 'Henüz işlem yok',
    noTransactionsDesc: 'İlk işleminizi yaptığınızda burada görünecek.',
    filter: 'Filtre',
    export: 'Dışa Aktar',
    all: 'Tümü',
    deposits: 'Yatırımlar',
    withdrawals: 'Çekimler',
    trades: 'İşlemler',
    transfers: 'Transferler',
    pending: 'Bekliyor',
    completed: 'Tamamlandı',
    failed: 'Başarısız',
    deposit: 'Yatırım',
    withdraw: 'Çekim',
    trade_buy: 'Alım',
    trade_sell: 'Satım',
    transfer_in: 'Gelen Transfer',
    transfer_out: 'Giden Transfer',
    buy: 'Alım',
    sell: 'Satım',
    exchange: 'Dönüşüm',
    swap: 'Dönüşüm',
    stake: 'Stake',
    unstake: 'Unstake',
    admin_adjustment: 'Düzeltme',
    loadMore: 'Daha Fazla Yükle',
    loading: 'Yükleniyor...',
    refreshing: 'Yenileniyor...',
    totalVolume: 'Toplam Hacim',
    totalFees: 'Toplam Ücret',
    viewDetails: 'Detayları Gör',
    txHash: 'İşlem Hash',
    fee: 'Ücret',
    date: 'Tarih',
    amount: 'Miktar',
    status: 'Durum',
    back: 'Geri',
  },
  en: {
    title: 'Transaction History',
    noTransactions: 'No transactions yet',
    noTransactionsDesc: 'Your transactions will appear here once you make your first one.',
    filter: 'Filter',
    export: 'Export',
    all: 'All',
    deposits: 'Deposits',
    withdrawals: 'Withdrawals',
    trades: 'Trades',
    transfers: 'Transfers',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    trade_buy: 'Buy',
    trade_sell: 'Sell',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    buy: 'Buy',
    sell: 'Sell',
    exchange: 'Exchange',
    swap: 'Swap',
    stake: 'Stake',
    unstake: 'Unstake',
    admin_adjustment: 'Adjustment',
    loadMore: 'Load More',
    loading: 'Loading...',
    refreshing: 'Refreshing...',
    totalVolume: 'Total Volume',
    totalFees: 'Total Fees',
    viewDetails: 'View Details',
    txHash: 'TX Hash',
    fee: 'Fee',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    back: 'Back',
  },
  de: {
    title: 'Transaktionsverlauf',
    noTransactions: 'Noch keine Transaktionen',
    noTransactionsDesc: 'Ihre Transaktionen werden hier angezeigt.',
    filter: 'Filter',
    export: 'Exportieren',
    all: 'Alle',
    deposits: 'Einzahlungen',
    withdrawals: 'Auszahlungen',
    trades: 'Trades',
    transfers: 'Transfers',
    pending: 'Ausstehend',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
    deposit: 'Einzahlung',
    withdraw: 'Auszahlung',
    trade_buy: 'Kauf',
    trade_sell: 'Verkauf',
    transfer_in: 'Eingehend',
    transfer_out: 'Ausgehend',
    buy: 'Kauf',
    sell: 'Verkauf',
    exchange: 'Tausch',
    swap: 'Tausch',
    stake: 'Staking',
    unstake: 'Unstaking',
    admin_adjustment: 'Korrektur',
    loadMore: 'Mehr laden',
    loading: 'Laden...',
    refreshing: 'Aktualisieren...',
    totalVolume: 'Gesamtvolumen',
    totalFees: 'Gesamtgebühren',
    viewDetails: 'Details anzeigen',
    txHash: 'TX Hash',
    fee: 'Gebühr',
    date: 'Datum',
    amount: 'Betrag',
    status: 'Status',
    back: 'Zurück',
  },
  fr: {
    title: 'Historique des Transactions',
    noTransactions: 'Pas encore de transactions',
    noTransactionsDesc: 'Vos transactions apparaîtront ici.',
    filter: 'Filtrer',
    export: 'Exporter',
    all: 'Tout',
    deposits: 'Dépôts',
    withdrawals: 'Retraits',
    trades: 'Échanges',
    transfers: 'Transferts',
    pending: 'En attente',
    completed: 'Terminé',
    failed: 'Échoué',
    deposit: 'Dépôt',
    withdraw: 'Retrait',
    trade_buy: 'Achat',
    trade_sell: 'Vente',
    transfer_in: 'Transfert entrant',
    transfer_out: 'Transfert sortant',
    buy: 'Achat',
    sell: 'Vente',
    exchange: 'Échange',
    swap: 'Échange',
    stake: 'Staking',
    unstake: 'Unstaking',
    admin_adjustment: 'Ajustement',
    loadMore: 'Charger plus',
    loading: 'Chargement...',
    refreshing: 'Actualisation...',
    totalVolume: 'Volume Total',
    totalFees: 'Frais Totaux',
    viewDetails: 'Voir les détails',
    txHash: 'Hash TX',
    fee: 'Frais',
    date: 'Date',
    amount: 'Montant',
    status: 'Statut',
    back: 'Retour',
  },
  ar: {
    title: 'سجل المعاملات',
    noTransactions: 'لا توجد معاملات بعد',
    noTransactionsDesc: 'ستظهر معاملاتك هنا.',
    filter: 'تصفية',
    export: 'تصدير',
    all: 'الكل',
    deposits: 'الإيداعات',
    withdrawals: 'السحوبات',
    trades: 'التداولات',
    transfers: 'التحويلات',
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    failed: 'فشل',
    deposit: 'إيداع',
    withdraw: 'سحب',
    trade_buy: 'شراء',
    trade_sell: 'بيع',
    transfer_in: 'تحويل وارد',
    transfer_out: 'تحويل صادر',
    buy: 'شراء',
    sell: 'بيع',
    exchange: 'تبادل',
    swap: 'تبادل',
    stake: 'تخزين',
    unstake: 'إلغاء التخزين',
    admin_adjustment: 'تعديل',
    loadMore: 'تحميل المزيد',
    loading: 'جارٍ التحميل...',
    refreshing: 'جارٍ التحديث...',
    totalVolume: 'إجمالي الحجم',
    totalFees: 'إجمالي الرسوم',
    viewDetails: 'عرض التفاصيل',
    txHash: 'هاش المعاملة',
    fee: 'رسوم',
    date: 'التاريخ',
    amount: 'المبلغ',
    status: 'الحالة',
    back: 'رجوع',
  },
  ru: {
    title: 'История Транзакций',
    noTransactions: 'Пока нет транзакций',
    noTransactionsDesc: 'Ваши транзакции появятся здесь.',
    filter: 'Фильтр',
    export: 'Экспорт',
    all: 'Все',
    deposits: 'Депозиты',
    withdrawals: 'Выводы',
    trades: 'Сделки',
    transfers: 'Переводы',
    pending: 'В ожидании',
    completed: 'Завершено',
    failed: 'Ошибка',
    deposit: 'Депозит',
    withdraw: 'Вывод',
    trade_buy: 'Покупка',
    trade_sell: 'Продажа',
    transfer_in: 'Входящий',
    transfer_out: 'Исходящий',
    buy: 'Покупка',
    sell: 'Продажа',
    exchange: 'Обмен',
    swap: 'Обмен',
    stake: 'Стейкинг',
    unstake: 'Анстейкинг',
    admin_adjustment: 'Корректировка',
    loadMore: 'Загрузить ещё',
    loading: 'Загрузка...',
    refreshing: 'Обновление...',
    totalVolume: 'Общий объём',
    totalFees: 'Общие комиссии',
    viewDetails: 'Подробнее',
    txHash: 'Хеш TX',
    fee: 'Комиссия',
    date: 'Дата',
    amount: 'Сумма',
    status: 'Статус',
    back: 'Назад',
  },
};

// ============================================
// TYPES
// ============================================
interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade_buy' | 'trade_sell' | 'transfer_in' | 'transfer_out' | 'buy' | 'sell' | 'exchange' | 'stake' | 'unstake';
  coin: string;
  amount: number;
  amountUsd: number;
  fee?: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  createdAt: string;
  completedAt?: string;
}

interface Summary {
  totalTransactions: number;
  byType: {
    deposits: number;
    withdrawals: number;
    trades: number;
    transfers: number;
  };
  byStatus: {
    pending: number;
    completed: number;
    failed: number;
  };
  totalVolume: number;
  totalFees: number;
}

type FilterType = 'all' | 'deposit' | 'withdraw' | 'trade' | 'transfer';

// ============================================
// MAIN COMPONENT
// ============================================
export default function TransactionsScreen() {
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(storeWalletAddress);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const LIMIT = 20;

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
    blue: '#3B82F6',
    purple: '#8B5CF6',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    loadWalletAndTransactions();
  }, [storeWalletAddress]);

  const loadWalletAndTransactions = async () => {
    try {
      let address = storeWalletAddress;
      if (!address) {
        address = await AsyncStorage.getItem('auxite_wallet_address');
      }

      if (address) {
        setWalletAddress(address);
        await fetchTransactions(address, 0, filter);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (address: string, newOffset: number, filterType: FilterType) => {
    try {
      let typeParam = '';
      if (filterType === 'deposit') typeParam = 'deposit';
      else if (filterType === 'withdraw') typeParam = 'withdraw';
      else if (filterType === 'trade') typeParam = 'trade_buy,trade_sell,buy,sell,exchange';
      else if (filterType === 'transfer') typeParam = 'transfer_in,transfer_out';

      const params = new URLSearchParams({
        address,
        limit: LIMIT.toString(),
        offset: newOffset.toString(),
      });
      if (typeParam) params.set('type', typeParam);

      const res = await fetch(`${API_URL}/api/user/transactions?${params}`);
      const data = await res.json();

      if (newOffset === 0) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions(prev => [...prev, ...(data.transactions || [])]);
      }

      setSummary(data.summary || null);
      setHasMore(data.pagination?.hasMore || false);
      setOffset(newOffset);
    } catch (err) {
      console.error('Fetch transactions error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await fetchTransactions(walletAddress, 0, filter);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!walletAddress || loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchTransactions(walletAddress, offset + LIMIT, filter);
    setLoadingMore(false);
  };

  const handleFilterChange = async (newFilter: FilterType) => {
    setFilter(newFilter);
    setShowFilterModal(false);
    if (walletAddress) {
      setLoading(true);
      await fetchTransactions(walletAddress, 0, newFilter);
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'deposit':
        return { name: 'arrow-down-circle', color: colors.primary };
      case 'withdraw':
        return { name: 'arrow-up-circle', color: colors.danger };
      case 'trade_buy':
      case 'buy':
        return { name: 'cart', color: colors.primary };
      case 'trade_sell':
      case 'sell':
        return { name: 'pricetag', color: colors.warning };
      case 'exchange':
        return { name: 'swap-horizontal', color: colors.blue };
      case 'transfer_in':
        return { name: 'download', color: colors.purple };
      case 'transfer_out':
        return { name: 'push', color: colors.purple };
      case 'stake':
        return { name: 'lock-closed', color: colors.primary };
      case 'unstake':
        return { name: 'lock-open', color: colors.warning };
      default:
        return { name: 'ellipse', color: colors.textMuted };
    }
  };

  const getTypeLabel = (type: string): string => {
    const key = type as keyof typeof t;
    const label = t[key];
    // Debug
    console.log('🏷️ getTypeLabel:', { type, key, label, language, hasKey: key in t });
    return label || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.primary;
      case 'pending': return colors.warning;
      case 'failed': return colors.danger;
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, coin: string) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${coin}`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${coin}`;
    return `${amount.toFixed(4)} ${coin}`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTypeIcon(item.type);
    const isPositive = ['deposit', 'transfer_in', 'trade_buy', 'buy', 'unstake'].includes(item.type);

    return (
      <TouchableOpacity
        style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setSelectedTx(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.txIcon, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.txContent}>
          <View style={styles.txHeader}>
            <Text style={[styles.txType, { color: colors.text }]}>{getTypeLabel(item.type)}</Text>
            <Text style={[styles.txAmount, { color: isPositive ? colors.primary : colors.text }]}>
              {isPositive ? '+' : '-'}{formatAmount(item.amount, item.coin)}
            </Text>
          </View>
          <View style={styles.txFooter}>
            <Text style={[styles.txDate, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
            <View style={styles.txStatusRow}>
              <View style={[styles.txStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.txStatus, { color: getStatusColor(item.status) }]}>
                {t[item.status as keyof typeof t] || item.status}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.noTransactions}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.noTransactionsDesc}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return <View style={{ height: 20 }} />;
    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { borderColor: colors.border }]}
        onPress={handleLoadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.loadMoreText, { color: colors.primary }]}>{t.loadMore}</Text>
        )}
      </TouchableOpacity>
    );
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.exportButton}>
          <Ionicons name="download-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.totalVolume}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${summary.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.totalFees}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${summary.totalFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {[
          { key: 'all', label: t.all },
          { key: 'deposit', label: t.deposits },
          { key: 'withdraw', label: t.withdrawals },
          { key: 'trade', label: t.trades },
          { key: 'transfer', label: t.transfers },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
              { backgroundColor: filter === f.key ? colors.primary : colors.surfaceAlt },
            ]}
            onPress={() => handleFilterChange(f.key as FilterType)}
          >
            <Text style={[
              styles.filterTabText,
              { color: filter === f.key ? '#FFF' : colors.textSecondary },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTx(null)}
        >
          <View style={[styles.detailModal, { backgroundColor: colors.surface }]}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailIcon, { backgroundColor: getTypeIcon(selectedTx.type).color + '15' }]}>
                <Ionicons name={getTypeIcon(selectedTx.type).name} size={28} color={getTypeIcon(selectedTx.type).color} />
              </View>
              <Text style={[styles.detailType, { color: colors.text }]}>{getTypeLabel(selectedTx.type)}</Text>
              <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedTx.status) + '20' }]}>
                <Text style={[styles.detailStatusText, { color: getStatusColor(selectedTx.status) }]}>
                  {t[selectedTx.status as keyof typeof t] || selectedTx.status}
                </Text>
              </View>
            </View>

            <View style={styles.detailAmount}>
              <Text style={[styles.detailAmountValue, { color: colors.text }]}>
                {formatAmount(selectedTx.amount, selectedTx.coin)}
              </Text>
              <Text style={[styles.detailAmountUsd, { color: colors.textSecondary }]}>
                ≈ ${selectedTx.amountUsd?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRows}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t.date}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedTx.createdAt)}</Text>
              </View>
              {selectedTx.fee !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t.fee}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>${selectedTx.fee.toFixed(4)}</Text>
                </View>
              )}
              {selectedTx.txHash && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t.txHash}</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]} numberOfLines={1}>
                    {selectedTx.txHash.slice(0, 10)}...{selectedTx.txHash.slice(-8)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.closeDetailButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setSelectedTx(null)}
            >
              <Text style={[styles.closeDetailText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Export Modal */}
      <TransactionExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        walletAddress={walletAddress || ''}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txType: {
    fontSize: 15,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDate: {
    fontSize: 12,
  },
  txStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  txStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadMoreButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  detailModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailType: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailAmount: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAmountValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  detailAmountUsd: {
    fontSize: 14,
    marginTop: 4,
  },
  detailDivider: {
    height: 1,
    marginBottom: 16,
  },
  detailRows: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  closeDetailButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeDetailText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
