// components/TransactionExportModal.tsx
// Export transactions as CSV
// 6-Language Support | Dark/Light Mode

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

// Optional imports - may not be installed
let FileSystem: any = null;
let Sharing: any = null;

try {
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
} catch (e) {
  console.log('expo-file-system or expo-sharing not installed');
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
    title: 'İşlem Geçmişini Dışa Aktar',
    dateRange: 'Tarih Aralığı',
    startDate: 'Başlangıç',
    endDate: 'Bitiş',
    allTime: 'Tüm Zamanlar',
    last7Days: 'Son 7 Gün',
    last30Days: 'Son 30 Gün',
    last90Days: 'Son 90 Gün',
    thisYear: 'Bu Yıl',
    transactionTypes: 'İşlem Türleri',
    allTypes: 'Tümü',
    buy: 'Alım',
    sell: 'Satım',
    deposit: 'Yatırım',
    withdraw: 'Çekim',
    exchange: 'Dönüşüm',
    stake: 'Stake',
    transfer: 'Transfer',
    format: 'Format',
    exportBtn: 'CSV İndir',
    cancel: 'İptal',
    downloading: 'İndiriliyor...',
    success: 'Başarılı',
    exportSuccess: 'İşlem geçmişi başarıyla dışa aktarıldı.',
    error: 'Hata',
    exportError: 'Dışa aktarma başarısız oldu.',
    noData: 'Dışa aktarılacak işlem bulunamadı.',
    share: 'Paylaş',
  },
  en: {
    title: 'Export Transaction History',
    dateRange: 'Date Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    allTime: 'All Time',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    last90Days: 'Last 90 Days',
    thisYear: 'This Year',
    transactionTypes: 'Transaction Types',
    allTypes: 'All Types',
    buy: 'Buy',
    sell: 'Sell',
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    exchange: 'Exchange',
    stake: 'Stake',
    transfer: 'Transfer',
    format: 'Format',
    exportBtn: 'Download CSV',
    cancel: 'Cancel',
    downloading: 'Downloading...',
    success: 'Success',
    exportSuccess: 'Transaction history exported successfully.',
    error: 'Error',
    exportError: 'Export failed.',
    noData: 'No transactions to export.',
    share: 'Share',
  },
  de: {
    title: 'Transaktionsverlauf exportieren',
    dateRange: 'Zeitraum',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    allTime: 'Gesamter Zeitraum',
    last7Days: 'Letzte 7 Tage',
    last30Days: 'Letzte 30 Tage',
    last90Days: 'Letzte 90 Tage',
    thisYear: 'Dieses Jahr',
    transactionTypes: 'Transaktionstypen',
    allTypes: 'Alle Typen',
    buy: 'Kauf',
    sell: 'Verkauf',
    deposit: 'Einzahlung',
    withdraw: 'Auszahlung',
    exchange: 'Tausch',
    stake: 'Staking',
    transfer: 'Transfer',
    format: 'Format',
    exportBtn: 'CSV herunterladen',
    cancel: 'Abbrechen',
    downloading: 'Wird heruntergeladen...',
    success: 'Erfolgreich',
    exportSuccess: 'Transaktionsverlauf erfolgreich exportiert.',
    error: 'Fehler',
    exportError: 'Export fehlgeschlagen.',
    noData: 'Keine Transaktionen zum Exportieren.',
    share: 'Teilen',
  },
  fr: {
    title: 'Exporter l\'historique',
    dateRange: 'Période',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    allTime: 'Tout le temps',
    last7Days: '7 derniers jours',
    last30Days: '30 derniers jours',
    last90Days: '90 derniers jours',
    thisYear: 'Cette année',
    transactionTypes: 'Types de transactions',
    allTypes: 'Tous les types',
    buy: 'Achat',
    sell: 'Vente',
    deposit: 'Dépôt',
    withdraw: 'Retrait',
    exchange: 'Échange',
    stake: 'Staking',
    transfer: 'Transfert',
    format: 'Format',
    exportBtn: 'Télécharger CSV',
    cancel: 'Annuler',
    downloading: 'Téléchargement...',
    success: 'Succès',
    exportSuccess: 'Historique exporté avec succès.',
    error: 'Erreur',
    exportError: 'Échec de l\'exportation.',
    noData: 'Aucune transaction à exporter.',
    share: 'Partager',
  },
  ar: {
    title: 'تصدير سجل المعاملات',
    dateRange: 'نطاق التاريخ',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    allTime: 'كل الوقت',
    last7Days: 'آخر 7 أيام',
    last30Days: 'آخر 30 يوم',
    last90Days: 'آخر 90 يوم',
    thisYear: 'هذا العام',
    transactionTypes: 'أنواع المعاملات',
    allTypes: 'جميع الأنواع',
    buy: 'شراء',
    sell: 'بيع',
    deposit: 'إيداع',
    withdraw: 'سحب',
    exchange: 'تبادل',
    stake: 'تخزين',
    transfer: 'تحويل',
    format: 'التنسيق',
    exportBtn: 'تحميل CSV',
    cancel: 'إلغاء',
    downloading: 'جارٍ التحميل...',
    success: 'نجاح',
    exportSuccess: 'تم تصدير السجل بنجاح.',
    error: 'خطأ',
    exportError: 'فشل التصدير.',
    noData: 'لا توجد معاملات للتصدير.',
    share: 'مشاركة',
  },
  ru: {
    title: 'Экспорт истории',
    dateRange: 'Период',
    startDate: 'Начало',
    endDate: 'Конец',
    allTime: 'Всё время',
    last7Days: 'Последние 7 дней',
    last30Days: 'Последние 30 дней',
    last90Days: 'Последние 90 дней',
    thisYear: 'Этот год',
    transactionTypes: 'Типы транзакций',
    allTypes: 'Все типы',
    buy: 'Покупка',
    sell: 'Продажа',
    deposit: 'Депозит',
    withdraw: 'Вывод',
    exchange: 'Обмен',
    stake: 'Стейкинг',
    transfer: 'Перевод',
    format: 'Формат',
    exportBtn: 'Скачать CSV',
    cancel: 'Отмена',
    downloading: 'Загрузка...',
    success: 'Успешно',
    exportSuccess: 'История успешно экспортирована.',
    error: 'Ошибка',
    exportError: 'Ошибка экспорта.',
    noData: 'Нет транзакций для экспорта.',
    share: 'Поделиться',
  },
};

type DateRangeKey = 'all' | '7d' | '30d' | '90d' | 'year';

export default function TransactionExportModal({ visible, onClose, walletAddress }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [dateRange, setDateRange] = useState<DateRangeKey>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    primary: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const dateRangeOptions: { key: DateRangeKey; label: string }[] = [
    { key: 'all', label: t.allTime },
    { key: '7d', label: t.last7Days },
    { key: '30d', label: t.last30Days },
    { key: '90d', label: t.last90Days },
    { key: 'year', label: t.thisYear },
  ];

  const transactionTypes = [
    { value: 'buy', label: t.buy },
    { value: 'sell', label: t.sell },
    { value: 'deposit', label: t.deposit },
    { value: 'withdraw', label: t.withdraw },
    { value: 'exchange', label: t.exchange },
    { value: 'stake', label: t.stake },
    { value: 'transfer', label: t.transfer },
  ];

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    switch (dateRange) {
      case '7d':
        const d7 = new Date(now.setDate(now.getDate() - 7));
        return { startDate: d7.toISOString().split('T')[0], endDate };
      case '30d':
        const d30 = new Date(now.setDate(now.getDate() - 30));
        return { startDate: d30.toISOString().split('T')[0], endDate };
      case '90d':
        const d90 = new Date(now.setDate(now.getDate() - 90));
        return { startDate: d90.toISOString().split('T')[0], endDate };
      case 'year':
        return { startDate: `${new Date().getFullYear()}-01-01`, endDate };
      default:
        return {};
    }
  };

  const handleExport = async () => {
    if (!walletAddress) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        address: walletAddress,
        format: 'csv',
        lang: language,
      });

      const { startDate, endDate } = getDateRange();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedTypes.length > 0) params.set('type', selectedTypes.join(','));

      const response = await fetch(`${API_URL}/api/transactions/export?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const csvText = await response.text();

      if (!csvText || csvText.length < 10) {
        Alert.alert(t.error, t.noData);
        return;
      }

      // Try to save and share file if libraries are available
      if (FileSystem && Sharing) {
        const filename = `auxite_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        const fileUri = FileSystem.documentDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, csvText, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: t.share,
          });
        } else {
          Alert.alert(t.success, t.exportSuccess);
        }
      } else {
        // Fallback: use native Share
        await Share.share({
          message: csvText,
          title: `auxite_transactions_${new Date().toISOString().split('T')[0]}.csv`,
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      Alert.alert(t.error, err.message || t.exportError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Date Range */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.dateRange}</Text>
              <View style={styles.optionsWrap}>
                {dateRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: dateRange === option.key ? colors.primary : colors.surfaceAlt,
                      },
                    ]}
                    onPress={() => setDateRange(option.key)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: dateRange === option.key ? '#FFF' : colors.textSecondary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transaction Types */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.transactionTypes}</Text>
              <View style={styles.optionsWrap}>
                <TouchableOpacity
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: selectedTypes.length === 0 ? colors.primary : colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setSelectedTypes([])}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: selectedTypes.length === 0 ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {t.allTypes}
                  </Text>
                </TouchableOpacity>
                {transactionTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selectedTypes.includes(type.value)
                          ? colors.primary
                          : colors.surfaceAlt,
                      },
                    ]}
                    onPress={() => toggleType(type.value)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        {
                          color: selectedTypes.includes(type.value) ? '#FFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Format Info */}
            <View style={[styles.formatInfo, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <View style={styles.formatInfoText}>
                <Text style={[styles.formatTitle, { color: colors.text }]}>CSV {t.format}</Text>
                <Text style={[styles.formatDesc, { color: colors.textSecondary }]}>
                  Excel, Google Sheets
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, loading && styles.buttonDisabled]}
              onPress={handleExport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="download" size={18} color="#FFF" />
                  <Text style={styles.exportButtonText}>{t.exportBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  formatInfoText: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  formatDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
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
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
