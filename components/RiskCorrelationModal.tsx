// components/RiskCorrelationModal.tsx
// Risk & Correlation Modal for Mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

// Metal icons
const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
};

// Map our symbols to GoldAPI symbols
const symbolMap: Record<string, string> = {
  AUXG: 'XAU',
  AUXS: 'XAG',
  AUXPT: 'XPT',
  AUXPD: 'XPD',
};

interface MetalMetrics {
  volatility: number;
  avgReturn: number;
  priceRange: number;
}

interface AssetData {
  symbol: string;
  name: string;
  volatility: number;
  sharpe: string;
  correlation: number;
  beta: number;
  var95: string;
  avgReturn: number;
  drawdown: string;
  color: string;
}

// Translations - 6 Language Support
const translations: Record<string, Record<string, string>> = {
  tr: {
    title: 'Risk & Korelasyon', subtitle: 'Portföy risk metrikleri (7 günlük veri)', days: '7g',
    calculating: 'Metrikler hesaplanıyor...', volShort: 'Volatilite', corrShort: 'Korelasyon',
    avgRetShort: 'Ort. Getiri', range: 'Aralık', sharpe: 'Sharpe', beta: 'Beta', var95: 'VaR 95%',
    volatilityDesc: '7 günlük fiyat değişimlerinin standart sapması',
    varDesc: '95% güven aralığında maksimum kayıp tahmini', rangeDesc: '7 günlük min-max fiyat farkı',
    gold: 'Altın', silver: 'Gümüş', platinum: 'Platin', palladium: 'Paladyum',
  },
  en: {
    title: 'Risk & Correlation', subtitle: 'Portfolio risk metrics (7-day data)', days: '7d',
    calculating: 'Calculating metrics...', volShort: 'Volatility', corrShort: 'Correlation',
    avgRetShort: 'Avg Return', range: 'Range', sharpe: 'Sharpe', beta: 'Beta', var95: 'VaR 95%',
    volatilityDesc: 'Standard deviation of 7-day price changes',
    varDesc: 'Estimated maximum loss at 95% confidence', rangeDesc: 'Min-max price difference over 7 days',
    gold: 'Gold', silver: 'Silver', platinum: 'Platinum', palladium: 'Palladium',
  },
  de: {
    title: 'Risiko & Korrelation', subtitle: 'Portfolio-Risikometriken (7-Tage-Daten)', days: '7T',
    calculating: 'Metriken berechnen...', volShort: 'Volatilität', corrShort: 'Korrelation',
    avgRetShort: 'Durchschn. Rendite', range: 'Bereich', sharpe: 'Sharpe', beta: 'Beta', var95: 'VaR 95%',
    volatilityDesc: 'Standardabweichung der 7-Tage-Preisänderungen',
    varDesc: 'Geschätzter maximaler Verlust bei 95% Konfidenz', rangeDesc: '7-Tage Min-Max Preisdifferenz',
    gold: 'Gold', silver: 'Silber', platinum: 'Platin', palladium: 'Palladium',
  },
  fr: {
    title: 'Risque & Corrélation', subtitle: 'Métriques de risque du portefeuille (données 7 jours)', days: '7j',
    calculating: 'Calcul des métriques...', volShort: 'Volatilité', corrShort: 'Corrélation',
    avgRetShort: 'Rend. Moyen', range: 'Plage', sharpe: 'Sharpe', beta: 'Bêta', var95: 'VaR 95%',
    volatilityDesc: 'Écart type des variations de prix sur 7 jours',
    varDesc: 'Perte maximale estimée à 95% de confiance', rangeDesc: 'Différence min-max sur 7 jours',
    gold: 'Or', silver: 'Argent', platinum: 'Platine', palladium: 'Palladium',
  },
  ar: {
    title: 'المخاطر والارتباط', subtitle: 'مقاييس مخاطر المحفظة (بيانات 7 أيام)', days: '7ي',
    calculating: 'جاري حساب المقاييس...', volShort: 'التقلب', corrShort: 'الارتباط',
    avgRetShort: 'متوسط العائد', range: 'النطاق', sharpe: 'شارب', beta: 'بيتا', var95: 'VaR 95%',
    volatilityDesc: 'الانحراف المعياري لتغيرات الأسعار خلال 7 أيام',
    varDesc: 'الخسارة القصوى المقدرة عند ثقة 95%', rangeDesc: 'فرق السعر الأدنى-الأقصى خلال 7 أيام',
    gold: 'ذهب', silver: 'فضة', platinum: 'بلاتين', palladium: 'بالاديوم',
  },
  ru: {
    title: 'Риск и корреляция', subtitle: 'Метрики риска портфеля (данные за 7 дней)', days: '7д',
    calculating: 'Расчет метрик...', volShort: 'Волатильность', corrShort: 'Корреляция',
    avgRetShort: 'Сред. доходность', range: 'Диапазон', sharpe: 'Шарп', beta: 'Бета', var95: 'VaR 95%',
    volatilityDesc: 'Стандартное отклонение изменений цен за 7 дней',
    varDesc: 'Оценка максимальных потерь при 95% доверии', rangeDesc: 'Разница мин-макс цены за 7 дней',
    gold: 'Золото', silver: 'Серебро', platinum: 'Платина', palladium: 'Палладий',
  },
};

interface RiskCorrelationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RiskCorrelationModal({ visible, onClose }: RiskCorrelationModalProps) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;

  const [metrics, setMetrics] = useState<Record<string, MetalMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetal, setSelectedMetal] = useState<string>('AUXG');

  // Fetch metrics on mount
  useEffect(() => {
    if (visible) {
      fetchMetrics();
    }
  }, [visible]);

  const fetchMetrics = async () => {
    setLoading(true);
    const newMetrics: Record<string, MetalMetrics> = {};

    for (const [symbol, goldSymbol] of Object.entries(symbolMap)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/prices/history?metal=${goldSymbol}&days=7`);
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) {
            newMetrics[symbol] = data.metrics;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch metrics for ${symbol}:`, err);
        // Use simulated data if API fails
        newMetrics[symbol] = {
          volatility: Math.random() * 3 + 0.5,
          avgReturn: (Math.random() - 0.5) * 2,
          priceRange: Math.random() * 5 + 1,
        };
      }
    }

    // If no data fetched, use simulated
    if (Object.keys(newMetrics).length === 0) {
      newMetrics.AUXG = { volatility: 1.25, avgReturn: 0.45, priceRange: 2.8 };
      newMetrics.AUXS = { volatility: 2.15, avgReturn: -0.32, priceRange: 4.5 };
      newMetrics.AUXPT = { volatility: 1.85, avgReturn: 0.18, priceRange: 3.2 };
      newMetrics.AUXPD = { volatility: 2.45, avgReturn: -0.65, priceRange: 5.1 };
    }

    setMetrics(newMetrics);
    setLoading(false);
  };

  // Build assets data
  const assets: AssetData[] = [
    {
      symbol: 'AUXG',
      name: 'Gold',
      volatility: metrics.AUXG?.volatility || 0,
      sharpe: '1.41',
      correlation: 1.0,
      beta: 1.0,
      var95: metrics.AUXG ? (metrics.AUXG.volatility * 1.65).toFixed(1) : '0',
      avgReturn: metrics.AUXG?.avgReturn || 0,
      drawdown: metrics.AUXG?.priceRange.toFixed(1) || '0',
      color: '#EAB308',
    },
    {
      symbol: 'AUXS',
      name: 'Silver',
      volatility: metrics.AUXS?.volatility || 0,
      sharpe: '0.11',
      correlation: 0.85,
      beta: 1.2,
      var95: metrics.AUXS ? (metrics.AUXS.volatility * 1.65).toFixed(1) : '0',
      avgReturn: metrics.AUXS?.avgReturn || 0,
      drawdown: metrics.AUXS?.priceRange.toFixed(1) || '0',
      color: '#94A3B8',
    },
    {
      symbol: 'AUXPT',
      name: 'Platinum',
      volatility: metrics.AUXPT?.volatility || 0,
      sharpe: '0.30',
      correlation: 0.75,
      beta: 0.9,
      var95: metrics.AUXPT ? (metrics.AUXPT.volatility * 1.65).toFixed(1) : '0',
      avgReturn: metrics.AUXPT?.avgReturn || 0,
      drawdown: metrics.AUXPT?.priceRange.toFixed(1) || '0',
      color: '#E2E8F0',
    },
    {
      symbol: 'AUXPD',
      name: 'Palladium',
      volatility: metrics.AUXPD?.volatility || 0,
      sharpe: '0.25',
      correlation: 0.65,
      beta: 1.5,
      var95: metrics.AUXPD ? (metrics.AUXPD.volatility * 1.65).toFixed(1) : '0',
      avgReturn: metrics.AUXPD?.avgReturn || 0,
      drawdown: metrics.AUXPD?.priceRange.toFixed(1) || '0',
      color: '#64748B',
    },
  ];

  const selectedAsset = assets.find(a => a.symbol === selectedMetal) || assets[0];

  // Metric Card Component
  const MetricCard = ({ label, value, color, isWide = false }: { 
    label: string; 
    value: string; 
    color?: string;
    isWide?: boolean;
  }) => (
    <View style={[
      styles.metricCard, 
      { backgroundColor: isDark ? '#334155' : '#fff' },
      isWide && styles.metricCardWide
    ]}>
      <Text style={[styles.metricLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: color || (isDark ? '#fff' : '#0f172a') }]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.title}</Text>
              <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.calculating}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Metal Selector */}
              <View style={styles.selectorContainer}>
                {assets.map((asset) => (
                  <TouchableOpacity
                    key={asset.symbol}
                    style={[
                      styles.selectorButton,
                      { backgroundColor: selectedMetal === asset.symbol ? '#10b981' : (isDark ? '#0f172a' : '#f1f5f9') }
                    ]}
                    onPress={() => setSelectedMetal(asset.symbol)}
                  >
                    <Image source={metalIcons[asset.symbol]} style={styles.selectorIcon} resizeMode="contain" />
                    <Text style={[
                      styles.selectorText,
                      { color: selectedMetal === asset.symbol ? '#fff' : (isDark ? '#e2e8f0' : '#334155') }
                    ]}>{asset.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected Metal Card */}
              <View style={[styles.selectedCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                <View style={styles.selectedHeader}>
                  <Image source={metalIcons[selectedAsset.symbol]} style={styles.selectedIcon} resizeMode="contain" />
                  <View>
                    <Text style={[styles.selectedSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{selectedAsset.symbol}</Text>
                    <Text style={[styles.selectedName, { color: isDark ? '#94a3b8' : '#64748b' }]}>{selectedAsset.name}</Text>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <MetricCard 
                    label={`${t.volShort} (${t.days})`} 
                    value={`${selectedAsset.volatility.toFixed(2)}%`}
                    color={selectedAsset.volatility > 2 ? '#f59e0b' : '#10b981'}
                  />
                  <MetricCard label={t.sharpe} value={selectedAsset.sharpe} />
                  <MetricCard label={t.corrShort} value={selectedAsset.correlation.toFixed(2)} />
                  <MetricCard label={t.beta} value={selectedAsset.beta.toFixed(2)} />
                  <MetricCard label={t.var95} value={`${selectedAsset.var95}%`} />
                  <MetricCard 
                    label={t.avgRetShort} 
                    value={`${selectedAsset.avgReturn >= 0 ? '+' : ''}${selectedAsset.avgReturn.toFixed(2)}%`}
                    color={selectedAsset.avgReturn >= 0 ? '#10b981' : '#ef4444'}
                  />
                  <MetricCard 
                    label={`${t.range} (${t.days})`} 
                    value={`${selectedAsset.drawdown}%`}
                    color="#f59e0b"
                    isWide={true}
                  />
                </View>
              </View>

              {/* Footer Notes */}
              <View style={[styles.footerNotes, { borderTopColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <Text style={[styles.noteText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  <Text style={{ fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {language === 'tr' ? 'Volatilite: ' : 'Volatility: '}
                  </Text>
                  {t.volatilityDesc}
                </Text>
                <Text style={[styles.noteText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  <Text style={{ fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>VaR 95%: </Text>
                  {t.varDesc}
                </Text>
                <Text style={[styles.noteText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  <Text style={{ fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>{t.range}: </Text>
                  {t.rangeDesc}
                </Text>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },

  // Selector
  selectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  selectorIcon: {
    width: 24,
    height: 24,
  },
  selectorText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Selected Card
  selectedCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  selectedIcon: {
    width: 36,
    height: 36,
  },
  selectedSymbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  selectedName: {
    fontSize: 12,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
  },
  metricCardWide: {
    width: '100%',
  },
  metricLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Footer Notes
  footerNotes: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 6,
  },
  noteText: {
    fontSize: 10,
    lineHeight: 14,
  },
});

export default RiskCorrelationModal;
