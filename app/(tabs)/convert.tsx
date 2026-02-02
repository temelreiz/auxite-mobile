// app/(tabs)/convert.tsx
// Dönüştür / Convert Sayfası - Web ExchangeModal'dan uyarlanmış
// ✅ Non-custodial ETH transfer desteği

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  StatusBar,
  Modal,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { API_URL } from '@/constants/api';
import { transferEthToHotWallet } from '@/services/wallet-service';

const API_BASE_URL = API_URL;

// On-chain transfer gerektiren tokenlar (non-custodial)
const ON_CHAIN_CRYPTOS = ['ETH'];

// Asset Types
type AssetCategory = 'metal' | 'platform' | 'crypto' | 'fiat';
type AssetType = 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD' | 'AUXM' | 'ETH' | 'BTC' | 'XRP' | 'SOL' | 'USDT' | 'USD';

interface AssetInfo {
  name: Record<string, string>;
  icon: string;
  iconType: 'image' | 'symbol';
  category: AssetCategory;
  color: string;
  unit: string;
}

// Metal icons
const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

// Asset definitions
const ASSETS: Record<AssetType, AssetInfo> = {
  USD: { name: { tr: 'Amerikan Doları', en: 'US Dollar' }, icon: '$', iconType: 'symbol', category: 'fiat', color: '#22C55E', unit: 'USD' },
  AUXG: { name: { tr: 'Altın', en: 'Gold' }, icon: 'gold', iconType: 'image', category: 'metal', color: '#F59E0B', unit: 'AUXG' },
  AUXS: { name: { tr: 'Gümüş', en: 'Silver' }, icon: 'silver', iconType: 'image', category: 'metal', color: '#94A3B8', unit: 'AUXS' },
  AUXPT: { name: { tr: 'Platin', en: 'Platinum' }, icon: 'platinum', iconType: 'image', category: 'metal', color: '#CBD5E1', unit: 'AUXPT' },
  AUXPD: { name: { tr: 'Paladyum', en: 'Palladium' }, icon: 'palladium', iconType: 'image', category: 'metal', color: '#64748B', unit: 'AUXPD' },
  AUXM: { name: { tr: 'Auxite Para', en: 'Auxite Money' }, icon: '◈', iconType: 'symbol', category: 'platform', color: '#A855F7', unit: 'AUXM' },
  ETH: { name: { tr: 'Ethereum', en: 'Ethereum' }, icon: 'Ξ', iconType: 'symbol', category: 'crypto', color: '#627EEA', unit: 'ETH' },
  BTC: { name: { tr: 'Bitcoin', en: 'Bitcoin' }, icon: '₿', iconType: 'symbol', category: 'crypto', color: '#F7931A', unit: 'BTC' },
  XRP: { name: { tr: 'Ripple', en: 'Ripple' }, icon: '✕', iconType: 'symbol', category: 'crypto', color: '#23292F', unit: 'XRP' },
  SOL: { name: { tr: 'Solana', en: 'Solana' }, icon: '◎', iconType: 'symbol', category: 'crypto', color: '#9945FF', unit: 'SOL' },
  USDT: { name: { tr: 'Tether', en: 'Tether' }, icon: '₮', iconType: 'symbol', category: 'crypto', color: '#26A17B', unit: 'USDT' },
};

// Default spreads
const DEFAULT_SPREAD = {
  metals: { gold: { buy: 1.5, sell: 1.5 }, silver: { buy: 2.0, sell: 2.0 }, platinum: { buy: 2.0, sell: 2.0 }, palladium: { buy: 2.5, sell: 2.5 } },
  crypto: { btc: { buy: 1.0, sell: 1.0 }, eth: { buy: 1.0, sell: 1.0 }, xrp: { buy: 1.5, sell: 1.5 }, sol: { buy: 1.5, sell: 1.5 }, usdt: { buy: 0.1, sell: 0.1 } },
};

// Fallback Translations (merkezi sistem yüklenemezse)
const fallbackTranslations: Record<string, Record<string, string>> = {
  tr: {
    title: 'Dönüştür', subtitle: 'Varlıklarınızı anında dönüştürün', conversionRules: 'Dönüşüm Kuralları',
    rule1: 'USD → AUXM, Metaller, USDT dönüşümü yapılabilir', rule2: 'USD → Crypto (BTC, ETH vb.) YAPILAMAZ',
    rule3: 'Kripto → AUXM veya Metal dönüşümü yapılabilir', rule4: 'Kripto ↔ Kripto dönüşümü desteklenmiyor',
    from: 'Gönder', to: 'Al', balance: 'Bakiye', youWillReceive: 'Alacağınız', rate: 'Dönüşüm Oranı', spread: 'Spread',
    cryptoToCrypto: 'Kripto-kripto dönüşümü desteklenmiyor', auxmToCrypto: 'AUXM → Kripto için Çekim bölümünü kullanın',
    usdToCrypto: 'USD ile kripto alınamaz', insufficientBalance: 'Yetersiz bakiye', processing: 'İşleniyor...',
    exchange: 'Dönüştür', success: 'Dönüşüm Başarılı!', selectAsset: 'Varlık Seçin', max: 'MAX',
    // Transfer status messages
    preparing_wallet: 'Cüzdan hazırlanıyor...',
    checking_balance: 'Bakiye kontrol ediliyor...',
    signing_transaction: 'İşlem imzalanıyor...',
    sending_transaction: 'İşlem gönderiliyor...',
    waiting_confirmation: 'Onay bekleniyor...',
    minting_token: 'Token oluşturuluyor...',
    // Error messages
    wallet_not_found: 'Cüzdan bulunamadı',
    insufficient_balance: 'Yetersiz bakiye',
    insufficient_balance_gas: 'Yetersiz bakiye (gas dahil)',
    transaction_failed: 'İşlem başarısız oldu',
    transaction_cancelled: 'İşlem iptal edildi',
    network_error: 'Ağ hatası, lütfen tekrar deneyin',
    transfer_failed: 'Transfer başarısız',
  },
  en: {
    title: 'Convert', subtitle: 'Convert your assets instantly', conversionRules: 'Conversion Rules',
    rule1: 'USD → AUXM, Metals, USDT conversions allowed', rule2: 'USD → Crypto (BTC, ETH etc.) NOT allowed',
    rule3: 'Crypto → AUXM or Metal conversions allowed', rule4: 'Crypto ↔ Crypto not supported',
    from: 'From', to: 'To', balance: 'Balance', youWillReceive: 'You will receive', rate: 'Rate', spread: 'Spread',
    cryptoToCrypto: 'Crypto-to-crypto not supported', auxmToCrypto: 'Use Withdraw for AUXM → Crypto',
    usdToCrypto: 'Cannot buy crypto with USD', insufficientBalance: 'Insufficient balance', processing: 'Processing...',
    exchange: 'Convert', success: 'Conversion Successful!', selectAsset: 'Select Asset', max: 'MAX',
    // Transfer status messages
    preparing_wallet: 'Preparing wallet...',
    checking_balance: 'Checking balance...',
    signing_transaction: 'Signing transaction...',
    sending_transaction: 'Sending transaction...',
    waiting_confirmation: 'Waiting for confirmation...',
    minting_token: 'Minting token...',
    // Error messages
    wallet_not_found: 'Wallet not found',
    insufficient_balance: 'Insufficient balance',
    insufficient_balance_gas: 'Insufficient balance (including gas)',
    transaction_failed: 'Transaction failed',
    transaction_cancelled: 'Transaction cancelled',
    network_error: 'Network error, please try again',
    transfer_failed: 'Transfer failed',
  },
};

export default function ConvertScreen() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  
  // i18n - Centralized with fallback
  const { t: convertT } = useTranslation('convert');
  const fallback = fallbackTranslations[language] || fallbackTranslations.en;
  const t = Object.keys(fallback).reduce((acc, key) => {
    acc[key] = (convertT as any)[key] || fallback[key as keyof typeof fallback];
    return acc;
  }, {} as Record<string, string>);

  // States
  const [fromAsset, setFromAsset] = useState<AssetType>('USD');
  const [toAsset, setToAsset] = useState<AssetType>('AUXG');
  const [fromAmount, setFromAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [showFromSelect, setShowFromSelect] = useState(false);
  const [showToSelect, setShowToSelect] = useState(false);

  // Prices
  const [prices, setPrices] = useState<Record<string, number>>({
    USD: 1, AUXM: 1, USDT: 1,
    AUXG: 95, AUXS: 1.15, AUXPT: 32, AUXPD: 35,
    BTC: 105000, ETH: 3800, XRP: 2.35, SOL: 220,
  });

  // Balances from API
  const [balances, setBalances] = useState<Record<string, number>>({});
  
  // Fetch balances function
  const fetchBalances = async () => {
    console.log('fetchBalances called, wallet:', walletAddress);
    if (!walletAddress) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/balance?address=${walletAddress}`);
      const data = await res.json();
      if (data.success && data.balances) {
        const newBal = {
          USD: data.balances.usd || 0,
          AUXM: (data.balances.auxm || 0) + (data.balances.bonusAuxm || 0),
          USDT: data.balances.usdt || 0,
          AUXG: data.balances.auxg || 0,
          AUXS: data.balances.auxs || 0,
          AUXPT: data.balances.auxpt || 0,
          AUXPD: data.balances.auxpd || 0,
          BTC: data.balances.btc || 0,
          ETH: data.balances.eth || 0,
          XRP: data.balances.xrp || 0,
          SOL: data.balances.sol || 0,
        };
        console.log('Setting balances:', newBal);
        setBalances(newBal);
      }
    } catch (e) {
      console.error('Balance fetch error:', e);
    }
  };

  // Fetch balances on mount and when walletAddress changes
  useEffect(() => {
    fetchBalances();
  }, [walletAddress]);
  
  // Also fetch on screen focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletAddress && Object.keys(balances).length === 0) {
        fetchBalances();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [walletAddress, balances]);

  // Spread config
  const [spreadConfig] = useState(DEFAULT_SPREAD);

  // Fetch prices
  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      let newPrices = { ...prices };
      
      // Fetch metal prices
      const metalRes = await fetch(`${API_BASE_URL}/api/prices?chain=84532`);
      if (metalRes.ok) {
        const data = await metalRes.json();
        if (data.ok && data.data) {
          data.data.forEach((metal: any) => {
            if (metal.symbol && metal.priceOz) {
              newPrices[metal.symbol] = metal.priceOz / 31.1035;
            }
          });
        }
      }

      // Fetch crypto prices
      const cryptoRes = await fetch(`${API_BASE_URL}/api/crypto`);
      if (cryptoRes.ok) {
        const data = await cryptoRes.json();
        newPrices = {
          ...newPrices,
          BTC: data.bitcoin?.usd || newPrices.BTC,
          ETH: data.ethereum?.usd || newPrices.ETH,
          XRP: data.ripple?.usd || newPrices.XRP,
          SOL: data.solana?.usd || newPrices.SOL,
          USDT: data.tether?.usd || 1,
        };
      }
      
      console.log('Prices updated:', newPrices);
      setPrices(newPrices);
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  };

  // Helper functions
  const getPrice = (asset: AssetType): number => prices[asset] || 1;
  const getBalance = (asset: AssetType): number => balances[asset] || 0;

  const isConversionAllowed = (from: AssetType, to: AssetType): boolean => {
    const fromCat = ASSETS[from].category;
    const toCat = ASSETS[to].category;
    if (fromCat === 'crypto' && toCat === 'crypto') return false;
    if (from === 'AUXM' && toCat === 'crypto') return false;
    if (from === 'USD' && toCat === 'crypto' && to !== 'USDT') return false;
    return true;
  };

  const getAllowedTargets = (from: AssetType): AssetType[] => {
    const all: AssetType[] = ['USD', 'AUXG', 'AUXS', 'AUXPT', 'AUXPD', 'AUXM', 'ETH', 'BTC', 'XRP', 'SOL', 'USDT'];
    return all.filter((t) => t !== from && isConversionAllowed(from, t));
  };

  const getSpreadPercent = (asset: AssetType, type: 'buy' | 'sell'): number => {
    const category = ASSETS[asset].category;
    if (category === 'fiat' || category === 'platform') return 0;
    
    if (category === 'metal') {
      const metalMap: Record<string, string> = { AUXG: 'gold', AUXS: 'silver', AUXPT: 'platinum', AUXPD: 'palladium' };
      const key = metalMap[asset] as keyof typeof spreadConfig.metals;
      return spreadConfig.metals[key]?.[type] || 1.5;
    }
    
    if (category === 'crypto') {
      const cryptoMap: Record<string, string> = { BTC: 'btc', ETH: 'eth', XRP: 'xrp', SOL: 'sol', USDT: 'usdt' };
      const key = cryptoMap[asset] as keyof typeof spreadConfig.crypto;
      return spreadConfig.crypto[key]?.[type] || 1.0;
    }
    
    return 0;
  };

  // Calculations
  const fromPrice = getPrice(fromAsset);
  const toPrice = getPrice(toAsset);
  const fromAmountNum = parseFloat(fromAmount) || 0;
  const fromValueUSD = fromAmountNum * fromPrice;

  const fromSpreadPercent = getSpreadPercent(fromAsset, 'sell');
  const toSpreadPercent = getSpreadPercent(toAsset, 'buy');
  const totalSpreadPercent = fromSpreadPercent + toSpreadPercent;

  const effectiveFromValueUSD = fromValueUSD * (1 - fromSpreadPercent / 100);
  const effectiveToPrice = toPrice * (1 + toSpreadPercent / 100);
  const toAmount = effectiveFromValueUSD / effectiveToPrice;

  const fromBalance = getBalance(fromAsset);
  const canAfford = fromAmountNum > 0 && fromAmountNum <= fromBalance;
  console.log('canAfford check:', { fromAmountNum, fromBalance, canAfford, fromAsset, balances });

  const isCryptoToCrypto = ASSETS[fromAsset].category === 'crypto' && ASSETS[toAsset].category === 'crypto';
  const isAuxmToCrypto = fromAsset === 'AUXM' && ASSETS[toAsset].category === 'crypto';
  const isUsdToCrypto = fromAsset === 'USD' && ASSETS[toAsset].category === 'crypto' && toAsset !== 'USDT';

  // Handlers
  const handleFromSelect = (asset: AssetType) => {
    setFromAsset(asset);
    setShowFromSelect(false);
    const allowed = getAllowedTargets(asset);
    if (!allowed.includes(toAsset)) setToAsset(allowed[0] || 'AUXG');
  };

  const handleToSelect = (asset: AssetType) => {
    setToAsset(asset);
    setShowToSelect(false);
  };

  const handleSwap = () => {
    if (isConversionAllowed(toAsset, fromAsset)) {
      const temp = fromAsset;
      setFromAsset(toAsset);
      setToAsset(temp);
      setFromAmount('');
    }
  };

  const handleMaxPress = () => {
    setFromAmount(fromBalance.toString());
  };

  const handleExchange = async () => {
    if (!canAfford || isCryptoToCrypto || isAuxmToCrypto || isUsdToCrypto || !walletAddress) return;
    
    setIsProcessing(true);
    setProcessingStatus(t.processing);
    console.log('Exchange started:', { fromAsset, toAsset, fromAmountNum, walletAddress });
    
    try {
      // ═══════════════════════════════════════════════════════════════════
      // NON-CUSTODIAL: ETH için önce hot wallet'a transfer yap
      // ═══════════════════════════════════════════════════════════════════
      let ethTxHash: string | undefined;
      
      if (ON_CHAIN_CRYPTOS.includes(fromAsset)) {
        console.log('🔷 Non-custodial ETH trade - transferring to hot wallet first');
        
        const transferResult = await transferEthToHotWallet(
          fromAmountNum,
          (statusKey) => {
            console.log('Transfer status:', statusKey);
            // Translate status key
            const translatedStatus = t[statusKey] || statusKey;
            setProcessingStatus(translatedStatus);
          }
        );
        
        if (!transferResult.success) {
          // Translate error key
          const errorMessage = t[transferResult.error || 'transfer_failed'] || transferResult.error || 'Transfer failed';
          throw new Error(errorMessage);
        }
        
        ethTxHash = transferResult.txHash;
        console.log('✅ ETH transfer complete:', ethTxHash);
        setProcessingStatus(t.minting_token || 'Minting token...');
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // TRADE API ÇAĞRISI
      // ═══════════════════════════════════════════════════════════════════
      const fromCat = ASSETS[fromAsset].category;
      const toCat = ASSETS[toAsset].category;
      let tradeType = 'swap';
      
      // Determine correct trade type
      if (fromAsset === 'AUXM' && toCat === 'metal') {
        tradeType = 'buy';  // AUXM → Metal = buy metal
      } else if (fromCat === 'metal' && toAsset === 'AUXM') {
        tradeType = 'sell'; // Metal → AUXM = sell metal
      } else if (ON_CHAIN_CRYPTOS.includes(fromAsset) && toCat === 'metal') {
        tradeType = 'buy';  // ETH → Metal = buy metal
      } else if (fromCat === 'metal' && toCat === 'crypto') {
        tradeType = 'sell'; // Metal → Crypto = sell metal
      } else if (fromCat === 'crypto' && toCat === 'metal') {
        tradeType = 'buy';  // Crypto → Metal = buy metal
      }
      
      console.log('Trade type determined:', { fromAsset, toAsset, fromCat, toCat, tradeType });
      
      const response = await fetch(`${API_BASE_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tradeType,
          fromToken: fromAsset.toLowerCase(),
          toToken: toAsset.toLowerCase(),
          fromAmount: fromAmountNum,
          address: walletAddress,
          executeOnChain: toCat === 'metal' || fromCat === 'metal', // Metal alım/satımlarında on-chain
          slippage: 1,
          ...(ethTxHash && { ethTransferTxHash: ethTxHash }),
        }),
      });
      
      const data = await response.json();
      console.log('Trade response:', data);
      console.log('Response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      if (data.success) {
        // Update balances based on transaction
        setBalances(prev => {
          const updated = { ...prev };
          // Deduct from source
          updated[fromAsset] = prev[fromAsset] - fromAmountNum;
          // Add to target (use toAmount from transaction)
          const receivedAmount = data.transaction?.toAmount || toAmount;
          updated[toAsset] = (prev[toAsset] || 0) + receivedAmount;
          console.log('Balances updated:', { from: fromAsset, to: toAsset, deducted: fromAmountNum, received: receivedAmount });
          return updated;
        });
        
        setResult('success');
        setTimeout(() => {
          setResult(null);
          setFromAmount('');
          // Bakiyeleri yenile
          fetchBalances();
        }, 2500);
      } else {
        throw new Error(data.error || 'Exchange failed');
      }
    } catch (error: any) {
      console.error('Exchange error:', error);
      Alert.alert('Error', error.message || 'Exchange failed');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const formatAmount = (amount: number, asset: AssetType): string => {
    if (ASSETS[asset].category === 'metal') return amount.toFixed(4);
    if (['BTC', 'ETH', 'XRP', 'SOL'].includes(asset)) return amount.toFixed(6);
    return amount.toFixed(2);
  };

  // Asset Icon Renderer
  const renderAssetIcon = (asset: AssetType, size: number = 32) => {
    const info = ASSETS[asset];
    if (info.iconType === 'image' && metalIcons[asset]) {
      return <Image source={metalIcons[asset]} style={{ width: size, height: size }} resizeMode="contain" />;
    }
    return (
      <View style={[styles.symbolIcon, { width: size, height: size, backgroundColor: info.color }]}>
        <Text style={[styles.symbolText, { fontSize: size * 0.5 }]}>{info.icon}</Text>
      </View>
    );
  };

  // Asset Selector Button
  const AssetButton = ({ asset, label, onPress }: { asset: AssetType; label: string; onPress: () => void }) => {
    const info = ASSETS[asset];
    return (
      <View>
        <Text style={[styles.fieldLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
        <TouchableOpacity
          style={[styles.assetButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {renderAssetIcon(asset, 32)}
          <View style={styles.assetButtonText}>
            <Text style={[styles.assetSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{asset}</Text>
            <Text style={[styles.assetName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {info.name[language] || info.name.en}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
    );
  };

  // Asset List Item for Modal
  const AssetListItem = ({ asset, onSelect }: { asset: AssetType; onSelect: () => void }) => {
    const info = ASSETS[asset];
    const balance = getBalance(asset);
    return (
      <TouchableOpacity
        style={[styles.assetListItem, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        {renderAssetIcon(asset, 36)}
        <View style={styles.assetListInfo}>
          <Text style={[styles.assetListSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{asset}</Text>
          <Text style={[styles.assetListName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {info.name[language] || info.name.en}
          </Text>
        </View>
        <Text style={[styles.assetListBalance, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {formatAmount(balance, asset)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Success View
  if (result === 'success') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color="#10b981" />
        </View>
        <Text style={[styles.successTitle, { color: '#10b981' }]}>{t.success}</Text>
        <Text style={[styles.successDetail, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {formatAmount(fromAmountNum, fromAsset)} {ASSETS[fromAsset].unit} → {formatAmount(toAmount, toAsset)} {ASSETS[toAsset].unit}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.subtitle}</Text>
        </View>

        {/* Rules Info */}
        <View style={[styles.rulesCard, { backgroundColor: isDark ? '#1e3a5f20' : '#eff6ff' }]}>
          <View style={styles.rulesHeader}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <Text style={styles.rulesTitle}>{t.conversionRules}</Text>
          </View>
          <Text style={styles.ruleText}>• {t.rule1}</Text>
          <Text style={styles.ruleText}>• {t.rule2}</Text>
          <Text style={styles.ruleText}>• {t.rule3}</Text>
          <Text style={styles.ruleText}>• {t.rule4}</Text>
        </View>

        {/* From Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <AssetButton asset={fromAsset} label={t.from} onPress={() => setShowFromSelect(true)} />
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t.balance}: {formatAmount(fromBalance, fromAsset)} {ASSETS[fromAsset].unit}
            </Text>
            <TouchableOpacity onPress={handleMaxPress}>
              <Text style={styles.maxButton}>{t.max}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
            <TextInput
              style={[styles.input, { color: isDark ? '#fff' : '#0f172a' }]}
              value={fromAmount}
              onChangeText={setFromAmount}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              keyboardType="decimal-pad"
              editable={!isProcessing}
            />
            <Text style={[styles.inputUnit, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {ASSETS[fromAsset].unit}
            </Text>
          </View>
          
          <Text style={[styles.usdValue, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            ≈ ${fromValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </Text>
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity
            style={[styles.swapButton, !isConversionAllowed(toAsset, fromAsset) && styles.swapButtonDisabled]}
            onPress={handleSwap}
            disabled={!isConversionAllowed(toAsset, fromAsset) || isProcessing}
          >
            <Ionicons name="swap-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* To Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <AssetButton asset={toAsset} label={t.to} onPress={() => setShowToSelect(true)} />
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t.balance}: {formatAmount(getBalance(toAsset), toAsset)} {ASSETS[toAsset].unit}
            </Text>
          </View>

          <View style={[styles.resultContainer, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
            <Text style={[styles.resultAmount, { color: isDark ? '#10b981' : '#059669' }]}>
              {formatAmount(toAmount, toAsset)}
            </Text>
            <Text style={[styles.inputUnit, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {ASSETS[toAsset].unit}
            </Text>
          </View>

          <Text style={[styles.usdValue, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            ≈ ${(toAmount * getPrice(toAsset)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </Text>
        </View>

        {/* Rate Info */}
        <View style={[styles.rateCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.rate}</Text>
            <Text style={[styles.rateValue, { color: isDark ? '#fff' : '#0f172a' }]}>
              1 {fromAsset} = {(fromPrice / toPrice).toFixed(6)} {toAsset}
            </Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={[styles.rateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.spread}</Text>
            <Text style={[styles.rateValue, { color: isDark ? '#fff' : '#0f172a' }]}>
              {totalSpreadPercent.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Warnings */}
        {isCryptoToCrypto && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.warningText}>{t.cryptoToCrypto}</Text>
          </View>
        )}
        {isAuxmToCrypto && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.warningText}>{t.auxmToCrypto}</Text>
          </View>
        )}
        {isUsdToCrypto && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.warningText}>{t.usdToCrypto}</Text>
          </View>
        )}
        {!canAfford && fromAmountNum > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.warningText}>{t.insufficientBalance}</Text>
          </View>
        )}

        {/* Exchange Button */}
        <TouchableOpacity
          style={[
            styles.exchangeButton,
            (!canAfford || isCryptoToCrypto || isAuxmToCrypto || isUsdToCrypto || isProcessing) && styles.exchangeButtonDisabled,
          ]}
          onPress={handleExchange}
          disabled={!canAfford || isCryptoToCrypto || isAuxmToCrypto || isUsdToCrypto || isProcessing}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.exchangeButtonGradient}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.exchangeButtonText}>{processingStatus || t.processing}</Text>
              </>
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                <Text style={styles.exchangeButtonText}>{t.exchange}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* From Asset Selector Modal */}
      <Modal
        visible={showFromSelect}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFromSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.selectAsset}</Text>
              <TouchableOpacity onPress={() => setShowFromSelect(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={Object.keys(ASSETS).filter(a => a !== fromAsset) as AssetType[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <AssetListItem asset={item} onSelect={() => handleFromSelect(item)} />
              )}
            />
          </View>
        </View>
      </Modal>

      {/* To Asset Selector Modal */}
      <Modal
        visible={showToSelect}
        transparent
        animationType="slide"
        onRequestClose={() => setShowToSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.selectAsset}</Text>
              <TouchableOpacity onPress={() => setShowToSelect(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getAllowedTargets(fromAsset)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <AssetListItem asset={item} onSelect={() => handleToSelect(item)} />
              )}
            />
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
  scrollContent: { padding: 16, paddingTop: 50 },

  // Header
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },

  // Rules Card
  rulesCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f630',
  },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  rulesTitle: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  ruleText: { fontSize: 11, color: '#3b82f6', marginBottom: 2 },

  // Section
  section: { padding: 16, borderRadius: 16, marginBottom: 8 },
  fieldLabel: { fontSize: 11, marginBottom: 6 },

  // Asset Button
  assetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  assetButtonText: { flex: 1 },
  assetSymbol: { fontSize: 15, fontWeight: '600' },
  assetName: { fontSize: 11 },

  // Symbol Icon
  symbolIcon: { borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  symbolText: { color: '#fff', fontWeight: '700' },

  // Balance Row
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  balanceText: { fontSize: 11 },
  maxButton: { fontSize: 11, fontWeight: '600', color: '#10b981' },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  input: { flex: 1, fontSize: 20, fontWeight: '600', paddingVertical: 14 },
  inputUnit: { fontSize: 13 },
  usdValue: { fontSize: 11, textAlign: 'right', marginTop: 6 },

  // Result
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  resultAmount: { fontSize: 20, fontWeight: '600' },

  // Swap Button
  swapContainer: { alignItems: 'center', marginVertical: -12, zIndex: 10 },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  swapButtonDisabled: { backgroundColor: '#64748b' },

  // Rate Card
  rateCard: { padding: 12, borderRadius: 12, marginTop: 8 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rateLabel: { fontSize: 11 },
  rateValue: { fontSize: 11, fontWeight: '500' },

  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444450',
    marginTop: 8,
  },
  warningText: { fontSize: 11, color: '#ef4444', flex: 1 },

  // Exchange Button
  exchangeButton: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  exchangeButtonDisabled: { opacity: 0.5 },
  exchangeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  exchangeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Success
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  successDetail: { fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },

  // Asset List Item
  assetListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  assetListInfo: { flex: 1 },
  assetListSymbol: { fontSize: 15, fontWeight: '600' },
  assetListName: { fontSize: 11, marginTop: 2 },
  assetListBalance: { fontSize: 13 },
});
