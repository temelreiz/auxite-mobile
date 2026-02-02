// app/whitelist.tsx
// Withdrawal Whitelist Manager Screen
// 6-Language Support | Dark/Light Mode | 24h Verification

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
  TextInput,
  Modal,
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
    title: 'Güvenli Çekim Adresleri',
    subtitle: 'Yeni adresler 24 saat sonra aktif olur',
    addNew: 'Yeni Adres Ekle',
    address: 'Adres',
    label: 'Etiket',
    network: 'Ağ',
    add: 'Ekle',
    cancel: 'İptal',
    delete: 'Sil',
    verified: 'Doğrulandı',
    pending: 'Beklemede',
    noAddresses: 'Henüz güvenli adres eklenmemiş',
    noAddressesDesc: 'Güvenli çekim için adres ekleyin',
    verifyIn: 'Doğrulama:',
    addressRequired: 'Adres ve ağ gerekli',
    confirmDelete: 'Bu adresi silmek istediğinize emin misiniz?',
    labelPlaceholder: 'Örn: Binance Cüzdanı',
    addressPlaceholder: '0x... / bc1... / r...',
    success: 'Adres eklendi! 24 saat sonra aktif olacak.',
    error: 'Hata',
    back: 'Geri',
  },
  en: {
    title: 'Withdrawal Whitelist',
    subtitle: 'New addresses become active after 24 hours',
    addNew: 'Add New Address',
    address: 'Address',
    label: 'Label',
    network: 'Network',
    add: 'Add',
    cancel: 'Cancel',
    delete: 'Delete',
    verified: 'Verified',
    pending: 'Pending',
    noAddresses: 'No whitelist addresses yet',
    noAddressesDesc: 'Add addresses for secure withdrawals',
    verifyIn: 'Verifies in:',
    addressRequired: 'Address and network required',
    confirmDelete: 'Are you sure you want to remove this address?',
    labelPlaceholder: 'e.g. Binance Wallet',
    addressPlaceholder: '0x... / bc1... / r...',
    success: 'Address added! Will be active in 24 hours.',
    error: 'Error',
    back: 'Back',
  },
  de: {
    title: 'Auszahlungs-Whitelist',
    subtitle: 'Neue Adressen werden nach 24 Stunden aktiv',
    addNew: 'Neue Adresse hinzufügen',
    address: 'Adresse',
    label: 'Bezeichnung',
    network: 'Netzwerk',
    add: 'Hinzufügen',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    verified: 'Verifiziert',
    pending: 'Ausstehend',
    noAddresses: 'Noch keine Whitelist-Adressen',
    noAddressesDesc: 'Adressen für sichere Auszahlungen hinzufügen',
    verifyIn: 'Verifizierung in:',
    addressRequired: 'Adresse und Netzwerk erforderlich',
    confirmDelete: 'Möchten Sie diese Adresse wirklich entfernen?',
    labelPlaceholder: 'z.B. Binance Wallet',
    addressPlaceholder: '0x... / bc1... / r...',
    success: 'Adresse hinzugefügt! Wird in 24 Stunden aktiv.',
    error: 'Fehler',
    back: 'Zurück',
  },
  fr: {
    title: 'Liste Blanche de Retrait',
    subtitle: 'Les nouvelles adresses deviennent actives après 24 heures',
    addNew: 'Ajouter une Adresse',
    address: 'Adresse',
    label: 'Libellé',
    network: 'Réseau',
    add: 'Ajouter',
    cancel: 'Annuler',
    delete: 'Supprimer',
    verified: 'Vérifié',
    pending: 'En attente',
    noAddresses: 'Aucune adresse de liste blanche',
    noAddressesDesc: 'Ajoutez des adresses pour des retraits sécurisés',
    verifyIn: 'Vérification dans:',
    addressRequired: 'Adresse et réseau requis',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette adresse?',
    labelPlaceholder: 'ex. Portefeuille Binance',
    addressPlaceholder: '0x... / bc1... / r...',
    success: 'Adresse ajoutée! Sera active dans 24 heures.',
    error: 'Erreur',
    back: 'Retour',
  },
  ar: {
    title: 'القائمة البيضاء للسحب',
    subtitle: 'تصبح العناوين الجديدة نشطة بعد 24 ساعة',
    addNew: 'إضافة عنوان جديد',
    address: 'العنوان',
    label: 'التسمية',
    network: 'الشبكة',
    add: 'إضافة',
    cancel: 'إلغاء',
    delete: 'حذف',
    verified: 'تم التحقق',
    pending: 'قيد الانتظار',
    noAddresses: 'لا توجد عناوين في القائمة البيضاء',
    noAddressesDesc: 'أضف عناوين لعمليات سحب آمنة',
    verifyIn: 'التحقق في:',
    addressRequired: 'العنوان والشبكة مطلوبان',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنوان؟',
    labelPlaceholder: 'مثال: محفظة بينانس',
    addressPlaceholder: '0x... / bc1... / r...',
    success: 'تمت إضافة العنوان! سيكون نشطاً خلال 24 ساعة.',
    error: 'خطأ',
    back: 'رجوع',
  },
  ru: {
    title: 'Белый Список для Вывода',
    subtitle: 'Новые адреса активируются через 24 часа',
    addNew: 'Добавить Адрес',
    address: 'Адрес',
    label: 'Метка',
    network: 'Сеть',
    add: 'Добавить',
    cancel: 'Отмена',
    delete: 'Удалить',
    verified: 'Подтверждено',
    pending: 'Ожидание',
    noAddresses: 'Адресов в белом списке пока нет',
    noAddressesDesc: 'Добавьте адреса для безопасных выводов',
    verifyIn: 'Подтверждение через:',
    addressRequired: 'Требуется адрес и сеть',
    confirmDelete: 'Вы уверены, что хотите удалить этот адрес?',
    labelPlaceholder: 'напр. Кошелёк Binance',
    addressPlaceholder: '0x... / bc1... / r...',
    success: 'Адрес добавлен! Будет активен через 24 часа.',
    error: 'Ошибка',
    back: 'Назад',
  },
};

// ============================================
// TYPES & CONSTANTS
// ============================================
interface WhitelistAddress {
  id: string;
  address: string;
  label: string;
  network: 'ETH' | 'BTC' | 'XRP' | 'SOL';
  addedAt: number;
  verifiedAt?: number;
  isVerified: boolean;
}

const NETWORKS = [
  { id: 'ETH', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { id: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { id: 'XRP', name: 'Ripple', icon: '✕', color: '#23292F' },
  { id: 'SOL', name: 'Solana', icon: '◎', color: '#9945FF' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function WhitelistScreen() {
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
  const [addresses, setAddresses] = useState<WhitelistAddress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ETH');

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
        await fetchAddresses(address);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/security/whitelist?address=${address}`);
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error('Fetch addresses error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await fetchAddresses(walletAddress);
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!newAddress || !selectedNetwork || !walletAddress) {
      Alert.alert(t.error, t.addressRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/security/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          withdrawAddress: newAddress,
          label: newLabel,
          network: selectedNetwork,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      Alert.alert('✓', t.success);
      setShowAddModal(false);
      setNewAddress('');
      setNewLabel('');
      setSelectedNetwork('ETH');
      await fetchAddresses(walletAddress);
    } catch (err: any) {
      Alert.alert(t.error, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!walletAddress) return;

    Alert.alert('', t.confirmDelete, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/security/whitelist`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress, addressId }),
            });
            await fetchAddresses(walletAddress);
          } catch (err) {
            console.error('Delete error:', err);
          }
        },
      },
    ]);
  };

  const formatTimeRemaining = (addedAt: number) => {
    const verifyTime = addedAt + 86400000; // 24 hours
    const remaining = verifyTime - Date.now();
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

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
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {addresses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noAddresses}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t.noAddressesDesc}</Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyButtonText}>{t.addNew}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((addr) => {
              const network = NETWORKS.find((n) => n.id === addr.network);
              const timeRemaining = !addr.isVerified ? formatTimeRemaining(addr.addedAt) : null;

              return (
                <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.addressRow}>
                    <View style={[styles.networkIcon, { backgroundColor: network?.color || colors.primary }]}>
                      <Text style={styles.networkIconText}>{network?.icon || '?'}</Text>
                    </View>
                    <View style={styles.addressInfo}>
                      <View style={styles.addressTitleRow}>
                        <Text style={[styles.addressLabel, { color: colors.text }]} numberOfLines={1}>
                          {addr.label || network?.name}
                        </Text>
                        {addr.isVerified ? (
                          <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.statusText, { color: colors.primary }]}>✓ {t.verified}</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: colors.amber + '20' }]}>
                            <Text style={[styles.statusText, { color: colors.amber }]}>⏳ {t.pending}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.addressText, { color: colors.textMuted }]} numberOfLines={1}>
                        {addr.address.slice(0, 10)}...{addr.address.slice(-8)}
                      </Text>
                      {timeRemaining && (
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>
                          {t.verifyIn} {timeRemaining}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(addr.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.addNew}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Network Selection */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.network}</Text>
              <View style={styles.networkGrid}>
                {NETWORKS.map((network) => (
                  <TouchableOpacity
                    key={network.id}
                    style={[
                      styles.networkButton,
                      {
                        backgroundColor: selectedNetwork === network.id ? network.color + '20' : colors.surfaceAlt,
                        borderColor: selectedNetwork === network.id ? network.color : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedNetwork(network.id)}
                  >
                    <Text style={styles.networkButtonIcon}>{network.icon}</Text>
                    <Text style={[styles.networkButtonText, { color: colors.text }]}>{network.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Address Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 20 }]}>{t.address}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder={t.addressPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={newAddress}
                onChangeText={setNewAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Label Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>{t.label}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder={t.labelPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={newLabel}
                onChangeText={setNewLabel}
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, !newAddress && styles.buttonDisabled]}
                onPress={handleAdd}
                disabled={!newAddress || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t.add}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyCard: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '500', marginTop: 16 },
  emptyDesc: { fontSize: 13, marginTop: 4 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  emptyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  addressList: { gap: 12 },
  addressCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  networkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  networkIconText: { fontSize: 20, color: '#FFF', fontWeight: '700' },
  addressInfo: { flex: 1, marginLeft: 12 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '500' },
  addressText: { fontSize: 12, marginTop: 4, fontFamily: 'monospace' },
  timeText: { fontSize: 11, marginTop: 4 },
  deleteButton: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  networkButton: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 2 },
  networkButtonIcon: { fontSize: 20 },
  networkButtonText: { fontSize: 14, fontWeight: '500' },
  textInput: { fontSize: 15, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontWeight: '600', fontSize: 15 },
  submitButton: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
});
