// app/(tabs)/portfolio.tsx
// Portfolio Screen - Wallet, Balances, Orders, Transactions, Staking

import { StyleSheet, View, Text, useColorScheme, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { useWallet } from '@/hooks/useWallet';
import { 
  cancelLimitOrder, 
  getStakePositions, 
  createStake,
  getRecurringStakePlans,
  createRecurringStakePlan,
  updateRecurringStakePlan,
  deleteRecurringStakePlan,
  type LimitOrder,
  type StakePosition,
  type Transaction,
  type RecurringStakePlan,
} from '@/services/api';

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

// APY rates by duration
const STAKING_APY: Record<number, Record<string, number>> = {
  3: { AUXG: 3.5, AUXS: 4.0, AUXPT: 3.2, AUXPD: 3.8 },
  6: { AUXG: 5.2, AUXS: 6.0, AUXPT: 4.8, AUXPD: 5.5 },
  12: { AUXG: 7.0, AUXS: 8.5, AUXPT: 6.5, AUXPD: 7.2 },
};

export default function PortfolioScreen() {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme, userEmail, userName } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const insets = useSafeAreaInsets();

  // Wallet
  const { address, isConnected, isConnecting, connect, disconnect, shortAddress } = useWallet();
  
  // Balance store
  const { 
    balance, 
    orders, 
    transactions, 
    isLoadingBalance,
    isLoadingOrders,
    isLoadingTransactions,
    fetchBalance, 
    fetchOrders, 
    fetchTransactions,
    refreshAll 
  } = useBalanceStore();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'orders' | 'history' | 'staking'>('assets');
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [stakePositions, setStakePositions] = useState<StakePosition[]>([]);
  const [recurringPlans, setRecurringPlans] = useState<RecurringStakePlan[]>([]);
  const [isLoadingStakes, setIsLoadingStakes] = useState(false);
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);
  
  // Staking modal state
  const [selectedStakeMetal, setSelectedStakeMetal] = useState<'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD'>('AUXG');
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState<3 | 6 | 12>(3);
  const [isStaking, setIsStaking] = useState(false);
  
  // Recurring stake modal state
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [recurringPaymentSource, setRecurringPaymentSource] = useState<string>('auxm_balance');
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(1); // Monday
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState(1);
  const [recurringHour, setRecurringHour] = useState(9);

  // Fetch stake positions
  const fetchStakePositions = useCallback(async () => {
    if (!address) return;
    setIsLoadingStakes(true);
    try {
      const positions = await getStakePositions(address);
      setStakePositions(positions);
    } catch (error) {
      console.error('Failed to fetch stake positions:', error);
    } finally {
      setIsLoadingStakes(false);
    }
  }, [address]);

  // Fetch recurring stake plans
  const fetchRecurringPlans = useCallback(async () => {
    if (!address) return;
    setIsLoadingRecurring(true);
    try {
      const plans = await getRecurringStakePlans(address);
      setRecurringPlans(plans);
    } catch (error) {
      console.error('Failed to fetch recurring plans:', error);
    } finally {
      setIsLoadingRecurring(false);
    }
  }, [address]);

  // Load data when address changes
  useEffect(() => {
    if (address) {
      refreshAll();
      fetchStakePositions();
      fetchRecurringPlans();
    }
  }, [address]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshAll(),
      fetchStakePositions(),
      fetchRecurringPlans(),
    ]);
    setRefreshing(false);
  }, [refreshAll, fetchStakePositions, fetchRecurringPlans]);

  // Handle connect
  const handleConnect = async () => {
    if (!addressInput.trim()) {
      Alert.alert('Hata', 'Lütfen cüzdan adresi girin');
      return;
    }
    await connect(addressInput.trim());
    setConnectModalVisible(false);
    setAddressInput('');
  };

  // Handle disconnect
  const handleDisconnect = () => {
    Alert.alert(
      'Bağlantıyı Kes',
      'Cüzdan bağlantısını kesmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kes', style: 'destructive', onPress: disconnect },
      ]
    );
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (!address) return;
    
    Alert.alert(
      'Emri İptal Et',
      'Bu emri iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelLimitOrder(orderId, address);
            if (result.success) {
              fetchOrders('pending');
              Alert.alert('Başarılı', 'Emir iptal edildi');
            } else {
              Alert.alert('Hata', result.error || 'İptal başarısız');
            }
          },
        },
      ]
    );
  };

  // Handle create stake
  const handleCreateStake = async () => {
    if (!address) return;
    
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin');
      return;
    }

    // Check balance
    const metalKey = selectedStakeMetal.toLowerCase() as keyof typeof balance;
    const metalBalance = balance?.[metalKey] || 0;
    if (amount > metalBalance) {
      Alert.alert('Hata', `Yetersiz ${selectedStakeMetal} bakiyesi`);
      return;
    }

    setIsStaking(true);
    try {
      const result = await createStake({
        email: userEmail || undefined,
        holderName: userName || undefined,
        address,
        metal: selectedStakeMetal,
        amount,
        duration: stakeDuration,
        apy: STAKING_APY[stakeDuration][selectedStakeMetal]?.toString(),
      });

      if (result.success) {
        Alert.alert(
          'Başarılı',
          `${amount}g ${selectedStakeMetal} ${stakeDuration} ay süreyle stake edildi.\nAPY: %${STAKING_APY[stakeDuration][selectedStakeMetal]}`,
          [{ text: 'Tamam', onPress: () => {
            setStakeModalVisible(false);
            setStakeAmount('');
            fetchStakePositions();
            fetchBalance();
          }}]
        );
      } else {
        Alert.alert('Hata', result.error || 'Stake başarısız');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Stake işlemi başarısız');
    } finally {
      setIsStaking(false);
    }
  };

  // Handle create recurring stake plan
  const handleCreateRecurringPlan = async () => {
    if (!address) return;
    
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin');
      return;
    }

    setIsStaking(true);
    try {
      const result = await createRecurringStakePlan({
        address,
        metal: selectedStakeMetal,
        amount,
        frequency: recurringFrequency,
        stakeDuration: stakeDuration,
        paymentSource: recurringPaymentSource,
        dayOfWeek: recurringFrequency !== 'monthly' ? recurringDayOfWeek : undefined,
        dayOfMonth: recurringFrequency === 'monthly' ? recurringDayOfMonth : undefined,
        hour: recurringHour,
      });

      if (result.success) {
        const freqText = recurringFrequency === 'weekly' ? 'Haftalık' : 
                         recurringFrequency === 'biweekly' ? 'İki haftada bir' : 'Aylık';
        Alert.alert(
          'Başarılı',
          `${freqText} ${amount}g ${selectedStakeMetal} biriktirme planı oluşturuldu`,
          [{ text: 'Tamam', onPress: () => {
            setRecurringModalVisible(false);
            setStakeAmount('');
            fetchRecurringPlans();
          }}]
        );
      } else {
        Alert.alert('Hata', result.error || 'Plan oluşturulamadı');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'İşlem başarısız');
    } finally {
      setIsStaking(false);
    }
  };

  // Handle pause/resume/cancel recurring plan
  const handleUpdateRecurringPlan = async (planId: string, action: 'pause' | 'resume' | 'cancel') => {
    if (!address) return;
    
    const actionText = action === 'pause' ? 'duraklatmak' : 
                       action === 'resume' ? 'devam ettirmek' : 'iptal etmek';
    
    Alert.alert(
      'Onay',
      `Bu planı ${actionText} istediğinize emin misiniz?`,
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            const result = await updateRecurringStakePlan(address, planId, action);
            if (result.success) {
              fetchRecurringPlans();
            } else {
              Alert.alert('Hata', result.error || 'İşlem başarısız');
            }
          },
        },
      ]
    );
  };

  // Handle delete recurring plan
  const handleDeleteRecurringPlan = async (planId: string) => {
    if (!address) return;
    
    Alert.alert(
      'Planı Sil',
      'Bu biriktirme planını silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteRecurringStakePlan(address, planId);
            if (result.success) {
              fetchRecurringPlans();
              Alert.alert('Başarılı', 'Plan silindi');
            } else {
              Alert.alert('Hata', result.error || 'Silinemedi');
            }
          },
        },
      ]
    );
  };

  // Format helpers
  const formatBalance = (value: number) => {
    if (value >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (value >= 1) return value.toFixed(2);
    if (value > 0) return value.toFixed(4);
    return '0.00';
  };

  const formatDate = (timestamp: number | string) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Wallet Header
  const renderWalletHeader = () => (
    <View style={[styles.walletHeader, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
      {isConnected ? (
        <>
          <View style={styles.walletInfo}>
            <View style={[styles.walletIcon, { backgroundColor: '#10b981' }]}>
              <Ionicons name="wallet" size={20} color="#fff" />
            </View>
            <View>
              <Text style={[styles.walletLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Bağlı Cüzdan</Text>
              <Text style={[styles.walletAddress, { color: isDark ? '#fff' : '#0f172a' }]}>{shortAddress}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity 
          style={[styles.connectButton, { backgroundColor: '#10b981' }]}
          onPress={() => setConnectModalVisible(true)}
        >
          <Ionicons name="wallet-outline" size={20} color="#fff" />
          <Text style={styles.connectButtonText}>Cüzdan Bağla</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Total Value Card
  const renderTotalValue = () => {
    if (!isConnected || !balance) return null;

    // Calculate total value (simplified - should use real prices)
    const totalAUXM = (balance.auxm || 0) + (balance.bonusAuxm || 0);
    
    return (
      <View style={[styles.totalCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.totalLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Toplam AUXM Bakiyesi</Text>
        <Text style={[styles.totalValue, { color: '#10b981' }]}>${formatBalance(totalAUXM)}</Text>
        {balance.bonusAuxm > 0 && (
          <Text style={[styles.bonusText, { color: '#a855f7' }]}>
            +${formatBalance(balance.bonusAuxm)} Bonus
          </Text>
        )}
      </View>
    );
  };

  // Tab Switcher
  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
      {[
        { key: 'assets', label: 'Varlıklar', icon: 'pie-chart' },
        { key: 'orders', label: 'Emirler', icon: 'list' },
        { key: 'history', label: 'Geçmiş', icon: 'time' },
        { key: 'staking', label: 'Staking', icon: 'lock-closed' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={16} 
            color={activeTab === tab.key ? '#10b981' : (isDark ? '#64748b' : '#94a3b8')} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === tab.key ? '#10b981' : (isDark ? '#64748b' : '#94a3b8') }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Assets List
  const renderAssets = () => {
    if (!balance) return null;

    const assets = [
      { symbol: 'AUXM', name: 'Auxite Para', balance: balance.auxm, color: '#A855F7', isToken: true },
      { symbol: 'AUXG', name: 'Gold', balance: balance.auxg, color: '#EAB308', unit: 'g' },
      { symbol: 'AUXS', name: 'Silver', balance: balance.auxs, color: '#94A3B8', unit: 'g' },
      { symbol: 'AUXPT', name: 'Platinum', balance: balance.auxpt, color: '#E2E8F0', unit: 'g' },
      { symbol: 'AUXPD', name: 'Palladium', balance: balance.auxpd, color: '#64748B', unit: 'g' },
      { symbol: 'ETH', name: 'Ethereum', balance: balance.eth, color: '#627EEA', unit: '' },
      { symbol: 'BTC', name: 'Bitcoin', balance: balance.btc, color: '#F7931A', unit: '' },
      { symbol: 'USDT', name: 'Tether', balance: balance.usdt, color: '#26A17B', unit: '' },
    ].filter(a => a.balance > 0 || ['AUXM', 'AUXG', 'AUXS'].includes(a.symbol));

    return (
      <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Varlıklarım</Text>
        {isLoadingBalance ? (
          <ActivityIndicator color="#10b981" style={{ padding: 20 }} />
        ) : (
          assets.map((asset) => (
            <View key={asset.symbol} style={[styles.assetRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <View style={styles.assetLeft}>
                <View style={[styles.assetIcon, { backgroundColor: asset.color + '20' }]}>
                  {metalIcons[asset.symbol] ? (
                    <Image source={metalIcons[asset.symbol]} style={styles.assetImage} resizeMode="contain" />
                  ) : asset.symbol === 'AUXM' ? (
                    <View style={[styles.auxmIcon, { backgroundColor: '#A855F7' }]}>
                      <Text style={styles.auxmIconText}>◇</Text>
                    </View>
                  ) : (
                    <Text style={[styles.cryptoIcon, { color: asset.color }]}>
                      {asset.symbol === 'ETH' ? 'Ξ' : asset.symbol === 'BTC' ? '₿' : asset.symbol === 'USDT' ? '₮' : '?'}
                    </Text>
                  )}
                </View>
                <View>
                  <Text style={[styles.assetSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{asset.symbol}</Text>
                  <Text style={[styles.assetName, { color: isDark ? '#64748b' : '#94a3b8' }]}>{asset.name}</Text>
                </View>
              </View>
              <Text style={[styles.assetBalance, { color: isDark ? '#fff' : '#0f172a' }]}>
                {formatBalance(asset.balance)}{asset.unit}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  };

  // Orders List
  const renderOrders = () => (
    <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Bekleyen Emirler</Text>
        <TouchableOpacity onPress={() => fetchOrders('pending')}>
          <Ionicons name="refresh" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
      
      {isLoadingOrders ? (
        <ActivityIndicator color="#10b981" style={{ padding: 20 }} />
      ) : orders.length === 0 ? (
        <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          Bekleyen emir yok
        </Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={[styles.orderRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
            <View style={styles.orderLeft}>
              <View style={[
                styles.orderBadge, 
                { backgroundColor: order.type === 'buy' ? '#10b98120' : '#ef444420' }
              ]}>
                <Text style={[
                  styles.orderBadgeText, 
                  { color: order.type === 'buy' ? '#10b981' : '#ef4444' }
                ]}>
                  {order.type === 'buy' ? 'AL' : 'SAT'}
                </Text>
              </View>
              <View>
                <Text style={[styles.orderMetal, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {order.grams.toFixed(2)}g {order.metal}
                </Text>
                <Text style={[styles.orderPrice, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  @ ${order.limitPrice.toFixed(2)}/g
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleCancelOrder(order.id)}
              style={styles.cancelButton}
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  // Transaction History
  const renderHistory = () => (
    <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>İşlem Geçmişi</Text>
        <TouchableOpacity onPress={() => fetchTransactions()}>
          <Ionicons name="refresh" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
      
      {isLoadingTransactions ? (
        <ActivityIndicator color="#10b981" style={{ padding: 20 }} />
      ) : transactions.length === 0 ? (
        <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          Henüz işlem yok
        </Text>
      ) : (
        transactions.slice(0, 20).map((tx) => (
          <View key={tx.id} style={[styles.txRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
            <View style={styles.txLeft}>
              <View style={[
                styles.txIcon, 
                { backgroundColor: tx.type === 'buy' ? '#10b98120' : tx.type === 'sell' ? '#ef444420' : '#3b82f620' }
              ]}>
                <Ionicons 
                  name={tx.type === 'buy' ? 'arrow-down' : tx.type === 'sell' ? 'arrow-up' : 'swap-horizontal'} 
                  size={16} 
                  color={tx.type === 'buy' ? '#10b981' : tx.type === 'sell' ? '#ef4444' : '#3b82f6'} 
                />
              </View>
              <View>
                <Text style={[styles.txType, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {tx.fromToken} → {tx.toToken}
                </Text>
                <Text style={[styles.txDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  {formatDate(tx.timestamp)}
                </Text>
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: '#10b981' }]}>
                +{formatBalance(tx.toAmount)} {tx.toToken}
              </Text>
              <Text style={[styles.txFromAmount, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                -{formatBalance(tx.fromAmount)} {tx.fromToken}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  // Staking Section
  // Helper: Frequency text
  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Haftalık';
      case 'biweekly': return '2 Haftada Bir';
      case 'monthly': return 'Aylık';
      default: return freq;
    }
  };

  // Helper: Day of week text
  const getDayText = (day: number) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[day] || '';
  };

  // Staking Section
  const renderStaking = () => (
    <View>
      {/* Create Buttons */}
      <View style={styles.stakingButtons}>
        <TouchableOpacity
          style={[styles.createStakeButton, { backgroundColor: '#10b981', flex: 1 }]}
          onPress={() => setStakeModalVisible(true)}
          disabled={!isConnected}
        >
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={styles.createStakeButtonText}>Tek Seferlik</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.createStakeButton, { backgroundColor: '#8b5cf6', flex: 1 }]}
          onPress={() => setRecurringModalVisible(true)}
          disabled={!isConnected}
        >
          <Ionicons name="repeat" size={18} color="#fff" />
          <Text style={styles.createStakeButtonText}>Düzenli Biriktir</Text>
        </TouchableOpacity>
      </View>

      {/* Recurring Plans */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
            Düzenli Biriktirme Planları
          </Text>
          <TouchableOpacity onPress={fetchRecurringPlans}>
            <Ionicons name="refresh" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
          </TouchableOpacity>
        </View>

        {isLoadingRecurring ? (
          <ActivityIndicator color="#8b5cf6" style={{ padding: 20 }} />
        ) : recurringPlans.length === 0 ? (
          <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            Henüz biriktirme planı yok
          </Text>
        ) : (
          recurringPlans.map((plan) => (
            <View key={plan.id} style={[styles.recurringRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <View style={styles.recurringTop}>
                <View style={styles.recurringInfo}>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: plan.status === 'active' ? '#10b98120' : '#f59e0b20' }
                  ]}>
                    <Ionicons 
                      name={plan.status === 'active' ? 'play' : 'pause'} 
                      size={12} 
                      color={plan.status === 'active' ? '#10b981' : '#f59e0b'} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.recurringMetal, { color: isDark ? '#fff' : '#0f172a' }]}>
                      {plan.amount}g {plan.token} / {getFrequencyText(plan.frequency)}
                    </Text>
                    <Text style={[styles.recurringDetail, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                      {plan.stakeDuration} ay stake • {plan.stats.executionCount} kez çalıştı
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => handleDeleteRecurringPlan(plan.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.recurringStats}>
                <View style={styles.recurringStat}>
                  <Text style={[styles.recurringStatLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Toplam Stake</Text>
                  <Text style={[styles.recurringStatValue, { color: '#10b981' }]}>{plan.stats.totalStaked.toFixed(2)}g</Text>
                </View>
                <View style={styles.recurringStat}>
                  <Text style={[styles.recurringStatLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Sonraki</Text>
                  <Text style={[styles.recurringStatValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                    {plan.stats.nextExecutionAt ? new Date(plan.stats.nextExecutionAt).toLocaleDateString('tr-TR') : '-'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.recurringActions}>
                {plan.status === 'active' ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#f59e0b20' }]}
                    onPress={() => handleUpdateRecurringPlan(plan.id, 'pause')}
                  >
                    <Ionicons name="pause" size={14} color="#f59e0b" />
                    <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Duraklat</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#10b98120' }]}
                    onPress={() => handleUpdateRecurringPlan(plan.id, 'resume')}
                  >
                    <Ionicons name="play" size={14} color="#10b981" />
                    <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Devam Et</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Active Stake Positions */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Aktif Stake Pozisyonları</Text>
          <TouchableOpacity onPress={fetchStakePositions}>
            <Ionicons name="refresh" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
          </TouchableOpacity>
        </View>

        {isLoadingStakes ? (
          <ActivityIndicator color="#10b981" style={{ padding: 20 }} />
        ) : stakePositions.length === 0 ? (
          <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            Aktif stake pozisyonu yok
          </Text>
        ) : (
          stakePositions.map((pos) => (
            <View key={pos.id} style={[styles.stakeRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <View style={styles.stakeLeft}>
                <View style={[styles.stakeBadge, { backgroundColor: '#10b98120' }]}>
                  <Ionicons name="lock-closed" size={16} color="#10b981" />
                </View>
                <View>
                  <Text style={[styles.stakeMetal, { color: isDark ? '#fff' : '#0f172a' }]}>
                    {pos.amount.toFixed(2)}g {pos.token}
                  </Text>
                  <Text style={[styles.stakeApy, { color: '#10b981' }]}>
                    APY: %{pos.apy.toFixed(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.stakeRight}>
                <Text style={[styles.stakeEarned, { color: '#a855f7' }]}>
                  +{pos.earnedRewards.toFixed(4)}g
                </Text>
                <Text style={[styles.stakeEndDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  {formatDate(pos.endDate)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* APY Info */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Staking APY Oranları</Text>
        <View style={styles.apyTable}>
          <View style={styles.apyHeader}>
            <Text style={[styles.apyHeaderText, { color: isDark ? '#64748b' : '#94a3b8', flex: 1 }]}>Metal</Text>
            <Text style={[styles.apyHeaderText, { color: isDark ? '#64748b' : '#94a3b8', width: 60 }]}>3 Ay</Text>
            <Text style={[styles.apyHeaderText, { color: isDark ? '#64748b' : '#94a3b8', width: 60 }]}>6 Ay</Text>
            <Text style={[styles.apyHeaderText, { color: isDark ? '#64748b' : '#94a3b8', width: 60 }]}>12 Ay</Text>
          </View>
          {['AUXG', 'AUXS', 'AUXPT', 'AUXPD'].map((metal) => (
            <View key={metal} style={styles.apyRow}>
              <Text style={[styles.apyMetal, { color: isDark ? '#fff' : '#0f172a', flex: 1 }]}>{metal}</Text>
              <Text style={[styles.apyValue, { color: '#10b981', width: 60 }]}>%{STAKING_APY[3][metal]}</Text>
              <Text style={[styles.apyValue, { color: '#10b981', width: 60 }]}>%{STAKING_APY[6][metal]}</Text>
              <Text style={[styles.apyValue, { color: '#10b981', width: 60 }]}>%{STAKING_APY[12][metal]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Wallet Header */}
        {renderWalletHeader()}

        {isConnected ? (
          <>
            {/* Total Value */}
            {renderTotalValue()}

            {/* Tabs */}
            {renderTabs()}

            {/* Tab Content */}
            {activeTab === 'assets' && renderAssets()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'staking' && renderStaking()}
          </>
        ) : (
          <View style={styles.notConnected}>
            <Ionicons name="wallet-outline" size={64} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text style={[styles.notConnectedText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              Varlıklarınızı görüntülemek için cüzdanınızı bağlayın
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Connect Modal */}
      <Modal
        visible={connectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConnectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Cüzdan Bağla</Text>
              <TouchableOpacity onPress={() => setConnectModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Cüzdan Adresi</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                color: isDark ? '#fff' : '#0f172a',
                borderColor: isDark ? '#334155' : '#e2e8f0'
              }]}
              placeholder="0x..."
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              value={addressInput}
              onChangeText={setAddressInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#10b981' }]}
              onPress={handleConnect}
            >
              <Text style={styles.modalButtonText}>Bağlan</Text>
            </TouchableOpacity>

            <Text style={[styles.modalHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              Ethereum veya Base ağı üzerindeki cüzdan adresinizi girin
            </Text>
          </View>
        </View>
      </Modal>

      {/* Stake Modal */}
      <Modal
        visible={stakeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStakeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Yeni Stake</Text>
              <TouchableOpacity onPress={() => setStakeModalVisible(false)}>
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
                    selectedStakeMetal === metal && styles.metalOptionActive,
                    { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                  ]}
                  onPress={() => setSelectedStakeMetal(metal)}
                >
                  <Text style={[
                    styles.metalOptionText,
                    { color: selectedStakeMetal === metal ? '#10b981' : (isDark ? '#fff' : '#0f172a') }
                  ]}>
                    {metal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Miktar (Bakiye: {formatBalance(balance?.[selectedStakeMetal.toLowerCase() as keyof typeof balance] || 0)}g)
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                color: isDark ? '#fff' : '#0f172a',
                borderColor: isDark ? '#334155' : '#e2e8f0'
              }]}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              value={stakeAmount}
              onChangeText={setStakeAmount}
              keyboardType="decimal-pad"
            />

            {/* Duration */}
            <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Süre</Text>
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
                    { color: stakeDuration === months ? '#10b981' : (isDark ? '#fff' : '#0f172a') }
                  ]}>
                    {months} Ay
                  </Text>
                  <Text style={[styles.durationApy, { color: '#10b981' }]}>
                    %{STAKING_APY[months][selectedStakeMetal]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Expected Returns */}
            {stakeAmount && parseFloat(stakeAmount) > 0 && (
              <View style={[styles.expectedReturns, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                <Text style={[styles.expectedLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Tahmini Kazanç ({stakeDuration} ay)
                </Text>
                <Text style={[styles.expectedValue, { color: '#10b981' }]}>
                  +{(parseFloat(stakeAmount) * STAKING_APY[stakeDuration][selectedStakeMetal] / 100 * (stakeDuration / 12)).toFixed(4)}g {selectedStakeMetal}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#10b981', opacity: isStaking ? 0.7 : 1 }]}
              onPress={handleCreateStake}
              disabled={isStaking}
            >
              <Text style={styles.modalButtonText}>
                {isStaking ? 'İşleniyor...' : 'Stake Et'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.modalHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              Stake işlemi on-chain gerçekleştirilecektir. Gas ücreti ödemeniz gerekebilir.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Recurring Stake Modal */}
      <Modal
        visible={recurringModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRecurringModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Düzenli Biriktirme Planı</Text>
                <TouchableOpacity onPress={() => setRecurringModalVisible(false)}>
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
                      selectedStakeMetal === metal && styles.metalOptionActive,
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setSelectedStakeMetal(metal)}
                  >
                    <Text style={[
                      styles.metalOptionText,
                      { color: selectedStakeMetal === metal ? '#8b5cf6' : (isDark ? '#fff' : '#0f172a') }
                    ]}>
                      {metal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount per execution */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Her Seferinde Biriktirme Miktarı (gram)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                  color: isDark ? '#fff' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#e2e8f0'
                }]}
                placeholder="1.00"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={stakeAmount}
                onChangeText={setStakeAmount}
                keyboardType="decimal-pad"
              />

              {/* Frequency */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Sıklık</Text>
              <View style={styles.durationSelector}>
                {([
                  { value: 'weekly', label: 'Haftalık' },
                  { value: 'biweekly', label: '2 Haftada 1' },
                  { value: 'monthly', label: 'Aylık' },
                ] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.durationOption,
                      recurringFrequency === freq.value && styles.durationOptionActive,
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setRecurringFrequency(freq.value)}
                  >
                    <Text style={[
                      styles.durationText,
                      { color: recurringFrequency === freq.value ? '#8b5cf6' : (isDark ? '#fff' : '#0f172a') }
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Day Selection */}
              {recurringFrequency !== 'monthly' ? (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Gün</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                    {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayOption,
                          recurringDayOfWeek === index && styles.dayOptionActive,
                          { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                        ]}
                        onPress={() => setRecurringDayOfWeek(index)}
                      >
                        <Text style={[
                          styles.dayText,
                          { color: recurringDayOfWeek === index ? '#8b5cf6' : (isDark ? '#fff' : '#0f172a') }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Ayın Günü</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                      color: isDark ? '#fff' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#e2e8f0'
                    }]}
                    placeholder="1"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    value={String(recurringDayOfMonth)}
                    onChangeText={(v) => setRecurringDayOfMonth(Math.min(31, Math.max(1, parseInt(v) || 1)))}
                    keyboardType="number-pad"
                  />
                </>
              )}

              {/* Stake Duration */}
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
                      { color: stakeDuration === months ? '#8b5cf6' : (isDark ? '#fff' : '#0f172a') }
                    ]}>
                      {months} Ay
                    </Text>
                    <Text style={[styles.durationApy, { color: '#10b981' }]}>
                      %{STAKING_APY[months][selectedStakeMetal]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Source */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Ödeme Kaynağı</Text>
              <View style={styles.paymentSelector}>
                {[
                  { value: 'metal_balance', label: 'Metal Bakiyesi' },
                  { value: 'auxm_balance', label: 'AUXM' },
                  { value: 'usdt_balance', label: 'USDT' },
                  { value: 'usd_balance', label: 'USD' },
                ].map((source) => (
                  <TouchableOpacity
                    key={source.value}
                    style={[
                      styles.paymentOption,
                      recurringPaymentSource === source.value && styles.paymentOptionActive,
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setRecurringPaymentSource(source.value)}
                  >
                    <Text style={[
                      styles.paymentText,
                      { color: recurringPaymentSource === source.value ? '#8b5cf6' : (isDark ? '#fff' : '#0f172a') }
                    ]}>
                      {source.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#8b5cf6', opacity: isStaking ? 0.7 : 1 }]}
                onPress={handleCreateRecurringPlan}
                disabled={isStaking}
              >
                <Text style={styles.modalButtonText}>
                  {isStaking ? 'Oluşturuluyor...' : 'Plan Oluştur'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.modalHint, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Plan belirlenen zamanda otomatik olarak çalışacaktır. Metal bakiyeniz yetersizse seçilen ödeme kaynağından alım yapılır.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // Wallet Header
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  walletInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontSize: 11 },
  walletAddress: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  disconnectButton: { padding: 8 },
  connectButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
  },
  connectButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Total Card
  totalCard: { 
    marginHorizontal: 16, 
    marginTop: 12, 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  totalLabel: { fontSize: 12 },
  totalValue: { fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  bonusText: { fontSize: 12, marginTop: 4 },

  // Tabs
  tabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginTop: 12,
    borderRadius: 10, 
    padding: 4 
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10, 
    borderRadius: 8 
  },
  activeTab: { backgroundColor: '#10b98120' },
  tabText: { fontSize: 11, fontWeight: '600' },

  // Section
  section: { 
    marginHorizontal: 16, 
    marginTop: 12, 
    padding: 16, 
    borderRadius: 12 
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  emptyText: { textAlign: 'center', padding: 20, fontSize: 13 },

  // Asset Row
  assetRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  assetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  assetImage: { width: 24, height: 24 },
  auxmIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  auxmIconText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cryptoIcon: { fontSize: 18, fontWeight: 'bold' },
  assetSymbol: { fontSize: 14, fontWeight: '600' },
  assetName: { fontSize: 11, marginTop: 2 },
  assetBalance: { fontSize: 14, fontWeight: '600' },

  // Order Row
  orderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  orderBadgeText: { fontSize: 10, fontWeight: '700' },
  orderMetal: { fontSize: 13, fontWeight: '600' },
  orderPrice: { fontSize: 11, marginTop: 2 },
  cancelButton: { padding: 4 },

  // Transaction Row
  txRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txType: { fontSize: 13, fontWeight: '600' },
  txDate: { fontSize: 10, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontWeight: '600' },
  txFromAmount: { fontSize: 10, marginTop: 2 },

  // Staking
  createStakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
  },
  createStakeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  stakeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  stakeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stakeBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stakeMetal: { fontSize: 13, fontWeight: '600' },
  stakeApy: { fontSize: 11, marginTop: 2 },
  stakeRight: { alignItems: 'flex-end' },
  stakeEarned: { fontSize: 13, fontWeight: '600' },
  stakeEndDate: { fontSize: 10, marginTop: 2 },

  // APY Table
  apyTable: { marginTop: 8 },
  apyHeader: { flexDirection: 'row', paddingVertical: 8 },
  apyHeaderText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  apyRow: { flexDirection: 'row', paddingVertical: 8 },
  apyMetal: { fontSize: 12, fontWeight: '600' },
  apyValue: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Not Connected
  notConnected: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  notConnectedText: { fontSize: 14, textAlign: 'center', marginTop: 16 },

  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  inputLabel: { fontSize: 12, marginBottom: 8, marginTop: 12 },
  input: { 
    fontSize: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 10,
    borderWidth: 1,
  },
  modalButton: { 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalHint: { fontSize: 11, textAlign: 'center', marginTop: 12 },

  // Metal/Duration Selector
  metalSelector: { flexDirection: 'row', gap: 8 },
  metalOption: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  metalOptionActive: { borderWidth: 2, borderColor: '#10b981' },
  metalOptionText: { fontSize: 12, fontWeight: '600' },

  durationSelector: { flexDirection: 'row', gap: 8 },
  durationOption: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  durationOptionActive: { borderWidth: 2, borderColor: '#10b981' },
  durationText: { fontSize: 12, fontWeight: '600' },
  durationApy: { fontSize: 10, marginTop: 4 },

  expectedReturns: { 
    padding: 16, 
    borderRadius: 10, 
    marginTop: 16,
    alignItems: 'center',
  },
  expectedLabel: { fontSize: 11 },
  expectedValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },

  // Staking Buttons
  stakingButtons: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },

  // Recurring Stake Row
  recurringRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recurringTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringMetal: { fontSize: 13, fontWeight: '600' },
  recurringDetail: { fontSize: 11, marginTop: 2 },
  deleteButton: { padding: 4 },
  recurringStats: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  recurringStat: {},
  recurringStatLabel: { fontSize: 10 },
  recurringStatValue: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  recurringActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: { fontSize: 11, fontWeight: '600' },

  // Day Selector
  daySelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  dayOptionActive: { borderWidth: 2, borderColor: '#8b5cf6' },
  dayText: { fontSize: 12, fontWeight: '600' },

  // Payment Source Selector
  paymentSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  paymentOptionActive: { borderWidth: 2, borderColor: '#8b5cf6' },
  paymentText: { fontSize: 12, fontWeight: '600' },
});
