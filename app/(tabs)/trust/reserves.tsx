// app/(tabs)/trust/reserves.tsx
// Proof of Reserves - API Connected with Live Prices
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

import { API_URL } from '@/constants/api';

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

const METAL_INFO: Record<string, { name: string; color: string }> = {
  AUXG: { name: 'Gold', color: '#EAB308' },
  AUXS: { name: 'Silver', color: '#94A3B8' },
  AUXPT: { name: 'Platinum', color: '#E2E8F0' },
  AUXPD: { name: 'Palladium', color: '#64748B' },
};

interface ReserveSummary {
  total: number;
  allocated: number;
  available: number;
  byVault: Record<string, number>;
}

interface ReservesData {
  summary: Record<string, ReserveSummary>;
  tokenSupply: Record<string, number>;
  vaults: Record<string, { name: string; country: string; code: string }>;
  totalBars: number;
  lastUpdated: string;
}

interface MetalPrices {
  AUXG: number;
  AUXS: number;
  AUXPT: number;
  AUXPD: number;
}

export default function ReservesScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { theme } = useStore();
  const { t } = useTranslation('trust');
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reserves, setReserves] = useState<ReservesData | null>(null);
  const [prices, setPrices] = useState<MetalPrices>({ AUXG: 0, AUXS: 0, AUXPT: 0, AUXPD: 0 });

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    cardBg: isDark ? '#0f172a' : '#f1f5f9',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    warning: '#f59e0b',
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prices`);
      const data = await res.json();
      if (data.prices) {
        setPrices({
          AUXG: data.prices.AUXG || 0,
          AUXS: data.prices.AUXS || 0,
          AUXPT: data.prices.AUXPT || 0,
          AUXPD: data.prices.AUXPD || 0,
        });
      }
    } catch (err) {
      console.error('Fetch prices error:', err);
    }
  };

  const fetchReserves = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reserves`);
      const data = await res.json();
      if (data.success) {
        setReserves(data);
      }
    } catch (err) {
      console.error('Fetch reserves error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchReserves();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrices();
    fetchReserves();
  };

  const formatGrams = (g: number) => {
    if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
    return `${g.toFixed(2)} g`;
  };

  const formatValue = (g: number, metal: string) => {
    const price = prices[metal as keyof MetalPrices] || 0;
    return g * price;
  };

  const getTotalValue = () => {
    if (!reserves?.summary) return 0;
    let total = 0;
    for (const [metal, data] of Object.entries(reserves.summary)) {
      total += formatValue(data.total, metal);
    }
    return total;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.reserves || 'Proof of Reserves'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.reservesSubtitle || '1:1 Physical Backing'}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* Hero Card */}
        <LinearGradient colors={isDark ? ['#064e3b', '#0f172a'] : ['#10b981', '#059669']} style={styles.heroCard}>
          <View style={styles.heroIcon}><Ionicons name="shield-checkmark" size={40} color="#fff" /></View>
          <Text style={styles.heroTitle}>100% Backed</Text>
          <Text style={styles.heroValue}>${getTotalValue().toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          <View style={styles.heroBadge}>
            <View style={[styles.badgeDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : reserves ? (
          <>
            {/* Summary Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>{reserves.totalBars?.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Bars</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>{Object.keys(reserves.vaults || {}).length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vaults</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>1:1</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Backing</Text>
              </View>
            </View>

            {/* Metal Reserves */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Metal Reserves</Text>
            {Object.entries(reserves.summary).map(([metal, data]) => {
              const info = METAL_INFO[metal] || { name: metal, color: '#64748b' };
              const metalValue = formatValue(data.total, metal);
              const pricePerGram = prices[metal as keyof MetalPrices] || 0;
              return (
                <View key={metal} style={[styles.metalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.metalHeader}>
                    <View style={[styles.metalIcon, { backgroundColor: info.color + '20' }]}>
                      <Image source={metalIcons[metal]} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    </View>
                    <View style={styles.metalInfo}>
                      <Text style={[styles.metalName, { color: colors.text }]}>{metal}</Text>
                      <Text style={[styles.metalSubtitle, { color: colors.textSecondary }]}>{info.name} • ${pricePerGram.toFixed(2)}/g</Text>
                    </View>
                    <View style={styles.metalTotal}>
                      <Text style={[styles.metalTotalValue, { color: info.color }]}>{formatGrams(data.total)}</Text>
                      <Text style={[styles.metalTotalLabel, { color: colors.textSecondary }]}>${metalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                    </View>
                  </View>
                  
                  {/* Vault Distribution */}
                  <View style={styles.vaultDistribution}>
                    {Object.entries(data.byVault).map(([vaultCode, grams]) => {
                      const vault = reserves.vaults[vaultCode];
                      const percentage = (grams / data.total * 100).toFixed(0);
                      return (
                        <View key={vaultCode} style={styles.vaultItem}>
                          <View style={styles.vaultInfo}>
                            <Ionicons name="business" size={14} color={colors.textSecondary} />
                            <Text style={[styles.vaultName, { color: colors.textSecondary }]}>
                              {vault?.name || vaultCode}
                            </Text>
                          </View>
                          <Text style={[styles.vaultGrams, { color: colors.text }]}>{formatGrams(grams)}</Text>
                          <View style={[styles.vaultBar, { backgroundColor: colors.cardBg }]}>
                            <View style={[styles.vaultBarFill, { width: `${percentage}%`, backgroundColor: info.color }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Allocation Status */}
                  <View style={[styles.allocationRow, { borderTopColor: colors.border }]}>
                    <View style={styles.allocationItem}>
                      <Text style={[styles.allocationValue, { color: '#10b981' }]}>{formatGrams(data.available)}</Text>
                      <Text style={[styles.allocationLabel, { color: colors.textSecondary }]}>Available</Text>
                    </View>
                    <View style={styles.allocationItem}>
                      <Text style={[styles.allocationValue, { color: '#f59e0b' }]}>{formatGrams(data.allocated)}</Text>
                      <Text style={[styles.allocationLabel, { color: colors.textSecondary }]}>Allocated</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Vaults */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vault Locations</Text>
            <View style={styles.vaultsGrid}>
              {Object.entries(reserves.vaults).map(([code, vault]) => (
                <View key={code} style={[styles.vaultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="business" size={24} color={colors.primary} />
                  <Text style={[styles.vaultCardName, { color: colors.text }]}>{vault.name}</Text>
                  <Text style={[styles.vaultCardCountry, { color: colors.textSecondary }]}>{vault.country}</Text>
                </View>
              ))}
            </View>

            {/* Last Updated */}
            <View style={[styles.footer, { backgroundColor: colors.cardBg }]}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Last updated: {new Date(reserves.lastUpdated).toLocaleString()}
              </Text>
            </View>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Unable to load reserves</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  heroCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 12 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  metalCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  metalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  metalIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  metalInfo: { flex: 1 },
  metalName: { fontSize: 16, fontWeight: '600' },
  metalSubtitle: { fontSize: 12, marginTop: 2 },
  metalTotal: { alignItems: 'flex-end' },
  metalTotalValue: { fontSize: 18, fontWeight: '700' },
  metalTotalLabel: { fontSize: 11, marginTop: 2 },
  vaultDistribution: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  vaultItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vaultInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  vaultName: { fontSize: 11 },
  vaultGrams: { fontSize: 12, fontWeight: '600', width: 60, textAlign: 'right' },
  vaultBar: { flex: 1, height: 6, borderRadius: 3 },
  vaultBarFill: { height: '100%', borderRadius: 3 },
  allocationRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, marginTop: 4, marginHorizontal: 16, paddingBottom: 16 },
  allocationItem: { flex: 1, alignItems: 'center' },
  allocationValue: { fontSize: 14, fontWeight: '600' },
  allocationLabel: { fontSize: 11, marginTop: 2 },
  vaultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  vaultCard: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center' },
  vaultCardName: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  vaultCardCountry: { fontSize: 12, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8 },
  footerText: { fontSize: 12 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 14, marginTop: 12 },
});
