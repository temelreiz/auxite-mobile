// components/WithdrawModal.tsx
// Crypto Withdrawal Modal with QR Scanner + 2FA
// 6-Language Support | Dark/Light Mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';
import { TwoFactorGate } from '@/components/security';

interface Props {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
  auxmBalance: number;
  onSuccess?: () => void;
}

const translations = {
  tr: {
    title: 'Kripto Çek',
    selectCoin: 'Kripto Seç',
    amount: 'Miktar',
    withdrawAddress: 'Çekim Adresi',
    addressPlaceholder: 'Cüzdan adresi girin',
    memo: 'Memo/Tag (Opsiyonel)',
    memoPlaceholder: 'XRP için gerekli olabilir',
    available: 'Kullanılabilir',
    networkFee: 'Ağ Ücreti',
    youWillReceive: 'Alacağınız',
    withdraw: 'Çek',
    cancel: 'İptal',
    processing: 'İşleniyor...',
    success: 'Başarılı!',
    withdrawSuccess: 'Çekim işlemi başarıyla tamamlandı.',
    viewExplorer: 'Explorer\'da Gör',
    error: 'Hata',
    insufficientBalance: 'Yetersiz bakiye',
    minAmount: 'Minimum miktar',
    btcComingSoon: 'BTC çekimleri yakında.',
    max: 'Max',
    confirmWithdraw: 'Çekimi Onayla',
    confirmMessage: 'adresine çekim yapılacak.',
    confirm: 'Onayla',
    scanQR: 'QR Tara',
    cameraPermission: 'Kamera izni gerekli',
    cameraPermissionMessage: 'QR taramak için kamera izni verin.',
    grantPermission: 'İzin Ver',
  },
  en: {
    title: 'Withdraw Crypto',
    selectCoin: 'Select Crypto',
    amount: 'Amount',
    withdrawAddress: 'Withdraw Address',
    addressPlaceholder: 'Enter wallet address',
    memo: 'Memo/Tag (Optional)',
    memoPlaceholder: 'May be required for XRP',
    available: 'Available',
    networkFee: 'Network Fee',
    youWillReceive: 'You Will Receive',
    withdraw: 'Withdraw',
    cancel: 'Cancel',
    processing: 'Processing...',
    success: 'Success!',
    withdrawSuccess: 'Withdrawal completed successfully.',
    viewExplorer: 'View on Explorer',
    error: 'Error',
    insufficientBalance: 'Insufficient balance',
    minAmount: 'Minimum amount',
    btcComingSoon: 'BTC withdrawals coming soon.',
    max: 'Max',
    confirmWithdraw: 'Confirm Withdrawal',
    confirmMessage: 'will be withdrawn to.',
    confirm: 'Confirm',
    scanQR: 'Scan QR',
    cameraPermission: 'Camera Permission Required',
    cameraPermissionMessage: 'Grant camera permission to scan QR.',
    grantPermission: 'Grant Permission',
  },
  de: { title: 'Krypto abheben', selectCoin: 'Krypto wählen', amount: 'Betrag', withdrawAddress: 'Auszahlungsadresse', addressPlaceholder: 'Wallet-Adresse eingeben', memo: 'Memo/Tag', memoPlaceholder: 'Für XRP erforderlich', available: 'Verfügbar', networkFee: 'Netzwerkgebühr', youWillReceive: 'Sie erhalten', withdraw: 'Abheben', cancel: 'Abbrechen', processing: 'Verarbeitung...', success: 'Erfolgreich!', withdrawSuccess: 'Auszahlung abgeschlossen.', viewExplorer: 'Im Explorer ansehen', error: 'Fehler', insufficientBalance: 'Guthaben reicht nicht', minAmount: 'Mindestbetrag', btcComingSoon: 'BTC bald verfügbar.', max: 'Max', confirmWithdraw: 'Bestätigen', confirmMessage: 'wird abgehoben an.', confirm: 'Bestätigen', scanQR: 'QR scannen', cameraPermission: 'Kameraberechtigung', cameraPermissionMessage: 'Kamerazugriff erlauben.', grantPermission: 'Erlauben' },
  fr: { title: 'Retirer Crypto', selectCoin: 'Sélectionner', amount: 'Montant', withdrawAddress: 'Adresse de retrait', addressPlaceholder: 'Entrez l\'adresse', memo: 'Memo/Tag', memoPlaceholder: 'Pour XRP', available: 'Disponible', networkFee: 'Frais', youWillReceive: 'Vous recevrez', withdraw: 'Retirer', cancel: 'Annuler', processing: 'Traitement...', success: 'Succès!', withdrawSuccess: 'Retrait effectué.', viewExplorer: 'Voir Explorer', error: 'Erreur', insufficientBalance: 'Solde insuffisant', minAmount: 'Montant minimum', btcComingSoon: 'BTC bientôt.', max: 'Max', confirmWithdraw: 'Confirmer', confirmMessage: 'sera retiré vers.', confirm: 'Confirmer', scanQR: 'Scanner QR', cameraPermission: 'Permission caméra', cameraPermissionMessage: 'Autoriser la caméra.', grantPermission: 'Autoriser' },
  ar: { title: 'سحب العملات', selectCoin: 'اختر العملة', amount: 'المبلغ', withdrawAddress: 'عنوان السحب', addressPlaceholder: 'أدخل العنوان', memo: 'مذكرة', memoPlaceholder: 'لـ XRP', available: 'متاح', networkFee: 'رسوم', youWillReceive: 'ستتلقى', withdraw: 'سحب', cancel: 'إلغاء', processing: 'جارٍ...', success: 'نجاح!', withdrawSuccess: 'تم السحب.', viewExplorer: 'عرض', error: 'خطأ', insufficientBalance: 'رصيد غير كافٍ', minAmount: 'الحد الأدنى', btcComingSoon: 'BTC قريباً.', max: 'الحد', confirmWithdraw: 'تأكيد', confirmMessage: 'سيتم السحب.', confirm: 'تأكيد', scanQR: 'مسح QR', cameraPermission: 'إذن الكاميرا', cameraPermissionMessage: 'السماح بالكاميرا.', grantPermission: 'السماح' },
  ru: { title: 'Вывод криптовалюты', selectCoin: 'Выбрать', amount: 'Сумма', withdrawAddress: 'Адрес', addressPlaceholder: 'Введите адрес', memo: 'Memo/Tag', memoPlaceholder: 'Для XRP', available: 'Доступно', networkFee: 'Комиссия', youWillReceive: 'Получите', withdraw: 'Вывести', cancel: 'Отмена', processing: 'Обработка...', success: 'Успешно!', withdrawSuccess: 'Вывод завершён.', viewExplorer: 'Смотреть', error: 'Ошибка', insufficientBalance: 'Недостаточно', minAmount: 'Минимум', btcComingSoon: 'BTC скоро.', max: 'Макс', confirmWithdraw: 'Подтвердить', confirmMessage: 'будет выведено.', confirm: 'Подтвердить', scanQR: 'Сканировать', cameraPermission: 'Разрешение камеры', cameraPermissionMessage: 'Разрешить камеру.', grantPermission: 'Разрешить' },
};

const COINS = [
  { symbol: 'USDT', name: 'Tether', icon: '$', color: '#26A17B', networkFee: 1, minWithdraw: 10 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA', networkFee: 0.0005, minWithdraw: 0.001 },
  { symbol: 'XRP', name: 'Ripple', icon: '✕', color: '#00AAE4', networkFee: 0.1, minWithdraw: 10 },
  { symbol: 'SOL', name: 'Solana', icon: '◎', color: '#9945FF', networkFee: 0.01, minWithdraw: 0.1 },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A', networkFee: 0.0001, minWithdraw: 0.0005 },
];

type FlowStep = 'form' | 'confirm' | '2fa' | 'processing' | 'result' | 'scanner';

// QR Scanner Component
function QRScanner({ onScan, onClose, colors, t }: { onScan: (data: string) => void; onClose: () => void; colors: any; t: any }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    let address = data;
    if (data.includes(':')) {
      const parts = data.split(':');
      address = parts[1]?.split('?')[0] || data;
    }
    onScan(address);
  };

  if (!permission) {
    return <View style={[styles.scannerContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
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
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} />
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
        <View style={styles.overlaySection}><Text style={styles.scanHint}>{t.scanQR}</Text></View>
      </View>
      <TouchableOpacity style={styles.closeScannerButton} onPress={onClose}><Ionicons name="close" size={28} color="#FFF" /></TouchableOpacity>
    </View>
  );
}

export default function WithdrawModal({ visible, onClose, walletAddress, auxmBalance, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const isDark = theme === 'system' ? colorScheme === 'dark' : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [flowStep, setFlowStep] = useState<FlowStep>('form');
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [amount, setAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string } | null>(null);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    primary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => { if (visible) { fetchBalances(); resetForm(); } }, [visible]);

  const resetForm = () => { setFlowStep('form'); setAmount(''); setWithdrawAddress(''); setMemo(''); setResult(null); setSelectedCoin(COINS[0]); };

  const fetchBalances = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/balance?address=${walletAddress}`);
      const data = await res.json();
      console.log('💰 Withdraw balances response:', data);
      if (data.balances) {
        const newBalances = { 
          USDT: data.balances.usdt || 0, 
          ETH: data.balances.eth || 0, 
          BTC: data.balances.btc || 0, 
          XRP: data.balances.xrp || 0, 
          SOL: data.balances.sol || 0 
        };
        console.log('💰 Setting balances:', newBalances);
        setBalances(newBalances);
      }
    } catch (err) { console.error('Fetch balances error:', err); }
  };

  const handleMax = () => { const balance = balances[selectedCoin.symbol] || 0; setAmount(Math.max(0, balance - selectedCoin.networkFee).toFixed(6)); };
  const handleQRScan = (address: string) => { setWithdrawAddress(address); setFlowStep('form'); };

  const amountNum = parseFloat(amount) || 0;
  const netReceive = Math.max(0, amountNum - selectedCoin.networkFee);
  const cryptoBalance = balances[selectedCoin.symbol] || 0;
  const canSubmit = amountNum > 0 && amountNum >= selectedCoin.minWithdraw && amountNum <= cryptoBalance && withdrawAddress.length > 10;
  
  // Debug
  console.log('🔍 Withdraw check:', {
    amountNum,
    minWithdraw: selectedCoin.minWithdraw,
    cryptoBalance,
    addressLength: withdrawAddress.length,
    canSubmit,
    conditions: {
      amountPositive: amountNum > 0,
      aboveMin: amountNum >= selectedCoin.minWithdraw,
      belowBalance: amountNum <= cryptoBalance,
      addressValid: withdrawAddress.length > 10,
    }
  });

  const handleContinue = () => { if (selectedCoin.symbol === 'BTC') { Alert.alert(t.error, t.btcComingSoon); return; } setFlowStep('confirm'); };
  const handleConfirm = () => { setFlowStep('2fa'); };

  const handleWithdraw = async () => {
    setFlowStep('processing');
    try {
      const res = await fetch(`${API_URL}/api/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: walletAddress, coin: selectedCoin.symbol, amount: amountNum, withdrawAddress: withdrawAddress.trim(), memo: memo || undefined }) });
      const data = await res.json();
      if (res.ok && data.success) { setResult({ success: true, txHash: data.withdrawal?.txHash, explorerUrl: data.withdrawal?.explorerUrl }); onSuccess?.(); }
      else { setResult({ success: false, error: data.error || 'Withdrawal failed' }); }
    } catch (err: any) { setResult({ success: false, error: err.message || 'Network error' }); }
    setFlowStep('result');
  };

  const handleClose = () => { resetForm(); onClose(); };

  // QR Scanner
  if (flowStep === 'scanner') {
    return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen"><QRScanner onScan={handleQRScan} onClose={() => setFlowStep('form')} colors={colors} t={t} /></Modal>;
  }

  // 2FA Gate
  if (flowStep === '2fa') {
    return (
      <TwoFactorGate 
        visible={true}
        walletAddress={walletAddress} 
        onVerified={handleWithdraw} 
        onCancel={() => setFlowStep('form')} 
      />
    );
  }

  // Processing
  if (flowStep === 'processing') {
    return <Modal visible={visible} animationType="slide" transparent><View style={styles.overlay}><View style={[styles.modal, { backgroundColor: colors.surface }]}><View style={styles.processingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.processingText, { color: colors.textSecondary }]}>{t.processing}</Text></View></View></View></Modal>;
  }

  // Result
  if (flowStep === 'result' && result) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.resultContainer}>
              <View style={[styles.resultIcon, { backgroundColor: result.success ? colors.primary + '20' : colors.danger + '20' }]}>
                <Ionicons name={result.success ? 'checkmark-circle' : 'close-circle'} size={48} color={result.success ? colors.primary : colors.danger} />
              </View>
              <Text style={[styles.resultTitle, { color: result.success ? colors.primary : colors.danger }]}>{result.success ? t.success : t.error}</Text>
              <Text style={[styles.resultMessage, { color: colors.textSecondary }]}>{result.success ? t.withdrawSuccess : result.error}</Text>
              {result.success && result.explorerUrl && <TouchableOpacity style={[styles.explorerButton, { borderColor: colors.border }]} onPress={() => Linking.openURL(result.explorerUrl!)}><Ionicons name="open-outline" size={18} color={colors.primary} /><Text style={[styles.explorerButtonText, { color: colors.primary }]}>{t.viewExplorer}</Text></TouchableOpacity>}
              <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={handleClose}><Text style={styles.doneButtonText}>OK</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Confirm
  if (flowStep === 'confirm') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.confirmContainer}>
              <View style={[styles.confirmIcon, { backgroundColor: selectedCoin.color + '20' }]}><Text style={{ fontSize: 32, color: selectedCoin.color }}>{selectedCoin.icon}</Text></View>
              <Text style={[styles.confirmTitle, { color: colors.text }]}>{t.confirmWithdraw}</Text>
              <Text style={[styles.confirmAmount, { color: selectedCoin.color }]}>{amountNum.toFixed(6)} {selectedCoin.symbol}</Text>
              <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{t.confirmMessage}</Text>
              <Text style={[styles.confirmAddress, { color: colors.text }]}>{withdrawAddress}</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity style={[styles.confirmCancelButton, { backgroundColor: colors.surfaceAlt }]} onPress={() => setFlowStep('form')}><Text style={[styles.confirmCancelText, { color: colors.text }]}>{t.cancel}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.confirmSubmitButton, { backgroundColor: colors.primary }]} onPress={handleConfirm}><Text style={styles.confirmSubmitText}>{t.confirm}</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Form
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modal, styles.mainModal, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.selectCoin}</Text>
            <View style={styles.coinContainer}>
              {COINS.map((coin) => (
                <TouchableOpacity key={coin.symbol} style={[styles.coinChip, { backgroundColor: selectedCoin.symbol === coin.symbol ? coin.color + '20' : colors.surfaceAlt, borderColor: selectedCoin.symbol === coin.symbol ? coin.color : colors.border }]} onPress={() => setSelectedCoin(coin)}>
                  <View style={[styles.coinIconWrapper, { backgroundColor: coin.color }]}><Text style={styles.coinIconText}>{coin.icon}</Text></View>
                  <Text style={[styles.coinSymbol, { color: selectedCoin.symbol === coin.symbol ? coin.color : colors.text }]}>{coin.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}><Text style={[styles.label, { color: colors.textSecondary }]}>{t.amount}</Text><TouchableOpacity onPress={handleMax}><Text style={[styles.maxButton, { color: colors.primary }]}>{t.max}</Text></TouchableOpacity></View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="0.00" placeholderTextColor={colors.textSecondary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>{selectedCoin.symbol}</Text>
              </View>
              <Text style={[styles.availableText, { color: colors.textSecondary }]}>{t.available}: {cryptoBalance.toFixed(6)} {selectedCoin.symbol}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.withdrawAddress}</Text>
              <View style={[styles.addressInputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TextInput style={[styles.addressInput, { color: colors.text }]} placeholder={t.addressPlaceholder} placeholderTextColor={colors.textSecondary} value={withdrawAddress} onChangeText={setWithdrawAddress} autoCapitalize="none" autoCorrect={false} />
                <TouchableOpacity style={[styles.qrButton, { backgroundColor: colors.primary }]} onPress={() => setFlowStep('scanner')}><Ionicons name="qr-code-outline" size={22} color="#FFF" /></TouchableOpacity>
              </View>
            </View>

            {selectedCoin.symbol === 'XRP' && (
              <View style={styles.inputGroup}><Text style={[styles.label, { color: colors.textSecondary }]}>{t.memo}</Text><TextInput style={[styles.memoInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]} placeholder={t.memoPlaceholder} placeholderTextColor={colors.textSecondary} value={memo} onChangeText={setMemo} keyboardType="number-pad" /></View>
            )}

            {amountNum > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceAlt }]}>
                <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.amount}</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{amountNum.toFixed(6)} {selectedCoin.symbol}</Text></View>
                <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.networkFee}</Text><Text style={[styles.summaryValue, { color: colors.danger }]}>-{selectedCoin.networkFee} {selectedCoin.symbol}</Text></View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.primary }]}>{t.youWillReceive}</Text><Text style={[styles.summaryValueLarge, { color: colors.primary }]}>{netReceive.toFixed(6)} {selectedCoin.symbol}</Text></View>
              </View>
            )}

            {amountNum > cryptoBalance && <View style={[styles.errorCard, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}><Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {t.insufficientBalance}</Text></View>}
            {amountNum > 0 && amountNum < selectedCoin.minWithdraw && <View style={[styles.errorCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}><Text style={[styles.errorText, { color: colors.warning }]}>⚠️ {t.minAmount}: {selectedCoin.minWithdraw} {selectedCoin.symbol}</Text></View>}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.withdrawButton, !canSubmit && styles.buttonDisabled]} onPress={handleContinue} disabled={!canSubmit}><Text style={styles.withdrawButtonText}>{t.withdraw}</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  mainModal: { minHeight: '70%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  closeButton: { position: 'absolute', right: 16, padding: 4 },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  maxButton: { fontSize: 13, fontWeight: '600' },
  coinContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  coinChip: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 2, marginHorizontal: 3 },
  coinIconWrapper: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  coinIconText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  coinSymbol: { fontSize: 11, fontWeight: '700' },
  inputGroup: { marginBottom: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 14 },
  inputSuffix: { fontSize: 14, fontWeight: '500' },
  availableText: { fontSize: 12, marginTop: 6 },
  addressInputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingLeft: 14, paddingRight: 4 },
  addressInput: { flex: 1, fontSize: 14, paddingVertical: 14 },
  qrButton: { padding: 10, borderRadius: 10, marginLeft: 8 },
  memoInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14 },
  summaryCard: { borderRadius: 14, padding: 16, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  summaryValueLarge: { fontSize: 18, fontWeight: '700' },
  summaryDivider: { height: 1, marginVertical: 10 },
  errorCard: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  errorText: { fontSize: 13 },
  footer: { padding: 16, borderTopWidth: 1 },
  withdrawButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  withdrawButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlaySection: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  middleRow: { flexDirection: 'row', height: 250 },
  scanFrame: { width: 250, height: 250, position: 'relative' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderRadius: 2 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderRadius: 2 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: 2 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderRadius: 2 },
  scanHint: { color: '#FFF', fontSize: 16, marginTop: 24 },
  closeScannerButton: { position: 'absolute', top: 60, right: 20, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  permissionContainer: { alignItems: 'center', padding: 40 },
  permissionTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  permissionMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  permissionButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  cancelScanButton: { padding: 12 },
  cancelScanText: { fontSize: 14 },
  resultContainer: { alignItems: 'center', padding: 24 },
  resultIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  resultMessage: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  explorerButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  explorerButtonText: { fontSize: 14, fontWeight: '600' },
  doneButton: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  doneButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  processingContainer: { alignItems: 'center', padding: 40 },
  processingText: { marginTop: 16, fontSize: 14 },
  confirmContainer: { alignItems: 'center', padding: 24 },
  confirmIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  confirmTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  confirmAmount: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  confirmMessage: { fontSize: 14, marginBottom: 8 },
  confirmAddress: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmCancelText: { fontSize: 15, fontWeight: '600' },
  confirmSubmitButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmSubmitText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
