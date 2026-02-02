// components/security/DeviceManager.tsx
// Bağlı Cihazlar Yönetimi
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

interface Device {
  id: string;
  fingerprint: string;
  name: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  ip: string;
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
  };
  locationFormatted?: string;
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
  isCurrent: boolean;
}

const translations = {
  tr: {
    title: 'Bağlı Cihazlar',
    subtitle: 'cihaz',
    trusted: 'güvenilir',
    thisDevice: 'Bu cihaz',
    trustedBadge: 'Güvenilir',
    lastSeen: 'Son görülme',
    justNow: 'Şimdi',
    minutesAgo: 'dk önce',
    hoursAgo: 'saat önce',
    daysAgo: 'gün önce',
    trustDevice: 'Güvenilir Yap',
    removeTrust: 'Güveni Kaldır',
    removeDevice: 'Cihazı Sil',
    confirmRemove: 'Bu cihaz silinsin mi?',
    cannotRemoveCurrent: 'Mevcut cihazı silemezsiniz',
    noDevices: 'Henüz kayıtlı cihaz yok',
    trustedDevices: 'Güvenilir Cihazlar',
    trustedDevicesDesc: 'Güvenilir olarak işaretlediğiniz cihazlarda bazı ek güvenlik adımları atlanabilir. Tanımadığınız cihazları derhal silin.',
    unknown: 'Bilinmiyor',
  },
  en: {
    title: 'Connected Devices',
    subtitle: 'device(s)',
    trusted: 'trusted',
    thisDevice: 'This device',
    trustedBadge: 'Trusted',
    lastSeen: 'Last seen',
    justNow: 'Just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    trustDevice: 'Mark Trusted',
    removeTrust: 'Remove Trust',
    removeDevice: 'Remove Device',
    confirmRemove: 'Remove this device?',
    cannotRemoveCurrent: 'Cannot remove current device',
    noDevices: 'No devices registered yet',
    trustedDevices: 'Trusted Devices',
    trustedDevicesDesc: 'Devices marked as trusted may skip some security steps. Remove any devices you don\'t recognize immediately.',
    unknown: 'Unknown',
  },
};

export function DeviceManager() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    fetchDevices();
  }, [walletAddress]);

  const fetchDevices = async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/security/devices`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Devices fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const toggleTrust = async (deviceId: string, trusted: boolean) => {
    try {
      setProcessing(deviceId);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/security/devices/trust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ deviceId, trusted }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchDevices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const removeDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device?.isCurrent) {
      Alert.alert('', t.cannotRemoveCurrent);
      return;
    }

    Alert.alert('', t.confirmRemove, [
      { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
      {
        text: language === 'tr' ? 'Sil' : 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessing(deviceId);
            setError(null);

            const res = await fetch(`${API_BASE_URL}/api/security/devices?deviceId=${deviceId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error);
            }

            fetchDevices();
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

  const getOSIcon = (os: string) => {
    const osLower = os.toLowerCase();
    if (osLower.includes('windows')) return '🪟';
    if (osLower.includes('mac') || osLower.includes('ios')) return '🍎';
    if (osLower.includes('android')) return '🤖';
    if (osLower.includes('linux')) return '🐧';
    return '💻';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return t.justNow;
    if (diffMins < 60) return `${diffMins}${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours}${t.hoursAgo}`;
    if (diffDays < 7) return `${diffDays}${t.daysAgo}`;
    return date.toLocaleDateString();
  };

  const trustedCount = devices.filter(d => d.trusted).length;

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
            {devices.length} {t.subtitle} • {trustedCount} {t.trusted}
          </Text>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {/* Devices List */}
      {devices.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noDevices}</Text>
        </View>
      ) : (
        <View style={styles.devicesList}>
          {devices.map((device) => (
            <View 
              key={device.id}
              style={[
                styles.deviceCard, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: device.isCurrent 
                    ? colors.primary + '50' 
                    : device.trusted 
                    ? '#3b82f630' 
                    : colors.border 
                }
              ]}
            >
              <View style={styles.deviceHeader}>
                <View style={[
                  styles.deviceIcon, 
                  { 
                    backgroundColor: device.isCurrent 
                      ? colors.primary + '20' 
                      : device.trusted 
                      ? '#3b82f620' 
                      : isDark ? '#0f172a' : '#e2e8f0' 
                  }
                ]}>
                  <Text style={styles.deviceIconText}>{getDeviceIcon(device.deviceType)}</Text>
                </View>
                
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceNameRow}>
                    <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                    {device.isCurrent && (
                      <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>{t.thisDevice}</Text>
                      </View>
                    )}
                    {device.trusted && !device.isCurrent && (
                      <View style={[styles.badge, { backgroundColor: '#3b82f620' }]}>
                        <Text style={[styles.badgeText, { color: '#3b82f6' }]}>{t.trustedBadge}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.deviceMeta}>
                    <Text style={[styles.deviceMetaText, { color: colors.textSecondary }]}>
                      {getOSIcon(device.os)} {device.os}
                    </Text>
                    <Text style={[styles.deviceMetaText, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.deviceMetaText, { color: colors.textSecondary }]}>{device.browser}</Text>
                  </View>
                  
                  <View style={styles.deviceMeta}>
                    <Text style={[styles.deviceMetaText, { color: colors.textSecondary }]}>
                      📍 {device.locationFormatted || t.unknown}
                    </Text>
                    <Text style={[styles.deviceMetaText, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.deviceMetaText, { color: colors.textSecondary }]}>
                      {t.lastSeen}: {formatDate(device.lastSeen)}
                    </Text>
                  </View>

                  <Text style={[styles.ipText, { color: colors.textSecondary }]}>
                    IP: {device.ip.split('.').slice(0, 2).join('.')}.***.***
                  </Text>
                </View>
              </View>

              {/* Actions */}
              {!device.isCurrent && (
                <View style={styles.deviceActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      { backgroundColor: device.trusted ? colors.surface : '#3b82f620' }
                    ]}
                    onPress={() => toggleTrust(device.id, !device.trusted)}
                    disabled={processing === device.id}
                  >
                    {processing === device.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons 
                          name={device.trusted ? 'shield-outline' : 'shield-checkmark'} 
                          size={16} 
                          color={device.trusted ? colors.textSecondary : '#3b82f6'} 
                        />
                        <Text style={[
                          styles.actionButtonText, 
                          { color: device.trusted ? colors.textSecondary : '#3b82f6' }
                        ]}>
                          {device.trusted ? t.removeTrust : t.trustDevice}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
                    onPress={() => removeDevice(device.id)}
                    disabled={processing === device.id}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.actionButtonText, { color: colors.danger }]}>{t.removeDevice}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: '#3b82f610', borderColor: '#3b82f630' }]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoIconText}>ℹ️</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: '#3b82f6' }]}>{t.trustedDevices}</Text>
          <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{t.trustedDevicesDesc}</Text>
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
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  deviceMetaText: {
    fontSize: 11,
  },
  ipText: {
    fontSize: 10,
    marginTop: 4,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100,100,100,0.2)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
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
