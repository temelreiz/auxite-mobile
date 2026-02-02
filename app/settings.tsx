// app/settings.tsx
// Settings Screen - NO CrossAuthService import (fixes expo-notifications error)

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Modal,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { useWallet } from '@/hooks/useWallet';
import { useCrossAuth } from '@/hooks/useCrossAuth';

const translations = {
  tr: {
    settings: 'Ayarlar', wallet: 'Cüzdan', connected: 'Bağlı', notConnected: 'Bağlı Değil',
    profile: 'Profil', email: 'E-posta', phone: 'Telefon', emailPlaceholder: 'E-posta adresinizi girin',
    phonePlaceholder: 'Telefon numaranızı girin', saveProfile: 'Kaydet', profileSaved: 'Profil kaydedildi',
    balance: 'Bakiye', disconnect: 'Bağlantıyı Kes', createWallet: 'Cüzdan Oluştur',
    importWallet: 'Cüzdan İçe Aktar', appearance: 'Görünüm', theme: 'Tema',
    themeSystem: 'Sistem', themeLight: 'Açık', themeDark: 'Koyu', language: 'Dil',
    crossPlatform: 'Çapraz Platform', openInWeb: "Web'de Aç", openInWebDesc: 'Tarayıcıda devam et',
    scanQR: 'QR Kod Tara', scanQRDesc: 'Web oturumuna giriş yap', thisDevice: 'Bu Cihaz',
    mobile: 'Mobil', active: 'Aktif', security: 'Güvenlik', biometric: 'Biyometrik Giriş',
    biometricDesc: 'Face ID veya Touch ID kullan', notifications: 'Bildirimler',
    notificationsDesc: 'Push bildirimleri al', support: 'Destek', helpCenter: 'Yardım Merkezi',
    contactUs: 'Bize Ulaşın', termsOfService: 'Kullanım Şartları', privacyPolicy: 'Gizlilik Politikası',
    about: 'Hakkında', version: 'Versiyon', confirmDisconnect: 'Bağlantıyı Kes',
    confirmDisconnectMsg: 'Cüzdan bağlantısını kesmek istediğinize emin misiniz?',
    cancel: 'İptal', confirm: 'Onayla', opening: 'Açılıyor...',
  },
  en: {
    settings: 'Settings', wallet: 'Wallet', connected: 'Connected', notConnected: 'Not Connected',
    profile: 'Profile', email: 'Email', phone: 'Phone', emailPlaceholder: 'Enter your email',
    phonePlaceholder: 'Enter your phone number', saveProfile: 'Save', profileSaved: 'Profile saved',
    balance: 'Balance', disconnect: 'Disconnect', createWallet: 'Create Wallet',
    importWallet: 'Import Wallet', appearance: 'Appearance', theme: 'Theme',
    themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark', language: 'Language',
    crossPlatform: 'Cross Platform', openInWeb: 'Open in Web', openInWebDesc: 'Continue in browser',
    scanQR: 'Scan QR Code', scanQRDesc: 'Login to web session', thisDevice: 'This Device',
    mobile: 'Mobile', active: 'Active', security: 'Security', biometric: 'Biometric Login',
    biometricDesc: 'Use Face ID or Touch ID', notifications: 'Notifications',
    notificationsDesc: 'Receive push notifications', support: 'Support', helpCenter: 'Help Center',
    contactUs: 'Contact Us', termsOfService: 'Terms of Service', privacyPolicy: 'Privacy Policy',
    about: 'About', version: 'Version', confirmDisconnect: 'Disconnect',
    confirmDisconnectMsg: 'Are you sure you want to disconnect your wallet?',
    cancel: 'Cancel', confirm: 'Confirm', opening: 'Opening...',
  },
  de: {
    settings: 'Einstellungen', wallet: 'Wallet', connected: 'Verbunden', notConnected: 'Nicht verbunden',
    balance: 'Guthaben', disconnect: 'Trennen', createWallet: 'Wallet erstellen', importWallet: 'Wallet importieren',
    appearance: 'Erscheinung', theme: 'Thema', themeSystem: 'System', themeLight: 'Hell', themeDark: 'Dunkel',
    language: 'Sprache', crossPlatform: 'Plattformübergreifend', openInWeb: 'Im Web öffnen',
    openInWebDesc: 'Im Browser fortfahren', scanQR: 'QR-Code scannen', scanQRDesc: 'Bei Web-Sitzung anmelden',
    thisDevice: 'Dieses Gerät', mobile: 'Mobil', active: 'Aktiv', security: 'Sicherheit',
    biometric: 'Biometrische Anmeldung', biometricDesc: 'Face ID oder Touch ID verwenden',
    notifications: 'Benachrichtigungen', notificationsDesc: 'Push-Benachrichtigungen erhalten',
    support: 'Support', helpCenter: 'Hilfezentrum', contactUs: 'Kontakt',
    termsOfService: 'Nutzungsbedingungen', privacyPolicy: 'Datenschutz', about: 'Über', version: 'Version',
    confirmDisconnect: 'Trennen', confirmDisconnectMsg: 'Möchten Sie die Wallet-Verbindung wirklich trennen?',
    cancel: 'Abbrechen', confirm: 'Bestätigen', opening: 'Öffnen...',
  },
  fr: {
    settings: 'Paramètres', wallet: 'Portefeuille', connected: 'Connecté', notConnected: 'Non connecté',
    balance: 'Solde', disconnect: 'Déconnecter', createWallet: 'Créer un portefeuille',
    importWallet: 'Importer un portefeuille', appearance: 'Apparence', theme: 'Thème',
    themeSystem: 'Système', themeLight: 'Clair', themeDark: 'Sombre', language: 'Langue',
    crossPlatform: 'Multiplateforme', openInWeb: 'Ouvrir sur le Web', openInWebDesc: 'Continuer dans le navigateur',
    scanQR: 'Scanner le QR', scanQRDesc: 'Connexion à la session web', thisDevice: 'Cet appareil',
    mobile: 'Mobile', active: 'Actif', security: 'Sécurité', biometric: 'Connexion biométrique',
    biometricDesc: 'Utiliser Face ID ou Touch ID', notifications: 'Notifications',
    notificationsDesc: 'Recevoir les notifications push', support: 'Support', helpCenter: "Centre d'aide",
    contactUs: 'Nous contacter', termsOfService: "Conditions d'utilisation",
    privacyPolicy: 'Politique de confidentialité', about: 'À propos', version: 'Version',
    confirmDisconnect: 'Déconnecter', confirmDisconnectMsg: 'Êtes-vous sûr de vouloir déconnecter votre portefeuille?',
    cancel: 'Annuler', confirm: 'Confirmer', opening: 'Ouverture...',
  },
  ar: {
    settings: 'الإعدادات', wallet: 'المحفظة', connected: 'متصل', notConnected: 'غير متصل',
    balance: 'الرصيد', disconnect: 'قطع الاتصال', createWallet: 'إنشاء محفظة', importWallet: 'استيراد محفظة',
    appearance: 'المظهر', theme: 'السمة', themeSystem: 'النظام', themeLight: 'فاتح', themeDark: 'داكن',
    language: 'اللغة', crossPlatform: 'عبر المنصات', openInWeb: 'فتح في الويب',
    openInWebDesc: 'المتابعة في المتصفح', scanQR: 'مسح رمز QR', scanQRDesc: 'تسجيل الدخول لجلسة الويب',
    thisDevice: 'هذا الجهاز', mobile: 'الهاتف', active: 'نشط', security: 'الأمان',
    biometric: 'تسجيل الدخول البيومتري', biometricDesc: 'استخدام Face ID أو Touch ID',
    notifications: 'الإشعارات', notificationsDesc: 'تلقي إشعارات الدفع', support: 'الدعم',
    helpCenter: 'مركز المساعدة', contactUs: 'اتصل بنا', termsOfService: 'شروط الخدمة',
    privacyPolicy: 'سياسة الخصوصية', about: 'حول', version: 'الإصدار',
    confirmDisconnect: 'قطع الاتصال', confirmDisconnectMsg: 'هل أنت متأكد أنك تريد قطع اتصال محفظتك؟',
    cancel: 'إلغاء', confirm: 'تأكيد', opening: 'جاري الفتح...',
  },
  ru: {
    settings: 'Настройки', wallet: 'Кошелек', connected: 'Подключен', notConnected: 'Не подключен',
    balance: 'Баланс', disconnect: 'Отключить', createWallet: 'Создать кошелек',
    importWallet: 'Импортировать кошелек', appearance: 'Внешний вид', theme: 'Тема',
    themeSystem: 'Системная', themeLight: 'Светлая', themeDark: 'Темная', language: 'Язык',
    crossPlatform: 'Кросс-платформа', openInWeb: 'Открыть в браузере',
    openInWebDesc: 'Продолжить в браузере', scanQR: 'Сканировать QR', scanQRDesc: 'Войти в веб-сессию',
    thisDevice: 'Это устройство', mobile: 'Мобильный', active: 'Активен', security: 'Безопасность',
    biometric: 'Биометрический вход', biometricDesc: 'Использовать Face ID или Touch ID',
    notifications: 'Уведомления', notificationsDesc: 'Получать push-уведомления', support: 'Поддержка',
    helpCenter: 'Центр помощи', contactUs: 'Связаться с нами', termsOfService: 'Условия использования',
    privacyPolicy: 'Политика конфиденциальности', about: 'О приложении', version: 'Версия',
    confirmDisconnect: 'Отключить', confirmDisconnectMsg: 'Вы уверены, что хотите отключить кошелек?',
    cancel: 'Отмена', confirm: 'Подтвердить', opening: 'Открытие...',
  },
};

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const themes = [
  { code: 'system', icon: 'phone-portrait-outline' },
  { code: 'light', icon: 'sunny-outline' },
  { code: 'dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { theme, setTheme, language, setLanguage, isConnected, walletAddress } = useStore();
  
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const { disconnect, balance } = useWallet();
  const { openInWeb } = useCrossAuth();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isOpeningWeb, setIsOpeningWeb] = useState(false);
  
  // Confirm Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#64748b' : '#94a3b8',
    border: isDark ? '#334155' : '#f1f5f9',
    primary: '#10b981',
    danger: '#ef4444',
  };

  const formatAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const handleDisconnect = () => {
    setShowConfirmModal(true);
  };
  
  const confirmDisconnect = () => {
    setShowConfirmModal(false);
    disconnect();
  };

  const handleOpenInWeb = async () => {
    setIsOpeningWeb(true);
    try { await openInWeb('/'); } finally { setIsOpeningWeb(false); }
  };
  
  const handleQRScanner = () => {
    showToast(t.comingSoon || 'Coming soon');
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  const SettingRow = ({ icon, iconColor = '#64748b', title, subtitle, value, onPress, showChevron = true, rightComponent, isLast = false }: any) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightComponent || (
        <>
          {value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
          {showChevron && onPress && <Ionicons name="chevron-forward" size={18} color={colors.border} />}
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Wallet */}
        <SectionHeader title={t.wallet} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {isConnected && walletAddress ? (
            <>
              <View style={styles.walletInfo}>
                <View style={[styles.walletAvatar, { backgroundColor: '#10b98120' }]}>
                  <Ionicons name="wallet" size={24} color="#10b981" />
                </View>
                <View style={styles.walletDetails}>
                  <View style={styles.walletStatusRow}>
                    <Text style={[styles.walletLabel, { color: colors.text }]}>{formatAddress(walletAddress)}</Text>
                    <View style={styles.connectedBadge}>
                      <View style={styles.connectedDot} />
                      <Text style={styles.connectedText}>{t.connected}</Text>
                    </View>
                  </View>
                  <Text style={[styles.walletBalance, { color: colors.textSecondary }]}>
                    {t.balance}: {parseFloat(balance || '0').toFixed(4)} ETH
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.disconnectButton, { backgroundColor: colors.background }]} onPress={handleDisconnect}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={[styles.disconnectText, { color: colors.danger }]}>{t.disconnect}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.notConnected}>
              <Ionicons name="wallet-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.notConnectedText, { color: colors.textSecondary }]}>{t.notConnected}</Text>
            </View>
          )}
        </View>

        {/* Cross Platform */}
        {isConnected && (
          <>
            <SectionHeader title={t.crossPlatform} />
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <SettingRow icon="globe-outline" iconColor="#3b82f6" title={t.openInWeb} subtitle={isOpeningWeb ? t.opening : t.openInWebDesc} onPress={handleOpenInWeb} showChevron={!isOpeningWeb} />
              <SettingRow icon="qr-code-outline" iconColor="#10b981" title={t.scanQR} subtitle={t.scanQRDesc} onPress={handleQRScanner} isLast />
            </View>
          </>
        )}

        {/* Appearance */}
        <SectionHeader title={t.appearance} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.themeSelector}>
            <Text style={[styles.settingTitle, { color: colors.text, marginBottom: 12 }]}>{t.theme}</Text>
            <View style={styles.themeOptions}>
              {themes.map((themeOpt) => (
                <TouchableOpacity key={themeOpt.code} style={[styles.themeOption, { backgroundColor: colors.background }, theme === themeOpt.code && styles.themeOptionActive]}
                  onPress={() => setTheme(themeOpt.code as any)}>
                  <Ionicons name={themeOpt.icon as any} size={20} color={theme === themeOpt.code ? '#10b981' : colors.textSecondary} />
                  <Text style={[styles.themeOptionText, { color: theme === themeOpt.code ? '#10b981' : colors.textSecondary }]}>
                    {t[`theme${themeOpt.code.charAt(0).toUpperCase() + themeOpt.code.slice(1)}` as keyof typeof t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <SettingRow icon="language-outline" iconColor="#8b5cf6" title={t.language}
            value={languages.find(l => l.code === language)?.flag + ' ' + languages.find(l => l.code === language)?.name}
            onPress={() => setShowLanguageModal(true)} isLast />
        </View>

        {/* Language Modal */}
        {showLanguageModal && (
          <View style={[styles.languageModal, { backgroundColor: colors.surface }]}>
            {languages.map((lang) => (
              <TouchableOpacity key={lang.code} style={[styles.languageOption, { borderBottomColor: colors.border }, language === lang.code && { backgroundColor: '#10b98110' }]}
                onPress={() => { setLanguage(lang.code); setShowLanguageModal(false); }}>
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
                {language === lang.code && <Ionicons name="checkmark" size={20} color="#10b981" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeLanguageModal} onPress={() => setShowLanguageModal(false)}>
              <Text style={{ color: colors.textSecondary }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KYC Verification */}
        {isConnected && (
          <>
            <SectionHeader title={language === 'tr' ? 'Kimlik Doğrulama' : 'Identity Verification'} />
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <SettingRow 
                icon="shield-checkmark-outline" 
                iconColor="#10b981" 
                title={language === 'tr' ? 'KYC Doğrulama' : 'KYC Verification'} 
                subtitle={language === 'tr' ? 'Hesabınızı doğrulayın' : 'Verify your identity'}
                onPress={() => router.push('/kyc')}
                isLast 
              />
            </View>
          </>
        )}

        {/* Profile */}
        {isConnected && (
          <>
            <SectionHeader title={t.profile} />
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <SettingRow 
                icon="person-outline" 
                iconColor="#3b82f6" 
                title={t.profile}
                subtitle={language === 'tr' ? 'E-posta ve telefon bilgilerinizi düzenleyin' : 'Edit your email and phone'}
                onPress={() => router.push('/profile')}
                isLast 
              />
            </View>
          </>
        )}

        {/* Security */}
        <SectionHeader title={t.security} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="finger-print-outline" iconColor="#f59e0b" title={t.biometric} subtitle={t.biometricDesc} showChevron={false}
            rightComponent={<Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ false: colors.border, true: '#10b98150' }} thumbColor={biometricEnabled ? '#10b981' : '#fff'} />} />
          <SettingRow icon="notifications-outline" iconColor="#ef4444" title={t.notifications} subtitle={t.notificationsDesc} showChevron={false}
            rightComponent={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: colors.border, true: '#10b98150' }} thumbColor={notificationsEnabled ? '#10b981' : '#fff'} />} isLast />
        </View>

        {/* Support */}
        <SectionHeader title={t.support} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="help-circle-outline" iconColor="#3b82f6" title={t.helpCenter} onPress={() => Linking.openURL('https://auxite.io/help')} />
          <SettingRow icon="mail-outline" iconColor="#10b981" title={t.contactUs} onPress={() => Linking.openURL('mailto:support@auxite.io')} />
          <SettingRow icon="document-text-outline" iconColor="#64748b" title={t.termsOfService} onPress={() => Linking.openURL('https://auxite.io/terms')} />
          <SettingRow icon="shield-checkmark-outline" iconColor="#8b5cf6" title={t.privacyPolicy} onPress={() => Linking.openURL('https://auxite.io/privacy')} isLast />
        </View>

        {/* About */}
        <SectionHeader title={t.about} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="information-circle-outline" iconColor="#64748b" title={t.version} value="1.0.0" showChevron={false} isLast />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Confirm Disconnect Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={36} color={colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.confirmDisconnect}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{t.confirmDisconnectMsg}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.danger }]}
                onPress={confirmDisconnect}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>{t.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.toastText, { color: colors.text }]}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  walletInfo: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  walletAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  walletDetails: { flex: 1 },
  walletStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletLabel: { fontSize: 16, fontWeight: '600' },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  connectedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  connectedText: { fontSize: 10, fontWeight: '600', color: '#10b981' },
  walletBalance: { fontSize: 13, marginTop: 4 },
  disconnectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginBottom: 16, paddingVertical: 12, borderRadius: 10 },
  disconnectText: { fontSize: 14, fontWeight: '600' },
  notConnected: { alignItems: 'center', padding: 24 },
  notConnectedText: { fontSize: 14, marginTop: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  settingValue: { fontSize: 13, marginRight: 6 },
  themeSelector: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  themeOptions: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  themeOptionActive: { backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98140' },
  themeOptionText: { fontSize: 12, fontWeight: '500' },
  languageModal: { position: 'absolute', top: 200, left: 16, right: 16, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 100 },
  languageOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  languageFlag: { fontSize: 20, marginRight: 12 },
  languageName: { flex: 1, fontSize: 15, fontWeight: '500' },
  closeLanguageModal: { alignItems: 'center', padding: 14 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', maxWidth: 320, borderRadius: 20, padding: 24, alignItems: 'center' },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(239, 68, 68, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  modalMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
  // Toast
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  toastText: { fontSize: 14, fontWeight: '600' },
});
