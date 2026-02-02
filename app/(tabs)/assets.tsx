// app/(tabs)/assets.tsx
// Varlıklarım / My Assets - API Entegreli, Tab Menü

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { Toast, useToast } from "@/components/Toast";
import { API_URL } from '@/constants/api';
import { useTranslation } from '@/hooks/useTranslation';
import * as Clipboard from 'expo-clipboard';

// Import Modals
import { DepositMethodModal, CoinSelectModal, DepositAddressModal, UsdDepositModal, DepositCoin } from '@/components/DepositModals';
import QuickBuyModal from '@/components/QuickBuyModal';
import { SendModal } from '@/components/WalletModals';
import WithdrawModal from '@/components/WithdrawModal';
import { LockedAssetsModal } from '@/components/LockedAssetsModal';

const API_BASE_URL = API_URL;
const TROY_OZ_TO_GRAM = 31.1035;

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

interface Asset {
  symbol: string;
  bonusBalance?: number;
  name: string;
  balance: number;
  price: number;
  value: number;
  change24h: number;
  color: string;
  icon?: string;
}

interface Allocation {
  id: string;
  metal: string;
  grams: number;
  custodian: string;
  timestamp: string;
  txHash?: string;
}

interface StakePosition {
  id: string;
  metalSymbol: string;
  amountGrams: number;
  durationMonths: number;
  apyPercent: number;
  progress: number;
  timeRemaining?: number;
  isMatured: boolean;
  shortCode: string;
  expectedRewardGrams: number;
  startDate?: string;
  endDate?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell' | 'stake' | 'convert' | 'allocate';
  asset: string;
  amount: number;
  value: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  txHash?: string;
}

const METAL_INFO: Record<string, { emoji: string; color: string; name: string }> = {
  AUXG: { emoji: '🥇', color: '#f59e0b', name: 'Gold' },
  AUXS: { emoji: '🥈', color: '#94a3b8', name: 'Silver' },
  AUXPT: { emoji: '💎', color: '#22d3ee', name: 'Platinum' },
  AUXPD: { emoji: '🔶', color: '#fb7185', name: 'Palladium' },
};

const CUSTODIAN_NAMES: Record<string, string> = {
  zurich: 'Zurich 🇨🇭',
  singapore: 'Singapore 🇸🇬',
  london: 'London 🇬🇧',
  dubai: 'Dubai 🇦🇪',
};

const ASSET_COLORS: Record<string, string> = {
  AUXG: '#EAB308',
  AUXS: '#94A3B8',
  AUXPT: '#E2E8F0',
  AUXPD: '#64748B',
  USD: '#22C55E',
  USDT: '#26A17B',
  AUXM: '#A855F7',
  BTC: '#F7931A',
  ETH: '#627EEA',
  XRP: '#00A3E0',
  SOL: '#9945FF',
};

type TabType = 'metals' | 'crypto' | 'allocations' | 'staking';

export default function AssetsScreen() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress, isConnected } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  
  const { toast, showToast, hideToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('metals');
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showDepositMethod, setShowDepositMethod] = useState(false);
  const [showCoinSelect, setShowCoinSelect] = useState(false);
  const [showDepositAddress, setShowDepositAddress] = useState(false);
  const [showUsdDeposit, setShowUsdDeposit] = useState(false);
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showLockedAssets, setShowLockedAssets] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<DepositCoin | null>(null);
  const [pendingOrdersValue, setPendingOrdersValue] = useState(0); // USD value of pending limit orders
  
  // Detail Modal States
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [selectedStake, setSelectedStake] = useState<StakePosition | null>(null);
  const [showAllocationDetail, setShowAllocationDetail] = useState(false);
  const [showStakeDetail, setShowStakeDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  // i18n - 6 Language Support
  const translations6Lang: Record<string, Record<string, string>> = {
    tr: {
      myAssets: 'Varlıklarım', totalValue: 'Toplam Varlık', available: 'Kullanılabilir', locked: 'Kilitli',
      pendingOrders: 'Bekleyen', physicalDelivery: 'Fiziksel Teslimat', physicalDeliveryDesc: 'Metallerinizi fiziksel olarak teslim alın',
      deposit: 'Yatır', quickBuy: 'Hızlı Al', send: 'Gönder', convert: 'Dönüştür', stake: 'Stake', withdraw: 'Çek',
      metals: 'Metaller', crypto: 'Kripto', allocations: 'Fiziksel', staking: 'Biriktirme',
      recentTx: 'Son İşlemler', viewAll: 'Tümü', noData: 'Henüz veri yok',
      active: 'Aktif', completed: 'Tamamlandı', daysLeft: 'gün', months: 'ay', connectWallet: 'Cüzdan bağlayın',
      // Transaction types
      buy: 'Alım', sell: 'Satım', swap: 'Dönüşüm', exchange: 'Dönüşüm',
      trade_buy: 'Alım', trade_sell: 'Satım', transfer_in: 'Gelen', transfer_out: 'Giden',
      admin_adjustment: 'Düzeltme', unstake: 'Unstake',
      // Detail Modal
      physicalDetails: 'Fiziksel Metal Detayı', stakingDetails: 'Biriktirme Detayı',
      amount: 'Miktar', value: 'Değer', location: 'Lokasyon', allocationDate: 'Tahsis Tarihi',
      txHash: 'İşlem Hash', duration: 'Süre', apy: 'APY', startDate: 'Başlangıç', endDate: 'Bitiş',
      progress: 'İlerleme', expectedReward: 'Beklenen Kazanç', stakeCode: 'Stake Kodu',
      close: 'Kapat', viewOnChain: 'Blockchain\'de Görüntüle', copy: 'Kopyala', copied: 'Kopyalandı!',
      gold: 'Altın', silver: 'Gümüş', platinum: 'Platin', palladium: 'Paladyum',
      zurich: 'Zürih, İsviçre', singapore: 'Singapur', london: 'Londra, İngiltere', dubai: 'Dubai, BAE',
      secureVault: 'Güvenli Kasa', insuredStorage: 'Sigortalı Depolama',
    },
    en: {
      myAssets: 'My Assets', totalValue: 'Total Assets', available: 'Available', locked: 'Locked',
      pendingOrders: 'Pending', physicalDelivery: 'Physical Delivery', physicalDeliveryDesc: 'Get your metals delivered physically',
      deposit: 'Deposit', quickBuy: 'Quick Buy', send: 'Send', convert: 'Convert', stake: 'Stake', withdraw: 'Withdraw',
      metals: 'Metals', crypto: 'Crypto', allocations: 'Physical', staking: 'Staking',
      recentTx: 'Recent', viewAll: 'All', noData: 'No data yet',
      active: 'Active', completed: 'Done', daysLeft: 'days', months: 'mo', connectWallet: 'Connect wallet',
      // Transaction types
      buy: 'Buy', sell: 'Sell', swap: 'Swap', exchange: 'Exchange',
      trade_buy: 'Buy', trade_sell: 'Sell', transfer_in: 'Transfer In', transfer_out: 'Transfer Out',
      admin_adjustment: 'Adjustment', unstake: 'Unstake',
      // Detail Modal
      physicalDetails: 'Physical Metal Details', stakingDetails: 'Staking Details',
      amount: 'Amount', value: 'Value', location: 'Location', allocationDate: 'Allocation Date',
      txHash: 'TX Hash', duration: 'Duration', apy: 'APY', startDate: 'Start Date', endDate: 'End Date',
      progress: 'Progress', expectedReward: 'Expected Reward', stakeCode: 'Stake Code',
      close: 'Close', viewOnChain: 'View on Blockchain', copy: 'Copy', copied: 'Copied!',
      gold: 'Gold', silver: 'Silver', platinum: 'Platinum', palladium: 'Palladium',
      zurich: 'Zurich, Switzerland', singapore: 'Singapore', london: 'London, UK', dubai: 'Dubai, UAE',
      secureVault: 'Secure Vault', insuredStorage: 'Insured Storage',
    },
    de: {
      myAssets: 'Meine Vermögenswerte', totalValue: 'Gesamtwert', available: 'Verfügbar', locked: 'Gesperrt',
      pendingOrders: 'Ausstehend', physicalDelivery: 'Physische Lieferung', physicalDeliveryDesc: 'Lassen Sie Ihre Metalle physisch liefern',
      deposit: 'Einzahlen', quickBuy: 'Schnellkauf', send: 'Senden', convert: 'Umwandeln', stake: 'Staken', withdraw: 'Abheben',
      metals: 'Metalle', crypto: 'Krypto', allocations: 'Physisch', staking: 'Staking',
      recentTx: 'Letzte', viewAll: 'Alle', noData: 'Noch keine Daten',
      active: 'Aktiv', completed: 'Fertig', daysLeft: 'Tage', months: 'Mo', connectWallet: 'Wallet verbinden',
      // Transaction types
      buy: 'Kauf', sell: 'Verkauf', swap: 'Tausch', exchange: 'Tausch',
      trade_buy: 'Kauf', trade_sell: 'Verkauf', transfer_in: 'Eingang', transfer_out: 'Ausgang',
      admin_adjustment: 'Korrektur', unstake: 'Unstaking',
      physicalDetails: 'Physische Metall-Details', stakingDetails: 'Staking-Details',
      amount: 'Betrag', value: 'Wert', location: 'Standort', allocationDate: 'Zuteilungsdatum',
      txHash: 'TX-Hash', duration: 'Dauer', apy: 'APY', startDate: 'Startdatum', endDate: 'Enddatum',
      progress: 'Fortschritt', expectedReward: 'Erwartete Belohnung', stakeCode: 'Stake-Code',
      close: 'Schließen', viewOnChain: 'Auf Blockchain anzeigen', copy: 'Kopieren', copied: 'Kopiert!',
      gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium',
      zurich: 'Zürich, Schweiz', singapore: 'Singapur', london: 'London, UK', dubai: 'Dubai, VAE',
      secureVault: 'Sicherer Tresor', insuredStorage: 'Versicherte Lagerung',
    },
    fr: {
      myAssets: 'Mes Actifs', totalValue: 'Valeur Totale', available: 'Disponible', locked: 'Verrouillé',
      pendingOrders: 'En attente', physicalDelivery: 'Livraison Physique', physicalDeliveryDesc: 'Faites livrer vos métaux physiquement',
      deposit: 'Déposer', quickBuy: 'Achat Rapide', send: 'Envoyer', convert: 'Convertir', stake: 'Staker', withdraw: 'Retirer',
      metals: 'Métaux', crypto: 'Crypto', allocations: 'Physique', staking: 'Staking',
      recentTx: 'Récent', viewAll: 'Tout', noData: 'Pas encore de données',
      active: 'Actif', completed: 'Terminé', daysLeft: 'jours', months: 'mois', connectWallet: 'Connecter le portefeuille',
      // Transaction types
      buy: 'Achat', sell: 'Vente', swap: 'Échange', exchange: 'Échange',
      trade_buy: 'Achat', trade_sell: 'Vente', transfer_in: 'Entrant', transfer_out: 'Sortant',
      admin_adjustment: 'Ajustement', unstake: 'Unstaking',
      physicalDetails: 'Détails du Métal Physique', stakingDetails: 'Détails du Staking',
      amount: 'Montant', value: 'Valeur', location: 'Emplacement', allocationDate: 'Date d\'allocation',
      txHash: 'Hash TX', duration: 'Durée', apy: 'APY', startDate: 'Date de début', endDate: 'Date de fin',
      progress: 'Progression', expectedReward: 'Récompense attendue', stakeCode: 'Code de Stake',
      close: 'Fermer', viewOnChain: 'Voir sur Blockchain', copy: 'Copier', copied: 'Copié!',
      gold: 'Or', silver: 'Argent', platinum: 'Platine', palladium: 'Palladium',
      zurich: 'Zurich, Suisse', singapore: 'Singapour', london: 'Londres, UK', dubai: 'Dubaï, EAU',
      secureVault: 'Coffre Sécurisé', insuredStorage: 'Stockage Assuré',
    },
    ar: {
      myAssets: 'أصولي', totalValue: 'إجمالي الأصول', available: 'متاح', locked: 'مقفل',
      pendingOrders: 'معلق', physicalDelivery: 'التسليم الفعلي', physicalDeliveryDesc: 'احصل على معادنك مسلمة فعلياً',
      deposit: 'إيداع', quickBuy: 'شراء سريع', send: 'إرسال', convert: 'تحويل', stake: 'تخزين', withdraw: 'سحب',
      metals: 'معادن', crypto: 'كريبتو', allocations: 'فيزيائي', staking: 'تخزين',
      recentTx: 'الأخيرة', viewAll: 'الكل', noData: 'لا توجد بيانات بعد',
      active: 'نشط', completed: 'مكتمل', daysLeft: 'أيام', months: 'شهر', connectWallet: 'ربط المحفظة',
      // Transaction types
      buy: 'شراء', sell: 'بيع', swap: 'تبادل', exchange: 'تبادل',
      trade_buy: 'شراء', trade_sell: 'بيع', transfer_in: 'وارد', transfer_out: 'صادر',
      admin_adjustment: 'تعديل', unstake: 'إلغاء التخزين',
      physicalDetails: 'تفاصيل المعدن الفيزيائي', stakingDetails: 'تفاصيل التخزين',
      amount: 'المبلغ', value: 'القيمة', location: 'الموقع', allocationDate: 'تاريخ التخصيص',
      txHash: 'هاش المعاملة', duration: 'المدة', apy: 'APY', startDate: 'تاريخ البدء', endDate: 'تاريخ الانتهاء',
      progress: 'التقدم', expectedReward: 'المكافأة المتوقعة', stakeCode: 'رمز التخزين',
      close: 'إغلاق', viewOnChain: 'عرض على البلوكتشين', copy: 'نسخ', copied: 'تم النسخ!',
      gold: 'ذهب', silver: 'فضة', platinum: 'بلاتين', palladium: 'بالاديوم',
      zurich: 'زيورخ، سويسرا', singapore: 'سنغافورة', london: 'لندن، المملكة المتحدة', dubai: 'دبي، الإمارات',
      secureVault: 'خزنة آمنة', insuredStorage: 'تخزين مؤمن',
    },
    ru: {
      myAssets: 'Мои Активы', totalValue: 'Общая стоимость', available: 'Доступно', locked: 'Заблокировано',
      pendingOrders: 'Ожидание', physicalDelivery: 'Физическая Доставка', physicalDeliveryDesc: 'Получите ваши металлы физически',
      deposit: 'Депозит', quickBuy: 'Быстрая покупка', send: 'Отправить', convert: 'Конвертировать', stake: 'Стейк', withdraw: 'Вывод',
      metals: 'Металлы', crypto: 'Крипто', allocations: 'Физический', staking: 'Стейкинг',
      recentTx: 'Недавние', viewAll: 'Все', noData: 'Пока нет данных',
      active: 'Активный', completed: 'Завершено', daysLeft: 'дней', months: 'мес', connectWallet: 'Подключить кошелек',
      // Transaction types
      buy: 'Покупка', sell: 'Продажа', swap: 'Обмен', exchange: 'Обмен',
      trade_buy: 'Покупка', trade_sell: 'Продажа', transfer_in: 'Входящий', transfer_out: 'Исходящий',
      admin_adjustment: 'Корректировка', unstake: 'Анстейкинг',
      physicalDetails: 'Детали физического металла', stakingDetails: 'Детали стейкинга',
      amount: 'Сумма', value: 'Стоимость', location: 'Местоположение', allocationDate: 'Дата распределения',
      txHash: 'TX хеш', duration: 'Срок', apy: 'APY', startDate: 'Дата начала', endDate: 'Дата окончания',
      progress: 'Прогресс', expectedReward: 'Ожидаемая награда', stakeCode: 'Код стейка',
      close: 'Закрыть', viewOnChain: 'Просмотр в блокчейне', copy: 'Копировать', copied: 'Скопировано!',
      gold: 'Золото', silver: 'Серебро', platinum: 'Платина', palladium: 'Палладий',
      zurich: 'Цюрих, Швейцария', singapore: 'Сингапур', london: 'Лондон, Великобритания', dubai: 'Дубай, ОАЭ',
      secureVault: 'Безопасное хранилище', insuredStorage: 'Застрахованное хранение',
    },
  };
  const t = translations6Lang[language] || translations6Lang.en;

  // Data States
  // Default prices - updated February 2026
  // These are fallbacks, actual prices fetched from API
  const DEFAULT_METAL_PRICES = { AUXG: 165, AUXS: 3.20, AUXPT: 75, AUXPD: 58 };
  const DEFAULT_CRYPTO_PRICES = { BTC: 97000, ETH: 2700, SOL: 200, XRP: 2.5, USDT: 1 };
  const [metalPrices, setMetalPrices] = useState<Record<string, number>>(DEFAULT_METAL_PRICES);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>(DEFAULT_CRYPTO_PRICES);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  
  const [metals, setMetals] = useState<Asset[]>([]);
  const [cryptos, setCryptos] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [stakes, setStakes] = useState<StakePosition[]>([]);
  const [showAllPhysical, setShowAllPhysical] = useState(false);
  const [showAllStaking, setShowAllStaking] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Computed Values - only show real values after prices are loaded from API
  const showValues = pricesLoaded && !loading;
  const totalMetals = showValues ? metals.reduce((sum, m) => sum + m.value, 0) : 0;
  const totalCrypto = showValues ? cryptos.reduce((sum, c) => sum + c.value, 0) : 0;
  // Allocations are NOT counted separately - they're already included in metal balances
  // They just represent WHERE the tokens are physically stored
  const totalAllocations = 0; // Don't double count!
  const totalStaking = showValues ? stakes.reduce((sum, s) => sum + (s.amountGrams * (metalPrices[s.metalSymbol] || 0)), 0) : 0;
  const totalAvailable = totalMetals + totalCrypto;
  const totalLocked = totalStaking; // Only staking is locked, allocations are in balance
  const totalValue = totalAvailable + totalLocked;

  // ═══════════════════════════════════════════════════════════════════════════
  // API FETCH FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchPrices = async () => {
    try {
      // Metal fiyatları
      const metalRes = await fetch(`${API_BASE_URL}/api/prices?chain=84532`);
      const metalData = await metalRes.json();

      // API returns { success, prices: { AUXG: number, ... } }
      if (metalData.success && metalData.prices) {
        setMetalPrices(prev => {
          const updated = { ...prev };
          Object.entries(metalData.prices).forEach(([symbol, price]) => {
            // Only update if price is valid (> 0)
            if (symbol && typeof price === 'number' && price > 0) {
              updated[symbol] = price;
            }
          });
          return updated;
        });
      }

      // Kripto fiyatları
      const cryptoRes = await fetch(`${API_BASE_URL}/api/crypto`);
      const cryptoData = await cryptoRes.json();

      if (cryptoData.bitcoin || cryptoData.ethereum) {
        setCryptoPrices(prev => ({
          ...prev,
          BTC: (cryptoData.bitcoin?.usd && cryptoData.bitcoin.usd > 0) ? cryptoData.bitcoin.usd : prev.BTC,
          ETH: (cryptoData.ethereum?.usd && cryptoData.ethereum.usd > 0) ? cryptoData.ethereum.usd : prev.ETH,
          SOL: (cryptoData.solana?.usd && cryptoData.solana.usd > 0) ? cryptoData.solana.usd : prev.SOL,
          XRP: (cryptoData.ripple?.usd && cryptoData.ripple.usd > 0) ? cryptoData.ripple.usd : prev.XRP,
        }));
      }
      setPricesLoaded(true);
    } catch (error) {
      console.error('Price fetch error:', error);
      // Keep current prices on error - don't reset to defaults
      setPricesLoaded(true); // Still mark as loaded to prevent infinite loading
    }
  };

  const fetchBalances = async () => {
    if (!walletAddress) {
      loadMockBalances();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/balance?address=${walletAddress}`);
      const data = await res.json();

      if (data.success && data.balances) {
        // Metal bakiyeleri
        const metalBalances: Asset[] = [];
        const cryptoBalances: Asset[] = [];

        // Önce AUXM'i bonusla birlikte ekle
        const auxmBal = data.balances.auxm || 0;
        const bonusAuxm = data.balances.bonusAuxm || 0;
        console.log('fetchBalances - auxm:', auxmBal, 'bonusAuxm:', bonusAuxm);
        
        Object.entries(data.balances).forEach(([symbol, balance]: [string, any]) => {
          const bal = typeof balance === 'number' ? balance : parseFloat(balance) || 0;
          if (bal <= 0) return;
          // Skip internal fields and AUXM (handled separately)
          if (['bonusauxm', 'totalauxm', 'bonusExpiresAt', 'auxm'].includes(symbol.toLowerCase())) return;

          if (['auxg', 'auxs', 'auxpt', 'auxpd'].includes(symbol.toLowerCase())) {
            const upperSymbol = symbol.toUpperCase();
            const price = metalPrices[upperSymbol] || 0;
            metalBalances.push({
              symbol: upperSymbol,
              name: METAL_INFO[upperSymbol]?.name || upperSymbol,
              balance: bal,
              price,
              value: bal * price,
              change24h: data.changes?.[symbol] || 0,
              color: ASSET_COLORS[upperSymbol] || '#64748b',
            });
          } else {
            const upperSym = symbol.toUpperCase();
            const price = upperSym === 'BTC' ? cryptoPrices.BTC : upperSym === 'ETH' ? cryptoPrices.ETH : upperSym === 'SOL' ? cryptoPrices.SOL || 150 : upperSym === 'XRP' ? cryptoPrices.XRP || 2.5 : upperSym === 'USDT' ? 1 : 1;
            cryptoBalances.push({
              symbol: symbol.toUpperCase(),
              name: getAssetName(symbol),
              balance: bal,
              price,
              value: bal * price,
              change24h: data.changes?.[symbol] || 0,
              color: ASSET_COLORS[symbol.toUpperCase()] || '#64748b',
              icon: getAssetIcon(symbol.toUpperCase()),
            });
          }
        });

        // AUXM'i bonus ile ekle
        if (auxmBal > 0 || bonusAuxm > 0) {
          cryptoBalances.push({
            symbol: 'AUXM',
            name: 'Auxite Money',
            balance: auxmBal,
            bonusBalance: bonusAuxm,
            price: 1,
            value: auxmBal + bonusAuxm,
            change24h: 0,
            color: '#A855F7',
            icon: '◈',
          });
        }
        
        if (metalBalances.length > 0) setMetals(metalBalances);
        if (cryptoBalances.length > 0) setCryptos(cryptoBalances);
      } else {
        loadMockBalances();
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      loadMockBalances();
    }
  };

  const fetchAllocations = async () => {
    if (!walletAddress) {
      loadMockAllocations();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/allocations?address=${walletAddress}`);
      const data = await res.json();

      if (data.success && data.allocations && data.allocations.length > 0) {
        setAllocations(data.allocations);
      } else {
        loadMockAllocations();
      }
    } catch (error) {
      console.error('Allocations fetch error:', error);
      loadMockAllocations();
    }
  };

  const fetchStakes = async () => {
    if (!walletAddress) {
      loadMockStakes();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/stakes?address=${walletAddress}`);
      const data = await res.json();

      if (data.success && data.stakes && data.stakes.length > 0) {
        const formattedStakes = data.stakes.map((p: any) => {
          // Duration: gün ise aya çevir, durationMonths varsa kullan
          const durationDays = parseInt(p.duration) || 91;
          const durationMonths = p.durationMonths || Math.round(durationDays / 30);
          
          // Progress hesapla
          const startDate = new Date(p.startDate);
          const endDate = new Date(p.endDate);
          const now = new Date();
          const totalDuration = endDate.getTime() - startDate.getTime();
          const elapsed = now.getTime() - startDate.getTime();
          const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
          
          return {
            id: p.id || String(Date.now()),
            metalSymbol: p.metal || 'AUXG',
            amountGrams: parseFloat(p.amount) || 0,
            durationMonths: durationMonths,
            apyPercent: parseFloat(p.apy) || 0,
            progress: progress,
            isMatured: p.status === 'matured' || progress >= 100,
            shortCode: p.agreementNo || '',
            expectedRewardGrams: (parseFloat(p.amount) || 0) * (parseFloat(p.apy) || 0) / 100 * (durationMonths / 12),
            startDate: p.startDate,
            endDate: p.endDate,
          };
        });
        setStakes(formattedStakes);
      } else {
        loadMockStakes();
      }
    } catch (error) {
      console.error('Stakes fetch error:', error);
      loadMockStakes();
    }
  };

  const fetchTransactions = async () => {
    if (!walletAddress) {
      loadMockTransactions();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions?address=${walletAddress}&limit=5`);
      const data = await res.json();

      if (data.ok && data.transactions && data.transactions.length > 0) {
        setTransactions(data.transactions);
      } else {
        loadMockTransactions();
      }
    } catch (error) {
      console.error('Transactions fetch error:', error);
      loadMockTransactions();
    }
  };

  const loadMockBalances = async () => {
    console.log('loadMockBalances called, walletAddress:', walletAddress);
    try {
      const addr = walletAddress;
      if (!addr) return;
      const res = await fetch(`${API_URL}/api/user/balance?address=${addr}`);
      const data = await res.json();
      if (data.balances) {
        const b = data.balances;
        const metalList: Asset[] = [];
        const cryptoList: Asset[] = [];
        
        // Metals
        if (b.auxg > 0) metalList.push({ symbol: 'AUXG', name: 'Gold', balance: b.auxg, price: metalPrices.AUXG, value: b.auxg * metalPrices.AUXG, change24h: 0, color: '#EAB308' });
        if (b.auxs > 0) metalList.push({ symbol: 'AUXS', name: 'Silver', balance: b.auxs, price: metalPrices.AUXS, value: b.auxs * metalPrices.AUXS, change24h: 0, color: '#94A3B8' });
        if (b.auxpt > 0) metalList.push({ symbol: 'AUXPT', name: 'Platinum', balance: b.auxpt, price: metalPrices.AUXPT, value: b.auxpt * metalPrices.AUXPT, change24h: 0, color: '#E2E8F0' });
        if (b.auxpd > 0) metalList.push({ symbol: 'AUXPD', name: 'Palladium', balance: b.auxpd, price: metalPrices.AUXPD, value: b.auxpd * metalPrices.AUXPD, change24h: 0, color: '#64748B' });
        
        // Cryptos
        if (b.usd > 0) cryptoList.push({ symbol: 'USD', name: 'US Dollar', balance: b.usd, price: 1, value: b.usd, change24h: 0, color: '#22C55E', icon: '$' });
        if (b.usdt > 0) cryptoList.push({ symbol: 'USDT', name: 'Tether', balance: b.usdt, price: 1, value: b.usdt, change24h: 0, color: '#26A17B', icon: '₮' });
        console.log('AUXM bonusAuxm:', b.bonusAuxm);
        if (b.auxm > 0 || b.bonusAuxm > 0) cryptoList.push({ symbol: 'AUXM', name: 'Auxite Money', balance: b.auxm || 0, bonusBalance: b.bonusAuxm || 0, price: 1, value: (b.auxm || 0) + (b.bonusAuxm || 0), change24h: 0, color: '#A855F7', icon: '◈' });
        if (b.btc > 0) cryptoList.push({ symbol: 'BTC', name: 'Bitcoin', balance: b.btc, price: cryptoPrices.BTC, value: b.btc * cryptoPrices.BTC, change24h: 0, color: '#F7931A', icon: '₿' });
        if (b.eth > 0) cryptoList.push({ symbol: 'ETH', name: 'Ethereum', balance: b.eth, price: cryptoPrices.ETH, value: b.eth * cryptoPrices.ETH, change24h: 0, color: '#627EEA', icon: 'Ξ' });
        if (b.xrp > 0) cryptoList.push({ symbol: 'XRP', name: 'Ripple', balance: b.xrp, price: 1, value: b.xrp, change24h: 0, color: '#00A3E0', icon: '✕' });
        if (b.sol > 0) cryptoList.push({ symbol: 'SOL', name: 'Solana', balance: b.sol, price: 1, value: b.sol, change24h: 0, color: '#9945FF', icon: '◎' });
        
        if (metalList.length > 0) setMetals(metalList);
        if (cryptoList.length > 0) setCryptos(cryptoList);
      }
    } catch (err) {
      console.error("Failed to load balances:", err);
    }
  };

  const loadMockAllocations = () => {
    setAllocations([]);
  };

  const loadMockStakes = async () => {
    try {
      const addr = walletAddress;
      if (!addr) return;
      const res = await fetch(`${API_URL}/api/stakes?address=${addr}`);
      const data = await res.json();
      if (data.stakes) {
        const formatted = data.stakes.map((s: any) => ({
          id: s.id,
          metalSymbol: s.metal,
          amountGrams: s.amount,
          durationMonths: s.duration / 30,
          apyPercent: 1.53,
          progress: Math.min(100, Math.floor((Date.now() - new Date(s.startDate).getTime()) / (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) * 100)),
          timeRemaining: Math.max(0, Math.floor((new Date(s.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          isMatured: new Date(s.endDate).getTime() < Date.now(),
          shortCode: s.id.slice(0, 12),
          expectedRewardGrams: s.amount * 0.0153 * (s.duration / 365)
        }));
        setStakes(formatted);
      }
    } catch (err) {
      console.error("Failed to load stakes:", err);
    }
  };

  const loadMockTransactions = async () => {
    try {
      const addr = walletAddress;
      if (!addr) return;
      const res = await fetch(`${API_URL}/api/user/transactions?address=${addr}&limit=5`);
      const data = await res.json();
      if (data.transactions) {
        const formatted = data.transactions.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          asset: tx.token || tx.toToken || tx.fromToken,
          amount: parseFloat(tx.amount) || parseFloat(tx.toAmount || tx.fromAmount || 0),
          value: Math.abs(parseFloat(tx.amount) || parseFloat(tx.fromAmount || 0)),
          status: tx.status,
          date: new Date(tx.timestamp).toISOString().split("T")[0]
        }));
        setTransactions(formatted);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getAssetName = (symbol: string): string => {
    const names: Record<string, string> = {
      USD: 'US Dollar', USDT: 'Tether', AUXM: 'Auxite Money', BTC: 'Bitcoin', ETH: 'Ethereum'
    };
    return names[symbol] || symbol;
  };

  const getAssetIcon = (symbol: string): string => {
    const icons: Record<string, string> = { 
      USD: '$', 
      USDT: '₮', 
      AUXM: '◈', 
      BTC: '₿', 
      ETH: 'Ξ',
      XRP: '✕',
      SOL: '◎'
    };
    return icons[symbol] || symbol[0];
  };

  const formatValue = (v: number) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const formatBalance = (b: number, s: string) => {
    if (['BTC', 'ETH'].includes(s)) return b.toFixed(4);
    if (['AUXG', 'AUXS', 'AUXPT', 'AUXPD'].includes(s)) return b.toFixed(4);
    return b.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getChangeColor = (c: number) => c > 0 ? '#10b981' : c < 0 ? '#ef4444' : isDark ? '#94a3b8' : '#64748b';
  const getTypeIcon = (type: string) => ({ deposit: 'arrow-down-circle', withdraw: 'arrow-up-circle', buy: 'cart', sell: 'pricetag', stake: 'trending-up', convert: 'swap-horizontal', allocate: 'cube' }[type] || 'ellipse');
  const getTypeColor = (type: string) => ({ deposit: '#10b981', withdraw: '#ef4444', buy: '#8b5cf6', sell: '#f59e0b', stake: '#eab308', convert: '#f97316', allocate: '#22d3ee' }[type] || '#64748b');

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPrices();
      await Promise.all([fetchBalances(), fetchAllocations(), fetchStakes(), fetchTransactions()]);
      setLoading(false);
    };
    loadData();

    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  // Fiyatlar değişince bakiyeleri güncelle
  useEffect(() => {
    setMetals(prev => prev.map(m => ({ ...m, price: metalPrices[m.symbol] || m.price, value: m.balance * (metalPrices[m.symbol] || m.price) })));
  }, [metalPrices]);

  useEffect(() => {
    setCryptos(prev => prev.map(c => {
      // Get price from cryptoPrices state, fallback to current price
      const price = cryptoPrices[c.symbol] || c.price;
      return { ...c, price, value: c.balance * price };
    }));
  }, [cryptoPrices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    await Promise.all([fetchBalances(), fetchAllocations(), fetchStakes(), fetchTransactions()]);
    setRefreshing(false);
    showToast("success", "Veriler güncellendi");
  }, [walletAddress]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDeposit = () => setShowDepositMethod(true);
  const handleSelectCrypto = () => { setShowDepositMethod(false); setShowCoinSelect(true); };
  const handleSelectUsd = () => { setShowDepositMethod(false); setShowUsdDeposit(true); };
  const handleSelectCoin = (coin: DepositCoin) => { setSelectedCoin(coin); setShowCoinSelect(false); setShowDepositAddress(true); };
  const handleQuickBuy = () => setShowQuickBuy(true);
  const handleSend = () => setShowSend(true);
  const handleConvert = () => router.push('/(tabs)/convert' as any);
  const handleStakeNav = () => router.push('/(tabs)/stake' as any);
  const handleWithdraw = () => setShowWithdraw(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  const ActionButton = ({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#1e293b' : '#fff' }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: isDark ? '#e2e8f0' : '#334155' }]}>{label}</Text>
    </TouchableOpacity>
  );

  const AssetRow = ({ asset, isMetal }: { asset: Asset; isMetal: boolean }) => (
    <TouchableOpacity style={[styles.assetRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]} activeOpacity={0.7}>
      <View style={styles.assetLeft}>
        <View style={[styles.assetIcon, { backgroundColor: asset.color + '20' }]}>
          {isMetal && metalIcons[asset.symbol] ? (
            <Image source={metalIcons[asset.symbol]} style={styles.metalImage} resizeMode="contain" />
          ) : (
            <Text style={[styles.assetIconText, { color: asset.color }]}>{asset.icon || asset.symbol[0]}</Text>
          )}
        </View>
        <View>
          <Text style={[styles.assetSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{asset.symbol}</Text>
        </View>
      </View>
      <View style={styles.assetRight}>
        <Text style={[styles.assetBalance, { color: isDark ? '#fff' : '#0f172a' }]}>{formatBalance(asset.balance, asset.symbol)}</Text>
        {asset.symbol === 'AUXM' && asset.bonusBalance && asset.bonusBalance > 0 ? (
          <Text style={[styles.assetBonus, { color: '#10b981' }]}>+ {formatBalance(asset.bonusBalance, 'AUXM')} Bonus</Text>
        ) : (
          <Text style={[styles.assetValue, { color: getChangeColor(asset.change24h) }]}>{formatValue(asset.value)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const AllocationRow = ({ alloc }: { alloc: Allocation }) => {
    const metal = METAL_INFO[alloc.metal];
    const price = metalPrices[alloc.metal] || 0;
    const value = alloc.grams * price;
    return (
      <TouchableOpacity 
        style={[styles.assetRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedAllocation(alloc);
          setShowAllocationDetail(true);
        }}
      >
        <View style={styles.assetLeft}>
          <View style={[styles.assetIcon, { backgroundColor: (metal?.color || '#64748b') + '20' }]}>
            {metalIcons[alloc.metal] ? (
              <Image source={metalIcons[alloc.metal]} style={styles.metalImage} resizeMode="contain" />
            ) : (
              <Text style={[styles.assetIconText, { color: metal?.color }]}>{alloc.metal[0]}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.assetSymbol, { color: metal?.color }]}>{alloc.metal}</Text>
            <Text style={[styles.serialText, { color: isDark ? '#64748b' : '#94a3b8' }]}>{alloc.serialNumber}</Text>
            <Text style={[styles.vaultText, { color: isDark ? '#64748b' : '#94a3b8' }]}>📍 {alloc.vaultName || alloc.vault}</Text>
          </View>
        </View>
        <View style={styles.assetRight}>
          <Text style={[styles.assetBalance, { color: isDark ? '#fff' : '#0f172a' }]}>{alloc.grams}g</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.assetValue, { color: isDark ? '#64748b' : '#94a3b8' }]}>≈ {formatValue(value)}</Text>
            <Ionicons name="chevron-forward" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const StakeRow = ({ stake }: { stake: StakePosition }) => {
    const metal = METAL_INFO[stake.metalSymbol];
    return (
      <TouchableOpacity 
        style={[styles.assetRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedStake(stake);
          setShowStakeDetail(true);
        }}
      >
        <View style={styles.assetLeft}>
          <View style={[styles.assetIcon, { backgroundColor: (metal?.color || '#64748b') + '20' }]}>
            {metalIcons[stake.metalSymbol] ? (
              <Image source={metalIcons[stake.metalSymbol]} style={styles.metalImage} resizeMode="contain" />
            ) : (
              <Text style={[styles.assetIconText, { color: metal?.color }]}>{stake.metalSymbol[0]}</Text>
            )}
          </View>
          <View>
            <View style={styles.stakeHeader}>
              <Text style={[styles.assetSymbol, { color: metal?.color }]}>{stake.metalSymbol}</Text>
              <View style={[styles.stakeBadge, { backgroundColor: stake.isMatured ? '#10b98120' : '#3b82f620' }]}>
                <Text style={[styles.stakeBadgeText, { color: stake.isMatured ? '#10b981' : '#3b82f6' }]}>
                  {stake.isMatured ? t.completed : t.active}
                </Text>
              </View>
            </View>
              <Text style={[styles.stakeDetail, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              {stake.durationMonths || 0}{t.months} • {stake.apyPercent || 0}% APY
            </Text>
          </View>
        </View>
        <View style={styles.assetRight}>
          <Text style={[styles.assetBalance, { color: isDark ? '#fff' : '#0f172a' }]}>{Number(stake.amountGrams || 0).toFixed(4)}</Text>
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
              <View style={[styles.progressFill, { width: `${stake.progress || 0}%`, backgroundColor: stake.isMatured ? '#10b981' : '#3b82f6' }]} />
            </View>
            <Text style={[styles.progressText, { color: isDark ? '#64748b' : '#94a3b8' }]}>{stake.progress || 0}%</Text>
            <Ionicons name="chevron-forward" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <Toast visible={toast.visible} type={toast.type} title={toast.title} message={toast.message} onHide={hideToast} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Value Card */}
        <View style={[styles.totalCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.totalLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.totalValue}</Text>
          <Text style={[styles.totalValue, { color: isDark ? '#fff' : '#0f172a' }]}>
            {!showValues ? '...' : formatValue(totalValue)}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{!showValues ? '...' : formatValue(totalAvailable)}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.available}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => setShowLockedAssets(true)}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{!showValues ? '...' : formatValue(totalLocked)}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.locked} 🔒</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/limit-orders')}>
              <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{!showValues ? '...' : formatValue(pendingOrdersValue)}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.pendingOrders} ⏳</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons - 2 Rows, 3 per row */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            <ActionButton icon="add-circle" label={t.deposit} color="#10b981" onPress={handleDeposit} />
            <ActionButton icon="cart" label={t.quickBuy} color="#8b5cf6" onPress={handleQuickBuy} />
            <ActionButton icon="swap-horizontal" label={t.convert} color="#f97316" onPress={handleConvert} />
          </View>
          <View style={styles.actionsRow}>
            <ActionButton icon="send" label={t.send} color="#3b82f6" onPress={handleSend} />
            <ActionButton icon="layers" label={t.stake} color="#eab308" onPress={handleStakeNav} />
            <ActionButton icon="arrow-up-circle" label={t.withdraw} color="#ef4444" onPress={handleWithdraw} />
          </View>
        </View>

        {/* My Assets Title */}
        <Text style={[styles.myAssetsTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
          {t.myAssets}
        </Text>

        {/* Tab Menu */}
        <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          {/* Metals Tab */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'metals' && styles.tabItemActive]}
            onPress={() => setActiveTab('metals')}
          >
            <Ionicons name="cube" size={16} color={activeTab === 'metals' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8')} />
            <Text style={[styles.tabLabel, { color: activeTab === 'metals' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8') }]}>{t.metals}</Text>
          </TouchableOpacity>

          {/* Crypto Tab */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'crypto' && styles.tabItemActive]}
            onPress={() => setActiveTab('crypto')}
          >
            <Ionicons name="logo-bitcoin" size={16} color={activeTab === 'crypto' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8')} />
            <Text style={[styles.tabLabel, { color: activeTab === 'crypto' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8') }]}>{t.crypto}</Text>
          </TouchableOpacity>

          {/* Allocations Tab */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'allocations' && styles.tabItemActive]}
            onPress={() => setActiveTab('allocations')}
          >
            <Ionicons name="lock-closed" size={16} color={activeTab === 'allocations' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8')} />
            <Text style={[styles.tabLabel, { color: activeTab === 'allocations' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8') }]}>{t.allocations}</Text>
          </TouchableOpacity>

          {/* Staking Tab */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'staking' && styles.tabItemActive]}
            onPress={() => setActiveTab('staking')}
          >
            <Ionicons name="trending-up" size={16} color={activeTab === 'staking' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8')} />
            <Text style={[styles.tabLabel, { color: activeTab === 'staking' ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8') }]}>{t.staking}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={[styles.tabContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          {loading ? (
            <ActivityIndicator size="small" color="#f59e0b" style={{ padding: 30 }} />
          ) : activeTab === 'metals' ? (
            metals.length === 0 ? (
              <Text style={[styles.noData, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.noData}</Text>
            ) : (
              metals.map((asset) => <AssetRow key={asset.symbol} asset={asset} isMetal={true} />)
            )
          ) : activeTab === 'crypto' ? (
            cryptos.length === 0 ? (
              <Text style={[styles.noData, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.noData}</Text>
            ) : (
              cryptos.map((asset) => <AssetRow key={asset.symbol} asset={asset} isMetal={false} />)
            )
          ) : activeTab === 'allocations' ? (
            allocations.length === 0 ? (
              <Text style={[styles.noData, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.noData}</Text>
            ) : (
              <>
                {(showAllPhysical ? allocations : allocations.slice(0, 3)).map((alloc, idx) => <AllocationRow key={`${alloc.id}-${idx}`} alloc={alloc} />)}
                {allocations.length > 3 && (
                  <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowAllPhysical(!showAllPhysical)}>
                    <Text style={styles.viewAllBtnText}>{showAllPhysical ? 'Show Less' : `View All (${allocations.length})`}</Text>
                    <Ionicons name={showAllPhysical ? 'chevron-up' : 'chevron-down'} size={14} color="#10b981" />
                  </TouchableOpacity>
                )}
              </>
            )
          ) : (
            stakes.length === 0 ? (
              <Text style={[styles.noData, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.noData}</Text>
            ) : (
              <>
                {(showAllStaking ? stakes : stakes.slice(0, 3)).map((stake) => <StakeRow key={stake.id} stake={stake} />)}
                {stakes.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllBtn}
                    onPress={() => setShowAllStaking(!showAllStaking)}
                  >
                    <Text style={styles.viewAllBtnText}>
                      {showAllStaking ? 'Show Less' : `View All (${stakes.length})`}
                    </Text>
                    <Ionicons name={showAllStaking ? 'chevron-up' : 'chevron-down'} size={14} color="#10b981" />
                  </TouchableOpacity>
                )}
              </>
            )
          )}
        </View>

        {/* Physical Delivery Button */}
        <TouchableOpacity 
          style={[styles.physicalDeliveryButton, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
          onPress={() => router.push('/physical-delivery')}
          activeOpacity={0.8}
        >
          <View style={[styles.physicalDeliveryIconBg, { backgroundColor: '#eab308' + '20' }]}>
            <Ionicons name="cube-outline" size={22} color="#eab308" />
          </View>
          <View style={styles.physicalDeliveryTextContainer}>
            <Text style={[styles.physicalDeliveryTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.physicalDelivery}</Text>
            <Text style={[styles.physicalDeliveryDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.physicalDeliveryDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={[styles.txSection, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <View style={styles.txHeader}>
            <Text style={[styles.txTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.recentTx}</Text>
            <TouchableOpacity><Text style={styles.viewAll}>{t.viewAll}</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#f59e0b" style={{ padding: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={[styles.noData, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.noData}</Text>
          ) : (
            (showAllTransactions ? transactions : transactions.slice(0, 3)).map((tx) => (
              <View key={tx.id || tx.timestamp || Math.random()} style={[styles.txRow, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, { backgroundColor: getTypeColor(tx.type) + '20' }]}>
                    <Ionicons name={getTypeIcon(tx.type) as any} size={14} color={getTypeColor(tx.type)} />
                  </View>
                  <View>
                    <Text style={[styles.txType, { color: isDark ? '#fff' : '#0f172a' }]}>{(t as any)[tx.type] || tx.type}</Text>
                    <Text style={[styles.txDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>{tx.date}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.amount < 0 ? '#ef4444' : '#10b981' }]}>
                    {tx.amount < 0 ? '' : '+'}{tx.amount.toFixed(4)} {tx.asset}
                  </Text>
                  <View style={[styles.txStatus, { backgroundColor: tx.status === 'completed' ? '#10b98120' : '#f59e0b20' }]}>
                    <Text style={[styles.txStatusText, { color: tx.status === 'completed' ? '#10b981' : '#f59e0b' }]}>{tx.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <DepositMethodModal visible={showDepositMethod} onClose={() => setShowDepositMethod(false)} onSelectCrypto={handleSelectCrypto} onSelectUsd={handleSelectUsd} />
      <CoinSelectModal visible={showCoinSelect} onClose={() => setShowCoinSelect(false)} onSelectCoin={handleSelectCoin} />
      <DepositAddressModal visible={showDepositAddress} onClose={() => { setShowDepositAddress(false); setSelectedCoin(null); }} coin={selectedCoin} />
      <UsdDepositModal visible={showUsdDeposit} onClose={() => setShowUsdDeposit(false)} />
      <QuickBuyModal visible={showQuickBuy} onClose={() => setShowQuickBuy(false)} />
     <SendModal visible={showSend} onClose={() => setShowSend(false)} walletAddress={walletAddress} />
      <WithdrawModal 
        visible={showWithdraw} 
        onClose={() => setShowWithdraw(false)} 
        walletAddress={walletAddress}
        auxmBalance={0}
        onSuccess={() => {
          // Refresh balances after withdraw
          loadMockBalances();
        }}
      />
      <LockedAssetsModal visible={showLockedAssets} onClose={() => setShowLockedAssets(false)} metalPrices={metalPrices} />

      {/* Physical Metal Detail Modal */}
      <Modal visible={showAllocationDetail} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            {selectedAllocation && (() => {
              const metal = METAL_INFO[selectedAllocation.metal];
              const price = metalPrices[selectedAllocation.metal] || 0;
              const value = selectedAllocation.grams * price;
              const metalName = t[selectedAllocation.metal === 'AUXG' ? 'gold' : selectedAllocation.metal === 'AUXS' ? 'silver' : selectedAllocation.metal === 'AUXPT' ? 'platinum' : 'palladium'] || metal?.name;
              const locationKey = selectedAllocation.custodian as 'zurich' | 'singapore' | 'london' | 'dubai';
              const locationName = t[locationKey] || CUSTODIAN_NAMES[selectedAllocation.custodian];
              
              return (
                <>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.modalIcon, { backgroundColor: (metal?.color || '#64748b') + '20' }]}>
                        {metalIcons[selectedAllocation.metal] && (
                          <Image source={metalIcons[selectedAllocation.metal]} style={{ width: 28, height: 28 }} resizeMode="contain" />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{selectedAllocation.metal}</Text>
                        <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{metalName}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => { setShowAllocationDetail(false); setSelectedAllocation(null); }}>
                      <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <ScrollView style={styles.modalContent}>
                    {/* Amount & Value */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.amount}</Text>
                        <Text style={[styles.detailValue, { color: metal?.color }]}>{selectedAllocation.grams}g</Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.value}</Text>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>{formatValue(value)}</Text>
                      </View>
                    </View>

                    {/* Location */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="location" size={18} color="#f59e0b" />
                          <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.location}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>{locationName}</Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                      <View style={styles.locationInfo}>
                        <View style={styles.locationFeature}>
                          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                          <Text style={[styles.locationFeatureText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.secureVault}</Text>
                        </View>
                        <View style={styles.locationFeature}>
                          <Ionicons name="documents" size={16} color="#3b82f6" />
                          <Text style={[styles.locationFeatureText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.insuredStorage}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Allocation Date */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="calendar" size={18} color="#8b5cf6" />
                          <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.allocationDate}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                          {new Date(selectedAllocation.allocatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    {/* TX Hash */}
                    {selectedAllocation.txHash && (
                      <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.txHash}</Text>
                          <TouchableOpacity 
                            style={styles.copyButton}
                            onPress={async () => {
                              await Clipboard.setStringAsync(selectedAllocation.txHash || '');
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                          >
                            <Text style={[styles.txHashText, { color: '#3b82f6' }]}>
                              {selectedAllocation.txHash.slice(0, 8)}...{selectedAllocation.txHash.slice(-6)}
                            </Text>
                            <Ionicons name={copied ? 'checkmark' : 'copy'} size={14} color="#3b82f6" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                          style={styles.viewOnChainButton}
                          onPress={() => Linking.openURL(`https://polygonscan.com/tx/${selectedAllocation.txHash}`)}
                        >
                          <Ionicons name="open-outline" size={16} color="#f59e0b" />
                          <Text style={styles.viewOnChainText}>{t.viewOnChain}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>

                  {/* Close Button */}
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => { setShowAllocationDetail(false); setSelectedAllocation(null); }}
                  >
                    <Text style={styles.closeButtonText}>{t.close}</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Staking Detail Modal */}
      <Modal visible={showStakeDetail} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            {selectedStake && (() => {
              const metal = METAL_INFO[selectedStake.metalSymbol];
              const price = metalPrices[selectedStake.metalSymbol] || 0;
              const value = selectedStake.amountGrams * price;
              const rewardValue = selectedStake.expectedRewardGrams * price;
              const metalName = t[selectedStake.metalSymbol === 'AUXG' ? 'gold' : selectedStake.metalSymbol === 'AUXS' ? 'silver' : selectedStake.metalSymbol === 'AUXPT' ? 'platinum' : 'palladium'] || metal?.name;
              
              return (
                <>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.modalIcon, { backgroundColor: (metal?.color || '#64748b') + '20' }]}>
                        {metalIcons[selectedStake.metalSymbol] && (
                          <Image source={metalIcons[selectedStake.metalSymbol]} style={{ width: 28, height: 28 }} resizeMode="contain" />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{selectedStake.metalSymbol}</Text>
                        <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{metalName}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: selectedStake.isMatured ? '#10b98120' : '#3b82f620' }]}>
                      <Text style={[styles.statusText, { color: selectedStake.isMatured ? '#10b981' : '#3b82f6' }]}>
                        {selectedStake.isMatured ? t.completed : t.active}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={{ position: 'absolute', top: 20, right: 20 }}
                    onPress={() => { setShowStakeDetail(false); setSelectedStake(null); }}
                  >
                    <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>

                  {/* Content */}
                  <ScrollView style={styles.modalContent}>
                    {/* Amount & Value */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.amount}</Text>
                        <Text style={[styles.detailValue, { color: metal?.color }]}>{selectedStake.amountGrams.toFixed(4)}</Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.value}</Text>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>{formatValue(value)}</Text>
                      </View>
                    </View>

                    {/* Duration & APY */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="time" size={18} color="#8b5cf6" />
                          <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.duration}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>{selectedStake.durationMonths} {t.months}</Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                      <View style={styles.detailRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="trending-up" size={18} color="#10b981" />
                          <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.apy}</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: '#10b981' }]}>{selectedStake.apyPercent}%</Text>
                      </View>
                    </View>

                    {/* Dates */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.startDate}</Text>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                          {selectedStake.startDate ? new Date(selectedStake.startDate).toLocaleDateString() : '-'}
                        </Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.endDate}</Text>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                          {selectedStake.endDate ? new Date(selectedStake.endDate).toLocaleDateString() : '-'}
                        </Text>
                      </View>
                    </View>

                    {/* Progress */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.progress}</Text>
                        <Text style={[styles.detailValue, { color: selectedStake.isMatured ? '#10b981' : '#3b82f6' }]}>{selectedStake.progress}%</Text>
                      </View>
                      <View style={[styles.progressBarLarge, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                        <View style={[styles.progressFillLarge, { width: `${selectedStake.progress}%`, backgroundColor: selectedStake.isMatured ? '#10b981' : '#3b82f6' }]} />
                      </View>
                      {selectedStake.timeRemaining && selectedStake.timeRemaining > 0 && (
                        <Text style={[styles.timeRemaining, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                          {selectedStake.timeRemaining} {t.daysLeft}
                        </Text>
                      )}
                    </View>

                    {/* Expected Reward */}
                    <View style={[styles.detailCard, { backgroundColor: '#10b98110', borderColor: '#10b98130', borderWidth: 1 }]}>
                      <View style={styles.detailRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="gift" size={18} color="#10b981" />
                          <Text style={[styles.detailLabel, { color: '#10b981' }]}>{t.expectedReward}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.detailValue, { color: '#10b981' }]}>+{selectedStake.expectedRewardGrams.toFixed(4)}</Text>
                          <Text style={[styles.rewardValue, { color: '#10b981' }]}>≈ {formatValue(rewardValue)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Stake Code */}
                    <View style={[styles.detailCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.stakeCode}</Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={async () => {
                            await Clipboard.setStringAsync(selectedStake.shortCode);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          <Text style={[styles.stakeCodeText, { color: '#f59e0b' }]}>{selectedStake.shortCode}</Text>
                          <Ionicons name={copied ? 'checkmark' : 'copy'} size={14} color="#f59e0b" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Close Button */}
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => { setShowStakeDetail(false); setSelectedStake(null); }}
                  >
                    <Text style={styles.closeButtonText}>{t.close}</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 60 },

  // Total Card
  totalCard: { margin: 16, padding: 16, borderRadius: 16 },
  totalLabel: { fontSize: 12, marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '600' },
  statLabel: { fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 30 },

  // Actions - 2 Rows
  actionsContainer: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  actionIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionLabel: { fontSize: 10, fontWeight: '600' },

  // My Assets Title
  myAssetsTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 8 },

  // Tabs
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, padding: 4, marginBottom: 8 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10 },
  tabItemActive: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  tabLabel: { fontSize: 10, fontWeight: '600' },

  // Tab Content
  tabContent: { marginHorizontal: 16, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  noData: { padding: 30, textAlign: 'center', fontSize: 13 },

  // Physical Delivery Button
  physicalDeliveryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  physicalDeliveryIconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  physicalDeliveryTextContainer: { flex: 1 },
  physicalDeliveryTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  physicalDeliveryDesc: { fontSize: 12 },

  // Asset Row
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  assetLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assetIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  metalImage: { width: 20, height: 20 },
  assetIconText: { fontSize: 15, fontWeight: '700' },
  assetSymbol: { fontSize: 13, fontWeight: '600' },
  serialText: { fontSize: 10, fontFamily: "monospace", marginTop: 2 },
  vaultText: { fontSize: 10, marginTop: 2 },
  assetName: { fontSize: 10, marginTop: 1 },
  assetRight: { alignItems: 'flex-end' },
  assetBalance: { fontSize: 13, fontWeight: '600' },
  assetBonus: {
    fontSize: 12,
    fontWeight: '600',
  },
  assetValue: { fontSize: 11, marginTop: 1 },

  // Stake Row
  stakeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stakeBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  stakeBadgeText: { fontSize: 8, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  progressBar: { width: 50, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 9 },

  // Transactions
  txSection: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 },
  txTitle: { fontSize: 14, fontWeight: '600' },
  viewAll: { fontSize: 11, color: '#f59e0b', fontWeight: '500' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  txType: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  txDate: { fontSize: 9, marginTop: 1 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 12, fontWeight: '600' },
  txStatus: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  txStatusText: { fontSize: 8, fontWeight: '500' },

  // Detail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#33415530',
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalContent: {
    padding: 16,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailDivider: {
    height: 1,
    marginVertical: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  locationFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationFeatureText: {
    fontSize: 11,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txHashText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  stakeCodeText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  viewOnChainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f59e0b20',
  },
  viewOnChainText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f59e0b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarLarge: {
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 4,
  },
  timeRemaining: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  rewardValue: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    marginHorizontal: 16,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
