// components/SecurityModal.tsx
// Security Settings Modal - PIN, Biometric, 2FA, Sessions
// 6-Language Support | Dark/Light Mode

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  useColorScheme,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    security: 'Güvenlik',
    securitySettings: 'Güvenlik Ayarları',
    authentication: 'Kimlik Doğrulama',
    changePin: 'PIN Değiştir',
    changePinDesc: '6 haneli güvenlik PIN\'inizi değiştirin',
    changePassword: 'Şifre Değiştir',
    changePasswordDesc: 'Hesap şifrenizi güncelleyin',
    biometric: 'Biyometrik Giriş',
    biometricDesc: 'Face ID veya Touch ID ile giriş yapın',
    twoFactor: 'İki Faktörlü Doğrulama',
    twoFactorDesc: 'Ekstra güvenlik katmanı ekleyin',
    twoFactorEnabled: '2FA Aktif',
    twoFactorDisabled: '2FA Kapalı',
    setupTwoFactor: '2FA Kurulumu',
    sessions: 'Oturumlar',
    activeSessions: 'Aktif Oturumlar',
    activeSessionsDesc: 'Hesabınıza bağlı cihazları yönetin',
    loginActivity: 'Giriş Geçmişi',
    loginActivityDesc: 'Son giriş aktivitelerinizi görüntüleyin',
    securityAlerts: 'Güvenlik Bildirimleri',
    securityAlertsDesc: 'Şüpheli aktivitelerde bildirim alın',
    advanced: 'Gelişmiş',
    autoLock: 'Otomatik Kilitleme',
    autoLockDesc: 'Belirli süre sonra uygulamayı kilitle',
    antiPhishing: 'Anti-Phishing Kodu',
    antiPhishingDesc: 'E-postalarda doğrulama kodu göster',
    whitelistAddresses: 'Adres Beyaz Listesi',
    whitelistDesc: 'Sadece onaylı adreslere transfer',
    currentDevice: 'Bu Cihaz',
    lastActive: 'Son Aktif',
    terminateAll: 'Tüm Oturumları Sonlandır',
    terminate: 'Sonlandır',
    enabled: 'Aktif',
    disabled: 'Kapalı',
    setup: 'Kur',
    change: 'Değiştir',
    view: 'Görüntüle',
    manage: 'Yönet',
    close: 'Kapat',
    save: 'Kaydet',
    enterCurrentPin: 'Mevcut PIN',
    enterNewPin: 'Yeni PIN',
    confirmNewPin: 'Yeni PIN (Tekrar)',
    pinChanged: 'PIN başarıyla değiştirildi',
    pinMismatch: 'PIN\'ler eşleşmiyor',
    // Login Activity
    successful: 'Başarılı',
    failed: 'Başarısız',
    today: 'Bugün',
    yesterday: 'Dün',
  },
  en: {
    security: 'Security',
    securitySettings: 'Security Settings',
    authentication: 'Authentication',
    changePin: 'Change PIN',
    changePinDesc: 'Change your 6-digit security PIN',
    changePassword: 'Change Password',
    changePasswordDesc: 'Update your account password',
    biometric: 'Biometric Login',
    biometricDesc: 'Sign in with Face ID or Touch ID',
    twoFactor: 'Two-Factor Authentication',
    twoFactorDesc: 'Add an extra layer of security',
    twoFactorEnabled: '2FA Enabled',
    twoFactorDisabled: '2FA Disabled',
    setupTwoFactor: '2FA Setup',
    sessions: 'Sessions',
    activeSessions: 'Active Sessions',
    activeSessionsDesc: 'Manage devices connected to your account',
    loginActivity: 'Login Activity',
    loginActivityDesc: 'View your recent login history',
    securityAlerts: 'Security Alerts',
    securityAlertsDesc: 'Get notified of suspicious activity',
    advanced: 'Advanced',
    autoLock: 'Auto-Lock',
    autoLockDesc: 'Lock app after period of inactivity',
    antiPhishing: 'Anti-Phishing Code',
    antiPhishingDesc: 'Show verification code in emails',
    whitelistAddresses: 'Address Whitelist',
    whitelistDesc: 'Only transfer to approved addresses',
    currentDevice: 'Current Device',
    lastActive: 'Last Active',
    terminateAll: 'Terminate All Sessions',
    terminate: 'Terminate',
    enabled: 'Enabled',
    disabled: 'Disabled',
    setup: 'Setup',
    change: 'Change',
    view: 'View',
    manage: 'Manage',
    close: 'Close',
    save: 'Save',
    enterCurrentPin: 'Current PIN',
    enterNewPin: 'New PIN',
    confirmNewPin: 'Confirm New PIN',
    pinChanged: 'PIN changed successfully',
    pinMismatch: 'PINs do not match',
    // Login Activity
    successful: 'Successful',
    failed: 'Failed',
    today: 'Today',
    yesterday: 'Yesterday',
  },
  de: {
    security: 'Sicherheit',
    securitySettings: 'Sicherheitseinstellungen',
    authentication: 'Authentifizierung',
    changePin: 'PIN ändern',
    changePinDesc: 'Ändern Sie Ihre 6-stellige Sicherheits-PIN',
    changePassword: 'Passwort ändern',
    changePasswordDesc: 'Aktualisieren Sie Ihr Kontopasswort',
    biometric: 'Biometrische Anmeldung',
    biometricDesc: 'Mit Face ID oder Touch ID anmelden',
    twoFactor: 'Zwei-Faktor-Authentifizierung',
    twoFactorDesc: 'Fügen Sie eine zusätzliche Sicherheitsebene hinzu',
    twoFactorEnabled: '2FA Aktiviert',
    twoFactorDisabled: '2FA Deaktiviert',
    setupTwoFactor: '2FA Einrichtung',
    sessions: 'Sitzungen',
    activeSessions: 'Aktive Sitzungen',
    activeSessionsDesc: 'Verwalten Sie verbundene Geräte',
    loginActivity: 'Anmeldeaktivität',
    loginActivityDesc: 'Zeigen Sie Ihren Anmeldeverlauf an',
    securityAlerts: 'Sicherheitswarnungen',
    securityAlertsDesc: 'Bei verdächtiger Aktivität benachrichtigen',
    advanced: 'Erweitert',
    autoLock: 'Auto-Sperre',
    autoLockDesc: 'App nach Inaktivität sperren',
    antiPhishing: 'Anti-Phishing-Code',
    antiPhishingDesc: 'Bestätigungscode in E-Mails anzeigen',
    whitelistAddresses: 'Adress-Whitelist',
    whitelistDesc: 'Nur an genehmigte Adressen übertragen',
    currentDevice: 'Aktuelles Gerät',
    lastActive: 'Zuletzt aktiv',
    terminateAll: 'Alle Sitzungen beenden',
    terminate: 'Beenden',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    setup: 'Einrichten',
    change: 'Ändern',
    view: 'Anzeigen',
    manage: 'Verwalten',
    close: 'Schließen',
    save: 'Speichern',
    enterCurrentPin: 'Aktuelle PIN',
    enterNewPin: 'Neue PIN',
    confirmNewPin: 'Neue PIN bestätigen',
    pinChanged: 'PIN erfolgreich geändert',
    pinMismatch: 'PINs stimmen nicht überein',
    successful: 'Erfolgreich',
    failed: 'Fehlgeschlagen',
    today: 'Heute',
    yesterday: 'Gestern',
  },
  fr: {
    security: 'Sécurité',
    securitySettings: 'Paramètres de sécurité',
    authentication: 'Authentification',
    changePin: 'Changer le PIN',
    changePinDesc: 'Changez votre PIN de sécurité à 6 chiffres',
    changePassword: 'Changer le mot de passe',
    changePasswordDesc: 'Mettez à jour votre mot de passe',
    biometric: 'Connexion biométrique',
    biometricDesc: 'Connectez-vous avec Face ID ou Touch ID',
    twoFactor: 'Authentification à deux facteurs',
    twoFactorDesc: 'Ajoutez une couche de sécurité supplémentaire',
    twoFactorEnabled: '2FA Activé',
    twoFactorDisabled: '2FA Désactivé',
    setupTwoFactor: 'Configuration 2FA',
    sessions: 'Sessions',
    activeSessions: 'Sessions actives',
    activeSessionsDesc: 'Gérez les appareils connectés',
    loginActivity: 'Activité de connexion',
    loginActivityDesc: 'Consultez votre historique de connexion',
    securityAlerts: 'Alertes de sécurité',
    securityAlertsDesc: 'Soyez notifié des activités suspectes',
    advanced: 'Avancé',
    autoLock: 'Verrouillage automatique',
    autoLockDesc: 'Verrouiller l\'app après inactivité',
    antiPhishing: 'Code anti-phishing',
    antiPhishingDesc: 'Afficher le code de vérification dans les e-mails',
    whitelistAddresses: 'Liste blanche d\'adresses',
    whitelistDesc: 'Transférer uniquement vers des adresses approuvées',
    currentDevice: 'Appareil actuel',
    lastActive: 'Dernière activité',
    terminateAll: 'Terminer toutes les sessions',
    terminate: 'Terminer',
    enabled: 'Activé',
    disabled: 'Désactivé',
    setup: 'Configurer',
    change: 'Changer',
    view: 'Voir',
    manage: 'Gérer',
    close: 'Fermer',
    save: 'Enregistrer',
    enterCurrentPin: 'PIN actuel',
    enterNewPin: 'Nouveau PIN',
    confirmNewPin: 'Confirmer le nouveau PIN',
    pinChanged: 'PIN modifié avec succès',
    pinMismatch: 'Les PINs ne correspondent pas',
    successful: 'Réussi',
    failed: 'Échoué',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
  },
  ar: {
    security: 'الأمان',
    securitySettings: 'إعدادات الأمان',
    authentication: 'المصادقة',
    changePin: 'تغيير PIN',
    changePinDesc: 'غير رقم PIN المكون من 6 أرقام',
    changePassword: 'تغيير كلمة المرور',
    changePasswordDesc: 'تحديث كلمة مرور حسابك',
    biometric: 'تسجيل الدخول البيومتري',
    biometricDesc: 'تسجيل الدخول باستخدام Face ID أو Touch ID',
    twoFactor: 'المصادقة الثنائية',
    twoFactorDesc: 'أضف طبقة أمان إضافية',
    twoFactorEnabled: '2FA مفعل',
    twoFactorDisabled: '2FA معطل',
    setupTwoFactor: 'إعداد 2FA',
    sessions: 'الجلسات',
    activeSessions: 'الجلسات النشطة',
    activeSessionsDesc: 'إدارة الأجهزة المتصلة بحسابك',
    loginActivity: 'نشاط تسجيل الدخول',
    loginActivityDesc: 'عرض سجل تسجيل الدخول الأخير',
    securityAlerts: 'تنبيهات الأمان',
    securityAlertsDesc: 'الحصول على إشعارات بالنشاط المشبوه',
    advanced: 'متقدم',
    autoLock: 'القفل التلقائي',
    autoLockDesc: 'قفل التطبيق بعد فترة من عدم النشاط',
    antiPhishing: 'كود مكافحة التصيد',
    antiPhishingDesc: 'عرض رمز التحقق في رسائل البريد الإلكتروني',
    whitelistAddresses: 'القائمة البيضاء للعناوين',
    whitelistDesc: 'التحويل فقط إلى العناوين المعتمدة',
    currentDevice: 'الجهاز الحالي',
    lastActive: 'آخر نشاط',
    terminateAll: 'إنهاء جميع الجلسات',
    terminate: 'إنهاء',
    enabled: 'مفعل',
    disabled: 'معطل',
    setup: 'إعداد',
    change: 'تغيير',
    view: 'عرض',
    manage: 'إدارة',
    close: 'إغلاق',
    save: 'حفظ',
    enterCurrentPin: 'PIN الحالي',
    enterNewPin: 'PIN الجديد',
    confirmNewPin: 'تأكيد PIN الجديد',
    pinChanged: 'تم تغيير PIN بنجاح',
    pinMismatch: 'أرقام PIN غير متطابقة',
    successful: 'ناجح',
    failed: 'فاشل',
    today: 'اليوم',
    yesterday: 'أمس',
  },
  ru: {
    security: 'Безопасность',
    securitySettings: 'Настройки безопасности',
    authentication: 'Аутентификация',
    changePin: 'Изменить PIN',
    changePinDesc: 'Измените ваш 6-значный PIN-код',
    changePassword: 'Изменить пароль',
    changePasswordDesc: 'Обновите пароль аккаунта',
    biometric: 'Биометрический вход',
    biometricDesc: 'Войдите с помощью Face ID или Touch ID',
    twoFactor: 'Двухфакторная аутентификация',
    twoFactorDesc: 'Добавьте дополнительный уровень безопасности',
    twoFactorEnabled: '2FA Включена',
    twoFactorDisabled: '2FA Выключена',
    setupTwoFactor: 'Настройка 2FA',
    sessions: 'Сессии',
    activeSessions: 'Активные сессии',
    activeSessionsDesc: 'Управляйте подключенными устройствами',
    loginActivity: 'История входов',
    loginActivityDesc: 'Просмотрите историю входов',
    securityAlerts: 'Уведомления безопасности',
    securityAlertsDesc: 'Получайте уведомления о подозрительной активности',
    advanced: 'Расширенные',
    autoLock: 'Автоблокировка',
    autoLockDesc: 'Блокировать приложение после неактивности',
    antiPhishing: 'Антифишинговый код',
    antiPhishingDesc: 'Показывать код подтверждения в письмах',
    whitelistAddresses: 'Белый список адресов',
    whitelistDesc: 'Переводить только на одобренные адреса',
    currentDevice: 'Текущее устройство',
    lastActive: 'Последняя активность',
    terminateAll: 'Завершить все сессии',
    terminate: 'Завершить',
    enabled: 'Включено',
    disabled: 'Выключено',
    setup: 'Настроить',
    change: 'Изменить',
    view: 'Просмотр',
    manage: 'Управление',
    close: 'Закрыть',
    save: 'Сохранить',
    enterCurrentPin: 'Текущий PIN',
    enterNewPin: 'Новый PIN',
    confirmNewPin: 'Подтвердите новый PIN',
    pinChanged: 'PIN успешно изменен',
    pinMismatch: 'PIN-коды не совпадают',
    successful: 'Успешно',
    failed: 'Неудачно',
    today: 'Сегодня',
    yesterday: 'Вчера',
  },
};

// ============================================
// MOCK DATA
// ============================================
const mockSessions = [
  { id: 1, device: 'iPhone 15 Pro', location: 'Istanbul, Turkey', lastActive: 'Now', isCurrent: true, icon: 'phone-portrait' },
  { id: 2, device: 'MacBook Pro', location: 'Istanbul, Turkey', lastActive: '2h ago', isCurrent: false, icon: 'laptop' },
  { id: 3, device: 'Chrome - Windows', location: 'Ankara, Turkey', lastActive: '1d ago', isCurrent: false, icon: 'desktop' },
];

const mockLoginActivity = [
  { id: 1, device: 'iPhone 15 Pro', location: 'Istanbul, Turkey', time: '10:30 AM', date: 'today', success: true, ip: '192.168.1.***' },
  { id: 2, device: 'Chrome - Windows', location: 'Istanbul, Turkey', time: '09:15 AM', date: 'today', success: true, ip: '192.168.1.***' },
  { id: 3, device: 'Unknown Device', location: 'Moscow, Russia', time: '03:22 AM', date: 'today', success: false, ip: '45.67.89.***' },
  { id: 4, device: 'iPhone 15 Pro', location: 'Istanbul, Turkey', time: '08:45 PM', date: 'yesterday', success: true, ip: '192.168.1.***' },
  { id: 5, device: 'Safari - iPad', location: 'Izmir, Turkey', time: '02:30 PM', date: 'yesterday', success: true, ip: '176.234.***' },
];

// ============================================
// MAIN COMPONENT
// ============================================
interface SecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityModal({ visible, onClose }: SecurityModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { language, theme } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  // States
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [antiPhishing, setAntiPhishing] = useState(false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);

  // Sub-modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // PIN change states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  
  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };
  
  // Confirm modal helper
  const showConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const colors = {
    primary: '#10b981',
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    cardBg: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    danger: '#ef4444',
    warning: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
  };

  const handlePinChange = () => {
    if (newPin !== confirmPin) {
      showToast(t.pinMismatch, 'error');
      return;
    }
    if (newPin.length !== 6) {
      showToast('PIN must be 6 digits', 'error');
      return;
    }
    showToast(t.pinChanged, 'success');
    setShowPinModal(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleTerminateSession = (sessionId: number) => {
    showConfirm(
      t.terminate,
      'Are you sure you want to terminate this session?',
      () => {
        console.log('Terminated:', sessionId);
        setShowConfirmModal(false);
      }
    );
  };

  const handleTerminateAll = () => {
    showConfirm(
      t.terminateAll,
      'This will log you out from all other devices.',
      () => {
        console.log('All terminated');
        setShowConfirmModal(false);
      }
    );
  };

  const SecurityItem = ({ 
    icon, 
    iconColor, 
    title, 
    description, 
    rightComponent,
    onPress,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.securityItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.securityIconBg, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.securityItemContent}>
        <Text style={[styles.securityItemTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.securityItemDesc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {rightComponent || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.border} />)}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.securitySettings}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Authentication Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.authentication}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SecurityItem
              icon="keypad"
              iconColor={colors.primary}
              title={t.changePin}
              description={t.changePinDesc}
              onPress={() => setShowPinModal(true)}
            />
            <SecurityItem
              icon="finger-print"
              iconColor={colors.purple}
              title={t.biometric}
              description={t.biometricDesc}
              rightComponent={
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={biometricEnabled ? colors.primary : '#fff'}
                />
              }
            />
            <SecurityItem
              icon="shield-checkmark"
              iconColor={colors.blue}
              title={t.twoFactor}
              description={twoFactorEnabled ? t.twoFactorEnabled : t.twoFactorDisabled}
              rightComponent={
                <TouchableOpacity 
                  style={[styles.setupButton, { backgroundColor: twoFactorEnabled ? colors.primary + '20' : colors.blue + '20' }]}
                  onPress={() => setShow2FAModal(true)}
                >
                  <Text style={[styles.setupButtonText, { color: twoFactorEnabled ? colors.primary : colors.blue }]}>
                    {twoFactorEnabled ? t.change : t.setup}
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>

          {/* Sessions Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.sessions}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SecurityItem
              icon="phone-portrait"
              iconColor={colors.warning}
              title={t.activeSessions}
              description={t.activeSessionsDesc}
              onPress={() => setShowSessionsModal(true)}
            />
            <SecurityItem
              icon="time"
              iconColor={colors.purple}
              title={t.loginActivity}
              description={t.loginActivityDesc}
              onPress={() => setShowActivityModal(true)}
            />
            <SecurityItem
              icon="notifications"
              iconColor={colors.danger}
              title={t.securityAlerts}
              description={t.securityAlertsDesc}
              rightComponent={
                <Switch
                  value={securityAlerts}
                  onValueChange={setSecurityAlerts}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={securityAlerts ? colors.primary : '#fff'}
                />
              }
            />
          </View>

          {/* Advanced Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.advanced}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SecurityItem
              icon="lock-closed"
              iconColor={colors.primary}
              title={t.autoLock}
              description={t.autoLockDesc}
              rightComponent={
                <Switch
                  value={autoLock}
                  onValueChange={setAutoLock}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={autoLock ? colors.primary : '#fff'}
                />
              }
            />
            <SecurityItem
              icon="mail"
              iconColor={colors.blue}
              title={t.antiPhishing}
              description={t.antiPhishingDesc}
              rightComponent={
                <Switch
                  value={antiPhishing}
                  onValueChange={setAntiPhishing}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={antiPhishing ? colors.primary : '#fff'}
                />
              }
            />
            <SecurityItem
              icon="list"
              iconColor={colors.warning}
              title={t.whitelistAddresses}
              description={t.whitelistDesc}
              rightComponent={
                <Switch
                  value={whitelistEnabled}
                  onValueChange={setWhitelistEnabled}
                  trackColor={{ false: colors.border, true: colors.primary + '50' }}
                  thumbColor={whitelistEnabled ? colors.primary : '#fff'}
                />
              }
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PIN CHANGE MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showPinModal} animationType="fade" transparent onRequestClose={() => setShowPinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pinModalTitle, { color: colors.text }]}>{t.changePin}</Text>
            
            <View style={styles.pinInputGroup}>
              <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>{t.enterCurrentPin}</Text>
              <TextInput
                style={[styles.pinInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                value={currentPin}
                onChangeText={setCurrentPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                placeholder="• • • • • •"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.pinInputGroup}>
              <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>{t.enterNewPin}</Text>
              <TextInput
                style={[styles.pinInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                placeholder="• • • • • •"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.pinInputGroup}>
              <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>{t.confirmNewPin}</Text>
              <TextInput
                style={[styles.pinInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                placeholder="• • • • • •"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.pinModalButtons}>
              <TouchableOpacity 
                style={[styles.pinButton, { backgroundColor: colors.cardBg }]} 
                onPress={() => setShowPinModal(false)}
              >
                <Text style={[styles.pinButtonText, { color: colors.textSecondary }]}>{t.close}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pinButton, { backgroundColor: colors.primary }]} 
                onPress={handlePinChange}
              >
                <Text style={[styles.pinButtonText, { color: '#fff' }]}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ACTIVE SESSIONS MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showSessionsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSessionsModal(false)}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.activeSessions}</Text>
            <TouchableOpacity onPress={() => setShowSessionsModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {mockSessions.map((session) => (
              <View key={session.id} style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: session.isCurrent ? colors.primary : colors.border }]}>
                <View style={[styles.sessionIcon, { backgroundColor: session.isCurrent ? colors.primary + '20' : colors.cardBg }]}>
                  <Ionicons name={session.icon as any} size={24} color={session.isCurrent ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionHeader}>
                    <Text style={[styles.sessionDevice, { color: colors.text }]}>{session.device}</Text>
                    {session.isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.currentBadgeText}>{t.currentDevice}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.sessionLocation, { color: colors.textSecondary }]}>
                    <Ionicons name="location" size={12} color={colors.textSecondary} /> {session.location}
                  </Text>
                  <Text style={[styles.sessionTime, { color: colors.textSecondary }]}>
                    {t.lastActive}: {session.lastActive}
                  </Text>
                </View>
                {!session.isCurrent && (
                  <TouchableOpacity 
                    style={[styles.terminateButton, { backgroundColor: colors.danger + '15' }]}
                    onPress={() => handleTerminateSession(session.id)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.terminateAllButton, { backgroundColor: colors.danger + '15' }]}
              onPress={handleTerminateAll}
            >
              <Ionicons name="log-out" size={20} color={colors.danger} />
              <Text style={[styles.terminateAllText, { color: colors.danger }]}>{t.terminateAll}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LOGIN ACTIVITY MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showActivityModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowActivityModal(false)}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.loginActivity}</Text>
            <TouchableOpacity onPress={() => setShowActivityModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {mockLoginActivity.map((activity, index) => {
              const isNewDate = index === 0 || mockLoginActivity[index - 1].date !== activity.date;
              return (
                <React.Fragment key={activity.id}>
                  {isNewDate && (
                    <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
                      {activity.date === 'today' ? t.today : t.yesterday}
                    </Text>
                  )}
                  <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[
                      styles.activityStatus, 
                      { backgroundColor: activity.success ? colors.primary + '20' : colors.danger + '20' }
                    ]}>
                      <Ionicons 
                        name={activity.success ? 'checkmark-circle' : 'close-circle'} 
                        size={20} 
                        color={activity.success ? colors.primary : colors.danger} 
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityDevice, { color: colors.text }]}>{activity.device}</Text>
                      <Text style={[styles.activityLocation, { color: colors.textSecondary }]}>
                        <Ionicons name="location" size={12} /> {activity.location}
                      </Text>
                      <Text style={[styles.activityIp, { color: colors.textSecondary }]}>IP: {activity.ip}</Text>
                    </View>
                    <View style={styles.activityRight}>
                      <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
                      <Text style={[
                        styles.activityResult, 
                        { color: activity.success ? colors.primary : colors.danger }
                      ]}>
                        {activity.success ? t.successful : t.failed}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          2FA SETUP MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal visible={show2FAModal} animationType="fade" transparent onRequestClose={() => setShow2FAModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.twoFAModal, { backgroundColor: colors.surface }]}>
            <View style={[styles.twoFAIcon, { backgroundColor: colors.blue + '20' }]}>
              <Ionicons name="shield-checkmark" size={40} color={colors.blue} />
            </View>
            <Text style={[styles.twoFATitle, { color: colors.text }]}>{t.setupTwoFactor}</Text>
            <Text style={[styles.twoFADesc, { color: colors.textSecondary }]}>{t.twoFactorDesc}</Text>

            <View style={styles.twoFAOptions}>
              <TouchableOpacity 
                style={[styles.twoFAOption, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => {
                  setTwoFactorEnabled(true);
                  setShow2FAModal(false);
                }}
              >
                <Ionicons name="phone-portrait" size={24} color={colors.primary} />
                <Text style={[styles.twoFAOptionText, { color: colors.text }]}>Authenticator App</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.twoFAOption, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => {
                  setTwoFactorEnabled(true);
                  setShow2FAModal(false);
                }}
              >
                <Ionicons name="chatbubble" size={24} color={colors.blue} />
                <Text style={[styles.twoFAOptionText, { color: colors.text }]}>SMS</Text>
              </TouchableOpacity>
            </View>

            {twoFactorEnabled && (
              <TouchableOpacity 
                style={[styles.disable2FAButton, { backgroundColor: colors.danger + '15' }]}
                onPress={() => {
                  setTwoFactorEnabled(false);
                  setShow2FAModal(false);
                }}
              >
                <Text style={[styles.disable2FAText, { color: colors.danger }]}>Disable 2FA</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.closeModalButton, { backgroundColor: colors.cardBg }]}
              onPress={() => setShow2FAModal(false)}
            >
              <Text style={[styles.closeModalText, { color: colors.textSecondary }]}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContent, { backgroundColor: colors.surface }]}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="warning" size={32} color={colors.danger} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>{confirmTitle}</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{confirmMessage}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.border }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>{t.close}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.danger }]}
                onPress={confirmAction}
              >
                <Text style={[styles.confirmButtonText, { color: '#fff' }]}>{t.terminate}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Toast */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast, 
            { 
              opacity: toastOpacity, 
              backgroundColor: colors.surface,
              borderColor: toastType === 'success' ? colors.primary : colors.danger,
            }
          ]}
        >
          <Ionicons 
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color={toastType === 'success' ? colors.primary : colors.danger} 
          />
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
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  securityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityItemContent: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  securityItemDesc: {
    fontSize: 12,
  },
  setupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setupButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModal: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 16,
    padding: 24,
  },
  pinModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInputGroup: {
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pinButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Sessions
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sessionLocation: {
    fontSize: 12,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 11,
  },
  terminateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  terminateAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Activity
  dateHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  activityStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityDevice: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 11,
    marginBottom: 2,
  },
  activityIp: {
    fontSize: 10,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 11,
    marginBottom: 4,
  },
  activityResult: {
    fontSize: 10,
    fontWeight: '600',
  },
  // 2FA Modal
  twoFAModal: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  twoFAIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  twoFATitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  twoFADesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  twoFAOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  twoFAOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  twoFAOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  disable2FAButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  disable2FAText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Toast
  toast: { 
    position: 'absolute', 
    bottom: 100, 
    alignSelf: 'center', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
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
  toastText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  // Confirm Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
