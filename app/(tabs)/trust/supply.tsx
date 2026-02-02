// app/(tabs)/trust/supply.tsx - i18n Support
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupplyScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { theme } = useStore();
  const { t } = useTranslation('trust');
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

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

  const tokens = [
    { symbol: 'AUXG', name: t.goldToken, icon: '🥇', color: '#EAB308' },
    { symbol: 'AUXS', name: t.silverToken, icon: '🥈', color: '#94A3B8' },
    { symbol: 'AUXPT', name: t.platinumToken, icon: '💎', color: '#06B6D4' },
    { symbol: 'AUXPD', name: t.palladiumToken, icon: '💜', color: '#8B5CF6' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.supply}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.supplySubtitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={isDark ? ['#065f46', '#0f172a'] : ['#10b981', '#059669']} style={styles.heroCard}>
          <View style={styles.heroIcon}><Ionicons name="pie-chart" size={40} color="#fff" /></View>
          <Text style={styles.heroTitle}>{t.supply}</Text>
          <View style={styles.heroBadge}>
            <View style={[styles.badgeDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.badgeText}>{t.launchPhase}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="layers-outline" size={32} color={colors.warning} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.supplyEmptyTitle}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.supplyEmptyText}</Text>
          <Text style={[styles.commitmentText, { color: colors.text }]}>{t.supplyCommitment}</Text>
          <View style={[styles.statusBox, { backgroundColor: colors.cardBg }]}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{t.supplyStatus}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{t.whatIsSupply}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.whatIsSupplyText}</Text>
        </View>

        <View style={[styles.tokensCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tokensTitle, { color: colors.text }]}>{t.plannedTokens}</Text>
          <View style={styles.tokensList}>
            {tokens.map((token) => (
              <View key={token.symbol} style={[styles.tokenItem, { backgroundColor: colors.cardBg }]}>
                <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                  <Text style={styles.tokenEmoji}>{token.icon}</Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={[styles.tokenSymbol, { color: colors.text }]}>{token.symbol}</Text>
                  <Text style={[styles.tokenName, { color: colors.textSecondary }]}>{token.name}</Text>
                </View>
                <View style={[styles.pendingBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.pendingText, { color: colors.warning }]}>{t.pending}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.legalFooter, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.legalText, { color: colors.textSecondary }]}>{t.legalFooter}</Text>
        </View>
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
  heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, marginBottom: 16 },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  commitmentText: { fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  statusText: { fontSize: 13, flex: 1 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  infoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  infoText: { fontSize: 14, lineHeight: 22 },
  tokensCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  tokensTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  tokensList: { gap: 12 },
  tokenItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12 },
  tokenIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tokenEmoji: { fontSize: 22 },
  tokenInfo: { flex: 1 },
  tokenSymbol: { fontSize: 14, fontWeight: '600' },
  tokenName: { fontSize: 12, marginTop: 2 },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingText: { fontSize: 11, fontWeight: '600' },
  legalFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 12, borderWidth: 1 },
  legalText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
