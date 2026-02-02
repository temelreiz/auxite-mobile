// app/(tabs)/stake.tsx
// Metal Staking Dashboard - Mobil versiyon

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { useTranslation } from '@/hooks/useTranslation';
import { AllocationModal } from '@/components/AllocationModal';
import { RecurringStakeModal } from '@/components/RecurringStakeModal';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

// Metal icon images
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

interface Period {
  months: number;
  apy: number;
}

interface MetalOffer {
  metal: string;
  name: string;
  minAmount: number;
  tvl: number;
  periods: Period[];
}

interface Position {
  id: string;
  metal: string;
  amount: number;
  apy: number;
  startDate: string;
  endDate: string;
  earned: number;
  status: 'active' | 'completed' | 'pending';
}

interface Stats {
  totalLocked: number;
  activePositions: number;
  annualEarnings: number;
  avgAPY: number;
}

interface RecurringStakePlan {
  id: string;
  walletAddress: string;
  token: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  stakeDuration: 3 | 6 | 12;
  status: 'active' | 'paused' | 'cancelled';
  paymentSource: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  createdAt: string;
  stats: {
    totalStaked: number;
    totalSpent: number;
    executionCount: number;
    nextExecutionAt?: string;
    lastExecutionAt?: string;
  };
}

interface LeaseRates {
  gold: { '3m': number; '6m': number; '12m': number };
  silver: { '3m': number; '6m': number; '12m': number };
  platinum: { '3m': number; '6m': number; '12m': number };
  palladium: { '3m': number; '6m': number; '12m': number };
  sofr: number;
  gofo: number;
  lastUpdated: string;
}

// ============================================
// FALLBACK TRANSLATIONS - 6 Language Support
// ============================================
const fallbackTranslations: Record<string, Record<string, string>> = {
  tr: {
    metalStaking: "Metal Biriktir", stakeAndEarn: "Metallerinizi stake edin ve getiri kazanın",
    totalLocked: "Toplam Kilitli", activePositions: "Aktif Pozisyonlar", annualEarnings: "Yıllık Kazanç", averageAPY: "Ortalama APY",
    thisWeek: "bu hafta", earn: "Biriktir", myPositions: "Pozisyonlarım", autoInvest: "Düzenli",
    availableOffers: "Mevcut Teklifler", selectMetalTokens: "Metal tokenlerinizi seçin ve kazanmaya başlayın",
    stakeEarn: "Biriktir & Kazan", minAmount: "Min. Miktar", months: "Ay",
    gold: "Altın", silver: "Gümüş", platinum: "Platin", palladium: "Paladyum",
    howItWorks: "Nasıl Çalışır", step1: "Metal tokenlerinizi seçin", step2: "3, 6 veya 12 ay seçin",
    step3: "APY'ye göre getiri kazanın", step4: "Süre sonunda otomatik iade",
    features: "Özellikler", insured: "Sigortalı", institutional: "Kurumsal", transparent: "Şeffaf",
    physical: "Fiziksel", metalYield: "Metal Getiri", onChain: "Zincir Üstü",
    noPositions: "Henüz aktif pozisyonunuz yok", startStaking: "Stake etmeye başlayın",
    noDcaPlans: "Henüz düzenli biriktirme planınız yok", createDca: "Yeni Plan Oluştur",
    amount: "Miktar", period: "Süre", frequency: "Sıklık", expectedReturn: "Beklenen Getiri", stake: "Stake Et", cancel: "İptal",
    earned: "Kazanılan", remaining: "Kalan", days: "gün", completed: "Tamamlandı", active: "Aktif", paused: "Duraklatıldı",
    weekly: "Haftalık", biweekly: "2 Haftalık", monthly: "Aylık", nextExecution: "Sonraki Çalışma",
    totalStaked: "Toplam Stake", executionCount: "Çalışma Sayısı", pausePlan: "Duraklat", resumePlan: "Devam Et", deletePlan: "Sil",
    recurringPlans: "Düzenli Biriktirme", autoStakeDesc: "Otomatik stake planı oluştur",
    deletePlanTitle: "Planı Sil", deletePlanConfirm: "Bu planı silmek istediğinizden emin misiniz?",
    clickToCreate: "Yeni plan oluşturmak için yukarıdaki butona tıklayın",
    howItWorksTitle: "Nasıl Çalışır?",
    autoStakeInfo1: "Belirlediğiniz sıklıkta otomatik stake yapılır",
    autoStakeInfo2: "Metal bakiyeniz yoksa ödeme kaynağından alınır",
    autoStakeInfo3: "Stake süresi sonunda getiri ile iade edilir",
  },
  en: {
    metalStaking: "Metal Staking", stakeAndEarn: "Stake your metals and earn yield",
    totalLocked: "Total Locked", activePositions: "Active Positions", annualEarnings: "Annual Earnings", averageAPY: "Average APY",
    thisWeek: "this week", earn: "Earn", myPositions: "My Positions", autoInvest: "Auto",
    availableOffers: "Available Offers", selectMetalTokens: "Select your metal tokens and start earning",
    stakeEarn: "Stake & Earn", minAmount: "Min. Amount", months: "Mo",
    gold: "Gold", silver: "Silver", platinum: "Platinum", palladium: "Palladium",
    howItWorks: "How It Works", step1: "Select your metal tokens", step2: "Choose 3, 6 or 12 months",
    step3: "Earn yield based on APY", step4: "Auto-return after period",
    features: "Features", insured: "Insured", institutional: "Institutional", transparent: "Transparent",
    physical: "Physical", metalYield: "Metal Yield", onChain: "On-Chain",
    noPositions: "No active positions yet", startStaking: "Start staking to earn",
    noDcaPlans: "No recurring stake plans yet", createDca: "Create New Plan",
    amount: "Amount", period: "Period", frequency: "Frequency", expectedReturn: "Expected Return", stake: "Stake", cancel: "Cancel",
    earned: "Earned", remaining: "Remaining", days: "days", completed: "Completed", active: "Active", paused: "Paused",
    weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", nextExecution: "Next Execution",
    totalStaked: "Total Staked", executionCount: "Executions", pausePlan: "Pause", resumePlan: "Resume", deletePlan: "Delete",
    recurringPlans: "Recurring Stake", autoStakeDesc: "Create auto-stake plan",
    deletePlanTitle: "Delete Plan", deletePlanConfirm: "Are you sure you want to delete this plan?",
    clickToCreate: "Click the button above to create a new plan",
    howItWorksTitle: "How It Works?",
    autoStakeInfo1: "Auto-stake at your chosen frequency",
    autoStakeInfo2: "If no metal balance, purchased from payment source",
    autoStakeInfo3: "Returned with yield after stake period",
  },
  de: {
    metalStaking: "Metall-Staking", stakeAndEarn: "Staken Sie Ihre Metalle und verdienen Sie Rendite",
    totalLocked: "Gesamt Gesperrt", activePositions: "Aktive Positionen", annualEarnings: "Jahresertrag", averageAPY: "Durchschn. APY",
    thisWeek: "diese Woche", earn: "Verdienen", myPositions: "Meine Positionen", autoInvest: "Sparplan",
    availableOffers: "Verfügbare Angebote", selectMetalTokens: "Wählen Sie Ihre Metall-Token und verdienen Sie",
    stakeEarn: "Staken & Verdienen", minAmount: "Min. Betrag", months: "Mo",
    gold: "Gold", silver: "Silber", platinum: "Platin", palladium: "Palladium",
    howItWorks: "So funktioniert's", step1: "Wählen Sie Ihre Metall-Token", step2: "Wählen Sie 3, 6 oder 12 Monate",
    step3: "Verdienen Sie Rendite basierend auf APY", step4: "Automatische Rückgabe nach Ablauf",
    features: "Funktionen", insured: "Versichert", institutional: "Institutionell", transparent: "Transparent",
    physical: "Physisch", metalYield: "Metall-Rendite", onChain: "On-Chain",
    noPositions: "Noch keine aktiven Positionen", startStaking: "Starten Sie das Staking",
    noDcaPlans: "Noch keine Sparpläne", createDca: "Neuen Plan erstellen",
    amount: "Betrag", period: "Zeitraum", frequency: "Häufigkeit", expectedReturn: "Erwartete Rendite", stake: "Staken", cancel: "Abbrechen",
    earned: "Verdient", remaining: "Verbleibend", days: "Tage", completed: "Abgeschlossen", active: "Aktiv", paused: "Pausiert",
    weekly: "Wöchentlich", biweekly: "Zweiwöchentlich", monthly: "Monatlich", nextExecution: "Nächste Ausführung",
    totalStaked: "Gesamt Gestaked", executionCount: "Ausführungen", pausePlan: "Pausieren", resumePlan: "Fortsetzen", deletePlan: "Löschen",
    recurringPlans: "Sparplan", autoStakeDesc: "Automatischen Stake-Plan erstellen",
    deletePlanTitle: "Plan löschen", deletePlanConfirm: "Sind Sie sicher, dass Sie diesen Plan löschen möchten?",
    clickToCreate: "Klicken Sie auf die Schaltfläche oben, um einen neuen Plan zu erstellen",
    howItWorksTitle: "Wie funktioniert es?",
    autoStakeInfo1: "Automatisches Staking in Ihrer gewählten Häufigkeit",
    autoStakeInfo2: "Bei fehlendem Metall-Guthaben wird von der Zahlungsquelle gekauft",
    autoStakeInfo3: "Rückgabe mit Rendite nach dem Stake-Zeitraum",
  },
  fr: {
    metalStaking: "Staking Métal", stakeAndEarn: "Stakez vos métaux et gagnez des rendements",
    totalLocked: "Total Bloqué", activePositions: "Positions Actives", annualEarnings: "Gains Annuels", averageAPY: "APY Moyen",
    thisWeek: "cette semaine", earn: "Gagner", myPositions: "Mes Positions", autoInvest: "Récurrent",
    availableOffers: "Offres Disponibles", selectMetalTokens: "Sélectionnez vos tokens métal et commencez à gagner",
    stakeEarn: "Staker & Gagner", minAmount: "Montant Min.", months: "Mois",
    gold: "Or", silver: "Argent", platinum: "Platine", palladium: "Palladium",
    howItWorks: "Comment ça marche", step1: "Sélectionnez vos tokens métal", step2: "Choisissez 3, 6 ou 12 mois",
    step3: "Gagnez des rendements selon l'APY", step4: "Retour automatique après la période",
    features: "Caractéristiques", insured: "Assuré", institutional: "Institutionnel", transparent: "Transparent",
    physical: "Physique", metalYield: "Rendement Métal", onChain: "On-Chain",
    noPositions: "Pas encore de positions actives", startStaking: "Commencez à staker pour gagner",
    noDcaPlans: "Pas encore de plans récurrents", createDca: "Créer un nouveau plan",
    amount: "Montant", period: "Période", frequency: "Fréquence", expectedReturn: "Rendement Attendu", stake: "Staker", cancel: "Annuler",
    earned: "Gagné", remaining: "Restant", days: "jours", completed: "Terminé", active: "Actif", paused: "En pause",
    weekly: "Hebdomadaire", biweekly: "Bimensuel", monthly: "Mensuel", nextExecution: "Prochaine Exécution",
    totalStaked: "Total Staké", executionCount: "Exécutions", pausePlan: "Pause", resumePlan: "Reprendre", deletePlan: "Supprimer",
    recurringPlans: "Stake Récurrent", autoStakeDesc: "Créer un plan de stake automatique",
    deletePlanTitle: "Supprimer le plan", deletePlanConfirm: "Êtes-vous sûr de vouloir supprimer ce plan?",
    clickToCreate: "Cliquez sur le bouton ci-dessus pour créer un nouveau plan",
    howItWorksTitle: "Comment ça marche?",
    autoStakeInfo1: "Stake automatique à la fréquence choisie",
    autoStakeInfo2: "Si pas de solde métal, acheté depuis la source de paiement",
    autoStakeInfo3: "Retourné avec rendement après la période de stake",
  },
  ar: {
    metalStaking: "تخزين المعادن", stakeAndEarn: "قم بتخزين معادنك واكسب عوائد",
    totalLocked: "إجمالي المقفل", activePositions: "المراكز النشطة", annualEarnings: "الأرباح السنوية", averageAPY: "متوسط APY",
    thisWeek: "هذا الأسبوع", earn: "اكسب", myPositions: "مراكزي", autoInvest: "تلقائي",
    availableOffers: "العروض المتاحة", selectMetalTokens: "اختر رموز المعادن الخاصة بك وابدأ الكسب",
    stakeEarn: "خزّن واكسب", minAmount: "الحد الأدنى", months: "شهر",
    gold: "ذهب", silver: "فضة", platinum: "بلاتين", palladium: "بالاديوم",
    howItWorks: "كيف يعمل", step1: "اختر رموز المعادن", step2: "اختر 3 أو 6 أو 12 شهراً",
    step3: "اكسب عوائد بناءً على APY", step4: "إرجاع تلقائي بعد الفترة",
    features: "الميزات", insured: "مؤمّن", institutional: "مؤسسي", transparent: "شفاف",
    physical: "فيزيائي", metalYield: "عائد المعادن", onChain: "على السلسلة",
    noPositions: "لا توجد مراكز نشطة بعد", startStaking: "ابدأ التخزين للكسب",
    noDcaPlans: "لا توجد خطط تلقائية بعد", createDca: "إنشاء خطة جديدة",
    amount: "المبلغ", period: "الفترة", frequency: "التكرار", expectedReturn: "العائد المتوقع", stake: "خزّن", cancel: "إلغاء",
    earned: "المكتسب", remaining: "المتبقي", days: "أيام", completed: "مكتمل", active: "نشط", paused: "متوقف",
    weekly: "أسبوعي", biweekly: "كل أسبوعين", monthly: "شهري", nextExecution: "التنفيذ التالي",
    totalStaked: "إجمالي المخزّن", executionCount: "التنفيذات", pausePlan: "إيقاف", resumePlan: "استئناف", deletePlan: "حذف",
    recurringPlans: "التخزين التلقائي", autoStakeDesc: "إنشاء خطة تخزين تلقائية",
    deletePlanTitle: "حذف الخطة", deletePlanConfirm: "هل أنت متأكد أنك تريد حذف هذه الخطة؟",
    clickToCreate: "انقر على الزر أعلاه لإنشاء خطة جديدة",
    howItWorksTitle: "كيف يعمل؟",
    autoStakeInfo1: "تخزين تلقائي بالتكرار الذي تختاره",
    autoStakeInfo2: "إذا لم يكن هناك رصيد معادن، يتم الشراء من مصدر الدفع",
    autoStakeInfo3: "يتم الإرجاع مع العائد بعد فترة التخزين",
  },
  ru: {
    metalStaking: "Стейкинг металлов", stakeAndEarn: "Стейкайте ваши металлы и зарабатывайте доход",
    totalLocked: "Всего заблокировано", activePositions: "Активные позиции", annualEarnings: "Годовой доход", averageAPY: "Средний APY",
    thisWeek: "на этой неделе", earn: "Заработать", myPositions: "Мои позиции", autoInvest: "Авто",
    availableOffers: "Доступные предложения", selectMetalTokens: "Выберите токены металлов и начните зарабатывать",
    stakeEarn: "Стейкать и зарабатывать", minAmount: "Мин. сумма", months: "Мес",
    gold: "Золото", silver: "Серебро", platinum: "Платина", palladium: "Палладий",
    howItWorks: "Как это работает", step1: "Выберите токены металлов", step2: "Выберите 3, 6 или 12 месяцев",
    step3: "Зарабатывайте доход на основе APY", step4: "Автоматический возврат после периода",
    features: "Особенности", insured: "Застрахованный", institutional: "Институциональный", transparent: "Прозрачный",
    physical: "Физический", metalYield: "Доход металла", onChain: "Он-чейн",
    noPositions: "Пока нет активных позиций", startStaking: "Начните стейкинг для заработка",
    noDcaPlans: "Пока нет планов автопокупки", createDca: "Создать новый план",
    amount: "Сумма", period: "Период", frequency: "Частота", expectedReturn: "Ожидаемый доход", stake: "Стейкать", cancel: "Отмена",
    earned: "Заработано", remaining: "Осталось", days: "дней", completed: "Завершено", active: "Активный", paused: "На паузе",
    weekly: "Еженедельно", biweekly: "Раз в 2 недели", monthly: "Ежемесячно", nextExecution: "Следующее выполнение",
    totalStaked: "Всего застейкано", executionCount: "Выполнений", pausePlan: "Пауза", resumePlan: "Возобновить", deletePlan: "Удалить",
    recurringPlans: "Автопокупка", autoStakeDesc: "Создать план автостейкинга",
    deletePlanTitle: "Удалить план", deletePlanConfirm: "Вы уверены, что хотите удалить этот план?",
    clickToCreate: "Нажмите кнопку выше, чтобы создать новый план",
    howItWorksTitle: "Как это работает?",
    autoStakeInfo1: "Автоматический стейкинг с выбранной частотой",
    autoStakeInfo2: "Если нет баланса металла, покупается из источника оплаты",
    autoStakeInfo3: "Возврат с доходом после периода стейкинга",
  },
};

export default function StakeScreen() {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const isWalletConnected = !!walletAddress;
  const { balance: walletBalance, fetchBalance, setAddress } = useBalanceStore();
  
  // Helper to get metal balance
  const getMetalBalance = (metal: string): number => {
    if (!walletBalance) return 0;
    const key = metal.toLowerCase() as keyof typeof walletBalance;
    return walletBalance[key] || 0;
  };
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  
  // i18n - Centralized with fallback
  const { t: stakeT } = useTranslation('stake');
  const fallback = fallbackTranslations[language] || fallbackTranslations.en;
  const t = Object.keys(fallback).reduce((acc, key) => {
    acc[key] = (stakeT as any)[key] || fallback[key as keyof typeof fallback];
    return acc;
  }, {} as Record<string, string>);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'earn' | 'positions' | 'auto'>('earn');
  const [loading, setLoading] = useState(true);
  
  // Fetch balance on mount
  useEffect(() => {
    if (walletAddress && isWalletConnected) {
      setAddress(walletAddress);
      fetchBalance();
    }
  }, [walletAddress, isWalletConnected]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [recurringPlans, setRecurringPlans] = useState<RecurringStakePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<MetalOffer | null>(null);

  // Lease Rates from API
  const [leaseRates, setLeaseRates] = useState<LeaseRates | null>(null);
  const [sofrRate, setSofrRate] = useState(4.33);
  const [gofoRate, setGofoRate] = useState(1.5);

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalLocked: 0,
    activePositions: 0,
    annualEarnings: 0,
    avgAPY: 0,
  });

  // Positions - fetched from API
  const [positions, setPositions] = useState<Position[]>([]);

  // Available offers with APY rates from API
  const availableOffers: MetalOffer[] = [
    {
      metal: 'AUXG',
      name: t.gold,
      minAmount: 1,
      tvl: 500000,
      periods: [
        { months: 3, apy: leaseRates?.gold['3m'] ?? (3.5 + sofrRate * 0.3) },
        { months: 6, apy: leaseRates?.gold['6m'] ?? (4.2 + sofrRate * 0.35) },
        { months: 12, apy: leaseRates?.gold['12m'] ?? (5.5 + sofrRate * 0.4) },
      ],
    },
    {
      metal: 'AUXS',
      name: t.silver,
      minAmount: 5,
      tvl: 250000,
      periods: [
        { months: 3, apy: leaseRates?.silver['3m'] ?? (3.2 + sofrRate * 0.28) },
        { months: 6, apy: leaseRates?.silver['6m'] ?? (3.9 + sofrRate * 0.33) },
        { months: 12, apy: leaseRates?.silver['12m'] ?? (5.0 + sofrRate * 0.38) },
      ],
    },
    {
      metal: 'AUXPT',
      name: t.platinum,
      minAmount: 5,
      tvl: 350000,
      periods: [
        { months: 3, apy: leaseRates?.platinum['3m'] ?? (3.8 + sofrRate * 0.32) },
        { months: 6, apy: leaseRates?.platinum['6m'] ?? (4.5 + sofrRate * 0.37) },
        { months: 12, apy: leaseRates?.platinum['12m'] ?? (5.8 + sofrRate * 0.42) },
      ],
    },
    {
      metal: 'AUXPD',
      name: t.palladium,
      minAmount: 5,
      tvl: 150000,
      periods: [
        { months: 3, apy: leaseRates?.palladium['3m'] ?? (3.6 + sofrRate * 0.30) },
        { months: 6, apy: leaseRates?.palladium['6m'] ?? (4.3 + sofrRate * 0.35) },
        { months: 12, apy: leaseRates?.palladium['12m'] ?? (5.6 + sofrRate * 0.40) },
      ],
    },
  ];

  useEffect(() => {
    fetchLeaseRates();
    if (walletAddress) {
      fetchRecurringPlans();
      fetchStakingPositions();
    }
  }, [walletAddress]);

  const fetchLeaseRates = async () => {
    setLoading(true);
    try {
      // Fetch lease rates from API
      const ratesRes = await fetch(`${API_BASE_URL}/api/lease-rates`);
      if (ratesRes.ok) {
        const data = await ratesRes.json();
        if (data.success && data.rates) {
          setLeaseRates(data.rates);
          setSofrRate(data.rates.sofr || 4.33);
          setGofoRate(data.rates.gofo || 1.5);
        }
      }
    } catch (error) {
      console.error('Fetch lease rates error:', error);
    }
    setLoading(false);
  };

  const fetchStakingPositions = async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/stakes?address=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.stakes) {
          setPositions(data.stakes);
        }
      }
    } catch (error) {
      console.error('Fetch staking positions error:', error);
    }
  };

  const fetchRecurringPlans = async () => {
    if (!walletAddress) return;
    setLoadingPlans(true);
    try {
      // Fetch recurring stake plans
      const stakeRes = await fetch(`${API_BASE_URL}/api/recurring-stake`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      if (stakeRes.ok) {
        const data = await stakeRes.json();
        setRecurringPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Fetch recurring plans error:', error);
    }
    setLoadingPlans(false);
  };

  const handlePlanAction = async (planId: string, action: 'pause' | 'resume' | 'cancel') => {
    if (!walletAddress) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring-stake`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ planId, action }),
      });
      if (response.ok) {
        fetchRecurringPlans();
      }
    } catch (error) {
      console.error('Plan action error:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!walletAddress) return;
    Alert.alert(
      t.deletePlanTitle,
      t.deletePlanConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.deletePlan,
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/recurring-stake?id=${planId}`, {
                method: 'DELETE',
                headers: { 'x-wallet-address': walletAddress },
              });
              if (response.ok) {
                fetchRecurringPlans();
              }
            } catch (error) {
              console.error('Delete plan error:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLeaseRates(), 
      fetchRecurringPlans(),
      fetchStakingPositions(),
    ]);
    setRefreshing(false);
  }, [walletAddress]);

  const formatAPYRange = (offer: MetalOffer) => {
    const apys = offer.periods.map(p => p.apy);
    const min = Math.min(...apys);
    const max = Math.max(...apys);
    return `${min.toFixed(1)}%-${max.toFixed(1)}%`;
  };

  const handleOpenModal = (offer: MetalOffer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Metal Offer Card Component
  const MetalOfferCard = ({ offer, metalBalance }: { offer: MetalOffer; metalBalance: number }) => (
    <TouchableOpacity
      style={[styles.offerCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
      onPress={() => handleOpenModal(offer)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.offerHeader}>
        <View style={styles.offerMetal}>
          <View style={[styles.offerIconContainer, { backgroundColor: metalColors[offer.metal] + '20' }]}>
            <Image source={metalIcons[offer.metal]} style={styles.offerIcon} resizeMode="contain" />
            <View style={styles.offerCheckmark}>
              <Ionicons name="checkmark" size={8} color="#fff" />
            </View>
          </View>
          <View>
            <Text style={[styles.offerSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{offer.metal}</Text>
            <Text style={[styles.offerName, { color: isDark ? '#94a3b8' : '#64748b' }]}>{offer.name}</Text>
          </View>
        </View>
        <View style={styles.offerAPY}>
          <Text style={styles.offerAPYValue}>{formatAPYRange(offer)}</Text>
          <Text style={[styles.offerAPYLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>APY</Text>
        </View>
      </View>

      {/* Period Badges */}
      <View style={styles.periodBadges}>
        {offer.periods.map((period) => (
          <View 
            key={period.months} 
            style={[styles.periodBadge, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}
          >
            <Text style={[styles.periodMonths, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {period.months} {t.months}
            </Text>
            <Text style={styles.periodAPY}>{period.apy.toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      {/* Balance & Info Row */}
      <View style={styles.offerInfo}>
        <View style={[styles.offerInfoItem, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
          <Text style={[styles.offerInfoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.balance || 'Balance'}</Text>
          <Text style={[styles.offerInfoValue, { color: '#10b981' }]}>{metalBalance.toFixed(2)} {offer.metal}</Text>
        </View>
        <View style={[styles.offerInfoItem, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
          <Text style={[styles.offerInfoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.minAmount}</Text>
          <Text style={[styles.offerInfoValue, { color: isDark ? '#fff' : '#0f172a' }]}>{offer.minAmount} {offer.metal}</Text>
        </View>
      </View>

      {/* Button */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.offerButton}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.offerButtonText}>{t.stakeEarn}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Position Card Component
  const PositionCard = ({ position }: { position: Position }) => (
    <View style={[styles.positionCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
      <View style={styles.positionHeader}>
        <View style={styles.positionMetal}>
          <Image source={metalIcons[position.metal]} style={styles.positionIcon} resizeMode="contain" />
          <View>
            <Text style={[styles.positionSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{position.metal}</Text>
            <Text style={[styles.positionAmount, { color: isDark ? '#94a3b8' : '#64748b' }]}>{position.amount} {position.metal}</Text>
          </View>
        </View>
        <View style={[
          styles.positionStatus,
          { backgroundColor: position.status === 'active' ? '#10b98120' : '#3b82f620' }
        ]}>
          <Text style={[
            styles.positionStatusText,
            { color: position.status === 'active' ? '#10b981' : '#3b82f6' }
          ]}>
            {position.status === 'active' ? t.active : t.completed}
          </Text>
        </View>
      </View>

      <View style={styles.positionStats}>
        <View style={styles.positionStat}>
          <Text style={[styles.positionStatLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>APY</Text>
          <Text style={styles.positionStatValue}>{position.apy}%</Text>
        </View>
        <View style={styles.positionStat}>
          <Text style={[styles.positionStatLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.earned}</Text>
          <Text style={styles.positionStatValue}>{position.earned} {position.metal}</Text>
        </View>
        <View style={styles.positionStat}>
          <Text style={[styles.positionStatLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.remaining}</Text>
          <Text style={[styles.positionStatValue, { color: isDark ? '#fff' : '#0f172a' }]}>
            {getRemainingDays(position.endDate)} {t.days}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${Math.min(100, (1 - getRemainingDays(position.endDate) / 180) * 100)}%`,
              backgroundColor: '#10b981'
            }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#064e3b', '#0f172a'] : ['#d1fae5', '#f0fdf4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.metalStaking}</Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.stakeAndEarn}</Text>
            </View>
          </View>
          <View style={styles.ratesBadge}>
            <View style={styles.rateItem}>
              <View style={styles.sofrDot} />
              <Text style={[styles.rateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>SOFR</Text>
              <Text style={styles.rateValue}>{sofrRate.toFixed(2)}%</Text>
            </View>
            {leaseRates && (
              <View style={styles.rateItem}>
                <Text style={[styles.rateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>GOFO</Text>
                <Text style={[styles.rateValue, { color: '#3b82f6' }]}>{gofoRate.toFixed(2)}%</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'earn' && styles.tabActive]}
            onPress={() => setActiveTab('earn')}
          >
            <Ionicons 
              name="add-circle" 
              size={16} 
              color={activeTab === 'earn' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8')} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'earn' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8') }
            ]}>
              {t.earn}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'positions' && styles.tabActive]}
            onPress={() => setActiveTab('positions')}
          >
            <Ionicons 
              name="layers" 
              size={16} 
              color={activeTab === 'positions' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8')} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'positions' ? '#10b981' : (isDark ? '#64748b' : '#94a3b8') }
            ]}>
              {t.myPositions}
            </Text>
            {stats.activePositions > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.activePositions}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'auto' && styles.tabActive,
              styles.autoTab
            ]}
            onPress={() => setActiveTab('auto')}
          >
            <LinearGradient
              colors={activeTab === 'auto' ? ['#f59e0b', '#f97316'] : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.autoTabGradient}
            >
              <Ionicons 
                name="repeat" 
                size={16} 
                color={activeTab === 'auto' ? '#fff' : '#f59e0b'} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'auto' ? '#fff' : '#f59e0b', fontWeight: '700' }
              ]}>
                {t.autoInvest}
              </Text>
              {activeTab !== 'auto' && (
                <View style={styles.hotBadge}>
                  <Ionicons name="flame" size={10} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'earn' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {t.availableOffers}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {t.selectMetalTokens}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.offersGrid}>
                {availableOffers.map((offer) => (
                  <MetalOfferCard key={offer.metal} offer={offer} metalBalance={getMetalBalance(offer.metal)} />
                ))}
              </View>
            )}

            {/* Info Cards */}
            <View style={styles.infoCards}>
              {/* How It Works */}
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e3a5f20' : '#eff6ff' }]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoCardIcon, { backgroundColor: '#3b82f620' }]}>
                    <Text>💡</Text>
                  </View>
                  <Text style={[styles.infoCardTitle, { color: '#3b82f6' }]}>{t.howItWorks}</Text>
                </View>
                <View style={styles.infoCardContent}>
                  {[t.step1, t.step2, t.step3, t.step4].map((step, index) => (
                    <View key={index} style={styles.infoStep}>
                      <View style={styles.infoStepNumber}>
                        <Text style={styles.infoStepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.infoStepText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Features */}
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#064e3b20' : '#ecfdf5' }]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoCardIcon, { backgroundColor: '#10b98120' }]}>
                    <Text>✓</Text>
                  </View>
                  <Text style={[styles.infoCardTitle, { color: '#10b981' }]}>{t.features}</Text>
                </View>
                <View style={styles.featuresGrid}>
                  {[
                    { icon: '🔒', label: t.insured },
                    { icon: '🏢', label: t.institutional },
                    { icon: '📊', label: t.transparent },
                    { icon: '📦', label: t.physical },
                    { icon: '💰', label: t.metalYield },
                    { icon: '⛓️', label: t.onChain },
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      <Text style={[styles.featureLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {feature.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'positions' && (
          <View style={styles.tabContent}>
            {positions.length > 0 ? (
              positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Ionicons name="layers-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
                </View>
                <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {t.noPositions}
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.startStaking}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'auto' && (
          <View style={styles.tabContent}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {t.recurringPlans}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {t.autoStakeDesc}
              </Text>
            </View>

            {/* Create New Plan Button */}
            <TouchableOpacity 
              style={[styles.createPlanCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
              onPress={() => setRecurringModalVisible(true)}
            >
              <View style={[styles.createPlanIcon, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="add" size={24} color="#10b981" />
              </View>
              <View style={styles.createPlanContent}>
                <Text style={[styles.createPlanTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {t.createDca}
                </Text>
                <Text style={[styles.createPlanSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.autoStakeDesc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>

            {/* Plans List */}
            {loadingPlans ? (
              <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
            ) : recurringPlans.length > 0 ? (
              <View style={styles.plansList}>
                {recurringPlans.map((plan) => {
                  const metalName = plan.token === 'AUXG' ? t.gold : plan.token === 'AUXS' ? t.silver : plan.token === 'AUXPT' ? t.platinum : t.palladium;
                  const freqLabel = plan.frequency === 'weekly' ? t.weekly : plan.frequency === 'biweekly' ? t.biweekly : t.monthly;
                  const isPaused = plan.status === 'paused';
                  const isCancelled = plan.status === 'cancelled';
                  
                  return (
                    <View 
                      key={plan.id} 
                      style={[
                        styles.planCard, 
                        { 
                          backgroundColor: isDark ? '#1e293b' : '#fff',
                          opacity: isCancelled ? 0.5 : 1,
                        }
                      ]}
                    >
                      {/* Plan Header */}
                      <View style={styles.planHeader}>
                        <View style={styles.planMetal}>
                          <View style={[styles.planIconContainer, { backgroundColor: metalColors[plan.token] + '20' }]}>
                            <Image source={metalIcons[plan.token]} style={styles.planIcon} resizeMode="contain" />
                          </View>
                          <View>
                            <Text style={[styles.planSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>
                              {plan.token}
                            </Text>
                            <Text style={[styles.planName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                              {metalName}
                            </Text>
                          </View>
                        </View>
                        <View style={[
                          styles.planStatusBadge, 
                          { backgroundColor: isPaused ? '#f59e0b20' : isCancelled ? '#ef444420' : '#10b98120' }
                        ]}>
                          <View style={[
                            styles.planStatusDot, 
                            { backgroundColor: isPaused ? '#f59e0b' : isCancelled ? '#ef4444' : '#10b981' }
                          ]} />
                          <Text style={[
                            styles.planStatusText, 
                            { color: isPaused ? '#f59e0b' : isCancelled ? '#ef4444' : '#10b981' }
                          ]}>
                            {isPaused ? t.paused : isCancelled ? t.cancel : t.active}
                          </Text>
                        </View>
                      </View>

                      {/* Plan Details */}
                      <View style={styles.planDetails}>
                        <View style={[styles.planDetail, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                          <Text style={[styles.planDetailLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {t.amount}
                          </Text>
                          <Text style={[styles.planDetailValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                            {plan.amount} {plan.metal}
                          </Text>
                        </View>
                        <View style={[styles.planDetail, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                          <Text style={[styles.planDetailLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {t.frequency}
                          </Text>
                          <Text style={[styles.planDetailValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                            {freqLabel}
                          </Text>
                        </View>
                        <View style={[styles.planDetail, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                          <Text style={[styles.planDetailLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {t.period}
                          </Text>
                          <Text style={[styles.planDetailValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                            {plan.stakeDuration} {t.months}
                          </Text>
                        </View>
                      </View>

                      {/* Plan Stats */}
                      <View style={styles.planStats}>
                        <View style={styles.planStatItem}>
                          <Ionicons name="layers" size={14} color="#10b981" />
                          <Text style={[styles.planStatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {t.totalStaked}: {plan.stats.totalStaked.toFixed(2)}g
                          </Text>
                        </View>
                        <View style={styles.planStatItem}>
                          <Ionicons name="repeat" size={14} color="#3b82f6" />
                          <Text style={[styles.planStatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {t.executionCount}: {plan.stats.executionCount}
                          </Text>
                        </View>
                        {plan.stats.nextExecutionAt && !isPaused && !isCancelled && (
                          <View style={styles.planStatItem}>
                            <Ionicons name="time" size={14} color="#f59e0b" />
                            <Text style={[styles.planStatText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                              {t.nextExecution}: {new Date(plan.stats.nextExecutionAt).toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Plan Actions */}
                      {!isCancelled && (
                        <View style={styles.planActions}>
                          <TouchableOpacity
                            style={[styles.planActionButton, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                            onPress={() => handlePlanAction(plan.id, isPaused ? 'resume' : 'pause')}
                          >
                            <Ionicons 
                              name={isPaused ? 'play' : 'pause'} 
                              size={16} 
                              color={isPaused ? '#10b981' : '#f59e0b'} 
                            />
                            <Text style={[styles.planActionText, { color: isPaused ? '#10b981' : '#f59e0b' }]}>
                              {isPaused ? t.resumePlan : t.pausePlan}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.planActionButton, { backgroundColor: '#ef444410' }]}
                            onPress={() => handleDeletePlan(plan.id)}
                          >
                            <Ionicons name="trash" size={16} color="#ef4444" />
                            <Text style={[styles.planActionText, { color: '#ef4444' }]}>
                              {t.deletePlan}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Ionicons name="repeat-outline" size={40} color={isDark ? '#475569' : '#94a3b8'} />
                </View>
                <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {t.noDcaPlans}
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.clickToCreate}
                </Text>
              </View>
            )}

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e3a5f20' : '#eff6ff', marginTop: 20 }]}>
              <View style={styles.infoCardHeader}>
                <View style={[styles.infoCardIcon, { backgroundColor: '#3b82f620' }]}>
                  <Text>💡</Text>
                </View>
                <Text style={[styles.infoCardTitle, { color: '#3b82f6' }]}>
                  {t.howItWorksTitle}
                </Text>
              </View>
              <View style={styles.infoCardContent}>
                {[
                  t.autoStakeInfo1,
                  t.autoStakeInfo2,
                  t.autoStakeInfo3,
                ].map((step, index) => (
                  <View key={index} style={styles.infoStep}>
                    <View style={styles.infoStepNumber}>
                      <Text style={styles.infoStepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.infoStepText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Allocation Modal */}
      <AllocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        offer={selectedOffer}
      />

      {/* Recurring Stake Modal */}
      <RecurringStakeModal
        visible={recurringModalVisible}
        onClose={() => setRecurringModalVisible(false)}
        onSuccess={fetchRecurringPlans}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

  // Header
  header: {
    margin: 16,
    marginTop: 50,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  sofrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  sofrDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  sofrLabel: { fontSize: 10 },
  sofrValue: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  
  // Rates Badge
  ratesBadge: {
    flexDirection: 'column',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateLabel: {
    fontSize: 10,
    minWidth: 32,
  },
  rateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  tabText: { fontSize: 12, fontWeight: '600' },
  tabBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  
  // Auto Tab Enhanced Styles
  autoTab: {
    padding: 0,
    overflow: 'hidden',
  },
  autoTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  hotBadge: {
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  // Tab Content
  tabContent: { padding: 16 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionSubtitle: { fontSize: 12, marginTop: 4 },

  // Offers Grid
  offersGrid: { gap: 12 },
  
  // Offer Card
  offerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerMetal: { flexDirection: 'row', alignItems: 'center' },
  offerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  offerIcon: { width: 28, height: 28 },
  offerCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerSymbol: { fontSize: 16, fontWeight: '700' },
  offerName: { fontSize: 11 },
  offerAPY: { alignItems: 'flex-end' },
  offerAPYValue: { fontSize: 18, fontWeight: '700', color: '#10b981' },
  offerAPYLabel: { fontSize: 10 },
  
  periodBadges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  periodBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodMonths: { fontSize: 10 },
  periodAPY: { fontSize: 13, fontWeight: '600', color: '#10b981' },
  
  offerInfo: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  offerInfoItem: { flex: 1, padding: 10, borderRadius: 8 },
  offerInfoLabel: { fontSize: 10 },
  offerInfoValue: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  offerButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Position Card
  positionCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  positionMetal: { flexDirection: 'row', alignItems: 'center' },
  positionIcon: { width: 36, height: 36, marginRight: 10 },
  positionSymbol: { fontSize: 15, fontWeight: '600' },
  positionAmount: { fontSize: 12 },
  positionStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  positionStatusText: { fontSize: 11, fontWeight: '600' },
  positionStats: { flexDirection: 'row', marginBottom: 12 },
  positionStat: { flex: 1, alignItems: 'center' },
  positionStatLabel: { fontSize: 10 },
  positionStatValue: { fontSize: 14, fontWeight: '600', color: '#10b981', marginTop: 2 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 13 },
  createButton: { marginTop: 20 },
  createButtonGradient: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Info Cards
  infoCards: { marginTop: 20, gap: 12 },
  infoCard: { padding: 16, borderRadius: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoCardIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  infoCardTitle: { fontSize: 13, fontWeight: '600' },
  infoCardContent: { gap: 8 },
  infoStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoStepNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b82f620', alignItems: 'center', justifyContent: 'center' },
  infoStepNumberText: { fontSize: 10, fontWeight: '600', color: '#3b82f6' },
  infoStepText: { fontSize: 11, flex: 1 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', width: '48%', gap: 6 },
  featureIcon: { fontSize: 12 },
  featureLabel: { fontSize: 11 },

  // Create Plan Card
  createPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createPlanContent: {
    flex: 1,
  },
  createPlanTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  createPlanSubtitle: {
    fontSize: 12,
  },

  // Plans List
  plansList: {
    gap: 12,
  },

  // Plan Card
  planCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planMetal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planIcon: {
    width: 28,
    height: 28,
  },
  planSymbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  planName: {
    fontSize: 11,
    marginTop: 2,
  },
  planStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  planStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  planDetail: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  planDetailLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  planDetailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  planStats: {
    gap: 8,
    marginBottom: 12,
  },
  planStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planStatText: {
    fontSize: 12,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#33415530',
  },
  planActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  planActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
