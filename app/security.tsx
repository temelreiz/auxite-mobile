// app/security.tsx
// Security Settings Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  get2FAStatus,
  getBiometricStatus,
  getSessions,
  getDevices,
  getSecurityLogs,
  enable2FA,
  disable2FA,
  enableBiometric,
  disableBiometric,
  revokeSession,
  revokeAllSessions,
} from '@/services/api';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface Device {
  id: string;
  name: string;
  type: string;
  lastUsed: string;
  trusted: boolean;
}

interface SecurityLog {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  success: boolean;
}

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { theme, walletAddress, isConnected } = useStore();
  
  const { t } = useTranslation('security');
  const { t: commonT } = useTranslation('common');

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    danger: '#ef4444',
  };

  useEffect(() => {
    fetchSecurityData();
  }, [walletAddress]);

  const fetchSecurityData = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      const [twoFA, biometric, sessionsData, devicesData, logsData] = await Promise.all([
        get2FAStatus(walletAddress),
        getBiometricStatus(walletAddress),
        getSessions(walletAddress),
        getDevices(walletAddress),
        getSecurityLogs(walletAddress),
      ]);

      setTwoFactorEnabled(twoFA.enabled);
      setBiometricEnabled(biometric.enabled);
      setSessions(sessionsData);
      setDevices(devicesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (value: boolean) => {
    try {
      if (value) {
        const result = await enable2FA(walletAddress, 'authenticator');
        if (result.success) {
          setTwoFactorEnabled(true);
          Alert.alert(commonT.success, t.enable2FASuccess);
        }
      } else {
        Alert.prompt(t.twoFactor, t.disable2FAPrompt, async (code) => {
          if (code) {
            const result = await disable2FA(walletAddress, code);
            if (result.success) {
              setTwoFactorEnabled(false);
            }
          }
        });
      }
    } catch (error) {
      Alert.alert(commonT.error, t.failedToUpdate);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        const result = await enableBiometric(walletAddress);
        if (result.success) {
          setBiometricEnabled(true);
        }
      } else {
        const result = await disableBiometric(walletAddress);
        if (result.success) {
          setBiometricEnabled(false);
        }
      }
    } catch (error) {
      Alert.alert(commonT.error, t.failedToUpdate);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert(t.sessions, t.revokeSessionConfirm, [
      { text: commonT.cancel, style: 'cancel' },
      {
        text: t.revokeAll,
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeSession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
          } catch (error) {
            Alert.alert(commonT.error, t.failedToRevoke);
          }
        },
      },
    ]);
  };

  const handleRevokeAllSessions = () => {
    Alert.alert(t.revokeAll, t.revokeAllConfirm, [
      { text: commonT.cancel, style: 'cancel' },
      {
        text: t.revokeAll,
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeAllSessions(walletAddress);
            setSessions(sessions.filter(s => s.current));
            Alert.alert(commonT.success, t.revokeAllSuccess);
          } catch (error) {
            Alert.alert(commonT.error, t.failedToRevoke);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{commonT.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.security}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 2FA Section */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.twoFactor}</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{t.twoFactorDesc}</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={twoFactorEnabled ? colors.primary : '#fff'}
            />
          </View>
        </View>

        {/* Biometric Section */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="finger-print" size={20} color="#f59e0b" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.biometric}</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{t.biometricDesc}</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={biometricEnabled ? colors.primary : '#fff'}
            />
          </View>
        </View>

        {/* Active Sessions */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.sessions}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {sessions.map((session, index) => (
            <View
              key={session.id}
              style={[styles.sessionRow, index < sessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="phone-portrait" size={18} color={colors.primary} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDevice, { color: colors.text }]}>{session.device}</Text>
                <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                  {session.location} • {t.lastActive} {formatDate(session.lastActive)}
                </Text>
              </View>
              {session.current ? (
                <View style={[styles.currentBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.currentText, { color: colors.primary }]}>{t.current}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleRevokeSession(session.id)}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {sessions.length > 1 && (
            <TouchableOpacity style={styles.revokeAllButton} onPress={handleRevokeAllSessions}>
              <Text style={[styles.revokeAllText, { color: colors.danger }]}>{t.revokeAll}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Activity Log */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.activityLog}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {logs.slice(0, 5).map((log, index) => (
            <View
              key={log.id}
              style={[styles.logRow, index < Math.min(logs.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <View style={[styles.logIcon, { backgroundColor: log.success ? colors.primary + '20' : colors.danger + '20' }]}>
                <Ionicons
                  name={log.success ? 'checkmark' : 'close'}
                  size={14}
                  color={log.success ? colors.primary : colors.danger}
                />
              </View>
              <View style={styles.logInfo}>
                <Text style={[styles.logAction, { color: colors.text }]}>{log.action}</Text>
                <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                  {log.ip} • {formatDate(log.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  revokeAllButton: {
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  revokeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  logIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 13,
    fontWeight: '500',
  },
  logMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
