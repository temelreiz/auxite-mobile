// app/(tabs)/trust/index.tsx
// Trust Center Main Page - i18n Support

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function TrustCenterScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { theme } = useStore();
  const { t } = useTranslation('trust');
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    cardBg: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    warning: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
  };

  const navCards = [
    {
      id: 'reserves',
      title: t.reserves,
      description: t.reservesDesc,
      icon: 'analytics',
      color: colors.primary,
      route: '/(tabs)/trust/reserves',
    },
    {
      id: 'audits',
      title: t.audits,
      description: t.auditsDesc,
      icon: 'document-text',
      color: colors.blue,
      route: '/(tabs)/trust/audits',
    },
    {
      id: 'custody',
      title: t.custody,
      description: t.custodyDesc,
      icon: 'lock-closed',
      color: colors.purple,
      route: '/(tabs)/trust/custody',
    },
    {
      id: 'verify',
      title: t.verify,
      description: t.verifyDesc,
      icon: 'shield-checkmark',
      color: '#10b981',
      route: '/(tabs)/trust/verify',
    },
    {
      id: 'legal',
      title: t.legal,
      description: t.legalDesc,
      icon: 'document',
      color: '#6366f1',
      route: '/(tabs)/trust/legal',
    },
  ];

  const commitments = [
    { icon: 'checkmark-circle', text: t.commitment1 },
    { icon: 'shield-checkmark', text: t.commitment2 },
    { icon: 'business', text: t.commitment3 },
    { icon: 'eye', text: t.commitment4 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ['#064e3b', '#0f172a'] : ['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>{t.title}</Text>
            <View style={styles.heroBadge}>
              <View style={[styles.heroBadgeDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.heroBadgeText}>{t.launchPhase}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="time" size={32} color={colors.warning} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.emptyTitle}</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{t.emptyMessage}</Text>
        </View>

        <View style={styles.navCardsContainer}>
          {navCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.navCardIcon, { backgroundColor: card.color + '20' }]}>
                <Ionicons name={card.icon as any} size={24} color={card.color} />
              </View>
              <View style={styles.navCardContent}>
                <Text style={[styles.navCardTitle, { color: colors.text }]}>{card.title}</Text>
                <Text style={[styles.navCardDesc, { color: colors.textSecondary }]}>{card.description}</Text>
              </View>
              <View style={styles.navCardStatus}>
                <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.commitmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.commitmentTitle, { color: colors.text }]}>{t.commitmentTitle}</Text>
          <View style={styles.commitmentList}>
            {commitments.map((item, index) => (
              <View key={index} style={styles.commitmentItem}>
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                <Text style={[styles.commitmentText, { color: colors.textSecondary }]}>{item.text}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  heroGradient: { borderRadius: 16, padding: 24, marginBottom: 16 },
  heroContent: { alignItems: 'center' },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 12 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  heroBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16 },
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyMessage: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  navCardsContainer: { gap: 12, marginBottom: 16 },
  navCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  navCardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navCardContent: { flex: 1 },
  navCardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  navCardDesc: { fontSize: 12 },
  navCardStatus: { marginRight: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  commitmentCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  commitmentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  commitmentList: { gap: 12 },
  commitmentItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commitmentText: { fontSize: 14, flex: 1 },
  legalFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 12, borderWidth: 1 },
  legalText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
