// components/AllocationModal.tsx
// Stake & Earn Modal for Mobile - Backend API Integration

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

import { useBalanceStore } from '@/stores/useBalanceStore';
import * as Clipboard from 'expo-clipboard';

// Metal icons
const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

// Metal colors
const metalColors: Record<string, string> = {
  AUXG: '#EAB308',
  AUXS: '#94A3B8',
  AUXPT: '#06B6D4',
  AUXPD: '#F43F5E',
};

// Translations
const translations: Record<string, Record<string, string>> = {
  tr: {
    lockEarn: 'Biriktir & Kazan',
    lockPeriod: 'Biriktirme Süresi',
    month: 'Ay',
    days: 'gün',
    amount: 'Miktar',
    balance: 'Bakiye',
    lockSuccess: 'Biriktirme Başarılı!',
    positionCreated: 'Pozisyonunuz oluşturuldu.',
    infoNotice: 'gün boyunca tokenleriniz biriktirilecektir. Süre sonunda anaparanız ve kazancınız otomatik olarak iade edilecektir.',
    locking: 'Biriktiriliyor...',
    cancel: 'İptal',
    estimatedEarnings: 'Tahmini Kazanç',
    afterPeriod: 'Süre sonunda',
    apy: 'APY',
    stakeCode: 'Stake Kodu',
    copyCode: 'Kopyala',
    copied: 'Kopyalandı!',
    compounding: 'Bileşik Faiz',
    compoundingDesc: 'Kazançlar otomatik olarak anaparaya eklenir',
    done: 'Tamam',
    total: 'Toplam',
    minAmount: 'Min.',
  },
  en: {
    lockEarn: 'Stake & Earn',
    lockPeriod: 'Stake Period',
    month: 'Mo',
    days: 'days',
    amount: 'Amount',
    balance: 'Balance',
    lockSuccess: 'Stake Successful!',
    positionCreated: 'Your position has been created.',
    infoNotice: 'days your tokens will be staked. Principal and earnings will be automatically returned after the period ends.',
    locking: 'Staking...',
    cancel: 'Cancel',
    estimatedEarnings: 'Estimated Earnings',
    afterPeriod: 'After period',
    apy: 'APY',
    stakeCode: 'Stake Code',
    copyCode: 'Copy',
    copied: 'Copied!',
    compounding: 'Auto-Compound',
    compoundingDesc: 'Earnings automatically added to principal',
    done: 'Done',
    total: 'Total',
    minAmount: 'Min.',
  },
  de: {
    lockEarn: 'Stake & Verdienen',
    lockPeriod: 'Stake-Zeitraum',
    month: 'Mo',
    days: 'Tage',
    amount: 'Betrag',
    balance: 'Guthaben',
    lockSuccess: 'Stake Erfolgreich!',
    positionCreated: 'Ihre Position wurde erstellt.',
    infoNotice: 'Tage werden Ihre Token gestaked. Kapital und Erträge werden nach Ablauf automatisch zurückgegeben.',
    locking: 'Staking...',
    cancel: 'Abbrechen',
    estimatedEarnings: 'Geschätzte Erträge',
    afterPeriod: 'Nach der Periode',
    apy: 'APY',
    stakeCode: 'Stake-Code',
    copyCode: 'Kopieren',
    copied: 'Kopiert!',
    compounding: 'Auto-Zinseszins',
    compoundingDesc: 'Erträge werden automatisch zum Kapital hinzugefügt',
    done: 'Fertig',
    total: 'Gesamt',
    minAmount: 'Min.',
  },
  fr: {
    lockEarn: 'Stake & Gagner',
    lockPeriod: 'Période de Stake',
    month: 'Mois',
    days: 'jours',
    amount: 'Montant',
    balance: 'Solde',
    lockSuccess: 'Stake Réussi!',
    positionCreated: 'Votre position a été créée.',
    infoNotice: 'jours vos tokens seront stakés. Le capital et les gains seront automatiquement retournés après la période.',
    locking: 'Staking...',
    cancel: 'Annuler',
    estimatedEarnings: 'Gains Estimés',
    afterPeriod: 'Après la période',
    apy: 'APY',
    stakeCode: 'Code de Stake',
    copyCode: 'Copier',
    copied: 'Copié!',
    compounding: 'Auto-Composition',
    compoundingDesc: 'Les gains sont automatiquement ajoutés au capital',
    done: 'Terminé',
    total: 'Total',
    minAmount: 'Min.',
  },
  ar: {
    lockEarn: 'تخزين واربح',
    lockPeriod: 'فترة التخزين',
    month: 'شهر',
    days: 'يوم',
    amount: 'المبلغ',
    balance: 'الرصيد',
    lockSuccess: 'تم التخزين بنجاح!',
    positionCreated: 'تم إنشاء موقعك.',
    infoNotice: 'يوم سيتم تخزين رموزك. سيتم إرجاع رأس المال والأرباح تلقائياً بعد انتهاء الفترة.',
    locking: 'جاري التخزين...',
    cancel: 'إلغاء',
    estimatedEarnings: 'الأرباح المتوقعة',
    afterPeriod: 'بعد الفترة',
    apy: 'العائد السنوي',
    stakeCode: 'رمز التخزين',
    copyCode: 'نسخ',
    copied: 'تم النسخ!',
    compounding: 'فائدة مركبة تلقائية',
    compoundingDesc: 'تضاف الأرباح تلقائياً إلى رأس المال',
    done: 'تم',
    total: 'المجموع',
    minAmount: 'الحد الأدنى',
  },
  ru: {
    lockEarn: 'Стейкинг и Заработок',
    lockPeriod: 'Период Стейкинга',
    month: 'Мес',
    days: 'дней',
    amount: 'Сумма',
    balance: 'Баланс',
    lockSuccess: 'Стейкинг Успешен!',
    positionCreated: 'Ваша позиция создана.',
    infoNotice: 'дней ваши токены будут в стейкинге. Основная сумма и заработок будут автоматически возвращены после окончания периода.',
    locking: 'Стейкинг...',
    cancel: 'Отмена',
    estimatedEarnings: 'Расчетный Заработок',
    afterPeriod: 'После периода',
    apy: 'APY',
    stakeCode: 'Код Стейкинга',
    copyCode: 'Копировать',
    copied: 'Скопировано!',
    compounding: 'Автокомпаундинг',
    compoundingDesc: 'Заработок автоматически добавляется к основной сумме',
    done: 'Готово',
    total: 'Всего',
    minAmount: 'Мин.',
  },
};

interface Period {
  months: number;
  days?: number;
  apy: number;
}

interface Offer {
  metal: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  tvl: number;
  periods: Period[];
}

interface AllocationModalProps {
  visible: boolean;
  onClose: () => void;
  offer: Offer | null;
}

export function AllocationModal({ visible, onClose, offer }: AllocationModalProps) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress, isConnected, userEmail, userName } = useStore();
  const { balance: walletBalance, fetchBalance, setAddress } = useBalanceStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;

  // State
  const [isStaking, setIsStaking] = useState(false);
  
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [amount, setAmount] = useState('');
  const [compounding, setCompounding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stakeCode, setStakeCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [estimatedReward, setEstimatedReward] = useState(0);

  // Get token balance from store
  const getTokenBalance = (metal: string): number => {
    if (!walletBalance) return 0;
    if (metal === 'AUXG') return walletBalance.auxg || 0;
    if (metal === 'AUXS') return walletBalance.auxs || 0;
    if (metal === 'AUXPT') return walletBalance.auxpt || 0;
    if (metal === 'AUXPD') return walletBalance.auxpd || 0;
    return 0;
  };

  // Preview reward calculation
  const previewReward = (metal: string, amount: number, months: number) => {
    const apyRates: Record<string, Record<number, number>> = {
      AUXG: { 3: 1.53, 6: 2.03, 12: 2.53 },
      AUXS: { 3: 1.23, 6: 1.73, 12: 2.23 },
      AUXPT: { 3: 1.83, 6: 2.33, 12: 2.83 },
      AUXPD: { 3: 1.93, 6: 2.43, 12: 2.93 },
    };
    const apyPercent = apyRates[metal]?.[months] || 2.0;
    const days = months === 3 ? 91 : months === 6 ? 181 : 366;
    const expectedRewardGrams = (amount * apyPercent * days) / (100 * 365);
    return { expectedRewardGrams, apyPercent };
  };

  // Fetch balance when modal opens
  useEffect(() => {
    const loadBalance = async () => {
      if (visible && offer && isConnected && walletAddress) {
        setIsLoadingBalance(true);
        // Önce address'i set et ve balance'ı fetch et
        setAddress(walletAddress);
        await fetchBalance();
        setIsLoadingBalance(false);
      }
    };
    loadBalance();
  }, [visible, offer, isConnected, walletAddress]);
  
  // Update local balance when walletBalance changes
  useEffect(() => {
    if (offer && walletBalance) {
      const bal = getTokenBalance(offer.metal);
      setBalance(bal);
    }
  }, [walletBalance, offer]);

  // Calculate estimated reward when amount/period changes
  useEffect(() => {
    const amountNum = parseFloat(amount) || 0;
    if (amountNum > 0 && offer) {
      const { expectedRewardGrams } = previewReward(offer.metal, amountNum, selectedPeriod);
      setEstimatedReward(expectedRewardGrams);
    } else {
      setEstimatedReward(0);
    }
  }, [amount, selectedPeriod, offer]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPeriod(3);
      setAmount('');
      setCompounding(false);
      setIsSuccess(false);
      setStakeCode(null);
      setEstimatedReward(0);
    }
  }, [visible]);

  if (!offer) return null;

  const amountNum = parseFloat(amount) || 0;
  const currentPeriod = offer.periods.find(p => p.months === selectedPeriod) || offer.periods[0];
  const periodDays = currentPeriod.days || (selectedPeriod === 12 ? 365 : selectedPeriod * 30);
  const earnings = estimatedReward > 0 ? estimatedReward : (amountNum * currentPeriod.apy * periodDays) / (100 * 365);
  const total = amountNum + earnings;
  const maxAPY = Math.max(...offer.periods.map(p => p.apy));
  const isWalletConnected = isConnected && walletAddress;

  // Handle stake
  const handleStake = async () => {
    if (!offer) return;

    if (!isWalletConnected) {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', 
        language === 'tr' ? 'Cüzdan bağlı değil' : 'Wallet not connected');
      return;
    }

    if (amountNum < offer.minAmount) {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', `${t.minAmount} ${offer.minAmount}g`);
      return;
    }

    if (amountNum > balance) {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', 
        language === 'tr' ? 'Yetersiz bakiye' : 'Insufficient balance');
      return;
    }

    setIsStaking(true);
    try {
      const lockDays = selectedPeriod === 3 ? 91 : selectedPeriod === 6 ? 181 : 366;
      const apyRate = selectedPeriod === 3 ? offer.periods[0]?.apy : 
                      selectedPeriod === 6 ? offer.periods[1]?.apy : 
                      offer.periods[2]?.apy;
      
      const response = await fetch(`${API_URL}/api/staking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          address: walletAddress,
          metal: offer.metal,
          amount: amountNum,
          duration: lockDays,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStakeCode(data.position?.id || 'STAKE-' + Date.now());
        setIsSuccess(true);
        // Balance'ı yenile
        await fetchBalance();
        console.log('✅ Stake created:', data.position?.id);
      } else {
        throw new Error(data.error || 'Staking failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Staking failed');
    } finally {
      setIsStaking(false);
    }
  };

  // Handle copy
  const handleCopy = async () => {
    if (stakeCode) {
      await Clipboard.setStringAsync(stakeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // APY Period Button
  const PeriodButton = ({ period }: { period: Period }) => {
    const isSelected = selectedPeriod === period.months;
    const barHeight = (period.apy / maxAPY) * 100;
    const days = period.days || (period.months === 12 ? 365 : period.months * 30);

    return (
      <TouchableOpacity
        style={[
          styles.periodButton,
          { 
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            borderColor: isSelected ? '#10b981' : (isDark ? '#334155' : '#e2e8f0'),
            borderWidth: 2,
          }
        ]}
        onPress={() => setSelectedPeriod(period.months)}
        activeOpacity={0.7}
      >
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar,
              { 
                height: `${barHeight}%`,
                backgroundColor: isSelected ? '#10b981' : (isDark ? '#475569' : '#cbd5e1'),
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.periodMonths,
          { color: isSelected ? '#10b981' : (isDark ? '#e2e8f0' : '#334155') }
        ]}>
          {period.months} {t.month}
        </Text>
        <Text style={[styles.periodDays, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          {days} {t.days}
        </Text>
        <Text style={[
          styles.periodAPY,
          { color: isSelected ? '#10b981' : (isDark ? '#94a3b8' : '#64748b') }
        ]}>
          {period.apy.toFixed(2)}%
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.metalIcon, { backgroundColor: metalColors[offer.metal] + '20' }]}>
                <Image source={metalIcons[offer.metal]} style={styles.metalImage} resizeMode="contain" />
              </View>
              <View>
                <Text style={[styles.metalName, { color: isDark ? '#fff' : '#0f172a' }]}>{offer.metal}</Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.lockEarn}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {!isSuccess ? (
              <>
                {/* Period Selection */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                    {t.lockPeriod}
                  </Text>
                  <View style={styles.periodsGrid}>
                    {offer.periods.map((period) => (
                      <PeriodButton key={period.months} period={period} />
                    ))}
                  </View>
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                      {t.amount}
                    </Text>
                  </View>
                  <View style={[
                    styles.inputContainer,
                    { 
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    }
                  ]}>
                    <TextInput
                      style={[styles.input, { color: isDark ? '#fff' : '#0f172a' }]}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity 
                      style={styles.maxButton}
                      onPress={() => setAmount(balance.toFixed(2))}
                    >
                      <Text style={styles.maxButtonText}>MAX</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.balanceRow}>
                    {isLoadingBalance ? (
                      <View style={styles.balanceLoading}>
                        <ActivityIndicator size="small" color="#10b981" />
                      </View>
                    ) : (
                      <Text style={[styles.balanceText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        {t.balance}: {balance.toFixed(2)} {offer.metal}
                      </Text>
                    )}
                    {amountNum > balance && (
                      <Text style={styles.errorText}>
                        {language === 'tr' ? 'Yetersiz bakiye' : 'Insufficient'}
                      </Text>
                    )}
                  </View>
                  

                </View>

                {/* Compounding Toggle */}
                <View style={[
                  styles.compoundingCard,
                  { 
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: compounding ? '#10b981' : (isDark ? '#334155' : '#e2e8f0'),
                  }
                ]}>
                  <View style={styles.compoundingLeft}>
                    <View style={[styles.compoundingIcon, { backgroundColor: '#10b98120' }]}>
                      <Ionicons name="sync" size={18} color="#10b981" />
                    </View>
                    <View>
                      <Text style={[styles.compoundingTitle, { color: isDark ? '#e2e8f0' : '#334155' }]}>
                        {t.compounding}
                      </Text>
                      <Text style={[styles.compoundingDesc, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        {t.compoundingDesc}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, { backgroundColor: compounding ? '#10b981' : (isDark ? '#334155' : '#cbd5e1') }]}
                    onPress={() => setCompounding(!compounding)}
                  >
                    <View style={[
                      styles.toggleKnob,
                      { marginLeft: compounding ? 22 : 2 }
                    ]} />
                  </TouchableOpacity>
                </View>

                {/* Earnings Calculator */}
                {amountNum > 0 && (
                  <View style={styles.earningsCard}>
                    <LinearGradient
                      colors={isDark ? ['#10b98110', '#10b98105'] : ['#10b98108', '#10b98103']}
                      style={styles.earningsGradient}
                    >
                      <View style={styles.earningsHeader}>
                        <Ionicons name="calculator" size={16} color="#10b981" />
                        <Text style={styles.earningsTitle}>{t.estimatedEarnings}</Text>
                      </View>
                      <View style={styles.earningsGrid}>
                        <View style={styles.earningItem}>
                          <Text style={[styles.earningLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {t.afterPeriod}
                          </Text>
                          <Text style={styles.earningValue}>+{earnings.toFixed(4)}g</Text>
                        </View>
                        <View style={styles.earningItem}>
                          <Text style={[styles.earningLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {t.total}
                          </Text>
                          <Text style={[styles.earningTotal, { color: isDark ? '#fff' : '#0f172a' }]}>
                            {total.toFixed(4)}g
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {/* Info Notice */}
                <View style={[
                  styles.infoNotice,
                  { 
                    backgroundColor: isDark ? '#1e293b' : '#f0fdf4',
                    borderColor: isDark ? '#334155' : '#bbf7d0',
                  }
                ]}>
                  <Ionicons name="information-circle" size={20} color="#10b981" />
                  <Text style={[styles.infoText, { color: isDark ? '#94a3b8' : '#166534' }]}>
                    {periodDays} {t.infoNotice}
                  </Text>
                </View>
              </>
            ) : (
              /* Success State */
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="checkmark" size={40} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {t.lockSuccess}
                </Text>
                <Text style={[styles.successSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.positionCreated}
                </Text>

                {stakeCode && (
                  <View style={[styles.stakeCodeCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <Text style={[styles.stakeCodeLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                      {t.stakeCode}
                    </Text>
                    <View style={styles.stakeCodeRow}>
                      <Text style={[styles.stakeCodeValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                        {stakeCode}
                      </Text>
                      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                        <Ionicons name={copied ? "checkmark" : "copy"} size={14} color="#10b981" />
                        <Text style={styles.copyButtonText}>
                          {copied ? t.copied : t.copyCode}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            {!isSuccess ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.stakeButton,
                    (amountNum < offer.minAmount || isStaking || !isWalletConnected || amountNum > balance) && styles.stakeButtonDisabled
                  ]}
                  onPress={handleStake}
                  disabled={amountNum < offer.minAmount || isStaking || !isWalletConnected || amountNum > balance}
                >
                  <LinearGradient
                    colors={
                      amountNum >= offer.minAmount && !isStaking && isWalletConnected && amountNum <= balance
                        ? ['#10b981', '#059669']
                        : isDark ? ['#334155', '#1e293b'] : ['#cbd5e1', '#94a3b8']
                    }
                    style={styles.stakeButtonGradient}
                  >
                    {isStaking ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.stakeButtonText}>{t.locking}</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={18} color="#fff" />
                        <Text style={styles.stakeButtonText}>{t.lockEarn}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.stakeButtonGradient}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.stakeButtonText}>{t.done}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metalImage: {
    width: 28,
    height: 28,
  },
  metalName: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  barContainer: {
    width: 24,
    height: 40,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  periodMonths: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  periodDays: {
    fontSize: 9,
    marginBottom: 4,
  },
  periodAPY: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 16,
  },
  maxButton: {
    backgroundColor: '#10b98130',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  balanceText: {
    fontSize: 11,
  },
  balanceLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
  },
  compoundingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  compoundingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  compoundingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compoundingTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  compoundingDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  earningsCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  earningsGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningItem: {},
  earningLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  earningValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  earningTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    marginBottom: 24,
  },
  stakeCodeCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
  },
  stakeCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  stakeCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stakeCodeValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b98120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    gap: 10,
  },
  stakeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  stakeButtonDisabled: {
    opacity: 0.7,
  },
  stakeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stakeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default AllocationModal;
