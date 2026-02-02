// app/sessions.tsx
// Session Manager Screen
// 6-Language Support | Dark/Light Mode | Active Sessions Management

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
    title: 'Aktif Oturumlar',
    subtitle: 'Hesabınıza bağlı cihazları yönetin',
    activeSessions: 'aktif oturum',
    current: 'Mevcut',
    otherSessions: 'Diğer Oturumlar',
    noOtherSessions: 'Başka aktif oturum yok',
    endSession: 'Sonlandır',
    endAllSessions: 'Tümünü Sonlandır',
    activeNow: 'Şimdi aktif',
    lastActive: 'Son aktivite',
    ago: 'önce',
    confirmEnd: 'Bu oturum sonlandırılsın mı?',
    confirmEndAll: 'Mevcut oturum hariç tüm oturumlar sonlandırılsın mı?',
    sessionEnded: 'Oturum sonlandırıldı',
    sessionsEnded: 'oturum sonlandırıldı',
    securityTip: 'Güvenlik İpucu',
    securityTipDesc: 'Tanımadığınız oturumları derhal sonlandırın. Şüpheli aktivite görürseniz şifrenizi değiştirin ve 2FA\'yı aktifleştirin.',
    cancel: 'İptal',
    error: 'Hata',
    back: 'Geri',
  },
  en: {
    title: 'Active Sessions',
    subtitle: 'Manage devices connected to your account',
    activeSessions: 'active session(s)',
    current: 'Current',
    otherSessions: 'Other Sessions',
    noOtherSessions: 'No other active sessions',
    endSession: 'End',
    endAllSessions: 'End All',
    activeNow: 'Active now',
    lastActive: 'Last active',
    ago: 'ago',
    confirmEnd: 'End this session?',
    confirmEndAll: 'End all sessions except current?',
    sessionEnded: 'Session ended',
    sessionsEnded: 'sessions ended',
    securityTip: 'Security Tip',
    securityTipDesc: 'End any sessions you don\'t recognize immediately. If you see suspicious activity, change your password and enable 2FA.',
    cancel: 'Cancel',
    error: 'Error',
    back: 'Back',
  },
  de: {
    title: 'Aktive Sitzungen',
    subtitle: 'Verwalten Sie verbundene Geräte',
    activeSessions: 'aktive Sitzung(en)',
    current: 'Aktuell',
    otherSessions: 'Andere Sitzungen',
    noOtherSessions: 'Keine anderen aktiven Sitzungen',
    endSession: 'Beenden',
    endAllSessions: 'Alle Beenden',
    activeNow: 'Jetzt aktiv',
    lastActive: 'Zuletzt aktiv',
    ago: 'vor',
    confirmEnd: 'Diese Sitzung beenden?',
    confirmEndAll: 'Alle Sitzungen außer der aktuellen beenden?',
    sessionEnded: 'Sitzung beendet',
    sessionsEnded: 'Sitzungen beendet',
    securityTip: 'Sicherheitstipp',
    securityTipDesc: 'Beenden Sie unbekannte Sitzungen sofort. Bei verdächtigen Aktivitäten ändern Sie Ihr Passwort und aktivieren Sie 2FA.',
    cancel: 'Abbrechen',
    error: 'Fehler',
    back: 'Zurück',
  },
  fr: {
    title: 'Sessions Actives',
    subtitle: 'Gérez les appareils connectés à votre compte',
    activeSessions: 'session(s) active(s)',
    current: 'Actuelle',
    otherSessions: 'Autres Sessions',
    noOtherSessions: 'Aucune autre session active',
    endSession: 'Terminer',
    endAllSessions: 'Tout Terminer',
    activeNow: 'Actif maintenant',
    lastActive: 'Dernière activité',
    ago: 'il y a',
    confirmEnd: 'Terminer cette session?',
    confirmEndAll: 'Terminer toutes les sessions sauf l\'actuelle?',
    sessionEnded: 'Session terminée',
    sessionsEnded: 'sessions terminées',
    securityTip: 'Conseil de Sécurité',
    securityTipDesc: 'Terminez immédiatement les sessions inconnues. En cas d\'activité suspecte, changez votre mot de passe et activez 2FA.',
    cancel: 'Annuler',
    error: 'Erreur',
    back: 'Retour',
  },
  ar: {
    title: 'الجلسات النشطة',
    subtitle: 'إدارة الأجهزة المتصلة بحسابك',
    activeSessions: 'جلسة(جلسات) نشطة',
    current: 'الحالية',
    otherSessions: 'جلسات أخرى',
    noOtherSessions: 'لا توجد جلسات نشطة أخرى',
    endSession: 'إنهاء',
    endAllSessions: 'إنهاء الكل',
    activeNow: 'نشط الآن',
    lastActive: 'آخر نشاط',
    ago: 'منذ',
    confirmEnd: 'إنهاء هذه الجلسة؟',
    confirmEndAll: 'إنهاء جميع الجلسات باستثناء الحالية؟',
    sessionEnded: 'تم إنهاء الجلسة',
    sessionsEnded: 'جلسات تم إنهاؤها',
    securityTip: 'نصيحة أمنية',
    securityTipDesc: 'قم بإنهاء الجلسات غير المعروفة فوراً. في حالة النشاط المشبوه، غيّر كلمة المرور وفعّل المصادقة الثنائية.',
    cancel: 'إلغاء',
    error: 'خطأ',
    back: 'رجوع',
  },
  ru: {
    title: 'Активные Сессии',
    subtitle: 'Управляйте устройствами, подключенными к вашему аккаунту',
    activeSessions: 'активных сессий',
    current: 'Текущая',
    otherSessions: 'Другие Сессии',
    noOtherSessions: 'Нет других активных сессий',
    endSession: 'Завершить',
    endAllSessions: 'Завершить Все',
    activeNow: 'Активна сейчас',
    lastActive: 'Последняя активность',
    ago: 'назад',
    confirmEnd: 'Завершить эту сессию?',
    confirmEndAll: 'Завершить все сессии кроме текущей?',
    sessionEnded: 'Сессия завершена',
    sessionsEnded: 'сессий завершено',
    securityTip: 'Совет по Безопасности',
    securityTipDesc: 'Немедленно завершайте незнакомые сессии. При подозрительной активности смените пароль и включите 2FA.',
    cancel: 'Отмена',
    error: 'Ошибка',
    back: 'Назад',
  },
};

// ============================================
// TYPES
// ============================================
interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ip: string;
  location: string;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SessionsScreen() {
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

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

      if (address) {
        await fetchSessions(address);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/security/sessions`, {
        headers: { 'x-wallet-address': address },
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Fetch sessions error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await fetchSessions(walletAddress);
    setRefreshing(false);
  };

  const revokeSession = async (sessionId: string) => {
    if (!walletAddress) return;

    Alert.alert('', t.confirmEnd, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.endSession,
        style: 'destructive',
        onPress: async () => {
          setProcessing(sessionId);
          try {
            await fetch(`${API_URL}/api/security/sessions?sessionId=${sessionId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });
            Alert.alert('✓', t.sessionEnded);
            await fetchSessions(walletAddress);
          } catch (err: any) {
            Alert.alert(t.error, err.message);
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const revokeAllSessions = async () => {
    if (!walletAddress) return;

    Alert.alert('', t.confirmEndAll, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.endAllSessions,
        style: 'destructive',
        onPress: async () => {
          setProcessing('all');
          try {
            const res = await fetch(`${API_URL}/api/security/sessions?revokeAll=true`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });
            const data = await res.json();
            Alert.alert('✓', `${data.revokedCount || 0} ${t.sessionsEnded}`);
            await fetchSessions(walletAddress);
          } catch (err: any) {
            Alert.alert(t.error, err.message);
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return t.activeNow;
    if (diffMins < 60) return `${diffMins}m ${t.ago}`;
    if (diffHours < 24) return `${diffHours}h ${t.ago}`;
    if (diffDays < 7) return `${diffDays}d ${t.ago}`;
    return date.toLocaleDateString();
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

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
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {sessions.length} {t.activeSessions}
          </Text>
        </View>
        {otherSessions.length > 0 && (
          <TouchableOpacity
            style={[styles.endAllButton, { backgroundColor: colors.danger + '20' }]}
            onPress={revokeAllSessions}
            disabled={processing === 'all'}
          >
            {processing === 'all' ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={[styles.endAllButtonText, { color: colors.danger }]}>{t.endAllSessions}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Current Session */}
        {currentSession && (
          <View style={[styles.currentSessionCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
            <View style={styles.sessionRow}>
              <View style={[styles.deviceIcon, { backgroundColor: colors.primary + '30' }]}>
                <Text style={styles.deviceIconText}>{getDeviceIcon(currentSession.deviceType)}</Text>
              </View>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionTitleRow}>
                  <Text style={[styles.sessionDevice, { color: colors.primary }]}>{currentSession.deviceName || 'Unknown Device'}</Text>
                  <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.currentBadgeText}>{t.current}</Text>
                  </View>
                </View>
                <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                  📍 {currentSession.location || currentSession.ip} • {t.activeNow}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.otherSessions}</Text>
            {otherSessions.map((session) => (
              <View key={session.id} style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sessionRow}>
                  <View style={[styles.deviceIcon, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={styles.deviceIconText}>{getDeviceIcon(session.deviceType)}</Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionDevice, { color: colors.text }]}>{session.deviceName || 'Unknown Device'}</Text>
                    <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                      📍 {session.location || session.ip} • {formatTimeAgo(session.lastActivity)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.endButton, { backgroundColor: colors.danger + '20' }]}
                    onPress={() => revokeSession(session.id)}
                    disabled={processing === session.id}
                  >
                    {processing === session.id ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Text style={[styles.endButtonText, { color: colors.danger }]}>{t.endSession}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State for Other Sessions */}
        {otherSessions.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noOtherSessions}</Text>
          </View>
        )}

        {/* Security Tip */}
        <View style={[styles.tipCard, { backgroundColor: colors.amber + '15', borderColor: colors.amber + '30' }]}>
          <Text style={styles.tipEmoji}>⚠️</Text>
          <View style={styles.tipTextContainer}>
            <Text style={[styles.tipTitle, { color: colors.amber }]}>{t.securityTip}</Text>
            <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>{t.securityTipDesc}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  endAllButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  endAllButtonText: { fontSize: 12, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  currentSessionCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  sessionRow: { flexDirection: 'row', alignItems: 'center' },
  deviceIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  deviceIconText: { fontSize: 22 },
  sessionInfo: { flex: 1, marginLeft: 12 },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionDevice: { fontSize: 14, fontWeight: '600' },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  currentBadgeText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  sessionMeta: { fontSize: 12, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  sessionCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  endButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  endButtonText: { fontSize: 12, fontWeight: '500' },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 30, alignItems: 'center', marginBottom: 20 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14 },
  tipCard: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  tipEmoji: { fontSize: 18 },
  tipTextContainer: { flex: 1 },
  tipTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  tipDesc: { fontSize: 12, lineHeight: 18 },
});
