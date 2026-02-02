// app/(tabs)/_layout.tsx
// Tab Navigator with DrawerMenu Integration

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import DrawerMenu from '@/components/DrawerMenu';

// ============================================
// DRAWER CONTEXT
// ============================================
interface DrawerContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType>({
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export const useDrawer = () => useContext(DrawerContext);

// ============================================
// TAB LAYOUT
// ============================================
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useStore();
  const { t } = useTranslation('tabs');
  const insets = useSafeAreaInsets();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

  // Tab bar yüksekliği hesapla
  const tabBarHeight = 56 + insets.bottom;

  return (
    <DrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#f59e0b',
          tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
          tabBarStyle: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.home,
            tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="trade"
          options={{
            title: t.trade,
            tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="convert"
          options={{
            title: t.convert,
            tabBarIcon: ({ color }) => <Ionicons name="swap-horizontal" size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="stake"
          options={{
            title: t.stake,
            tabBarIcon: ({ color }) => <Ionicons name="layers" size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="trust"
          options={{
            title: t.trust,
            tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="assets"
          options={{
            title: t.assets,
            tabBarIcon: ({ color }) => <Ionicons name="wallet" size={22} color={color} />,
          }}
        />
      </Tabs>

      {/* DRAWER MENU */}
      <DrawerMenu visible={isDrawerOpen} onClose={closeDrawer} />
    </DrawerContext.Provider>
  );
}
