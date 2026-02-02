// app/(tabs)/trust/legal.tsx
// Legal Documents Page
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

import { API_URL } from '@/constants/api';

export default function LegalScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { theme } = useStore();
  const { t } = useTranslation('trust');
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
  };

  const legalDocs = [
    {
      id: 'terms',
      title: { tr: 'Kullanım Koşulları', en: 'Terms of Service' },
      description: { tr: 'Platform kullanım şartları, token ve sertifika tanımları', en: 'Platform usage terms, token and certificate definitions' },
      icon: 'document-text',
      color: '#f59e0b',
      url: `${API_URL}/legal/terms`,
    },
    {
      id: 'redemption',
      title: { tr: 'Geri Ödeme Politikası', en: 'Redemption Policy' },
      description: { tr: 'Fiziksel metal geri ödeme şartları ve süreci', en: 'Physical metal redemption terms and process' },
      icon: 'cube',
      color: '#10b981',
      url: `${API_URL}/legal/redemption`,
    },
    {
      id: 'privacy',
      title: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
      description: { tr: 'Veri toplama ve koruma uygulamaları', en: 'Data collection and protection practices' },
      icon: 'shield-checkmark',
      color: '#3b82f6',
      disabled: true,
    },
    {
      id: 'aml',
      title: { tr: 'AML/KYC Politikası', en: 'AML/KYC Policy' },
      description: { tr: 'Kara para aklama önleme ve müşterini tanı', en: 'Anti-money laundering and know your customer' },
      icon: 'finger-print',
      color: '#8b5cf6',
      disabled: true,
    },
  ];

  const lang = useStore.getState().language === 'tr' ? 'tr' : 'en';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.legal || 'Legal Documents'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.legalDesc || 'Terms & Policies'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {lang === 'tr' 
              ? 'Bu belgeler Auxite platformunun kullanım koşullarını ve politikalarını içerir.'
              : 'These documents contain the terms of use and policies of the Auxite platform.'}
          </Text>
        </View>

        {/* Legal Documents */}
        {legalDocs.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: doc.disabled ? 0.5 : 1 }]}
            disabled={doc.disabled}
            onPress={() => doc.url && Linking.openURL(doc.url)}
            activeOpacity={0.7}
          >
            <View style={[styles.docIcon, { backgroundColor: doc.color + '20' }]}>
              <Ionicons name={doc.icon as any} size={24} color={doc.color} />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docTitle, { color: colors.text }]}>{doc.title[lang]}</Text>
              <Text style={[styles.docDesc, { color: colors.textSecondary }]}>{doc.description[lang]}</Text>
            </View>
            {doc.disabled ? (
              <View style={styles.comingSoon}>
                <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                  {lang === 'tr' ? 'Yakında' : 'Soon'}
                </Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  docDesc: { fontSize: 13 },
  comingSoon: {
    backgroundColor: '#64748b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: { fontSize: 11, fontWeight: '500' },
});
