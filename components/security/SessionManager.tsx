// components/security/SessionManager.tsx
// Aktif Oturumlar Yönetimi
// TR/EN | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

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

const translations = {
  tr: {
    title: 'Aktif Oturumlar',
    activeSession: 'aktif oturum',
    current: 'Mevcut',
    activeNow: 'Şimdi aktif',
    endSession: 'Sonlandır',
    endAllSessions: 'Tümünü Sonlandır',
    confirmEnd: 'Bu oturum sonlandırılsın mı?',
    confirmEndAll: 'Mevcut oturum hariç tüm oturumlar sonlandırılsın mı?',
    sessionEnded: 'Oturum sonlandırıldı',
    sessionsEnded: 'oturum sonlandırıldı',
    noOtherSessions: 'Başka aktif oturum yok',
    otherSessions: 'Diğer Oturumlar',
    securityTip: 'Güvenlik İpucu',
    securityTipDesc: 'Tanımadığınız oturumları derhal sonlandırın. Şüpheli bir aktivite görürseniz şifrenizi değiştirin ve 2FA\'yı aktifleştirin.',
    minutesAgo: 'dk önce',
    hoursAgo: 'saat önce',
    daysAgo: 'gün önce',
  },
  en: {
    title: 'Active Sessions',
    activeSession: 'active session(s)',
    current: 'Current',
    activeNow: 'Active now',
    endSession: 'End',
    endAllSessions: 'End All',
    confirmEnd: 'End this session?',
    confirmEndAll: 'End all sessions except current?',
    sessionEnded: 'Session ended',
    sessionsEnded: 'sessions ended',
    noOtherSessions: 'No other active sessions',
    otherSessions: 'Other Sessions',
    securityTip: 'Security Tip',
    securityTipDesc: 'End any sessions you don\'t recognize immediately. If you see suspicious activity, change your password and enable 2FA.',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
  },
};

export function SessionManager() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  };

  useEffect(() => {
    fetchSessions();
  }, [walletAddress]);

  const fetchSessions = async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/security/sessions`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Sessions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const revokeSession = (sessionId: string) => {
    Alert.alert('', t.confirmEnd, [
      { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
      {
        text: t.endSession,
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessing(sessionId);
            setError(null);

            const res = await fetch(`${API_BASE_URL}/api/security/sessions?sessionId=${sessionId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error);
            }

            setSuccess(t.sessionEnded);
            fetchSessions();
            setTimeout(() => setSuccess(null), 3000);
          } catch (err: any) {
            setError(err.message);
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const revokeAllSessions = () => {
    Alert.alert('', t.confirmEndAll, [
      { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
      {
        text: t.endAllSessions,
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessing('all');
            setError(null);

            const res = await fetch(`${API_BASE_URL}/api/security/sessions?revokeAll=true`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error);
            }

            setSuccess(`${data.revokedCount} ${t.sessionsEnded}`);
            fetchSessions();
            setTimeout(() => setSuccess(null), 3000);
          } catch (err: any) {
            setError(err.message);
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return t.activeNow;
    if (diffMins < 60) return `${diffMins}${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours}${t.hoursAgo}`;
    if (diffDays < 7) return `${diffDays}${t.daysAgo}`;
    return date.toLocaleDateString();
  };

  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {sessions.length} {t.activeSession}
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

      {/* Messages */}
      {error && (
        <View style={[styles.messageBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
          <Text style={[styles.messageText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={[styles.messageBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.messageText, { color: colors.primary }]}>{success}</Text>
        </View>
      )}

      {/* Current Session */}
      {currentSession && (
        <View style={[styles.currentSessionCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <View style={styles.sessionRow}>
            <View style={[styles.sessionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.sessionIconText}>{getDeviceIcon(currentSession.deviceType)}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <View style={styles.sessionNameRow}>
                <Text style={[styles.sessionName, { color: colors.primary }]}>{currentSession.deviceName}</Text>
                <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.currentBadgeText}>{t.current}</Text>
                </View>
              </View>
              <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                📍 {currentSession.location} • {t.activeNow}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <View style={styles.otherSessions}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.otherSessions}</Text>
          
          {otherSessions.map((session) => (
            <View 
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.sessionRow}>
                <View style={[styles.sessionIcon, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
                  <Text style={styles.sessionIconText}>{getDeviceIcon(session.deviceType)}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionName, { color: colors.text }]}>{session.deviceName}</Text>
                  <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                    📍 {session.location} • {formatDate(session.lastActivity)}
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

      {/* Empty State */}
      {otherSessions.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noOtherSessions}</Text>
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoIconText}>⚠️</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.warning }]}>{t.securityTip}</Text>
          <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{t.securityTipDesc}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  endAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  endAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 13,
  },
  currentSessionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIconText: {
    fontSize: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  otherSessions: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  endButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  endButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  infoIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontSize: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});
