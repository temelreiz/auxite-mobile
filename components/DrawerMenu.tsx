// components/DrawerMenu.tsx
import { API_URL } from "@/constants/api";
// Modern Drawer Menu with Profile, KYC, Auxiteer Tiers
// 6-Language Support | Dark/Light Mode
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Animated,
  Modal,
  Pressable,
  Switch,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/stores/useStore';
import SecurityModal from '@/components/SecurityModal';
import FAQModal from '@/components/FAQModal';
import QRLoginScanner from '@/components/QRLoginScanner';

const DRAWER_WIDTH = 300;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TROPICAL FRUITS (B&W Style)
// ============================================
const TROPICAL_FRUITS = [
  { name: 'Papaya', emoji: '🍈', pattern: 'dots' },
  { name: 'Mango', emoji: '🥭', pattern: 'stripes' },
  { name: 'Rambutan', emoji: '🔴', pattern: 'spikes' },
  { name: 'Lychee', emoji: '🫐', pattern: 'bumps' },
  { name: 'Jackfruit', emoji: '🍊', pattern: 'grid' },
  { name: 'Dragon Fruit', emoji: '🐉', pattern: 'scales' },
];

// ============================================
// AUXITEER TIERS CONFIG
// ============================================
const AUXITEER_TIERS = {
  regular: {
    id: 'regular',
    name: { tr: 'Regular', en: 'Regular' },
    spread: 1.00,
    fee: 0.35,
    color: '#64748b',
    icon: 'person-outline',
  },
  core: {
    id: 'core',
    name: { tr: 'Auxiteer Core', en: 'Auxiteer Core' },
    spread: 0.80,
    fee: 0.25,
    color: '#10b981',
    icon: 'shield-outline',
    requirements: {
      tr: ['KYC tamamlandı', '≥ 10.000 USD ortalama bakiye', '≥ 7 gün'],
      en: ['KYC completed', '≥ $10,000 average balance', '≥ 7 days'],
    },
  },
  reserve: {
    id: 'reserve',
    name: { tr: 'Auxiteer Reserve', en: 'Auxiteer Reserve' },
    spread: 0.65,
    fee: 0.18,
    color: '#3b82f6',
    icon: 'diamond-outline',
    requirements: {
      tr: ['10.000 - 100.000 USD', '≥ 30 gün ortalama bakiye', 'En az 1 metal varlığı'],
      en: ['$10,000 - $100,000', '≥ 30 days average balance', 'At least 1 metal asset'],
    },
  },
  vault: {
    id: 'vault',
    name: { tr: 'Auxiteer Vault', en: 'Auxiteer Vault' },
    spread: 0.50,
    fee: 0.12,
    color: '#8b5cf6',
    icon: 'cube-outline',
    requirements: {
      tr: ['≥ 100.000 USD ortalama bakiye', '≥ 90 gün', 'Aktif Earn/Lease pozisyonu'],
      en: ['≥ $100,000 average balance', '≥ 90 days', 'Active Earn/Lease position'],
    },
    extras: {
      tr: ['Öncelikli işlem penceresi', 'OTC talep hakkı'],
      en: ['Priority execution window', 'OTC quote request'],
    },
  },
  sovereign: {
    id: 'sovereign',
    name: { tr: 'Auxiteer Sovereign', en: 'Auxiteer Sovereign' },
    spread: 'Custom',
    fee: 'Custom',
    color: '#0f172a',
    icon: 'star-outline',
    requirements: {
      tr: ['≥ 500.000 USD', 'Davetiye / Manuel onay'],
      en: ['≥ $500,000', 'Invitation / Manual review'],
    },
    extras: {
      tr: ['Özel hesap yöneticisi', 'Özel saklama seçenekleri'],
      en: ['Dedicated account manager', 'Custom custody options'],
    },
  },
};

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    account: 'Hesap',
    finance: 'Finans',
    earn: 'Kazan',
    support: 'Destek',
    profile: 'Profil', email: 'E-posta', phone: 'Telefon', saveProfile: 'Kaydet',
    settings: 'Ayarlar',
    security: 'Güvenlik',
    qrLogin: 'Web\'de Oturum Aç',
    whitelist: 'Güvenli Adresler',
    sessions: 'Aktif Oturumlar',
    wallet: 'Cüzdan',
    language: 'Dil',
    selectLanguage: 'Dil Seçin',
    notifications: 'Bildirimler',
    referral: 'Arkadaşını Davet Et',
    recurringBuy: 'Otomatik Alım',
    limitOrders: 'Limit Emirleri',
    auxiteerTier: 'Seviye Durumu',
    helpCenter: 'Yardım Merkezi',
    legal: 'Yasal Bilgiler',
    darkMode: 'Koyu Mod',
    logout: 'Çıkış Yap',
    connected: 'Bağlı',
    notConnected: 'Bağlı Değil',
    earnBonus: '₺500 Kazan',
    // Profile
    accountInfo: 'Hesap Bilgileri',
    uid: 'UID',
    identityVerification: 'Kimlik Doğrulama',
    verified: 'Doğrulandı',
    unverified: 'Doğrulanmadı',
    countryRegion: 'Ülke/Bölge',
    tradingFeeTier: 'İşlem Ücreti Seviyesi',
    // Verification
    verificationComplete: 'Doğrulama Tamamlandı',
    verificationMessage: 'Doğrulamanız için teşekkür ederiz. Tüm özelliklere erişim sağladınız ve hesabınız güvende.',
    startVerification: 'Doğrulamayı Başlat',
    verifyIdentity: 'Kimliğinizi Doğrulayın',
    verifySubtitle: 'Tüm özelliklere erişmek için kimlik doğrulamasını tamamlayın',
    step1: 'Kişisel Bilgiler',
    step2: 'Kimlik Belgesi',
    step3: 'Selfie Doğrulama',
    continue: 'Devam Et',
    // Auxiteer
    auxiteerStatus: 'Auxiteer Statünüz',
    currentLevel: 'Mevcut Seviye',
    spread: 'Spread',
    transactionFee: 'İşlem Ücreti',
    benefits: 'Avantajlar',
    requirements: 'Gereksinimler',
    nextLevel: 'Sonraki Seviye',
    nextLevelHint: 'Vault seviyesine geçmek için ortalama bakiye süresini 90 güne tamamlayın.',
    auxiteerNote: 'Auxiteer programı, herhangi bir finansal getiri veya ödül vaadi içermez.',
    notEligible: 'Bu fiyatlama seviyesi için henüz uygun değilsiniz.',
    preferentialPricing: 'Tercihli fiyatlama (spread)',
    reducedFees: 'Azaltılmış işlem ücretleri',
    enhancedPriority: 'Geliştirilmiş işlem önceliği',
    // Notifications
    noNotifications: 'Bildirim yok',
    markAllRead: 'Tümünü Okundu İşaretle',
    // Wallet
    walletAddress: 'Cüzdan Adresi',
    copyAddress: 'Adresi Kopyala',
    disconnect: 'Bağlantıyı Kes',
    connectWallet: 'Cüzdan Bağla',
    welcomeWallet: 'Auxite Wallet\'a Hoş Geldiniz',
    walletDesc: 'Fiziksel metallerle desteklenen dijital tokenleri alın ve satın. Gerçek zamanlı fiyatlar ve anlık işlemler.',
    cancel: 'İptal',
    done: 'Tamam',
  },
  en: {
    account: 'Account',
    finance: 'Finance',
    earn: 'Earn',
    support: 'Support',
    profile: 'Profile', email: 'Email', phone: 'Phone', saveProfile: 'Save',
    settings: 'Settings',
    security: 'Security',
    qrLogin: 'Login on Web',
    whitelist: 'Whitelist',
    sessions: 'Active Sessions',
    wallet: 'Wallet',
    language: 'Language',
    selectLanguage: 'Select Language',
    notifications: 'Notifications',
    referral: 'Invite Friends',
    recurringBuy: 'Recurring Buy',
    limitOrders: 'Limit Orders',
    auxiteerTier: 'Tier Status',
    helpCenter: 'Help Center',
    legal: 'Legal',
    darkMode: 'Dark Mode',
    logout: 'Logout',
    connected: 'Connected',
    notConnected: 'Not Connected',
    earnBonus: 'Earn ₺500',
    // Profile
    accountInfo: 'Account Information',
    uid: 'UID',
    identityVerification: 'Identity Verification',
    verified: 'Verified',
    unverified: 'Unverified',
    countryRegion: 'Country/Region',
    tradingFeeTier: 'Trading Fee Tier',
    // Verification
    verificationComplete: 'Verification Complete',
    verificationMessage: 'Thanks for verification! You unlocked full access and your account is secured.',
    startVerification: 'Start Verification',
    verifyIdentity: 'Verify Your Identity',
    verifySubtitle: 'Complete identity verification to access all features',
    step1: 'Personal Information',
    step2: 'Identity Document',
    step3: 'Selfie Verification',
    continue: 'Continue',
    // Auxiteer
    auxiteerStatus: 'Your Auxiteer Status',
    currentLevel: 'Current Level',
    spread: 'Spread',
    transactionFee: 'Transaction Fee',
    benefits: 'Benefits',
    requirements: 'Requirements',
    nextLevel: 'Next Level',
    nextLevelHint: 'Maintain your average balance for 90 days to become eligible for Vault level.',
    auxiteerNote: 'The Auxiteer program does not constitute a financial incentive or guaranteed return.',
    notEligible: 'You are not yet eligible for this pricing level.',
    preferentialPricing: 'Preferential pricing (spread)',
    reducedFees: 'Reduced transaction fees',
    enhancedPriority: 'Enhanced execution priority',
    // Notifications
    noNotifications: 'No notifications',
    markAllRead: 'Mark All as Read',
    // Wallet
    walletAddress: 'Wallet Address',
    copyAddress: 'Copy Address',
    disconnect: 'Disconnect',
    connectWallet: 'Connect Wallet',
    welcomeWallet: 'Welcome to Auxite Wallet',
    walletDesc: 'Buy and sell digital tokens backed by physical metals. Real-time prices and instant transactions.',
    cancel: 'Cancel',
    done: 'Done',
  },
  de: {
    account: 'Konto', finance: 'Finanzen', earn: 'Verdienen', support: 'Support',
    profile: 'Profil', email: 'E-posta', phone: 'Telefon', saveProfile: 'Kaydet', settings: 'Einstellungen', security: 'Sicherheit', qrLogin: 'Web-Anmeldung', wallet: 'Wallet',
    whitelist: 'Whitelist', sessions: 'Aktive Sitzungen', auxiteerTier: 'Stufen-Status',
    language: 'Sprache', selectLanguage: 'Sprache auswählen', notifications: 'Benachrichtigungen',
    referral: 'Freunde einladen', helpCenter: 'Hilfezentrum', legal: 'Rechtliches',
    darkMode: 'Dunkelmodus', logout: 'Abmelden', connected: 'Verbunden', notConnected: 'Nicht verbunden',
    earnBonus: '₺500 verdienen', accountInfo: 'Kontoinformationen', uid: 'UID',
    identityVerification: 'Identitätsprüfung', verified: 'Verifiziert', unverified: 'Nicht verifiziert',
    countryRegion: 'Land/Region', tradingFeeTier: 'Handelsgebührenstufe',
    verificationComplete: 'Verifizierung abgeschlossen',
    verificationMessage: 'Danke für die Verifizierung! Sie haben vollen Zugriff und Ihr Konto ist gesichert.',
    startVerification: 'Verifizierung starten', verifyIdentity: 'Identität verifizieren',
    verifySubtitle: 'Identitätsprüfung abschließen für vollen Zugang',
    step1: 'Persönliche Daten', step2: 'Ausweisdokument', step3: 'Selfie-Verifizierung',
    continue: 'Weiter', auxiteerStatus: 'Ihr Auxiteer-Status', currentLevel: 'Aktuelle Stufe',
    spread: 'Spread', transactionFee: 'Transaktionsgebühr', benefits: 'Vorteile',
    requirements: 'Anforderungen', nextLevel: 'Nächste Stufe',
    nextLevelHint: 'Halten Sie Ihr Guthaben 90 Tage für Vault-Stufe.',
    auxiteerNote: 'Das Auxiteer-Programm stellt keine finanzielle Anreiz dar.',
    notEligible: 'Sie sind noch nicht für diese Preisstufe berechtigt.',
    preferentialPricing: 'Vorzugspreise (Spread)', reducedFees: 'Reduzierte Gebühren',
    enhancedPriority: 'Verbesserte Ausführungspriorität', noNotifications: 'Keine Benachrichtigungen',
    markAllRead: 'Alle als gelesen markieren', walletAddress: 'Wallet-Adresse',
    copyAddress: 'Adresse kopieren', disconnect: 'Trennen', connectWallet: 'Wallet verbinden',
    welcomeWallet: 'Willkommen bei Auxite Wallet', walletDesc: 'Kaufen und verkaufen Sie digitale Token, die durch physische Metalle gedeckt sind. Echtzeitpreise und sofortige Transaktionen.',
    cancel: 'Abbrechen', done: 'Fertig',
  },
  fr: {
    account: 'Compte', finance: 'Finance', earn: 'Gagner', support: 'Support',
    profile: 'Profil', email: 'E-posta', phone: 'Telefon', saveProfile: 'Kaydet', settings: 'Paramètres', security: 'Sécurité', qrLogin: 'Connexion Web', wallet: 'Portefeuille',
    whitelist: 'Liste blanche', sessions: 'Sessions actives', auxiteerTier: 'Statut du niveau',
    language: 'Langue', selectLanguage: 'Sélectionner la langue', notifications: 'Notifications',
    referral: 'Inviter des amis', helpCenter: "Centre d'aide", legal: 'Légal',
    darkMode: 'Mode sombre', logout: 'Déconnexion', connected: 'Connecté', notConnected: 'Non connecté',
    earnBonus: 'Gagnez ₺500', accountInfo: 'Informations du compte', uid: 'UID',
    identityVerification: 'Vérification d\'identité', verified: 'Vérifié', unverified: 'Non vérifié',
    countryRegion: 'Pays/Région', tradingFeeTier: 'Niveau de frais',
    verificationComplete: 'Vérification terminée',
    verificationMessage: 'Merci pour la vérification! Vous avez un accès complet et votre compte est sécurisé.',
    startVerification: 'Commencer', verifyIdentity: 'Vérifiez votre identité',
    verifySubtitle: 'Complétez la vérification pour accéder à toutes les fonctionnalités',
    step1: 'Informations personnelles', step2: 'Document d\'identité', step3: 'Vérification selfie',
    continue: 'Continuer', auxiteerStatus: 'Votre statut Auxiteer', currentLevel: 'Niveau actuel',
    spread: 'Spread', transactionFee: 'Frais de transaction', benefits: 'Avantages',
    requirements: 'Conditions', nextLevel: 'Niveau suivant',
    nextLevelHint: 'Maintenez votre solde pendant 90 jours pour le niveau Vault.',
    auxiteerNote: 'Le programme Auxiteer ne constitue pas une incitation financière.',
    notEligible: 'Vous n\'êtes pas encore éligible pour ce niveau.',
    preferentialPricing: 'Tarification préférentielle (spread)', reducedFees: 'Frais réduits',
    enhancedPriority: 'Priorité d\'exécution améliorée', noNotifications: 'Pas de notifications',
    markAllRead: 'Tout marquer comme lu', walletAddress: 'Adresse du portefeuille',
    copyAddress: 'Copier l\'adresse', disconnect: 'Déconnecter', connectWallet: 'Connecter',
    welcomeWallet: 'Bienvenue sur Auxite Wallet', walletDesc: 'Achetez et vendez des jetons numériques adossés à des métaux physiques. Prix en temps réel et transactions instantanées.',
    cancel: 'Annuler', done: 'Terminé',
  },
  ar: {
    account: 'الحساب', finance: 'المالية', earn: 'اكسب', support: 'الدعم',
    profile: 'الملف', settings: 'الإعدادات', security: 'الأمان', qrLogin: 'تسجيل الويب', wallet: 'المحفظة',
    whitelist: 'القائمة البيضاء', sessions: 'الجلسات النشطة', auxiteerTier: 'حالة المستوى',
    language: 'اللغة', selectLanguage: 'اختر اللغة', notifications: 'الإشعارات',
    referral: 'دعوة الأصدقاء', helpCenter: 'مركز المساعدة', legal: 'قانوني',
    darkMode: 'الوضع الداكن', logout: 'خروج', connected: 'متصل', notConnected: 'غير متصل',
    earnBonus: 'اربح ₺500', accountInfo: 'معلومات الحساب', uid: 'المعرف',
    identityVerification: 'التحقق من الهوية', verified: 'تم التحقق', unverified: 'لم يتم التحقق',
    countryRegion: 'البلد/المنطقة', tradingFeeTier: 'مستوى رسوم التداول',
    verificationComplete: 'اكتمل التحقق',
    verificationMessage: 'شكرًا للتحقق! لديك وصول كامل وحسابك آمن.',
    startVerification: 'بدء التحقق', verifyIdentity: 'تحقق من هويتك',
    verifySubtitle: 'أكمل التحقق للوصول إلى جميع الميزات',
    step1: 'المعلومات الشخصية', step2: 'وثيقة الهوية', step3: 'التحقق بالصورة',
    continue: 'متابعة', auxiteerStatus: 'حالة Auxiteer', currentLevel: 'المستوى الحالي',
    spread: 'السبريد', transactionFee: 'رسوم المعاملة', benefits: 'المزايا',
    requirements: 'المتطلبات', nextLevel: 'المستوى التالي',
    nextLevelHint: 'حافظ على رصيدك لمدة 90 يومًا للمستوى التالي.',
    auxiteerNote: 'برنامج Auxiteer لا يشكل حافزًا ماليًا.',
    notEligible: 'لست مؤهلاً بعد لهذا المستوى.',
    preferentialPricing: 'تسعير تفضيلي', reducedFees: 'رسوم مخفضة',
    enhancedPriority: 'أولوية تنفيذ محسنة', noNotifications: 'لا توجد إشعارات',
    markAllRead: 'تحديد الكل كمقروء', walletAddress: 'عنوان المحفظة',
    copyAddress: 'نسخ العنوان', disconnect: 'قطع الاتصال', connectWallet: 'ربط المحفظة',
    welcomeWallet: 'مرحباً بك في Auxite Wallet', walletDesc: 'اشترِ وبِع الرموز الرقمية المدعومة بالمعادن الفعلية. أسعار فورية ومعاملات لحظية.',
    cancel: 'إلغاء', done: 'تم',
  },
  ru: {
    account: 'Аккаунт', finance: 'Финансы', earn: 'Заработок', support: 'Поддержка',
    profile: 'Профиль', settings: 'Настройки', security: 'Безопасность', qrLogin: 'Вход на сайт', wallet: 'Кошелек',
    whitelist: 'Белый список', sessions: 'Активные сессии', auxiteerTier: 'Статус уровня',
    language: 'Язык', selectLanguage: 'Выберите язык', notifications: 'Уведомления',
    referral: 'Пригласить друзей', helpCenter: 'Центр помощи', legal: 'Правовая',
    darkMode: 'Тёмный режим', logout: 'Выйти', connected: 'Подключен', notConnected: 'Не подключен',
    earnBonus: 'Заработайте ₺500', accountInfo: 'Информация об аккаунте', uid: 'UID',
    identityVerification: 'Верификация личности', verified: 'Подтверждено', unverified: 'Не подтверждено',
    countryRegion: 'Страна/Регион', tradingFeeTier: 'Уровень комиссии',
    verificationComplete: 'Верификация завершена',
    verificationMessage: 'Спасибо за верификацию! У вас полный доступ и аккаунт защищен.',
    startVerification: 'Начать верификацию', verifyIdentity: 'Подтвердите личность',
    verifySubtitle: 'Пройдите верификацию для доступа ко всем функциям',
    step1: 'Личные данные', step2: 'Документ', step3: 'Селфи-верификация',
    continue: 'Продолжить', auxiteerStatus: 'Ваш статус Auxiteer', currentLevel: 'Текущий уровень',
    spread: 'Спред', transactionFee: 'Комиссия', benefits: 'Преимущества',
    requirements: 'Требования', nextLevel: 'Следующий уровень',
    nextLevelHint: 'Поддерживайте баланс 90 дней для уровня Vault.',
    auxiteerNote: 'Программа Auxiteer не является финансовым стимулом.',
    notEligible: 'Вы пока не соответствуете этому уровню.',
    preferentialPricing: 'Льготное ценообразование', reducedFees: 'Сниженные комиссии',
    enhancedPriority: 'Приоритетное исполнение', noNotifications: 'Нет уведомлений',
    markAllRead: 'Отметить все как прочитанные', walletAddress: 'Адрес кошелька',
    copyAddress: 'Скопировать адрес', disconnect: 'Отключить', connectWallet: 'Подключить кошелек',
    welcomeWallet: 'Добро пожаловать в Auxite Wallet', walletDesc: 'Покупайте и продавайте цифровые токены, обеспеченные физическими металлами. Цены в реальном времени и мгновенные транзакции.',
    cancel: 'Отмена', done: 'Готово',
  },
};

const languages = [
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
];

// Mock notifications
const mockNotifications = [
  { id: 1, type: 'transaction', title: 'Gold Purchase', message: '0.5g AUXG purchased', time: '10m', read: false },
  { id: 2, type: 'price', title: 'Price Alert', message: 'Gold reached $2,650/oz', time: '1h', read: false },
  { id: 3, type: 'security', title: 'New Login', message: 'Login from Istanbul', time: '2h', read: true },
];

// ============================================
// TROPICAL FRUIT AVATAR COMPONENT
// ============================================
  const TropicalFruitAvatar = ({ seed, size = 80 }: { seed: string | null; size?: number }) => {
  const safeSeed = seed || 'default-avatar';
  const fruitIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < safeSeed.length; i++) {
      hash = ((hash << 5) - hash) + safeSeed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % TROPICAL_FRUITS.length;
  }, [safeSeed]);

  const fruit = TROPICAL_FRUITS[fruitIndex];

  // B&W pattern based on fruit type
  const renderPattern = () => {
    switch (fruit.pattern) {
      case 'dots':
        return (
          <>
            <View style={[fruitStyles.dot, { top: '20%', left: '30%' }]} />
            <View style={[fruitStyles.dot, { top: '40%', left: '50%' }]} />
            <View style={[fruitStyles.dot, { top: '60%', left: '35%' }]} />
            <View style={[fruitStyles.dot, { top: '35%', left: '65%' }]} />
          </>
        );
      case 'stripes':
        return (
          <>
            <View style={[fruitStyles.stripe, { top: '25%' }]} />
            <View style={[fruitStyles.stripe, { top: '45%' }]} />
            <View style={[fruitStyles.stripe, { top: '65%' }]} />
          </>
        );
      case 'spikes':
        return (
          <>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <View
                key={angle}
                style={[
                  fruitStyles.spike,
                  {
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -size * 0.35 },
                    ],
                  },
                ]}
              />
            ))}
          </>
        );
      case 'bumps':
        return (
          <>
            <View style={[fruitStyles.bump, { top: '15%', left: '40%' }]} />
            <View style={[fruitStyles.bump, { top: '35%', left: '25%' }]} />
            <View style={[fruitStyles.bump, { top: '35%', left: '55%' }]} />
            <View style={[fruitStyles.bump, { top: '55%', left: '40%' }]} />
          </>
        );
      case 'grid':
        return (
          <View style={fruitStyles.gridContainer}>
            {[...Array(9)].map((_, i) => (
              <View key={i} style={fruitStyles.gridCell} />
            ))}
          </View>
        );
      case 'scales':
        return (
          <>
            <View style={[fruitStyles.scale, { top: '20%', left: '35%' }]} />
            <View style={[fruitStyles.scale, { top: '20%', left: '55%' }]} />
            <View style={[fruitStyles.scale, { top: '40%', left: '25%' }]} />
            <View style={[fruitStyles.scale, { top: '40%', left: '45%' }]} />
            <View style={[fruitStyles.scale, { top: '40%', left: '65%' }]} />
            <View style={[fruitStyles.scale, { top: '60%', left: '35%' }]} />
            <View style={[fruitStyles.scale, { top: '60%', left: '55%' }]} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[fruitStyles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={fruitStyles.innerCircle}>
        {renderPattern()}
      </View>
    </View>
  );
};

const fruitStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  innerCircle: {
    width: '75%',
    height: '75%',
    borderRadius: 100,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  stripe: {
    position: 'absolute',
    left: '15%',
    width: '70%',
    height: 2,
    backgroundColor: '#10b981',
    borderRadius: 1,
  },
  spike: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 3,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 2,
    marginLeft: -1.5,
  },
  bump: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: 'transparent',
  },
  gridContainer: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  scale: {
    position: 'absolute',
    width: 8,
    height: 5,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
});

// ============================================
// MENU ITEM COMPONENT
// ============================================
const MenuItem = ({ icon, label, onPress, iconColor, iconBgColor, rightComponent, badge, badgeColor, highlight, colors }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.menuItem, highlight && { backgroundColor: iconBgColor + '15', borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 16 }]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        activeOpacity={0.8}
      >
        <View style={[styles.menuIconBg, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.text }, highlight && { color: iconColor, fontWeight: '600' }]}>{label}</Text>
        {badge && <View style={[styles.badge, { backgroundColor: badgeColor || colors.primary }]}><Text style={styles.badgeText}>{badge}</Text></View>}
        {rightComponent || <Ionicons name="chevron-forward" size={16} color={colors.border} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SectionHeader = ({ title, colors }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
  </View>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function DrawerMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { walletAddress, isConnected, theme, setTheme, language, setLanguage, logout, setIsConnected, setWalletAddress, setIsLoggedIn } = useStore();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Modal states
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showAuxiteerModal, setShowAuxiteerModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  // Toast helper function
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };
  
  // Copy handlers
  const handleCopyUID = async () => {
    if (userId) await Clipboard.setStringAsync(userId);
    showToast(t.copied || 'Copied!');
  };
  
  const handleCopyWallet = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      showToast(t.copied || 'Copied!');
    }
  };
  
  // User state
  const { userEmail, setUserEmail, userName, setUserName } = useStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // Load or create avatar seed on mount
   useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.email) {
            setUserEmail(user.email);
          }
          if (user.id) {
            setUserId(user.id);
            setAvatarSeed(user.id); // Use user id as avatar seed
          }
          if (user.name) {
            setUserName(user.name);
          }
        }
      } catch (error) {
        console.error('Load user data error:', error);
      }
    };
    loadUserData();
  }, []);

  // Fetch profile when wallet connected
  useEffect(() => {
    const fetchProfile = async () => {
      if (walletAddress && isConnected) {
        try {
          const response = await fetch(`${API_URL}/api/user/profile?address=${walletAddress}`);
          const data = await response.json();
          if (data.success && data.profile) {
            if (data.profile.email) {
              setUserEmail(data.profile.email);
            }
            if (data.userId) {
              setUserId(data.userId);
            }
          }
        } catch (err) {
          console.error('Profile fetch error:', err);
        }
      }
    };
    fetchProfile();
  }, [walletAddress, isConnected]);
  
  const [userCountry] = useState('Turkey');
  const [userTier] = useState<keyof typeof AUXITEER_TIERS>('reserve'); // Current tier
  const [kycStep, setKycStep] = useState(1);
  const [userPhone, setUserPhone] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  
  const [notifications, setNotifications] = useState(mockNotifications);
  const [tierConfig, setTierConfig] = useState(AUXITEER_TIERS);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch tier config from API
  useEffect(() => {
    fetch(`${API_URL}/api/tiers`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.tiers) {
          const updated = { ...AUXITEER_TIERS };
          data.tiers.forEach((t: any) => {
            if (updated[t.id as keyof typeof AUXITEER_TIERS]) {
              updated[t.id as keyof typeof AUXITEER_TIERS] = {
                ...updated[t.id as keyof typeof AUXITEER_TIERS],
                spread: t.spread === 0 ? "Custom" : t.spread,
                fee: t.fee === 0 ? "Custom" : t.fee,
              };
            }
          });
          setTierConfig(updated);
        }
      })
      .catch(err => console.log("DrawerMenu tier fetch error:", err));
  }, []);

  // Fetch user UID
  useEffect(() => {
    if (walletAddress) {
      fetch(`${API_URL}/api/allocations?address=${walletAddress}`)
        .then(r => r.json())
        .then(data => {
          if (data.uid) {
            setUserId(data.uid);
          }
        })
        .catch(err => console.log("UID fetch error:", err));
    }
  }, [walletAddress]);

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;
  const currentLang = languages.find(l => l.code === language) || languages[1];

  const colors = {
    primary: '#10b981',
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    cardBg: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    danger: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    orange: '#f59e0b',
    pink: '#ec4899',
    cyan: '#06b6d4',
    rose: '#f43f5e',
  };

  // Mask email
  const maskedEmail = useMemo(() => {
    if (!userEmail) return "";
    const [local, domain] = userEmail.split('@');
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 3)}***@${domain}`;
  }, [userEmail]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const formatAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '---';

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 150);
  };

  const handleLogout = () => {
    onClose();
    logout?.() || (setIsConnected(false), setWalletAddress(''), setIsLoggedIn(false));
    router.replace('/auth/login');
  };

  const handleVerificationPress = () => {
    setShowProfileModal(false);
    if (isVerified) {
      setShowVerifiedModal(true);
    } else {
      // Sumsub KYC sayfasına yönlendir
      onClose();
      setTimeout(() => router.push('/kyc' as any), 150);
    }
  };

  const handleKYCContinue = () => {
    if (kycStep < 3) {
      setKycStep(kycStep + 1);
    } else {
      setShowKYCModal(false);
      setIsVerified(true);
      setKycStep(1);
      setTimeout(() => setShowVerifiedModal(true), 300);
    }
  };

  const handleTierPress = () => {
    setShowProfileModal(false);
    setTimeout(() => setShowAuxiteerModal(true), 200);
  };

  const currentTierData = tierConfig[userTier];
  const lang = language === 'tr' ? 'tr' : 'en';

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { backgroundColor: colors.background, transform: [{ translateX: slideAnim }] }]}>
        <LinearGradient
          colors={isDark ? ['#1e293b', '#0f172a'] : ['#10b981', '#059669']}
          style={[styles.drawerHeader, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => setShowProfileModal(true)}>
              <View style={[styles.avatarRing, { borderColor: isDark ? colors.primary : 'rgba(255,255,255,0.5)' }]}>
                <TropicalFruitAvatar seed={avatarSeed} size={46} />
              </View>
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={[styles.connectionStatus, { color: isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>{isConnected ? t.connected : t.notConnected}</Text>
              <Text style={[styles.userName, { color: isDark ? colors.text : '#fff' }]}>{userId || formatAddress(walletAddress)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)'} />
            </TouchableOpacity>
          </View>
          {/* Logo & Slogan */}
          <View style={styles.brandRow}>
            <Image 
              source={require('@/assets/images/auxite-wallet-logo.png')} 
              style={[styles.brandLogo, { tintColor: isDark ? colors.primary : '#fff' }]} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.sloganRow}>
            <View style={[styles.sloganLine, { backgroundColor: isDark ? colors.primary : 'rgba(255,255,255,0.5)' }]} />
            <Text style={[styles.sloganText, { color: isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>DIGITIZED TRADITION</Text>
            <View style={[styles.sloganLine, { backgroundColor: isDark ? colors.primary : 'rgba(255,255,255,0.5)' }]} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          <SectionHeader title={t.account} colors={colors} />
          <MenuItem icon="person-outline" label={t.profile} onPress={() => setShowProfileModal(true)} iconColor={colors.blue} iconBgColor={colors.blue + '20'} colors={colors} />
          <MenuItem icon="settings-outline" label={t.settings} onPress={() => handleNavigation('/notification-settings')} iconColor={colors.primary} iconBgColor={colors.primary + '20'} highlight colors={colors} />
          <MenuItem icon="shield-checkmark-outline" label={t.security} onPress={() => setShowSecurityModal(true)} iconColor={colors.purple} iconBgColor={colors.purple + '20'} colors={colors} />
          <MenuItem icon="qr-code-outline" label={t.qrLogin} onPress={() => setShowQRScanner(true)} iconColor={colors.cyan} iconBgColor={colors.cyan + '20'} colors={colors} />
          <MenuItem icon="list-outline" label={t.whitelist} onPress={() => handleNavigation('/whitelist')} iconColor={colors.cyan} iconBgColor={colors.cyan + '20'} colors={colors} />
          <MenuItem icon="desktop-outline" label={t.sessions} onPress={() => handleNavigation('/sessions')} iconColor={colors.orange} iconBgColor={colors.orange + '20'} colors={colors} />

          <SectionHeader title={t.finance} colors={colors} />
          <MenuItem icon="wallet-outline" label={t.wallet} onPress={() => setShowWalletModal(true)} iconColor={colors.orange} iconBgColor={colors.orange + '20'} colors={colors} />
          <MenuItem icon="language-outline" label={t.language} onPress={() => setShowLanguageModal(true)} iconColor={colors.cyan} iconBgColor={colors.cyan + '20'} rightComponent={<View style={styles.langBadge}><Text style={styles.flagEmoji}>{currentLang.flag}</Text><Text style={[styles.langCode, { color: colors.textSecondary }]}>{language.toUpperCase()}</Text><Ionicons name="chevron-forward" size={16} color={colors.border} /></View>} colors={colors} />
          <MenuItem icon="notifications-outline" label={t.notifications} onPress={() => setShowNotificationsModal(true)} iconColor={colors.pink} iconBgColor={colors.pink + '20'} badge={unreadCount > 0 ? unreadCount.toString() : undefined} badgeColor={colors.rose} colors={colors} />

          <SectionHeader title={t.earn} colors={colors} />
          <MenuItem icon="people-outline" label={t.referral} onPress={() => handleNavigation('/referral')} iconColor={colors.primary} iconBgColor={colors.primary + '20'} badge={t.earnBonus} badgeColor={colors.primary} highlight colors={colors} />
          <MenuItem icon="ribbon-outline" label={t.auxiteerTier} onPress={() => handleNavigation('/auxiteer-tier')} iconColor={colors.orange} iconBgColor={colors.orange + '20'} colors={colors} />

          <SectionHeader title={t.support} colors={colors} />
          <MenuItem icon="chatbubble-ellipses-outline" label={t.helpCenter} onPress={() => setShowFAQModal(true)} iconColor={colors.blue} iconBgColor={colors.blue + '20'} colors={colors} />
          <MenuItem icon="document-text-outline" label={t.legal} onPress={() => handleNavigation('/legal')} iconColor={colors.textSecondary} iconBgColor={colors.border} colors={colors} />

          <View style={[styles.menuItem, { marginTop: 8 }]}>
            <View style={[styles.menuIconBg, { backgroundColor: isDark ? colors.purple + '20' : colors.orange + '20' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.purple : colors.orange} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{t.darkMode}</Text>
            <Switch value={isDark} onValueChange={() => setTheme(isDark ? 'light' : 'dark')} trackColor={{ false: colors.border, true: colors.primary + '50' }} thumbColor={isDark ? colors.primary : '#fff'} />
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.drawerFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={[styles.menuIconBg, { backgroundColor: colors.danger + '15' }]}><Ionicons name="log-out-outline" size={18} color={colors.danger} /></View>
            <Text style={[styles.logoutText, { color: colors.danger }]}>{t.logout}</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>v1.0.0</Text>
        </View>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LANGUAGE MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showLanguageModal} animationType="fade" transparent onRequestClose={() => setShowLanguageModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.selectLanguage}</Text>
            {languages.map((lang) => (
              <TouchableOpacity key={lang.code} style={[styles.languageOption, language === lang.code && { backgroundColor: colors.primary + '15' }, { borderBottomColor: colors.border }]} onPress={() => { setLanguage(lang.code); setShowLanguageModal(false); }}>
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
                {language === lang.code && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PROFILE MODAL - REDESIGNED
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowProfileModal(false)}>
        <View style={[styles.fullModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fullModalTitle, { color: colors.text }]}>{t.profile}</Text>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.fullModalContent} showsVerticalScrollIndicator={false}>
            {/* Tropical Fruit Avatar */}
            <View style={styles.profileAvatarSection}>
              <TropicalFruitAvatar seed={avatarSeed} size={100} />
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{maskedEmail}</Text>
            </View>

            {/* Account Information */}
            <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{t.accountInfo}</Text>
            
            <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* UID */}
              <View style={[styles.profileRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.profileRowLabel, { color: colors.textSecondary }]}>{t.uid}</Text>
                <View style={styles.profileRowRight}>
                  <Text style={[styles.profileRowValue, { color: colors.text }]}>{userId}</Text>
                  <TouchableOpacity onPress={handleCopyUID}>
                    <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Identity Verification */}
              <TouchableOpacity style={[styles.profileRow, { borderBottomColor: colors.border }]} onPress={handleVerificationPress}>
                <Text style={[styles.profileRowLabel, { color: colors.textSecondary }]}>{t.identityVerification}</Text>
                <View style={styles.profileRowRight}>
                  <View style={[styles.verificationBadge, { backgroundColor: isVerified ? colors.primary + '20' : colors.orange + '20' }]}>
                    <Ionicons name={isVerified ? 'checkmark-circle' : 'alert-circle'} size={14} color={isVerified ? colors.primary : colors.orange} />
                    <Text style={[styles.verificationText, { color: isVerified ? colors.primary : colors.orange }]}>
                      {isVerified ? t.verified : t.unverified}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.border} />
                </View>
              </TouchableOpacity>

              {/* Email */}
              <View style={[styles.profileRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.profileRowLabel, { color: colors.textSecondary }]}>{t.email || 'Email'}</Text>
                <View style={styles.profileRowRight}>
                  {editingEmail ? (
                    <TextInput
                      style={[styles.profileInput, { color: colors.text, borderColor: colors.border }]}
                      value={userEmail}
                      onChangeText={setUserEmail}
                      placeholder="email@example.com"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onBlur={() => setEditingEmail(false)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <Text style={[styles.profileRowValue, { color: colors.text }]}>{userEmail || '—'}</Text>
                      <TouchableOpacity onPress={() => setEditingEmail(true)}>
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Phone */}
              <View style={[styles.profileRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.profileRowLabel, { color: colors.textSecondary }]}>{t.phone || 'Phone'}</Text>
                <View style={styles.profileRowRight}>
                  {editingPhone ? (
                    <TextInput
                      style={[styles.profileInput, { color: colors.text, borderColor: colors.border }]}
                      value={userPhone}
                      onChangeText={setUserPhone}
                      placeholder="+90 555 123 4567"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      onBlur={() => setEditingPhone(false)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <Text style={[styles.profileRowValue, { color: colors.text }]}>{userPhone || '—'}</Text>
                      <TouchableOpacity onPress={() => setEditingPhone(true)}>
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Country/Region */}
              <View style={[styles.profileRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.profileRowLabel, { color: colors.textSecondary }]}>{t.countryRegion}</Text>
                <Text style={[styles.profileRowValue, { color: colors.text }]}>🇹🇷 {userCountry}</Text>
              </View>

              {/* Trading Fee Tier */}
              <TouchableOpacity style={styles.profileRow} onPress={handleTierPress}>
                <Text style={[styles.profileRowLabel, { color: colors.textSecondary }]}>{t.tradingFeeTier}</Text>
                <View style={styles.profileRowRight}>
                  <View style={[styles.tierBadge, { backgroundColor: currentTierData.color + '20' }]}>
                    <Ionicons name={currentTierData.icon as any} size={14} color={currentTierData.color} />
                    <Text style={[styles.tierText, { color: currentTierData.color }]}>
                      {currentTierData.name[lang]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.border} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          VERIFIED SUCCESS MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showVerifiedModal} animationType="fade" transparent onRequestClose={() => setShowVerifiedModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowVerifiedModal(false)}>
          <View style={[styles.verifiedModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.verifiedIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.verifiedTitle, { color: colors.text }]}>{t.verificationComplete}</Text>
            <Text style={[styles.verifiedMessage, { color: colors.textSecondary }]}>{t.verificationMessage}</Text>
            <TouchableOpacity style={[styles.verifiedButton, { backgroundColor: colors.primary }]} onPress={() => setShowVerifiedModal(false)}>
              <Text style={styles.verifiedButtonText}>{t.done}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          KYC MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showKYCModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowKYCModal(false)}>
        <View style={[styles.fullModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowKYCModal(false); setKycStep(1); }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.fullModalTitle, { color: colors.text }]}>{t.verifyIdentity}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.kycContent}>
            {/* Progress */}
            <View style={styles.kycProgress}>
              {[1, 2, 3].map((step) => (
                <View key={step} style={styles.kycStepContainer}>
                  <View style={[styles.kycStepCircle, { backgroundColor: step <= kycStep ? colors.primary : colors.border }]}>
                    {step < kycStep ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text style={[styles.kycStepNumber, { color: step === kycStep ? '#fff' : colors.textSecondary }]}>{step}</Text>
                    )}
                  </View>
                  <Text style={[styles.kycStepLabel, { color: step === kycStep ? colors.primary : colors.textSecondary }]}>
                    {step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3}
                  </Text>
                </View>
              ))}
            </View>

            {/* Step Content */}
            <View style={styles.kycStepContent}>
              {kycStep === 1 && (
                <View style={styles.kycFormSection}>
                  <View style={[styles.kycIconBox, { backgroundColor: colors.blue + '20' }]}>
                    <Ionicons name="person-outline" size={40} color={colors.blue} />
                  </View>
                  <Text style={[styles.kycStepTitle, { color: colors.text }]}>{t.step1}</Text>
                  <Text style={[styles.kycStepDesc, { color: colors.textSecondary }]}>{t.verifySubtitle}</Text>
                </View>
              )}
              {kycStep === 2 && (
                <View style={styles.kycFormSection}>
                  <View style={[styles.kycIconBox, { backgroundColor: colors.purple + '20' }]}>
                    <Ionicons name="card-outline" size={40} color={colors.purple} />
                  </View>
                  <Text style={[styles.kycStepTitle, { color: colors.text }]}>{t.step2}</Text>
                  <Text style={[styles.kycStepDesc, { color: colors.textSecondary }]}>{t.verifySubtitle}</Text>
                </View>
              )}
              {kycStep === 3 && (
                <View style={styles.kycFormSection}>
                  <View style={[styles.kycIconBox, { backgroundColor: colors.pink + '20' }]}>
                    <Ionicons name="camera-outline" size={40} color={colors.pink} />
                  </View>
                  <Text style={[styles.kycStepTitle, { color: colors.text }]}>{t.step3}</Text>
                  <Text style={[styles.kycStepDesc, { color: colors.textSecondary }]}>{t.verifySubtitle}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.kycButton, { backgroundColor: colors.primary }]} onPress={handleKYCContinue}>
              <Text style={styles.kycButtonText}>{kycStep === 3 ? t.done : t.continue}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          AUXITEER TIERS MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showAuxiteerModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAuxiteerModal(false)}>
        <View style={[styles.fullModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fullModalTitle, { color: colors.text }]}>{t.auxiteerStatus}</Text>
            <TouchableOpacity onPress={() => setShowAuxiteerModal(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.fullModalContent} showsVerticalScrollIndicator={false}>
            {/* Current Level Card */}
            <View style={[styles.currentTierCard, { backgroundColor: currentTierData.color + '15', borderColor: currentTierData.color }]}>
              <View style={styles.currentTierHeader}>
                <View style={[styles.currentTierIcon, { backgroundColor: currentTierData.color }]}>
                  <Ionicons name={currentTierData.icon as any} size={24} color="#fff" />
                </View>
                <View>
                  <Text style={[styles.currentTierLabel, { color: colors.textSecondary }]}>{t.currentLevel}</Text>
                  <Text style={[styles.currentTierName, { color: currentTierData.color }]}>{currentTierData.name[lang]}</Text>
                </View>
              </View>
              <View style={styles.currentTierStats}>
                <View style={styles.tierStat}>
                  <Text style={[styles.tierStatLabel, { color: colors.textSecondary }]}>{t.spread}</Text>
                  <Text style={[styles.tierStatValue, { color: colors.text }]}>
                    {typeof currentTierData.spread === 'number' ? `%${currentTierData.spread.toFixed(2)}` : currentTierData.spread}
                  </Text>
                </View>
                <View style={[styles.tierStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.tierStat}>
                  <Text style={[styles.tierStatLabel, { color: colors.textSecondary }]}>{t.transactionFee}</Text>
                  <Text style={[styles.tierStatValue, { color: colors.text }]}>
                    {typeof currentTierData.fee === 'number' ? `%${currentTierData.fee.toFixed(2)}` : currentTierData.fee}
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefits */}
            <Text style={[styles.auxiteerSectionTitle, { color: colors.text }]}>{t.benefits}</Text>
            <View style={[styles.benefitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[t.preferentialPricing, t.reducedFees, t.enhancedPriority].map((benefit, i) => (
                <View key={i} style={[styles.benefitRow, i < 2 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* All Tiers */}
            <Text style={[styles.auxiteerSectionTitle, { color: colors.text }]}>All Levels</Text>
            {Object.values(AUXITEER_TIERS).map((tier) => (
              <View key={tier.id} style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: tier.id === userTier ? tier.color : colors.border }]}>
                <View style={styles.tierCardHeader}>
                  <View style={[styles.tierCardIcon, { backgroundColor: tier.color + '20' }]}>
                    <Ionicons name={tier.icon as any} size={20} color={tier.color} />
                  </View>
                  <Text style={[styles.tierCardName, { color: tier.id === userTier ? tier.color : colors.text }]}>{tier.name[lang]}</Text>
                  {tier.id === userTier && (
                    <View style={[styles.currentBadge, { backgroundColor: tier.color }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tierCardStats}>
                  <Text style={[styles.tierCardStat, { color: colors.textSecondary }]}>
                    {t.spread}: <Text style={{ color: colors.text }}>{typeof tier.spread === 'number' ? `%${tier.spread.toFixed(2)}` : tier.spread}</Text>
                  </Text>
                  <Text style={[styles.tierCardStat, { color: colors.textSecondary }]}>
                    {t.transactionFee}: <Text style={{ color: colors.text }}>{typeof tier.fee === 'number' ? `%${tier.fee.toFixed(2)}` : tier.fee}</Text>
                  </Text>
                </View>
              </View>
            ))}

            {/* Legal Note */}
            <Text style={[styles.auxiteerNote, { color: colors.textSecondary }]}>{t.auxiteerNote}</Text>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          NOTIFICATIONS MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showNotificationsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowNotificationsModal(false)}>
        <View style={[styles.fullModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.fullModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fullModalTitle, { color: colors.text }]}>{t.notifications}</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                  <Text style={[styles.markReadText, { color: colors.primary }]}>{t.markAllRead}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.fullModalContent}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t.noNotifications}</Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <View key={notif.id} style={[styles.notificationItem, { backgroundColor: notif.read ? 'transparent' : colors.primary + '08', borderBottomColor: colors.border }]}>
                  <View style={[styles.notificationIcon, { backgroundColor: (notif.type === 'transaction' ? colors.primary : notif.type === 'price' ? colors.orange : notif.type === 'security' ? colors.purple : colors.pink) + '20' }]}>
                    <Ionicons name={(notif.type === 'transaction' ? 'swap-horizontal' : notif.type === 'price' ? 'trending-up' : notif.type === 'security' ? 'shield-checkmark' : 'gift') as any} size={20} color={notif.type === 'transaction' ? colors.primary : notif.type === 'price' ? colors.orange : notif.type === 'security' ? colors.purple : colors.pink} />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>{notif.title}</Text>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{notif.message}</Text>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>{notif.time}</Text>
                  </View>
                  {!notif.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          WALLET MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showWalletModal} animationType="fade" transparent onRequestClose={() => setShowWalletModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowWalletModal(false)}>
          <View style={[styles.walletModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.walletHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>{t.wallet}</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {isConnected ? (
              <>
                <View style={styles.walletInfo}>
                  <View style={[styles.walletIconLarge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="wallet" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>{t.walletAddress}</Text>
                  <Text style={[styles.walletAddressFull, { color: colors.text }]}>{walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}` : '---'}</Text>
                </View>
                <TouchableOpacity style={[styles.walletButton, { backgroundColor: colors.primary + '15' }]} onPress={handleCopyWallet}>
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  <Text style={[styles.walletButtonText, { color: colors.primary }]}>{t.copyAddress}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.walletButton, { backgroundColor: colors.danger + '15', marginBottom: 20 }]} onPress={() => { setIsConnected(false); setWalletAddress(''); setShowWalletModal(false); }}>
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  <Text style={[styles.walletButtonText, { color: colors.danger }]}>{t.disconnect}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.walletInfo}>
                <View style={[styles.walletIconLarge, { backgroundColor: colors.textSecondary + '20' }]}>
                  <Ionicons name="wallet-outline" size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>{t.notConnected}</Text>
                <TouchableOpacity style={[styles.connectButton, { backgroundColor: colors.primary }]} onPress={() => { setShowWalletModal(false); handleNavigation('/wallet-onboarding'); }}>
                  <Text style={styles.connectButtonText}>{t.connectWallet}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Security Modal */}
      <SecurityModal visible={showSecurityModal} onClose={() => setShowSecurityModal(false)} />
      <QRLoginScanner visible={showQRScanner} onClose={() => setShowQRScanner(false)} />

      {/* FAQ Modal */}
      <FAQModal visible={showFAQModal} onClose={() => setShowFAQModal(false)} />
      
      {/* Toast */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast, 
            { 
              opacity: toastOpacity, 
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.toastText, { color: colors.text }]}>{toastMessage}</Text>
        </Animated.View>
      )}
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: DRAWER_WIDTH, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 },
  drawerHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 1 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarLogo: { width: 36, height: 36 },
  userInfo: { flex: 1, marginLeft: 12 },
  connectionStatus: { fontSize: 12, fontWeight: '500' },
  userName: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  closeButton: { padding: 4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  brandLogo: { width: 140, height: 32 },
  sloganRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  sloganLine: { flex: 1, height: 1 },
  sloganText: { fontSize: 9, fontWeight: '600', letterSpacing: 2 },
  menuScroll: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, gap: 12 },
  menuIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  langBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flagEmoji: { fontSize: 16 },
  langCode: { fontSize: 11, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  drawerFooter: { borderTopWidth: 1, paddingTop: 16, paddingHorizontal: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8 },
  logoutText: { fontSize: 14, fontWeight: '600' },
  versionText: { fontSize: 11, textAlign: 'center', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxWidth: 320, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  languageOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  languageFlag: { fontSize: 24 },
  languageName: { flex: 1, fontSize: 15, fontWeight: '500' },
  fullModalContainer: { flex: 1 },
  fullModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  fullModalTitle: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  markReadText: { fontSize: 13, fontWeight: '600' },
  fullModalContent: { flex: 1, padding: 20 },
  // Profile
  profileAvatarSection: { alignItems: 'center', marginBottom: 24 },
  profileEmail: { marginTop: 12, fontSize: 14 },
  profileSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  profileCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  profileRowLabel: { fontSize: 14 },
  profileRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileRowValue: { fontSize: 14, fontWeight: '500' },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  verificationText: { fontSize: 12, fontWeight: '600' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  tierText: { fontSize: 12, fontWeight: '600' },
  // Verified
  verifiedModalContent: { width: '85%', maxWidth: 320, borderRadius: 20, padding: 24, alignItems: 'center' },
  verifiedIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  verifiedTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  verifiedMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  verifiedButton: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  verifiedButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // KYC
  kycContent: { flex: 1, padding: 20 },
  kycProgress: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  kycStepContainer: { alignItems: 'center', flex: 1 },
  kycStepCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kycStepNumber: { fontSize: 14, fontWeight: '700' },
  kycStepLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  kycStepContent: { flex: 1, justifyContent: 'center' },
  kycFormSection: { alignItems: 'center' },
  kycIconBox: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  kycStepTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  kycStepDesc: { fontSize: 14, textAlign: 'center' },
  kycButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, marginTop: 'auto' },
  kycButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Auxiteer
  auxiteerSectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  currentTierCard: { borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 8 },
  currentTierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  currentTierIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  currentTierLabel: { fontSize: 12 },
  currentTierName: { fontSize: 18, fontWeight: '700' },
  currentTierStats: { flexDirection: 'row', alignItems: 'center' },
  tierStat: { flex: 1, alignItems: 'center' },
  tierStatLabel: { fontSize: 12, marginBottom: 4 },
  tierStatValue: { fontSize: 20, fontWeight: '700' },
  tierStatDivider: { width: 1, height: 40 },
  benefitsCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  benefitText: { fontSize: 14, flex: 1 },
  tierCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 },
  tierCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tierCardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tierCardName: { fontSize: 15, fontWeight: '600', flex: 1 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  currentBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tierCardStats: { flexDirection: 'row', gap: 16 },
  tierCardStat: { fontSize: 13 },
  auxiteerNote: { fontSize: 11, fontStyle: 'italic', marginTop: 16, textAlign: 'center', lineHeight: 16 },
  // Notifications
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { marginTop: 12, fontSize: 15 },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  notificationIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  notificationMessage: { fontSize: 13, marginBottom: 4 },
  notificationTime: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  // Wallet
  walletModalContent: { width: '90%', maxWidth: 360, borderRadius: 16, overflow: 'hidden' },
  walletHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  walletInfo: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  walletIconLarge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  walletLabel: { fontSize: 13, marginBottom: 4 },
  walletAddressFull: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  walletButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, paddingVertical: 14, borderRadius: 12 },
  walletButtonText: { fontSize: 14, fontWeight: '600' },
  connectButton: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  connectButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  welcomeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' as const },
  welcomeDesc: { fontSize: 14, lineHeight: 20, textAlign: 'center' as const, marginBottom: 24, paddingHorizontal: 8 },
  // Toast
  toast: { 
    position: 'absolute', 
    bottom: 100, 
    alignSelf: 'center', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: { fontSize: 14, fontWeight: '600' },
});
