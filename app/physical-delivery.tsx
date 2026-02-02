// app/physical-delivery.tsx
// Physical Delivery Request Screen
// 6-Language Support | Dark/Light Mode | Metal Delivery Management

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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';
import { Image } from 'react-native';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Fiziksel Teslimat',
    subtitle: 'Metal varlıklarınızı fiziksel olarak teslim alın',
    newRequest: 'Yeni Talep',
    myRequests: 'Taleplerim',
    myAddresses: 'Adreslerim',
    addAddress: 'Adres Ekle',
    selectMetal: 'Metal Seçin',
    amount: 'Miktar (gram)',
    minAmount: 'Minimum',
    yourBalance: 'Bakiyeniz',
    selectAddress: 'Teslimat Adresi',
    deliveryFee: 'Teslimat Ücreti',
    submit: 'Talep Oluştur',
    cancel: 'İptal',
    noRequests: 'Henüz teslimat talebiniz yok',
    noAddresses: 'Henüz adres eklemediniz',
    default: 'Varsayılan',
    trackingNo: 'Takip No',
    status: { pending: 'Beklemede', confirmed: 'Onaylandı', processing: 'Hazırlanıyor', shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal Edildi' },
    addressForm: { label: 'Adres Etiketi', fullName: 'Ad Soyad', phone: 'Telefon', country: 'Ülke', city: 'Şehir', district: 'İlçe', addressLine1: 'Adres Satırı 1', addressLine2: 'Adres Satırı 2 (Opsiyonel)', postalCode: 'Posta Kodu', setDefault: 'Varsayılan adres olarak ayarla', save: 'Kaydet' },
    success: { requestCreated: 'Teslimat talebi oluşturuldu!', addressAdded: 'Adres eklendi!' },
    errors: { insufficientBalance: 'Yetersiz bakiye', minAmountRequired: 'Minimum miktar gerekli', error: 'Bir hata oluştu' },
    back: 'Geri',
  },
  en: {
    title: 'Physical Delivery',
    subtitle: 'Receive your metal assets physically',
    newRequest: 'New Request',
    myRequests: 'My Requests',
    myAddresses: 'My Addresses',
    addAddress: 'Add Address',
    selectMetal: 'Select Metal',
    amount: 'Amount (grams)',
    minAmount: 'Minimum',
    yourBalance: 'Your Balance',
    selectAddress: 'Delivery Address',
    deliveryFee: 'Delivery Fee',
    submit: 'Create Request',
    cancel: 'Cancel',
    noRequests: 'No delivery requests yet',
    noAddresses: 'No addresses added yet',
    default: 'Default',
    trackingNo: 'Tracking No',
    status: { pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
    addressForm: { label: 'Address Label', fullName: 'Full Name', phone: 'Phone', country: 'Country', city: 'City', district: 'District', addressLine1: 'Address Line 1', addressLine2: 'Address Line 2 (Optional)', postalCode: 'Postal Code', setDefault: 'Set as default address', save: 'Save' },
    success: { requestCreated: 'Delivery request created!', addressAdded: 'Address added!' },
    errors: { insufficientBalance: 'Insufficient balance', minAmountRequired: 'Minimum amount required', error: 'An error occurred' },
    back: 'Back',
  },
  de: {
    title: 'Physische Lieferung',
    subtitle: 'Erhalten Sie Ihre Metallwerte physisch',
    newRequest: 'Neue Anfrage',
    myRequests: 'Meine Anfragen',
    myAddresses: 'Meine Adressen',
    addAddress: 'Adresse hinzufügen',
    selectMetal: 'Metall auswählen',
    amount: 'Menge (Gramm)',
    minAmount: 'Minimum',
    yourBalance: 'Ihr Guthaben',
    selectAddress: 'Lieferadresse',
    deliveryFee: 'Liefergebühr',
    submit: 'Anfrage erstellen',
    cancel: 'Abbrechen',
    noRequests: 'Noch keine Lieferanfragen',
    noAddresses: 'Noch keine Adressen',
    default: 'Standard',
    trackingNo: 'Sendungsnr.',
    status: { pending: 'Ausstehend', confirmed: 'Bestätigt', processing: 'In Bearbeitung', shipped: 'Versendet', delivered: 'Geliefert', cancelled: 'Storniert' },
    addressForm: { label: 'Bezeichnung', fullName: 'Vollständiger Name', phone: 'Telefon', country: 'Land', city: 'Stadt', district: 'Bezirk', addressLine1: 'Adresszeile 1', addressLine2: 'Adresszeile 2 (Optional)', postalCode: 'Postleitzahl', setDefault: 'Als Standardadresse festlegen', save: 'Speichern' },
    success: { requestCreated: 'Lieferanfrage erstellt!', addressAdded: 'Adresse hinzugefügt!' },
    errors: { insufficientBalance: 'Unzureichendes Guthaben', minAmountRequired: 'Mindestmenge erforderlich', error: 'Ein Fehler ist aufgetreten' },
    back: 'Zurück',
  },
  fr: {
    title: 'Livraison Physique',
    subtitle: 'Recevez vos actifs métalliques physiquement',
    newRequest: 'Nouvelle Demande',
    myRequests: 'Mes Demandes',
    myAddresses: 'Mes Adresses',
    addAddress: 'Ajouter une Adresse',
    selectMetal: 'Sélectionner le Métal',
    amount: 'Quantité (grammes)',
    minAmount: 'Minimum',
    yourBalance: 'Votre Solde',
    selectAddress: 'Adresse de Livraison',
    deliveryFee: 'Frais de Livraison',
    submit: 'Créer la Demande',
    cancel: 'Annuler',
    noRequests: 'Aucune demande de livraison',
    noAddresses: 'Aucune adresse ajoutée',
    default: 'Par défaut',
    trackingNo: 'N° de Suivi',
    status: { pending: 'En attente', confirmed: 'Confirmé', processing: 'En cours', shipped: 'Expédié', delivered: 'Livré', cancelled: 'Annulé' },
    addressForm: { label: 'Libellé', fullName: 'Nom Complet', phone: 'Téléphone', country: 'Pays', city: 'Ville', district: 'District', addressLine1: 'Adresse Ligne 1', addressLine2: 'Adresse Ligne 2 (Optionnel)', postalCode: 'Code Postal', setDefault: 'Définir comme adresse par défaut', save: 'Enregistrer' },
    success: { requestCreated: 'Demande de livraison créée!', addressAdded: 'Adresse ajoutée!' },
    errors: { insufficientBalance: 'Solde insuffisant', minAmountRequired: 'Quantité minimum requise', error: 'Une erreur s\'est produite' },
    back: 'Retour',
  },
  ar: {
    title: 'التسليم الفعلي',
    subtitle: 'استلم أصولك المعدنية فعلياً',
    newRequest: 'طلب جديد',
    myRequests: 'طلباتي',
    myAddresses: 'عناويني',
    addAddress: 'إضافة عنوان',
    selectMetal: 'اختر المعدن',
    amount: 'الكمية (جرام)',
    minAmount: 'الحد الأدنى',
    yourBalance: 'رصيدك',
    selectAddress: 'عنوان التسليم',
    deliveryFee: 'رسوم التوصيل',
    submit: 'إنشاء الطلب',
    cancel: 'إلغاء',
    noRequests: 'لا توجد طلبات توصيل',
    noAddresses: 'لم تتم إضافة عناوين',
    default: 'افتراضي',
    trackingNo: 'رقم التتبع',
    status: { pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد المعالجة', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغى' },
    addressForm: { label: 'تسمية العنوان', fullName: 'الاسم الكامل', phone: 'الهاتف', country: 'البلد', city: 'المدينة', district: 'المنطقة', addressLine1: 'سطر العنوان 1', addressLine2: 'سطر العنوان 2 (اختياري)', postalCode: 'الرمز البريدي', setDefault: 'تعيين كعنوان افتراضي', save: 'حفظ' },
    success: { requestCreated: 'تم إنشاء طلب التوصيل!', addressAdded: 'تمت إضافة العنوان!' },
    errors: { insufficientBalance: 'رصيد غير كافٍ', minAmountRequired: 'الحد الأدنى للكمية مطلوب', error: 'حدث خطأ' },
    back: 'رجوع',
  },
  ru: {
    title: 'Физическая Доставка',
    subtitle: 'Получите ваши металлические активы физически',
    newRequest: 'Новый Запрос',
    myRequests: 'Мои Запросы',
    myAddresses: 'Мои Адреса',
    addAddress: 'Добавить Адрес',
    selectMetal: 'Выберите Металл',
    amount: 'Количество (граммы)',
    minAmount: 'Минимум',
    yourBalance: 'Ваш Баланс',
    selectAddress: 'Адрес Доставки',
    deliveryFee: 'Стоимость Доставки',
    submit: 'Создать Запрос',
    cancel: 'Отмена',
    noRequests: 'Пока нет запросов на доставку',
    noAddresses: 'Адреса ещё не добавлены',
    default: 'По умолчанию',
    trackingNo: 'Номер Отслеживания',
    status: { pending: 'Ожидание', confirmed: 'Подтверждено', processing: 'Обработка', shipped: 'Отправлено', delivered: 'Доставлено', cancelled: 'Отменено' },
    addressForm: { label: 'Название Адреса', fullName: 'Полное Имя', phone: 'Телефон', country: 'Страна', city: 'Город', district: 'Район', addressLine1: 'Адрес Строка 1', addressLine2: 'Адрес Строка 2 (Опционально)', postalCode: 'Почтовый Индекс', setDefault: 'Установить как адрес по умолчанию', save: 'Сохранить' },
    success: { requestCreated: 'Запрос на доставку создан!', addressAdded: 'Адрес добавлен!' },
    errors: { insufficientBalance: 'Недостаточный баланс', minAmountRequired: 'Требуется минимальное количество', error: 'Произошла ошибка' },
    back: 'Назад',
  },
};

// ============================================
// TYPES & CONSTANTS
// ============================================
interface DeliveryAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  isDefault: boolean;
}

interface DeliveryRequest {
  id: string;
  token: string;
  amount: number;
  address: DeliveryAddress;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  createdAt: string;
}

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

const METALS = [
  { symbol: 'AUXG', name: 'Gold', color: '#EAB308', minAmount: 80 },
  { symbol: 'AUXS', name: 'Silver', color: '#94A3B8', minAmount: 5000 },
  { symbol: 'AUXPT', name: 'Platinum', color: '#E2E8F0', minAmount: 200 },
  { symbol: 'AUXPD', name: 'Palladium', color: '#64748B', minAmount: 200 },
];

const DELIVERY_FEES: Record<string, number> = { AUXG: 50, AUXS: 75, AUXPT: 50, AUXPD: 50 };

type TabType = 'new' | 'requests' | 'addresses';

// ============================================
// MAIN COMPONENT
// ============================================
export default function PhysicalDeliveryScreen() {
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
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  // New request form
  const [selectedMetal, setSelectedMetal] = useState('AUXG');
  const [amount, setAmount] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Address form modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '', fullName: '', phone: '', country: '', city: '', district: '', addressLine1: '', addressLine2: '', postalCode: '', isDefault: false,
  });

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#F59E0B',
    danger: '#EF4444',
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
        await Promise.all([fetchRequests(address), fetchAddresses(address), fetchBalances(address)]);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/delivery`, { headers: { 'x-wallet-address': address } });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    }
  };

  const fetchAddresses = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/delivery?type=addresses`, { headers: { 'x-wallet-address': address } });
      const data = await res.json();
      setAddresses(data.addresses || []);
      if (data.addresses?.length > 0 && !selectedAddressId) {
        const defaultAddr = data.addresses.find((a: DeliveryAddress) => a.isDefault) || data.addresses[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    }
  };

  const fetchBalances = async (address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/user/balance?address=${address}`);
      const data = await res.json();
      setBalances(data.balances || {});
    } catch (err) {
      console.error('Fetch balances error:', err);
    }
  };

  const handleRefresh = async () => {
    if (!walletAddress) return;
    setRefreshing(true);
    await Promise.all([fetchRequests(walletAddress), fetchAddresses(walletAddress), fetchBalances(walletAddress)]);
    setRefreshing(false);
  };

  const handleSubmitRequest = async () => {
    if (!walletAddress || !amount || !selectedAddressId) return;

    const metal = METALS.find((m) => m.symbol === selectedMetal);
    const amountNum = parseFloat(amount);

    if (amountNum < (metal?.minAmount || 0)) {
      Alert.alert(t.errors.error, t.errors.minAmountRequired);
      return;
    }

    const balance = balances[selectedMetal.toLowerCase()] || 0;
    if (amountNum > balance) {
      Alert.alert(t.errors.error, t.errors.insufficientBalance);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({ token: selectedMetal, amount: amountNum, addressId: selectedAddressId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('✓', t.success.requestCreated);
      setAmount('');
      setActiveTab('requests');
      await fetchRequests(walletAddress);
    } catch (err: any) {
      Alert.alert(t.errors.error, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAddress = async () => {
    if (!walletAddress || !addressForm.label || !addressForm.fullName || !addressForm.phone || !addressForm.city || !addressForm.addressLine1 || !addressForm.postalCode) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({ action: 'add_address', ...addressForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('✓', t.success.addressAdded);
      setShowAddressModal(false);
      setAddressForm({ label: '', fullName: '', phone: '', country: '', city: '', district: '', addressLine1: '', addressLine2: '', postalCode: '', isDefault: false });
      await fetchAddresses(walletAddress);
    } catch (err: any) {
      Alert.alert(t.errors.error, err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!walletAddress) return;

    Alert.alert('', t.cancel + '?', [
      { text: t.cancel, style: 'cancel' },
      {
        text: 'OK',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/delivery?type=request&id=${requestId}`, {
              method: 'DELETE',
              headers: { 'x-wallet-address': walletAddress },
            });
            await fetchRequests(walletAddress);
          } catch (err) {
            console.error('Cancel error:', err);
          }
        },
      },
    ]);
  };

  const selectedMetalInfo = METALS.find((m) => m.symbol === selectedMetal);

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
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['new', 'requests', 'addresses'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textMuted }]}>
              {tab === 'new' ? t.newRequest : tab === 'requests' ? t.myRequests : t.myAddresses}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* NEW REQUEST TAB */}
        {activeTab === 'new' && (
          <View style={styles.formContainer}>
            {/* Metal Selection */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.selectMetal}</Text>
            <View style={styles.metalGrid}>
              {METALS.map((metal) => (
                <TouchableOpacity
                  key={metal.symbol}
                  style={[styles.metalButton, { backgroundColor: selectedMetal === metal.symbol ? metal.color + '30' : colors.surfaceAlt, borderColor: selectedMetal === metal.symbol ? metal.color : 'transparent' }]}
                  onPress={() => setSelectedMetal(metal.symbol)}
                >
                  <Image source={metalIcons[metal.symbol]} style={{ width: 32, height: 32 }} resizeMode="contain" />
                  <Text style={[styles.metalSymbol, { color: colors.text }]}>{metal.symbol}</Text>
                  <Text style={[styles.metalBalance, { color: colors.textMuted }]}>
                    {(balances[metal.symbol.toLowerCase()] || 0).toFixed(2)}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount Input */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t.amount}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.amountInfo}>
              <Text style={[styles.amountInfoText, { color: colors.textMuted }]}>
                {t.minAmount}: {selectedMetalInfo?.minAmount}g
              </Text>
              <Text style={[styles.amountInfoText, { color: colors.textMuted }]}>
                {t.yourBalance}: {(balances[selectedMetal.toLowerCase()] || 0).toFixed(2)}g
              </Text>
            </View>

            {/* Address Selection */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t.selectAddress}</Text>
            {addresses.length === 0 ? (
              <TouchableOpacity style={[styles.addAddressButton, { borderColor: colors.border }]} onPress={() => setShowAddressModal(true)}>
                <Ionicons name="add" size={20} color={colors.textMuted} />
                <Text style={[styles.addAddressText, { color: colors.textMuted }]}>{t.addAddress}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addressList}>
                {addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.addressOption, { backgroundColor: selectedAddressId === addr.id ? colors.primary + '20' : colors.surfaceAlt, borderColor: selectedAddressId === addr.id ? colors.primary : 'transparent' }]}
                    onPress={() => setSelectedAddressId(addr.id)}
                  >
                    <View style={styles.addressOptionInfo}>
                      <Text style={[styles.addressOptionLabel, { color: colors.text }]}>{addr.label}</Text>
                      <Text style={[styles.addressOptionCity, { color: colors.textMuted }]}>{addr.city}, {addr.country}</Text>
                    </View>
                    {selectedAddressId === addr.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Fee Info */}
            <View style={[styles.feeCard, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>{t.deliveryFee}</Text>
              <Text style={[styles.feeValue, { color: colors.text }]}>${DELIVERY_FEES[selectedMetal]}</Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, (!amount || !selectedAddressId) && styles.buttonDisabled]}
              onPress={handleSubmitRequest}
              disabled={!amount || !selectedAddressId || submitting}
            >
              {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.submitButtonText}>{t.submit}</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <View>
            {requests.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>📦</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noRequests}</Text>
              </View>
            ) : (
              requests.map((req) => {
                const metal = METALS.find((m) => m.symbol === req.token);
                const statusColors: Record<string, string> = { pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6', shipped: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444' };
                return (
                  <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestMetal}>
                        <Text style={styles.requestIcon}>{metal?.icon}</Text>
                        <View>
                          <Text style={[styles.requestAmount, { color: colors.text }]}>{req.amount}g {req.token}</Text>
                          <Text style={[styles.requestId, { color: colors.textMuted }]}>{req.id}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors[req.status] + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColors[req.status] }]}>{t.status[req.status]}</Text>
                      </View>
                    </View>
                    <Text style={[styles.requestAddress, { color: colors.textMuted }]}>{req.address.city}, {req.address.country}</Text>
                    {req.trackingNumber && <Text style={[styles.trackingNo, { color: colors.textSecondary }]}>{t.trackingNo}: {req.trackingNumber}</Text>}
                    {req.status === 'pending' && (
                      <TouchableOpacity onPress={() => handleCancelRequest(req.id)}>
                        <Text style={[styles.cancelLink, { color: colors.danger }]}>{t.cancel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <View>
            <TouchableOpacity style={[styles.addAddressButton, { borderColor: colors.border, marginBottom: 16 }]} onPress={() => setShowAddressModal(true)}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.addAddressText, { color: colors.primary }]}>{t.addAddress}</Text>
            </TouchableOpacity>
            {addresses.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>🏠</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noAddresses}</Text>
              </View>
            ) : (
              addresses.map((addr) => (
                <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.addressCardHeader}>
                    <Text style={[styles.addressCardLabel, { color: colors.text }]}>{addr.label}</Text>
                    {addr.isDefault && <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}><Text style={[styles.defaultBadgeText, { color: colors.primary }]}>{t.default}</Text></View>}
                  </View>
                  <Text style={[styles.addressCardText, { color: colors.textSecondary }]}>{addr.fullName}</Text>
                  <Text style={[styles.addressCardText, { color: colors.textSecondary }]}>{addr.addressLine1}</Text>
                  {addr.addressLine2 && <Text style={[styles.addressCardText, { color: colors.textSecondary }]}>{addr.addressLine2}</Text>}
                  <Text style={[styles.addressCardText, { color: colors.textSecondary }]}>{addr.district}, {addr.city} {addr.postalCode}</Text>
                  <Text style={[styles.addressCardText, { color: colors.textSecondary }]}>{addr.country}</Text>
                  <Text style={[styles.addressCardText, { color: colors.textSecondary }]}>{addr.phone}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showAddressModal} transparent animationType="slide" onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.addAddress}</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.label} placeholderTextColor={colors.textMuted} value={addressForm.label} onChangeText={(v) => setAddressForm({ ...addressForm, label: v })} />
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.fullName} placeholderTextColor={colors.textMuted} value={addressForm.fullName} onChangeText={(v) => setAddressForm({ ...addressForm, fullName: v })} />
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.phone} placeholderTextColor={colors.textMuted} value={addressForm.phone} onChangeText={(v) => setAddressForm({ ...addressForm, phone: v })} keyboardType="phone-pad" />
              <View style={styles.inputRow}>
                <TextInput style={[styles.input, styles.halfInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]} placeholder={t.addressForm.country} placeholderTextColor={colors.textMuted} value={addressForm.country} onChangeText={(v) => setAddressForm({ ...addressForm, country: v })} />
                <TextInput style={[styles.input, styles.halfInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]} placeholder={t.addressForm.city} placeholderTextColor={colors.textMuted} value={addressForm.city} onChangeText={(v) => setAddressForm({ ...addressForm, city: v })} />
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.district} placeholderTextColor={colors.textMuted} value={addressForm.district} onChangeText={(v) => setAddressForm({ ...addressForm, district: v })} />
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.addressLine1} placeholderTextColor={colors.textMuted} value={addressForm.addressLine1} onChangeText={(v) => setAddressForm({ ...addressForm, addressLine1: v })} />
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.addressLine2} placeholderTextColor={colors.textMuted} value={addressForm.addressLine2} onChangeText={(v) => setAddressForm({ ...addressForm, addressLine2: v })} />
              <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, marginBottom: 12 }]} placeholder={t.addressForm.postalCode} placeholderTextColor={colors.textMuted} value={addressForm.postalCode} onChangeText={(v) => setAddressForm({ ...addressForm, postalCode: v })} />
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>{t.addressForm.setDefault}</Text>
                <Switch value={addressForm.isDefault} onValueChange={(v) => setAddressForm({ ...addressForm, isDefault: v })} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={addressForm.isDefault ? colors.primary : colors.textMuted} />
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surfaceAlt }]} onPress={() => setShowAddressModal(false)}><Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress} disabled={submitting}>{submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveButtonText}>{t.addressForm.save}</Text>}</TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  formContainer: {},
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  metalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metalButton: { width: '48%', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  metalIcon: { fontSize: 28 },
  metalSymbol: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  metalBalance: { fontSize: 11, marginTop: 2 },
  input: { fontSize: 15, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfInput: { flex: 1 },
  amountInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  amountInfoText: { fontSize: 12 },
  addAddressButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  addAddressText: { fontSize: 14 },
  addressList: { gap: 10 },
  addressOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 2 },
  addressOptionInfo: {},
  addressOptionLabel: { fontSize: 14, fontWeight: '500' },
  addressOptionCity: { fontSize: 12, marginTop: 2 },
  feeCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginTop: 20 },
  feeLabel: { fontSize: 14 },
  feeValue: { fontSize: 14, fontWeight: '600' },
  submitButton: { backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14 },
  requestCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  requestMetal: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  requestIcon: { fontSize: 28 },
  requestAmount: { fontSize: 15, fontWeight: '600' },
  requestId: { fontSize: 10, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '500' },
  requestAddress: { fontSize: 12, marginBottom: 4 },
  trackingNo: { fontSize: 12, marginTop: 4 },
  cancelLink: { fontSize: 12, marginTop: 8 },
  addressCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  addressCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addressCardLabel: { fontSize: 15, fontWeight: '600' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultBadgeText: { fontSize: 10, fontWeight: '500' },
  addressCardText: { fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  switchLabel: { fontSize: 14 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontWeight: '600', fontSize: 15 },
  saveButton: { flex: 1, backgroundColor: '#F59E0B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
});
