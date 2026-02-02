// components/security/TransactionLimitsSettings.tsx
// İşlem Limitleri Ayarları
// TR/EN | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface LimitConfig {
  enabled: boolean;
  amount: number;
  used: number;
  resetAt?: string;
}

interface TransactionLimits {
  enabled: boolean;
  daily: LimitConfig;
  weekly: LimitConfig;
  monthly: LimitConfig;
  perTransaction: LimitConfig;
  whitelistedAddresses: string[];
}

const translations = {
  tr: {
    title: 'İşlem Limitleri',
    subtitle: 'Günlük, haftalık ve aylık çekim limitleri',
    enabled: 'Limitler Aktif',
    disabled: 'Limitler Kapalı',
    daily: 'Günlük Limit',
    weekly: 'Haftalık Limit',
    monthly: 'Aylık Limit',
    perTx: 'İşlem Başına',
    used: 'Kullanılan',
    remaining: 'Kalan',
    resetIn: 'Sıfırlanma',
    whitelist: 'Güvenilir Adresler',
    whitelistDesc: 'Bu adreslere gönderimde limit uygulanmaz',
    addAddress: 'Adres Ekle',
    remove: 'Kaldır',
    noWhitelist: 'Güvenilir adres eklenmemiş',
    edit: 'Düzenle',
    save: 'Kaydet',
    cancel: 'İptal',
    hours: 'saat',
    days: 'gün',
    multiSigRequired: 'Üstü çoklu onay gerektirir',
  },
  en: {
    title: 'Transaction Limits',
    subtitle: 'Daily, weekly and monthly withdrawal limits',
    enabled: 'Limits Active',
    disabled: 'Limits Disabled',
    daily: 'Daily Limit',
    weekly: 'Weekly Limit',
    monthly: 'Monthly Limit',
    perTx: 'Per Transaction',
    used: 'Used',
    remaining: 'Remaining',
    resetIn: 'Resets in',
    whitelist: 'Trusted Addresses',
    whitelistDesc: 'No limits apply when sending to these addresses',
    addAddress: 'Add Address',
    remove: 'Remove',
    noWhitelist: 'No trusted addresses added',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    hours: 'hours',
    days: 'days',
    multiSigRequired: 'Above requires multi-approval',
  },
};

export function TransactionLimitsSettings() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [limits, setLimits] = useState<TransactionLimits | null>(null);
  const [usage, setUsage] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [nextReset, setNextReset] = useState({ daily: '', weekly: '', monthly: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({ daily: 0, weekly: 0, monthly: 0, perTransaction: 0 });
  const [newAddress, setNewAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [processing, setProcessing] = useState(false);

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
    fetchData();
  }, [walletAddress]);

  const fetchData = async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/security/limits`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setLimits(data.limits);
      setUsage(data.usage);
      setNextReset(data.nextReset);
      setEditValues({
        daily: data.limits.daily.amount,
        weekly: data.limits.weekly.amount,
        monthly: data.limits.monthly.amount,
        perTransaction: data.limits.perTransaction.amount,
      });
    } catch (error) {
      console.error('Limits fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'toggle',
          type: 'all',
          enabled: !limits?.enabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'update_limits',
          ...editValues,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(false);
        fetchData();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddWhitelist = async () => {
    if (!newAddress) return;

    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'add_whitelist',
          address: newAddress,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAddress('');
        setShowAddAddress(false);
        fetchData();
      }
    } catch (error) {
      console.error('Add whitelist error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveWhitelist = async (address: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/limits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'remove_whitelist',
          address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Remove whitelist error:', error);
    }
  };

  const formatResetTime = (isoDate: string) => {
    if (!isoDate) return '-';
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return '0h';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}${t.hours}`;
    const days = Math.floor(hours / 24);
    return `${days}${t.days}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return colors.danger;
    if (percentage >= 70) return colors.warning;
    return colors.primary;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderLimitCard = (
    label: string,
    limit: number,
    used: number,
    percentage: number,
    resetTime: string,
    editKey: 'daily' | 'weekly' | 'monthly'
  ) => {
    const remaining = limit - used;

    return (
      <View style={[styles.limitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.limitHeader}>
          <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.limitReset, { color: colors.textSecondary }]}>
            {t.resetIn} {formatResetTime(resetTime)}
          </Text>
        </View>

        {editing ? (
          <TextInput
            style={[styles.limitInput, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0', borderColor: colors.border, color: colors.text }]}
            value={String(editValues[editKey])}
            onChangeText={(text) => setEditValues({ ...editValues, [editKey]: Number(text) || 0 })}
            keyboardType="numeric"
          />
        ) : (
          <Text style={[styles.limitAmount, { color: colors.text }]}>
            ${limit.toLocaleString()}
          </Text>
        )}

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getProgressColor(percentage),
              }
            ]} 
          />
        </View>

        <View style={styles.limitStats}>
          <Text style={[styles.limitStatText, { color: colors.textSecondary }]}>
            {t.used}: ${used.toLocaleString()}
          </Text>
          <Text style={[styles.limitStatText, { color: colors.primary }]}>
            {t.remaining}: ${remaining.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: limits?.enabled ? colors.primary + '20' : colors.surface }
          ]}
          onPress={handleToggle}
          disabled={processing}
        >
          <Text style={[
            styles.toggleButtonText,
            { color: limits?.enabled ? colors.primary : colors.textSecondary }
          ]}>
            {limits?.enabled ? t.enabled : t.disabled}
          </Text>
        </TouchableOpacity>
      </View>

      {limits?.enabled && (
        <>
          {/* Limit Cards Grid */}
          <View style={styles.limitsGrid}>
            {renderLimitCard(t.daily, limits.daily.amount, limits.daily.used, usage.daily, nextReset.daily, 'daily')}
            {renderLimitCard(t.weekly, limits.weekly.amount, limits.weekly.used, usage.weekly, nextReset.weekly, 'weekly')}
            {renderLimitCard(t.monthly, limits.monthly.amount, limits.monthly.used, usage.monthly, nextReset.monthly, 'monthly')}
            
            {/* Per Transaction */}
            <View style={[styles.limitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.limitHeader}>
                <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>{t.perTx}</Text>
                <Text style={[styles.multiSigBadge, { color: colors.warning }]}>Multi-sig</Text>
              </View>
              {editing ? (
                <TextInput
                  style={[styles.limitInput, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0', borderColor: colors.border, color: colors.text }]}
                  value={String(editValues.perTransaction)}
                  onChangeText={(text) => setEditValues({ ...editValues, perTransaction: Number(text) || 0 })}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.limitAmount, { color: colors.text }]}>
                  ${limits.perTransaction.amount.toLocaleString()}
                </Text>
              )}
              <Text style={[styles.multiSigNote, { color: colors.textSecondary }]}>{t.multiSigRequired}</Text>
            </View>
          </View>

          {/* Edit/Save Button */}
          <View style={styles.editActions}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  disabled={processing}
                >
                  <Text style={styles.saveButtonText}>{t.save}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.surface }]}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                <Text style={[styles.editButtonText, { color: colors.text }]}>{t.edit}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Whitelist */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t.whitelist}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.whitelistDesc}</Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
                onPress={() => setShowAddAddress(true)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>{t.addAddress}</Text>
              </TouchableOpacity>
            </View>

            {limits.whitelistedAddresses.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noWhitelist}</Text>
            ) : (
              <View style={styles.addressList}>
                {limits.whitelistedAddresses.map((address, i) => (
                  <View 
                    key={i} 
                    style={[styles.addressItem, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}
                  >
                    <Text style={[styles.addressText, { color: colors.text }]}>
                      {address.slice(0, 10)}...{address.slice(-8)}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveWhitelist(address)}>
                      <Text style={[styles.removeText, { color: colors.danger }]}>{t.remove}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* Add Address Modal */}
      <Modal visible={showAddAddress} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.addAddress}</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="0x..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowAddAddress(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: colors.primary, opacity: !newAddress ? 0.5 : 1 }]}
                onPress={handleAddWhitelist}
                disabled={!newAddress || processing}
              >
                <Text style={styles.modalSaveText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  limitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  limitCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 12,
  },
  limitReset: {
    fontSize: 10,
  },
  limitAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  limitInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  limitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  limitStatText: {
    fontSize: 10,
  },
  multiSigBadge: {
    fontSize: 10,
    fontWeight: '500',
  },
  multiSigNote: {
    fontSize: 10,
    marginTop: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 11,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
  },
  addressText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  removeText: {
    fontSize: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
