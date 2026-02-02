// components/ReceiveModal.tsx
// Receive Crypto Modal - QR Code + Deposit Address
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
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// QR Code component - conditional import
let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (e) {
  console.log('react-native-qrcode-svg not installed');
}

interface Props {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
}

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    title: 'Kripto Al',
    selectCoin: 'Kripto Seç',
    yourAddress: 'Yatırım Adresiniz',
    scanQR: 'QR Kodu Tara',
    copyAddress: 'Adresi Kopyala',
    shareAddress: 'Paylaş',
    copied: 'Kopyalandı!',
    network: 'Ağ',
    minDeposit: 'Minimum Yatırım',
    confirmations: 'Onay Sayısı',
    warning: 'Uyarı',
    warningText: 'Sadece {coin} gönderin. Farklı bir kripto göndermek fonlarınızın kaybına neden olabilir.',
    depositInfo: 'Yatırım bilgileri',
    processingTime: 'İşlem süresi: ~10-30 dakika',
    memo: 'Memo/Tag',
    memoRequired: 'Bu kripto için memo zorunludur!',
  },
  en: {
    title: 'Receive Crypto',
    selectCoin: 'Select Crypto',
    yourAddress: 'Your Deposit Address',
    scanQR: 'Scan QR Code',
    copyAddress: 'Copy Address',
    shareAddress: 'Share',
    copied: 'Copied!',
    network: 'Network',
    minDeposit: 'Minimum Deposit',
    confirmations: 'Confirmations',
    warning: 'Warning',
    warningText: 'Only send {coin}. Sending any other crypto may result in permanent loss.',
    depositInfo: 'Deposit Info',
    processingTime: 'Processing time: ~10-30 minutes',
    memo: 'Memo/Tag',
    memoRequired: 'Memo is required for this crypto!',
  },
  de: {
    title: 'Krypto empfangen',
    selectCoin: 'Krypto wählen',
    yourAddress: 'Ihre Einzahlungsadresse',
    scanQR: 'QR-Code scannen',
    copyAddress: 'Adresse kopieren',
    shareAddress: 'Teilen',
    copied: 'Kopiert!',
    network: 'Netzwerk',
    minDeposit: 'Mindesteinzahlung',
    confirmations: 'Bestätigungen',
    warning: 'Warnung',
    warningText: 'Senden Sie nur {coin}. Das Senden anderer Kryptowährungen kann zu Verlust führen.',
    depositInfo: 'Einzahlungsinfo',
    processingTime: 'Bearbeitungszeit: ~10-30 Minuten',
    memo: 'Memo/Tag',
    memoRequired: 'Memo ist für diese Krypto erforderlich!',
  },
  fr: {
    title: 'Recevoir Crypto',
    selectCoin: 'Sélectionner Crypto',
    yourAddress: 'Votre adresse de dépôt',
    scanQR: 'Scanner le QR Code',
    copyAddress: 'Copier l\'adresse',
    shareAddress: 'Partager',
    copied: 'Copié!',
    network: 'Réseau',
    minDeposit: 'Dépôt minimum',
    confirmations: 'Confirmations',
    warning: 'Attention',
    warningText: 'Envoyez uniquement {coin}. L\'envoi d\'autres cryptos peut entraîner une perte.',
    depositInfo: 'Info dépôt',
    processingTime: 'Temps de traitement: ~10-30 minutes',
    memo: 'Memo/Tag',
    memoRequired: 'Le memo est requis pour cette crypto!',
  },
  ar: {
    title: 'استلام العملات',
    selectCoin: 'اختر العملة',
    yourAddress: 'عنوان الإيداع الخاص بك',
    scanQR: 'مسح رمز QR',
    copyAddress: 'نسخ العنوان',
    shareAddress: 'مشاركة',
    copied: 'تم النسخ!',
    network: 'الشبكة',
    minDeposit: 'الحد الأدنى للإيداع',
    confirmations: 'التأكيدات',
    warning: 'تحذير',
    warningText: 'أرسل فقط {coin}. إرسال عملات أخرى قد يؤدي إلى خسارة.',
    depositInfo: 'معلومات الإيداع',
    processingTime: 'وقت المعالجة: ~10-30 دقيقة',
    memo: 'مذكرة/علامة',
    memoRequired: 'المذكرة مطلوبة لهذه العملة!',
  },
  ru: {
    title: 'Получить криптовалюту',
    selectCoin: 'Выберите криптовалюту',
    yourAddress: 'Ваш адрес для депозита',
    scanQR: 'Сканировать QR-код',
    copyAddress: 'Копировать адрес',
    shareAddress: 'Поделиться',
    copied: 'Скопировано!',
    network: 'Сеть',
    minDeposit: 'Минимальный депозит',
    confirmations: 'Подтверждения',
    warning: 'Внимание',
    warningText: 'Отправляйте только {coin}. Отправка других криптовалют может привести к потере.',
    depositInfo: 'Информация о депозите',
    processingTime: 'Время обработки: ~10-30 минут',
    memo: 'Memo/Tag',
    memoRequired: 'Memo обязателен для этой криптовалюты!',
  },
};

// ============================================
// SUPPORTED COINS
// ============================================
const COINS = [
  { 
    symbol: 'USDT', 
    name: 'Tether', 
    icon: '💵', 
    color: '#26A17B', 
    network: 'Ethereum (ERC-20)',
    minDeposit: 10,
    confirmations: 12,
  },
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    icon: '⟠', 
    color: '#627EEA',
    network: 'Ethereum',
    minDeposit: 0.005,
    confirmations: 12,
  },
  { 
    symbol: 'XRP', 
    name: 'Ripple', 
    icon: '✕', 
    color: '#23292F',
    network: 'Ripple',
    minDeposit: 10,
    confirmations: 1,
    requiresMemo: true,
  },
  { 
    symbol: 'SOL', 
    name: 'Solana', 
    icon: '◎', 
    color: '#9945FF',
    network: 'Solana',
    minDeposit: 0.1,
    confirmations: 32,
  },
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    icon: '₿', 
    color: '#F7931A',
    network: 'Bitcoin',
    minDeposit: 0.0005,
    confirmations: 3,
  },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function ReceiveModal({ visible, onClose, walletAddress }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [depositAddress, setDepositAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    primary: '#10B981',
    warning: '#F59E0B',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    if (visible && walletAddress) {
      fetchDepositAddress();
    }
  }, [visible, selectedCoin, walletAddress]);

  const fetchDepositAddress = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/deposit/address?coin=${selectedCoin.symbol}&address=${walletAddress}`);
      const data = await res.json();
      setDepositAddress(data.depositAddress || walletAddress);
      setMemo(data.memo || '');
    } catch (err) {
      // Fallback to wallet address
      setDepositAddress(walletAddress);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMemo = async () => {
    if (memo) {
      await Clipboard.setStringAsync(memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${selectedCoin.symbol} Deposit Address: ${depositAddress}${memo ? `\nMemo: ${memo}` : ''}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Coin Selection */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.selectCoin}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinScroll}>
              {COINS.map((coin) => (
                <TouchableOpacity
                  key={coin.symbol}
                  style={[
                    styles.coinChip,
                    {
                      backgroundColor: selectedCoin.symbol === coin.symbol ? coin.color + '20' : colors.surfaceAlt,
                      borderColor: selectedCoin.symbol === coin.symbol ? coin.color : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedCoin(coin)}
                >
                  <Text style={styles.coinIcon}>{coin.icon}</Text>
                  <Text style={[styles.coinSymbol, { color: colors.text }]}>{coin.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>{t.scanQR}</Text>
              <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : QRCode ? (
                  <QRCode
                    value={depositAddress || 'loading'}
                    size={180}
                    backgroundColor="#FFFFFF"
                    color="#000000"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code" size={100} color="#94A3B8" />
                    <Text style={{ color: '#64748B', marginTop: 8, fontSize: 12 }}>
                      Install react-native-qrcode-svg
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Deposit Address */}
            <View style={styles.addressSection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.yourAddress}</Text>
              <View style={[styles.addressBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                  {loading ? '...' : depositAddress}
                </Text>
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={handleCopy}
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>{copied ? t.copied : t.copyAddress}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>{t.shareAddress}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Memo (for XRP) */}
            {selectedCoin.requiresMemo && memo && (
              <View style={styles.memoSection}>
                <View style={[styles.memoWarning, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="warning" size={20} color={colors.warning} />
                  <Text style={[styles.memoWarningText, { color: colors.warning }]}>{t.memoRequired}</Text>
                </View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t.memo}</Text>
                <TouchableOpacity
                  style={[styles.memoBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  onPress={handleCopyMemo}
                >
                  <Text style={[styles.memoText, { color: colors.text }]}>{memo}</Text>
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Deposit Info */}
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>{t.depositInfo}</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.network}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{selectedCoin.network}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.minDeposit}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedCoin.minDeposit} {selectedCoin.symbol}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.confirmations}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{selectedCoin.confirmations}</Text>
              </View>
              <Text style={[styles.processingTime, { color: colors.textSecondary }]}>{t.processingTime}</Text>
            </View>

            {/* Warning */}
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                {t.warningText.replace('{coin}', selectedCoin.symbol)}
              </Text>
            </View>

            <View style={{ height: 20 }} />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  coinScroll: {
    marginBottom: 20,
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    gap: 6,
  },
  coinIcon: {
    fontSize: 18,
  },
  coinSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 212,
    minWidth: 212,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSection: {
    marginBottom: 16,
  },
  addressBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memoSection: {
    marginBottom: 16,
  },
  memoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  memoWarningText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  memoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  memoText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  processingTime: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
