// components/security/AdvancedSecurityModal.tsx
// Gelişmiş Güvenlik Ayarları Modalı
// MultiSig, Transaction Limits, Emergency, Insurance
// TR/EN | Dark/Light Mode

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/stores/useStore';

// Sub-components
import { MultiSigSettings } from './MultiSigSettings';
import { TransactionLimitsSettings } from './TransactionLimitsSettings';
import { EmergencySettings } from './EmergencySettings';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'multisig' | 'limits' | 'emergency' | 'insurance';

const translations = {
  tr: {
    title: 'Gelişmiş Güvenlik',
    tabs: {
      multisig: 'Çoklu İmza',
      limits: 'Limitler',
      emergency: 'Acil',
      insurance: 'Sigorta',
    },
    insurance: {
      title: 'Varlık Sigortası',
      subtitle: 'Varlıklarınız için koruma',
      comingSoon: 'Yakında',
      description: 'Varlık sigortası özelliği yakında aktif olacak. Bu özellik ile:',
      features: [
        'Hack ve güvenlik ihlallerine karşı koruma',
        'Smart contract hatalarına karşı sigorta',
        'Çalınma durumunda tazminat',
        '7/24 güvenlik izleme',
      ],
      notifyMe: 'Beni Bilgilendir',
      notified: 'Bilgilendirileceksiniz',
    },
  },
  en: {
    title: 'Advanced Security',
    tabs: {
      multisig: 'Multi-Sig',
      limits: 'Limits',
      emergency: 'Emergency',
      insurance: 'Insurance',
    },
    insurance: {
      title: 'Asset Insurance',
      subtitle: 'Protection for your assets',
      comingSoon: 'Coming Soon',
      description: 'Asset insurance feature will be available soon. This feature includes:',
      features: [
        'Protection against hacks and security breaches',
        'Smart contract failure insurance',
        'Compensation in case of theft',
        '24/7 security monitoring',
      ],
      notifyMe: 'Notify Me',
      notified: 'You\'ll be notified',
    },
  },
};

export function AdvancedSecurityModal({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [activeTab, setActiveTab] = useState<TabType>('multisig');
  const [insuranceNotified, setInsuranceNotified] = useState(false);

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

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'multisig', label: t.tabs.multisig, icon: '👥' },
    { id: 'limits', label: t.tabs.limits, icon: '📊' },
    { id: 'emergency', label: t.tabs.emergency, icon: '🚨' },
    { id: 'insurance', label: t.tabs.insurance, icon: '🛡️' },
  ];

  const handleNotifyInsurance = async () => {
    // TODO: API call to save notification preference
    setInsuranceNotified(true);
  };

  const renderInsurance = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.insuranceContainer}
    >
      <LinearGradient
        colors={['#10b98120', '#3b82f620']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.insuranceIconContainer}
      >
        <Text style={styles.insuranceBigIcon}>🛡️</Text>
      </LinearGradient>

      <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.comingSoonText, { color: colors.primary }]}>{t.insurance.comingSoon}</Text>
      </View>

      <Text style={[styles.insuranceTitle, { color: colors.text }]}>{t.insurance.title}</Text>
      <Text style={[styles.insuranceSubtitle, { color: colors.textSecondary }]}>{t.insurance.subtitle}</Text>

      <View style={[styles.insuranceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.insuranceDesc, { color: colors.text }]}>{t.insurance.description}</Text>
        <View style={styles.featuresList}>
          {t.insurance.features.map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.notifyButton,
          { 
            backgroundColor: insuranceNotified ? colors.primary + '20' : colors.primary,
          }
        ]}
        onPress={handleNotifyInsurance}
        disabled={insuranceNotified}
      >
        {insuranceNotified ? (
          <View style={styles.notifiedContent}>
            <Ionicons name="checkmark" size={18} color={colors.primary} />
            <Text style={[styles.notifyButtonText, { color: colors.primary }]}>{t.insurance.notified}</Text>
          </View>
        ) : (
          <Text style={styles.notifyButtonText}>{t.insurance.notifyMe}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'multisig':
        return <MultiSigSettings />;
      case 'limits':
        return <TransactionLimitsSettings />;
      case 'emergency':
        return <EmergencySettings />;
      case 'insurance':
        return renderInsurance();
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#f59e0b', '#ef4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <Ionicons name="lock-closed" size={20} color="#fff" />
            </LinearGradient>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: colors.surface }]} 
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsContainer, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? colors.text : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <LinearGradient
                  colors={['#f59e0b', '#ef4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabIndicator}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  tabsContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    position: 'relative',
  },
  tabActive: {},
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Insurance
  insuranceContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  insuranceIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  insuranceBigIcon: {
    fontSize: 48,
  },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insuranceTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  insuranceSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  insuranceCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  insuranceDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  notifyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  notifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  notifiedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
