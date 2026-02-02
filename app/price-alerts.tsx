// app/price-alerts.tsx
// Price Alert Manager Screen
// 6-Language Support | Dark/Light Mode | Create/Manage Alerts

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
  Switch,
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
    title: 'Fiyat Uyarıları',
    subtitle: 'Hedef fiyatlara ulaşıldığında bildirim alın',
    createAlert: 'Yeni Uyarı',
    activeAlerts: 'Aktif Uyarılar',
    triggeredAlerts: 'Tetiklenen Uyarılar',
    noAlerts: 'Henüz fiyat uyarısı yok',
    noAlertsDesc: 'Hedef fiyat belirleyin, biz sizi bilgilendirelim!',
    token: 'Token',
    targetPrice: 'Hedef Fiyat',
    direction: 'Yön',
    above: 'Üstüne Çıktığında',
    below: 'Altına Düştüğünde',
    repeat: 'Tekrarlansın',
    repeatDesc: 'Her tetiklendiğinde tekrar aktifleşsin',
    create: 'Oluştur',
    cancel: 'İptal',
    delete: 'Sil',
    reactivate: 'Yeniden Aktifle',
    active: 'Aktif',
    triggered: 'Tetiklendi',
    expired: 'Süresi Doldu',
    cancelled: 'İptal Edildi',
    currentPrice: 'Güncel',
    difference: 'Fark',
    suggestedPrices: 'Önerilen Hedefler',
    maxAlerts: 'Maksimum 20 aktif uyarı',
    back: 'Geri',
    confirmDelete: 'Bu uyarıyı silmek istediğinize emin misiniz?',
    alertCreated: 'Fiyat uyarısı oluşturuldu!',
    error: 'Hata',
  },
  en: {
    title: 'Price Alerts',
    subtitle: 'Get notified when target prices are reached',
    createAlert: 'New Alert',
    activeAlerts: 'Active Alerts',
    triggeredAlerts: 'Triggered Alerts',
    noAlerts: 'No price alerts yet',
    noAlertsDesc: 'Set a target price and we\'ll notify you!',
    token: 'Token',
    targetPrice: 'Target Price',
    direction: 'Direction',
    above: 'Goes Above',
    below: 'Drops Below',
    repeat: 'Repeat',
    repeatDesc: 'Reactivate after each trigger',
    create: 'Create',
    cancel: 'Cancel',
    delete: 'Delete',
    reactivate: 'Reactivate',
    active: 'Active',
    triggered: 'Triggered',
    expired: 'Expired',
    cancelled: 'Cancelled',
    currentPrice: 'Current',
    difference: 'Diff',
    suggestedPrices: 'Suggested Targets',
    maxAlerts: 'Maximum 20 active alerts',
    back: 'Back',
    confirmDelete: 'Are you sure you want to delete this alert?',
    alertCreated: 'Price alert created!',
    error: 'Error',
  },
  de: {
    title: 'Preisalarme',
    subtitle: 'Benachrichtigungen bei Zielpreisen erhalten',
    createAlert: 'Neuer Alarm',
    activeAlerts: 'Aktive Alarme',
    triggeredAlerts: 'Ausgelöste Alarme',
    noAlerts: 'Noch keine Preisalarme',
    noAlertsDesc: 'Legen Sie einen Zielpreis fest!',
    token: 'Token',
    targetPrice: 'Zielpreis',
    direction: 'Richtung',
    above: 'Steigt über',
    below: 'Fällt unter',
    repeat: 'Wiederholen',
    repeatDesc: 'Nach jedem Auslösen reaktivieren',
    create: 'Erstellen',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    reactivate: 'Reaktivieren',
    active: 'Aktiv',
    triggered: 'Ausgelöst',
    expired: 'Abgelaufen',
    cancelled: 'Abgebrochen',
    currentPrice: 'Aktuell',
    difference: 'Diff',
    suggestedPrices: 'Vorgeschlagene Ziele',
    maxAlerts: 'Maximal 20 aktive Alarme',
    back: 'Zurück',
    confirmDelete: 'Möchten Sie diesen Alarm wirklich löschen?',
    alertCreated: 'Preisalarm erstellt!',
    error: 'Fehler',
  },
  fr: {
    title: 'Alertes de Prix',
    subtitle: 'Notifications quand les prix cibles sont atteints',
    createAlert: 'Nouvelle Alerte',
    activeAlerts: 'Alertes Actives',
    triggeredAlerts: 'Alertes Déclenchées',
    noAlerts: 'Aucune alerte de prix',
    noAlertsDesc: 'Définissez un prix cible!',
    token: 'Token',
    targetPrice: 'Prix Cible',
    direction: 'Direction',
    above: 'Dépasse',
    below: 'Descend sous',
    repeat: 'Répéter',
    repeatDesc: 'Réactiver après chaque déclenchement',
    create: 'Créer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    reactivate: 'Réactiver',
    active: 'Active',
    triggered: 'Déclenchée',
    expired: 'Expirée',
    cancelled: 'Annulée',
    currentPrice: 'Actuel',
    difference: 'Diff',
    suggestedPrices: 'Cibles Suggérées',
    maxAlerts: 'Maximum 20 alertes actives',
    back: 'Retour',
    confirmDelete: 'Voulez-vous vraiment supprimer cette alerte?',
    alertCreated: 'Alerte de prix créée!',
    error: 'Erreur',
  },
  ar: {
    title: 'تنبيهات الأسعار',
    subtitle: 'احصل على إشعارات عند الوصول للأسعار المستهدفة',
    createAlert: 'تنبيه جديد',
    activeAlerts: 'التنبيهات النشطة',
    triggeredAlerts: 'التنبيهات المُفعّلة',
    noAlerts: 'لا توجد تنبيهات أسعار',
    noAlertsDesc: 'حدد سعراً مستهدفاً وسنبلغك!',
    token: 'الرمز',
    targetPrice: 'السعر المستهدف',
    direction: 'الاتجاه',
    above: 'يرتفع فوق',
    below: 'ينخفض تحت',
    repeat: 'تكرار',
    repeatDesc: 'إعادة التفعيل بعد كل تشغيل',
    create: 'إنشاء',
    cancel: 'إلغاء',
    delete: 'حذف',
    reactivate: 'إعادة تفعيل',
    active: 'نشط',
    triggered: 'مُفعّل',
    expired: 'منتهي',
    cancelled: 'ملغى',
    currentPrice: 'الحالي',
    difference: 'الفرق',
    suggestedPrices: 'الأهداف المقترحة',
    maxAlerts: 'حد أقصى 20 تنبيه نشط',
    back: 'رجوع',
    confirmDelete: 'هل أنت متأكد من حذف هذا التنبيه؟',
    alertCreated: 'تم إنشاء تنبيه السعر!',
    error: 'خطأ',
  },
  ru: {
    title: 'Ценовые Оповещения',
    subtitle: 'Уведомления при достижении целевых цен',
    createAlert: 'Новое Оповещение',
    activeAlerts: 'Активные Оповещения',
    triggeredAlerts: 'Сработавшие Оповещения',
    noAlerts: 'Ценовых оповещений пока нет',
    noAlertsDesc: 'Установите целевую цену!',
    token: 'Токен',
    targetPrice: 'Целевая Цена',
    direction: 'Направление',
    above: 'Поднимается выше',
    below: 'Опускается ниже',
    repeat: 'Повторять',
    repeatDesc: 'Реактивировать после срабатывания',
    create: 'Создать',
    cancel: 'Отмена',
    delete: 'Удалить',
    reactivate: 'Реактивировать',
    active: 'Активно',
    triggered: 'Сработало',
    expired: 'Истекло',
    cancelled: 'Отменено',
    currentPrice: 'Текущая',
    difference: 'Разн',
    suggestedPrices: 'Предложенные Цели',
    maxAlerts: 'Максимум 20 активных оповещений',
    back: 'Назад',
    confirmDelete: 'Вы уверены, что хотите удалить это оповещение?',
    alertCreated: 'Ценовое оповещение создано!',
    error: 'Ошибка',
  },
};

// ============================================
// TYPES
// ============================================
interface PriceAlert {
  id: string;
  token: string;
  targetPrice: number;
  direction: 'above' | 'below';
  status: 'active' | 'triggered' | 'expired' | 'cancelled';
  createdAt: string;
  triggeredAt?: string;
  repeat: boolean;
}

// ============================================
// TOKENS CONFIG
// ============================================
const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', color: '#23292F' },
  { symbol: 'SOL', name: 'Solana', icon: '◎', color: '#9945FF' },
  { symbol: 'AUXG', name: 'Gold', icon: '🥇', color: '#FFD700' },
  { symbol: 'AUXS', name: 'Silver', icon: '🥈', color: '#C0C0C0' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function PriceAlertsScreen() {
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
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [repeat, setRepeat] = useState(false);

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

      // Fetch prices
      await fetchPrices();

      // Fetch alerts
      if (address) {
        await fetchAlerts(address);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/crypto`);
      const data = await res.json();
      setCurrentPrices({
        BTC: data.bitcoin?.usd || 97500,
        ETH: data.ethereum?.usd || 3500,
        XRP: data.ripple?.usd || 2.2,
        SOL: data.solana?.usd || 200,
        AUXG: data.gold?.usd || 2650,
        AUXS: data.silver?.usd || 30,
      });
    } catch (err) {
      console.error('Fetch prices error:', err);
    }
  };

  const fetchAlerts = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        headers: { 'x-wallet-address': address },
      });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Fetch alerts error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await fetchPrices();
    await fetchAlerts(walletAddress);
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!targetPrice || !walletAddress) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          token: selectedToken,
          targetPrice: parseFloat(targetPrice),
          direction,
          repeat,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert(t.error, data.error);
        return;
      }

      Alert.alert('✓', t.alertCreated);
      setShowCreateModal(false);
      setTargetPrice('');
      setRepeat(false);
      await fetchAlerts(walletAddress);
    } catch (err: any) {
      Alert.alert(t.error, err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!walletAddress) return;

    Alert.alert('', t.confirmDelete, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/alerts?id=${alertId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });
            await fetchAlerts(walletAddress);
          } catch (err) {
            console.error('Delete error:', err);
          }
        },
      },
    ]);
  };

  const handleReactivate = async (alertId: string) => {
    if (!walletAddress) return;

    try {
      await fetch(`${API_URL}/api/alerts`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ alertId, action: 'reactivate' }),
      });
      await fetchAlerts(walletAddress);
    } catch (err) {
      console.error('Reactivate error:', err);
    }
  };

  const getCurrentPrice = (token: string) => currentPrices[token] || 0;

  const getSuggestedTargets = (token: string, dir: 'above' | 'below') => {
    const price = getCurrentPrice(token);
    if (!price) return [];
    const percentages = dir === 'above' ? [5, 10, 20, 50] : [-5, -10, -20, -30];
    return percentages.map((p) => Math.round(price * (1 + p / 100)));
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const otherAlerts = alerts.filter((a) => a.status !== 'active');

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
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.activeAlerts} ({activeAlerts.length})
            </Text>
            <View style={[styles.alertsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {activeAlerts.map((alert, index) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  currentPrice={getCurrentPrice(alert.token)}
                  onDelete={() => handleDelete(alert.id)}
                  colors={colors}
                  t={t}
                  isLast={index === activeAlerts.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* Triggered/Other Alerts */}
        {otherAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.triggeredAlerts} ({otherAlerts.length})
            </Text>
            <View style={[styles.alertsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {otherAlerts.map((alert, index) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  currentPrice={getCurrentPrice(alert.token)}
                  onDelete={() => handleDelete(alert.id)}
                  onReactivate={() => handleReactivate(alert.id)}
                  colors={colors}
                  t={t}
                  isLast={index === otherAlerts.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noAlerts}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t.noAlertsDesc}</Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyButtonText}>{t.createAlert}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.createAlert}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Token Selection */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.token}</Text>
              <View style={styles.tokensGrid}>
                {TOKENS.map((token) => (
                  <TouchableOpacity
                    key={token.symbol}
                    style={[
                      styles.tokenButton,
                      {
                        backgroundColor: selectedToken === token.symbol ? colors.primary + '20' : colors.surfaceAlt,
                        borderColor: selectedToken === token.symbol ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedToken(token.symbol)}
                  >
                    <Text style={styles.tokenIcon}>{token.icon}</Text>
                    <Text style={[styles.tokenSymbol, { color: colors.text }]}>{token.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {getCurrentPrice(selectedToken) > 0 && (
                <Text style={[styles.currentPriceText, { color: colors.textMuted }]}>
                  {t.currentPrice}: ${getCurrentPrice(selectedToken).toLocaleString()}
                </Text>
              )}

              {/* Direction */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t.direction}</Text>
              <View style={styles.directionRow}>
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    {
                      backgroundColor: direction === 'above' ? colors.primary + '20' : colors.surfaceAlt,
                      borderColor: direction === 'above' ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setDirection('above')}
                >
                  <Text style={styles.directionIcon}>📈</Text>
                  <Text style={[styles.directionText, { color: direction === 'above' ? colors.primary : colors.text }]}>
                    {t.above}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    {
                      backgroundColor: direction === 'below' ? colors.danger + '20' : colors.surfaceAlt,
                      borderColor: direction === 'below' ? colors.danger : 'transparent',
                    },
                  ]}
                  onPress={() => setDirection('below')}
                >
                  <Text style={styles.directionIcon}>📉</Text>
                  <Text style={[styles.directionText, { color: direction === 'below' ? colors.danger : colors.text }]}>
                    {t.below}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Target Price */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t.targetPrice}</Text>
              <View style={[styles.priceInputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.dollarSign, { color: colors.textSecondary }]}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Suggested Targets */}
              {getCurrentPrice(selectedToken) > 0 && (
                <View style={styles.suggestedContainer}>
                  <Text style={[styles.suggestedLabel, { color: colors.textMuted }]}>{t.suggestedPrices}:</Text>
                  <View style={styles.suggestedRow}>
                    {getSuggestedTargets(selectedToken, direction).map((price) => (
                      <TouchableOpacity
                        key={price}
                        style={[styles.suggestedChip, { backgroundColor: colors.surfaceAlt }]}
                        onPress={() => setTargetPrice(price.toString())}
                      >
                        <Text style={[styles.suggestedChipText, { color: colors.textSecondary }]}>
                          ${price.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Repeat Toggle */}
              <View style={[styles.repeatRow, { backgroundColor: colors.surfaceAlt, marginTop: 20 }]}>
                <View>
                  <Text style={[styles.repeatTitle, { color: colors.text }]}>{t.repeat}</Text>
                  <Text style={[styles.repeatDesc, { color: colors.textMuted }]}>{t.repeatDesc}</Text>
                </View>
                <Switch
                  value={repeat}
                  onValueChange={setRepeat}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={repeat ? colors.primary : colors.textMuted}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !targetPrice && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={!targetPrice || creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createButtonText}>{t.create}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// ALERT ROW COMPONENT
// ============================================
function AlertRow({
  alert,
  currentPrice,
  onDelete,
  onReactivate,
  colors,
  t,
  isLast,
}: {
  alert: PriceAlert;
  currentPrice: number;
  onDelete: () => void;
  onReactivate?: () => void;
  colors: any;
  t: any;
  isLast: boolean;
}) {
  const token = TOKENS.find((tk) => tk.symbol === alert.token);
  const diff = currentPrice ? ((alert.targetPrice - currentPrice) / currentPrice) * 100 : 0;

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: colors.primary + '20', text: colors.primary },
    triggered: { bg: colors.amber + '20', text: colors.amber },
    expired: { bg: colors.textMuted + '20', text: colors.textMuted },
    cancelled: { bg: colors.textMuted + '20', text: colors.textMuted },
  };

  const statusColor = statusColors[alert.status] || statusColors.active;

  return (
    <View style={[styles.alertRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.alertLeft}>
        <Text style={styles.alertIcon}>{token?.icon || '🪙'}</Text>
        <View>
          <View style={styles.alertTitleRow}>
            <Text style={[styles.alertToken, { color: colors.text }]}>{alert.token}</Text>
            <Text style={[styles.alertTarget, { color: alert.direction === 'above' ? colors.primary : colors.danger }]}>
              {alert.direction === 'above' ? '▲' : '▼'} ${alert.targetPrice.toLocaleString()}
            </Text>
            {alert.repeat && <Text style={styles.alertRepeat}>🔄</Text>}
          </View>
          {currentPrice > 0 && (
            <Text style={[styles.alertCurrent, { color: colors.textMuted }]}>
              {t.currentPrice}: ${currentPrice.toLocaleString()} ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
            </Text>
          )}
        </View>
      </View>
      <View style={styles.alertRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {t[alert.status] || alert.status}
          </Text>
        </View>
        <View style={styles.alertActions}>
          {alert.status !== 'active' && onReactivate && (
            <TouchableOpacity onPress={onReactivate}>
              <Text style={[styles.actionLink, { color: colors.primary }]}>{t.reactivate}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDelete}>
            <Text style={[styles.actionLink, { color: colors.danger }]}>{t.delete}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  alertsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertIcon: { fontSize: 24 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  alertToken: { fontSize: 14, fontWeight: '600' },
  alertTarget: { fontSize: 13 },
  alertRepeat: { fontSize: 11 },
  alertCurrent: { fontSize: 11, marginTop: 2 },
  alertRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '500' },
  alertActions: { flexDirection: 'row', gap: 10 },
  actionLink: { fontSize: 11, fontWeight: '500' },
  emptyCard: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '500', marginTop: 16 },
  emptyDesc: { fontSize: 13, marginTop: 4 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  tokensGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokenButton: { width: '31%', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  tokenIcon: { fontSize: 22 },
  tokenSymbol: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  currentPriceText: { fontSize: 12, marginTop: 8 },
  directionRow: { flexDirection: 'row', gap: 10 },
  directionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 12, borderWidth: 2 },
  directionIcon: { fontSize: 18 },
  directionText: { fontSize: 13, fontWeight: '500' },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  dollarSign: { fontSize: 18, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 14 },
  suggestedContainer: { marginTop: 10 },
  suggestedLabel: { fontSize: 11, marginBottom: 6 },
  suggestedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestedChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  suggestedChipText: { fontSize: 12 },
  repeatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12 },
  repeatTitle: { fontSize: 14, fontWeight: '500' },
  repeatDesc: { fontSize: 11, marginTop: 2 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontWeight: '600', fontSize: 15 },
  createButton: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
});
