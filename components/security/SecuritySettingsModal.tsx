// components/security/SecuritySettingsModal.tsx
// Ana Güvenlik Ayarları Modalı
// TR/EN | Dark/Light Mode

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';

// Sub-components
import { TwoFactorSetup } from './TwoFactorSetup';
import { BiometricSetup } from './BiometricSetup';
import { DeviceManager } from './DeviceManager';
import { SessionManager } from './SessionManager';
import { SecurityLogs } from './SecurityLogs';
import { API_URL } from '@/constants/api';

const API_BASE_URL = API_URL;

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface SecurityStatus {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  trustedDevices: number;
  activeSessions: number;
  securityScore: number;
  backupCodesRemaining?: number;
}

type TabType = 'overview' | '2fa' | 'biometric' | 'devices' | 'sessions' | 'logs';

const translations = {
  tr: {
    title: 'Güvenlik Ayarları',
    subtitle: 'Hesabınızı koruyun',
    overview: 'Genel',
    twofa: '2FA',
    biometric: 'Bio',
    devices: 'Cihaz',
    sessions: 'Oturum',
    logs: 'Log',
    securityScore: 'Güvenlik Skoru',
    weak: 'Zayıf',
    medium: 'Orta',
    strong: 'Güçlü',
    active: 'Aktif',
    off: 'Kapalı',
    trusted: 'güvenilir',
    recommendations: 'Öneriler',
    enable2FA: '2FA\'yı Aktifleştirin',
    enable2FADesc: 'Hesabınızı ekstra güvenlik katmanıyla koruyun',
    addBiometric: 'Biyometrik Ekleyin',
    addBiometricDesc: 'Touch ID veya Face ID ile hızlı ve güvenli giriş',
    great: 'Harika!',
    wellProtected: 'Hesabınız güçlü bir şekilde korunuyor',
    backup: 'yedek',
  },
  en: {
    title: 'Security Settings',
    subtitle: 'Protect your account',
    overview: 'Overview',
    twofa: '2FA',
    biometric: 'Bio',
    devices: 'Device',
    sessions: 'Session',
    logs: 'Logs',
    securityScore: 'Security Score',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    active: 'Active',
    off: 'Off',
    trusted: 'trusted',
    recommendations: 'Recommendations',
    enable2FA: 'Enable 2FA',
    enable2FADesc: 'Protect your account with an extra layer of security',
    addBiometric: 'Add Biometric',
    addBiometricDesc: 'Quick and secure login with Touch ID or Face ID',
    great: 'Great!',
    wellProtected: 'Your account is well protected',
    backup: 'backup',
  },
};

export function SecuritySettingsModal({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const { theme, language, walletAddress } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SecurityStatus | null>(null);

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
    if (visible && walletAddress) {
      fetchSecurityStatus();
    }
  }, [visible, walletAddress]);

  const fetchSecurityStatus = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      // Fetch 2FA status
      const twoFARes = await fetch(`${API_BASE_URL}/api/security/2fa/status`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const twoFAData = await twoFARes.json();

      // Fetch biometric status
      const bioRes = await fetch(`${API_BASE_URL}/api/security/biometric`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const bioData = await bioRes.json();

      // Fetch devices
      const devicesRes = await fetch(`${API_BASE_URL}/api/security/devices`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const devicesData = await devicesRes.json();

      // Fetch sessions
      const sessionsRes = await fetch(`${API_BASE_URL}/api/security/sessions`, {
        headers: { 'x-wallet-address': walletAddress },
      });
      const sessionsData = await sessionsRes.json();

      // Calculate security score
      let score = 20;
      if (twoFAData.enabled) score += 35;
      if (bioData.enabled) score += 20;
      if (twoFAData.backupCodesRemaining >= 4) score += 10;
      if (devicesData.trustedDevices > 0 && devicesData.trustedDevices <= 3) score += 10;
      if (sessionsData.totalActive <= 2) score += 5;

      setStatus({
        twoFactorEnabled: twoFAData.enabled || false,
        biometricEnabled: bioData.enabled || false,
        trustedDevices: devicesData.trustedDevices || 0,
        activeSessions: sessionsData.totalActive || 0,
        securityScore: Math.min(100, score),
        backupCodesRemaining: twoFAData.backupCodesRemaining,
      });
    } catch (error) {
      console.error('Security status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t.strong;
    if (score >= 50) return t.medium;
    return t.weak;
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: t.overview, icon: 'shield-checkmark' },
    { id: '2fa', label: t.twofa, icon: 'lock-closed' },
    { id: 'biometric', label: t.biometric, icon: 'finger-print' },
    { id: 'devices', label: t.devices, icon: 'phone-portrait' },
    { id: 'sessions', label: t.sessions, icon: 'key' },
    { id: 'logs', label: t.logs, icon: 'list' },
  ];

  const renderOverview = () => {
    if (!status) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Security Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreTitle, { color: colors.text }]}>{t.securityScore}</Text>
            <View style={styles.scoreValue}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(status.securityScore) }]}>
                {status.securityScore}
              </Text>
              <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>/100</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${status.securityScore}%`,
                  backgroundColor: getScoreColor(status.securityScore),
                }
              ]} 
            />
          </View>
          
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(status.securityScore) + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color: getScoreColor(status.securityScore) }]}>
              {getScoreLabel(status.securityScore)}
            </Text>
          </View>
        </View>

        {/* Status Cards Grid */}
        <View style={styles.statusGrid}>
          {/* 2FA Status */}
          <TouchableOpacity 
            style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setActiveTab('2fa')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardIcon}>🔐</Text>
              <Text style={[styles.statusCardLabel, { color: colors.textSecondary }]}>2FA</Text>
            </View>
            <Text style={[
              styles.statusCardValue, 
              { color: status.twoFactorEnabled ? colors.primary : colors.danger }
            ]}>
              {status.twoFactorEnabled ? t.active : t.off}
            </Text>
            {status.twoFactorEnabled && status.backupCodesRemaining !== undefined && (
              <Text style={[styles.statusCardSub, { color: colors.textSecondary }]}>
                {status.backupCodesRemaining} {t.backup}
              </Text>
            )}
          </TouchableOpacity>

          {/* Biometric Status */}
          <TouchableOpacity 
            style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setActiveTab('biometric')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardIcon}>👆</Text>
              <Text style={[styles.statusCardLabel, { color: colors.textSecondary }]}>Bio</Text>
            </View>
            <Text style={[
              styles.statusCardValue, 
              { color: status.biometricEnabled ? colors.primary : colors.textSecondary }
            ]}>
              {status.biometricEnabled ? t.active : t.off}
            </Text>
          </TouchableOpacity>

          {/* Devices */}
          <TouchableOpacity 
            style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setActiveTab('devices')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardIcon}>📱</Text>
              <Text style={[styles.statusCardLabel, { color: colors.textSecondary }]}>{t.devices}</Text>
            </View>
            <Text style={[styles.statusCardValue, { color: colors.text }]}>
              {status.trustedDevices}
            </Text>
            <Text style={[styles.statusCardSub, { color: colors.textSecondary }]}>
              {t.trusted}
            </Text>
          </TouchableOpacity>

          {/* Sessions */}
          <TouchableOpacity 
            style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setActiveTab('sessions')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardIcon}>🔑</Text>
              <Text style={[styles.statusCardLabel, { color: colors.textSecondary }]}>{t.sessions}</Text>
            </View>
            <Text style={[styles.statusCardValue, { color: colors.text }]}>
              {status.activeSessions}
            </Text>
            <Text style={[styles.statusCardSub, { color: colors.textSecondary }]}>
              {t.active.toLowerCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations */}
        <View style={[styles.recommendationsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.recommendationsTitle, { color: colors.text }]}>{t.recommendations}</Text>
          
          {!status.twoFactorEnabled && (
            <TouchableOpacity 
              style={[styles.recommendationItem, { backgroundColor: '#f59e0b10', borderColor: '#f59e0b30' }]}
              onPress={() => setActiveTab('2fa')}
            >
              <Text style={styles.recommendationIcon}>⚠️</Text>
              <View style={styles.recommendationContent}>
                <Text style={[styles.recommendationTitle, { color: '#f59e0b' }]}>{t.enable2FA}</Text>
                <Text style={[styles.recommendationDesc, { color: colors.textSecondary }]}>
                  {t.enable2FADesc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {!status.biometricEnabled && (
            <TouchableOpacity 
              style={[styles.recommendationItem, { backgroundColor: '#3b82f610', borderColor: '#3b82f630' }]}
              onPress={() => setActiveTab('biometric')}
            >
              <Text style={styles.recommendationIcon}>💡</Text>
              <View style={styles.recommendationContent}>
                <Text style={[styles.recommendationTitle, { color: '#3b82f6' }]}>{t.addBiometric}</Text>
                <Text style={[styles.recommendationDesc, { color: colors.textSecondary }]}>
                  {t.addBiometricDesc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {status.securityScore >= 80 && (
            <View style={[styles.recommendationItem, { backgroundColor: '#10b98110', borderColor: '#10b98130' }]}>
              <Text style={styles.recommendationIcon}>✅</Text>
              <View style={styles.recommendationContent}>
                <Text style={[styles.recommendationTitle, { color: '#10b981' }]}>{t.great}</Text>
                <Text style={[styles.recommendationDesc, { color: colors.textSecondary }]}>
                  {t.wellProtected}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case '2fa':
        return <TwoFactorSetup onStatusChange={fetchSecurityStatus} />;
      case 'biometric':
        return <BiometricSetup onStatusChange={fetchSecurityStatus} />;
      case 'devices':
        return <DeviceManager />;
      case 'sessions':
        return <SessionManager />;
      case 'logs':
        return <SecurityLogs />;
      default:
        return renderOverview();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
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
                activeTab === tab.id && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? colors.primary : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Score Card
  scoreCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Status Grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusCardIcon: {
    fontSize: 16,
  },
  statusCardLabel: {
    fontSize: 11,
  },
  statusCardValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusCardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  // Recommendations
  recommendationsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  recommendationIcon: {
    fontSize: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  recommendationDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
