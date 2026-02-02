// components/HomeHeader.tsx
// Home page header with hamburger menu, language, contact, notifications
// Opens DrawerMenu when hamburger is pressed

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

interface HomeHeaderProps {
  title?: string;
}

export default function HomeHeader({ title = 'Auxite' }: HomeHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, language, setLanguage } = useStore();
  const { openDrawer } = useDrawer();
  const [showLangModal, setShowLangModal] = useState(false);

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    surface: isDark ? '#1e293b' : '#ffffff',
    primary: '#10b981',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  const t = {
    selectLanguage: language === 'tr' ? 'Dil Seçin' : 'Select Language',
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
        {/* Left - Hamburger Menu */}
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.surface }]} 
          onPress={openDrawer}
        >
          <Ionicons name="menu" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          {/* Language */}
          <TouchableOpacity 
            style={styles.iconButtonSmall} 
            onPress={() => setShowLangModal(true)}
          >
            <Text style={styles.flagEmoji}>{currentLang.flag}</Text>
          </TouchableOpacity>

          {/* Contact / Support */}
          <TouchableOpacity 
            style={styles.iconButtonSmall} 
            onPress={() => router.push('/support' as any)}
          >
            <Ionicons name="headset-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconButtonSmall}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Modal */}
      <Modal visible={showLangModal} animationType="fade" transparent onRequestClose={() => setShowLangModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.selectLanguage}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.langOption, 
                  language === lang.code && { backgroundColor: colors.primary + '15' },
                  { borderBottomColor: colors.border }
                ]} 
                onPress={() => { setLanguage(lang.code); setShowLangModal(false); }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langName, { color: colors.text }]}>{lang.name}</Text>
                {language === lang.code && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSmall: {
    padding: 8,
    position: 'relative',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flagEmoji: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  langFlag: {
    fontSize: 24,
  },
  langName: {
    fontSize: 15,
    flex: 1,
  },
});
