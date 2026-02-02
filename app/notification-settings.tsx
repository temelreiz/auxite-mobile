// app/notification-settings.tsx
// Notification Settings Screen
// 6-Language Support | Dark/Light Mode | Push & Email Preferences

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// expo-notifications is optional - requires development build (not Expo Go)
// In Expo Go SDK 53+, push notifications are not supported
const Notifications: any = null;
const PUSH_AVAILABLE = false; // Set to true when using development build with expo-notifications

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Bildirim Ayarları',
    subtitle: 'Push ve email bildirimlerini yönetin',
    requiresDevBuild: 'Push bildirimleri için development build gerekli',
    requiresDevBuildDesc: 'Expo Go\'da push bildirimleri desteklenmiyor',
    pushNotifications: 'Push Bildirimleri',
    enablePush: 'Bildirimleri Aktifleştir',
    disablePush: 'Bildirimleri Kapat',
    enabled: 'Açık',
    disabled: 'Kapalı',
    notSupported: 'Cihazınız bildirimleri desteklemiyor',
    permissionDenied: 'Bildirim izni verilmedi',
    openSettings: 'Ayarları Aç',
    categories: 'Bildirim Kategorileri',
    transactions: 'İşlem Bildirimleri',
    transactionsDesc: 'Yatırma, çekme ve transfer bildirimleri',
    priceAlerts: 'Fiyat Uyarıları',
    priceAlertsDesc: 'Belirlediğiniz fiyat hedeflerine ulaşıldığında',
    security: 'Güvenlik Bildirimleri',
    securityDesc: 'Yeni giriş, cihaz ve güvenlik uyarıları',
    marketing: 'Promosyon Bildirimleri',
    marketingDesc: 'Kampanya ve fırsat bildirimleri',
    testNotification: 'Test Bildirimi Gönder',
    testSent: 'Test bildirimi gönderildi!',
    emailNotifications: 'Email Bildirimleri',
    emailDesc: 'Önemli güncellemeler için email alın',
    deposits: 'Yatırım Bildirimleri',
    depositsDesc: 'Yatırımlarınız onaylandığında',
    withdrawals: 'Çekim Bildirimleri',
    withdrawalsDesc: 'Çekimleriniz tamamlandığında',
    staking: 'Stake Bildirimleri',
    stakingDesc: 'Stake süreleri ve ödülleri hakkında',
    saving: 'Kaydediliyor...',
    saved: 'Kaydedildi',
    error: 'Hata',
    back: 'Geri',
  },
  en: {
    title: 'Notification Settings',
    subtitle: 'Manage push and email notifications',
    requiresDevBuild: 'Push notifications require development build',
    requiresDevBuildDesc: 'Not supported in Expo Go',
    pushNotifications: 'Push Notifications',
    enablePush: 'Enable Notifications',
    disablePush: 'Disable Notifications',
    enabled: 'On',
    disabled: 'Off',
    notSupported: 'Your device doesn\'t support notifications',
    permissionDenied: 'Notification permission denied',
    openSettings: 'Open Settings',
    categories: 'Notification Categories',
    transactions: 'Transaction Notifications',
    transactionsDesc: 'Deposit, withdrawal and transfer notifications',
    priceAlerts: 'Price Alerts',
    priceAlertsDesc: 'When your price targets are reached',
    security: 'Security Notifications',
    securityDesc: 'New login, device and security alerts',
    marketing: 'Promotional Notifications',
    marketingDesc: 'Campaign and offer notifications',
    testNotification: 'Send Test Notification',
    testSent: 'Test notification sent!',
    emailNotifications: 'Email Notifications',
    emailDesc: 'Receive emails for important updates',
    deposits: 'Deposit Notifications',
    depositsDesc: 'When your deposits are confirmed',
    withdrawals: 'Withdrawal Notifications',
    withdrawalsDesc: 'When your withdrawals are completed',
    staking: 'Staking Notifications',
    stakingDesc: 'About staking periods and rewards',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error',
    back: 'Back',
  },
  de: {
    title: 'Benachrichtigungseinstellungen',
    subtitle: 'Push- und E-Mail-Benachrichtigungen verwalten',
    requiresDevBuild: 'Push-Benachrichtigungen erfordern Development Build',
    requiresDevBuildDesc: 'Nicht unterstützt in Expo Go',
    pushNotifications: 'Push-Benachrichtigungen',
    enablePush: 'Benachrichtigungen aktivieren',
    disablePush: 'Benachrichtigungen deaktivieren',
    enabled: 'An',
    disabled: 'Aus',
    notSupported: 'Ihr Gerät unterstützt keine Benachrichtigungen',
    permissionDenied: 'Benachrichtigungsberechtigung verweigert',
    openSettings: 'Einstellungen öffnen',
    categories: 'Benachrichtigungskategorien',
    transactions: 'Transaktionsbenachrichtigungen',
    transactionsDesc: 'Einzahlungs-, Auszahlungs- und Transferbenachrichtigungen',
    priceAlerts: 'Preisalarme',
    priceAlertsDesc: 'Wenn Ihre Preisziele erreicht werden',
    security: 'Sicherheitsbenachrichtigungen',
    securityDesc: 'Neue Anmeldungen, Geräte und Sicherheitswarnungen',
    marketing: 'Werbebenachrichtigungen',
    marketingDesc: 'Kampagnen- und Angebotsbenachrichtigungen',
    testNotification: 'Testbenachrichtigung senden',
    testSent: 'Testbenachrichtigung gesendet!',
    emailNotifications: 'E-Mail-Benachrichtigungen',
    emailDesc: 'E-Mails für wichtige Updates erhalten',
    deposits: 'Einzahlungsbenachrichtigungen',
    depositsDesc: 'Wenn Ihre Einzahlungen bestätigt werden',
    withdrawals: 'Auszahlungsbenachrichtigungen',
    withdrawalsDesc: 'Wenn Ihre Auszahlungen abgeschlossen sind',
    staking: 'Staking-Benachrichtigungen',
    stakingDesc: 'Über Staking-Zeiträume und Belohnungen',
    saving: 'Speichern...',
    saved: 'Gespeichert',
    error: 'Fehler',
    back: 'Zurück',
  },
  fr: {
    title: 'Paramètres de Notification',
    subtitle: 'Gérer les notifications push et email',
    requiresDevBuild: 'Les notifications push nécessitent un build de développement',
    requiresDevBuildDesc: 'Non supporté dans Expo Go',
    pushNotifications: 'Notifications Push',
    enablePush: 'Activer les notifications',
    disablePush: 'Désactiver les notifications',
    enabled: 'Activé',
    disabled: 'Désactivé',
    notSupported: 'Votre appareil ne supporte pas les notifications',
    permissionDenied: 'Permission de notification refusée',
    openSettings: 'Ouvrir les paramètres',
    categories: 'Catégories de Notifications',
    transactions: 'Notifications de Transactions',
    transactionsDesc: 'Notifications de dépôt, retrait et transfert',
    priceAlerts: 'Alertes de Prix',
    priceAlertsDesc: 'Lorsque vos objectifs de prix sont atteints',
    security: 'Notifications de Sécurité',
    securityDesc: 'Nouvelles connexions, appareils et alertes de sécurité',
    marketing: 'Notifications Promotionnelles',
    marketingDesc: 'Notifications de campagnes et offres',
    testNotification: 'Envoyer une notification test',
    testSent: 'Notification test envoyée!',
    emailNotifications: 'Notifications Email',
    emailDesc: 'Recevoir des emails pour les mises à jour importantes',
    deposits: 'Notifications de Dépôts',
    depositsDesc: 'Lorsque vos dépôts sont confirmés',
    withdrawals: 'Notifications de Retraits',
    withdrawalsDesc: 'Lorsque vos retraits sont terminés',
    staking: 'Notifications de Staking',
    stakingDesc: 'À propos des périodes et récompenses de staking',
    saving: 'Enregistrement...',
    saved: 'Enregistré',
    error: 'Erreur',
    back: 'Retour',
  },
  ar: {
    title: 'إعدادات الإشعارات',
    subtitle: 'إدارة إشعارات الدفع والبريد الإلكتروني',
    pushNotifications: 'إشعارات الدفع',
    enablePush: 'تفعيل الإشعارات',
    disablePush: 'إيقاف الإشعارات',
    enabled: 'مفعّل',
    disabled: 'متوقف',
    notSupported: 'جهازك لا يدعم الإشعارات',
    permissionDenied: 'تم رفض إذن الإشعارات',
    openSettings: 'فتح الإعدادات',
    categories: 'فئات الإشعارات',
    transactions: 'إشعارات المعاملات',
    transactionsDesc: 'إشعارات الإيداع والسحب والتحويل',
    priceAlerts: 'تنبيهات الأسعار',
    priceAlertsDesc: 'عند الوصول إلى أهداف الأسعار',
    security: 'إشعارات الأمان',
    securityDesc: 'تسجيلات الدخول والأجهزة الجديدة وتنبيهات الأمان',
    marketing: 'إشعارات ترويجية',
    marketingDesc: 'إشعارات الحملات والعروض',
    testNotification: 'إرسال إشعار تجريبي',
    testSent: 'تم إرسال الإشعار التجريبي!',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    emailDesc: 'استلام رسائل البريد للتحديثات المهمة',
    deposits: 'إشعارات الإيداع',
    depositsDesc: 'عند تأكيد إيداعاتك',
    withdrawals: 'إشعارات السحب',
    withdrawalsDesc: 'عند اكتمال عمليات السحب',
    staking: 'إشعارات التخزين',
    stakingDesc: 'حول فترات ومكافآت التخزين',
    saving: 'جارٍ الحفظ...',
    saved: 'تم الحفظ',
    error: 'خطأ',
    back: 'رجوع',
  },
  ru: {
    title: 'Настройки Уведомлений',
    subtitle: 'Управление push и email уведомлениями',
    pushNotifications: 'Push-уведомления',
    enablePush: 'Включить уведомления',
    disablePush: 'Отключить уведомления',
    enabled: 'Включено',
    disabled: 'Отключено',
    notSupported: 'Ваше устройство не поддерживает уведомления',
    permissionDenied: 'Разрешение на уведомления отклонено',
    openSettings: 'Открыть настройки',
    categories: 'Категории Уведомлений',
    transactions: 'Уведомления о Транзакциях',
    transactionsDesc: 'Уведомления о депозитах, выводах и переводах',
    priceAlerts: 'Ценовые Оповещения',
    priceAlertsDesc: 'Когда достигнуты ваши ценовые цели',
    security: 'Уведомления Безопасности',
    securityDesc: 'Новые входы, устройства и предупреждения безопасности',
    marketing: 'Рекламные Уведомления',
    marketingDesc: 'Уведомления о кампаниях и предложениях',
    testNotification: 'Отправить тестовое уведомление',
    testSent: 'Тестовое уведомление отправлено!',
    emailNotifications: 'Email Уведомления',
    emailDesc: 'Получать email для важных обновлений',
    deposits: 'Уведомления о Депозитах',
    depositsDesc: 'Когда ваши депозиты подтверждены',
    withdrawals: 'Уведомления о Выводах',
    withdrawalsDesc: 'Когда ваши выводы завершены',
    staking: 'Уведомления о Стейкинге',
    stakingDesc: 'О периодах и наградах стейкинга',
    saving: 'Сохранение...',
    saved: 'Сохранено',
    error: 'Ошибка',
    back: 'Назад',
  },
};

// ============================================
// TYPES
// ============================================
interface NotificationPreferences {
  enabled: boolean;
  transactions: boolean;
  priceAlerts: boolean;
  security: boolean;
  marketing: boolean;
  deposits?: boolean;
  withdrawals?: boolean;
  staking?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress: storeWalletAddress } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;
  const isRTL = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(storeWalletAddress);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    transactions: true,
    priceAlerts: true,
    security: true,
    marketing: false,
  });
  const [testSent, setTestSent] = useState(false);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#10B981',
    danger: '#EF4444',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    loadData();
  }, [storeWalletAddress]);

  const loadData = async () => {
    try {
      let address = storeWalletAddress;
      if (!address) {
        address = await AsyncStorage.getItem('auxite_wallet_address');
      }
      setWalletAddress(address);

      // Check push permission
      if (Notifications) {
        const { status } = await Notifications.getPermissionsAsync();
        setPushPermission(status);
        setPushEnabled(status === 'granted');
      }

      // Load preferences from API
      if (address) {
        const res = await fetch(`${API_URL}/api/notifications/subscribe`, {
          headers: { 'x-wallet-address': address },
        });
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
        setPushEnabled(data.isSubscribed || false);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePush = async () => {
    if (!Notifications) {
      Alert.alert(t.error, t.notSupported);
      return;
    }

    try {
      if (!pushEnabled) {
        // Request permission
        const { status } = await Notifications.requestPermissionsAsync();
        setPushPermission(status);

        if (status !== 'granted') {
          Alert.alert(t.permissionDenied, '', [
            { text: t.openSettings, onPress: () => Linking.openSettings() },
            { text: 'OK' },
          ]);
          return;
        }

        // Get push token and subscribe
        const token = await Notifications.getExpoPushTokenAsync();
        
        if (walletAddress) {
          await fetch(`${API_URL}/api/notifications/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-wallet-address': walletAddress,
            },
            body: JSON.stringify({
              endpoint: token.data,
              keys: { token: token.data },
            }),
          });
        }

        setPushEnabled(true);
      } else {
        // Unsubscribe
        if (walletAddress) {
          await fetch(`${API_URL}/api/notifications/subscribe`, {
            method: 'DELETE',
            headers: { 'x-wallet-address': walletAddress },
          });
        }
        setPushEnabled(false);
      }
    } catch (err) {
      console.error('Toggle push error:', err);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!walletAddress) return;

    setSaving(true);
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error('Update preference error:', err);
      setPreferences(preferences); // Revert
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    if (!walletAddress) return;

    try {
      await fetch(`${API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (err) {
      console.error('Test notification error:', err);
    }
  };

  const renderToggleRow = (
    icon: string,
    title: string,
    description: string,
    value: boolean,
    onToggle: (v: boolean) => void,
    disabled?: boolean
  ) => (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleIcon}>{icon}</Text>
        <View style={styles.toggleTextContainer}>
          <Text style={[styles.toggleTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled || saving}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary + '60' }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.surfaceAlt}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Master Toggle */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="notifications" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t.pushNotifications}</Text>
              <Text style={[styles.cardStatus, { color: pushEnabled ? colors.primary : colors.textMuted }]}>
                {pushEnabled ? t.enabled : t.disabled}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.mainToggleButton,
                { backgroundColor: pushEnabled ? colors.surfaceAlt : colors.primary },
              ]}
              onPress={handleTogglePush}
            >
              <Text style={[styles.mainToggleText, { color: pushEnabled ? colors.text : '#FFF' }]}>
                {pushEnabled ? t.disablePush : t.enablePush}
              </Text>
            </TouchableOpacity>
          </View>

          {pushPermission === 'denied' && (
            <TouchableOpacity
              style={[styles.permissionWarning, { backgroundColor: colors.danger + '15' }]}
              onPress={() => Linking.openSettings()}
            >
              <Ionicons name="warning" size={18} color={colors.danger} />
              <Text style={[styles.permissionWarningText, { color: colors.danger }]}>
                {t.permissionDenied}
              </Text>
              <Text style={[styles.openSettingsLink, { color: colors.primary }]}>{t.openSettings}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        {pushEnabled && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.categories}</Text>
            
            {renderToggleRow(
              '💸',
              t.transactions,
              t.transactionsDesc,
              preferences.transactions,
              (v) => updatePreference('transactions', v)
            )}
            
            {renderToggleRow(
              '📈',
              t.priceAlerts,
              t.priceAlertsDesc,
              preferences.priceAlerts,
              (v) => updatePreference('priceAlerts', v)
            )}
            
            {renderToggleRow(
              '🔐',
              t.security,
              t.securityDesc,
              preferences.security,
              (v) => updatePreference('security', v)
            )}
            
            {renderToggleRow(
              '🎁',
              t.marketing,
              t.marketingDesc,
              preferences.marketing,
              (v) => updatePreference('marketing', v)
            )}
          </View>
        )}

        {/* Email Notifications */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' + '20' }]}>
              <Ionicons name="mail" size={24} color="#3B82F6" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t.emailNotifications}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t.emailDesc}</Text>
            </View>
          </View>

          {renderToggleRow(
            '📥',
            t.deposits,
            t.depositsDesc,
            preferences.deposits ?? true,
            (v) => updatePreference('deposits', v)
          )}
          
          {renderToggleRow(
            '📤',
            t.withdrawals,
            t.withdrawalsDesc,
            preferences.withdrawals ?? true,
            (v) => updatePreference('withdrawals', v)
          )}
          
          {renderToggleRow(
            '🔒',
            t.staking,
            t.stakingDesc,
            preferences.staking ?? true,
            (v) => updatePreference('staking', v)
          )}
        </View>

        {/* Test Notification */}
        {pushEnabled && (
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surfaceAlt }]}
            onPress={sendTestNotification}
            disabled={testSent}
          >
            <Ionicons
              name={testSent ? 'checkmark-circle' : 'paper-plane-outline'}
              size={20}
              color={testSent ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.testButtonText, { color: testSent ? colors.primary : colors.textSecondary }]}>
              {testSent ? t.testSent : t.testNotification}
            </Text>
          </TouchableOpacity>
        )}

        {/* Saving Indicator */}
        {saving && (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>{t.saving}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  mainToggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mainToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    gap: 8,
  },
  permissionWarningText: {
    flex: 1,
    fontSize: 12,
  },
  openSettingsLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleIcon: {
    fontSize: 22,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  savingText: {
    fontSize: 13,
  },
});
