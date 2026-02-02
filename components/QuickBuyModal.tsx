// components/QuickBuyModal.tsx
// Quick Buy Metal Modal - React Native Version
// 6-Language Support | Dark/Light Mode
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import useCustomAlert from './CustomAlert';
import { API_URL } from '@/constants/api';


// ============================================
// TRANSLATIONS (6 Languages)
// ============================================
const translations: Record<string, Record<string, string>> = {
  tr: {
    buyMetal: 'Metal Satın Al',
    selectMetal: 'Metal Seç',
    youPay: 'Ödeme Tutarı',
    youReceive: 'Alacağınız',
    balance: 'Bakiye',
    amount: 'Miktar',
    max: 'Maks',
    transactionFee: 'İşlem Ücreti',
    getQuote: 'Fiyat Al',
    processing: 'İşleniyor...',
    insufficientBalance: 'Yetersiz bakiye',
  },
  en: {
    buyMetal: 'Buy Metal',
    selectMetal: 'Select Metal',
    youPay: 'You Pay',
    youReceive: 'You Receive',
    balance: 'Balance',
    amount: 'Amount',
    max: 'Max',
    transactionFee: 'Transaction Fee',
    getQuote: 'Get Quote',
    processing: 'Processing...',
    insufficientBalance: 'Insufficient balance',
  },
  ar: {
    buyMetal: 'شراء المعدن',
    selectMetal: 'اختر المعدن',
    youPay: 'تدفع',
    youReceive: 'تستلم',
    balance: 'الرصيد',
    amount: 'المبلغ',
    max: 'الحد الأقصى',
    transactionFee: 'رسوم المعاملة',
    getQuote: 'احصل على عرض',
    processing: 'جاري المعالجة...',
    insufficientBalance: 'رصيد غير كافٍ',
  },
  de: {
    buyMetal: 'Metall kaufen',
    selectMetal: 'Metall auswählen',
    youPay: 'Sie zahlen',
    youReceive: 'Sie erhalten',
    balance: 'Guthaben',
    amount: 'Betrag',
    max: 'Max',
    transactionFee: 'Transaktionsgebühr',
    getQuote: 'Angebot einholen',
    processing: 'Wird verarbeitet...',
    insufficientBalance: 'Unzureichendes Guthaben',
  },
  ru: {
    buyMetal: 'Купить металл',
    selectMetal: 'Выберите металл',
    youPay: 'Вы платите',
    youReceive: 'Вы получите',
    balance: 'Баланс',
    amount: 'Сумма',
    max: 'Макс',
    transactionFee: 'Комиссия',
    getQuote: 'Получить котировку',
    processing: 'Обработка...',
    insufficientBalance: 'Недостаточный баланс',
  },
  zh: {
    buyMetal: '购买金属',
    selectMetal: '选择金属',
    youPay: '您支付',
    youReceive: '您收到',
    balance: '余额',
    amount: '金额',
    max: '最大',
    transactionFee: '交易费用',
    getQuote: '获取报价',
    processing: '处理中...',
    insufficientBalance: '余额不足',
  },
};

// ============================================
// METALS & PAYMENT METHODS
// ============================================
const METAL_ICONS: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

const METALS_BASE = [
  { symbol: 'AUXG', name: 'gold', color: '#F59E0B', icon: METAL_ICONS.AUXG },
  { symbol: 'AUXS', name: 'silver', color: '#94A3B8', icon: METAL_ICONS.AUXS },
  { symbol: 'AUXPT', name: 'platinum', color: '#06B6D4', icon: METAL_ICONS.AUXPT },
  { symbol: 'AUXPD', name: 'palladium', color: '#8B5CF6', icon: METAL_ICONS.AUXPD },
];

const PAYMENT_METHODS = [
  { symbol: 'AUXM', icon: '◇', name: 'AUXM', color: '#A855F7' },
  { symbol: 'USDT', icon: '₮', name: 'USDT', color: '#26A17B' },
  { symbol: 'BTC', icon: '₿', name: 'BTC', color: '#F7931A' },
  { symbol: 'ETH', icon: 'Ξ', name: 'ETH', color: '#627EEA' },
  { symbol: 'XRP', icon: '✕', name: 'XRP', color: '#00AAE4' },
  { symbol: 'SOL', icon: '◎', name: 'SOL', color: '#9945FF' },
];

// ============================================
// COMPONENT
// ============================================
interface QuickBuyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QuickBuyModal({ visible, onClose }: QuickBuyModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { language, theme, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;
  
  // Custom Alert Hook
  const { showAlert, AlertComponent } = useCustomAlert();

  // Metal prices state
  const [metalPrices, setMetalPrices] = useState<Record<string, number>>({
    AUXG: 0, AUXS: 0, AUXPT: 0, AUXPD: 0
  });
  const [pricesLoading, setPricesLoading] = useState(true);
  
  const METALS = METALS_BASE.map(m => ({
    ...m,
    price: metalPrices[m.symbol] || 0
  }));
  
  const [selectedMetal, setSelectedMetal] = useState(METALS[0]);
  
  // Coin prices state
  const [coinPrices, setCoinPrices] = useState<Record<string, number>>({
    AUXM: 1,
    USDT: 1,
    BTC: 95000,
    ETH: 3400,
    XRP: 2.20,
    SOL: 180,
  });
  
  // Fetch metal and crypto prices
  useEffect(() => {
    if (!visible) return;
    
    const fetchPrices = async () => {
      setPricesLoading(true);
      try {
        const TROY_OZ_TO_GRAM = 31.1035;
        
        // Fetch metal prices
        const metalResponse = await fetch(`${API_URL}/api/prices?chain=84532`);
        const metalData = await metalResponse.json();
        
        if (metalData.ok && metalData.data) {
          const prices: Record<string, number> = {};
          for (const metal of metalData.data) {
            prices[metal.symbol] = (metal.priceOz || 0) / TROY_OZ_TO_GRAM;
          }
          setMetalPrices(prices);
        } else {
          setMetalPrices({ AUXG: 139, AUXS: 2.3, AUXPT: 67, AUXPD: 52 });
        }
        
        // Fetch crypto prices
        try {
          const cryptoResponse = await fetch(`${API_URL}/api/crypto`);
          const cryptoData = await cryptoResponse.json();
          
          if (cryptoData.ok && cryptoData.prices) {
            setCoinPrices(prev => ({
              ...prev,
              BTC: cryptoData.prices.BTC?.usd || prev.BTC,
              ETH: cryptoData.prices.ETH?.usd || prev.ETH,
              XRP: cryptoData.prices.XRP?.usd || prev.XRP,
              SOL: cryptoData.prices.SOL?.usd || prev.SOL,
            }));
          }
        } catch (cryptoErr) {
          console.log('Crypto prices fetch failed, using defaults');
        }
      } catch (e) {
        console.error('Failed to fetch prices:', e);
        setMetalPrices({ AUXG: 139, AUXS: 2.3, AUXPT: 67, AUXPD: 52 });
      } finally {
        setPricesLoading(false);
      }
    };
    fetchPrices();
  }, [visible]);
  
  // Update selected metal when prices load
  useEffect(() => {
    if (metalPrices.AUXG > 0) {
      setSelectedMetal(prev => ({ ...prev, price: metalPrices[prev.symbol] || 0 }));
    }
  }, [metalPrices]);

  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Real balances from store
  const { balance: walletBalance, fetchBalance, setAddress } = useBalanceStore();
  
  // Fetch balance when modal opens
  useEffect(() => {
    if (visible && walletAddress) {
      setAddress(walletAddress);
      fetchBalance();
    }
  }, [visible, walletAddress]);
  
  // Get balance for selected payment method
  const getPaymentBalance = (): number => {
    if (!walletBalance) return 0;
    const key = selectedPayment.symbol.toLowerCase() as keyof typeof walletBalance;
    const bal = walletBalance[key] || 0;
    console.log('balance for', key, ':', bal);
    return bal;
  };
  const balance = getPaymentBalance();
  const amountNum = parseFloat(amount) || 0;
  
  const paymentValueUSD = amountNum * (coinPrices[selectedPayment.symbol] || 1);
  const receiveAmount = selectedMetal.price > 0 ? paymentValueUSD / selectedMetal.price : 0;
  const isValidAmount = amountNum > 0 && amountNum <= balance;

  // Quote preview state
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    receiveAmount: number;
    rate: number;
    fee: number;
    spread?: number;
    spotPrice?: number;
  } | null>(null);
  
  

  const handleGetQuote = async () => {
    if (!isValidAmount) return;
    if (!walletAddress) {
      showAlert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Cüzdan bağlı değil' : 'Wallet not connected',
        'error'
      );
      return;
    }
    
    if (selectedMetal.price <= 0) {
      showAlert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Fiyat bilgisi yükleniyor...' : 'Loading price data...',
        'error'
      );
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get quote preview from API with spread
      const params = new URLSearchParams({
        type: 'buy',
        fromToken: selectedPayment.symbol.toLowerCase(),
        toToken: selectedMetal.symbol.toLowerCase(),
        amount: amountNum.toString(),
        address: walletAddress,
      });
      
      const response = await fetch(`${API_URL}/api/trade?${params}`);
      const data = await response.json();
      
      if (data.success && data.preview) {
        setQuoteData({
          receiveAmount: data.preview.toAmount || receiveAmount,
          rate: data.preview.price || selectedMetal.price, // spread'li fiyat
          fee: data.preview.fee || 0,
          spread: parseFloat(data.preview.spread) || 0,
          spotPrice: selectedMetal.price,
        });
        setShowQuotePreview(true);
      } else {
        throw new Error(data.error || 'Quote failed');
      }
    } catch (error: any) {
      console.error('Quote error:', error);
      // Fallback to local calculation
      const fee = paymentValueUSD * 0.01;
      setQuoteData({
        receiveAmount: receiveAmount,
        rate: selectedMetal.price,
        fee: fee,
        spread: 1,
        spotPrice: selectedMetal.price,
      });
      setShowQuotePreview(true);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleConfirmTrade = async () => {
    if (!quoteData || !walletAddress) return;
    
    setIsProcessing(true);
    setShowQuotePreview(false);
    
    try {
      const response = await fetch(`${API_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'buy',
          fromToken: selectedPayment.symbol.toLowerCase(),
          toToken: selectedMetal.symbol.toLowerCase(),
          fromAmount: amountNum,
          address: walletAddress,
          executeOnChain: true,
          slippage: 1,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert(
          language === 'tr' ? 'İşlem Başarılı!' : 'Trade Successful!',
          language === 'tr' 
            ? `${quoteData.receiveAmount.toFixed(4)} ${selectedMetal.symbol} satın alındı!`
            : `You purchased ${quoteData.receiveAmount.toFixed(4)} ${selectedMetal.symbol}!`,
          'success'
        );
        // Refresh balance after successful trade
        fetchBalance();
        setTimeout(() => onClose(), 2000);
      } else {
        throw new Error(data.error || 'Trade failed');
      }
    } catch (error: any) {
      showAlert(
        language === 'tr' ? 'İşlem Başarısız' : 'Trade Failed',
        error.message || 'Transaction failed',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMaxPress = () => {
    setAmount(balance.toString());
  };

  // Colors
  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    surfaceAlt: isDark ? '#334155' : '#f1f5f9',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryLight: isDark ? '#10b98130' : '#10b98120',
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.buyMetal}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Select Metal */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t.selectMetal}
              </Text>
              <View style={styles.metalGrid}>
                {METALS.map((metal) => (
                  <TouchableOpacity
                    key={metal.symbol}
                    style={[
                      styles.metalCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: selectedMetal.symbol === metal.symbol ? colors.primary : colors.border,
                        borderWidth: selectedMetal.symbol === metal.symbol ? 2 : 1,
                      },
                      selectedMetal.symbol === metal.symbol && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => setSelectedMetal(metal)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.metalIcon, { backgroundColor: metal.color + '20' }]}>
                      {metal.icon ? (
                        <Image source={metal.icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                      ) : (
                        <View style={[styles.metalDot, { backgroundColor: metal.color }]} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.metalSymbol,
                        { color: selectedMetal.symbol === metal.symbol ? colors.primary : colors.text },
                      ]}
                    >
                      {metal.symbol}
                    </Text>
                    <Text style={[styles.metalPrice, { color: colors.textSecondary }]}>
                      {metal.price > 0 ? `≈$${metal.price.toFixed(0)}` : '...'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* You Pay */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t.youPay}
              </Text>
              <View style={[styles.payCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Payment Method Selector */}
                <View style={styles.paymentGrid}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.symbol}
                      style={[
                        styles.paymentMethod,
                        {
                          backgroundColor: selectedPayment.symbol === method.symbol ? colors.primaryLight : colors.surfaceAlt,
                          borderColor: selectedPayment.symbol === method.symbol ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedPayment(method)}
                    >
                      <Text style={[styles.paymentIcon, { color: method.color }]}>{method.icon}</Text>
                      <Text style={[styles.paymentSymbol, { color: colors.text }]}>{method.symbol}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount Input */}
                <View style={styles.amountContainer}>
                  <TextInput
                    style={[styles.amountInput, { color: colors.text }]}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity 
                    style={[styles.maxButton, { backgroundColor: colors.primaryLight }]}
                    onPress={handleMaxPress}
                  >
                    <Text style={[styles.maxButtonText, { color: colors.primary }]}>{t.max}</Text>
                  </TouchableOpacity>
                </View>

                {/* Balance */}
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    {t.balance}: {balance.toFixed(['BTC', 'ETH', 'SOL'].includes(selectedPayment.symbol) ? 4 : 2)} {selectedPayment.symbol}
                  </Text>
                  {amountNum > balance && (
                    <Text style={styles.errorText}>{t.insufficientBalance}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <View style={[styles.arrowCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="arrow-down" size={20} color={colors.primary} />
              </View>
            </View>

            {/* You Receive */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t.youReceive}
              </Text>
              <View style={[styles.receiveCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.receiveIcon, { backgroundColor: selectedMetal.color + '20' }]}>
                  {selectedMetal.icon ? (
                    <Image source={selectedMetal.icon} style={{ width: 32, height: 32 }} resizeMode="contain" />
                  ) : (
                    <View style={[styles.receiveDot, { backgroundColor: selectedMetal.color }]} />
                  )}
                </View>
                <View style={styles.receiveInfo}>
                  <View style={styles.receiveAmountRow}>
                    <Text style={[styles.receiveAmount, { color: colors.text }]}>
                      {receiveAmount.toFixed(4)} {selectedMetal.symbol}
                    </Text>
                  </View>
                  <Text style={[styles.receivePrice, { color: colors.textSecondary }]}>
                    ≈${selectedMetal.price.toFixed(0)}/{selectedMetal.symbol}
                  </Text>
                </View>
              </View>
            </View>

            {/* Transaction Fee */}
            <View style={[styles.feeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                {t.transactionFee}:
              </Text>
              <Text style={[styles.feeValue, { color: colors.text }]}>0.1%</Text>
            </View>
          </ScrollView>

          {/* Footer Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !isValidAmount && styles.submitButtonDisabled,
              ]}
              onPress={handleGetQuote}
              disabled={!isValidAmount || isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.submitButtonText}>{t.processing}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>{t.getQuote}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quote Preview Modal */}
      <Modal
        visible={showQuotePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuotePreview(false)}
      >
        <View style={styles.quoteOverlay}>
          <View style={[styles.quoteModal, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
            <Text style={[styles.quoteTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
              {language === 'tr' ? 'İşlem Özeti' : 'Trade Summary'}
            </Text>
            
            {quoteData && (
              <View style={styles.quoteDetails}>
                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {language === 'tr' ? 'Ödeme' : 'You Pay'}
                  </Text>
                  <Text style={[styles.quoteValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                    {amountNum} {selectedPayment.symbol}
                  </Text>
                </View>
                
                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {language === 'tr' ? 'Alacağınız' : 'You Receive'}
                  </Text>
                  <Text style={[styles.quoteValue, { color: '#10b981' }]}>
                    {quoteData.receiveAmount.toFixed(4)} {selectedMetal.symbol}
                  </Text>
                </View>
                
                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {language === 'tr' ? 'Birim Fiyat' : 'Rate'}
                  </Text>
                  <Text style={[styles.quoteValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                    ${quoteData.rate.toFixed(2)}/g
                  </Text>
                </View>
                
                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {language === 'tr' ? 'İşlem Ücreti' : 'Fee'}
                  </Text>
                  <Text style={[styles.quoteValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                    ${quoteData.fee.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.quoteButtons}>
              <TouchableOpacity
                style={[styles.quoteCancelBtn, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                onPress={() => setShowQuotePreview(false)}
              >
                <Text style={[styles.quoteCancelText, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {language === 'tr' ? 'İptal' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quoteConfirmBtn}
                onPress={handleConfirmTrade}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.quoteConfirmText}>
                    {language === 'tr' ? 'Onayla' : 'Confirm'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      <AlertComponent />
    </>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metalGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  metalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metalDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  metalSymbol: {
    fontSize: 12,
    fontWeight: '700',
  },
  metalPrice: {
    fontSize: 10,
  },
  payCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    width: '30%',
    justifyContent: 'center',
  },
  paymentIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentSymbol: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },
  maxButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: -8,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  receiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiveDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  receiveInfo: {
    flex: 1,
  },
  receiveAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  receiveAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  receivePrice: {
    fontSize: 12,
    marginTop: 2,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  feeLabel: {
    fontSize: 13,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
  },
  submitButtonDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Quote Modal Styles
  quoteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quoteModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  quoteDetails: {
    gap: 12,
    marginBottom: 24,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 14,
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quoteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quoteCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quoteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  quoteConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
