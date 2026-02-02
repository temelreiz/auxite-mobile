// components/security/MultiSigSettings.tsx
// Çoklu İmza (Multi-Sig) Ayarları
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
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface Signer {
  id: string;
  walletAddress: string;
  name: string;
  email?: string;
  role: 'owner' | 'approver' | 'viewer';
  addedAt: string;
}

interface PendingTransaction {
  id: string;
  type: string;
  amount?: number;
  token?: string;
  toAddress?: string;
  approvals: { walletAddress: string; timestamp: string }[];
  rejections: { walletAddress: string; reason?: string }[];
  requiredApprovals: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface MultiSigConfig {
  enabled: boolean;
  requiredApprovals: number;
  totalSigners: number;
  signers: Signer[];
  thresholdAmount: number;
}

const translations = {
  tr: {
    title: 'Çoklu İmza (Multi-Sig)',
    subtitle: 'Büyük işlemler için çoklu onay sistemi',
    enabled: 'Multi-Sig Aktif',
    disabled: 'Multi-Sig Kapalı',
    signers: 'Onaylayıcılar',
    addSigner: 'Onaylayıcı Ekle',
    removeSigner: 'Kaldır',
    pendingTx: 'Bekleyen İşlemler',
    noPending: 'Bekleyen işlem yok',
    approve: 'Onayla',
    reject: 'Reddet',
    threshold: 'Eşik Miktarı',
    thresholdDesc: 'Bu miktarın üzerindeki işlemler çoklu onay gerektirir',
    requiredApprovals: 'Gerekli Onay',
    owner: 'Sahip',
    approver: 'Onaylayıcı',
    viewer: 'İzleyici',
    approved: 'Onaylandı',
    name: 'İsim',
    address: 'Cüzdan Adresi',
    email: 'Email (opsiyonel)',
    role: 'Rol',
    save: 'Kaydet',
    cancel: 'İptal',
    expiresIn: 'Süre:',
    noSigners: 'Henüz onaylayıcı eklenmemiş',
    confirmRemove: 'Bu onaylayıcı kaldırılsın mı?',
  },
  en: {
    title: 'Multi-Signature',
    subtitle: 'Multi-approval system for large transactions',
    enabled: 'Multi-Sig Active',
    disabled: 'Multi-Sig Disabled',
    signers: 'Signers',
    addSigner: 'Add Signer',
    removeSigner: 'Remove',
    pendingTx: 'Pending Transactions',
    noPending: 'No pending transactions',
    approve: 'Approve',
    reject: 'Reject',
    threshold: 'Threshold Amount',
    thresholdDesc: 'Transactions above this amount require multi-approval',
    requiredApprovals: 'Required Approvals',
    owner: 'Owner',
    approver: 'Approver',
    viewer: 'Viewer',
    approved: 'Approved',
    name: 'Name',
    address: 'Wallet Address',
    email: 'Email (optional)',
    role: 'Role',
    save: 'Save',
    cancel: 'Cancel',
    expiresIn: 'Expires:',
    noSigners: 'No signers added yet',
    confirmRemove: 'Remove this signer?',
  },
};

export function MultiSigSettings() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [config, setConfig] = useState<MultiSigConfig | null>(null);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [newSigner, setNewSigner] = useState({ name: '', address: '', email: '', role: 'approver' });

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
      const res = await fetch(`${API_BASE_URL}/api/security/multisig`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setConfig(data.config);
      setPending(data.pendingTransactions || []);
    } catch (error) {
      console.error('MultiSig fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/multisig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: config?.enabled ? 'disable' : 'enable',
          requiredApprovals: 2,
          thresholdAmount: 10000,
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

  const handleAddSigner = async () => {
    if (!newSigner.name || !newSigner.address) return;

    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/security/multisig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'add_signer',
          signerAddress: newSigner.address,
          name: newSigner.name,
          email: newSigner.email,
          role: newSigner.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddSigner(false);
        setNewSigner({ name: '', address: '', email: '', role: 'approver' });
        fetchData();
      }
    } catch (error) {
      console.error('Add signer error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveSigner = (signerId: string) => {
    Alert.alert('', t.confirmRemove, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.removeSigner,
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/security/multisig`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-wallet-address': walletAddress,
              },
              body: JSON.stringify({
                action: 'remove_signer',
                signerId,
              }),
            });
            const data = await res.json();
            if (data.success) {
              fetchData();
            }
          } catch (error) {
            console.error('Remove signer error:', error);
          }
        },
      },
    ]);
  };

  const handleApprove = async (txId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/multisig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'approve',
          transactionId: txId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (txId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/multisig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'reject',
          transactionId: txId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return t.owner;
      case 'approver': return t.approver;
      case 'viewer': return t.viewer;
      default: return role;
    }
  };

  const formatExpiry = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return '0h';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: config?.enabled ? colors.primary + '20' : colors.surface }
          ]}
          onPress={handleToggle}
          disabled={processing}
        >
          <Text style={[
            styles.toggleButtonText,
            { color: config?.enabled ? colors.primary : colors.textSecondary }
          ]}>
            {config?.enabled ? t.enabled : t.disabled}
          </Text>
        </TouchableOpacity>
      </View>

      {config?.enabled && (
        <>
          {/* Threshold */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.thresholdRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t.threshold}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.thresholdDesc}</Text>
              </View>
              <View style={styles.thresholdValue}>
                <Text style={[styles.thresholdAmount, { color: colors.warning }]}>
                  ${config.thresholdAmount.toLocaleString()}
                </Text>
                <Text style={[styles.thresholdApprovals, { color: colors.textSecondary }]}>
                  {t.requiredApprovals}: {config.requiredApprovals}/{config.totalSigners || config.signers.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Signers */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t.signers}</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
                onPress={() => setShowAddSigner(true)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>{t.addSigner}</Text>
              </TouchableOpacity>
            </View>

            {config.signers.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noSigners}</Text>
            ) : (
              <View style={styles.signersList}>
                {config.signers.map((signer) => (
                  <View 
                    key={signer.id} 
                    style={[styles.signerCard, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}
                  >
                    <View style={styles.signerInfo}>
                      <View style={[
                        styles.signerAvatar, 
                        { backgroundColor: signer.role === 'owner' ? colors.warning + '20' : colors.surface }
                      ]}>
                        <Text style={[
                          styles.signerAvatarText,
                          { color: signer.role === 'owner' ? colors.warning : colors.textSecondary }
                        ]}>
                          {signer.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.signerName, { color: colors.text }]}>{signer.name}</Text>
                        <Text style={[styles.signerAddress, { color: colors.textSecondary }]}>
                          {signer.walletAddress.slice(0, 10)}...{signer.walletAddress.slice(-6)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.signerActions}>
                      <View style={[
                        styles.roleBadge, 
                        { backgroundColor: signer.role === 'owner' ? colors.warning + '20' : colors.surface }
                      ]}>
                        <Text style={[
                          styles.roleBadgeText,
                          { color: signer.role === 'owner' ? colors.warning : colors.textSecondary }
                        ]}>
                          {getRoleLabel(signer.role)}
                        </Text>
                      </View>
                      {signer.role !== 'owner' && (
                        <TouchableOpacity onPress={() => handleRemoveSigner(signer.id)}>
                          <Text style={[styles.removeText, { color: colors.danger }]}>{t.removeSigner}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Pending Transactions */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.pendingTx}</Text>

            {pending.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noPending}</Text>
            ) : (
              <View style={styles.pendingList}>
                {pending.map((tx) => (
                  <View 
                    key={tx.id} 
                    style={[styles.pendingCard, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0', borderColor: colors.border }]}
                  >
                    <View style={styles.pendingHeader}>
                      <View>
                        <Text style={[styles.pendingAmount, { color: colors.text }]}>
                          {tx.amount} {tx.token} → {tx.toAddress?.slice(0, 10)}...
                        </Text>
                        <Text style={[styles.pendingExpiry, { color: colors.textSecondary }]}>
                          {t.expiresIn} {formatExpiry(tx.expiresAt)}
                        </Text>
                      </View>
                      <Text style={[styles.pendingApprovals, { color: colors.primary }]}>
                        {tx.approvals.length}/{tx.requiredApprovals} {t.approved}
                      </Text>
                    </View>

                    {tx.status === 'pending' && (
                      <View style={styles.pendingActions}>
                        <TouchableOpacity
                          style={[styles.approveButton, { backgroundColor: colors.primary + '20' }]}
                          onPress={() => handleApprove(tx.id)}
                        >
                          <Text style={[styles.approveButtonText, { color: colors.primary }]}>{t.approve}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.rejectButton, { backgroundColor: colors.danger + '20' }]}
                          onPress={() => handleReject(tx.id)}
                        >
                          <Text style={[styles.rejectButtonText, { color: colors.danger }]}>{t.reject}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* Add Signer Modal */}
      <Modal visible={showAddSigner} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.addSigner}</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.name}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newSigner.name}
                onChangeText={(text) => setNewSigner({ ...newSigner, name: text })}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.address}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newSigner.address}
                onChangeText={(text) => setNewSigner({ ...newSigner, address: text })}
                placeholder="0x..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.email}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={newSigner.email}
                onChangeText={(text) => setNewSigner({ ...newSigner, email: text })}
                keyboardType="email-address"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.role}</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Picker
                  selectedValue={newSigner.role}
                  onValueChange={(value) => setNewSigner({ ...newSigner, role: value })}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label={t.approver} value="approver" />
                  <Picker.Item label={t.viewer} value="viewer" />
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowAddSigner(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!newSigner.name || !newSigner.address) ? 0.5 : 1 }]}
                onPress={handleAddSigner}
                disabled={!newSigner.name || !newSigner.address || processing}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
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
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdValue: {
    alignItems: 'flex-end',
  },
  thresholdAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  thresholdApprovals: {
    fontSize: 12,
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
  signersList: {
    gap: 8,
  },
  signerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  signerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signerAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  signerAddress: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  signerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  removeText: {
    fontSize: 11,
  },
  pendingList: {
    gap: 8,
    marginTop: 8,
  },
  pendingCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pendingAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  pendingExpiry: {
    fontSize: 11,
    marginTop: 4,
  },
  pendingApprovals: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
