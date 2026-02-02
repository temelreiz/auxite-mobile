// components/security/EmergencySettings.tsx
// Acil Durum Ayarları
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
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface TrustedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  canUnfreeze: boolean;
  canRecover: boolean;
}

interface EmergencyConfig {
  frozen: boolean;
  frozenAt?: string;
  frozenReason?: string;
  panicMode: boolean;
  trustedContacts: TrustedContact[];
  cooldownPeriod: number;
  securityLevel: 'standard' | 'high' | 'maximum';
}

const translations = {
  tr: {
    title: 'Acil Durum Ayarları',
    subtitle: 'Hesap güvenliği ve acil durum kontrolleri',
    accountStatus: 'Hesap Durumu',
    active: 'Aktif',
    frozen: 'Dondurulmuş',
    panic: 'ACİL DURUM',
    freezeAccount: 'Hesabı Dondur',
    unfreezeAccount: 'Hesabı Aç',
    freezeDesc: 'Tüm işlemler geçici olarak durdurulur',
    panicButton: '🚨 PANIC BUTONU',
    panicDesc: 'Tüm işlemleri anında durdur ve güvenlik önlemlerini aktifleştir',
    activatePanic: 'Panic Mode Aktif Et',
    deactivatePanic: 'Panic Mode Kapat',
    panicWarning: 'Bu işlem tüm çekimleri ve transferleri anında durdurur!',
    trustedContacts: 'Güvenilir Kişiler',
    trustedDesc: 'Hesap kurtarma için yetkilendirilen kişiler',
    addContact: 'Kişi Ekle',
    removeContact: 'Kaldır',
    noContacts: 'Güvenilir kişi eklenmemiş',
    canUnfreeze: 'Hesabı açabilir',
    canRecover: 'Hesabı kurtarabilir',
    securityLevel: 'Güvenlik Seviyesi',
    standard: 'Standart',
    high: 'Yüksek',
    maximum: 'Maksimum',
    name: 'İsim',
    email: 'Email',
    phone: 'Telefon',
    save: 'Kaydet',
    cancel: 'İptal',
    confirm: 'Onayla',
    freezeReason: 'Dondurma Sebebi',
    frozenSince: 'Dondurulma Zamanı',
  },
  en: {
    title: 'Emergency Settings',
    subtitle: 'Account security and emergency controls',
    accountStatus: 'Account Status',
    active: 'Active',
    frozen: 'Frozen',
    panic: 'EMERGENCY',
    freezeAccount: 'Freeze Account',
    unfreezeAccount: 'Unfreeze Account',
    freezeDesc: 'All transactions will be temporarily suspended',
    panicButton: '🚨 PANIC BUTTON',
    panicDesc: 'Instantly stop all transactions and activate security measures',
    activatePanic: 'Activate Panic Mode',
    deactivatePanic: 'Deactivate Panic Mode',
    panicWarning: 'This will immediately stop all withdrawals and transfers!',
    trustedContacts: 'Trusted Contacts',
    trustedDesc: 'People authorized for account recovery',
    addContact: 'Add Contact',
    removeContact: 'Remove',
    noContacts: 'No trusted contacts added',
    canUnfreeze: 'Can unfreeze',
    canRecover: 'Can recover',
    securityLevel: 'Security Level',
    standard: 'Standard',
    high: 'High',
    maximum: 'Maximum',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    freezeReason: 'Freeze Reason',
    frozenSince: 'Frozen Since',
  },
};

export function EmergencySettings() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [config, setConfig] = useState<EmergencyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showPanic, setShowPanic] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    canUnfreeze: false,
    canRecover: true,
  });

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
      const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Emergency fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'freeze',
          reason: freezeReason || 'Manuel dondurma',
          notifyContacts: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowFreeze(false);
        setFreezeReason('');
        fetchData();
      }
    } catch (error) {
      console.error('Freeze error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfreeze = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ action: 'unfreeze' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      console.error('Unfreeze error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePanic = async (activate: boolean) => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'panic',
          activate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPanic(false);
        fetchData();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      console.error('Panic error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name) return;

    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'add_contact',
          ...newContact,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddContact(false);
        setNewContact({ name: '', email: '', phone: '', canUnfreeze: false, canRecover: true });
        fetchData();
      }
    } catch (error) {
      console.error('Add contact error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveContact = (contactId: string) => {
    Alert.alert('', language === 'tr' ? 'Bu kişi kaldırılsın mı?' : 'Remove this contact?', [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.removeContact,
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-wallet-address': walletAddress,
              },
              body: JSON.stringify({
                action: 'remove_contact',
                contactId,
              }),
            });
            const data = await res.json();
            if (data.success) {
              fetchData();
            }
          } catch (error) {
            console.error('Remove contact error:', error);
          }
        },
      },
    ]);
  };

  const handleSecurityLevel = async (level: 'standard' | 'high' | 'maximum') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'set_security_level',
          level,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Security level error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Account Status */}
      <View style={[
        styles.statusCard, 
        { 
          backgroundColor: config?.frozen ? colors.warning + '10' : config?.panicMode ? colors.danger + '10' : colors.primary + '10',
          borderColor: config?.frozen ? colors.warning + '30' : config?.panicMode ? colors.danger + '30' : colors.primary + '30',
        }
      ]}>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>{t.accountStatus}</Text>
            <Text style={[
              styles.statusValue, 
              { 
                color: config?.frozen ? colors.warning : config?.panicMode ? colors.danger : colors.primary 
              }
            ]}>
              {config?.panicMode ? t.panic : config?.frozen ? t.frozen : t.active}
            </Text>
          </View>
          <Text style={styles.statusIcon}>
            {config?.panicMode ? '🚨' : config?.frozen ? '❄️' : '✅'}
          </Text>
        </View>

        {config?.frozen && (
          <View style={styles.frozenInfo}>
            {config.frozenReason && (
              <Text style={[styles.frozenReason, { color: colors.textSecondary }]}>
                {t.freezeReason}: {config.frozenReason}
              </Text>
            )}
            {config.frozenAt && (
              <Text style={[styles.frozenDate, { color: colors.textSecondary }]}>
                {t.frozenSince}: {new Date(config.frozenAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        <View style={styles.statusActions}>
          {config?.frozen ? (
            <TouchableOpacity
              style={[styles.unfreezeButton, { backgroundColor: colors.primary }]}
              onPress={handleUnfreeze}
              disabled={processing}
            >
              <Text style={styles.unfreezeButtonText}>{t.unfreezeAccount}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.freezeButton, { backgroundColor: colors.warning + '20' }]}
              onPress={() => setShowFreeze(true)}
            >
              <Ionicons name="snow" size={16} color={colors.warning} />
              <Text style={[styles.freezeButtonText, { color: colors.warning }]}>{t.freezeAccount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Panic Button */}
      <TouchableOpacity
        style={[styles.panicCard, { borderColor: colors.danger + '50' }]}
        onPress={() => setShowPanic(true)}
      >
        <LinearGradient
          colors={config?.panicMode ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.panicGradient}
        >
          <Text style={styles.panicTitle}>{t.panicButton}</Text>
          <Text style={styles.panicDesc}>{t.panicDesc}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Security Level */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t.securityLevel}</Text>
        <View style={styles.securityLevels}>
          {(['standard', 'high', 'maximum'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.levelButton,
                {
                  backgroundColor: config?.securityLevel === level
                    ? level === 'maximum' ? colors.danger + '20'
                    : level === 'high' ? colors.warning + '20'
                    : colors.primary + '20'
                    : colors.surface,
                  borderColor: config?.securityLevel === level
                    ? level === 'maximum' ? colors.danger
                    : level === 'high' ? colors.warning
                    : colors.primary
                    : colors.border,
                }
              ]}
              onPress={() => handleSecurityLevel(level)}
            >
              <Text style={styles.levelIcon}>
                {level === 'standard' ? '🛡️' : level === 'high' ? '🔐' : '🏰'}
              </Text>
              <Text style={[
                styles.levelText,
                {
                  color: config?.securityLevel === level
                    ? level === 'maximum' ? colors.danger
                    : level === 'high' ? colors.warning
                    : colors.primary
                    : colors.textSecondary,
                }
              ]}>
                {level === 'standard' ? t.standard : level === 'high' ? t.high : t.maximum}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trusted Contacts */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.trustedContacts}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.trustedDesc}</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShowAddContact(true)}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>{t.addContact}</Text>
          </TouchableOpacity>
        </View>

        {config?.trustedContacts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noContacts}</Text>
        ) : (
          <View style={styles.contactsList}>
            {config?.trustedContacts.map((contact) => (
              <View 
                key={contact.id} 
                style={[styles.contactCard, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}
              >
                <View style={styles.contactInfo}>
                  <View style={[styles.contactAvatar, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.contactAvatarText, { color: colors.textSecondary }]}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                    <Text style={[styles.contactDetail, { color: colors.textSecondary }]}>
                      {contact.email || contact.phone || '—'}
                    </Text>
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <View style={styles.contactBadges}>
                    {contact.canUnfreeze && (
                      <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.warning }]}>{t.canUnfreeze}</Text>
                      </View>
                    )}
                    {contact.canRecover && (
                      <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>{t.canRecover}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveContact(contact.id)}>
                    <Text style={[styles.removeText, { color: colors.danger }]}>{t.removeContact}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Freeze Modal */}
      <Modal visible={showFreeze} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.freezeAccount}</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{t.freezeDesc}</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={freezeReason}
              onChangeText={setFreezeReason}
              placeholder={t.freezeReason}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowFreeze(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.warning }]}
                onPress={handleFreeze}
                disabled={processing}
              >
                <Text style={styles.modalConfirmText}>{t.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Panic Modal */}
      <Modal visible={showPanic} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.panicModalContent, { backgroundColor: colors.background, borderColor: colors.danger + '50' }]}>
            <Text style={styles.panicModalIcon}>🚨</Text>
            <Text style={[styles.panicModalTitle, { color: colors.text }]}>
              {config?.panicMode ? t.deactivatePanic : t.activatePanic}
            </Text>
            <Text style={[styles.panicModalWarning, { color: colors.danger }]}>{t.panicWarning}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowPanic(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton, 
                  { backgroundColor: config?.panicMode ? colors.primary : colors.danger }
                ]}
                onPress={() => handlePanic(!config?.panicMode)}
                disabled={processing}
              >
                <Text style={styles.modalConfirmText}>{t.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal visible={showAddContact} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.addContact}</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                placeholder={t.name}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newContact.email}
                onChangeText={(text) => setNewContact({ ...newContact, email: text })}
                placeholder={t.email}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                placeholder={t.phone}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t.canUnfreeze}</Text>
              <Switch
                value={newContact.canUnfreeze}
                onValueChange={(value) => setNewContact({ ...newContact, canUnfreeze: value })}
                trackColor={{ false: colors.border, true: colors.warning }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t.canRecover}</Text>
              <Switch
                value={newContact.canRecover}
                onValueChange={(value) => setNewContact({ ...newContact, canRecover: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowAddContact(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.primary, opacity: !newContact.name ? 0.5 : 1 }]}
                onPress={handleAddContact}
                disabled={!newContact.name || processing}
              >
                <Text style={styles.modalConfirmText}>{t.save}</Text>
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
  statusCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {},
  statusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusIcon: {
    fontSize: 32,
  },
  frozenInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100,100,100,0.2)',
  },
  frozenReason: {
    fontSize: 12,
    marginBottom: 4,
  },
  frozenDate: {
    fontSize: 11,
  },
  statusActions: {
    marginTop: 16,
  },
  freezeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  freezeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unfreezeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  unfreezeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  panicCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  panicGradient: {
    padding: 20,
    alignItems: 'center',
  },
  panicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  panicDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
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
  securityLevels: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  levelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
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
  contactsList: {
    gap: 10,
  },
  contactCard: {
    padding: 14,
    borderRadius: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  removeText: {
    fontSize: 12,
  },
  // Modals
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
  panicModalContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  panicModalIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  panicModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  panicModalWarning: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
