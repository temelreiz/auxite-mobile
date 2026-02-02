// app/(tabs)/trust/verify.tsx
// Certificate Verification Page
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

import { API_URL } from '@/constants/api';

export default function VerifyScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { theme, language } = useStore();
  const { t } = useTranslation('trust');
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const lang = language === 'tr' ? 'tr' : 'en';

  const [certNumber, setCertNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    input: isDark ? '#0f172a' : '#f1f5f9',
    primary: '#10b981',
  };

  const texts = {
    placeholder: 'AUX-CERT-2025-XXXXXX',
    verify: lang === 'tr' ? 'Doğrula' : 'Verify',
    verified: lang === 'tr' ? 'Sertifika Doğrulandı ✓' : 'Certificate Verified ✓',
    notFound: lang === 'tr' ? 'Sertifika Bulunamadı' : 'Certificate Not Found',
    metal: lang === 'tr' ? 'Metal' : 'Metal',
    weight: lang === 'tr' ? 'Ağırlık' : 'Weight',
    vault: lang === 'tr' ? 'Kasa' : 'Vault',
    issued: lang === 'tr' ? 'Düzenlenme' : 'Issued',
    hash: lang === 'tr' ? 'Sertifika Hash' : 'Certificate Hash',
    serialNo: lang === 'tr' ? 'Seri No' : 'Serial No',
    purity: lang === 'tr' ? 'Saflık' : 'Purity',
  };

  const handleVerify = async () => {
    if (!certNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/certificates/verify?certNumber=${encodeURIComponent(certNumber)}`);
      const data = await res.json();
      if (data.error && !data.verified) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(lang === 'tr' ? 'Doğrulama başarısız' : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.verify || 'Verify Certificate'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.verifyDesc || 'Check Authenticity'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={isDark ? ['#064e3b', '#0f172a'] : ['#10b981', '#059669']} style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>
            {lang === 'tr' ? 'Sertifika Doğrulama' : 'Certificate Verification'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {lang === 'tr' ? 'Auxite sertifikanızın gerçekliğini doğrulayın' : 'Verify the authenticity of your Auxite certificate'}
          </Text>
        </LinearGradient>

        {/* Input Card */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {lang === 'tr' ? 'Sertifika Numarası' : 'Certificate Number'}
          </Text>
          <TextInput
            value={certNumber}
            onChangeText={(text) => setCertNumber(text.toUpperCase())}
            placeholder={texts.placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            autoCapitalize="characters"
            onSubmitEditing={handleVerify}
          />
          <TouchableOpacity
            style={[styles.verifyButton, { opacity: loading || !certNumber.trim() ? 0.5 : 1 }]}
            disabled={loading || !certNumber.trim()}
            onPress={handleVerify}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.verifyButtonText}>{texts.verify}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={[styles.resultCard, { backgroundColor: result.verified ? '#10b98115' : '#ef444415', borderColor: result.verified ? '#10b981' : '#ef4444' }]}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultIcon, { backgroundColor: result.verified ? '#10b981' : '#ef4444' }]}>
                <Ionicons name={result.verified ? 'checkmark' : 'close'} size={28} color="#fff" />
              </View>
              <Text style={[styles.resultTitle, { color: result.verified ? '#10b981' : '#ef4444' }]}>
                {result.verified ? texts.verified : texts.notFound}
              </Text>
            </View>

            {result.verified && result.certificate && (
              <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{texts.metal}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {result.certificate.metalName} ({result.certificate.metal})
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{texts.weight}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{result.certificate.grams}g</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{texts.purity}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{result.certificate.purity}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{texts.vault}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{result.certificate.vaultName}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{texts.serialNo}</Text>
                  <Text style={[styles.detailValueMono, { color: colors.text }]} numberOfLines={1}>
                    {result.certificate.serialNumber}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{texts.issued}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(result.certificate.issuedAt).toLocaleDateString()}
                  </Text>
                </View>

                {result.blockchain?.hash && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.hashSection}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{texts.hash}</Text>
                      <Text style={styles.hashText} numberOfLines={2}>{result.blockchain.hash}</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

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
  heroCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'monospace',
    borderWidth: 1,
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444420',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    color: '#ef4444',
    flex: 1,
    fontSize: 14,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueMono: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  divider: {
    height: 1,
  },
  hashSection: {
    paddingTop: 12,
  },
  hashText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#10b981',
    lineHeight: 16,
  },
});
