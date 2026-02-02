// app/two-factor.tsx
// Two-Factor Authentication Setup Screen
// 6-Language Support | Dark/Light Mode | QR Code + Backup Codes

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'İki Faktörlü Doğrulama',
    subtitle: 'Hesabınızı ekstra güvenlik katmanıyla koruyun',
    twoFactorAuth: 'İki Faktörlü Doğrulama',
    enabled: 'Aktif',
    disabled: 'Kapalı',
    enable: 'Aktifleştir',
    disable: 'Kapat',
    backupCodesRemaining: 'Kalan yedek kod',
    enabledAt: 'Aktifleştirme tarihi',
    whatIs2FA: '2FA Nedir?',
    whatIs2FADesc: 'İki faktörlü doğrulama, hesabınıza giriş yaparken şifrenize ek olarak telefonunuzdaki bir uygulamadan kod girmenizi gerektirir.',
    scanQRCode: 'QR Kodu Tarayın',
    scanQRCodeDesc: 'Google Authenticator veya Authy uygulamasıyla tarayın',
    verificationCode: 'Doğrulama Kodu',
    verify: 'Doğrula',
    verifying: 'Doğrulanıyor...',
    verifyAndEnable: 'Doğrula ve Aktifleştir',
    cancel: 'İptal',
    twoFAEnabled: '2FA Aktifleştirildi!',
    saveBackupCodes: 'Yedek kodlarınızı güvenli bir yere kaydedin',
    backupCodes: 'Yedek Kodlar',
    copy: 'Kopyala',
    copied: 'Kopyalandı!',
    backupWarning: 'Bu kodları bir daha göremeyeceksiniz. Güvenli bir yere kaydedin!',
    done: 'Tamamla',
    disable2FA: '2FA\'yı Kapat',
    disable2FADesc: 'Doğrulama kodunuzu girerek 2FA\'yı kapatın',
    disableWarning: '2FA\'yı kapatmak hesabınızın güvenliğini azaltır.',
    enterCode: 'Kodu girin',
    processing: 'İşleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    authenticatorApp: 'Authenticator Uygulaması',
    step1: 'Adım 1',
    step2: 'Adım 2',
    step3: 'Adım 3',
    downloadApp: 'Google Authenticator veya Authy indirin',
    scanCode: 'Aşağıdaki QR kodu tarayın',
    enterVerificationCode: 'Uygulamadaki 6 haneli kodu girin',
    manualEntry: 'Manuel Giriş',
    secretKey: 'Gizli Anahtar',
    cantScanQR: 'QR kodu tarayamıyor musunuz?',
    useManualEntry: 'Bu kodu manuel olarak girin',
  },
  en: {
    title: 'Two-Factor Authentication',
    subtitle: 'Protect your account with an extra layer of security',
    twoFactorAuth: 'Two-Factor Authentication',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enable: 'Enable',
    disable: 'Disable',
    backupCodesRemaining: 'Backup codes remaining',
    enabledAt: 'Enabled at',
    whatIs2FA: 'What is 2FA?',
    whatIs2FADesc: 'Two-factor authentication requires you to enter a code from your phone app in addition to your password when logging in.',
    scanQRCode: 'Scan QR Code',
    scanQRCodeDesc: 'Scan with Google Authenticator or Authy',
    verificationCode: 'Verification Code',
    verify: 'Verify',
    verifying: 'Verifying...',
    verifyAndEnable: 'Verify and Enable',
    cancel: 'Cancel',
    twoFAEnabled: '2FA Enabled!',
    saveBackupCodes: 'Save your backup codes in a safe place',
    backupCodes: 'Backup Codes',
    copy: 'Copy',
    copied: 'Copied!',
    backupWarning: 'You won\'t see these codes again. Save them somewhere safe!',
    done: 'Done',
    disable2FA: 'Disable 2FA',
    disable2FADesc: 'Enter your verification code to disable 2FA',
    disableWarning: 'Disabling 2FA will reduce your account security.',
    enterCode: 'Enter code',
    processing: 'Processing...',
    error: 'Error',
    success: 'Success',
    authenticatorApp: 'Authenticator App',
    step1: 'Step 1',
    step2: 'Step 2',
    step3: 'Step 3',
    downloadApp: 'Download Google Authenticator or Authy',
    scanCode: 'Scan the QR code below',
    enterVerificationCode: 'Enter the 6-digit code from the app',
    manualEntry: 'Manual Entry',
    secretKey: 'Secret Key',
    cantScanQR: 'Can\'t scan QR code?',
    useManualEntry: 'Enter this code manually',
  },
  de: {
    title: 'Zwei-Faktor-Authentifizierung',
    subtitle: 'Schützen Sie Ihr Konto mit einer zusätzlichen Sicherheitsebene',
    twoFactorAuth: 'Zwei-Faktor-Authentifizierung',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    enable: 'Aktivieren',
    disable: 'Deaktivieren',
    backupCodesRemaining: 'Verbleibende Backup-Codes',
    enabledAt: 'Aktiviert am',
    whatIs2FA: 'Was ist 2FA?',
    whatIs2FADesc: 'Die Zwei-Faktor-Authentifizierung erfordert zusätzlich zu Ihrem Passwort einen Code aus Ihrer Telefon-App.',
    scanQRCode: 'QR-Code scannen',
    scanQRCodeDesc: 'Mit Google Authenticator oder Authy scannen',
    verificationCode: 'Verifizierungscode',
    verify: 'Verifizieren',
    verifying: 'Verifiziere...',
    verifyAndEnable: 'Verifizieren und Aktivieren',
    cancel: 'Abbrechen',
    twoFAEnabled: '2FA Aktiviert!',
    saveBackupCodes: 'Speichern Sie Ihre Backup-Codes sicher',
    backupCodes: 'Backup-Codes',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    backupWarning: 'Sie werden diese Codes nicht mehr sehen. Speichern Sie sie sicher!',
    done: 'Fertig',
    disable2FA: '2FA Deaktivieren',
    disable2FADesc: 'Geben Sie Ihren Code ein, um 2FA zu deaktivieren',
    disableWarning: 'Das Deaktivieren von 2FA verringert die Sicherheit Ihres Kontos.',
    enterCode: 'Code eingeben',
    processing: 'Verarbeite...',
    error: 'Fehler',
    success: 'Erfolg',
    authenticatorApp: 'Authenticator-App',
    step1: 'Schritt 1',
    step2: 'Schritt 2',
    step3: 'Schritt 3',
    downloadApp: 'Google Authenticator oder Authy herunterladen',
    scanCode: 'Scannen Sie den QR-Code unten',
    enterVerificationCode: 'Geben Sie den 6-stelligen Code aus der App ein',
    manualEntry: 'Manuelle Eingabe',
    secretKey: 'Geheimer Schlüssel',
    cantScanQR: 'QR-Code kann nicht gescannt werden?',
    useManualEntry: 'Geben Sie diesen Code manuell ein',
  },
  fr: {
    title: 'Authentification à Deux Facteurs',
    subtitle: 'Protégez votre compte avec une couche de sécurité supplémentaire',
    twoFactorAuth: 'Authentification à Deux Facteurs',
    enabled: 'Activé',
    disabled: 'Désactivé',
    enable: 'Activer',
    disable: 'Désactiver',
    backupCodesRemaining: 'Codes de secours restants',
    enabledAt: 'Activé le',
    whatIs2FA: 'Qu\'est-ce que 2FA?',
    whatIs2FADesc: 'L\'authentification à deux facteurs nécessite un code de votre application téléphone en plus de votre mot de passe.',
    scanQRCode: 'Scanner le Code QR',
    scanQRCodeDesc: 'Scanner avec Google Authenticator ou Authy',
    verificationCode: 'Code de Vérification',
    verify: 'Vérifier',
    verifying: 'Vérification...',
    verifyAndEnable: 'Vérifier et Activer',
    cancel: 'Annuler',
    twoFAEnabled: '2FA Activé!',
    saveBackupCodes: 'Enregistrez vos codes de secours en lieu sûr',
    backupCodes: 'Codes de Secours',
    copy: 'Copier',
    copied: 'Copié!',
    backupWarning: 'Vous ne reverrez plus ces codes. Enregistrez-les en sécurité!',
    done: 'Terminé',
    disable2FA: 'Désactiver 2FA',
    disable2FADesc: 'Entrez votre code pour désactiver 2FA',
    disableWarning: 'La désactivation de 2FA réduira la sécurité de votre compte.',
    enterCode: 'Entrer le code',
    processing: 'Traitement...',
    error: 'Erreur',
    success: 'Succès',
    authenticatorApp: 'Application Authenticator',
    step1: 'Étape 1',
    step2: 'Étape 2',
    step3: 'Étape 3',
    downloadApp: 'Téléchargez Google Authenticator ou Authy',
    scanCode: 'Scannez le code QR ci-dessous',
    enterVerificationCode: 'Entrez le code à 6 chiffres de l\'application',
    manualEntry: 'Entrée Manuelle',
    secretKey: 'Clé Secrète',
    cantScanQR: 'Impossible de scanner le code QR?',
    useManualEntry: 'Entrez ce code manuellement',
  },
  ar: {
    title: 'المصادقة الثنائية',
    subtitle: 'احمِ حسابك بطبقة أمان إضافية',
    twoFactorAuth: 'المصادقة الثنائية',
    enabled: 'مفعّل',
    disabled: 'معطّل',
    enable: 'تفعيل',
    disable: 'تعطيل',
    backupCodesRemaining: 'رموز الاحتياط المتبقية',
    enabledAt: 'تم التفعيل في',
    whatIs2FA: 'ما هي المصادقة الثنائية؟',
    whatIs2FADesc: 'تتطلب المصادقة الثنائية إدخال رمز من تطبيق هاتفك بالإضافة إلى كلمة المرور.',
    scanQRCode: 'امسح رمز QR',
    scanQRCodeDesc: 'امسح باستخدام Google Authenticator أو Authy',
    verificationCode: 'رمز التحقق',
    verify: 'تحقق',
    verifying: 'جارٍ التحقق...',
    verifyAndEnable: 'تحقق وفعّل',
    cancel: 'إلغاء',
    twoFAEnabled: 'تم تفعيل المصادقة الثنائية!',
    saveBackupCodes: 'احفظ رموز الاحتياط في مكان آمن',
    backupCodes: 'رموز الاحتياط',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    backupWarning: 'لن ترى هذه الرموز مرة أخرى. احفظها في مكان آمن!',
    done: 'تم',
    disable2FA: 'تعطيل المصادقة الثنائية',
    disable2FADesc: 'أدخل رمز التحقق لتعطيل المصادقة الثنائية',
    disableWarning: 'تعطيل المصادقة الثنائية سيقلل من أمان حسابك.',
    enterCode: 'أدخل الرمز',
    processing: 'جارٍ المعالجة...',
    error: 'خطأ',
    success: 'نجاح',
    authenticatorApp: 'تطبيق المصادقة',
    step1: 'الخطوة 1',
    step2: 'الخطوة 2',
    step3: 'الخطوة 3',
    downloadApp: 'حمّل Google Authenticator أو Authy',
    scanCode: 'امسح رمز QR أدناه',
    enterVerificationCode: 'أدخل الرمز المكون من 6 أرقام من التطبيق',
    manualEntry: 'إدخال يدوي',
    secretKey: 'المفتاح السري',
    cantScanQR: 'لا يمكنك مسح رمز QR؟',
    useManualEntry: 'أدخل هذا الرمز يدويًا',
  },
  ru: {
    title: 'Двухфакторная Аутентификация',
    subtitle: 'Защитите свой аккаунт дополнительным уровнем безопасности',
    twoFactorAuth: 'Двухфакторная Аутентификация',
    enabled: 'Включено',
    disabled: 'Отключено',
    enable: 'Включить',
    disable: 'Отключить',
    backupCodesRemaining: 'Осталось резервных кодов',
    enabledAt: 'Включено',
    whatIs2FA: 'Что такое 2FA?',
    whatIs2FADesc: 'Двухфакторная аутентификация требует ввода кода из приложения на телефоне в дополнение к паролю.',
    scanQRCode: 'Сканировать QR-код',
    scanQRCodeDesc: 'Сканируйте с помощью Google Authenticator или Authy',
    verificationCode: 'Код Подтверждения',
    verify: 'Подтвердить',
    verifying: 'Проверка...',
    verifyAndEnable: 'Подтвердить и Включить',
    cancel: 'Отмена',
    twoFAEnabled: '2FA Включено!',
    saveBackupCodes: 'Сохраните резервные коды в надёжном месте',
    backupCodes: 'Резервные Коды',
    copy: 'Копировать',
    copied: 'Скопировано!',
    backupWarning: 'Вы больше не увидите эти коды. Сохраните их в безопасности!',
    done: 'Готово',
    disable2FA: 'Отключить 2FA',
    disable2FADesc: 'Введите код подтверждения для отключения 2FA',
    disableWarning: 'Отключение 2FA снизит безопасность вашего аккаунта.',
    enterCode: 'Введите код',
    processing: 'Обработка...',
    error: 'Ошибка',
    success: 'Успех',
    authenticatorApp: 'Приложение-аутентификатор',
    step1: 'Шаг 1',
    step2: 'Шаг 2',
    step3: 'Шаг 3',
    downloadApp: 'Скачайте Google Authenticator или Authy',
    scanCode: 'Отсканируйте QR-код ниже',
    enterVerificationCode: 'Введите 6-значный код из приложения',
    manualEntry: 'Ручной Ввод',
    secretKey: 'Секретный Ключ',
    cantScanQR: 'Не можете сканировать QR-код?',
    useManualEntry: 'Введите этот код вручную',
  },
};

type Step = 'loading' | 'status' | 'setup' | 'verify' | 'backup' | 'disable';

interface Status2FA {
  enabled: boolean;
  method?: string;
  enabledAt?: string;
  backupCodesRemaining?: number;
}

export default function TwoFactorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress: storeWalletAddress } = useStore();

  // State
  const [step, setStep] = useState<Step>('loading');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status2FA | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Theme & Language
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#10B981',
    danger: '#EF4444',
    amber: '#F59E0B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    loadData();
  }, [storeWalletAddress]);

  const loadData = async () => {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      setAuthToken(token);

      // Get wallet address
      let address = storeWalletAddress;
      if (!address) {
        address = await AsyncStorage.getItem('auxite_wallet_address');
      }
      setWalletAddress(address);

      if (token) {
        await fetchStatus(token);
      } else {
        setStep('status');
      }
    } catch (err) {
      console.error('Load error:', err);
      setStep('status');
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  const fetchStatus = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/security/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStatus(data);
      setStep('status');
    } catch (err) {
      console.error('Status fetch error:', err);
      setStep('status');
    }
  };

  const startSetup = async () => {
    if (!authToken) {
      Alert.alert(t.error, 'Please login first');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/security/2fa/setup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch (err: any) {
      Alert.alert(t.error, err.message);
    } finally {
      setProcessing(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6 || !authToken) {
      setError(t.enterCode);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/security/2fa/enable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: verifyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setBackupCodes(data.backupCodes || []);
      setStep('backup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const disable2FA = async () => {
    if (verifyCode.length !== 6 || !authToken) {
      setError(t.enterCode);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/security/2fa/disable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: verifyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Disable failed');
      }

      await fetchStatus(authToken);
      setVerifyCode('');
      Alert.alert(t.success, '2FA disabled');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyBackupCodes = async () => {
    await Clipboard.setStringAsync(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySecret = async () => {
    if (secret) {
      await Clipboard.setStringAsync(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const finishSetup = async () => {
    if (authToken) {
      await fetchStatus(authToken);
    }
    setVerifyCode('');
    setQrCode(null);
    setSecret(null);
    setBackupCodes([]);
  };

  // Loading
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Screen */}
        {step === 'status' && (
          <>
            {/* Current Status */}
            <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statusHeader}>
                <View style={[
                  styles.statusIcon, 
                  { backgroundColor: status?.enabled ? colors.primary + '20' : colors.surfaceAlt }
                ]}>
                  <Ionicons 
                    name={status?.enabled ? 'shield-checkmark' : 'shield-outline'} 
                    size={32} 
                    color={status?.enabled ? colors.primary : colors.textSecondary} 
                  />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>{t.twoFactorAuth}</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: status?.enabled ? colors.primary + '20' : colors.danger + '20' }
                  ]}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: status?.enabled ? colors.primary : colors.danger }
                    ]} />
                    <Text style={[
                      styles.statusBadgeText, 
                      { color: status?.enabled ? colors.primary : colors.danger }
                    ]}>
                      {status?.enabled ? t.enabled : t.disabled}
                    </Text>
                  </View>
                </View>
              </View>

              {status?.enabled && status.enabledAt && (
                <View style={[styles.statusDetail, { borderTopColor: colors.border }]}>
                  <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                    {t.enabledAt}
                  </Text>
                  <Text style={[styles.statusDetailValue, { color: colors.text }]}>
                    {new Date(status.enabledAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            {status?.enabled ? (
              <TouchableOpacity 
                style={[styles.dangerButton, { backgroundColor: colors.danger + '15' }]}
                onPress={() => { setStep('disable'); setVerifyCode(''); }}
              >
                <Ionicons name="shield-outline" size={20} color={colors.danger} />
                <Text style={[styles.dangerButtonText, { color: colors.danger }]}>{t.disable2FA}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={startSetup}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>{t.enable}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* What is 2FA */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>{t.whatIs2FA}</Text>
              </View>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {t.whatIs2FADesc}
              </Text>
            </View>
          </>
        )}

        {/* Setup Screen */}
        {step === 'setup' && (
          <>
            {/* Steps */}
            <View style={[styles.stepsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Step 1 */}
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{t.step1}</Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{t.downloadApp}</Text>
                </View>
              </View>

              {/* Step 2 - QR Code */}
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{t.step2}</Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{t.scanCode}</Text>
                </View>
              </View>

              {/* QR Code */}
              {qrCode && (
                <View style={styles.qrContainer}>
                  <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
                    <Image source={{ uri: qrCode }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                  
                  {/* Manual Entry Toggle */}
                  <TouchableOpacity 
                    style={styles.manualEntryToggle}
                    onPress={() => setShowManualEntry(!showManualEntry)}
                  >
                    <Text style={[styles.manualEntryText, { color: colors.primary }]}>
                      {t.cantScanQR}
                    </Text>
                  </TouchableOpacity>

                  {showManualEntry && secret && (
                    <View style={[styles.secretBox, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.secretLabel, { color: colors.textSecondary }]}>{t.secretKey}</Text>
                      <View style={styles.secretRow}>
                        <Text style={[styles.secretText, { color: colors.text }]} selectable>
                          {secret}
                        </Text>
                        <TouchableOpacity onPress={copySecret}>
                          <Ionicons 
                            name={copied ? 'checkmark' : 'copy-outline'} 
                            size={20} 
                            color={colors.primary} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Step 3 */}
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{t.step3}</Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{t.enterVerificationCode}</Text>
                </View>
              </View>

              {/* Verification Input */}
              <View style={styles.verifyInputContainer}>
                <TextInput
                  style={[styles.verifyInput, { 
                    backgroundColor: colors.surfaceAlt, 
                    color: colors.text,
                    borderColor: error ? colors.danger : colors.border 
                  }]}
                  value={verifyCode}
                  onChangeText={(text) => {
                    setVerifyCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                    setError(null);
                  }}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
                {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => { setStep('status'); setVerifyCode(''); }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.primaryButton, 
                  { backgroundColor: colors.primary, flex: 1 },
                  verifyCode.length !== 6 && { opacity: 0.5 }
                ]}
                onPress={verifyAndEnable}
                disabled={processing || verifyCode.length !== 6}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t.verifyAndEnable}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Backup Codes Screen */}
        {step === 'backup' && (
          <>
            {/* Success Icon */}
            <View style={styles.successSection}>
              <View style={[styles.successIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>{t.twoFAEnabled}</Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>{t.saveBackupCodes}</Text>
            </View>

            {/* Backup Codes */}
            <View style={[styles.backupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.backupHeader}>
                <Ionicons name="key-outline" size={20} color={colors.amber} />
                <Text style={[styles.backupTitle, { color: colors.text }]}>{t.backupCodes}</Text>
              </View>

              <View style={styles.backupCodesGrid}>
                {backupCodes.map((code, index) => (
                  <View key={index} style={[styles.backupCodeItem, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.backupCodeText, { color: colors.text }]}>{code}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.copyButton, { borderColor: colors.border }]} onPress={copyBackupCodes}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.primary} />
                <Text style={[styles.copyButtonText, { color: colors.primary }]}>
                  {copied ? t.copied : t.copy}
                </Text>
              </TouchableOpacity>

              <View style={[styles.warningBox, { backgroundColor: colors.amber + '15' }]}>
                <Ionicons name="warning-outline" size={20} color={colors.amber} />
                <Text style={[styles.warningText, { color: colors.amber }]}>{t.backupWarning}</Text>
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={finishSetup}
            >
              <Text style={styles.primaryButtonText}>{t.done}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Disable Screen */}
        {step === 'disable' && (
          <>
            <View style={[styles.disableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.disableIcon, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="shield-outline" size={40} color={colors.danger} />
              </View>
              
              <Text style={[styles.disableTitle, { color: colors.text }]}>{t.disable2FA}</Text>
              <Text style={[styles.disableDesc, { color: colors.textSecondary }]}>{t.disable2FADesc}</Text>

              <View style={[styles.warningBox, { backgroundColor: colors.amber + '15', marginTop: 16 }]}>
                <Ionicons name="warning-outline" size={20} color={colors.amber} />
                <Text style={[styles.warningText, { color: colors.amber }]}>{t.disableWarning}</Text>
              </View>

              <TextInput
                style={[styles.verifyInput, { 
                  backgroundColor: colors.surfaceAlt, 
                  color: colors.text,
                  borderColor: error ? colors.danger : colors.border,
                  marginTop: 24
                }]}
                value={verifyCode}
                onChangeText={(text) => {
                  setVerifyCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => { setStep('status'); setVerifyCode(''); setError(null); }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.dangerButtonFull, 
                  { backgroundColor: colors.danger },
                  verifyCode.length !== 6 && { opacity: 0.5 }
                ]}
                onPress={disable2FA}
                disabled={processing || verifyCode.length !== 6}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t.disable}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // Status Card
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  statusDetailLabel: {
    fontSize: 14,
  },
  statusDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButtonFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },

  // Info Card
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Steps Card
  stepsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  // QR Container
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  manualEntryToggle: {
    marginTop: 12,
  },
  manualEntryText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  secretBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  secretLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secretText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 12,
  },

  // Verify Input
  verifyInputContainer: {
    marginTop: 8,
  },
  verifyInput: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  // Success Section
  successSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Backup Card
  backupCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  backupCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  backupCodeItem: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupCodeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Disable Card
  disableCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  disableIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  disableTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  disableDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
});
