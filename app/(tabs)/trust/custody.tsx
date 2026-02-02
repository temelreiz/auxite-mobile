// app/(tabs)/trust/custody.tsx - i18n Support
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function CustodyScreen() {
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
    purple: '#8b5cf6',
  };

  const features = [
    { icon: 'business', title: t.independentCustodians, text: t.independentCustodiansText, color: colors.primary },
    { icon: 'lock-closed', title: t.secureVaults, text: t.secureVaultsText, color: colors.purple },
    { icon: 'shield-checkmark', title: t.insurance, text: t.insuranceText, color: '#3b82f6' },
  ];

  const plannedFeatures = [t.planned1, t.planned2, t.planned3, t.planned4];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.custody}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.custodySubtitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={isDark ? ['#4c1d95', '#0f172a'] : ['#8b5cf6', '#6d28d9']} style={styles.heroCard}>
          <View style={styles.heroIcon}><Ionicons name="lock-closed" size={40} color="#fff" /></View>
          <Text style={styles.heroTitle}>{t.custody}</Text>
          <View style={styles.heroBadge}>
            <View style={[styles.badgeDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.badgeText}>{t.launchPhase}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="cube-outline" size={32} color={colors.warning} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.custodyEmptyTitle}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.custodyEmptyText}</Text>
          <Text style={[styles.commitmentText, { color: colors.text }]}>{t.custodyCommitment}</Text>
          <View style={[styles.statusBox, { backgroundColor: colors.cardBg }]}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{t.custodyStatus}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{t.whatIsCustody}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.whatIsCustodyText}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.plannedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.plannedTitle, { color: colors.text }]}>{t.plannedInfrastructure}</Text>
          <Text style={[styles.plannedSubtext, { color: colors.textSecondary }]}>{t.plannedInfrastructureText}</Text>
          <View style={styles.plannedList}>
            {plannedFeatures.map((item, index) => (
              <View key={index} style={styles.plannedItem}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.plannedItemText, { color: colors.textSecondary }]}>{item}</Text>
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
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
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
  featuresContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  featureCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center' },
  featureIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  featureText: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  plannedCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  plannedTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  plannedSubtext: { fontSize: 13, marginBottom: 16 },
  plannedList: { gap: 12 },
  plannedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plannedItemText: { fontSize: 14, flex: 1 },
  legalFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 12, borderWidth: 1 },
  legalText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
