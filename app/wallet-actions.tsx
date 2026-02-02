// app/(tabs)/wallet-actions.tsx
// Deposit & Withdraw - Para Yatır ve Çek

import { StyleSheet, View, Text, useColorScheme, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, Alert, ActivityIndicator, Clipboard } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { useWallet } from '@/hooks/useWallet';
import {
  getDepositAddresses,
  getDepositHistory,
  withdraw,
  get2FAStatus,
  getWhitelist,
  type DepositAddress,
  type WhitelistAddress,
} from '@/services/api';

// Supported coins
const COINS = [
  { symbol: 'ETH', name: 'Ethereum', icon: 'logo-ethereum', color: '#627EEA' },
  { symbol: 'BTC', name: 'Bitcoin', icon: 'logo-bitcoin', color: '#F7931A' },
  { symbol: 'USDT', name: 'Tether', icon: 'cash', color: '#26A17B' },
  { symbol: 'XRP', name: 'Ripple', icon: 'water', color: '#23292F' },
  { symbol: 'SOL', name: 'Solana', icon: 'sunny', color: '#9945FF' },
];

// Network fees (approximate)
const NETWORK_FEES: Record<string, number> = {
  ETH: 7,
  BTC: 10,
  USDT: 5,
  XRP: 0.1,
  SOL: 0.1,
};

export default function WalletActionsScreen() {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const insets = useSafeAreaInsets();
  const { address, isConnected } = useWallet();
  const { balance, fetchBalance } = useBalanceStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [refreshing, setRefreshing] = useState(false);

  // Deposit state
  const [depositAddresses, setDepositAddresses] = useState<Record<string, DepositAddress>>({});
  const [selectedDepositCoin, setSelectedDepositCoin] = useState('ETH');
  const [depositHistory, setDepositHistory] = useState<any[]>([]);

  // Withdraw state
  const [selectedWithdrawCoin, setSelectedWithdrawCoin] = useState('ETH');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawMemo, setWithdrawMemo] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [whitelist, setWhitelist] = useState<WhitelistAddress[]>([]);
  const [showWhitelist, setShowWhitelist] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!address) return;
    
    try {
      const [addresses, history, twoFA, whitelistData] = await Promise.all([
        getDepositAddresses(),
        getDepositHistory(address, 10),
        get2FAStatus(address),
        getWhitelist(address),
      ]);
      
      if (addresses.success && addresses.addresses) {
        setDepositAddresses(addresses.addresses);
      }
      setDepositHistory(history.deposits || []);
      setRequires2FA(twoFA.enabled);
      setWhitelist(whitelistData.addresses || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchBalance(address!)]);
    setRefreshing(false);
  }, [fetchData, fetchBalance, address]);

  // Copy address
  const handleCopyAddress = (addr: string) => {
    Clipboard.setString(addr);
    Alert.alert('Kopyalandı', 'Adres panoya kopyalandı');
  };

  // Select whitelist address
  const handleSelectWhitelist = (whitelistAddr: WhitelistAddress) => {
    setWithdrawAddress(whitelistAddr.address);
    setShowWhitelist(false);
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!address) return;
    
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin');
      return;
    }

    if (!withdrawAddress) {
      Alert.alert('Hata', 'Çekim adresi girin');
      return;
    }

    const fee = NETWORK_FEES[selectedWithdrawCoin] || 5;
    const total = amount + fee;
    const auxmBalance = balance?.auxm || 0;

    if (total > auxmBalance) {
      Alert.alert('Yetersiz Bakiye', `Gerekli: $${total.toFixed(2)} AUXM\nMevcut: $${auxmBalance.toFixed(2)} AUXM`);
      return;
    }

    if (requires2FA && !twoFACode) {
      Alert.alert('2FA Gerekli', 'Lütfen 2FA doğrulama kodunu girin');
      return;
    }

    setIsWithdrawing(true);
    try {
      const result = await withdraw(
        address,
        selectedWithdrawCoin,
        amount,
        withdrawAddress,
        withdrawMemo || undefined,
        twoFACode || undefined
      );

      if (result.success && result.withdrawal) {
        Alert.alert(
          'Çekim Başarılı',
          `${result.withdrawal.cryptoAmount.toFixed(6)} ${selectedWithdrawCoin} gönderildi\n\nTX: ${result.withdrawal.txHash?.slice(0, 20)}...`,
          [{ text: 'Tamam', onPress: () => {
            setWithdrawAmount('');
            setWithdrawAddress('');
            setWithdrawMemo('');
            setTwoFACode('');
            fetchBalance(address);
          }}]
        );
      } else if (result.requires2FA) {
        setRequires2FA(true);
        Alert.alert('2FA Gerekli', 'Lütfen 2FA doğrulama kodunu girin');
      } else {
        Alert.alert('Hata', result.error || 'Çekim başarısız');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Get coin info
  const getCoinInfo = (symbol: string) => {
    return COINS.find(c => c.symbol === symbol) || COINS[0];
  };

  // Calculate preview
  const getWithdrawPreview = () => {
    const amount = parseFloat(withdrawAmount) || 0;
    const fee = NETWORK_FEES[selectedWithdrawCoin] || 5;
    const total = amount + fee;
    
    // Approximate crypto amount (would need real price)
    const cryptoPrices: Record<string, number> = { ETH: 3500, BTC: 97000, USDT: 1, XRP: 2.2, SOL: 200 };
    const cryptoAmount = amount / (cryptoPrices[selectedWithdrawCoin] || 1);
    
    return { amount, fee, total, cryptoAmount };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isConnected) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
        <Ionicons name="wallet" size={64} color={isDark ? '#334155' : '#cbd5e1'} />
        <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          Para yatırma/çekme için cüzdanınızı bağlayın
        </Text>
      </View>
    );
  }

  const preview = getWithdrawPreview();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>Cüzdan İşlemleri</Text>
          <View style={[styles.balanceBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.balanceLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>AUXM Bakiye</Text>
            <Text style={[styles.balanceValue, { color: '#10b981' }]}>
              ${(balance?.auxm || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'deposit' && styles.tabActive]}
            onPress={() => setActiveTab('deposit')}
          >
            <Ionicons name="arrow-down-circle" size={18} color={activeTab === 'deposit' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8')} />
            <Text style={[styles.tabText, { color: activeTab === 'deposit' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8') }]}>
              Yatır
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'withdraw' && styles.tabActive]}
            onPress={() => setActiveTab('withdraw')}
          >
            <Ionicons name="arrow-up-circle" size={18} color={activeTab === 'withdraw' ? '#ef4444' : (isDark ? '#64748b' : '#94a3b8')} />
            <Text style={[styles.tabText, { color: activeTab === 'withdraw' ? '#ef4444' : (isDark ? '#64748b' : '#94a3b8') }]}>
              Çek
            </Text>
          </TouchableOpacity>
        </View>

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <>
            {/* Coin Selection */}
            <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Coin Seç</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinScroll}>
                {COINS.map((coin) => (
                  <TouchableOpacity
                    key={coin.symbol}
                    style={[
                      styles.coinOption,
                      selectedDepositCoin === coin.symbol && { borderColor: coin.color, borderWidth: 2 },
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setSelectedDepositCoin(coin.symbol)}
                  >
                    <Ionicons name={coin.icon as any} size={24} color={coin.color} />
                    <Text style={[styles.coinSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{coin.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Deposit Address */}
            <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {getCoinInfo(selectedDepositCoin).name} Yatırma Adresi
              </Text>
              
              <View style={[styles.addressBox, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                <Text style={[styles.addressText, { color: isDark ? '#fff' : '#0f172a' }]} numberOfLines={2}>
                  {depositAddresses[selectedDepositCoin]?.address || 'Yükleniyor...'}
                </Text>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyAddress(depositAddresses[selectedDepositCoin]?.address || '')}
                >
                  <Ionicons name="copy" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>

              {depositAddresses[selectedDepositCoin]?.network && (
                <View style={styles.networkInfo}>
                  <Ionicons name="information-circle" size={16} color="#f59e0b" />
                  <Text style={[styles.networkText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Network: {depositAddresses[selectedDepositCoin].network}
                  </Text>
                </View>
              )}

              {depositAddresses[selectedDepositCoin]?.memo && (
                <View style={[styles.memoBox, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="warning" size={16} color="#92400e" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#92400e', fontSize: 12, fontWeight: '600' }}>MEMO Gerekli!</Text>
                    <Text style={{ color: '#92400e', fontSize: 11 }}>
                      Memo: {depositAddresses[selectedDepositCoin].memo}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bonus Info */}
            <View style={[styles.bonusCard, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
              <Ionicons name="gift" size={20} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bonusTitle, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
                  AUXM'e Çevir ve Bonus Kazan!
                </Text>
                <Text style={[styles.bonusText, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
                  $100+ → %5 • $1000+ → %10 • $5000+ → %12 • $10000+ → %15
                </Text>
              </View>
            </View>

            {/* Recent Deposits */}
            {depositHistory.length > 0 && (
              <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Son Yatırmalar</Text>
                {depositHistory.slice(0, 5).map((deposit, index) => (
                  <View key={index} style={styles.historyRow}>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyAmount, { color: '#10b981' }]}>
                        +{deposit.amount} {deposit.coin}
                      </Text>
                      <Text style={[styles.historyDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        {new Date(deposit.timestamp).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <Text style={[styles.historyStatus, { color: deposit.status === 'completed' ? '#10b981' : '#f59e0b' }]}>
                      {deposit.status === 'completed' ? '✓' : '⏳'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <>
            {/* Coin Selection */}
            <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Coin Seç</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinScroll}>
                {COINS.filter(c => c.symbol !== 'BTC').map((coin) => (
                  <TouchableOpacity
                    key={coin.symbol}
                    style={[
                      styles.coinOption,
                      selectedWithdrawCoin === coin.symbol && { borderColor: coin.color, borderWidth: 2 },
                      { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }
                    ]}
                    onPress={() => setSelectedWithdrawCoin(coin.symbol)}
                  >
                    <Ionicons name={coin.icon as any} size={24} color={coin.color} />
                    <Text style={[styles.coinSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{coin.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[styles.btcNote, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                * BTC çekimi yakında eklenecek
              </Text>
            </View>

            {/* Withdraw Form */}
            <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Çekim Bilgileri</Text>

              {/* Amount */}
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Miktar (AUXM / USD)</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[styles.input, { 
                    flex: 1,
                    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                    color: isDark ? '#fff' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0'
                  }]}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[styles.maxBtn, { backgroundColor: '#3b82f620' }]}
                  onPress={() => setWithdrawAmount(((balance?.auxm || 0) - (NETWORK_FEES[selectedWithdrawCoin] || 5)).toFixed(2))}
                >
                  <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>MAX</Text>
                </TouchableOpacity>
              </View>

              {/* Address */}
              <View style={styles.addressLabelRow}>
                <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {getCoinInfo(selectedWithdrawCoin).name} Adresi
                </Text>
                {whitelist.length > 0 && (
                  <TouchableOpacity onPress={() => setShowWhitelist(true)}>
                    <Text style={{ color: '#3b82f6', fontSize: 11 }}>Whitelist</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                  color: isDark ? '#fff' : '#0f172a',
                  borderColor: isDark ? '#334155' : '#e2e8f0'
                }]}
                placeholder={`${selectedWithdrawCoin} adresi`}
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={withdrawAddress}
                onChangeText={setWithdrawAddress}
                autoCapitalize="none"
              />

              {/* Memo (for XRP) */}
              {selectedWithdrawCoin === 'XRP' && (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Memo (Opsiyonel)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                      color: isDark ? '#fff' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#e2e8f0'
                    }]}
                    placeholder="Destination tag"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    value={withdrawMemo}
                    onChangeText={setWithdrawMemo}
                    keyboardType="number-pad"
                  />
                </>
              )}

              {/* 2FA */}
              {requires2FA && (
                <>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>2FA Kodu</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                      color: isDark ? '#fff' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#e2e8f0'
                    }]}
                    placeholder="000000"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    value={twoFACode}
                    onChangeText={setTwoFACode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </>
              )}
            </View>

            {/* Preview */}
            <View style={[styles.previewCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Çekim Tutarı</Text>
                <Text style={[styles.previewValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                  ${preview.amount.toFixed(2)} AUXM
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Network Ücreti</Text>
                <Text style={[styles.previewValue, { color: '#f59e0b' }]}>
                  ${preview.fee.toFixed(2)} AUXM
                </Text>
              </View>
              <View style={[styles.previewRow, styles.previewTotal]}>
                <Text style={[styles.previewLabel, { color: isDark ? '#fff' : '#0f172a', fontWeight: '600' }]}>
                  Toplam
                </Text>
                <Text style={[styles.previewValue, { color: '#ef4444', fontWeight: '700' }]}>
                  ${preview.total.toFixed(2)} AUXM
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Alacağınız</Text>
                <Text style={[styles.previewValue, { color: '#10b981', fontWeight: '600' }]}>
                  ~{preview.cryptoAmount.toFixed(6)} {selectedWithdrawCoin}
                </Text>
              </View>
            </View>

            {/* Withdraw Button */}
            <TouchableOpacity
              style={[styles.withdrawButton, { opacity: isWithdrawing ? 0.7 : 1 }]}
              onPress={handleWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                  <Text style={styles.withdrawButtonText}>Çekim Yap</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Warning */}
            <View style={[styles.warningBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="warning" size={18} color="#92400e" />
              <Text style={{ color: '#92400e', fontSize: 11, flex: 1, lineHeight: 16 }}>
                Lütfen adresi doğru girdiğinizden emin olun. Yanlış adrese gönderilen fonlar geri alınamaz.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Whitelist Modal */}
      <Modal
        visible={showWhitelist}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWhitelist(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Whitelist Adresleri</Text>
              <TouchableOpacity onPress={() => setShowWhitelist(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {whitelist.filter(w => w.network === selectedWithdrawCoin).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  {selectedWithdrawCoin} için kayıtlı adres yok
                </Text>
              </View>
            ) : (
              whitelist
                .filter(w => w.network === selectedWithdrawCoin)
                .map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.whitelistItem, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                    onPress={() => handleSelectWhitelist(addr)}
                  >
                    <View>
                      <Text style={[styles.whitelistLabel, { color: isDark ? '#fff' : '#0f172a' }]}>
                        {addr.label}
                        {!addr.isVerified && <Text style={{ color: '#f59e0b' }}> (Beklemede)</Text>}
                      </Text>
                      <Text style={[styles.whitelistAddress, { color: isDark ? '#64748b' : '#94a3b8' }]} numberOfLines={1}>
                        {addr.address}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
                  </TouchableOpacity>
                ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12, paddingHorizontal: 40 },

  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  balanceBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 12 },
  balanceLabel: { fontSize: 12 },
  balanceValue: { fontSize: 24, fontWeight: 'bold' },

  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
  tabActive: { backgroundColor: 'rgba(0,0,0,0.1)' },
  tabText: { fontSize: 14, fontWeight: '600' },

  section: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  coinScroll: { flexDirection: 'row' },
  coinOption: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginRight: 8 },
  coinSymbol: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  btcNote: { fontSize: 10, marginTop: 8 },

  addressBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8 },
  addressText: { flex: 1, fontSize: 12, fontFamily: 'monospace' },
  copyBtn: { padding: 8 },

  networkInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  networkText: { fontSize: 11 },

  memoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 8, marginTop: 12 },

  bonusCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  bonusTitle: { fontSize: 13, fontWeight: '600' },
  bonusText: { fontSize: 11, marginTop: 4 },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  historyInfo: {},
  historyAmount: { fontSize: 13, fontWeight: '600' },
  historyDate: { fontSize: 10, marginTop: 2 },
  historyStatus: { fontSize: 16 },

  inputLabel: { fontSize: 12, marginBottom: 8, marginTop: 12 },
  input: { fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, borderWidth: 1 },
  amountRow: { flexDirection: 'row', gap: 8 },
  maxBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  addressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  previewCard: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  previewTotal: { borderTopWidth: 1, borderTopColor: '#334155', marginTop: 8, paddingTop: 12 },
  previewLabel: { fontSize: 13 },
  previewValue: { fontSize: 13 },

  withdrawButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ef4444', marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 10 },
  withdrawButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 30 },

  whitelistItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  whitelistLabel: { fontSize: 14, fontWeight: '500' },
  whitelistAddress: { fontSize: 11, marginTop: 2 },
});
