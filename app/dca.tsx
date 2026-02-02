// app/(tabs)/dca.tsx
// DCA (Dollar Cost Averaging) - Düzenli Alım Sayfası

import { StyleSheet, View, Text, useColorScheme, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { useWallet } from '@/hooks/useWallet';
import { 
  getRecurringBuyPlans,
  createRecurringBuyPlan,
  updateRecurringBuyPlan,
  deleteRecurringBuyPlan,
  type RecurringBuyPlan,
} from '@/services/api';

// APY rates by duration (from lease-rates)
const STAKING_APY: Record<number, Record<string, number>> = {
  3: { AUXG: 3.5, AUXS: 4.0, AUXPT: 3.2, AUXPD: 3.8 },
  6: { AUXG: 5.2, AUXS: 6.0, AUXPT: 4.8, AUXPD: 5.5 },
  12: { AUXG: 7.0, AUXS: 8.5, AUXPT: 6.5, AUXPD: 7.2 },
};

export default function DCAScreen() {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const insets = useSafeAreaInsets();

  const { address, isConnected } = useWallet();
  const { balance, fetchBalance } = useBalanceStore();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<RecurringBuyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [selectedMetal, setSelectedMetal] = useState<'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD'>('AUXG');
  const [amount, setAmount] = useState('50');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [paymentSource, setPaymentSource] = useState('usd_balance');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(9);
  const [autoStake, setAutoStake] = useState(false);
  const [stakeDuration, setStakeDuration] = useState<3 | 6 | 12>(6);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const data = await getRecurringBuyPlans(address);
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch DCA plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchPlans();
    }
  }, [address, fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  }, [fetchPlans]);

  // Create plan
  const handleCreatePlan = async () => {
    if (!address) return;
    
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 10) {
      Alert.alert('Hata', 'Minimum miktar $10');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createRecurringBuyPlan({
        address,
        token: selectedMetal,
        amount: amountNum,
        frequency,
        paymentSource,
        dayOfWeek: frequency !== 'monthly' && frequency !== 'daily' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        hour,
        autoStake,
        stakeDuration: autoStake ? stakeDuration : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      });

      if (result.success) {
        Alert.alert('Başarılı', 'Düzenli alım planı oluşturuldu', [
          { text: 'Tamam', onPress: () => {
            setModalVisible(false);
            resetForm();
            fetchPlans();
          }}
        ]);
      } else {
        Alert.alert('Hata', result.error || 'Plan oluşturulamadı');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setAmount('50');
    setSelectedMetal('AUXG');
    setFrequency('weekly');
    setAutoStake(false);
    setMinPrice('');
    setMaxPrice('');
  };

  // Update plan
  const handleUpdatePlan = async (planId: string, action: 'pause' | 'resume' | 'cancel') => {
    if (!address) return;
    
    const actionText = action === 'pause' ? 'duraklatmak' : action === 'resume' ? 'devam ettirmek' : 'iptal etmek';
    
    Alert.alert('Onay', `Bu planı ${actionText} istediğinize emin misiniz?`, [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', onPress: async () => {
        const result = await updateRecurringBuyPlan(address, planId, action);
        if (result.success) {
          fetchPlans();
        } else {
          Alert.alert('Hata', result.error || 'İşlem başarısız');
        }
      }},
    ]);
  };

  // Delete plan
  const handleDeletePlan = async (planId: string) => {
    if (!address) return;
    
    Alert.alert('Planı Sil', 'Bu planı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        const result = await deleteRecurringBuyPlan(address, planId);
        if (result.success) {
          fetchPlans();
        } else {
          Alert.alert('Hata', result.error || 'Silinemedi');
        }
      }},
    ]);
  };

  // Helpers
  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Günlük';
      case 'weekly': return 'Haftalık';
      case 'biweekly': return '2 Haftada 1';
      case 'monthly': return 'Aylık';
      default: return freq;
    }
  };

  const getDayText = (day: number) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[day] || '';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Stats
  const activePlans = plans.filter(p => p.status === 'active');
  const totalMonthlySpend = activePlans.reduce((sum, p) => {
    const mult = { daily: 30, weekly: 4, biweekly: 2, monthly: 1 };
    return sum + (p.amount * mult[p.frequency]);
  }, 0);
  const totalInvested = plans.reduce((sum, p) => sum + p.stats.totalSpent, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isConnected) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
        <Ionicons name="repeat" size={64} color={isDark ? '#334155' : '#cbd5e1'} />
        <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          Düzenli alım planları oluşturmak için cüzdanınızı bağlayın
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>Düzenli Alım (DCA)</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            Otomatik metal biriktirme planları
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Aktif Plan</Text>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{activePlans.length}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Aylık Yatırım</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>${totalMonthlySpend.toFixed(0)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Toplam</Text>
            <Text style={[styles.statValue, { color: '#a855f7' }]}>${totalInvested.toFixed(0)}</Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: '#3b82f6' }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Yeni DCA Planı Oluştur</Text>
        </TouchableOpacity>

        {/* Plans List */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Planlarım</Text>
          
          {isLoading ? (
            <ActivityIndicator color="#3b82f6" style={{ padding: 20 }} />
          ) : plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Henüz düzenli alım planınız yok
              </Text>
            </View>
          ) : (
            plans.map((plan) => (
              <View key={plan.id} style={[styles.planCard, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: plan.status === 'active' ? '#10b981' : plan.status === 'paused' ? '#f59e0b' : '#ef4444' }
                    ]} />
                    <View>
                      <Text style={[styles.planTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                        ${plan.amount} → {plan.token}
                      </Text>
                      <Text style={[styles.planSubtitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        {getFrequencyText(plan.frequency)}
                        {plan.autoStake && ` • Auto-Stake ${plan.stakeDuration}ay`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeletePlan(plan.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* Plan Stats */}
                <View style={styles.planStats}>
                  <View style={styles.planStat}>
                    <Text style={[styles.planStatLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Toplam Alım</Text>
                    <Text style={[styles.planStatValue, { color: '#10b981' }]}>
                      {plan.stats.totalPurchased.toFixed(4)}g
                    </Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={[styles.planStatLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Harcanan</Text>
                    <Text style={[styles.planStatValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                      ${plan.stats.totalSpent.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={[styles.planStatLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Ort. Fiyat</Text>
                    <Text style={[styles.planStatValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                      ${plan.stats.averagePrice.toFixed(2)}/g
                    </Text>
                  </View>
                </View>

                {/* Next Execution */}
                <View style={styles.planNext}>
                  <Ionicons name="time-outline" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
                  <Text style={[styles.planNextText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    Sonraki: {formatDate(plan.stats.nextExecutionAt)}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.planActions}>
                  {plan.status === 'active' ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#f59e0b20' }]}
                      onPress={() => handleUpdatePlan(plan.id, 'pause')}
                    >
                      <Ionicons name="pause" size={14} color="#f59e0b" />
                      <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Duraklat</Text>
                    </TouchableOpacity>
                  ) : plan.status === 'paused' ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#10b98120' }]}
                      onPress={() => handleUpdatePlan(plan.id, 'resume')}
                    >
                      <Ionicons name="play" size={14} color="#10b981" />
                      <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Devam Et</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={[styles.infoText, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
            DCA (Dollar Cost Averaging) stratejisi ile düzenli aralıklarla yatırım yaparak fiyat dalgalanmalarından korunun.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Yeni DCA Planı</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Metal Selection */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Metal Seç</Text>
              <View style={styles.metalSelector}>
                {(['AUXG', 'AUXS', 'AUXPT', 'AUXPD'] as const).map((metal) => (
                  <TouchableOpacity
                    key={metal}
                    style={[
                      styles.metalOption,
                      selectedMetal === metal && styles.metalOptionActive,
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setSelectedMetal(metal)}
                  >
                    <Text style={[
                      styles.metalOptionText,
                      { color: selectedMetal === metal ? '#3b82f6' : (isDark ? '#fff' : '#0f172a') }
                    ]}>
                      {metal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Miktar (USD) - Min: $10
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                  color: isDark ? '#fff' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#e2e8f0'
                }]}
                placeholder="50"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              {/* Frequency */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Sıklık</Text>
              <View style={styles.frequencySelector}>
                {([
                  { value: 'daily', label: 'Günlük' },
                  { value: 'weekly', label: 'Haftalık' },
                  { value: 'biweekly', label: '2 Hafta' },
                  { value: 'monthly', label: 'Aylık' },
                ] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.freqOption,
                      frequency === freq.value && styles.freqOptionActive,
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setFrequency(freq.value)}
                  >
                    <Text style={[
                      styles.freqOptionText,
                      { color: frequency === freq.value ? '#3b82f6' : (isDark ? '#fff' : '#0f172a') }
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day Selection */}
              {frequency !== 'daily' && frequency !== 'monthly' && (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Gün</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                    {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayOption,
                          dayOfWeek === index && styles.dayOptionActive,
                          { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                        ]}
                        onPress={() => setDayOfWeek(index)}
                      >
                        <Text style={[
                          styles.dayText,
                          { color: dayOfWeek === index ? '#3b82f6' : (isDark ? '#fff' : '#0f172a') }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {frequency === 'monthly' && (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Ayın Günü (1-31)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                      color: isDark ? '#fff' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#e2e8f0'
                    }]}
                    placeholder="1"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    value={String(dayOfMonth)}
                    onChangeText={(v) => setDayOfMonth(Math.min(31, Math.max(1, parseInt(v) || 1)))}
                    keyboardType="number-pad"
                  />
                </>
              )}

              {/* Auto Stake */}
              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.switchLabel, { color: isDark ? '#fff' : '#0f172a' }]}>Otomatik Stake</Text>
                  <Text style={[styles.switchHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    Alınan metal otomatik stake edilsin
                  </Text>
                </View>
                <Switch
                  value={autoStake}
                  onValueChange={setAutoStake}
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              {autoStake && (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Stake Süresi</Text>
                  <View style={styles.durationSelector}>
                    {([3, 6, 12] as const).map((months) => (
                      <TouchableOpacity
                        key={months}
                        style={[
                          styles.durationOption,
                          stakeDuration === months && styles.durationOptionActive,
                          { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                        ]}
                        onPress={() => setStakeDuration(months)}
                      >
                        <Text style={[
                          styles.durationText,
                          { color: stakeDuration === months ? '#3b82f6' : (isDark ? '#fff' : '#0f172a') }
                        ]}>
                          {months} Ay
                        </Text>
                        <Text style={[styles.durationApy, { color: '#10b981' }]}>
                          %{STAKING_APY[months][selectedMetal]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Price Limits (Optional) */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Fiyat Limitleri (Opsiyonel)
              </Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.priceInput, { 
                    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                    color: isDark ? '#fff' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0'
                  }]}
                  placeholder="Min $/g"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.priceInput, { 
                    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                    color: isDark ? '#fff' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0'
                  }]}
                  placeholder="Max $/g"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Summary */}
              <View style={[styles.summary, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                <Text style={[styles.summaryTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Özet</Text>
                <Text style={[styles.summaryText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Her {getFrequencyText(frequency).toLowerCase()} ${amount} değerinde {selectedMetal} alınacak
                  {autoStake && ` ve ${stakeDuration} ay stake edilecek`}.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3b82f6', opacity: isCreating ? 0.7 : 1 }]}
                onPress={handleCreatePlan}
                disabled={isCreating}
              >
                <Text style={styles.modalButtonText}>
                  {isCreating ? 'Oluşturuluyor...' : 'Plan Oluştur'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },

  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statLabel: { fontSize: 10 },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  section: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12 },

  planCard: { paddingVertical: 16, borderBottomWidth: 1 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  planTitle: { fontSize: 14, fontWeight: '600' },
  planSubtitle: { fontSize: 11, marginTop: 2 },

  planStats: { flexDirection: 'row', marginTop: 12, gap: 16 },
  planStat: {},
  planStatLabel: { fontSize: 10 },
  planStatValue: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  planNext: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  planNextText: { fontSize: 11 },

  planActions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  actionBtnText: { fontSize: 11, fontWeight: '600' },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 10 },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },

  inputLabel: { fontSize: 12, marginBottom: 8, marginTop: 16 },
  input: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1 },

  metalSelector: { flexDirection: 'row', gap: 8 },
  metalOption: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  metalOptionActive: { borderWidth: 2, borderColor: '#3b82f6' },
  metalOptionText: { fontSize: 12, fontWeight: '600' },

  frequencySelector: { flexDirection: 'row', gap: 8 },
  freqOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  freqOptionActive: { borderWidth: 2, borderColor: '#3b82f6' },
  freqOptionText: { fontSize: 11, fontWeight: '600' },

  daySelector: { flexDirection: 'row' },
  dayOption: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginRight: 8 },
  dayOptionActive: { borderWidth: 2, borderColor: '#3b82f6' },
  dayText: { fontSize: 12, fontWeight: '600' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  switchHint: { fontSize: 11, marginTop: 2 },

  durationSelector: { flexDirection: 'row', gap: 8 },
  durationOption: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  durationOptionActive: { borderWidth: 2, borderColor: '#3b82f6' },
  durationText: { fontSize: 12, fontWeight: '600' },
  durationApy: { fontSize: 10, marginTop: 4 },

  priceRow: { flexDirection: 'row', gap: 12 },
  priceInput: { flex: 1, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, borderWidth: 1 },

  summary: { padding: 14, borderRadius: 10, marginTop: 16 },
  summaryTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  summaryText: { fontSize: 12, lineHeight: 18 },

  modalButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
