// components/QRLoginScanner.tsx
// Scan QR code from web to approve login

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const translations = {
  tr: {
    title: 'QR ile Giriş',
    subtitle: 'Web\'de gösterilen QR kodu tarayın',
    scanning: 'Taranıyor...',
    approving: 'Onaylanıyor...',
    success: 'Giriş onaylandı!',
    successDesc: 'Web tarayıcınızda otomatik giriş yapılacak',
    error: 'Hata',
    invalidQR: 'Geçersiz QR kod',
    expired: 'QR kod süresi dolmuş',
    cancel: 'İptal',
    done: 'Tamam',
    permissionTitle: 'Kamera İzni',
    permissionDesc: 'QR kod taramak için kamera izni gerekli',
    grantPermission: 'İzin Ver',
  },
  en: {
    title: 'QR Login',
    subtitle: 'Scan the QR code shown on web',
    scanning: 'Scanning...',
    approving: 'Approving...',
    success: 'Login approved!',
    successDesc: 'You will be logged in automatically on web',
    error: 'Error',
    invalidQR: 'Invalid QR code',
    expired: 'QR code expired',
    cancel: 'Cancel',
    done: 'Done',
    permissionTitle: 'Camera Permission',
    permissionDesc: 'Camera permission is required to scan QR codes',
    grantPermission: 'Grant Permission',
  },
  de: {
    title: 'QR-Anmeldung',
    subtitle: 'Scannen Sie den QR-Code auf dem Web',
    scanning: 'Scannen...',
    approving: 'Genehmigen...',
    success: 'Anmeldung genehmigt!',
    successDesc: 'Sie werden automatisch im Web angemeldet',
    error: 'Fehler',
    invalidQR: 'Ungültiger QR-Code',
    expired: 'QR-Code abgelaufen',
    cancel: 'Abbrechen',
    done: 'Fertig',
    permissionTitle: 'Kameraberechtigung',
    permissionDesc: 'Kameraberechtigung erforderlich',
    grantPermission: 'Erlauben',
  },
  fr: {
    title: 'Connexion QR',
    subtitle: 'Scannez le code QR affiché sur le web',
    scanning: 'Scan en cours...',
    approving: 'Approbation...',
    success: 'Connexion approuvée!',
    successDesc: 'Vous serez connecté automatiquement sur le web',
    error: 'Erreur',
    invalidQR: 'Code QR invalide',
    expired: 'Code QR expiré',
    cancel: 'Annuler',
    done: 'Terminé',
    permissionTitle: 'Permission caméra',
    permissionDesc: 'Permission caméra requise',
    grantPermission: 'Autoriser',
  },
  ar: {
    title: 'تسجيل QR',
    subtitle: 'امسح رمز QR المعروض على الويب',
    scanning: 'جاري المسح...',
    approving: 'جاري الموافقة...',
    success: 'تمت الموافقة!',
    successDesc: 'سيتم تسجيل دخولك تلقائياً',
    error: 'خطأ',
    invalidQR: 'رمز QR غير صالح',
    expired: 'انتهت صلاحية رمز QR',
    cancel: 'إلغاء',
    done: 'تم',
    permissionTitle: 'إذن الكاميرا',
    permissionDesc: 'مطلوب إذن الكاميرا',
    grantPermission: 'السماح',
  },
  ru: {
    title: 'QR Вход',
    subtitle: 'Отсканируйте QR-код на веб-сайте',
    scanning: 'Сканирование...',
    approving: 'Подтверждение...',
    success: 'Вход подтверждён!',
    successDesc: 'Вы будете автоматически авторизованы',
    error: 'Ошибка',
    invalidQR: 'Недействительный QR-код',
    expired: 'QR-код истёк',
    cancel: 'Отмена',
    done: 'Готово',
    permissionTitle: 'Разрешение камеры',
    permissionDesc: 'Требуется разрешение камеры',
    grantPermission: 'Разрешить',
  },
};

type ScanStatus = 'scanning' | 'approving' | 'success' | 'error';

export default function QRLoginScanner({ visible, onClose }: Props) {
  const { language, walletAddress, theme } = useStore();
  const t = translations[language as keyof typeof translations] || translations.en;
  const isDark = theme === 'dark';
  
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [error, setError] = useState<string>('');
  const [scanned, setScanned] = useState(false);

  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: '#eab308',
    success: '#10b981',
    danger: '#ef4444',
  };

  useEffect(() => {
    if (visible) {
      setStatus('scanning');
      setScanned(false);
      setError('');
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || status !== 'scanning') return;
    
    setScanned(true);
    Vibration.vibrate(100);

    try {
      // Parse QR data - handle both JSON and plain text
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        // If not JSON, show invalid QR error
        throw new Error(t.invalidQR);
      }
      
      if (qrData.type !== 'auxite_login' || !qrData.sessionId) {
        throw new Error(t.invalidQR);
      }

      // Check if expired
      if (qrData.expiresAt && Date.now() > qrData.expiresAt) {
        throw new Error(t.expired);
      }

      setStatus('approving');

      // Send approval to backend
      const res = await fetch(`${API_URL}/api/auth/qr-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: qrData.sessionId,
          walletAddress,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || t.error);
      }

      setStatus('success');
      Vibration.vibrate([0, 100, 100, 100]);

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('QR Login error:', err);
      setError(err.message || t.error);
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setStatus('scanning');
    setScanned(false);
    setError('');
  };

  // Permission not granted
  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <View style={styles.permissionContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="camera" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>{t.permissionTitle}</Text>
            <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>{t.permissionDesc}</Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>{t.grantPermission}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Scanner or Result */}
        {status === 'scanning' ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
            <View style={styles.scanInfo}>
              <Text style={[styles.subtitle, { color: '#fff' }]}>{t.subtitle}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {status === 'approving' && (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.resultText, { color: colors.text }]}>{t.approving}</Text>
              </>
            )}

            {status === 'success' && (
              <>
                <View style={[styles.resultIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>
                <Text style={[styles.resultText, { color: colors.text }]}>{t.success}</Text>
                <Text style={[styles.resultDesc, { color: colors.textSecondary }]}>{t.successDesc}</Text>
              </>
            )}

            {status === 'error' && (
              <>
                <View style={[styles.resultIcon, { backgroundColor: colors.danger + '20' }]}>
                  <Ionicons name="close-circle" size={64} color={colors.danger} />
                </View>
                <Text style={[styles.resultText, { color: colors.danger }]}>{error || t.error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryButtonText}>{t.cancel}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Bottom Cancel */}
        {status === 'scanning' && (
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Text style={[styles.bottomButtonText, { color: colors.text }]}>{t.cancel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  scannerContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#eab308',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanInfo: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  subtitle: { fontSize: 16, textAlign: 'center' },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultText: { fontSize: 20, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  resultDesc: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  bottomButton: {
    margin: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomButtonText: { fontSize: 16, fontWeight: '600' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  permissionDesc: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  cancelButton: { padding: 12 },
  cancelButtonText: { fontSize: 16 },
});
