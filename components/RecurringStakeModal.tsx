// components/RecurringStakeModal.tsx
// Düzenli Biriktirme Modalı - Plan oluşturma ve düzenleme
// TR/EN | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

// Metal icons
const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

const metalColors: Record<string, string> = {
  AUXG: '#EAB308',
  AUXS: '#94A3B8',
  AUXPT: '#06B6D4',
  AUXPD: '#F43F5E',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PickerOption {
  key: string | number;
  label: string;
  sublabel?: string;
}

interface LeaseRates {
  gold: { '3m': number; '6m': number; '12m': number };
  silver: { '3m': number; '6m': number; '12m': number };
  platinum: { '3m': number; '6m': number; '12m': number };
  palladium: { '3m': number; '6m': number; '12m': number };
  sofr: number;
  gofo: number;
}

// ============================================
// TRANSLATIONS - 6 Language Support
// ============================================
const translations = {
  tr: {
    title: 'Düzenli Biriktirme',
    subtitle: 'Otomatik stake planı oluştur',
    selectMetal: 'Metal Seçin',
    amount: 'Miktar (gram)',
    frequency: 'Sıklık',
    weekly: 'Haftalık',
    biweekly: 'İki Haftada Bir',
    monthly: 'Aylık',
    stakeDuration: 'Stake Süresi',
    months: 'Ay',
    paymentSource: 'Ödeme Kaynağı',
    metalBalance: 'Metal Bakiyesi',
    usdBalance: 'USD Bakiyesi',
    usdtBalance: 'USDT Bakiyesi',
    executionDay: 'Çalışma Günü',
    executionHour: 'Çalışma Saati',
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar',
    dayOfMonth: 'Ayın Günü',
    day: 'gün',
    createPlan: 'Plan Oluştur',
    cancel: 'İptal',
    creating: 'Oluşturuluyor...',
    success: 'Plan başarıyla oluşturuldu',
    error: 'Plan oluşturulamadı',
    info1: 'Metal bakiyeniz varsa direkt stake edilir',
    info2: 'Yetersizse ödeme kaynağından alınıp stake edilir',
    info3: 'Maksimum 5 aktif plan oluşturabilirsiniz',
    gold: 'Altın',
    silver: 'Gümüş',
    platinum: 'Platin',
    palladium: 'Paladyum',
    expectedReturn: 'Beklenen Getiri',
    perYear: 'yıllık',
  },
  en: {
    title: 'Recurring Stake',
    subtitle: 'Create auto-stake plan',
    selectMetal: 'Select Metal',
    amount: 'Amount (grams)',
    frequency: 'Frequency',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    stakeDuration: 'Stake Duration',
    months: 'Months',
    paymentSource: 'Payment Source',
    metalBalance: 'Metal Balance',
    usdBalance: 'USD Balance',
    usdtBalance: 'USDT Balance',
    executionDay: 'Execution Day',
    executionHour: 'Execution Hour',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    dayOfMonth: 'Day of Month',
    day: 'day',
    createPlan: 'Create Plan',
    cancel: 'Cancel',
    creating: 'Creating...',
    success: 'Plan created successfully',
    error: 'Failed to create plan',
    info1: 'If you have metal balance, it will be staked directly',
    info2: 'If insufficient, purchased from payment source then staked',
    info3: 'Maximum 5 active plans allowed',
    gold: 'Gold',
    silver: 'Silver',
    platinum: 'Platinum',
    palladium: 'Palladium',
    expectedReturn: 'Expected Return',
    perYear: 'per year',
  },
  de: {
    title: 'Sparplan',
    subtitle: 'Automatischen Stake-Plan erstellen',
    selectMetal: 'Metall auswählen',
    amount: 'Betrag (Gramm)',
    frequency: 'Häufigkeit',
    weekly: 'Wöchentlich',
    biweekly: 'Zweiwöchentlich',
    monthly: 'Monatlich',
    stakeDuration: 'Stake-Dauer',
    months: 'Monate',
    paymentSource: 'Zahlungsquelle',
    metalBalance: 'Metall-Guthaben',
    usdBalance: 'USD-Guthaben',
    usdtBalance: 'USDT-Guthaben',
    executionDay: 'Ausführungstag',
    executionHour: 'Ausführungszeit',
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
    dayOfMonth: 'Tag des Monats',
    day: 'Tag',
    createPlan: 'Plan erstellen',
    cancel: 'Abbrechen',
    creating: 'Wird erstellt...',
    success: 'Plan erfolgreich erstellt',
    error: 'Plan konnte nicht erstellt werden',
    info1: 'Bei vorhandenem Metall-Guthaben wird direkt gestaked',
    info2: 'Bei unzureichendem Guthaben wird von der Zahlungsquelle gekauft',
    info3: 'Maximal 5 aktive Pläne erlaubt',
    gold: 'Gold',
    silver: 'Silber',
    platinum: 'Platin',
    palladium: 'Palladium',
    expectedReturn: 'Erwartete Rendite',
    perYear: 'pro Jahr',
  },
  fr: {
    title: 'Achat Récurrent',
    subtitle: 'Créer un plan de stake automatique',
    selectMetal: 'Sélectionner le métal',
    amount: 'Montant (grammes)',
    frequency: 'Fréquence',
    weekly: 'Hebdomadaire',
    biweekly: 'Bimensuel',
    monthly: 'Mensuel',
    stakeDuration: 'Durée du stake',
    months: 'Mois',
    paymentSource: 'Source de paiement',
    metalBalance: 'Solde métal',
    usdBalance: 'Solde USD',
    usdtBalance: 'Solde USDT',
    executionDay: 'Jour d\'exécution',
    executionHour: 'Heure d\'exécution',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
    dayOfMonth: 'Jour du mois',
    day: 'jour',
    createPlan: 'Créer le plan',
    cancel: 'Annuler',
    creating: 'Création...',
    success: 'Plan créé avec succès',
    error: 'Échec de la création du plan',
    info1: 'Si vous avez un solde métal, il sera staké directement',
    info2: 'Si insuffisant, acheté depuis la source de paiement puis staké',
    info3: 'Maximum 5 plans actifs autorisés',
    gold: 'Or',
    silver: 'Argent',
    platinum: 'Platine',
    palladium: 'Palladium',
    expectedReturn: 'Rendement attendu',
    perYear: 'par an',
  },
  ar: {
    title: 'شراء تلقائي',
    subtitle: 'إنشاء خطة stake تلقائية',
    selectMetal: 'اختر المعدن',
    amount: 'المبلغ (جرام)',
    frequency: 'التكرار',
    weekly: 'أسبوعي',
    biweekly: 'كل أسبوعين',
    monthly: 'شهري',
    stakeDuration: 'مدة الـ Stake',
    months: 'أشهر',
    paymentSource: 'مصدر الدفع',
    metalBalance: 'رصيد المعادن',
    usdBalance: 'رصيد USD',
    usdtBalance: 'رصيد USDT',
    executionDay: 'يوم التنفيذ',
    executionHour: 'ساعة التنفيذ',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    sunday: 'الأحد',
    dayOfMonth: 'يوم الشهر',
    day: 'يوم',
    createPlan: 'إنشاء الخطة',
    cancel: 'إلغاء',
    creating: 'جاري الإنشاء...',
    success: 'تم إنشاء الخطة بنجاح',
    error: 'فشل إنشاء الخطة',
    info1: 'إذا كان لديك رصيد معادن، سيتم stake مباشرة',
    info2: 'إذا كان غير كافٍ، سيتم الشراء من مصدر الدفع ثم stake',
    info3: 'الحد الأقصى 5 خطط نشطة',
    gold: 'ذهب',
    silver: 'فضة',
    platinum: 'بلاتين',
    palladium: 'بالاديوم',
    expectedReturn: 'العائد المتوقع',
    perYear: 'سنوياً',
  },
  ru: {
    title: 'Автопокупка',
    subtitle: 'Создать план автостейкинга',
    selectMetal: 'Выберите металл',
    amount: 'Сумма (граммы)',
    frequency: 'Частота',
    weekly: 'Еженедельно',
    biweekly: 'Раз в 2 недели',
    monthly: 'Ежемесячно',
    stakeDuration: 'Срок стейкинга',
    months: 'Месяцев',
    paymentSource: 'Источник оплаты',
    metalBalance: 'Баланс металла',
    usdBalance: 'Баланс USD',
    usdtBalance: 'Баланс USDT',
    executionDay: 'День выполнения',
    executionHour: 'Время выполнения',
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
    dayOfMonth: 'День месяца',
    day: 'день',
    createPlan: 'Создать план',
    cancel: 'Отмена',
    creating: 'Создание...',
    success: 'План успешно создан',
    error: 'Не удалось создать план',
    info1: 'Если есть баланс металла, он будет застейкан напрямую',
    info2: 'При недостатке будет куплен из источника оплаты и застейкан',
    info3: 'Максимум 5 активных планов',
    gold: 'Золото',
    silver: 'Серебро',
    platinum: 'Платина',
    palladium: 'Палладий',
    expectedReturn: 'Ожидаемый доход',
    perYear: 'в год',
  },
};

export function RecurringStakeModal({ visible, onClose, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState('AUXG');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [stakeDuration, setStakeDuration] = useState<3 | 6 | 12>(6);
  const [paymentSource, setPaymentSource] = useState('metal_balance');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(9);

  // Picker modal states
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showHourPicker, setShowHourPicker] = useState(false);

  // Lease Rates from API
  const [leaseRates, setLeaseRates] = useState<LeaseRates | null>(null);

  // Fetch lease rates when modal opens
  useEffect(() => {
    if (visible) {
      fetchLeaseRates();
    }
  }, [visible]);

  const fetchLeaseRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lease-rates`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rates) {
          setLeaseRates(data.rates);
        }
      }
    } catch (error) {
      console.error('Fetch lease rates error:', error);
    }
  };

  // Get APY for selected metal and duration
  const getAPY = (metal: string, duration: 3 | 6 | 12): number => {
    if (!leaseRates) return 0;
    const metalKey = metal === 'AUXG' ? 'gold' : metal === 'AUXS' ? 'silver' : metal === 'AUXPT' ? 'platinum' : 'palladium';
    const durationKey = duration === 3 ? '3m' : duration === 6 ? '6m' : '12m';
    return leaseRates[metalKey]?.[durationKey] || 0;
  };

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
  };

  const metals = [
    { symbol: 'AUXG', name: t.gold },
    { symbol: 'AUXS', name: t.silver },
    { symbol: 'AUXPT', name: t.platinum },
    { symbol: 'AUXPD', name: t.palladium },
  ];

  const frequencies = [
    { key: 'weekly', label: t.weekly },
    { key: 'biweekly', label: t.biweekly },
    { key: 'monthly', label: t.monthly },
  ];

  const durations = [3, 6, 12];

  const paymentSources = [
    { key: 'metal_balance', label: t.metalBalance },
    { key: 'usd_balance', label: t.usdBalance },
    { key: 'usdt_balance', label: t.usdtBalance },
  ];

  const weekDays = [
    { day: 1, label: t.monday },
    { day: 2, label: t.tuesday },
    { day: 3, label: t.wednesday },
    { day: 4, label: t.thursday },
    { day: 5, label: t.friday },
    { day: 6, label: t.saturday },
    { day: 0, label: t.sunday },
  ];

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring-stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          token: selectedMetal,
          amount: parseFloat(amount),
          frequency,
          stakeDuration,
          paymentSource,
          dayOfWeek: frequency !== 'monthly' ? dayOfWeek : undefined,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
          hour,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.error || t.error);
      }
    } catch (error) {
      console.error('Create recurring stake error:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMetal('AUXG');
    setAmount('');
    setFrequency('weekly');
    setStakeDuration(6);
    setPaymentSource('metal_balance');
    setDayOfWeek(1);
    setDayOfMonth(1);
    setHour(9);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Metal Selection */}
            <Text style={[styles.label, { color: colors.text }]}>{t.selectMetal}</Text>
            <View style={styles.metalGrid}>
              {metals.map((metal) => (
                <TouchableOpacity
                  key={metal.symbol}
                  style={[
                    styles.metalCard,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: selectedMetal === metal.symbol ? metalColors[metal.symbol] : colors.border,
                      borderWidth: selectedMetal === metal.symbol ? 2 : 1,
                    }
                  ]}
                  onPress={() => setSelectedMetal(metal.symbol)}
                >
                  <Image source={metalIcons[metal.symbol]} style={styles.metalIcon} resizeMode="contain" />
                  <Text style={[styles.metalSymbol, { color: colors.text }]}>{metal.symbol}</Text>
                  <Text style={[styles.metalName, { color: colors.textSecondary }]}>{metal.name}</Text>
                  {leaseRates && (
                    <Text style={styles.metalAPY}>
                      {getAPY(metal.symbol, stakeDuration).toFixed(1)}% APY
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={[styles.label, { color: colors.text }]}>{t.amount}</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
            />

            {/* Frequency - Dropdown */}
            <Text style={[styles.label, { color: colors.text }]}>{t.frequency}</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowFrequencyPicker(true)}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {frequencies.find(f => f.key === frequency)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Day Selection - Dropdown */}
            <Text style={[styles.label, { color: colors.text }]}>
              {frequency === 'monthly' ? t.dayOfMonth : t.executionDay}
            </Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowDayPicker(true)}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {frequency === 'monthly' 
                  ? `${dayOfMonth}. ${t.day}`
                  : weekDays.find(d => d.day === dayOfWeek)?.label
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Hour - Dropdown */}
            <Text style={[styles.label, { color: colors.text }]}>{t.executionHour}</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowHourPicker(true)}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {hour.toString().padStart(2, '0')}:00
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Stake Duration */}
            <Text style={[styles.label, { color: colors.text }]}>{t.stakeDuration}</Text>
            <View style={styles.optionsRow}>
              {durations.map((dur) => {
                const apy = getAPY(selectedMetal, dur as 3 | 6 | 12);
                return (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durationButton,
                      { 
                        backgroundColor: stakeDuration === dur ? colors.primary : colors.surface,
                        borderColor: stakeDuration === dur ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setStakeDuration(dur as any)}
                  >
                    <Text style={[
                      styles.durationText,
                      { color: stakeDuration === dur ? '#fff' : colors.text }
                    ]}>
                      {dur} {t.months}
                    </Text>
                    {leaseRates && (
                      <Text style={[
                        styles.durationAPY,
                        { color: stakeDuration === dur ? 'rgba(255,255,255,0.8)' : colors.primary }
                      ]}>
                        {apy.toFixed(1)}% APY
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Source */}
            <Text style={[styles.label, { color: colors.text }]}>{t.paymentSource}</Text>
            <View style={styles.sourceOptions}>
              {paymentSources.map((source) => (
                <TouchableOpacity
                  key={source.key}
                  style={[
                    styles.sourceButton,
                    { 
                      backgroundColor: paymentSource === source.key ? colors.primary + '20' : colors.surface,
                      borderColor: paymentSource === source.key ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setPaymentSource(source.key)}
                >
                  <View style={[
                    styles.sourceRadio,
                    { 
                      borderColor: paymentSource === source.key ? colors.primary : colors.border,
                      backgroundColor: paymentSource === source.key ? colors.primary : 'transparent',
                    }
                  ]}>
                    {paymentSource === source.key && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                  <Text style={[styles.sourceText, { color: colors.text }]}>{source.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <View style={styles.infoTexts}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>• {t.info1}</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>• {t.info2}</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>• {t.info3}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createButton, { opacity: loading || !amount ? 0.6 : 1 }]}
                onPress={handleCreate}
                disabled={loading || !amount}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.createGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createText}>{t.createPlan}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* Frequency Picker Modal */}
      <Modal visible={showFrequencyPicker} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.pickerOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFrequencyPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t.frequency}</Text>
              <TouchableOpacity onPress={() => setShowFrequencyPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq.key}
                style={[
                  styles.pickerOption,
                  { backgroundColor: frequency === freq.key ? colors.primary + '20' : 'transparent' }
                ]}
                onPress={() => {
                  setFrequency(freq.key as any);
                  setShowFrequencyPicker(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  { color: frequency === freq.key ? colors.primary : colors.text }
                ]}>
                  {freq.label}
                </Text>
                {frequency === freq.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Day Picker Modal */}
      <Modal visible={showDayPicker} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.pickerOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDayPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                {frequency === 'monthly' ? t.dayOfMonth : t.executionDay}
              </Text>
              <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {frequency === 'monthly' ? (
                // Days of month 1-28
                Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.pickerOption,
                      { backgroundColor: dayOfMonth === d ? colors.primary + '20' : 'transparent' }
                    ]}
                    onPress={() => {
                      setDayOfMonth(d);
                      setShowDayPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { color: dayOfMonth === d ? colors.primary : colors.text }
                    ]}>
                      {d}. {t.day}
                    </Text>
                    {dayOfMonth === d && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                // Week days
                weekDays.map((d) => (
                  <TouchableOpacity
                    key={d.day}
                    style={[
                      styles.pickerOption,
                      { backgroundColor: dayOfWeek === d.day ? colors.primary + '20' : 'transparent' }
                    ]}
                    onPress={() => {
                      setDayOfWeek(d.day);
                      setShowDayPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { color: dayOfWeek === d.day ? colors.primary : colors.text }
                    ]}>
                      {d.label}
                    </Text>
                    {dayOfWeek === d.day && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Hour Picker Modal */}
      <Modal visible={showHourPicker} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.pickerOverlay} 
          activeOpacity={1} 
          onPress={() => setShowHourPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{t.executionHour}</Text>
              <TouchableOpacity onPress={() => setShowHourPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.pickerOption,
                    { backgroundColor: hour === h ? colors.primary + '20' : 'transparent' }
                  ]}
                  onPress={() => {
                    setHour(h);
                    setShowHourPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    { color: hour === h ? colors.primary : colors.text }
                  ]}>
                    {h.toString().padStart(2, '0')}:00
                  </Text>
                  {hour === h && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#33415520',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },
  // Metal Grid
  metalGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metalCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metalIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  metalSymbol: {
    fontSize: 12,
    fontWeight: '600',
  },
  metalName: {
    fontSize: 10,
    marginTop: 2,
  },
  metalAPY: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 4,
  },
  // Input
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  // Options
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Duration Button with APY
  durationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  durationAPY: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  // Days
  daysScroll: {
    marginBottom: 0,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Source Options
  sourceOptions: {
    gap: 10,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  sourceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  infoTexts: {
    flex: 1,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
  },
  createGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Dropdown Button
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#33415530',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#33415515',
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
