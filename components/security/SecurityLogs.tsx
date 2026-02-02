// components/security/SecurityLogs.tsx
// Güvenlik Logları ve Geçmişi
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface SecurityLog {
  event: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  details: Record<string, unknown>;
  timestamp: string;
  relativeTime: string;
}

type FilterType = 'all' | 'info' | 'warning' | 'danger';

const translations = {
  tr: {
    title: 'Güvenlik Geçmişi',
    subtitle: 'Son güvenlik olayları',
    all: 'Tümü',
    info: 'Bilgi',
    warning: 'Uyarı',
    danger: 'Kritik',
    showMore: 'Daha Fazla Göster',
    loading: 'Yükleniyor...',
    noLogs: 'Henüz güvenlik olayı yok',
    eventTypes: 'Olay Türleri:',
  },
  en: {
    title: 'Security History',
    subtitle: 'Recent security events',
    all: 'All',
    info: 'Info',
    warning: 'Warning',
    danger: 'Critical',
    showMore: 'Show More',
    loading: 'Loading...',
    noLogs: 'No security events yet',
    eventTypes: 'Event Types:',
  },
};

export function SecurityLogs() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  useEffect(() => {
    fetchLogs(true);
  }, [walletAddress, filter]);

  const fetchLogs = async (reset = false) => {
    if (!walletAddress) return;
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const severityParam = filter !== 'all' ? `&severity=${filter}` : '';

      const res = await fetch(
        `${API_BASE_URL}/api/security/logs?limit=${limit}&offset=${currentOffset}&lang=${language}${severityParam}`,
        {
          headers: { 'x-wallet-address': walletAddress },
        }
      );

      const data = await res.json();

      if (reset) {
        setLogs(data.logs || []);
      } else {
        setLogs(prev => [...prev, ...(data.logs || [])]);
      }

      setHasMore(data.hasMore);
      setOffset(currentOffset + limit);
    } catch (err) {
      console.error('Security logs fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLogs(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'danger':
        return {
          bg: colors.danger + '10',
          border: colors.danger + '30',
          icon: '🔴',
          textColor: colors.danger,
        };
      case 'warning':
        return {
          bg: colors.warning + '10',
          border: colors.warning + '30',
          icon: '🟡',
          textColor: colors.warning,
        };
      default:
        return {
          bg: colors.surface,
          border: colors.border,
          icon: '🔵',
          textColor: colors.text,
        };
    }
  };

  const getEventIcon = (event: string) => {
    if (event.includes('2FA')) return '🔐';
    if (event.includes('DEVICE')) return '📱';
    if (event.includes('SESSION')) return '🔑';
    if (event.includes('PASSKEY') || event.includes('BIOMETRIC')) return '👆';
    if (event.includes('LOGIN')) return '🚪';
    if (event.includes('SUSPICIOUS') || event.includes('BLOCKED')) return '⚠️';
    if (event.includes('WITHDRAWAL') || event.includes('TRANSACTION')) return '💸';
    return '📋';
  };

  const formatDetails = (details: Record<string, unknown>) => {
    const entries = Object.entries(details);
    if (entries.length === 0) return null;

    return entries.map(([key, value]) => {
      // Mask IP
      if (key === 'ip' && typeof value === 'string') {
        const parts = value.split('.');
        if (parts.length === 4) {
          value = `${parts[0]}.${parts[1]}.***.***`;
        }
      }

      return (
        <View key={key} style={[styles.detailTag, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
          <Text style={[styles.detailKey, { color: colors.textSecondary }]}>{key}:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{String(value)}</Text>
        </View>
      );
    });
  };

  const filters: { id: FilterType; label: string; icon?: string }[] = [
    { id: 'all', label: t.all },
    { id: 'info', icon: 'ℹ️' },
    { id: 'warning', icon: '⚠️' },
    { id: 'danger', icon: '🔴' },
  ];

  if (loading && logs.length === 0) {
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
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>

        {/* Filter */}
        <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterButton,
                filter === f.id && { backgroundColor: isDark ? '#334155' : '#e2e8f0' },
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f.id ? colors.text : colors.textSecondary }
              ]}>
                {f.icon || f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logs List */}
      {logs.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noLogs}</Text>
        </View>
      ) : (
        <View style={styles.logsList}>
          {logs.map((log, index) => {
            const styles_severity = getSeverityStyles(log.severity);

            return (
              <View
                key={`${log.timestamp}-${index}`}
                style={[
                  styles.logCard,
                  {
                    backgroundColor: styles_severity.bg,
                    borderColor: styles_severity.border,
                  },
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={styles.eventIcon}>{getEventIcon(log.event)}</Text>
                  <View style={styles.logContent}>
                    <View style={styles.logTitleRow}>
                      <Text style={[styles.logTitle, { color: styles_severity.textColor }]}>
                        {log.description}
                      </Text>
                      <Text style={styles.severityIcon}>{styles_severity.icon}</Text>
                    </View>

                    {/* Details */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <View style={styles.detailsContainer}>
                        {formatDetails(log.details)}
                      </View>
                    )}

                    {/* Time */}
                    <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                      {log.relativeTime} • {new Date(log.timestamp).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Load More */}
      {hasMore && (
        <TouchableOpacity
          style={[styles.loadMoreButton, { backgroundColor: colors.surface }]}
          onPress={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.loadMoreText, { color: colors.text }]}>{t.showMore}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.surface }]}>
        <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>{t.eventTypes}</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <Text style={{ color: colors.info }}>🔵</Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.info}</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={{ color: colors.warning }}>🟡</Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.warning}</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={{ color: colors.danger }}>🔴</Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.danger}</Text>
          </View>
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
    alignItems: 'flex-start',
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
  filterContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
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
  logsList: {
    gap: 8,
  },
  logCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  eventIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  logContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  severityIcon: {
    fontSize: 14,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  detailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  detailKey: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  logTime: {
    fontSize: 11,
    marginTop: 8,
  },
  loadMoreButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 11,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
  },
});
