// components/security/BiometricSetup.tsx
// Biyometrik Doğrulama Kurulum ve Yönetimi (Touch ID / Face ID)
// expo-local-authentication kullanarak mobil için optimize edildi
// TR/EN | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// 🔒 SECURITY: Kriptografik olarak güvenli credential ID oluşturma
async function generateSecureCredentialId(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const API_BASE_URL = API_URL;
const BIOMETRIC_KEY = 'auxite_biometric_enabled';
const BIOMETRIC_CREDENTIAL_KEY = 'auxite_biometric_credential';

interface Props {
  onStatusChange?: () => void;
}

interface BiometricDevice {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastUsed?: string;
}

const translations = {
  tr: {
    title: 'Biyometrik Doğrulama',
    subtitle: 'Touch ID veya Face ID ile giriş',
    enabled: 'Aktif',
    disabled: 'Kapalı',
    enable: 'Aktifleştir',
    disable: 'Kapat',
    loading: 'Yükleniyor...',
    notSupported: 'Desteklenmiyor',
    notSupportedDesc: 'Bu cihaz biyometrik doğrulamayı desteklemiyor. Lütfen Touch ID veya Face ID destekleyen bir cihaz kullanın.',
    noEnrolled: 'Biyometrik Kayıtlı Değil',
    noEnrolledDesc: 'Cihazınızda kayıtlı parmak izi veya yüz tanıma bulunamadı. Lütfen cihaz ayarlarından biyometrik kimlik ekleyin.',
    whatIsBiometric: 'Biyometrik Nedir?',
    whatIsBiometricDesc: 'Biyometrik doğrulama, parmak izi veya yüz tanıma gibi yöntemlerle kimlik doğrulamanızı sağlar. Şifrelerden çok daha güvenlidir.',
    faceId: 'Face ID',
    touchId: 'Touch ID',
    fingerprint: 'Parmak İzi',
    irisRecognition: 'İris Tanıma',
    authenticateTitle: 'Kimliğinizi Doğrulayın',
    authenticateDesc: 'Biyometrik doğrulamayı aktifleştirmek için kimliğinizi doğrulayın',
    authenticateDisable: 'Biyometrik doğrulamayı kapatmak için kimliğinizi doğrulayın',
    success: 'Biyometrik doğrulama başarıyla aktifleştirildi!',
    successDisable: 'Biyometrik doğrulama kapatıldı',
    error: 'Bir hata oluştu',
    cancelled: 'İşlem iptal edildi',
    failed: 'Doğrulama başarısız',
    testBiometric: 'Test Et',
    testSuccess: 'Biyometrik doğrulama başarılı!',
    registeredDevices: 'Kayıtlı Cihazlar',
    thisDevice: 'Bu cihaz',
    remove: 'Kaldır',
    confirmRemove: 'Bu biyometrik kaydını silmek istediğinizden emin misiniz?',
    goToSettings: 'Ayarlara Git',
    securityTip: 'Güvenlik İpucu',
    securityTipDesc: 'Biyometrik doğrulama, hesabınıza hızlı ve güvenli erişim sağlar. Hassas işlemler için ek doğrulama gerekebilir.',
  },
  en: {
    title: 'Biometric Authentication',
    subtitle: 'Login with Touch ID or Face ID',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enable: 'Enable',
    disable: 'Disable',
    loading: 'Loading...',
    notSupported: 'Not Supported',
    notSupportedDesc: 'This device doesn\'t support biometric authentication. Please use a device with Touch ID or Face ID.',
    noEnrolled: 'No Biometric Enrolled',
    noEnrolledDesc: 'No fingerprint or face recognition found on your device. Please add biometric identity from device settings.',
    whatIsBiometric: 'What is Biometric?',
    whatIsBiometricDesc: 'Biometric authentication enables identity verification using fingerprint or face recognition. It\'s much more secure than passwords.',
    faceId: 'Face ID',
    touchId: 'Touch ID',
    fingerprint: 'Fingerprint',
    irisRecognition: 'Iris Recognition',
    authenticateTitle: 'Verify Your Identity',
    authenticateDesc: 'Verify your identity to enable biometric authentication',
    authenticateDisable: 'Verify your identity to disable biometric authentication',
    success: 'Biometric authentication enabled successfully!',
    successDisable: 'Biometric authentication disabled',
    error: 'An error occurred',
    cancelled: 'Operation cancelled',
    failed: 'Authentication failed',
    testBiometric: 'Test',
    testSuccess: 'Biometric authentication successful!',
    registeredDevices: 'Registered Devices',
    thisDevice: 'This device',
    remove: 'Remove',
    confirmRemove: 'Are you sure you want to remove this biometric?',
    goToSettings: 'Go to Settings',
    securityTip: 'Security Tip',
    securityTipDesc: 'Biometric authentication provides quick and secure access to your account. Additional verification may be required for sensitive operations.',
  },
};

export function BiometricSetup({ onStatusChange }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [supported, setSupported] = useState(true);
  const [enrolled, setEnrolled] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      setLoading(true);

      // Check if hardware supports biometric
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setSupported(false);
        setLoading(false);
        return;
      }

      // Check if biometric is enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setEnrolled(false);
        setLoading(false);
        return;
      }

      // Get supported authentication types
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(Platform.OS === 'ios' ? t.faceId : 'Face Recognition');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(Platform.OS === 'ios' ? t.touchId : t.fingerprint);
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType(t.irisRecognition);
      }

      // Check if already enabled
      const storedEnabled = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      setEnabled(storedEnabled === 'true');

      // Fetch registered devices from API
      await fetchDevices();

    } catch (err) {
      console.error('Biometric check error:', err);
      setSupported(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/security/biometric`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const data = await res.json();
      setDevices(data.passkeys || []);
    } catch (err) {
      console.error('Fetch devices error:', err);
    }
  };

  const enableBiometric = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      // Authenticate with biometric
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.authenticateTitle,
        subtitle: t.authenticateDesc,
        cancelLabel: t.cancelled,
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error === 'user_cancel') {
          setError(t.cancelled);
        } else {
          setError(t.failed);
        }
        return;
      }

      // 🔒 SECURITY: Kriptografik olarak güvenli credential ID oluştur
      // Eski format: ${walletAddress}-${Date.now()} - tahmin edilebilir ve güvensizdi
      const credentialId = await generateSecureCredentialId();

      // Store in secure storage
      await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIAL_KEY, credentialId);

      // Register with API
      await fetch(`${API_BASE_URL}/api/security/biometric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          action: 'register',
          credentialId,
          deviceType: Platform.OS,
          biometricType,
        }),
      });

      setEnabled(true);
      setSuccess(t.success);
      onStatusChange?.();
      await fetchDevices();

    } catch (err: any) {
      console.error('Enable biometric error:', err);
      setError(err.message || t.error);
    } finally {
      setProcessing(false);
    }
  };

  const disableBiometric = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      // Authenticate first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.authenticateTitle,
        subtitle: t.authenticateDisable,
        cancelLabel: t.cancelled,
      });

      if (!result.success) {
        if (result.error === 'user_cancel') {
          setError(t.cancelled);
        } else {
          setError(t.failed);
        }
        return;
      }

      // Get stored credential
      const credentialId = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIAL_KEY);

      // Remove from secure storage
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIAL_KEY);

      // Remove from API
      if (credentialId) {
        await fetch(`${API_BASE_URL}/api/security/biometric?id=${credentialId}`, {
          method: 'DELETE',
          headers: { 'x-wallet-address': walletAddress },
        });
      }

      setEnabled(false);
      setSuccess(t.successDisable);
      onStatusChange?.();
      await fetchDevices();

    } catch (err: any) {
      console.error('Disable biometric error:', err);
      setError(err.message || t.error);
    } finally {
      setProcessing(false);
    }
  };

  const testBiometric = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.testBiometric,
        cancelLabel: t.cancelled,
      });

      if (result.success) {
        setSuccess(t.testSuccess);
      } else {
        setError(t.failed);
      }
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setProcessing(false);
    }
  };

  const getBiometricIcon = () => {
    if (biometricType.includes('Face')) return '😊';
    if (biometricType.includes('Touch') || biometricType.includes('Finger')) return '👆';
    return '🔐';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not Supported
  if (!supported) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.warning + '10' }]}>
        <Text style={styles.bigIcon}>🚫</Text>
        <Text style={[styles.title, { color: colors.warning }]}>{t.notSupported}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{t.notSupportedDesc}</Text>
      </View>
    );
  }

  // No Biometric Enrolled
  if (!enrolled) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.warning + '10' }]}>
        <Text style={styles.bigIcon}>☝️</Text>
        <Text style={[styles.title, { color: colors.warning }]}>{t.noEnrolled}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{t.noEnrolledDesc}</Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            // This will open device settings on iOS/Android
            if (Platform.OS === 'ios') {
              // iOS doesn't have a direct way to open biometric settings
              Alert.alert(t.goToSettings, t.noEnrolledDesc);
            }
          }}
        >
          <Text style={styles.settingsButtonText}>{t.goToSettings}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Status Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <View style={[
              styles.statusIcon, 
              { backgroundColor: enabled ? colors.primary + '20' : colors.surface }
            ]}>
              <Text style={styles.statusIconText}>{getBiometricIcon()}</Text>
            </View>
            <View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>{t.title}</Text>
              <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
                {biometricType}
              </Text>
              <Text style={[
                styles.statusValue, 
                { color: enabled ? colors.primary : colors.textSecondary }
              ]}>
                {enabled ? t.enabled : t.disabled}
              </Text>
            </View>
          </View>

          {enabled ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
              onPress={disableBiometric}
              disabled={processing}
            >
              <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                {processing ? t.loading : t.disable}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={enableBiometric}
              disabled={processing}
            >
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                {processing ? t.loading : t.enable}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      {error && (
        <View style={[styles.messageBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
          <Text style={[styles.messageText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={[styles.messageBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.messageText, { color: colors.primary }]}>{success}</Text>
        </View>
      )}

      {/* Registered Devices */}
      {enabled && devices.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.devicesHeader}>
            <Text style={[styles.devicesTitle, { color: colors.text }]}>{t.registeredDevices}</Text>
            <TouchableOpacity onPress={testBiometric} disabled={processing}>
              <Text style={[styles.testButton, { color: colors.primary }]}>{t.testBiometric}</Text>
            </TouchableOpacity>
          </View>

          {devices.map((device) => (
            <View 
              key={device.id} 
              style={[styles.deviceItem, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}
            >
              <View style={styles.deviceInfo}>
                <View style={[styles.deviceIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={styles.deviceIconText}>🔑</Text>
                </View>
                <View>
                  <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                  <Text style={[styles.deviceDate, { color: colors.textSecondary }]}>
                    {new Date(device.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={[styles.thisDeviceBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.thisDeviceText, { color: colors.primary }]}>{t.thisDevice}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: '#3b82f610', borderColor: '#3b82f630' }]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoIconText}>ℹ️</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: '#3b82f6' }]}>{t.whatIsBiometric}</Text>
          <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{t.whatIsBiometricDesc}</Text>
        </View>
      </View>

      {/* Security Tip */}
      <View style={[styles.infoCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoIconText}>💡</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.warning }]}>{t.securityTip}</Text>
          <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{t.securityTipDesc}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  centerContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  bigIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    flex: 1,
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
  statusSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  messageBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 13,
  },
  devicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  devicesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    fontSize: 12,
    fontWeight: '500',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconText: {
    fontSize: 18,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviceDate: {
    fontSize: 11,
    marginTop: 2,
  },
  thisDeviceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  thisDeviceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
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
});
