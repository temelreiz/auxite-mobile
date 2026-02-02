// components/security/TwoFactorSetup.tsx
// İki Faktörlü Doğrulama Kurulum ve Yönetimi
// TR/EN | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface Props {
  onStatusChange?: () => void;
}

interface TwoFAStatus {
  enabled: boolean;
  enabledAt?: string;
  backupCodesRemaining?: number;
}

type Step = 'status' | 'setup' | 'verify' | 'backup' | 'disable';

const translations = {
  tr: {
    title: 'İki Faktörlü Doğrulama',
    subtitle: 'Hesabınızı koruyun',
    enabled: 'Aktif',
    disabled: 'Kapalı',
    enable: 'Aktifleştir',
    disable: 'Kapat',
    loading: 'Yükleniyor...',
    backupCodesRemaining: 'Kalan yedek kod',
    enabledSince: 'Aktif tarihi',
    whatIs2FA: '2FA Nedir?',
    whatIs2FADesc: 'İki faktörlü doğrulama, hesabınıza giriş yaparken şifrenize ek olarak telefonunuzdaki bir uygulamadan kod girmenizi gerektirir. Bu, hesabınızı çok daha güvenli hale getirir.',
    scanQRCode: 'QR Kodu Tarayın',
    scanQRCodeDesc: 'Google Authenticator veya Authy uygulamasıyla tarayın',
    verificationCode: 'Doğrulama Kodu',
    verify: 'Doğrula',
    verifying: 'Doğrulanıyor...',
    verifyAndEnable: 'Doğrula ve Aktifleştir',
    cancel: 'İptal',
    enterCode: '6 haneli kod girin',
    twoFAEnabled: '2FA Aktifleştirildi!',
    saveBackupCodes: 'Yedek kodlarınızı güvenli bir yere kaydedin',
    backupCodes: 'Yedek Kodlar',
    copy: 'Kopyala',
    copied: '✓ Kopyalandı',
    done: 'Tamamla',
    warning: 'Bu kodları bir daha göremeyeceksiniz. Güvenli bir yere kaydedin!',
    disable2FA: '2FA\'yı Kapat',
    disable2FADesc: 'Doğrulama kodunuzu girerek 2FA\'yı kapatın',
    disableWarning: '2FA\'yı kapatmak hesabınızın güvenliğini azaltır. Bu işlemi sadece gerekli durumlarda yapın.',
    processing: 'İşleniyor...',
    error: 'Bir hata oluştu',
  },
  en: {
    title: 'Two-Factor Authentication',
    subtitle: 'Protect your account',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enable: 'Enable',
    disable: 'Disable',
    loading: 'Loading...',
    backupCodesRemaining: 'Backup codes remaining',
    enabledSince: 'Enabled since',
    whatIs2FA: 'What is 2FA?',
    whatIs2FADesc: 'Two-factor authentication requires you to enter a code from an app on your phone in addition to your password when logging in. This makes your account much more secure.',
    scanQRCode: 'Scan QR Code',
    scanQRCodeDesc: 'Scan with Google Authenticator or Authy app',
    verificationCode: 'Verification Code',
    verify: 'Verify',
    verifying: 'Verifying...',
    verifyAndEnable: 'Verify & Enable',
    cancel: 'Cancel',
    enterCode: 'Enter 6-digit code',
    twoFAEnabled: '2FA Enabled!',
    saveBackupCodes: 'Save your backup codes in a safe place',
    backupCodes: 'Backup Codes',
    copy: 'Copy',
    copied: '✓ Copied',
    done: 'Done',
    warning: 'You won\'t see these codes again. Save them somewhere safe!',
    disable2FA: 'Disable 2FA',
    disable2FADesc: 'Enter your verification code to disable 2FA',
    disableWarning: 'Disabling 2FA reduces your account security. Only do this when necessary.',
    processing: 'Processing...',
    error: 'An error occurred',
  },
};

export function TwoFactorSetup({ onStatusChange }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('status');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  };

  useEffect(() => {
    fetchStatus();
  }, [walletAddress]);

  const fetchStatus = async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/security/2fa/status`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setStatus(data);
      setStep('status');
    } catch (err) {
      console.error('2FA status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    if (!walletAddress) return;
    try {
      setProcessing(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/security/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setQrCode(data.qrCodeDataUrl);
      setBackupCodes(data.backupCodes);
      setStep('setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6) {
      setError(t.enterCode);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/security/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ code: verifyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setStep('backup');
      onStatusChange?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const disable2FA = async () => {
    if (verifyCode.length !== 6) {
      setError(t.enterCode);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/security/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ code: verifyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }

      await fetchStatus();
      setVerifyCode('');
      onStatusChange?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyBackupCodes = async () => {
    await Clipboard.setStringAsync(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Status View
  if (step === 'status') {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[
                styles.statusIcon, 
                { backgroundColor: status?.enabled ? colors.primary + '20' : colors.surface }
              ]}>
                <Text style={styles.statusIconText}>🔐</Text>
              </View>
              <View>
                <Text style={[styles.statusTitle, { color: colors.text }]}>{t.title}</Text>
                <Text style={[
                  styles.statusValue, 
                  { color: status?.enabled ? colors.primary : colors.textSecondary }
                ]}>
                  {status?.enabled ? t.enabled : t.disabled}
                </Text>
              </View>
            </View>

            {status?.enabled ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
                onPress={() => setStep('disable')}
              >
                <Text style={[styles.actionButtonText, { color: colors.danger }]}>{t.disable}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={startSetup}
                disabled={processing}
              >
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                  {processing ? t.loading : t.enable}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {status?.enabled && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}

          {status?.enabled && (
            <View style={styles.statusDetails}>
              <View style={styles.statusDetailRow}>
                <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                  {t.backupCodesRemaining}
                </Text>
                <Text style={[
                  styles.statusDetailValue, 
                  { color: (status.backupCodesRemaining || 0) <= 2 ? colors.warning : colors.text }
                ]}>
                  {status.backupCodesRemaining || 0}
                </Text>
              </View>
              {status.enabledAt && (
                <View style={styles.statusDetailRow}>
                  <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                    {t.enabledSince}
                  </Text>
                  <Text style={[styles.statusDetailValue, { color: colors.text }]}>
                    {new Date(status.enabledAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: '#3b82f610', borderColor: '#3b82f630' }]}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>ℹ️</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: '#3b82f6' }]}>{t.whatIs2FA}</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{t.whatIs2FADesc}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Setup View - QR Code
  if (step === 'setup' && qrCode) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t.scanQRCode}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.scanQRCodeDesc}</Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <Image source={{ uri: qrCode }} style={styles.qrImage} resizeMode="contain" />
        </View>

        {/* Verify Code Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.verificationCode}</Text>
          <TextInput
            style={[styles.codeInput, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text,
            }]}
            value={verifyCode}
            onChangeText={(text) => setVerifyCode(text.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              setStep('status');
              setQrCode(null);
              setVerifyCode('');
              setError(null);
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: verifyCode.length !== 6 || processing ? 0.5 : 1 }]}
            onPress={verifyAndEnable}
            disabled={verifyCode.length !== 6 || processing}
          >
            <Text style={styles.primaryButtonText}>
              {processing ? t.verifying : t.verifyAndEnable}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Backup Codes View
  if (step === 'backup') {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContent}>
        <View style={[styles.successIcon, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.successIconText}>✅</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t.twoFAEnabled}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.saveBackupCodes}</Text>

        {/* Backup Codes */}
        <View style={[styles.backupCodesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.backupCodesHeader}>
            <Text style={[styles.backupCodesTitle, { color: colors.textSecondary }]}>{t.backupCodes}</Text>
            <TouchableOpacity onPress={copyBackupCodes}>
              <Text style={[styles.copyButton, { color: colors.primary }]}>
                {copiedBackup ? t.copied : t.copy}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.backupCodesGrid}>
            {backupCodes.map((code, i) => (
              <View key={i} style={[styles.backupCodeItem, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
                <Text style={[styles.backupCodeText, { color: colors.text }]}>{code}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Warning */}
        <View style={[styles.warningBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.warningText, { color: colors.warning }]}>{t.warning}</Text>
        </View>

        {/* Done Button */}
        <TouchableOpacity
          style={[styles.fullButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setStep('status');
            fetchStatus();
          }}
        >
          <Text style={styles.fullButtonText}>{t.done}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Disable View
  if (step === 'disable') {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContent}>
        <View style={[styles.disableIcon, { backgroundColor: colors.danger + '20' }]}>
          <Text style={styles.disableIconText}>🔓</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t.disable2FA}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.disable2FADesc}</Text>

        {/* Verify Code Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.verificationCode}</Text>
          <TextInput
            style={[styles.codeInput, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text,
            }]}
            value={verifyCode}
            onChangeText={(text) => setVerifyCode(text.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Warning */}
        <View style={[styles.warningBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.warningText, { color: colors.danger }]}>{t.disableWarning}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              setStep('status');
              setVerifyCode('');
              setError(null);
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.danger, opacity: verifyCode.length !== 6 || processing ? 0.5 : 1 }]}
            onPress={disable2FA}
            disabled={verifyCode.length !== 6 || processing}
          >
            <Text style={styles.primaryButtonText}>
              {processing ? t.processing : t.disable2FA}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    fontSize: 24,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statusDetails: {
    gap: 8,
  },
  statusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusDetailLabel: {
    fontSize: 13,
  },
  statusDetailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  infoIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontSize: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
  },
  disableIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  disableIconText: {
    fontSize: 32,
  },
  backupCodesCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  backupCodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backupCodesTitle: {
    fontSize: 13,
  },
  copyButton: {
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 12,
  },
  fullButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
