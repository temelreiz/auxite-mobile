import { StyleSheet, ScrollView, View, Text, useColorScheme, RefreshControl, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import TopNav from '@/components/TopNav';
import DynamicBanner from "@/components/DynamicBanner";


// Import Modals
import { DepositMethodModal, CoinSelectModal, DepositAddressModal, UsdDepositModal, DEPOSIT_COINS, DepositCoin } from '@/components/DepositModals';
import  QuickBuyModal  from '@/components/QuickBuyModal';
import { RiskCorrelationModal } from '@/components/RiskCorrelationModal';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;
const TROY_OZ_TO_GRAM = 31.1035;

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

interface PriceItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  color: string;
  isImage?: boolean;
}

interface LeaseRate {
  metal: string;
  color: string;
  m3: number;
  m6: number;
  m12: number;
}

// Trust Data moved to launch phase - no mock data

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme, language, isConnected } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeBannerIndex] = useState(0);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL STATES
  // ═══════════════════════════════════════════════════════════════════════════
  const [showDepositMethod, setShowDepositMethod] = useState(false);
  const [showCoinSelect, setShowCoinSelect] = useState(false);
  const [showDepositAddress, setShowDepositAddress] = useState(false);
  const [showUsdDeposit, setShowUsdDeposit] = useState(false);
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<DepositCoin | null>(null);
  
  // Trust Data - Launch Phase (Empty State)
  const [trustData] = useState({
    isLaunchPhase: true,
    statusText: language === 'tr' ? 'Lansman Aşaması' : 
                language === 'de' ? 'Startphase' :
                language === 'fr' ? 'Phase de Lancement' :
                language === 'ar' ? 'مرحلة الإطلاق' :
                language === 'ru' ? 'Фаза Запуска' : 'Launch Phase',
  });

  // i18n - Centralized translations with fallback (6 languages)
  const { t: homeT } = useTranslation('home');
  const t = {
    trustCenter: language === 'tr' ? 'Güven Merkezi' :
                 language === 'de' ? 'Vertrauenszentrum' :
                 language === 'fr' ? 'Centre de Confiance' :
                 language === 'ar' ? 'مركز الثقة' :
                 language === 'ru' ? 'Центр Доверия' : 'Trust Center',
    backed: language === 'tr' ? '1:1 Fiziksel Varlık Destekli' :
            language === 'de' ? '1:1 durch physische Vermögenswerte gedeckt' :
            language === 'fr' ? 'Garanti 1:1 par des actifs physiques' :
            language === 'ar' ? 'مدعوم 1:1 بأصول مادية' :
            language === 'ru' ? 'Обеспечено 1:1 физическими активами' : 'Backed 1:1 by Physical Assets',
    totalReserves: language === 'tr' ? 'Toplam Rezerv' :
                   language === 'de' ? 'Gesamtreserven' :
                   language === 'fr' ? 'Réserves Totales' :
                   language === 'ar' ? 'إجمالي الاحتياطيات' :
                   language === 'ru' ? 'Общие Резервы' : 'Total Reserves',
    fullyBacked: language === 'tr' ? 'Tam Karşılıklı' :
                 language === 'de' ? 'Vollständig gedeckt' :
                 language === 'fr' ? 'Entièrement garanti' :
                 language === 'ar' ? 'مدعوم بالكامل' :
                 language === 'ru' ? 'Полностью обеспечено' : 'Fully Backed',
    reserves: language === 'tr' ? 'Rezervler' :
              language === 'de' ? 'Reserven' :
              language === 'fr' ? 'Réserves' :
              language === 'ar' ? 'الاحتياطيات' :
              language === 'ru' ? 'Резервы' : 'Reserves',
    audits: language === 'tr' ? 'Denetim' :
            language === 'de' ? 'Prüfungen' :
            language === 'fr' ? 'Audits' :
            language === 'ar' ? 'التدقيق' :
            language === 'ru' ? 'Аудиты' : 'Audits',
    custody: language === 'tr' ? 'Saklama' :
             language === 'de' ? 'Verwahrung' :
             language === 'fr' ? 'Garde' :
             language === 'ar' ? 'الحفظ' :
             language === 'ru' ? 'Хранение' : 'Custody',
    viewDetails: language === 'tr' ? 'Detaylar' :
                 language === 'de' ? 'Details ansehen' :
                 language === 'fr' ? 'Voir les détails' :
                 language === 'ar' ? 'عرض التفاصيل' :
                 language === 'ru' ? 'Подробнее' : 'View Details',
    deposit: language === 'tr' ? 'Yatır' :
             language === 'de' ? 'Einzahlen' :
             language === 'fr' ? 'Déposer' :
             language === 'ar' ? 'إيداع' :
             language === 'ru' ? 'Депозит' : 'Deposit',
    quickBuy: language === 'tr' ? 'Hızlı Al' :
              language === 'de' ? 'Schnellkauf' :
              language === 'fr' ? 'Achat Rapide' :
              language === 'ar' ? 'شراء سريع' :
              language === 'ru' ? 'Быстрая покупка' : 'Quick Buy',
    convert: language === 'tr' ? 'Dönüştür' :
             language === 'de' ? 'Umwandeln' :
             language === 'fr' ? 'Convertir' :
             language === 'ar' ? 'تحويل' :
             language === 'ru' ? 'Конвертировать' : 'Convert',
    stake: language === 'tr' ? 'Biriktir' :
           language === 'de' ? 'Staken' :
           language === 'fr' ? 'Staker' :
           language === 'ar' ? 'تخزين' :
           language === 'ru' ? 'Стейкинг' : 'Stake',
    transparencySecurity: language === 'tr' ? 'Şeffaflık & Güvenlik' :
                          language === 'de' ? 'Transparenz & Sicherheit' :
                          language === 'fr' ? 'Transparence & Sécurité' :
                          language === 'ar' ? 'الشفافية والأمان' :
                          language === 'ru' ? 'Прозрачность и Безопасность' : 'Transparency & Security',
    launchPhase: language === 'tr' ? 'Lansman Aşaması' :
                 language === 'de' ? 'Startphase' :
                 language === 'fr' ? 'Phase de Lancement' :
                 language === 'ar' ? 'مرحلة الإطلاق' :
                 language === 'ru' ? 'Фаза Запуска' : 'Launch Phase',
    dataAfterIssuance: language === 'tr' ? 'Veriler, ilk metal ihracından sonra yayınlanacaktır.' :
                       language === 'de' ? 'Daten werden nach der ersten Metallausgabe veröffentlicht.' :
                       language === 'fr' ? 'Les données seront publiées après la première émission de métal.' :
                       language === 'ar' ? 'سيتم نشر البيانات بعد أول إصدار للمعدن.' :
                       language === 'ru' ? 'Данные будут опубликованы после первого выпуска металла.' : 'Data will be published after the first metal issuance.',
    // New keys for Metals, Crypto, News, Risk
    metals: language === 'tr' ? 'Metaller' :
            language === 'de' ? 'Metalle' :
            language === 'fr' ? 'Métaux' :
            language === 'ar' ? 'المعادن' :
            language === 'ru' ? 'Металлы' : 'Metals',
    crypto: language === 'tr' ? 'Kripto' :
            language === 'de' ? 'Krypto' :
            language === 'fr' ? 'Crypto' :
            language === 'ar' ? 'كريبتو' :
            language === 'ru' ? 'Крипто' : 'Crypto',
    news: language === 'tr' ? 'Haberler' :
          language === 'de' ? 'Nachrichten' :
          language === 'fr' ? 'Actualités' :
          language === 'ar' ? 'الأخبار' :
          language === 'ru' ? 'Новости' : 'News',
    riskCorrelation: language === 'tr' ? 'Risk & Korelasyon' :
                     language === 'de' ? 'Risiko & Korrelation' :
                     language === 'fr' ? 'Risque & Corrélation' :
                     language === 'ar' ? 'المخاطر والارتباط' :
                     language === 'ru' ? 'Риск и Корреляция' : 'Risk & Correlation',
    riskDesc: language === 'tr' ? 'Portföy risk metriklerini görüntüleyin' :
              language === 'de' ? 'Portfolio-Risikometriken anzeigen' :
              language === 'fr' ? 'Voir les métriques de risque du portefeuille' :
              language === 'ar' ? 'عرض مقاييس مخاطر المحفظة' :
              language === 'ru' ? 'Просмотр метрик риска портфеля' : 'View portfolio risk metrics',
    price: language === 'tr' ? 'Fiyat' :
           language === 'de' ? 'Preis' :
           language === 'fr' ? 'Prix' :
           language === 'ar' ? 'السعر' :
           language === 'ru' ? 'Цена' : 'Price',
    change24h: language === 'tr' ? '24s Değişim' :
               language === 'de' ? '24h Änderung' :
               language === 'fr' ? 'Variation 24h' :
               language === 'ar' ? 'التغيير 24س' :
               language === 'ru' ? 'Изменение 24ч' : '24h Change',
    seeAll: language === 'tr' ? 'Tümü' :
            language === 'de' ? 'Alle' :
            language === 'fr' ? 'Tout voir' :
            language === 'ar' ? 'عرض الكل' :
            language === 'ru' ? 'Все' : 'See All',
  };

  const [metals, setMetals] = useState<PriceItem[]>([
    { symbol: 'AUXG', name: 'Gold', price: 0, change24h: 0, color: '#EAB308', isImage: true },
    { symbol: 'AUXS', name: 'Silver', price: 0, change24h: 0, color: '#94A3B8', isImage: true },
    { symbol: 'AUXPT', name: 'Platinum', price: 0, change24h: 0, color: '#E2E8F0', isImage: true },
    { symbol: 'AUXPD', name: 'Palladium', price: 0, change24h: 0, color: '#64748B', isImage: true },
    { symbol: 'AUXM', name: 'Auxite Para', price: 1.00, change24h: 0, color: '#A855F7', isImage: false },
  ]);
  
  const [cryptos, setCryptos] = useState<PriceItem[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, color: '#F7931A', isImage: false },
    { symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, color: '#627EEA', isImage: false },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0, color: '#26A17B', isImage: false },
    { symbol: 'XRP', name: 'Ripple', price: 0, change24h: 0, color: '#00A3E0', isImage: false },
    { symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, color: '#9945FF', isImage: false },
  ]);

  const cryptoIcons: Record<string, string> = { BTC: '₿', ETH: 'Ξ', USDT: '₮', XRP: '✕', SOL: '◎' };

  const [leaseRates] = useState<LeaseRate[]>([
    { metal: 'AUXG', color: '#EAB308', m3: 3.5, m6: 5.2, m12: 7.0 },
    { metal: 'AUXS', color: '#94A3B8', m3: 4.0, m6: 6.0, m12: 8.5 },
    { metal: 'AUXPT', color: '#E2E8F0', m3: 3.2, m6: 4.8, m12: 6.5 },
    { metal: 'AUXPD', color: '#64748B', m3: 3.8, m6: 5.5, m12: 7.2 },
  ]);

  const [news] = useState([
    { id: 1, title: 'Gold prices surge amid global uncertainty', time: '2h', source: 'Reuters' },
    { id: 2, title: 'Silver demand increases in solar panel industry', time: '4h', source: 'Bloomberg' },
  ]);

  const fetchPrices = async () => {
    try {
      // Metal fiyatları - /api/prices endpoint'i kullanıyor
      const metalRes = await fetch(`${API_BASE_URL}/api/prices?chain=84532`);
      const metalData = await metalRes.json();
      
      // API response: { success: true, basePrices: { AUXG: 147.79, ... }, changes: { AUXG: -0.42, ... } }
      if (metalData.success && metalData.basePrices) {
        setMetals(prev => prev.map(m => {
          const price = metalData.basePrices[m.symbol];
          if (price !== undefined) {
            return { ...m, price: price, change24h: metalData.changes?.[m.symbol] || 0 };
          }
          if (m.symbol === 'AUXM') {
            return { ...m, change24h: metalData.changes?.[m.symbol] || 0 };
          }
          return m;
        }));
      }
      
      // Crypto fiyatları
      const cryptoRes = await fetch(`${API_BASE_URL}/api/crypto`);
      const cryptoData = await cryptoRes.json();
      const cryptoApiMap: Record<string, string> = { 
        BTC: 'bitcoin', 
        ETH: 'ethereum', 
        USDT: 'tether',
        XRP: 'ripple',
        SOL: 'solana'
      };
      setCryptos(prev => prev.map(c => {
        const data = cryptoData[cryptoApiMap[c.symbol]];
        if (data) {
          const price = data.usd ?? (c.symbol === 'USDT' ? 1.00 : c.price);
          return { 
            ...c, 
            price: price,
            change24h: data.usd_24h_change || 0 
          };
        }
        return c;
      }));
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  };

  // Trust data fetch removed - launch phase

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    setRefreshing(false);
  }, []);

  const formatPrice = (price: number) => {
    // Large crypto prices (BTC, ETH etc.) - no decimals, with comma formatting
    if (price >= 1000) return '$' + Math.round(price).toLocaleString('en-US');
    // Medium prices with 2 decimals
    if (price >= 1) return '$' + price.toFixed(2);
    // Small prices with 4 decimals
    return '$' + price.toFixed(4);
  };

  // Format price specifically for crypto cards (compact version)
  const formatCryptoPrice = (price: number) => {
    if (price >= 1000) return '$' + Math.round(price).toLocaleString('en-US');
    return '$' + price.toFixed(2);
  };

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return prefix + change.toFixed(2) + '%';
  };

  const getPriceColor = (change: number) => {
    if (change > 0) return '#10b981';
    if (change < 0) return '#ef4444';
    return isDark ? '#ffffff' : '#000000';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION & ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTrustPress = () => {
    router.push('/(tabs)/trust' as any);
  };

  const handleQuickTrustLink = (screen: string) => {
    router.push(`/(tabs)/trust/${screen}` as any);
  };

  // Deposit Flow
  const handleDeposit = () => {
    setShowDepositMethod(true);
  };

  const handleSelectCrypto = () => {
    setShowDepositMethod(false);
    setShowCoinSelect(true);
  };

  const handleSelectUsd = () => {
    setShowDepositMethod(false);
    setShowUsdDeposit(true);
  };

  const handleSelectCoin = (coin: DepositCoin) => {
    setSelectedCoin(coin);
    setShowCoinSelect(false);
    setShowDepositAddress(true);
  };

  // Quick Buy
  const handleQuickBuy = () => {
    setShowQuickBuy(true);
  };

  // Convert
  const handleConvert = () => {
    router.push('/(tabs)/trade' as any);
  };

  // Stake
  const handleStake = () => {
    router.push('/(tabs)/stake' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8fafc' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <TopNav showBorder={false} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDark ? '#fff' : '#000'}
          />
        }
      >
        {/* Banner Slider */}
        <View style={styles.bannerSection}>
          <DynamicBanner isDark={isDark} />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            onPress={handleDeposit}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="arrow-down" size={18} color="#10b981" />
            </View>
            <Text style={[styles.actionLabel, { color: isDark ? '#fff' : '#000' }]}>{t.deposit}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            onPress={handleQuickBuy}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="flash" size={18} color="#3b82f6" />
            </View>
            <Text style={[styles.actionLabel, { color: isDark ? '#fff' : '#000' }]}>{t.quickBuy}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            onPress={handleConvert}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.actionLabel, { color: isDark ? '#fff' : '#000' }]}>{t.convert}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            onPress={handleStake}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="layers" size={18} color="#8b5cf6" />
            </View>
            <Text style={[styles.actionLabel, { color: isDark ? '#fff' : '#000' }]}>{t.stake}</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Center Card - Launch Phase */}
        <TouchableOpacity onPress={handleTrustPress} activeOpacity={0.9}>
          <View style={styles.trustContainer}>
            <LinearGradient
              colors={['#047857', '#10b981', '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trustGradient}
            >
              <View style={styles.trustLiveIndicator}>
                <View style={styles.trustLiveDot} />
                <Text style={styles.trustLiveText}>{trustData.statusText}</Text>
              </View>
              
              <View style={styles.trustHeader}>
                <View style={styles.trustIconContainer}>
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                </View>
                <View style={styles.trustHeaderText}>
                  <Text style={styles.trustTitle}>{t.trustCenter}</Text>
                  <Text style={styles.trustSubtitle}>{t.backed}</Text>
                </View>
              </View>
              
              {/* Launch Phase Message */}
              <View style={styles.trustLaunchMessage}>
                <Text style={styles.trustLaunchText}>
                  {t.dataAfterIssuance}
                </Text>
              </View>
              
              {/* Quick Links */}
              <View style={styles.trustQuickLinks}>
                <TouchableOpacity 
                  style={styles.trustQuickLink}
                  onPress={() => handleQuickTrustLink('reserves')}
                >
                  <Ionicons name="cube-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.trustQuickLinkText}>{t.reserves}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.trustQuickLink}
                  onPress={() => handleQuickTrustLink('audits')}
                >
                  <Ionicons name="document-text-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.trustQuickLinkText}>{t.audits}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.trustQuickLink}
                  onPress={() => handleQuickTrustLink('custody')}
                >
                  <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.trustQuickLinkText}>{t.custody}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* METALS SECTION - Card Grid */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <View style={styles.marketsSection}>
          <View style={styles.marketHeader}>
            <Text style={[styles.marketHeaderTitle, { color: isDark ? '#fff' : '#000' }]}>{t.metals}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/trade' as any)}>
              <Text style={styles.seeAllText}>{t.seeAll}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardsRow}>
            {metals.slice(0, 4).map((item) => (
              <TouchableOpacity 
                key={item.symbol}
                style={[styles.assetCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
                onPress={() => router.push('/(tabs)/trade' as any)}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: item.color + '20' }]}>
                  {item.isImage && metalIcons[item.symbol] ? (
                    <Image source={metalIcons[item.symbol]} style={styles.cardMetalImage} resizeMode="contain" />
                  ) : (
                    <Text style={[styles.cardIconText, { color: item.color }]}>
                      {item.symbol.charAt(0)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.cardSymbol, { color: isDark ? '#fff' : '#000' }]}>{item.symbol}</Text>
                <Text style={[styles.cardPrice, { color: isDark ? '#fff' : '#000' }]}>
                  {formatPrice(item.price)}
                </Text>
                <View style={[
                  styles.cardChangeContainer, 
                  { backgroundColor: item.change24h >= 0 ? '#10b98120' : '#ef444420' }
                ]}>
                  <Ionicons 
                    name={item.change24h >= 0 ? 'trending-up' : 'trending-down'} 
                    size={10} 
                    color={item.change24h >= 0 ? '#10b981' : '#ef4444'} 
                  />
                  <Text style={[styles.cardChange, { color: item.change24h >= 0 ? '#10b981' : '#ef4444' }]}>
                    {formatChange(item.change24h)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* CRYPTO SECTION - Card Grid */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <View style={styles.marketsSection}>
          <View style={styles.marketHeader}>
            <Text style={[styles.marketHeaderTitle, { color: isDark ? '#fff' : '#000' }]}>{t.crypto}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/trade' as any)}>
              <Text style={styles.seeAllText}>{t.seeAll}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardsRow}>
            {cryptos.slice(0, 4).map((item) => (
              <TouchableOpacity 
                key={item.symbol}
                style={[styles.assetCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
                onPress={() => router.push('/(tabs)/trade' as any)}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.cardIconText, { color: item.color }]}>
                    {cryptoIcons[item.symbol] || item.symbol.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.cardSymbol, { color: isDark ? '#fff' : '#000' }]}>{item.symbol}</Text>
                <Text style={[styles.cardPrice, { color: isDark ? '#fff' : '#000' }]}>
                  {formatCryptoPrice(item.price)}
                </Text>
                <View style={[
                  styles.cardChangeContainer, 
                  { backgroundColor: item.change24h >= 0 ? '#10b98120' : '#ef444420' }
                ]}>
                  <Ionicons 
                    name={item.change24h >= 0 ? 'trending-up' : 'trending-down'} 
                    size={10} 
                    color={item.change24h >= 0 ? '#10b981' : '#ef4444'} 
                  />
                  <Text style={[styles.cardChange, { color: item.change24h >= 0 ? '#10b981' : '#ef4444' }]}>
                    {formatChange(item.change24h)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Risk & Correlation Card */}
        <TouchableOpacity 
          style={[styles.riskCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
          onPress={() => setShowRiskModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.riskHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>{t.riskCorrelation}</Text>
            <View style={styles.viewMoreBadge}>
              <Text style={styles.viewMoreText}>{t.viewDetails}</Text>
              <Ionicons name="chevron-forward" size={12} color="#10b981" />
            </View>
          </View>
          <Text style={[styles.riskDesc, { color: isDark ? '#aaa' : '#666' }]}>{t.riskDesc}</Text>
          <View style={styles.riskGrid}>
            <View style={[styles.riskItem, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]}>
              <Text style={[styles.riskLabel, { color: isDark ? '#aaa' : '#666' }]}>Portfolio β</Text>
              <Text style={[styles.riskValue, { color: isDark ? '#fff' : '#000' }]}>0.82</Text>
            </View>
            <View style={[styles.riskItem, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]}>
              <Text style={[styles.riskLabel, { color: isDark ? '#aaa' : '#666' }]}>Sharpe</Text>
              <Text style={[styles.riskValue, { color: '#10b981' }]}>1.45</Text>
            </View>
            <View style={[styles.riskItem, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]}>
              <Text style={[styles.riskLabel, { color: isDark ? '#aaa' : '#666' }]}>VaR (95%)</Text>
              <Text style={[styles.riskValue, { color: '#ef4444' }]}>-4.2%</Text>
            </View>
            <View style={[styles.riskItem, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]}>
              <Text style={[styles.riskLabel, { color: isDark ? '#aaa' : '#666' }]}>Correlation</Text>
              <Text style={[styles.riskValue, { color: isDark ? '#fff' : '#000' }]}>0.34</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* News Section */}
        <View style={styles.newsSection}>
          <View style={[styles.marketHeader, { marginHorizontal: 16 }]}>
            <Text style={[styles.marketHeaderTitle, { color: isDark ? '#fff' : '#000' }]}>{t.news}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {news.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.newsItem, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            >
              <View style={styles.newsContent}>
                <Text style={[styles.newsTitle, { color: isDark ? '#fff' : '#000' }]}>{item.title}</Text>
                <Text style={[styles.newsMeta, { color: isDark ? '#aaa' : '#666' }]}>{item.source} • {item.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#666' : '#ccc'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      {/* Deposit Method Modal */}
      <DepositMethodModal
        visible={showDepositMethod}
        onClose={() => setShowDepositMethod(false)}
        onSelectCrypto={handleSelectCrypto}
        onSelectUsd={handleSelectUsd}
        isDark={isDark}
      />

      {/* Coin Select Modal */}
      <CoinSelectModal
        visible={showCoinSelect}
        onClose={() => setShowCoinSelect(false)}
        onSelectCoin={handleSelectCoin}
        coins={DEPOSIT_COINS}
        isDark={isDark}
      />

      {/* Deposit Address Modal */}
      <DepositAddressModal
        visible={showDepositAddress}
        onClose={() => setShowDepositAddress(false)}
        coin={selectedCoin}
        isDark={isDark}
      />

      {/* USD Deposit Modal */}
      <UsdDepositModal
        visible={showUsdDeposit}
        onClose={() => setShowUsdDeposit(false)}
        isDark={isDark}
      />

      {/* Quick Buy Modal */}
      <QuickBuyModal
        visible={showQuickBuy}
        onClose={() => setShowQuickBuy(false)}
        isDark={isDark}
      />

      {/* Risk Correlation Modal */}
      <RiskCorrelationModal
        visible={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bannerSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },

  // Quick Actions
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Trust Card Styles
  trustContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  trustGradient: {
    padding: 16,
  },
  trustLiveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trustLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 4,
  },
  trustLiveText: {
    fontSize: 9,
    color: '#4ade80',
    fontWeight: '600',
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trustHeaderText: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  trustSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  trustLaunchMessage: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  trustLaunchText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  trustQuickLinks: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  trustQuickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  trustQuickLinkText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#10b98120' },
  tabText: { fontSize: 12, fontWeight: '600' },

  listSection: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, overflow: 'hidden' },
  
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 44 },
  headerLabel: { width: 70, fontSize: 9, textAlign: 'center' },

  priceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  priceRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  metalImage: { width: 22, height: 22 },
  auxmIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auxmIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  metalDot: { width: 12, height: 12, borderRadius: 6 },
  cryptoIcon: { fontSize: 16, fontWeight: 'bold' },
  coinSymbol: { fontSize: 13, fontWeight: '600' },
  coinName: { fontSize: 10, marginTop: 1 },
  coinPrice: { width: 70, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  changeValue: { width: 70, fontSize: 11, fontWeight: '500', textAlign: 'right' },

  stakeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  apyLabels: { flexDirection: 'row', width: 120, justifyContent: 'space-between' },
  apyLabel: { fontSize: 10, fontWeight: '500', width: 36, textAlign: 'center' },

  leaseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  leaseRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  leaseRates: { flexDirection: 'row', width: 120, justifyContent: 'space-between' },
  rateApy: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'center' },

  riskCard: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12 },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewMoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 2 },
  viewMoreText: { fontSize: 10, fontWeight: '600', color: '#10b981' },
  sectionTitle: { fontSize: 13, fontWeight: '600' },
  riskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  riskItem: { width: '48%', padding: 10, borderRadius: 8 },
  riskLabel: { fontSize: 10, marginBottom: 2 },
  riskValue: { fontSize: 13, fontWeight: '600' },
  riskDesc: { fontSize: 11, marginBottom: 10 },

  // Markets Section - Card Grid
  marketsSection: { paddingHorizontal: 16, marginBottom: 10 },
  marketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  marketHeaderTitle: { fontSize: 14, fontWeight: '600' },
  seeAllText: { fontSize: 12, color: '#10b981', fontWeight: '500' },
  cardsRow: { flexDirection: 'row', gap: 10 },
  assetCard: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 14, 
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardMetalImage: { width: 26, height: 26 },
  cardIconText: { fontSize: 20, fontWeight: '700' },
  cardSymbol: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  cardPrice: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  cardChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  cardChange: { fontSize: 10, fontWeight: '600' },

  newsSection: { marginBottom: 10 },
  newsItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 12, borderRadius: 10, marginBottom: 6 },
  newsContent: { flex: 1 },
  newsTitle: { fontSize: 12, fontWeight: '500' },
  newsMeta: { fontSize: 10, marginTop: 2 },
});
