// components/TopNav.tsx
// Üst Navigasyon - Wallet Connect ile

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useColorScheme,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { useDrawer } from '@/app/(tabs)/_layout';

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

interface TopNavProps {
  onWalletPress?: () => void;
  onNotificationsPress?: () => void;
  onSupportPress?: () => void;
  notificationCount?: number;
}

export default function TopNav({ onWalletPress, onNotificationsPress, onSupportPress, notificationCount = 0 }: TopNavProps) {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { language, setLanguage, theme, walletAddress } = useStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();

  const [langModalOpen, setLangModalOpen] = useState(false);

  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const isWalletConnected = !!walletAddress;

  // Shorten wallet address for display
  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return addr.slice(0, 4) + '...' + addr.slice(-3);
  };

  const colors = {
    background: isDark ? '#0f172a' : '#fff',
    text: isDark ? '#fff' : '#0f172a',
    surface: isDark ? '#1e293b' : '#fff',
    border: isDark ? '#1e293b' : '#f1f5f9',
    primary: '#10b981',
  };

  const t = {
    selectLanguage: language === 'tr' ? 'Dil Seçin' : 
                    language === 'de' ? 'Sprache wählen' :
                    language === 'fr' ? 'Choisir la langue' :
                    language === 'ar' ? 'اختر اللغة' :
                    language === 'ru' ? 'Выберите язык' : 'Select Language',
    connectWallet: language === 'tr' ? 'Bağla' :
                   language === 'de' ? 'Verbinden' :
                   language === 'fr' ? 'Connecter' :
                   language === 'ar' ? 'ربط' :
                   language === 'ru' ? 'Подключить' : 'Connect',
  };

  const handleWalletPress = () => {
    if (onWalletPress) {
      onWalletPress();
    } else {
      // Navigate to wallet onboarding or wallet info
      if (isWalletConnected) {
        router.push('/wallet-info' as any);
      } else {
        router.push('/wallet-onboarding' as any);
      }
    }
  };

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      router.push('/notifications' as any);
    }
  };

  const handleSupportPress = () => {
    if (onSupportPress) {
      onSupportPress();
    } else {
      router.push('/support' as any);
    }
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Top Nav */}
      <View style={[
        styles.topNavContainer, 
        { 
          backgroundColor: colors.background,
          paddingTop: insets.top,
        }
      ]}>
        <View style={[styles.topNav, { borderBottomColor: colors.border }]}>
          {/* Hamburger - Opens DrawerMenu */}
          <TouchableOpacity style={styles.iconButton} onPress={openDrawer} activeOpacity={0.7}>
            <Ionicons name="menu" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Right Icons */}
          <View style={styles.rightIcons}>
            {/* Wallet Connect Button */}
            <TouchableOpacity 
              style={[
                styles.walletButton, 
                { 
                  backgroundColor: isWalletConnected ? '#10b98120' : (isDark ? '#1e293b' : '#f1f5f9'),
                  borderColor: isWalletConnected ? '#10b981' : 'transparent',
                  borderWidth: isWalletConnected ? 1 : 0,
                }
              ]} 
              onPress={handleWalletPress} 
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isWalletConnected ? 'wallet' : 'wallet-outline'} 
                size={14} 
                color={isWalletConnected ? '#10b981' : colors.text} 
              />
              <Text style={[
                styles.walletButtonText, 
                { color: isWalletConnected ? '#10b981' : colors.text }
              ]}>
                {isWalletConnected ? shortenAddress(walletAddress) : t.connectWallet}
              </Text>
              {isWalletConnected && (
                <View style={styles.connectedDot} />
              )}
            </TouchableOpacity>

            {/* Support */}
            <TouchableOpacity style={styles.iconButton} onPress={handleSupportPress} activeOpacity={0.7}>
              <Ionicons name="headset-outline" size={18} color={colors.text} />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={18} color={colors.text} />
              {notificationCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Language */}
            <TouchableOpacity style={styles.iconButton} onPress={() => setLangModalOpen(true)} activeOpacity={0.7}>
              <Text style={styles.langFlagIcon}>{currentLang.flag}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Language Modal */}
      <Modal visible={langModalOpen} animationType="fade" transparent={true} onRequestClose={() => setLangModalOpen(false)}>
        <Pressable style={styles.langModalOverlay} onPress={() => setLangModalOpen(false)}>
          <Pressable style={[styles.langModal, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.langModalTitle, { color: colors.text }]}>{t.selectLanguage}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.langOption, 
                  language === lang.code && styles.langOptionActive, 
                  { borderBottomColor: colors.border }
                ]} 
                onPress={() => { setLanguage(lang.code); setLangModalOpen(false); }}
              >
                <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                <Text style={[styles.langOptionName, { color: colors.text }]}>{lang.name}</Text>
                {language === lang.code && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topNavContainer: {
    width: '100%',
  },
  topNav: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderBottomWidth: 1,
  },
  iconButton: { 
    padding: 4, 
    position: 'relative' 
  },
  rightIcons: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  walletButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  connectedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
    marginLeft: 1,
  },
  langFlagIcon: { 
    fontSize: 18 
  },
  notifBadge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: '#ef4444', 
    borderRadius: 6, 
    minWidth: 12, 
    height: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notifBadgeText: { 
    color: '#fff', 
    fontSize: 7, 
    fontWeight: 'bold' 
  },
  // Language Modal
  langModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  langModal: { 
    width: '85%', 
    maxWidth: 300, 
    borderRadius: 16, 
    padding: 16 
  },
  langModalTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  langOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  langOptionActive: { 
    backgroundColor: '#10b98110', 
    marginHorizontal: -10, 
    paddingHorizontal: 10, 
    borderRadius: 8 
  },
  langOptionFlag: { 
    fontSize: 20 
  },
  langOptionName: { 
    fontSize: 13, 
    flex: 1 
  },
});
