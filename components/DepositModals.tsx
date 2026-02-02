// components/DepositModals.tsx
// Deposit Modal System - Crypto & USD Deposit with Real Addresses
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  Clipboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from '@/constants/api';

// ============================================
// TYPES
// ============================================
type CoinType = 'BTC' | 'ETH' | 'XRP' | 'SOL' | 'USDT';

export interface DepositCoin {
  id: CoinType;
  name: string;
  icon: string;
  color: string;
  network: string;
  minDeposit: string;
  confirmTime: string;
  address: string;
  memo?: string;
}

// ============================================
// DEFAULT COIN DATA (addresses will be fetched from API)
// ============================================
const DEFAULT_COINS: Omit<DepositCoin, 'address'>[] = [
  { id: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A', network: 'Bitcoin Network', minDeposit: '0.0001 BTC', confirmTime: '~30 min' },
  { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA', network: 'ERC-20', minDeposit: '0.001 ETH', confirmTime: '~5 min' },
  { id: 'XRP', name: 'Ripple', icon: '✕', color: '#23292F', network: 'XRP Ledger', minDeposit: '10 XRP', confirmTime: '~10 sec' },
  { id: 'SOL', name: 'Solana', icon: '◎', color: '#9945FF', network: 'Solana', minDeposit: '0.01 SOL', confirmTime: '~1 min' },
  { id: 'USDT', name: 'Tether', icon: '₮', color: '#26A17B', network: 'ERC-20', minDeposit: '10 USDT', confirmTime: '~5 min' },
];

// ============================================
// TRANSLATIONS - 6 Language Support
// ============================================
const translations: Record<string, Record<string, string>> = {
  tr: {
    selectMethod: 'Yatırım Yöntemi',
    crypto: 'Kripto Para',
    cryptoDesc: 'BTC, ETH, SOL ve daha fazlası',
    fiat: 'USD / Fiat',
    fiatDesc: 'Banka transferi veya kart',
    selectCoin: 'Kripto Seçin',
    address: 'Adres',
    network: 'Ağ',
    minDeposit: 'Min. Yatırım',
    confirmTime: 'Onay Süresi',
    warning: 'Uyarı',
    warningText: 'Sadece {network} ağı üzerinden {coin} gönderin. Farklı ağ kullanımı kayba neden olabilir.',
    copied: 'Kopyalandı!',
    copyAddress: 'Adresi Kopyala',
    scanQr: 'QR Kodu Tara',
    memo: 'Memo/Tag',
    memoWarning: 'Memo olmadan gönderim yapmayın!',
    close: 'Kapat',
    depositAddress: 'Yatırım Adresi',
    sendOnly: 'Sadece {coin} gönderin',
  },
  en: {
    selectMethod: 'Deposit Method',
    crypto: 'Cryptocurrency',
    cryptoDesc: 'BTC, ETH, SOL and more',
    fiat: 'USD / Fiat',
    fiatDesc: 'Bank transfer or card',
    selectCoin: 'Select Crypto',
    address: 'Address',
    network: 'Network',
    minDeposit: 'Min. Deposit',
    confirmTime: 'Confirm Time',
    warning: 'Warning',
    warningText: 'Only send {coin} via {network} network. Using different network may result in loss.',
    copied: 'Copied!',
    copyAddress: 'Copy Address',
    scanQr: 'Scan QR Code',
    memo: 'Memo/Tag',
    memoWarning: 'Do not send without Memo!',
    close: 'Close',
    depositAddress: 'Deposit Address',
    sendOnly: 'Send only {coin}',
  },
  de: {
    selectMethod: 'Einzahlungsmethode',
    crypto: 'Kryptowährung',
    cryptoDesc: 'BTC, ETH, SOL und mehr',
    fiat: 'USD / Fiat',
    fiatDesc: 'Banküberweisung oder Karte',
    selectCoin: 'Krypto auswählen',
    address: 'Adresse',
    network: 'Netzwerk',
    minDeposit: 'Min. Einzahlung',
    confirmTime: 'Bestätigungszeit',
    warning: 'Warnung',
    warningText: 'Senden Sie nur {coin} über {network}. Die Verwendung eines anderen Netzwerks kann zu Verlusten führen.',
    copied: 'Kopiert!',
    copyAddress: 'Adresse kopieren',
    scanQr: 'QR-Code scannen',
    memo: 'Memo/Tag',
    memoWarning: 'Nicht ohne Memo senden!',
    close: 'Schließen',
    depositAddress: 'Einzahlungsadresse',
    sendOnly: 'Nur {coin} senden',
  },
  fr: {
    selectMethod: 'Méthode de dépôt',
    crypto: 'Cryptomonnaie',
    cryptoDesc: 'BTC, ETH, SOL et plus',
    fiat: 'USD / Fiat',
    fiatDesc: 'Virement bancaire ou carte',
    selectCoin: 'Sélectionner crypto',
    address: 'Adresse',
    network: 'Réseau',
    minDeposit: 'Dépôt min.',
    confirmTime: 'Temps de confirmation',
    warning: 'Attention',
    warningText: 'Envoyez uniquement {coin} via le réseau {network}. L\'utilisation d\'un autre réseau peut entraîner une perte.',
    copied: 'Copié!',
    copyAddress: 'Copier l\'adresse',
    scanQr: 'Scanner le QR Code',
    memo: 'Memo/Tag',
    memoWarning: 'N\'envoyez pas sans Memo!',
    close: 'Fermer',
    depositAddress: 'Adresse de dépôt',
    sendOnly: 'Envoyer uniquement {coin}',
  },
  ar: {
    selectMethod: 'طريقة الإيداع',
    crypto: 'عملة مشفرة',
    cryptoDesc: 'BTC، ETH، SOL والمزيد',
    fiat: 'USD / فيات',
    fiatDesc: 'تحويل بنكي أو بطاقة',
    selectCoin: 'اختر العملة',
    address: 'العنوان',
    network: 'الشبكة',
    minDeposit: 'الحد الأدنى للإيداع',
    confirmTime: 'وقت التأكيد',
    warning: 'تحذير',
    warningText: 'أرسل فقط {coin} عبر شبكة {network}. استخدام شبكة مختلفة قد يؤدي إلى خسارة.',
    copied: 'تم النسخ!',
    copyAddress: 'نسخ العنوان',
    scanQr: 'مسح رمز QR',
    memo: 'المذكرة/العلامة',
    memoWarning: 'لا ترسل بدون المذكرة!',
    close: 'إغلاق',
    depositAddress: 'عنوان الإيداع',
    sendOnly: 'أرسل فقط {coin}',
  },
  ru: {
    selectMethod: 'Способ пополнения',
    crypto: 'Криптовалюта',
    cryptoDesc: 'BTC, ETH, SOL и другие',
    fiat: 'USD / Фиат',
    fiatDesc: 'Банковский перевод или карта',
    selectCoin: 'Выберите криптовалюту',
    address: 'Адрес',
    network: 'Сеть',
    minDeposit: 'Мин. депозит',
    confirmTime: 'Время подтверждения',
    warning: 'Предупреждение',
    warningText: 'Отправляйте только {coin} через сеть {network}. Использование другой сети может привести к потере.',
    copied: 'Скопировано!',
    copyAddress: 'Копировать адрес',
    scanQr: 'Сканировать QR код',
    memo: 'Мемо/Тег',
    memoWarning: 'Не отправляйте без Мемо!',
    close: 'Закрыть',
    depositAddress: 'Адрес депозита',
    sendOnly: 'Отправляйте только {coin}',
  },
};

// ============================================
// ============================================
// DEPOSIT METHOD MODAL
// ============================================
interface DepositMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCrypto: () => void;
  onSelectUsd: () => void;
}

export const DepositMethodModal: React.FC<DepositMethodModalProps> = ({ visible, onClose, onSelectCrypto, onSelectUsd }) => {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === "dark";
  const isDark = theme === "system" ? systemIsDark : theme === "dark";
  const t = translations[language] || translations.en;

  const colors = {
    background: isDark ? "#0f172a" : "#ffffff",
    surface: isDark ? "#1e293b" : "#f8fafc",
    text: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Deposit Method</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          
          <View style={styles.methodList}>
            <TouchableOpacity style={[styles.methodRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onSelectCrypto}>
              <View style={[styles.methodIconBox, { backgroundColor: "#f59e0b20" }]}>
                <Ionicons name="arrow-down" size={24} color="#f59e0b" />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodRowTitle, { color: colors.text }]}>On-Chain Deposit</Text>
                <Text style={[styles.methodRowDesc, { color: colors.textSecondary }]}>Deposit crypto from other exchanges/wallets</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.methodRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onSelectUsd}>
              <View style={[styles.methodIconBox, { backgroundColor: "#10b98120" }]}>
                <Ionicons name="card-outline" size={24} color="#10b981" />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodRowTitle, { color: colors.text }]}>Deposit Fiat</Text>
                <Text style={[styles.methodRowDesc, { color: colors.textSecondary }]}>Deposit USD/TRY via card, Apple/Google Pay</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
// COIN SELECT MODAL
// ============================================
interface CoinSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCoin: (coin: DepositCoin) => void;
}

export const CoinSelectModal: React.FC<CoinSelectModalProps> = ({ visible, onClose, onSelectCoin }) => {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;
  
  const [coins, setCoins] = useState<DepositCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchDepositAddresses();
    }
  }, [visible, walletAddress]);

  const fetchDepositAddresses = async () => {
    try {
      // Kullanıcının kendi wallet adresini göster
      // ETH ve ERC-20 tokenlar için aynı adres kullanılır
      // Backend zaten blockchain'den bakiyeyi otomatik okur
      
      const coinsWithAddresses: DepositCoin[] = DEFAULT_COINS.map(coin => {
        // ETH ve USDT (ERC-20) için kullanıcının kendi adresi
        if (coin.id === 'ETH' || coin.id === 'USDT') {
          return {
            ...coin,
            address: walletAddress || '',
          };
        }
        
        // Diğer zincirler için şimdilik boş (coming soon)
        // TODO: Multi-chain wallet desteği eklendiğinde güncelle
        return {
          ...coin,
          address: '', // Coming soon
          memo: coin.id === 'XRP' ? '' : undefined,
        };
      });
      
      setCoins(coinsWithAddresses);
    } catch (err) {
      console.error('Fetch deposit addresses error:', err);
      setCoins(DEFAULT_COINS.map(c => ({ ...c, address: '' })));
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, maxHeight: '80%' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.selectCoin}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#f59e0b" style={{ padding: 40 }} />
          ) : (
            <ScrollView style={styles.coinList}>
              {coins.map((coin) => (
                <TouchableOpacity
                  key={coin.id}
                  style={[styles.coinItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onSelectCoin(coin)}
                >
                  <View style={[styles.coinIcon, { backgroundColor: coin.color + '20' }]}>
                    <Text style={{ fontSize: 24, color: coin.color }}>{coin.icon}</Text>
                  </View>
                  <View style={styles.coinInfo}>
                    <Text style={[styles.coinName, { color: colors.text }]}>{coin.name}</Text>
                    <Text style={[styles.coinNetwork, { color: colors.textSecondary }]}>{coin.network}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// DEPOSIT ADDRESS MODAL (with QR Code)
// ============================================
interface DepositAddressModalProps {
  visible: boolean;
  onClose: () => void;
  coin: DepositCoin | null;
}

export const DepositAddressModal: React.FC<DepositAddressModalProps> = ({ visible, onClose, coin }) => {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;
  const [copied, setCopied] = useState(false);
  const [memoCopied, setMemoCopied] = useState(false);

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  if (!coin) return null;

  const handleCopyAddress = () => {
    Clipboard.setString(coin.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMemo = () => {
    if (coin.memo) {
      Clipboard.setString(coin.memo);
      setMemoCopied(true);
      setTimeout(() => setMemoCopied(false), 2000);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.coinIcon, { backgroundColor: coin.color + '20' }]}>
                <Text style={{ fontSize: 20, color: coin.color }}>{coin.icon}</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{coin.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          
          <ScrollView style={styles.addressContent}>
            {/* QR Code */}
            <View style={styles.qrContainer}>
              <View style={[styles.qrBox, { backgroundColor: '#ffffff' }]}>
                <QRCode value={coin.address} size={180} backgroundColor="#ffffff" color="#000000" />
              </View>
              <Text style={[styles.scanText, { color: colors.textSecondary }]}>{t.scanQr}</Text>
            </View>

            {/* Address */}
            <View style={[styles.addressBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>{t.address}</Text>
              <Text style={[styles.addressText, { color: colors.text }]} selectable>{coin.address}</Text>
              <TouchableOpacity style={[styles.copyButton, { backgroundColor: coin.color }]} onPress={handleCopyAddress}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color="#fff" />
                <Text style={styles.copyButtonText}>{copied ? t.copied : t.copyAddress}</Text>
              </TouchableOpacity>
            </View>

            {/* Memo (for XRP) */}
            {coin.memo && (
              <View style={[styles.addressBox, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="warning" size={16} color={colors.error} />
                  <Text style={[styles.addressLabel, { color: colors.error }]}>{t.memo}</Text>
                </View>
                <Text style={[styles.addressText, { color: colors.text, fontSize: 20, fontWeight: '700' }]}>{coin.memo}</Text>
                <Text style={[styles.memoWarning, { color: colors.error }]}>{t.memoWarning}</Text>
                <TouchableOpacity style={[styles.copyButton, { backgroundColor: colors.error }]} onPress={handleCopyMemo}>
                  <Ionicons name={memoCopied ? "checkmark" : "copy-outline"} size={18} color="#fff" />
                  <Text style={styles.copyButtonText}>{memoCopied ? t.copied : t.copyAddress}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Network Info */}
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.network}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{coin.network}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.minDeposit}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{coin.minDeposit}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.confirmTime}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{coin.confirmTime}</Text>
              </View>
            </View>

            {/* Warning */}
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                {t.warningText.replace('{coin}', coin.id).replace('{network}', coin.network)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// USD DEPOSIT MODAL
// ============================================
interface UsdDepositModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UsdDepositModal: React.FC<UsdDepositModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    surface: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>USD Deposit</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          
          <View style={styles.comingSoon}>
            <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.comingSoonText, { color: colors.text }]}>Coming Soon</Text>
            <Text style={[styles.comingSoonDesc, { color: colors.textSecondary }]}>
              Bank transfer and card payments will be available soon.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  methodList: {
    padding: 16,
    gap: 12,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodInfo: {
    flex: 1,
  },
  methodRowTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  methodRowDesc: {
    fontSize: 13,
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  methodOptions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  methodCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  coinList: {
    padding: 16,
  },
  coinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  coinIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 16,
    fontWeight: '600',
  },
  coinNetwork: {
    fontSize: 12,
    marginTop: 2,
  },
  addressContent: {
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  scanText: {
    fontSize: 14,
  },
  addressBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  memoWarning: {
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  comingSoon: {
    alignItems: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  comingSoonDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
