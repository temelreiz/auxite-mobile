// components/WalletModals.tsx
// Withdraw, Receive, Send Modals with QR Scanner
// Updated: QR Scanner added to SendModal

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';
import { TwoFactorGate } from '@/components/security';

// ============================================
// TYPES
// ============================================
type WithdrawCrypto = 'USDT' | 'BTC' | 'ETH' | 'XRP' | 'SOL';

interface CryptoInfo {
  name: string;
  icon: string;
  color: string;
  network: string;
  minWithdraw: number;
  fee: number;
}

// ============================================
// CRYPTO DATA
// ============================================
const WITHDRAW_CRYPTOS: Record<WithdrawCrypto, CryptoInfo> = {
  USDT: { name: 'Tether', icon: 'cash-outline', color: '#26A17B', network: 'ERC-20 / TRC-20', minWithdraw: 10, fee: 1 },
  BTC: { name: 'Bitcoin', icon: 'logo-bitcoin', color: '#F7931A', network: 'Bitcoin', minWithdraw: 0.0005, fee: 0.0001 },
  ETH: { name: 'Ethereum', icon: 'diamond-outline', color: '#627EEA', network: 'ERC-20', minWithdraw: 0.01, fee: 0.001 },
  XRP: { name: 'Ripple', icon: 'swap-horizontal', color: '#94A3B8', network: 'XRP Ledger', minWithdraw: 1, fee: 0.1 },
  SOL: { name: 'Solana', icon: 'sunny-outline', color: '#9945FF', network: 'Solana', minWithdraw: 0.1, fee: 0.01 },
};

// Supported tokens for receive/send
const SUPPORTED_TOKENS = [
  { symbol: 'AUXG', name: 'Gold', color: '#EAB308' },
  { symbol: 'AUXS', name: 'Silver', color: '#94A3B8' },
  { symbol: 'AUXPT', name: 'Platinum', color: '#CBD5E1' },
  { symbol: 'AUXPD', name: 'Palladium', color: '#64748B' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
];

// ============================================
// TRANSLATIONS
// ============================================
import { useTranslation } from '@/hooks/useTranslation';

const fallbackTranslations: Record<string, Record<string, string>> = {
  tr: {
    withdraw: 'Para Çek', withdrawSubtitle: 'AUXM\'i kripto olarak çekin', withdrawableBalance: 'Çekilebilir Bakiye',
    bonusLocked: 'Bonus (çekilemez)', auxmAmount: 'Çekilecek AUXM Miktarı', selectCrypto: 'Kripto Seçin',
    walletAddress: 'Cüzdan Adresi', network: 'Ağ', youWillReceive: 'Alacağınız', networkFee: 'Ağ Ücreti',
    netReceive: 'Net Alacak', insufficientBalance: 'Yetersiz AUXM bakiyesi', minimum: 'Minimum çekim',
    verifyAddress: 'Adresi kontrol edin. İşlem geri alınamaz.', continue: 'Devam Et', processing: 'İşleniyor...',
    confirmWithdrawal: 'Çekimi Onayla', withdrawalSuccess: 'Çekim Başlatıldı!',
    txComplete: 'İşlem 10-30 dakika içinde tamamlanacak', close: 'Kapat', destinationTag: 'Destination Tag', max: 'MAX',
    receive: 'Token Al', receiveSubtitle: 'Bu adresi paylaşarak token alabilirsiniz', yourAddress: 'Cüzdan Adresiniz',
    copy: 'Kopyala', copied: 'Kopyalandı!', share: 'Paylaş', supportedTokens: 'Desteklenen Tokenlar',
    warning: 'Sadece desteklenen tokenları bu adrese gönderin.', selectNetwork: 'Ağ Seçin',
    send: 'Gönder', sendSubtitle: 'Token gönderin', selectToken: 'Token Seç', recipientAddress: 'Alıcı Adresi',
    amount: 'Miktar', balance: 'Bakiye', sendToken: 'Gönder', confirmSend: 'Gönderimi Onayla',
    sendSuccess: 'Gönderim Başarılı!', invalidAddress: 'Geçersiz adres',
    deposit: 'Yatır', depositSubtitle: 'Kripto veya fiat yatırın',
    scanQR: 'QR Tara', cameraPermission: 'Kamera izni gerekli', cameraPermissionMessage: 'QR taramak için kamera izni verin.', grantPermission: 'İzin Ver', cancel: 'İptal',
  },
  en: {
    withdraw: 'Withdraw', withdrawSubtitle: 'Withdraw AUXM as crypto', withdrawableBalance: 'Withdrawable Balance',
    bonusLocked: 'Bonus (locked)', auxmAmount: 'AUXM Amount to Withdraw', selectCrypto: 'Select Crypto',
    walletAddress: 'Wallet Address', network: 'Network', youWillReceive: 'You Will Receive', networkFee: 'Network Fee',
    netReceive: 'Net Receive', insufficientBalance: 'Insufficient AUXM balance', minimum: 'Minimum withdrawal',
    verifyAddress: 'Verify address. Transaction cannot be reversed.', continue: 'Continue', processing: 'Processing...',
    confirmWithdrawal: 'Confirm Withdrawal', withdrawalSuccess: 'Withdrawal Initiated!',
    txComplete: 'Transaction will complete in 10-30 minutes', close: 'Close', destinationTag: 'Destination Tag', max: 'MAX',
    receive: 'Receive Token', receiveSubtitle: 'Share this address to receive tokens', yourAddress: 'Your Wallet Address',
    copy: 'Copy', copied: 'Copied!', share: 'Share', supportedTokens: 'Supported Tokens',
    warning: 'Only send supported tokens to this address.', selectNetwork: 'Select Network',
    send: 'Send', sendSubtitle: 'Send tokens', selectToken: 'Select Token', recipientAddress: 'Recipient Address',
    amount: 'Amount', balance: 'Balance', sendToken: 'Send', confirmSend: 'Confirm Send',
    sendSuccess: 'Send Successful!', invalidAddress: 'Invalid address',
    deposit: 'Deposit', depositSubtitle: 'Deposit crypto or fiat',
    scanQR: 'Scan QR', cameraPermission: 'Camera Permission Required', cameraPermissionMessage: 'Grant camera permission to scan QR.', grantPermission: 'Grant Permission', cancel: 'Cancel',
  },
  de: {
    withdraw: 'Abheben', withdrawSubtitle: 'AUXM als Krypto abheben', withdrawableBalance: 'Verfügbares Guthaben',
    bonusLocked: 'Bonus (gesperrt)', auxmAmount: 'AUXM Betrag', selectCrypto: 'Krypto wählen',
    walletAddress: 'Wallet Adresse', network: 'Netzwerk', youWillReceive: 'Sie erhalten', networkFee: 'Netzwerkgebühr',
    netReceive: 'Netto Empfang', insufficientBalance: 'Unzureichendes Guthaben', minimum: 'Mindestabhebung',
    verifyAddress: 'Adresse prüfen.', continue: 'Weiter', processing: 'Verarbeitung...',
    confirmWithdrawal: 'Abhebung bestätigen', withdrawalSuccess: 'Abhebung eingeleitet!',
    txComplete: 'Transaktion in 10-30 Minuten', close: 'Schließen', destinationTag: 'Destination Tag', max: 'MAX',
    receive: 'Token empfangen', receiveSubtitle: 'Teilen Sie diese Adresse', yourAddress: 'Ihre Wallet Adresse',
    copy: 'Kopieren', copied: 'Kopiert!', share: 'Teilen', supportedTokens: 'Unterstützte Token',
    warning: 'Nur unterstützte Token senden.', selectNetwork: 'Netzwerk wählen',
    send: 'Senden', sendSubtitle: 'Token senden', selectToken: 'Token wählen', recipientAddress: 'Empfängeradresse',
    amount: 'Betrag', balance: 'Guthaben', sendToken: 'Senden', confirmSend: 'Senden bestätigen',
    sendSuccess: 'Erfolgreich gesendet!', invalidAddress: 'Ungültige Adresse',
    deposit: 'Einzahlen', depositSubtitle: 'Krypto oder Fiat einzahlen',
    scanQR: 'QR scannen', cameraPermission: 'Kameraberechtigung', cameraPermissionMessage: 'Kamerazugriff erlauben.', grantPermission: 'Erlauben', cancel: 'Abbrechen',
  },
  fr: {
    withdraw: 'Retirer', withdrawSubtitle: 'Retirer AUXM en crypto', withdrawableBalance: 'Solde retirable',
    bonusLocked: 'Bonus (verrouillé)', auxmAmount: 'Montant AUXM', selectCrypto: 'Sélectionner crypto',
    walletAddress: 'Adresse du portefeuille', network: 'Réseau', youWillReceive: 'Vous recevrez', networkFee: 'Frais réseau',
    netReceive: 'Net reçu', insufficientBalance: 'Solde insuffisant', minimum: 'Retrait minimum',
    verifyAddress: 'Vérifiez l\'adresse.', continue: 'Continuer', processing: 'Traitement...',
    confirmWithdrawal: 'Confirmer le retrait', withdrawalSuccess: 'Retrait initié!',
    txComplete: 'Transaction en 10-30 minutes', close: 'Fermer', destinationTag: 'Destination Tag', max: 'MAX',
    receive: 'Recevoir', receiveSubtitle: 'Partagez cette adresse', yourAddress: 'Votre adresse',
    copy: 'Copier', copied: 'Copié!', share: 'Partager', supportedTokens: 'Tokens supportés',
    warning: 'Envoyez uniquement des tokens supportés.', selectNetwork: 'Sélectionner réseau',
    send: 'Envoyer', sendSubtitle: 'Envoyer des tokens', selectToken: 'Sélectionner token', recipientAddress: 'Adresse destinataire',
    amount: 'Montant', balance: 'Solde', sendToken: 'Envoyer', confirmSend: 'Confirmer envoi',
    sendSuccess: 'Envoi réussi!', invalidAddress: 'Adresse invalide',
    deposit: 'Déposer', depositSubtitle: 'Déposer crypto ou fiat',
    scanQR: 'Scanner QR', cameraPermission: 'Permission caméra', cameraPermissionMessage: 'Autoriser la caméra.', grantPermission: 'Autoriser', cancel: 'Annuler',
  },
  ar: {
    withdraw: 'سحب', withdrawSubtitle: 'سحب AUXM كعملة مشفرة', withdrawableBalance: 'الرصيد القابل للسحب',
    bonusLocked: 'مكافأة (مقفل)', auxmAmount: 'كمية AUXM', selectCrypto: 'اختر العملة',
    walletAddress: 'عنوان المحفظة', network: 'الشبكة', youWillReceive: 'ستتلقى', networkFee: 'رسوم الشبكة',
    netReceive: 'صافي الاستلام', insufficientBalance: 'رصيد غير كافٍ', minimum: 'الحد الأدنى للسحب',
    verifyAddress: 'تحقق من العنوان.', continue: 'متابعة', processing: 'جارٍ المعالجة...',
    confirmWithdrawal: 'تأكيد السحب', withdrawalSuccess: 'تم بدء السحب!',
    txComplete: 'ستكتمل المعاملة خلال 10-30 دقيقة', close: 'إغلاق', destinationTag: 'علامة الوجهة', max: 'الحد الأقصى',
    receive: 'استلام', receiveSubtitle: 'شارك هذا العنوان', yourAddress: 'عنوان محفظتك',
    copy: 'نسخ', copied: 'تم النسخ!', share: 'مشاركة', supportedTokens: 'الرموز المدعومة',
    warning: 'أرسل فقط الرموز المدعومة.', selectNetwork: 'اختر الشبكة',
    send: 'إرسال', sendSubtitle: 'إرسال الرموز', selectToken: 'اختر الرمز', recipientAddress: 'عنوان المستلم',
    amount: 'المبلغ', balance: 'الرصيد', sendToken: 'إرسال', confirmSend: 'تأكيد الإرسال',
    sendSuccess: 'تم الإرسال بنجاح!', invalidAddress: 'عنوان غير صالح',
    deposit: 'إيداع', depositSubtitle: 'إيداع العملات المشفرة أو النقدية',
    scanQR: 'مسح QR', cameraPermission: 'إذن الكاميرا', cameraPermissionMessage: 'السماح بالكاميرا.', grantPermission: 'السماح', cancel: 'إلغاء',
  },
  ru: {
    withdraw: 'Вывод', withdrawSubtitle: 'Вывести AUXM как криптовалюту', withdrawableBalance: 'Доступный баланс',
    bonusLocked: 'Бонус (заблокирован)', auxmAmount: 'Сумма AUXM', selectCrypto: 'Выберите криптовалюту',
    walletAddress: 'Адрес кошелька', network: 'Сеть', youWillReceive: 'Вы получите', networkFee: 'Комиссия сети',
    netReceive: 'Чистый доход', insufficientBalance: 'Недостаточно средств', minimum: 'Минимальный вывод',
    verifyAddress: 'Проверьте адрес.', continue: 'Продолжить', processing: 'Обработка...',
    confirmWithdrawal: 'Подтвердить вывод', withdrawalSuccess: 'Вывод начат!',
    txComplete: 'Транзакция завершится через 10-30 минут', close: 'Закрыть', destinationTag: 'Destination Tag', max: 'МАКС',
    receive: 'Получить', receiveSubtitle: 'Поделитесь этим адресом', yourAddress: 'Ваш адрес',
    copy: 'Копировать', copied: 'Скопировано!', share: 'Поделиться', supportedTokens: 'Поддерживаемые токены',
    warning: 'Отправляйте только поддерживаемые токены.', selectNetwork: 'Выберите сеть',
    send: 'Отправить', sendSubtitle: 'Отправить токены', selectToken: 'Выберите токен', recipientAddress: 'Адрес получателя',
    amount: 'Сумма', balance: 'Баланс', sendToken: 'Отправить', confirmSend: 'Подтвердить отправку',
    sendSuccess: 'Успешно отправлено!', invalidAddress: 'Неверный адрес',
    deposit: 'Депозит', depositSubtitle: 'Внести криптовалюту или фиат',
    scanQR: 'Сканировать', cameraPermission: 'Разрешение камеры', cameraPermissionMessage: 'Разрешить камеру.', grantPermission: 'Разрешить', cancel: 'Отмена',
  },
};

function getWalletTranslations(lang: string) {
  return fallbackTranslations[lang] || fallbackTranslations.en;
}

// ============================================
// QR SCANNER COMPONENT
// ============================================
interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isDark: boolean;
  t: any;
}

function QRScanner({ onScan, onClose, isDark, t }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // Parse crypto address from QR (handles formats like "ethereum:0x..." or just address)
    let address = data;
    if (data.includes(':')) {
      const parts = data.split(':');
      address = parts[1]?.split('?')[0] || data;
    }
    
    onScan(address);
  };

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    primary: '#10B981',
  };

  if (!permission) {
    return (
      <View style={[styles.scannerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.scannerContainer, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>{t.cameraPermission}</Text>
          <Text style={[styles.permissionMessage, { color: colors.textSecondary }]}>{t.cameraPermissionMessage}</Text>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t.grantPermission}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelScanButton} onPress={onClose}>
            <Text style={[styles.cancelScanText, { color: colors.textSecondary }]}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Overlay */}
      <View style={styles.scannerOverlay}>
        <View style={styles.overlaySection} />
        <View style={styles.middleRow}>
          <View style={styles.overlaySection} />
          <View style={styles.scanFrame}>
            <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
            <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
            <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
            <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
          </View>
          <View style={styles.overlaySection} />
        </View>
        <View style={styles.overlaySection}>
          <Text style={styles.scanHint}>{t.scanQR}</Text>
        </View>
      </View>
      
      {/* Close Button */}
      <TouchableOpacity style={styles.closeScannerButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// RECEIVE MODAL
// ============================================
interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
}

export function ReceiveModal({ visible, onClose, walletAddress }: ReceiveModalProps) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = getWalletTranslations(language);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `My Auxite Wallet Address: ${walletAddress}` });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1e293b' }]}>{t.receive}</Text>
              <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.receiveSubtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#1e293b'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* QR Code placeholder */}
            <View style={[styles.qrContainer, { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 }]}>
              <View style={{ width: 180, height: 180, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="qr-code" size={120} color="#1e293b" />
              </View>
            </View>

            {/* Address */}
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8 }}>{t.yourAddress}</Text>
            <View style={[styles.addressBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <Text style={{ color: isDark ? '#fff' : '#1e293b', fontFamily: 'monospace', fontSize: 12 }}>{walletAddress}</Text>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity 
                onPress={handleCopy}
                style={[styles.actionBtn, { flex: 1, backgroundColor: copied ? '#10b981' : (isDark ? '#334155' : '#f1f5f9') }]}
              >
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? '#fff' : (isDark ? '#fff' : '#1e293b')} />
                <Text style={{ color: copied ? '#fff' : (isDark ? '#fff' : '#1e293b'), marginLeft: 8 }}>{copied ? t.copied : t.copy}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleShare}
                style={[styles.actionBtn, { flex: 1, backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              >
                <Ionicons name="share-outline" size={20} color={isDark ? '#fff' : '#1e293b'} />
                <Text style={{ color: isDark ? '#fff' : '#1e293b', marginLeft: 8 }}>{t.share}</Text>
              </TouchableOpacity>
            </View>

            {/* Supported Tokens */}
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 24, marginBottom: 12 }}>{t.supportedTokens}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SUPPORTED_TOKENS.map(token => (
                <View key={token.symbol} style={[styles.tokenBadge, { backgroundColor: token.color + '20' }]}>
                  <View style={[styles.tokenDot, { backgroundColor: token.color }]} />
                  <Text style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 12 }}>{token.symbol}</Text>
                </View>
              ))}
            </View>

            {/* Warning */}
            <View style={[styles.warningBox, { backgroundColor: '#fef3c7', marginTop: 20 }]}>
              <Ionicons name="warning-outline" size={20} color="#d97706" />
              <Text style={{ color: '#92400e', marginLeft: 8, flex: 1, fontSize: 12 }}>{t.warning}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// SEND MODAL (with QR Scanner)
// ============================================
interface SendModalProps {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
}

export function SendModal({ visible, onClose, walletAddress }: SendModalProps) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress: storeWallet } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = getWalletTranslations(language);

  const METAL_TOKENS = ['AUXG', 'AUXS', 'AUXPT', 'AUXPD'];
  const TRANSFERABLE_TOKENS = [
    { symbol: 'AUXG', name: 'Gold', icon: 'ellipse', color: '#F59E0B', isMetal: true },
    { symbol: 'AUXS', name: 'Silver', icon: 'ellipse', color: '#94A3B8', isMetal: true },
    { symbol: 'AUXPT', name: 'Platinum', icon: 'ellipse', color: '#CBD5E1', isMetal: true },
    { symbol: 'AUXPD', name: 'Palladium', icon: 'ellipse', color: '#64748B', isMetal: true },
    { symbol: 'ETH', name: 'Ethereum', icon: 'diamond-outline', color: '#627EEA', isMetal: false },
    { symbol: 'BTC', name: 'Bitcoin', icon: 'logo-bitcoin', color: '#F7931A', isMetal: false },
    { symbol: 'USDT', name: 'Tether', icon: 'cash-outline', color: '#26A17B', isMetal: false },
    { symbol: 'XRP', name: 'Ripple', icon: 'swap-horizontal', color: '#94A3B8', isMetal: false },
    { symbol: 'SOL', name: 'Solana', icon: 'sunny-outline', color: '#9945FF', isMetal: false },
  ];

  const [selectedToken, setSelectedToken] = useState(TRANSFERABLE_TOKENS[0]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | '2fa' | 'processing' | 'success' | 'error' | 'scanner'>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [onChainBalances, setOnChainBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(false);
  const [recipientValid, setRecipientValid] = useState<boolean | null>(null);

  const address = walletAddress || storeWallet;
  const API_BASE_URL = API_URL;
  const isMetal = METAL_TOKENS.includes(selectedToken.symbol);

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    setLoadingBalances(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/balance?address=${address}`);
      const data = await res.json();
      console.log('📊 SendModal - Balance API response:', {
        balances: data.balances,
        onChainBalances: data.onChainBalances,
        eth_balance: data.balances?.eth,
        eth_onchain: data.onChainBalances?.eth,
      });
      if (data.success && data.balances) {
        const newBalances = {
          AUXG: data.balances.auxg || 0,
          AUXS: data.balances.auxs || 0,
          AUXPT: data.balances.auxpt || 0,
          AUXPD: data.balances.auxpd || 0,
          AUXM: (data.balances.auxm || 0) + (data.balances.bonusAuxm || 0),
          ETH: data.balances.eth || 0,
          BTC: data.balances.btc || 0,
          XRP: data.balances.xrp || 0,
          SOL: data.balances.sol || 0,
          USDT: data.balances.usdt || 0,
        };
        setBalances(newBalances);
        console.log('📊 SendModal - Set balances:', newBalances);

        if (data.onChainBalances) {
          const newOnChain = {
            AUXG: data.onChainBalances.auxg || 0,
            AUXS: data.onChainBalances.auxs || 0,
            AUXPT: data.onChainBalances.auxpt || 0,
            AUXPD: data.onChainBalances.auxpd || 0,
            ETH: data.onChainBalances.eth || 0,
            USDT: data.onChainBalances.usdt || 0,
          };
          setOnChainBalances(newOnChain);
          console.log('📊 SendModal - Set onChainBalances:', newOnChain);
        }
      }
    } catch (e) {
      console.error('Balance fetch error:', e);
    } finally {
      setLoadingBalances(false);
    }
  }, [address, API_BASE_URL]);

  // Check if recipient is valid Auxite user (for metal transfers)
  useEffect(() => {
    const checkRecipient = async () => {
      if (!isMetal) {
        setRecipientValid(null);
        return;
      }
      
      const hasValidAddress = recipientAddress.length >= 42 && recipientAddress.startsWith('0x');
      if (!hasValidAddress) {
        setRecipientValid(null);
        return;
      }

      setIsCheckingRecipient(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/check?address=${recipientAddress}`);
        const data = await res.json();
        setRecipientValid(data.exists === true);
      } catch (e) {
        setRecipientValid(false);
      } finally {
        setIsCheckingRecipient(false);
      }
    };

    checkRecipient();
  }, [visible, recipientAddress, isMetal]);

  useEffect(() => {
    if (visible) {
      fetchBalances();
      setStep('input');
      setAmount('');
      setRecipientAddress('');
      setErrorMessage('');
      setTxHash(null);
    }
  }, [visible, fetchBalances]);

  // Use on-chain balance for ETH and metals if available, otherwise use regular balance
  const getTokenBalance = (symbol: string): number => {
    const onChainBal = onChainBalances[symbol] || 0;
    const regularBal = balances[symbol] || 0;
    // Prefer on-chain balance for ETH and metals
    if (['ETH', 'AUXG', 'AUXS', 'AUXPT', 'AUXPD'].includes(symbol)) {
      return onChainBal > 0 ? onChainBal : regularBal;
    }
    return regularBal;
  };

  const balance = getTokenBalance(selectedToken.symbol);
  const amountNum = parseFloat(amount) || 0;
  const hasValidAddress = recipientAddress.length >= 42 && recipientAddress.startsWith('0x');
  const canAfford = amountNum > 0 && amountNum <= balance;
  const canSend = hasValidAddress && canAfford && (!isMetal || recipientValid === true);

  const handleMaxClick = () => {
    setAmount(balance.toString());
  };

  const handleQRScan = (scannedAddress: string) => {
    setRecipientAddress(scannedAddress);
    setStep('input');
  };

  const handleSend = async () => {
    setStep('2fa');
  };

  const executeTransfer = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      // All transfers use the same endpoint
      const res = await fetch(`${API_BASE_URL}/api/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: address,
          toAddress: recipientAddress,
          token: selectedToken.symbol,
          amount: amountNum,
          // For metals, also send grams for backward compatibility
          ...(isMetal && { grams: amountNum }),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTxHash(data.txHash || null);
        setStep('success');
      } else {
        setErrorMessage(data.error || 'Transfer failed');
        setStep('error');
      }
    } catch (e: any) {
      console.error('Transfer error:', e);
      setErrorMessage(e.message || 'Network error');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setAmount('');
    setRecipientAddress('');
    setErrorMessage('');
    onClose();
  };

  // QR Scanner View
  if (step === 'scanner') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setStep('input')}
          isDark={isDark}
          t={t}
        />
      </Modal>
    );
  }

  // 2FA Gate
  if (step === '2fa') {
    return (
      <TwoFactorGate
        visible={true}
        walletAddress={address}
        onVerified={executeTransfer}
        onCancel={() => setStep('input')}
      />
    );
  }

  // Processing
  if (step === 'processing') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff', alignItems: 'center', paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 }}>{t.processing}</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff', alignItems: 'center', paddingVertical: 40 }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b98120', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={{ color: '#10b981', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{t.sendSuccess}</Text>
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              {amountNum} {selectedToken.symbol} → {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-6)}
            </Text>
            <TouchableOpacity onPress={handleClose} style={{ backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff', alignItems: 'center', paddingVertical: 40 }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ef444420', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="close-circle" size={48} color="#ef4444" />
            </View>
            <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Error</Text>
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>{errorMessage}</Text>
            <TouchableOpacity onPress={handleClose} style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 }}>
              <Text style={{ color: isDark ? '#fff' : '#1e293b', fontWeight: '600' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Confirm
  if (step === 'confirm') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1e293b' }]}>{t.confirmSend}</Text>
              <TouchableOpacity onPress={() => setStep('input')} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#1e293b'} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: selectedToken.color + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name={selectedToken.icon as any} size={32} color={selectedToken.color} />
              </View>
              <Text style={{ color: selectedToken.color, fontSize: 28, fontWeight: '700' }}>{amountNum} {selectedToken.symbol}</Text>
              <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 8 }}>to</Text>
              <Text style={{ color: isDark ? '#fff' : '#1e293b', fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}>{recipientAddress}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setStep('input')} style={{ flex: 1, backgroundColor: isDark ? '#334155' : '#f1f5f9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: isDark ? '#fff' : '#1e293b', fontWeight: '600' }}>{t.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSend} style={{ flex: 1, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t.sendToken}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Input Form
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1e293b' }]}>{t.send}</Text>
              <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.sendSubtitle}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#1e293b'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Token Selection - 2 Row Grid */}
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8 }}>{t.selectToken}</Text>

            {/* Row 1: Metals */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {TRANSFERABLE_TOKENS.filter(t => t.isMetal).map(token => (
                <TouchableOpacity
                  key={token.symbol}
                  onPress={() => setSelectedToken(token)}
                  style={[
                    styles.tokenChip,
                    {
                      flex: 1,
                      minWidth: '22%',
                      justifyContent: 'center',
                      backgroundColor: selectedToken.symbol === token.symbol ? token.color + '20' : (isDark ? '#334155' : '#f1f5f9'),
                      borderColor: selectedToken.symbol === token.symbol ? token.color : 'transparent',
                      borderWidth: 2,
                    }
                  ]}
                >
                  <Ionicons name={token.icon as any} size={18} color={token.color} />
                  <Text style={{ color: isDark ? '#fff' : '#1e293b', marginLeft: 6, fontWeight: '600', fontSize: 13 }}>{token.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 2: Cryptos */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {TRANSFERABLE_TOKENS.filter(t => !t.isMetal).map(token => (
                <TouchableOpacity
                  key={token.symbol}
                  onPress={() => setSelectedToken(token)}
                  style={[
                    styles.tokenChip,
                    {
                      flex: 1,
                      minWidth: '22%',
                      justifyContent: 'center',
                      backgroundColor: selectedToken.symbol === token.symbol ? token.color + '20' : (isDark ? '#334155' : '#f1f5f9'),
                      borderColor: selectedToken.symbol === token.symbol ? token.color : 'transparent',
                      borderWidth: 2,
                    }
                  ]}
                >
                  <Ionicons name={token.icon as any} size={18} color={token.color} />
                  <Text style={{ color: isDark ? '#fff' : '#1e293b', marginLeft: 6, fontWeight: '600', fontSize: 13 }}>{token.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Metal Transfer Warning */}
            {isMetal && (
              <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 10, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="information-circle" size={20} color="#d97706" />
                <Text style={{ color: '#92400e', marginLeft: 8, flex: 1, fontSize: 12 }}>
                  {language === 'tr' ? 'Metal transferi sadece kayıtlı Auxite kullanıcılarına yapılabilir.' : 'Metal transfers can only be made to registered Auxite users.'}
                </Text>
              </View>
            )}

            {/* Recipient Address with QR Scanner */}
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8 }}>{t.recipientAddress}</Text>
            <View style={[styles.addressInputWrapper, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <TextInput
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                placeholder="0x..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={{ flex: 1, color: isDark ? '#fff' : '#1e293b', fontFamily: 'monospace', fontSize: 14, paddingVertical: 16 }}
              />
              <TouchableOpacity
                style={[styles.qrButton, { backgroundColor: '#10b981' }]}
                onPress={() => setStep('scanner')}
              >
                <Ionicons name="qr-code-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Recipient Validation (for metals) */}
            {isMetal && hasValidAddress && (
              <View style={{ marginBottom: 16, marginTop: 8 }}>
                {isCheckingRecipient ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#94a3b8" />
                    <Text style={{ color: '#94a3b8', marginLeft: 8, fontSize: 12 }}>{language === 'tr' ? 'Kontrol ediliyor...' : 'Checking...'}</Text>
                  </View>
                ) : recipientValid === true ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={{ color: '#10b981', marginLeft: 8, fontSize: 12 }}>{language === 'tr' ? 'Auxite kullanıcısı ✓' : 'Auxite user ✓'}</Text>
                  </View>
                ) : recipientValid === false ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                    <Text style={{ color: '#ef4444', marginLeft: 8, fontSize: 12 }}>{language === 'tr' ? 'Alıcı Auxite kullanıcısı değil' : 'Recipient is not an Auxite user'}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Amount Input */}
            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8, marginTop: isMetal ? 0 : 8 }}>{t.amount}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={{ flex: 1, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 12, padding: 16, marginRight: 8, color: isDark ? '#fff' : '#1e293b', fontSize: 18 }}
              />
              <TouchableOpacity onPress={handleMaxClick} style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 12, padding: 16 }}>
                <Text style={{ color: '#10b981', fontWeight: '600' }}>MAX</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 12, marginBottom: 16 }}>
              {t.balance}: {balance.toFixed(4)} {selectedToken.symbol}
            </Text>

            {/* Insufficient Balance Warning */}
            {!canAfford && amountNum > 0 && (
              <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 16 }}>{t.insufficientBalance}</Text>
            )}

            {/* Send Button */}
            <TouchableOpacity
              onPress={() => setStep('confirm')}
              disabled={!canSend}
              style={{ backgroundColor: canSend ? '#10b981' : (isDark ? '#334155' : '#e2e8f0'), paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: canSend ? '#fff' : (isDark ? '#64748b' : '#94a3b8'), fontWeight: '600', fontSize: 16 }}>{t.sendToken}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  qrContainer: {
    alignItems: 'center',
  },
  addressBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tokenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  // Address input with QR button
  addressInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 4,
    marginBottom: 8,
  },
  qrButton: {
    padding: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlaySection: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRadius: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderRadius: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderRadius: 2,
  },
  scanHint: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 24,
  },
  closeScannerButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelScanButton: {
    padding: 12,
  },
  cancelScanText: {
    fontSize: 14,
  },
});
