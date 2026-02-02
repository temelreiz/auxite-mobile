// components/CrossAuthModal.tsx
// Cross-Platform Auth Modal
// Handles: QR Scanning, Auth Confirmation, Web Login Approval

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '@/stores/useStore';
import { useCrossAuth } from '@/hooks/useCrossAuth';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

// Translations
const translations: Record<string, Record<string, string>> = {
  tr: {
    scanQR: 'QR Kodu Tara',
    scanToLogin: 'Web oturumuna giriş yapmak için QR kodu tarayın',
    authRequest: 'Giriş İsteği',
    webWantsAccess: 'Web tarayıcısı hesabınıza erişmek istiyor',
    approve: 'Onayla',
    reject: 'Reddet',
    cancel: 'İptal',
    openInWeb: "Web'de Aç",
    openingWeb: 'Web açılıyor...',
    success: 'Başarılı!',
    webLoggedIn: 'Web oturumu açıldı',
    error: 'Hata',
    tryAgain: 'Tekrar Dene',
    camera: 'Kamera',
    cameraPermission: 'QR kodu taramak için kamera izni gerekli',
    grantPermission: 'İzin Ver',
    device: 'Cihaz',
    browser: 'Tarayıcı',
    location: 'Konum',
    time: 'Zaman',
    confirmLogin: 'Girişi Onayla',
    confirmLoginDesc: 'Bu cihazdan web oturumu açılacak',
    processing: 'İşleniyor...',
    done: 'Tamam',
  },
  en: {
    scanQR: 'Scan QR Code',
    scanToLogin: 'Scan QR code to login to web session',
    authRequest: 'Login Request',
    webWantsAccess: 'Web browser wants to access your account',
    approve: 'Approve',
    reject: 'Reject',
    cancel: 'Cancel',
    openInWeb: 'Open in Web',
    openingWeb: 'Opening web...',
    success: 'Success!',
    webLoggedIn: 'Web session logged in',
    error: 'Error',
    tryAgain: 'Try Again',
    camera: 'Camera',
    cameraPermission: 'Camera permission is required to scan QR code',
    grantPermission: 'Grant Permission',
    device: 'Device',
    browser: 'Browser',
    location: 'Location',
    time: 'Time',
    confirmLogin: 'Confirm Login',
    confirmLoginDesc: 'Web session will be opened from this device',
    processing: 'Processing...',
    done: 'Done',
  },
};

type ModalMode = 'scan' | 'confirm' | 'success' | 'error' | 'loading';

interface CrossAuthModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'scan' | 'openWeb';
}

export function CrossAuthModal({ visible, onClose, mode = 'scan' }: CrossAuthModalProps) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;

  const {
    pendingAuthRequest,
    currentPairingSession,
    isLoading,
    error,
    scanQRAndLogin,
    confirmWebLogin,
    openInWeb,
    clearPendingAuth,
    clearError,
  } = useCrossAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [currentMode, setCurrentMode] = useState<ModalMode>('scan');
  const [scanned, setScanned] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setScanned(false);
      clearError();
      
      if (mode === 'openWeb') {
        handleOpenInWeb();
      } else {
        setCurrentMode('scan');
      }
    }
  }, [visible, mode]);

  // Handle pending auth request
  useEffect(() => {
    if (pendingAuthRequest) {
      setCurrentMode('confirm');
    }
  }, [pendingAuthRequest]);

  // Handle pairing session confirmation
  useEffect(() => {
    if (currentPairingSession?.status === 'confirmed') {
      setCurrentMode('success');
    }
  }, [currentPairingSession]);

  // Handle error
  useEffect(() => {
    if (error) {
      setCurrentMode('error');
    }
  }, [error]);

  // Handle QR code scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setCurrentMode('loading');

    const success = await scanQRAndLogin(data);
    
    if (success) {
      setCurrentMode('confirm');
    } else {
      setCurrentMode('error');
    }
  };

  // Handle confirm/reject
  const handleConfirm = async (approve: boolean) => {
    setCurrentMode('loading');
    const success = await confirmWebLogin(approve);
    
    if (success && approve) {
      setCurrentMode('success');
    } else if (!approve) {
      onClose();
    } else {
      setCurrentMode('error');
    }
  };

  // Handle open in web
  const handleOpenInWeb = async () => {
    setCurrentMode('loading');
    await openInWeb('/');
    setCurrentMode('success');
    setTimeout(onClose, 1500);
  };

  // Handle close
  const handleClose = () => {
    clearPendingAuth();
    clearError();
    onClose();
  };

  // Render camera permission request
  const renderPermissionRequest = () => (
    <View style={styles.centerContent}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <Ionicons name="camera" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
      </View>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{t.camera}</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {t.cameraPermission}
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={requestPermission}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>{t.grantPermission}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render QR scanner
  const renderScanner = () => (
    <View style={styles.scannerContainer}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{t.scanQR}</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {t.scanToLogin}
      </Text>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Scan overlay */}
        <View style={styles.scanOverlay}>
          <View style={[styles.scanFrame, { borderColor: '#10b981' }]}>
            <View style={[styles.cornerTL, styles.corner]} />
            <View style={[styles.cornerTR, styles.corner]} />
            <View style={[styles.cornerBL, styles.corner]} />
            <View style={[styles.cornerBR, styles.corner]} />
          </View>
        </View>
      </View>
    </View>
  );

  // Render confirmation dialog
  const renderConfirmation = () => (
    <View style={styles.centerContent}>
      <View style={[styles.iconContainer, { backgroundColor: '#3b82f620' }]}>
        <Ionicons name="desktop-outline" size={48} color="#3b82f6" />
      </View>
      
      <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{t.authRequest}</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {t.webWantsAccess}
      </Text>

      {/* Device info */}
      <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
        <View style={styles.infoRow}>
          <Ionicons name="globe-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
          <Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.browser}</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>Chrome / Windows</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
          <Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.location}</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>Istanbul, TR</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
          <Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.time}</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>
            {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.rejectButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
          onPress={() => handleConfirm(false)}
        >
          <Text style={[styles.rejectButtonText, { color: isDark ? '#ef4444' : '#dc2626' }]}>
            {t.reject}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleConfirm(true)}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.buttonGradient}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t.approve}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render loading
  const renderLoading = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {t.processing}
      </Text>
    </View>
  );

  // Render success
  const renderSuccess = () => (
    <View style={styles.centerContent}>
      <View style={[styles.iconContainer, { backgroundColor: '#10b98120' }]}>
        <Ionicons name="checkmark-circle" size={64} color="#10b981" />
      </View>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{t.success}</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {t.webLoggedIn}
      </Text>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleClose}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>{t.done}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render error
  const renderError = () => (
    <View style={styles.centerContent}>
      <View style={[styles.iconContainer, { backgroundColor: '#ef444420' }]}>
        <Ionicons name="close-circle" size={64} color="#ef4444" />
      </View>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{t.error}</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {error || 'Something went wrong'}
      </Text>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          clearError();
          setScanned(false);
          setCurrentMode('scan');
        }}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>{t.tryAgain}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render content based on mode
  const renderContent = () => {
    if (currentMode === 'loading' || isLoading) {
      return renderLoading();
    }

    if (currentMode === 'success') {
      return renderSuccess();
    }

    if (currentMode === 'error') {
      return renderError();
    }

    if (currentMode === 'confirm' || pendingAuthRequest || currentPairingSession) {
      return renderConfirmation();
    }

    // Scan mode - check camera permission
    if (!permission?.granted) {
      return renderPermissionRequest();
    }

    return renderScanner();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 16,
  },

  // Scanner
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  cameraContainer: {
    width: SCAN_SIZE + 40,
    height: SCAN_SIZE + 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderWidth: 2,
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10b981',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },

  // Info card
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Buttons
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
});

export default CrossAuthModal;
