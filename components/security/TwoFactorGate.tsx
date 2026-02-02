// components/security/TwoFactorGate.tsx
// 2FA Gate - Hassas işlemler için otomatik 2FA kontrolü
// Kurulu değilse setup, kuruluysa verify gösterir

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

interface Props {
  visible: boolean;
  walletAddress: string;
  onVerified: () => void;
  onCancel: () => void;
}

type Step = 'checking' | 'error' | 'setup-qr' | 'setup-backup' | 'verify';

const translations = {
  tr: {
    setupTitle: '2FA Kurulumu Gerekli',
    setupDesc: 'Bu işlemi gerçekleştirmek için iki faktörlü doğrulama kurmanız gerekiyor.',
    verifyTitle: '2FA Doğrulama',
    verifyDesc: 'İşlemi onaylamak için doğrulama kodunu girin.',
    scanQRDesc: 'Google Authenticator veya Authy uygulamasıyla tarayın',
    manualEntry: 'Manuel Giriş',
    secretKey: 'Gizli Anahtar',
    verificationCode: 'Doğrulama Kodu',
    backupCodes: 'Yedek Kodlar',
    backupCodesDesc: 'Bu kodları güvenli bir yere kaydedin. Her kod sadece bir kez kullanılabilir.',
    saveBackupCodes: 'Kodları Kaydettim',
    verify: 'Doğrula',
    verifying: 'Doğrulanıyor...',
    cancel: 'İptal',
    continue: 'Devam Et',
    invalidCode: 'Geçersiz kod',
    codeCopied: 'Kopyalandı!',
    copy: 'Kopyala',
    useBackupCode: 'Yedek kodu kullan',
    useAuthenticator: 'Authenticator kullan',
    error: 'Bir hata oluştu',
    loading: 'Yükleniyor...',
    retry: 'Tekrar Dene',
    connectionError: 'Bağlantı hatası',
  },
  en: {
    setupTitle: '2FA Setup Required',
    setupDesc: 'You need to set up two-factor authentication to perform this action.',
    verifyTitle: '2FA Verification',
    verifyDesc: 'Enter the verification code to confirm this action.',
    scanQRDesc: 'Scan with Google Authenticator or Authy app',
    manualEntry: 'Manual Entry',
    secretKey: 'Secret Key',
    verificationCode: 'Verification Code',
    backupCodes: 'Backup Codes',
    backupCodesDesc: 'Save these codes in a safe place. Each code can only be used once.',
    saveBackupCodes: 'I Saved The Codes',
    verify: 'Verify',
    verifying: 'Verifying...',
    cancel: 'Cancel',
    continue: 'Continue',
    invalidCode: 'Invalid code',
    codeCopied: 'Copied!',
    copy: 'Copy',
    useBackupCode: 'Use backup code',
    useAuthenticator: 'Use authenticator',
    error: 'An error occurred',
    loading: 'Loading...',
    retry: 'Retry',
    connectionError: 'Connection error',
  },
  de: {
    setupTitle: '2FA-Einrichtung erforderlich',
    setupDesc: 'Sie müssen die Zwei-Faktor-Authentifizierung einrichten.',
    verifyTitle: '2FA-Verifizierung',
    verifyDesc: 'Geben Sie den Verifizierungscode ein.',
    scanQRDesc: 'Mit Google Authenticator oder Authy scannen',
    manualEntry: 'Manuelle Eingabe',
    secretKey: 'Geheimschlüssel',
    verificationCode: 'Verifizierungscode',
    backupCodes: 'Backup-Codes',
    backupCodesDesc: 'Speichern Sie diese Codes sicher.',
    saveBackupCodes: 'Codes gespeichert',
    verify: 'Verifizieren',
    verifying: 'Verifiziere...',
    cancel: 'Abbrechen',
    continue: 'Weiter',
    invalidCode: 'Ungültiger Code',
    codeCopied: 'Kopiert!',
    copy: 'Kopieren',
    useBackupCode: 'Backup-Code verwenden',
    useAuthenticator: 'Authenticator verwenden',
    error: 'Ein Fehler ist aufgetreten',
    loading: 'Laden...',
    retry: 'Wiederholen',
    connectionError: 'Verbindungsfehler',
  },
  fr: {
    setupTitle: 'Configuration 2FA requise',
    setupDesc: 'Vous devez configurer l\'authentification à deux facteurs.',
    verifyTitle: 'Vérification 2FA',
    verifyDesc: 'Entrez le code de vérification.',
    scanQRDesc: 'Scanner avec Google Authenticator ou Authy',
    manualEntry: 'Entrée manuelle',
    secretKey: 'Clé secrète',
    verificationCode: 'Code de vérification',
    backupCodes: 'Codes de secours',
    backupCodesDesc: 'Enregistrez ces codes en lieu sûr.',
    saveBackupCodes: 'Codes enregistrés',
    verify: 'Vérifier',
    verifying: 'Vérification...',
    cancel: 'Annuler',
    continue: 'Continuer',
    invalidCode: 'Code invalide',
    codeCopied: 'Copié!',
    copy: 'Copier',
    useBackupCode: 'Code de secours',
    useAuthenticator: 'Authenticator',
    error: 'Une erreur s\'est produite',
    loading: 'Chargement...',
    retry: 'Réessayer',
    connectionError: 'Erreur de connexion',
  },
  ar: {
    setupTitle: 'إعداد 2FA مطلوب',
    setupDesc: 'تحتاج إلى إعداد المصادقة الثنائية.',
    verifyTitle: 'التحقق من 2FA',
    verifyDesc: 'أدخل رمز التحقق.',
    scanQRDesc: 'امسح باستخدام Google Authenticator أو Authy',
    manualEntry: 'إدخال يدوي',
    secretKey: 'المفتاح السري',
    verificationCode: 'رمز التحقق',
    backupCodes: 'رموز النسخ الاحتياطي',
    backupCodesDesc: 'احفظ هذه الرموز بأمان.',
    saveBackupCodes: 'تم الحفظ',
    verify: 'تحقق',
    verifying: 'جاري التحقق...',
    cancel: 'إلغاء',
    continue: 'متابعة',
    invalidCode: 'رمز غير صالح',
    codeCopied: 'تم النسخ!',
    copy: 'نسخ',
    useBackupCode: 'رمز احتياطي',
    useAuthenticator: 'المصادق',
    error: 'حدث خطأ',
    loading: 'جاري التحميل...',
    retry: 'إعادة المحاولة',
    connectionError: 'خطأ في الاتصال',
  },
  ru: {
    setupTitle: 'Требуется настройка 2FA',
    setupDesc: 'Настройте двухфакторную аутентификацию.',
    verifyTitle: 'Проверка 2FA',
    verifyDesc: 'Введите код подтверждения.',
    scanQRDesc: 'Сканируйте с помощью Google Authenticator или Authy',
    manualEntry: 'Ручной ввод',
    secretKey: 'Секретный ключ',
    verificationCode: 'Код подтверждения',
    backupCodes: 'Резервные коды',
    backupCodesDesc: 'Сохраните эти коды в безопасном месте.',
    saveBackupCodes: 'Коды сохранены',
    verify: 'Подтвердить',
    verifying: 'Проверка...',
    cancel: 'Отмена',
    continue: 'Продолжить',
    invalidCode: 'Неверный код',
    codeCopied: 'Скопировано!',
    copy: 'Копировать',
    useBackupCode: 'Резервный код',
    useAuthenticator: 'Аутентификатор',
    error: 'Произошла ошибка',
    loading: 'Загрузка...',
    retry: 'Повторить',
    connectionError: 'Ошибка соединения',
  },
};

export function TwoFactorGate({ visible, walletAddress, onVerified, onCancel }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [step, setStep] = useState<Step>('checking');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const colors = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    surface: isDark ? '#1E293B' : '#F8FAFC',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
    primary: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444',
  };

  const API_BASE = `${API_URL}/api/security/2fa`;

  // Check 2FA status when modal opens
  useEffect(() => {
    if (visible && walletAddress) {
      check2FAStatus();
    }
  }, [visible, walletAddress]);

  const check2FAStatus = async () => {
    setStep('checking');
    setError(null);
    setCode('');
    setUseBackupCode(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_BASE}/status`, {
        headers: { 'x-wallet-address': walletAddress },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const isEnabled = data.enabled === true || (data.enabledAt && data.backupCodesRemaining > 0);

      if (isEnabled) {
        setStep('verify');
        setTimeout(() => inputRef.current?.focus(), 300);
      } else {
        await startSetup();
      }
    } catch (err: any) {
      setError(err.name === 'AbortError' ? t.connectionError : (err.message || t.error));
      setStep('error');
    }
  };

  const startSetup = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed');

      setSecret(data.secret);
      setQrCodeDataUrl(data.qrCodeDataUrl || '');
      if (data.backupCodes) setBackupCodes(data.backupCodes);
      setStep('setup-qr');
    } catch (err: any) {
      setError(err.message || t.error);
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifySetup = async () => {
    if (code.length !== 6) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.invalidCode);

      if (data.backupCodes) setBackupCodes(data.backupCodes);
      setStep('setup-backup');
      setCode('');
    } catch (err: any) {
      setError(err.message || t.invalidCode);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    const codeLength = useBackupCode ? 8 : 6;
    if (code.length !== codeLength) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          code: useBackupCode ? code.toUpperCase() : code,
          isBackupCode: useBackupCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.verified && !data.valid)) throw new Error(data.error || t.invalidCode);

      onVerified();
    } catch (err: any) {
      setError(err.message || t.invalidCode);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackupCodesSaved = () => {
    onVerified();
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllBackupCodes = () => {
    copyToClipboard(backupCodes.join('\n'));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.headerIcon, { backgroundColor: step === 'verify' ? colors.primary + '20' : step === 'error' ? colors.danger + '20' : colors.primary + '20' }]}>
              <Text style={styles.headerIconText}>
                {step === 'checking' ? '⏳' : step === 'error' ? '❌' : step === 'setup-qr' ? '📱' : step === 'setup-backup' ? '🔐' : '🔑'}
              </Text>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {step === 'error' ? t.error : step === 'setup-qr' || step === 'setup-backup' ? t.setupTitle : t.verifyTitle}
              </Text>
              <Text style={[styles.headerDesc, { color: colors.textSecondary }]}>
                {step === 'setup-qr' || step === 'setup-backup' ? t.setupDesc : step === 'verify' ? t.verifyDesc : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Checking */}
            {step === 'checking' && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.loading}</Text>
              </View>
            )}

            {/* Error */}
            {step === 'error' && (
              <View style={styles.centerContent}>
                <View style={[styles.errorIcon, { backgroundColor: colors.danger + '20' }]}>
                  <Text style={styles.errorIconText}>❌</Text>
                </View>
                <Text style={[styles.errorMessage, { color: colors.danger }]}>{error}</Text>
                <View style={styles.errorButtons}>
                  <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]} onPress={onCancel}>
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={check2FAStatus}>
                    <Text style={styles.primaryButtonText}>{t.retry}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Setup QR */}
            {step === 'setup-qr' && (
              <View style={styles.setupContent}>
                <Text style={[styles.scanDesc, { color: colors.textSecondary }]}>{t.scanQRDesc}</Text>
                
                {qrCodeDataUrl ? (
                  <View style={styles.qrContainer}>
                    <Image source={{ uri: qrCodeDataUrl }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                ) : null}

                <TouchableOpacity onPress={() => setShowManualKey(!showManualKey)}>
                  <Text style={[styles.manualEntryLink, { color: colors.primary }]}>
                    {showManualKey ? 'Hide' : t.manualEntry} →
                  </Text>
                </TouchableOpacity>

                {showManualKey && secret && (
                  <View style={[styles.secretBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.secretLabel, { color: colors.textSecondary }]}>{t.secretKey}:</Text>
                    <View style={styles.secretRow}>
                      <Text style={[styles.secretText, { color: colors.text }]} selectable>{secret}</Text>
                      <TouchableOpacity onPress={() => copyToClipboard(secret)}>
                        <Text style={[styles.copyButton, { color: colors.primary }]}>{copied ? '✓' : t.copy}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.verificationCode}</Text>
                  <TextInput
                    ref={inputRef}
                    style={[styles.codeInput, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, color: colors.text }]}
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                </View>

                {error && (
                  <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                    <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Setup Backup Codes */}
            {step === 'setup-backup' && (
              <View style={styles.backupContent}>
                <View style={[styles.warningBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={[styles.warningText, { color: colors.primary }]}>{t.backupCodesDesc}</Text>
                </View>

                <View style={[styles.backupCodesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.backupCodesHeader}>
                    <Text style={[styles.backupCodesTitle, { color: colors.textSecondary }]}>{t.backupCodes}</Text>
                    <TouchableOpacity onPress={copyAllBackupCodes}>
                      <Text style={[styles.copyAllButton, { color: colors.primary }]}>{copied ? t.codeCopied : t.copy}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.backupCodesGrid}>
                    {backupCodes.map((backupCode, i) => (
                      <View key={i} style={[styles.backupCodeItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.backupCodeText, { color: colors.text }]}>{backupCode}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Verify */}
            {step === 'verify' && (
              <View style={styles.verifyContent}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {useBackupCode ? t.backupCodes : t.verificationCode}
                  </Text>
                  <TextInput
                    ref={inputRef}
                    style={[styles.codeInput, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, color: colors.text }]}
                    value={code}
                    onChangeText={(text) => {
                      const val = useBackupCode ? text.toUpperCase().slice(0, 8) : text.replace(/\D/g, '').slice(0, 6);
                      setCode(val);
                      setError(null);
                    }}
                    placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType={useBackupCode ? 'default' : 'number-pad'}
                    maxLength={useBackupCode ? 8 : 6}
                    textAlign="center"
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity onPress={() => { setUseBackupCode(!useBackupCode); setCode(''); setError(null); }}>
                  <Text style={[styles.toggleLink, { color: colors.primary }]}>
                    {useBackupCode ? t.useAuthenticator : t.useBackupCode} →
                  </Text>
                </TouchableOpacity>

                {error && (
                  <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                    <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {(step === 'setup-qr' || step === 'verify') && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]} onPress={onCancel}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: (step === 'setup-qr' ? code.length !== 6 : (useBackupCode ? code.length !== 8 : code.length !== 6)) || isProcessing ? 0.5 : 1 }]}
                onPress={step === 'setup-qr' ? handleVerifySetup : handleVerify}
                disabled={(step === 'setup-qr' ? code.length !== 6 : (useBackupCode ? code.length !== 8 : code.length !== 6)) || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>{step === 'setup-qr' ? t.continue : t.verify}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'setup-backup' && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.fullButton, { backgroundColor: colors.success }]} onPress={handleBackupCodesSaved}>
                <Text style={styles.fullButtonText}>{t.saveBackupCodes}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 22,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 32,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  setupContent: {
    alignItems: 'center',
  },
  scanDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  manualEntryLink: {
    fontSize: 13,
    marginBottom: 16,
  },
  secretBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  secretLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secretText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 8,
  },
  errorBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
  },
  backupContent: {
    alignItems: 'center',
  },
  warningBox: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  warningIcon: {
    fontSize: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
  },
  backupCodesCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  backupCodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backupCodesTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  copyAllButton: {
    fontSize: 12,
    fontWeight: '600',
  },
  backupCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupCodeItem: {
    width: '48%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupCodeText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  verifyContent: {
    alignItems: 'center',
  },
  toggleLink: {
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  fullButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TwoFactorGate;
