// app/wallet-info.tsx
// Cüzdan Bilgileri Sayfası

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function WalletInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme, setWalletAddress: setGlobalWalletAddress } = useStore();
  
  const { t } = useTranslation('walletInfo');
  const { t: commonT } = useTranslation('common');
  
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const colors = {
    background: isDark ? '#0F172A' : '#f8fafc',
    surface: isDark ? '#1E293B' : '#ffffff',
    primary: '#10B981',
    text: isDark ? '#FFFFFF' : '#0f172a',
    textSecondary: isDark ? '#94A3B8' : '#64748b',
    error: '#EF4444',
    border: isDark ? '#334155' : '#e2e8f0',
    overlay: 'rgba(0, 0, 0, 0.6)',
  };

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    const address = await AsyncStorage.getItem('auxite_wallet_address');
    setWalletAddress(address);
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetWallet = () => {
    setShowResetModal(true);
  };

  const confirmResetWallet = async () => {
    setShowResetModal(false);
    await AsyncStorage.multiRemove([
      'auxite_has_wallet',
      'auxite_password_hash',
      'auxite_encrypted_seed',
      'auxite_wallet_address',
    ]);
    // Global state'i de sıfırla
    setGlobalWalletAddress(null);
    router.replace('/wallet-onboarding');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.walletInfo}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Wallet Card */}
      <View style={[styles.walletCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>{t.walletAddress}</Text>
        <Text style={[styles.walletAddress, { color: colors.text }]} numberOfLines={1}>
          {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}` : '-'}
        </Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.primary} />
          <Text style={[styles.copyButtonText, { color: colors.primary }]}>
            {copied ? t.copied : t.copyAddress}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.actionIcon}>
            <Ionicons name="key-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{t.showSeedPhrase}</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{t.showSeedPhraseDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.actionIcon}>
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{t.backup}</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{t.backupDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, styles.dangerAction, { backgroundColor: colors.surface }]} 
          onPress={handleResetWallet}
        >
          <View style={[styles.actionIcon, styles.dangerIcon]}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, styles.dangerText, { color: colors.error }]}>{t.resetWallet}</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{t.resetWalletDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Warning Icon */}
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={40} color={colors.error} />
            </View>
            
            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t.resetConfirmTitle}
            </Text>
            
            {/* Message */}
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {t.resetConfirmMessage}
            </Text>
            
            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {commonT.cancel}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.dangerButton]}
                onPress={confirmResetWallet}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                  {t.resetWallet}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  walletCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  walletIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  dangerAction: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dangerText: {
    color: '#EF4444',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
