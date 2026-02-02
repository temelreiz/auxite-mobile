// components/LockedAssetsModal.tsx
// Kilitli Varlıklar Modalı - Physical Allocations & Staking Positions
// DİKKAT: Bu dosyayı components/ klasörüne koy, app/(tabs)/ DEĞİL!

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface Allocation {
  id: string;
  metal: string;
  grams: number;
  custodian: string;
  timestamp: string;
  txHash?: string;
}

interface StakePosition {
  id: string;
  metalSymbol: string;
  amountGrams: number;
  durationMonths: number;
  apyPercent: number;
  progress: number;
  timeRemaining?: number;
  isMatured: boolean;
  shortCode: string;
  expectedRewardGrams: number;
  startDate?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  metalPrices: Record<string, number>;
}

const translations: Record<string, Record<string, string>> = {
  tr: {
    title: 'Kilitli Varlıklar',
    allocations: 'Fiziksel Tahsisler',
    staking: 'Stake Pozisyonları',
    totalLocked: 'Toplam Kilitli',
    noAllocations: 'Henüz fiziksel tahsis yok',
    noStakes: 'Henüz stake pozisyonu yok',
    allocated: 'Tahsis Edildi',
    active: 'Aktif',
    completed: 'Tamamlandı',
    daysLeft: 'gün kaldı',
    months: 'ay',
    reward: 'Beklenen Ödül',
    viewOnChain: "Blockchain'de Gör",
    close: 'Kapat',
  },
  en: {
    title: 'Locked Assets',
    allocations: 'Physical Allocations',
    staking: 'Staking Positions',
    totalLocked: 'Total Locked',
    noAllocations: 'No physical allocations yet',
    noStakes: 'No staking positions yet',
    allocated: 'Allocated',
    active: 'Active',
    completed: 'Completed',
    daysLeft: 'days left',
    months: 'months',
    reward: 'Expected Reward',
    viewOnChain: 'View on Blockchain',
    close: 'Close',
  },
};

const METAL_INFO: Record<string, { emoji: string; color: string; name: string }> = {
  AUXG: { emoji: '🥇', color: '#f59e0b', name: 'Gold' },
  AUXS: { emoji: '🥈', color: '#94a3b8', name: 'Silver' },
  AUXPT: { emoji: '💎', color: '#22d3ee', name: 'Platinum' },
  AUXPD: { emoji: '🔶', color: '#fb7185', name: 'Palladium' },
};

const CUSTODIAN_NAMES: Record<string, string> = {
  zurich: 'Zurich Vault 🇨🇭',
  singapore: 'Singapore Vault 🇸🇬',
  london: 'London Vault 🇬🇧',
  dubai: 'Dubai Vault 🇦🇪',
};

export function LockedAssetsModal({ visible, onClose, metalPrices }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;

  const [activeTab, setActiveTab] = useState<'allocations' | 'staking'>('allocations');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [stakes, setStakes] = useState<StakePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, walletAddress]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (walletAddress) {
        const [allocRes, stakeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/allocations?wallet=${walletAddress}`),
          fetch(`${API_BASE_URL}/api/staking/positions?wallet=${walletAddress}`),
        ]);
        const allocData = await allocRes.json();
        const stakeData = await stakeRes.json();
        setAllocations(allocData.allocations || []);
        setStakes(stakeData.positions || []);
      } else {
        loadMockData();
      }
    } catch (error) {
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setAllocations([
      { id: '1', metal: 'AUXG', grams: 50, custodian: 'zurich', timestamp: '2024-12-01', txHash: '0x123...' },
      { id: '2', metal: 'AUXS', grams: 500, custodian: 'singapore', timestamp: '2024-11-15' },
      { id: '3', metal: 'AUXPT', grams: 5, custodian: 'london', timestamp: '2024-10-20' },
    ]);
    setStakes([
      { id: '1', metalSymbol: 'AUXG', amountGrams: 25.5, durationMonths: 6, apyPercent: 6.0, progress: 45, timeRemaining: 98, isMatured: false, shortCode: 'STK-A1B2C3', expectedRewardGrams: 0.765 },
      { id: '2', metalSymbol: 'AUXS', amountGrams: 200, durationMonths: 3, apyPercent: 3.5, progress: 80, timeRemaining: 18, isMatured: false, shortCode: 'STK-D4E5F6', expectedRewardGrams: 1.75 },
      { id: '3', metalSymbol: 'AUXG', amountGrams: 10, durationMonths: 12, apyPercent: 8.5, progress: 100, isMatured: true, shortCode: 'STK-G7H8I9', expectedRewardGrams: 0.85 },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [walletAddress]);

  const getTotalLocked = () => {
    let total = 0;
    allocations.forEach(a => {
      const price = metalPrices[a.metal] || 0;
      total += a.grams * price;
    });
    stakes.forEach(s => {
      const price = metalPrices[s.metalSymbol] || 0;
      total += s.amountGrams * price;
    });
    return total;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Total Summary */}
        <LinearGradient colors={['#f59e0b', '#ea580c']} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.totalLocked}</Text>
          <Text style={styles.summaryValue}>${getTotalLocked().toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <View style={styles.summaryMeta}>
            <View style={styles.summaryItem}>
              <Ionicons name="cube" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.summaryItemText}>{allocations.length} {t.allocations}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.summaryItemText}>{stakes.length} {t.staking}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.tab, activeTab === 'allocations' && styles.tabActive]} onPress={() => setActiveTab('allocations')}>
            <Ionicons name="cube" size={16} color={activeTab === 'allocations' ? '#f59e0b' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'allocations' ? '#f59e0b' : colors.textSecondary }]}>{t.allocations}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'staking' && styles.tabActive]} onPress={() => setActiveTab('staking')}>
            <Ionicons name="trending-up" size={16} color={activeTab === 'staking' ? '#10b981' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'staking' ? '#10b981' : colors.textSecondary }]}>{t.staking}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
          ) : activeTab === 'allocations' ? (
            allocations.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noAllocations}</Text>
              </View>
            ) : (
              allocations.map((alloc) => {
                const metal = METAL_INFO[alloc.metal];
                const price = metalPrices[alloc.metal] || 0;
                const value = alloc.grams * price;
                return (
                  <View key={alloc.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardEmoji}>{metal?.emoji}</Text>
                      <View>
                        <View style={styles.cardNameRow}>
                          <Text style={[styles.cardSymbol, { color: metal?.color }]}>{alloc.metal}</Text>
                          <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
                            <Text style={[styles.badgeText, { color: '#10b981' }]}>{t.allocated}</Text>
                          </View>
                        </View>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{CUSTODIAN_NAMES[alloc.custodian] || alloc.custodian}</Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.cardAmount, { color: colors.text }]}>{alloc.grams}g</Text>
                      <Text style={[styles.cardValue, { color: colors.textSecondary }]}>≈ ${value.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })
            )
          ) : (
            stakes.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noStakes}</Text>
              </View>
            ) : (
              stakes.map((stake) => {
                const metal = METAL_INFO[stake.metalSymbol];
                const price = metalPrices[stake.metalSymbol] || 0;
                const value = stake.amountGrams * price;
                return (
                  <View key={stake.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardEmoji}>{metal?.emoji}</Text>
                      <View>
                        <View style={styles.cardNameRow}>
                          <Text style={[styles.cardSymbol, { color: metal?.color }]}>{stake.metalSymbol}</Text>
                          <View style={[styles.badge, { backgroundColor: stake.isMatured ? '#10b98120' : '#3b82f620' }]}>
                            <Text style={[styles.badgeText, { color: stake.isMatured ? '#10b981' : '#3b82f6' }]}>
                              {stake.isMatured ? t.completed : t.active}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                          {stake.durationMonths} {t.months} • {stake.apyPercent}% APY
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[styles.cardAmount, { color: colors.text }]}>{stake.amountGrams.toFixed(2)}g</Text>
                      <View style={styles.progressRow}>
                        <View style={[styles.progressBar, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
                          <View style={[styles.progressFill, { width: `${stake.progress}%`, backgroundColor: stake.isMatured ? '#10b981' : '#3b82f6' }]} />
                        </View>
                        <Text style={[styles.progressText, { color: colors.textSecondary }]}>{stake.progress}%</Text>
                      </View>
                      {!stake.isMatured && stake.timeRemaining && (
                        <Text style={[styles.timeLeft, { color: colors.textSecondary }]}>{stake.timeRemaining} {t.daysLeft}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { padding: 4 },
  summaryCard: { margin: 16, padding: 20, borderRadius: 16 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12 },
  summaryMeta: { flexDirection: 'row', gap: 16 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryItemText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(0,0,0,0.1)' },
  tabText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 28 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardSymbol: { fontSize: 14, fontWeight: '700' },
  cardSub: { fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontSize: 14, fontWeight: '600' },
  cardValue: { fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  progressBar: { width: 50, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 9 },
  timeLeft: { fontSize: 9, marginTop: 2 },
  footer: { padding: 16, borderTopWidth: 1 },
  closeBtn: { backgroundColor: '#f59e0b', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default LockedAssetsModal;
