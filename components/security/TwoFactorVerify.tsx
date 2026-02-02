// components/security/TwoFactorVerify.tsx
// 2FA Doğrulama Modalı - Hassas işlemler için kullanılır
// TR/EN | Dark/Light Mode

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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface Props {
  visible: boolean;
  title?: string;
  description?: string;
  allowBiometric?: boolean;
  onVerified: (verificationToken: string) => void;
  onCancel: () => void;
}

const translations = {
  tr: {
    defaultTitle: 'Doğrulama Gerekli',
    defaultDesc: 'İşlemi onaylamak için doğrulayın',
    verifyWithBiometric: 'Biyometrik ile Doğrula',
    waiting: 'Bekleniyor...',
    or: 'veya',
    verificationCode: 'Doğrulama Kodu',
    backupCode: 'Backup Kodu',
    useBackupCode: 'Backup kodu kullan →',
    useAuthCode: '← Authenticator kodu kullan',
    verify: 'Doğrula',
    verifying: 'Doğrulanıyor...',
    cancel: 'İptal',
    enterCode6: '6 haneli kod girin',
    enterCode8: '8 haneli backup kodu girin',
    tooManyAttempts: 'Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.',
    remainingAttempts: 'Kalan deneme',
    error: 'Bir hata oluştu',
    cancelled: 'İşlem iptal edildi',
  },
  en: {
    defaultTitle: 'Verification Required',
    defaultDesc: 'Verify to confirm this action',
    verifyWithBiometric: 'Verify with Biometric',
    waiting: 'Waiting...',
    or: 'or',
    verificationCode: 'Verification Code',
    backupCode: 'Backup Code',
    useBackupCode: 'Use backup code →',
    useAuthCode: '← Use authenticator code',
    verify: 'Verify',
    verifying: 'Verifying...',
    cancel: 'Cancel',
    enterCode6: 'Enter 6-digit code',
    enterCode8: 'Enter 8-digit backup code',
    tooManyAttempts: 'Too many failed attempts. Try again in 15 minutes.',
    remainingAttempts: 'Remaining attempts',
    error: 'An error occurred',
    cancelled: 'Operation cancelled',
  },
};

export function TwoFactorVerify({
  visible,
  title,
  description,
  allowBiometric = true,
  onVerified,
  onCancel,
}: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [hasBiometric, setHasBiometric] = useState(false);
  const inputRef = useRef<TextInput>(null);

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
    if (visible) {
      setCode('');
      setError(null);
      setUseBackupCode(false);
      if (allowBiometric) {
        checkBiometric();
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const checkBiometric = async () => {
    try {
      // Check local biometric capability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        // Also check if biometric is enabled in the app
        const res = await fetch(`${API_BASE_URL}/api/security/biometric`, {
          headers: { 'x-wallet-address': walletAddress },
        });
        const data = await res.json();
        setHasBiometric(data.enabled);
      } else {
        setHasBiometric(false);
      }
    } catch {
      setHasBiometric(false);
    }
  };

  const verify = async () => {
    const cleanCode = code.replace(/\s/g, '');

    if (useBackupCode) {
      if (cleanCode.length !== 8) {
        setError(t.enterCode8);
        return;
      }
    } else {
      if (cleanCode.length !== 6) {
        setError(t.enterCode6);
        return;
      }
    }

    try {
      setProcessing(true);
      setError(null);
      Keyboard.dismiss();

      const res = await fetch(`${API_BASE_URL}/api/security/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          code: cleanCode,
          isBackupCode: useBackupCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setError(t.tooManyAttempts);
        } else {
          setError(data.error);
          if (data.remainingAttempts !== undefined) {
            setRemainingAttempts(data.remainingAttempts);
          }
        }
        return;
      }

      onVerified(data.verificationToken);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setProcessing(false);
    }
  };

  const verifyWithBiometric = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Local biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: title || t.defaultTitle,
        cancelLabel: t.cancel,
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error === 'user_cancel') {
          setError(t.cancelled);
        } else {
          setError(t.error);
        }
        return;
      }

      // Verify with server
      const res = await fetch(`${API_BASE_URL}/api/security/biometric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'verify-for-action',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      onVerified(data.verificationToken);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError(t.cancelled);
      } else {
        setError(err.message || t.error);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIcon, { backgroundColor: colors.warning + '20' }]}>
                <Text style={styles.headerIconText}>🔐</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {title || t.defaultTitle}
                </Text>
                <Text style={[styles.headerDesc, { color: colors.textSecondary }]}>
                  {description || t.defaultDesc}
                </Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Biometric Option */}
            {hasBiometric && allowBiometric && (
              <>
                <TouchableOpacity
                  style={[styles.biometricButton, { backgroundColor: '#3b82f620', borderColor: '#3b82f630' }]}
                  onPress={verifyWithBiometric}
                  disabled={processing}
                >
                  <Text style={styles.biometricIcon}>👆</Text>
                  <Text style={[styles.biometricText, { color: '#3b82f6' }]}>
                    {processing ? t.waiting : t.verifyWithBiometric}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t.or}</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>
              </>
            )}

            {/* Code Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {useBackupCode ? t.backupCode : t.verificationCode}
              </Text>
              <TextInput
                ref={inputRef}
                style={[styles.codeInput, { 
                  backgroundColor: colors.surface, 
                  borderColor: error ? colors.danger : colors.border,
                  color: colors.text,
                }]}
                value={code}
                onChangeText={(text) => {
                  const val = text.replace(/\D/g, '');
                  setCode(val.slice(0, useBackupCode ? 8 : 6));
                  setError(null);
                }}
                placeholder={useBackupCode ? '00000000' : '000000'}
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={useBackupCode ? 8 : 6}
                textAlign="center"
                editable={!processing}
              />
            </View>

            {/* Toggle Backup Code */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
                setError(null);
              }}
            >
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                {useBackupCode ? t.useAuthCode : t.useBackupCode}
              </Text>
            </TouchableOpacity>

            {/* Error */}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                {remainingAttempts !== null && (
                  <Text style={[styles.attemptsText, { color: colors.danger }]}>
                    {t.remainingAttempts}: {remainingAttempts}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={onCancel}
              disabled={processing}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.verifyButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: (useBackupCode ? code.length !== 8 : code.length !== 6) || processing ? 0.5 : 1,
                }
              ]}
              onPress={verify}
              disabled={(useBackupCode ? code.length !== 8 : code.length !== 6) || processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>{t.verify}</Text>
              )}
            </TouchableOpacity>
          </View>
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
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  biometricIcon: {
    fontSize: 24,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
  },
  inputContainer: {
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
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 13,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
  },
  attemptsText: {
    fontSize: 11,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
