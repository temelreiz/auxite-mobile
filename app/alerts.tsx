// app/(tabs)/alerts.tsx
// Price Alerts - Fiyat Alarmları

import { StyleSheet, View, Text, useColorScheme, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useWallet } from '@/hooks/useWallet';
import {
  getPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
  updatePriceAlert,
  getMetalPrices,
  type PriceAlert,
} from '@/services/api';

const METALS = [
  { symbol: 'AUXG', name: 'Altın', color: '#FFD700' },
  { symbol: 'AUXS', name: 'Gümüş', color: '#C0C0C0' },
  { symbol: 'AUXPT', name: 'Platin', color: '#E5E4E2' },
  { symbol: 'AUXPD', name: 'Paladyum', color: '#CED0DD' },
];

export default function AlertsScreen() {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const insets = useSafeAreaInsets();
  const { address, isConnected } = useWallet();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState('AUXG');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [repeat, setRepeat] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);

  // Fetch alerts and prices
  const fetchData = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    
    try {
      const [alertsData, pricesData] = await Promise.all([
        getPriceAlerts(address),
        getMetalPrices(),
      ]);
      
      setAlerts(alertsData.alerts || []);
      setActiveCount(alertsData.active || 0);
      
      // Parse prices
      const prices: Record<string, number> = {};
      if (pricesData && Array.isArray(pricesData)) {
        pricesData.forEach((p: any) => {
          if (p.symbol && p.price) {
            prices[p.symbol] = p.price / 31.1035; // Convert to gram
          }
        });
      }
      setCurrentPrices(prices);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Create alert
  const handleCreateAlert = async () => {
    if (!address) return;
    
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      Alert.alert('Hata', 'Geçerli bir hedef fiyat girin');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPriceAlert(address, selectedMetal, price, direction, expiresInDays, repeat);
      
      if (result.success) {
        Alert.alert('Başarılı', 'Fiyat alarmı oluşturuldu', [
          { text: 'Tamam', onPress: () => {
            setModalVisible(false);
            resetForm();
            fetchData();
          }}
        ]);
      } else {
        Alert.alert('Hata', result.error || 'Alarm oluşturulamadı');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTargetPrice('');
    setSelectedMetal('AUXG');
    setDirection('above');
    setRepeat(false);
    setExpiresInDays(30);
  };

  // Delete alert
  const handleDeleteAlert = async (alertId: string) => {
    if (!address) return;
    
    Alert.alert('Alarmı Sil', 'Bu alarmı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        const result = await deletePriceAlert(address, alertId);
        if (result.success) {
          fetchData();
        }
      }},
    ]);
  };

  // Toggle alert
  const handleToggleAlert = async (alertId: string, currentStatus: string) => {
    if (!address) return;
    
    const action = currentStatus === 'active' ? 'cancel' : 'reactivate';
    const result = await updatePriceAlert(address, alertId, action);
    if (result.success) {
      fetchData();
    }
  };

  // Get metal info
  const getMetalInfo = (symbol: string) => {
    return METALS.find(m => m.symbol === symbol) || METALS[0];
  };

  // Format price change
  const getPriceChange = (alert: PriceAlert) => {
    const currentPrice = currentPrices[alert.token] || 0;
    if (!currentPrice) return null;
    
    const diff = alert.targetPrice - currentPrice;
    const percent = (diff / currentPrice) * 100;
    
    return {
      diff: Math.abs(diff).toFixed(2),
      percent: Math.abs(percent).toFixed(1),
      isAbove: diff > 0,
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isConnected) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
        <Ionicons name="notifications" size={64} color={isDark ? '#334155' : '#cbd5e1'} />
        <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          Fiyat alarmları oluşturmak için cüzdanınızı bağlayın
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>Fiyat Alarmları</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            Metal fiyatları hedeflerinize ulaştığında bildirim alın
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Aktif Alarm</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {alerts.filter(a => a.status === 'triggered').length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Tetiklenen</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#0f172a' }]}>{alerts.length}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Toplam</Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: '#f59e0b' }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Yeni Alarm Oluştur</Text>
        </TouchableOpacity>

        {/* Current Prices */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Güncel Fiyatlar</Text>
          <View style={styles.priceGrid}>
            {METALS.map((metal) => (
              <View key={metal.symbol} style={styles.priceItem}>
                <View style={[styles.metalDot, { backgroundColor: metal.color }]} />
                <Text style={[styles.metalName, { color: isDark ? '#94a3b8' : '#64748b' }]}>{metal.name}</Text>
                <Text style={[styles.metalPrice, { color: isDark ? '#fff' : '#0f172a' }]}>
                  ${(currentPrices[metal.symbol] || 0).toFixed(2)}/g
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Alerts List */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Alarmlarım</Text>
          
          {isLoading ? (
            <ActivityIndicator color="#f59e0b" style={{ padding: 20 }} />
          ) : alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Henüz alarm oluşturmadınız
              </Text>
            </View>
          ) : (
            alerts.map((alert) => {
              const metal = getMetalInfo(alert.token);
              const priceChange = getPriceChange(alert);
              
              return (
                <View 
                  key={alert.id} 
                  style={[
                    styles.alertCard, 
                    { 
                      borderLeftColor: alert.status === 'active' ? metal.color : '#64748b',
                      opacity: alert.status === 'cancelled' || alert.status === 'expired' ? 0.5 : 1,
                    }
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.alertInfo}>
                      <View style={[styles.metalBadge, { backgroundColor: metal.color + '30' }]}>
                        <Text style={[styles.metalBadgeText, { color: metal.color }]}>{metal.symbol}</Text>
                      </View>
                      <View>
                        <Text style={[styles.alertTarget, { color: isDark ? '#fff' : '#0f172a' }]}>
                          ${alert.targetPrice.toFixed(2)}/g
                        </Text>
                        <Text style={[styles.alertDirection, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                          {alert.direction === 'above' ? '↑ Üzerine çıkınca' : '↓ Altına düşünce'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          alert.status === 'active' ? '#10b98120' : 
                          alert.status === 'triggered' ? '#3b82f620' :
                          '#64748b20'
                      }
                    ]}>
                      <Text style={{ 
                        color: 
                          alert.status === 'active' ? '#10b981' : 
                          alert.status === 'triggered' ? '#3b82f6' :
                          '#64748b',
                        fontSize: 10, 
                        fontWeight: '600' 
                      }}>
                        {alert.status === 'active' ? 'AKTİF' : 
                         alert.status === 'triggered' ? 'TETİKLENDİ' :
                         alert.status === 'cancelled' ? 'İPTAL' : 'DOLDU'}
                      </Text>
                    </View>
                  </View>

                  {priceChange && alert.status === 'active' && (
                    <View style={styles.priceChangeRow}>
                      <Text style={[styles.priceChangeText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        Hedefe ${priceChange.diff} (%{priceChange.percent}) {priceChange.isAbove ? 'yukarıda' : 'aşağıda'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.alertMeta}>
                    {alert.repeat && (
                      <View style={styles.metaItem}>
                        <Ionicons name="repeat" size={12} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.metaText, { color: isDark ? '#64748b' : '#94a3b8' }]}>Tekrarlı</Text>
                      </View>
                    )}
                    {alert.expiresAt && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.metaText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                          {new Date(alert.expiresAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.alertActions}>
                    {alert.status !== 'triggered' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}
                        onPress={() => handleToggleAlert(alert.id, alert.status)}
                      >
                        <Ionicons 
                          name={alert.status === 'active' ? 'pause' : 'play'} 
                          size={14} 
                          color={alert.status === 'active' ? '#f59e0b' : '#10b981'} 
                        />
                        <Text style={{ 
                          color: alert.status === 'active' ? '#f59e0b' : '#10b981', 
                          fontSize: 11, 
                          fontWeight: '600' 
                        }}>
                          {alert.status === 'active' ? 'Durdur' : 'Aktifle'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#ef444420' }]}
                      onPress={() => handleDeleteAlert(alert.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Yeni Fiyat Alarmı</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Metal Selection */}
            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Metal Seç</Text>
            <View style={styles.metalSelector}>
              {METALS.map((metal) => (
                <TouchableOpacity
                  key={metal.symbol}
                  style={[
                    styles.metalOption,
                    selectedMetal === metal.symbol && { borderColor: metal.color, borderWidth: 2 },
                    { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                  ]}
                  onPress={() => setSelectedMetal(metal.symbol)}
                >
                  <View style={[styles.metalDot, { backgroundColor: metal.color }]} />
                  <Text style={[
                    styles.metalOptionText,
                    { color: selectedMetal === metal.symbol ? metal.color : (isDark ? '#fff' : '#0f172a') }
                  ]}>
                    {metal.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current Price Info */}
            <View style={[styles.currentPriceBox, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
              <Text style={[styles.currentPriceLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Güncel {getMetalInfo(selectedMetal).name} Fiyatı:
              </Text>
              <Text style={[styles.currentPriceValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                ${(currentPrices[selectedMetal] || 0).toFixed(2)}/g
              </Text>
            </View>

            {/* Target Price */}
            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Hedef Fiyat ($/g)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                color: isDark ? '#fff' : '#0f172a',
                borderColor: isDark ? '#334155' : '#e2e8f0'
              }]}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
            />

            {/* Direction */}
            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Tetikleme Koşulu</Text>
            <View style={styles.directionSelector}>
              <TouchableOpacity
                style={[
                  styles.directionOption,
                  direction === 'above' && styles.directionOptionActive,
                  { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                ]}
                onPress={() => setDirection('above')}
              >
                <Ionicons name="arrow-up" size={18} color={direction === 'above' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8')} />
                <Text style={[
                  styles.directionText,
                  { color: direction === 'above' ? '#10b981' : (isDark ? '#fff' : '#0f172a') }
                ]}>
                  Üzerine Çıkınca
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.directionOption,
                  direction === 'below' && styles.directionOptionActive,
                  { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                ]}
                onPress={() => setDirection('below')}
              >
                <Ionicons name="arrow-down" size={18} color={direction === 'below' ? '#ef4444' : (isDark ? '#64748b' : '#94a3b8')} />
                <Text style={[
                  styles.directionText,
                  { color: direction === 'below' ? '#ef4444' : (isDark ? '#fff' : '#0f172a') }
                ]}>
                  Altına Düşünce
                </Text>
              </TouchableOpacity>
            </View>

            {/* Repeat */}
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: isDark ? '#fff' : '#0f172a' }]}>Tekrarlı Alarm</Text>
                <Text style={[styles.switchHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  Her tetiklenmede yeniden aktifleşir
                </Text>
              </View>
              <Switch
                value={repeat}
                onValueChange={setRepeat}
                trackColor={{ false: '#334155', true: '#f59e0b' }}
                thumbColor="#fff"
              />
            </View>

            {/* Expires */}
            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Geçerlilik Süresi</Text>
            <View style={styles.expiresSelector}>
              {[7, 14, 30, 90].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.expiresOption,
                    expiresInDays === days && styles.expiresOptionActive,
                    { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                  ]}
                  onPress={() => setExpiresInDays(days)}
                >
                  <Text style={[
                    styles.expiresText,
                    { color: expiresInDays === days ? '#f59e0b' : (isDark ? '#fff' : '#0f172a') }
                  ]}>
                    {days} gün
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#f59e0b', opacity: isCreating ? 0.7 : 1 }]}
              onPress={handleCreateAlert}
              disabled={isCreating}
            >
              <Text style={styles.modalButtonText}>
                {isCreating ? 'Oluşturuluyor...' : 'Alarm Oluştur'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },

  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12, paddingHorizontal: 40 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 10, marginTop: 4 },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  section: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
  metalDot: { width: 8, height: 8, borderRadius: 4 },
  metalName: { fontSize: 11 },
  metalPrice: { fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 30 },

  alertCard: { 
    paddingVertical: 12, 
    paddingHorizontal: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metalBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  metalBadgeText: { fontSize: 11, fontWeight: '700' },
  alertTarget: { fontSize: 16, fontWeight: '600' },
  alertDirection: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  priceChangeRow: { marginTop: 8 },
  priceChangeText: { fontSize: 11 },

  alertMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10 },

  alertActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },

  inputLabel: { fontSize: 12, marginBottom: 8, marginTop: 16 },
  input: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1 },

  metalSelector: { flexDirection: 'row', gap: 8 },
  metalOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
  metalOptionText: { fontSize: 12, fontWeight: '600' },

  currentPriceBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 12 },
  currentPriceLabel: { fontSize: 12 },
  currentPriceValue: { fontSize: 16, fontWeight: '700' },

  directionSelector: { flexDirection: 'row', gap: 8 },
  directionOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
  directionOptionActive: { borderWidth: 2, borderColor: '#f59e0b' },
  directionText: { fontSize: 12, fontWeight: '600' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  switchHint: { fontSize: 11, marginTop: 2 },

  expiresSelector: { flexDirection: 'row', gap: 8 },
  expiresOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  expiresOptionActive: { borderWidth: 2, borderColor: '#f59e0b' },
  expiresText: { fontSize: 12, fontWeight: '600' },

  modalButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
